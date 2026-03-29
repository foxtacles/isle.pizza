<script>
    import { onDestroy } from 'svelte';
    import { currentPage, scenePlayerEventId, scenePlayerData, memoryCompletions } from '../stores.js';
    import { AnimationTitles, AnimationObjectIds } from './multiplayer/animationCatalog.js';
    import { ActorDisplayNames } from '../core/savegame/actorConstants.js';
    import { API_URL } from '../core/config.js';
    import { getWdb } from '../core/wdbCache.js';
    import { getSIReader, decodeAnimIndex } from '../core/formats/SIParser.js';
    import { parseComposite } from '../core/formats/SICompositeParser.js';
    import { ScenePlayerRenderer } from '../core/rendering/ScenePlayerRenderer.js';
    import { SceneAudioPlayer } from '../core/sceneAudio.js';
    import { PhonemePlayer } from '../core/rendering/PhonemePlayer.js';
    import BackButton from './BackButton.svelte';
    import ShareLinkButton from './ShareLinkButton.svelte';

    let loading = true;
    let error = null;
    let animIndex = null;
    let participants = [];
    let title = '';

    // Playback state
    let renderer = null;
    let audioPlayer = null;
    let phonemePlayer = null;
    let playing = false;
    let elapsed = 0;
    let duration = 0;
    let muted = false;
    let ready = false;
    let canvasEl;
    let tickRaf = null;
    let loadGeneration = 0; // guard against stale async callbacks

    $: if ($currentPage === 'scene-player') {
        startLoad();
    }

    $: if ($currentPage !== 'scene-player') {
        cleanup();
    }

    onDestroy(cleanup);

    function cleanup() {
        loadGeneration++;
        if (tickRaf) { cancelAnimationFrame(tickRaf); tickRaf = null; }
        phonemePlayer?.dispose();
        audioPlayer?.dispose();
        if (renderer) {
            renderer.animating = false;
            renderer.dispose();
        }
        renderer = null;
        audioPlayer = null;
        phonemePlayer = null;
        playing = false;
        ready = false;
        elapsed = 0;
        duration = 0;
    }

    function startLoad() {
        // Guard: don't load if we have no scene data yet (stores may not be set)
        if (!$scenePlayerEventId && !$scenePlayerData) return;
        loadScene();
    }

    async function loadScene() {
        cleanup();
        const gen = ++loadGeneration;
        loading = true;
        error = null;
        animIndex = null;
        participants = [];
        title = '';

        try {
            // Step 1: Resolve the completion record
            let record = null;

            if ($scenePlayerData) {
                record = $scenePlayerData;
            } else if ($scenePlayerEventId) {
                const local = ($memoryCompletions || []).find(c => c.eventId === $scenePlayerEventId);
                if (local) {
                    record = { animIndex: local.animIndex, participants: local.participants };
                } else {
                    const res = await fetch(`${API_URL}/api/memory/${encodeURIComponent($scenePlayerEventId)}`);
                    if (gen !== loadGeneration) return;
                    if (res.ok) {
                        const data = await res.json();
                        record = { animIndex: data.animIndex, participants: data.participants };
                    }
                }
            }

            if (!record || record.animIndex == null) {
                error = 'Memory not found';
                loading = false;
                return;
            }

            animIndex = record.animIndex;
            participants = record.participants || [];
            title = AnimationTitles[animIndex] || `Animation #${animIndex}`;

            // Step 2: Derive world slot and objectId
            const { worldSlot } = decodeAnimIndex(animIndex);
            const objectId = AnimationObjectIds[animIndex];
            if (objectId == null) {
                error = 'Unknown animation';
                loading = false;
                return;
            }

            // Step 3: Load SI and WDB in parallel
            const [siReader, wdbData] = await Promise.all([
                getSIReader(worldSlot),
                getWdb(),
            ]);
            if (gen !== loadGeneration) return;

            // Step 4: Read the composite object from SI
            const siObject = await siReader.readObjectWithData(objectId);
            if (gen !== loadGeneration) return;
            if (!siObject) {
                error = 'Animation data not found in SI file';
                loading = false;
                return;
            }

            // Step 5: Parse into SceneAnimData
            const sceneData = parseComposite(siObject);
            if (!sceneData) {
                error = 'Failed to parse animation data';
                loading = false;
                return;
            }

            duration = sceneData.duration;

            // Step 6: Show canvas, wait for layout
            loading = false;
            ready = false;

            await new Promise(r => requestAnimationFrame(r));
            await new Promise(r => requestAnimationFrame(r));
            if (gen !== loadGeneration || !canvasEl) return;

            // Step 7: Initialize renderer
            renderer = new ScenePlayerRenderer(canvasEl);
            renderer.loadScene(sceneData, participants, wdbData);

            // Step 8: Initialize audio
            audioPlayer = new SceneAudioPlayer();
            await audioPlayer.init(sceneData.audioTracks);
            if (gen !== loadGeneration) return;

            // Step 9: Initialize phoneme player
            phonemePlayer = new PhonemePlayer();
            phonemePlayer.init(sceneData.phonemeTracks, renderer.actorContainers, renderer.gl);

            ready = true;

            // Step 10: Auto-play
            doPlay();

        } catch (e) {
            console.error('[ScenePlayer] Load failed:', e);
            if (gen === loadGeneration) {
                error = e.message || 'Failed to load scene';
                loading = false;
            }
        }
    }

    function doPlay() {
        if (!renderer) return;
        playing = true;
        elapsed = 0;
        renderer.resetPlayback();
        renderer.play();
        audioPlayer?.resume();
        startTick();
    }

    function togglePlay() {
        if (!renderer) return;

        if (playing) {
            playing = false;
            renderer.pause();
            audioPlayer?.pause();
        } else {
            // If finished, restart from beginning
            if (renderer.finished) {
                renderer.resetPlayback();
                elapsed = 0;
                audioPlayer?.stop();
                phonemePlayer?.stop();
            }
            playing = true;
            renderer.play();
            audioPlayer?.resume();
            startTick();
        }
    }

    function startTick() {
        if (tickRaf) return;
        const tick = () => {
            if (!renderer) { tickRaf = null; return; }

            elapsed = renderer.elapsed;

            if (playing) {
                audioPlayer?.tick(elapsed);
                phonemePlayer?.tick(elapsed);

                if (renderer.finished) {
                    playing = false;
                    phonemePlayer?.stop();
                    audioPlayer?.stop();
                }
            }

            tickRaf = requestAnimationFrame(tick);
        };
        tickRaf = requestAnimationFrame(tick);
    }

    function toggleMute() {
        muted = !muted;
        if (audioPlayer) audioPlayer.muted = muted;
    }

    function formatTime(ms) {
        const s = Math.floor(Math.max(0, ms) / 1000);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    $: shareUrl = $scenePlayerEventId
        ? `${window.location.origin}${window.location.pathname}#memory/${$scenePlayerEventId}`
        : null;
</script>

<div class="page-content">
    <BackButton />
    <div class="page-inner-content scene-player-inner">
    <div class="scene-title-area">
        {#if title}
            <h2 class="scene-title">{title}</h2>
        {/if}
        {#if participants.length > 0}
            <div class="scene-participants">
                {#each participants as p, idx}
                    {#if idx > 0}<span class="sep">&middot;</span>{/if}
                    <span class="participant">{p.displayName}
                        <span class="char-name">as {ActorDisplayNames[p.charIndex] || `#${p.charIndex}`}</span>
                    </span>
                {/each}
            </div>
        {/if}
    </div>

    <div class="scene-canvas-area">
        {#if loading}
            <div class="scene-loading">
                <div class="spinner"></div>
            </div>
        {:else if error}
            <div class="scene-error">
                <p>{error}</p>
                <a href="#memories">Back to Memories</a>
            </div>
        {:else if $currentPage === 'scene-player'}
            <canvas bind:this={canvasEl} class="scene-canvas"></canvas>
        {/if}
    </div>

    {#if ready}
        <div class="scene-controls">
            <button class="ctrl-btn" onclick={togglePlay} title={playing ? 'Pause' : 'Play'}>
                {#if playing}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                {/if}
            </button>

            <div class="progress-bar">
                <div class="progress-fill" style="width: {duration > 0 ? Math.min(elapsed / duration * 100, 100) : 0}%"></div>
            </div>

            <span class="time-display">{formatTime(elapsed)} / {formatTime(duration)}</span>

            <button class="ctrl-btn" onclick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
                {#if muted}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                {/if}
            </button>

            {#if shareUrl}
                <span class="controls-spacer"></span>
                <ShareLinkButton url={shareUrl} />
            {/if}
        </div>
    {/if}
    </div>
</div>

<style>
    .scene-player-inner {
        text-align: left;
    }

    .scene-title-area {
        margin-bottom: 1rem;
    }

    .scene-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        color: #e0e0e0;
        line-height: 1.3;
    }

    .scene-participants {
        font-size: 0.8rem;
        color: #999;
        margin-top: 0.25rem;
    }

    .scene-participants .sep {
        margin: 0 0.3em;
    }

    .scene-participants .char-name {
        color: #777;
        font-style: italic;
    }

    .scene-canvas-area {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        background: #111;
        border-radius: 8px;
        overflow: hidden;
    }

    .scene-canvas {
        width: 100%;
        height: 100%;
        display: block;
    }


    .scene-loading, .scene-error {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #999;
        gap: 1rem;
        z-index: 1;
    }

    .scene-error a {
        color: #6af;
        text-decoration: none;
    }
    .scene-error a:hover {
        text-decoration: underline;
    }

    .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #333;
        border-top-color: #888;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .scene-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding: 0.5rem 0.75rem;
        background: #1a1a1a;
        border-radius: 8px;
    }

    .ctrl-btn {
        background: none;
        border: none;
        color: #ccc;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.15s;
    }

    .ctrl-btn:hover {
        background: #333;
        color: #fff;
    }

    .progress-bar {
        flex: 1;
        height: 6px;
        background: #333;
        border-radius: 3px;
        overflow: hidden;
        cursor: default;
    }

    .progress-fill {
        height: 100%;
        background: #6af;
        border-radius: 3px;
        transition: width 0.1s linear;
    }

    .time-display {
        font-size: 0.75rem;
        color: #888;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        min-width: 5em;
        text-align: center;
    }

    .controls-spacer {
        flex: 0 0 1px;
        height: 16px;
        background: #333;
        margin: 0 0.25rem;
    }
</style>
