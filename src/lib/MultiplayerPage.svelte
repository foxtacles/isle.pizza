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
                body: JSON.stringify({ maxPlayers })
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
            <PanningImage src="images/multi.webp" alt="LEGO Island Multiplayer" duration={30} />
        </div>
        <div class="config-main">
            <h2 class="mp-title">Multiplayer <span class="mp-badge">Experimental</span></h2>

            <div class="mp-description">
                <p>Explore LEGO Island together with other players. You can see each other walking around the island and interact with plants and buildings together. Missions, vehicles, and other game systems are not shared between players.</p>
            </div>

            {#if !hasRoom}
                <div class="mp-section">
                    <p class="mp-section-text">Choose a room size and create a room. Share the link with friends so they can join directly.</p>

                    <div class="mp-slider-field">
                        <label class="form-group-label" for="max-players-slider">Room size ({maxPlayers} {maxPlayers === 1 ? 'player' : 'players'})</label>
                        <input type="range" id="max-players-slider" min="2" max="20" bind:value={maxPlayers}>
                    </div>

                    <!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions a11y_no_static_element_interactions -->
                    <div class="mp-create-action">
                        <div
                            class="mp-create-img-wrap"
                            tabindex="0"
                            onclick={handleCreateRoom}
                            onkeydown={(e) => e.key === 'Enter' && handleCreateRoom()}
                        >
                            <img class="mp-create-img" src="images/congrats.webp" alt="Create Room" />
                        </div>
                        <span class="mp-create-hint">{creating ? 'Creating room...' : 'Click to create a room'}</span>
                    </div>
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
                                    {playerCount}/{roomMaxPlayers} players
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
        display: inline-block;
        font-size: 0.55em;
        font-weight: bold;
        text-transform: uppercase;
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--color-primary);
        color: #000;
        vertical-align: middle;
        margin-left: 4px;
    }

    .mp-description {
        color: var(--color-text-medium);
        font-size: 0.8em;
        line-height: 1.5;
        margin-bottom: 10px;
    }

    .mp-description p {
        margin: 0;
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

    .mp-section-text {
        color: var(--color-text-muted);
        font-size: 0.8em;
        line-height: 1.4;
        margin: 0;
    }

    /* Room creation */
    .mp-slider-field {
        width: 100%;
    }

    .mp-create-action {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .mp-create-img-wrap {
        position: relative;
        width: 160px;
        border-radius: 8px;
        cursor: pointer;
        overflow: hidden;
    }

    .mp-create-img-wrap::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 8px;
        border: 2px solid transparent;
        opacity: 0;
        transition: opacity 0.3s ease;
        background: conic-gradient(
            from var(--mp-border-angle, 0deg),
            var(--color-primary),
            transparent 90deg,
            transparent 270deg,
            var(--color-primary)
        ) border-box;
        -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0) border-box;
        -webkit-mask-composite: xor;
        mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0) border-box;
        mask-composite: exclude;
        pointer-events: none;
    }

    .mp-create-img-wrap:hover::after,
    .mp-create-img-wrap:focus-within::after {
        opacity: 1;
        animation: mp-border-spin 2s linear infinite;
    }

    @keyframes mp-border-spin {
        to { --mp-border-angle: 360deg; }
    }

    @property --mp-border-angle {
        syntax: "<angle>";
        initial-value: 0deg;
        inherits: false;
    }

    .mp-create-img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        display: block;
    }

    .mp-create-hint {
        color: var(--color-text-muted);
        font-size: 0.75em;
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
        color: var(--color-text-muted);
        font-size: 0.75em;
        white-space: nowrap;
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
</style>
