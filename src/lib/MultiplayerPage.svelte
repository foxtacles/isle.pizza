<script>
    import { onDestroy } from 'svelte';
    import BackButton from './BackButton.svelte';
    import PanningImage from './PanningImage.svelte';
    import ActorPicker from './ActorPicker.svelte';
    import { multiplayerRoom, currentPage, gameRunning } from '../stores.js';
    import { navigateToRoom } from '../core/navigation.js';
    import { generateRoomName } from '../core/room-names.js';
    import { launchGame } from '../core/emscripten.js';
    import { saveConfigFromDOM } from '../core/opfs.js';
    import { showToast } from '../core/toast.js';
    import { ActorInfoInit } from '../core/savegame/actorConstants.js';

    const RELAY_URL = __RELAY_URL__;
    const RELAY_HTTP = RELAY_URL.replace('wss://', 'https://').replace('ws://', 'http://');

    let maxPlayers = 5;
    let maxActors = 5;
    let creating = false;
    let selectedActorIndex = Number(sessionStorage.getItem('mp-actor')) || 0;

    // Room lobby state
    let playerCount = 0;
    let roomMaxPlayers = 0;
    let roomFull = false;
    let previewLoading = false;
    let previewError = null;
    let pollInterval = null;

    let fetching = false;
    let lastPolledRoom = null;

    const EXIT_ROOM_FULL = 10;

    // Check if we were reloaded after a room-full exit
    {
        const exitCode = sessionStorage.getItem('exit-code');
        if (exitCode) {
            sessionStorage.removeItem('exit-code');
            if (Number(exitCode) === EXIT_ROOM_FULL) {
                // Defer so toast renders after mount
                setTimeout(() => showToast('Room is full', { error: true, duration: 3000 }), 0);
            }
        }
    }

    $: roomName = $multiplayerRoom;
    $: hasRoom = roomName !== null && roomName !== '';

    // Poll room preview when room is active
    $: {
        const shouldPoll = hasRoom && $currentPage === 'multiplayer' && !$gameRunning;
        const roomChanged = roomName !== lastPolledRoom;

        if (shouldPoll && (roomChanged || !pollInterval)) {
            lastPolledRoom = roomName;
            startPolling();
        } else if (!shouldPoll) {
            lastPolledRoom = null;
            stopPolling();
        }
    }

    function startPolling() {
        stopPolling();
        fetchPreview();
        pollInterval = setInterval(fetchPreview, 5000);
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    async function fetchPreview() {
        if (!roomName || fetching) return;
        fetching = true;
        previewLoading = playerCount === 0 && roomMaxPlayers === 0;
        previewError = null;

        try {
            const res = await fetch(`${RELAY_HTTP}/room/${roomName}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            playerCount = data.players;
            roomMaxPlayers = data.maxPlayers;
            roomFull = playerCount >= roomMaxPlayers;
        } catch (e) {
            previewError = 'Could not reach relay server';
        } finally {
            previewLoading = false;
            fetching = false;
        }
    }

    async function handleCreateRoom() {
        creating = true;
        const name = generateRoomName();

        try {
            await fetch(`${RELAY_HTTP}/room/${name}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ maxPlayers, maxActors })
            });

            navigateToRoom(name);
        } catch (e) {
            previewError = 'Could not reach relay server';
        } finally {
            creating = false;
        }
    }

    async function handleRunGame() {
        if (!roomName) return;
        const actorName = ActorInfoInit[selectedActorIndex].name;
        await saveConfigFromDOM({ room: roomName, relayUrl: RELAY_URL, actor: actorName });
        launchGame();
    }

    async function handleCopyLink() {
        const url = `${window.location.origin}${window.location.pathname}#r/${roomName}`;
        try {
            await navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard');
        } catch {
            showToast('Could not copy link');
        }
    }

    onDestroy(() => {
        stopPolling();
    });
</script>

<div id="multiplayer-page" class="page-content">
    <BackButton />
    <div class="page-inner-content config-layout">
        <div class="config-art-panel">
            <PanningImage src="images/multi.webp" alt="LEGO Island Multiplayer" duration={45} />
        </div>
        <div class="config-main">
            <h2 class="mp-title">Multiplayer
                <span class="mp-badge">
                    <svg class="mp-badge-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 3L12 14L15 3"/><path d="M6 3H18"/><path d="M5 21H19L17 8H7L5 21Z"/>
                    </svg>
                    Experimental
                </span>
            </h2>

            <p class="mp-description">Explore LEGO Island together with other players. Create a room and share the link to get started.</p>

            {#if !hasRoom}
                <div class="mp-section">
                    <div class="mp-slider-row">
                        <div class="mp-slider-field">
                            <label class="form-group-label" for="max-players-slider">
                                Room size ({maxPlayers})
                                <span class="tooltip-trigger">?
                                    <span class="tooltip-content">Maximum number of players that can join this room at the same time.</span>
                                </span>
                            </label>
                            <input type="range" id="max-players-slider" min="2" max="20" bind:value={maxPlayers}>
                        </div>

                        <div class="mp-slider-field">
                            <label class="form-group-label" for="max-actors-slider">
                                Maximum NPCs ({maxActors})
                                <span class="tooltip-trigger">?
                                    <span class="tooltip-content">Maximum number of LEGO actors to exist in the world at a time. The game will gradually increase the number of actors until this maximum is reached and while performance is acceptable.</span>
                                </span>
                            </label>
                            <input type="range" id="max-actors-slider" min="5" max="40" bind:value={maxActors}>
                        </div>
                    </div>

                    <button class="preset-btn mp-create-btn" onclick={handleCreateRoom} disabled={creating}>
                        {#if creating}
                            Creating...
                        {:else}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Create Room
                        {/if}
                    </button>
                </div>

                <div class="mp-features">
                    <div class="mp-feature-grid">
                        <div class="mp-feature">
                            <div class="mp-feature-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                                </svg>
                            </div>
                            <div class="mp-feature-text">
                                <strong>Third-person camera</strong>
                                <span>Toggle a camera behind your character to see yourself walking, riding vehicles, and performing emotes.</span>
                            </div>
                        </div>
                        <div class="mp-feature">
                            <div class="mp-feature-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                            </div>
                            <div class="mp-feature-text">
                                <strong>Click on each other</strong>
                                <span>Click other players to cycle their colors, hats, moods, and sounds — just like clicking characters in the original game.</span>
                            </div>
                        </div>
                        <div class="mp-feature">
                            <div class="mp-feature-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                            </div>
                            <div class="mp-feature-text">
                                <strong>Emotes and animations</strong>
                                <span>Wave, tip your hat, and pick from several walk and idle animations to express yourself.</span>
                            </div>
                        </div>
                        <div class="mp-feature">
                            <div class="mp-feature-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                </svg>
                            </div>
                            <div class="mp-feature-text">
                                <strong>Shared world*</strong>
                                <span>Plants, buildings, and their states are synchronized — everyone sees the same island.</span>
                            </div>
                        </div>
                    </div>
                    <p class="mp-footer-note">*Missions, vehicles, and other game systems are not shared between players.</p>
                </div>
            {:else}
                <div class="mp-section">
                    <div class="mp-room-bar">
                        <span class="mp-room-bar-info">
                            <span class="mp-room-name">{roomName}</span>
                            <span class="mp-room-sep">&middot;</span>
                            <span class="mp-room-players">
                                {#if previewLoading}
                                    ...
                                {:else if previewError}
                                    <span class="mp-error">{previewError}</span>
                                {:else}
                                    <span class="mp-player-bar-wrap">
                                        <span class="mp-player-bar" style="width: {roomMaxPlayers > 0 ? (playerCount / roomMaxPlayers * 100) : 0}%"></span>
                                    </span>
                                    <span class="mp-player-count">{playerCount}/{roomMaxPlayers}</span>
                                {/if}
                            </span>
                        </span>
                        <button class="mp-share-btn" onclick={handleCopyLink} title="Copy room link">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            Copy link to invite
                        </button>
                    </div>

                    {#if !$gameRunning}
                        <ActorPicker
                            selectedIndex={selectedActorIndex}
                            onSelect={(idx) => { selectedActorIndex = idx; sessionStorage.setItem('mp-actor', idx); }}
                        />
                    {/if}

                    {#if roomFull}
                        <p class="mp-full-msg">Room is full. Wait for a player to leave or create a new room.</p>
                    {:else}
                        <button class="preset-btn mp-run-btn" onclick={handleRunGame}>Run Game</button>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .mp-title {
        color: var(--color-text-light);
        font-size: 1.05em;
        margin: 0 0 6px 0;
    }

    .mp-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 0.55em;
        font-weight: bold;
        text-transform: uppercase;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--color-primary);
        color: #000;
        vertical-align: middle;
        margin-left: 4px;
    }

    .mp-badge-icon {
        flex-shrink: 0;
    }

    .mp-description {
        color: var(--color-text-medium);
        font-size: 0.8em;
        line-height: 1.5;
        margin: 0 0 10px 0;
    }

    /* Shared section card for create & lobby */
    .mp-section {
        background: var(--gradient-panel);
        border: 1px solid var(--color-bg-panel);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    /* Room creation */
    .mp-slider-row {
        display: flex;
        gap: 12px;
    }

    .mp-slider-field {
        flex: 1;
        min-width: 0;
    }

    .mp-create-btn {
        margin-top: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border-color: var(--color-primary);
        color: var(--color-primary);
    }

    /* Room info bar */
    .mp-room-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        padding: 6px 10px;
    }

    .mp-room-bar-info {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .mp-room-name {
        font-weight: bold;
        font-size: 0.85em;
        color: var(--color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .mp-room-sep {
        color: var(--color-text-muted);
        font-size: 0.75em;
    }

    .mp-share-btn {
        flex-shrink: 0;
        background: none;
        border: 1px solid var(--color-border-medium);
        color: var(--color-text-muted);
        cursor: pointer;
        padding: 3px 8px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: inherit;
        font-size: 0.7em;
        transition: color 0.2s ease, border-color 0.2s ease;
    }

    .mp-share-btn:hover {
        color: var(--color-primary);
        border-color: var(--color-primary);
    }

    .mp-room-players {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.75em;
        white-space: nowrap;
    }

    .mp-player-bar-wrap {
        width: 36px;
        height: 6px;
        border-radius: 3px;
        background: var(--color-border-medium);
        overflow: hidden;
    }

    .mp-player-bar {
        display: block;
        height: 100%;
        border-radius: 3px;
        background: var(--color-primary);
        transition: width 0.3s ease;
    }

    .mp-player-count {
        color: var(--color-text-muted);
    }

    .mp-error {
        color: #ff6b6b;
    }

    .mp-run-btn {
        width: 100%;
    }

    .mp-full-msg {
        color: var(--color-text-muted);
        font-size: 0.75em;
        margin: 0;
        text-align: center;
    }

    /* Features grid */
    .mp-features {
        margin-top: 14px;
    }

    .mp-feature-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .mp-feature {
        display: flex;
        gap: 8px;
        padding: 10px;
        background: var(--gradient-panel);
        border: 1px solid var(--color-bg-panel);
        border-radius: 6px;
    }

    .mp-feature-icon {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background: rgba(255, 215, 0, 0.1);
        color: var(--color-primary);
    }

    .mp-feature-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .mp-feature-text strong {
        color: var(--color-text-light);
        font-size: 0.75em;
    }

    .mp-feature-text span {
        color: var(--color-text-muted);
        font-size: 0.7em;
        line-height: 1.4;
    }

    .mp-footer-note {
        color: var(--color-text-muted);
        font-size: 0.7em;
        text-align: center;
        margin: 10px 0 0 0;
        opacity: 0.7;
    }

    @media (max-width: 600px) {
        .mp-feature-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
