<script>
    import { onDestroy } from 'svelte';
    import { gameRunning, multiplayerRoom, multiplayerPlayerCount } from '../stores.js';
    import { keepVisible } from '../core/keep-visible.js';

    let sheetOpen = false;
    let activeTab = 'walk';
    let selectedWalk = 0;
    let selectedIdle = 0;
    let activeEmote = -1;
    let thirdPersonCam = true;
    let showNameBubbles = true;
    let allowCustomize = true;
    let badgeBump = false;
    let pinned = false;
    let shareFeedback = '';
    let linkCopiedTimer = null;
    let badgeBumpTimer = null;
    let emoteTimer = null;
    let prevPlayerCount = null;

    onDestroy(() => {
        clearTimeout(linkCopiedTimer);
        clearTimeout(badgeBumpTimer);
        clearTimeout(emoteTimer);
    });

    // Close sheet when leaving Isle world
    $: if ($multiplayerPlayerCount == null) {
        sheetOpen = false;
    }

    $: disabled = $multiplayerPlayerCount == null;

    // Badge pulse when player count changes
    $: {
        if (prevPlayerCount !== null && $multiplayerPlayerCount !== null && $multiplayerPlayerCount !== prevPlayerCount) {
            badgeBump = true;
            clearTimeout(badgeBumpTimer);
            badgeBumpTimer = setTimeout(() => { badgeBump = false; }, 400);
        }
        prevPlayerCount = $multiplayerPlayerCount;
    }

    const walkOptions = [
        { emoji: '\u{1F6B6}', label: 'Normal', id: 0 },
        { emoji: '\u{1F3C3}', label: 'Charging', id: 3 },
        { emoji: '\u{1F57A}', label: 'Joyful', id: 1 },
        { emoji: '\u{1F327}\u{FE0F}', label: 'Gloomy', id: 2 },
        { emoji: '\u{1F648}', label: 'Scared', id: 4 },
        { emoji: '\u{26A1}', label: 'Hyper', id: 5 }
    ];

    const idleOptions = [
        { emoji: '\u{1F343}', label: 'Sway' },
        { emoji: '\u{1FAA9}', label: 'Groove' },
        { emoji: '\u{1F64C}', label: 'Excited' }
    ];

    const emoteOptions = [
        { emoji: '\u{1F44B}', label: 'Wave' },
        { emoji: '\u{1F3A9}', label: 'Hat Tip' },
        { emoji: '\u{1F9E9}', label: 'Transform', twoPhase: true }
    ];

    const settingsItems = [
        {
            icon: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
            label: 'Third-person camera',
            key: 'thirdPersonCam',
            toggle: () => { thirdPersonCam = !thirdPersonCam; window.Module?._mp_toggle_third_person(); },
        },
        {
            icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
            label: 'Name bubbles',
            key: 'showNameBubbles',
            toggle: () => { showNameBubbles = !showNameBubbles; window.Module?._mp_toggle_name_bubbles(); },
        },
        {
            icon: '<path d="M3 21l10-10"/><path d="M13 11l2.5-2.5a1.5 1.5 0 0 1 2 0l.5.5a1.5 1.5 0 0 1 0 2L15.5 13.5"/><path d="M7 3l.5 1.5L9 5l-1.5.5L7 7l-.5-1.5L5 5l1.5-.5z" fill="currentColor" stroke="none"/><path d="M17 2l.4 1.1L18.5 3.5l-1.1.4L17 5l-.4-1.1L15.5 3.5l1.1-.4z" fill="currentColor" stroke="none"/><path d="M21 8l.4 1.1L22.5 9.5l-1.1.4L21 11l-.4-1.1L19.5 9.5l1.1-.4z" fill="currentColor" stroke="none"/>',
            label: 'Allow customization',
            key: 'allowCustomize',
            toggle: () => { allowCustomize = !allowCustomize; window.Module?._mp_toggle_allow_customize(); },
        },
    ];

    const shareIcon = '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>';

    const tabs = [
        { id: 'walk', emoji: '\u{1F6B6}', label: 'Walk' },
        { id: 'idle', emoji: '\u{1F343}', label: 'Idle' },
        { id: 'emotes', emoji: '\u{1F604}', label: 'Emotes' },
        { id: 'settings', emoji: '\u{2699}\u{FE0F}', label: 'Settings' },
    ];
    $: settingsState = { thirdPersonCam, showNameBubbles, allowCustomize };

    function refocusCanvas() {
        document.getElementById('canvas')?.focus();
    }

    function toggleSheet() {
        if (disabled) return;
        sheetOpen = !sheetOpen;
        if (!sheetOpen) refocusCanvas();
    }

    function closeSheet() {
        sheetOpen = false;
        refocusCanvas();
    }

    function selectWalk(index) {
        selectedWalk = index;
        if (window.Module?._mp_set_walk_animation) {
            window.Module._mp_set_walk_animation(walkOptions[index].id);
        }
    }

    function selectIdle(index) {
        selectedIdle = index;
        if (window.Module?._mp_set_idle_animation) {
            window.Module._mp_set_idle_animation(index);
        }
    }

    function triggerEmote(index) {
        if (window.Module?._mp_trigger_emote) {
            window.Module._mp_trigger_emote(index);
        }
        activeEmote = index;
        clearTimeout(emoteTimer);
        emoteTimer = setTimeout(() => { activeEmote = -1; }, 300);
    }

    function showShareFeedback(msg) {
        shareFeedback = msg;
        clearTimeout(linkCopiedTimer);
        linkCopiedTimer = setTimeout(() => { shareFeedback = ''; }, 2000);
    }

    async function handleShare() {
        const url = `${window.location.origin}${window.location.pathname}#r/${$multiplayerRoom}`;
        if (navigator.share && matchMedia('(pointer: coarse)').matches) {
            try {
                await navigator.share({ text: "Let's play LEGO Island together!", url });
                showShareFeedback('Shared!');
            } catch { /* user cancelled */ }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                showShareFeedback('Link copied!');
            } catch { /* ignore */ }
        }
    }

    function handleWindowKeydown(e) {
        if (sheetOpen && !pinned && e.key === 'Escape') closeSheet();
    }

    function handleWindowClick(e) {
        if (sheetOpen && !pinned && !e.target.closest('.mp-sheet') && !e.target.closest('.mp-fab')) {
            closeSheet();
        }
    }

    // Swipe-to-dismiss
    let touchStartY = 0;
    let touchDeltaY = 0;
    let swiping = false;

    function handleSheetTouchStart(e) {
        const touch = e.touches[0];
        touchStartY = touch.clientY;
        touchDeltaY = 0;
        swiping = true;
    }

    function handleSheetTouchMove(e) {
        if (!swiping) return;
        const touch = e.touches[0];
        touchDeltaY = Math.max(0, touch.clientY - touchStartY);
    }

    function handleSheetTouchEnd() {
        if (touchDeltaY > 60 && !pinned) {
            closeSheet();
        }
        touchDeltaY = 0;
        swiping = false;
    }
</script>

<svelte:window onkeydown={handleWindowKeydown} onclick={handleWindowClick} />

{#if $gameRunning && $multiplayerRoom}
    <!-- FAB (bottom-right) -->
    <button class="mp-fab" class:active={sheetOpen} class:disabled use:keepVisible
        onclick={toggleSheet}
        title={disabled ? 'Multiplayer (enter Isle world to use)' : 'Multiplayer'}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        {#if $multiplayerPlayerCount != null}
            <span class="mp-badge" class:bump={badgeBump}>{$multiplayerPlayerCount}</span>
        {/if}
    </button>

    <!-- Bottom sheet -->
    {#if sheetOpen}
        <div class="mp-sheet"
            style={touchDeltaY > 0 ? `transform: translateY(${touchDeltaY}px)` : ''}
        >
            <!-- Drag handle -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="mp-sheet-handle"
                ontouchstart={handleSheetTouchStart}
                ontouchmove={handleSheetTouchMove}
                ontouchend={handleSheetTouchEnd}
            ><div class="mp-sheet-handle-bar"></div></div>

            <!-- Tab bar -->
            <div class="mp-tabs" role="tablist">
                {#each tabs as tab}
                    <button class="mp-tab" class:active={activeTab === tab.id}
                        role="tab" aria-selected={activeTab === tab.id}
                        onclick={() => activeTab = tab.id}>
                        <span class="mp-tab-emoji">{tab.emoji}</span>
                        {tab.label}
                    </button>
                {/each}
                <button class="mp-pin" class:pinned={pinned} onclick={() => pinned = !pinned}
                    title={pinned ? 'Unpin menu' : 'Pin menu open'}>&#x1F4CC;</button>
                {#if $multiplayerPlayerCount != null}
                    <span class="mp-tab-player-count">{$multiplayerPlayerCount} player{$multiplayerPlayerCount === 1 ? '' : 's'}</span>
                {/if}
            </div>

            <!-- Tab content -->
            <div class="mp-sheet-content">
                {#if activeTab === 'walk' || activeTab === 'idle' || activeTab === 'emotes'}
                    {@const options = activeTab === 'walk' ? walkOptions : activeTab === 'idle' ? idleOptions : emoteOptions}
                    {@const selected = activeTab === 'walk' ? selectedWalk : activeTab === 'idle' ? selectedIdle : -1}
                    {@const onSelect = activeTab === 'walk' ? selectWalk : activeTab === 'idle' ? selectIdle : triggerEmote}
                    {@const isEmote = activeTab === 'emotes'}
                    <div class="mp-grid">
                        {#each options as opt, i}
                            <button class="mp-grid-btn"
                                class:selected={selected === i}
                                class:mp-emote-btn={isEmote}
                                class:emote-active={isEmote && activeEmote === i}
                                onclick={() => onSelect(i)}>
                                <span class="mp-grid-emoji">{opt.emoji}</span>
                                <span class="mp-grid-label">{opt.label}</span>
                                {#if opt.twoPhase}<span class="mp-two-phase">2&times;</span>{/if}
                            </button>
                        {/each}
                    </div>
                {:else if activeTab === 'settings'}
                    <div class="mp-settings">
                        {#each settingsItems as item}
                            <button class="mp-setting-row" onclick={item.toggle}>
                                <svg class="mp-setting-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    {@html item.icon}
                                </svg>
                                <span class="mp-setting-label">{item.label}</span>
                                <span class="mp-toggle-switch" class:on={settingsState[item.key]}>
                                    <span class="mp-toggle-knob"></span>
                                </span>
                            </button>
                        {/each}
                        <div class="mp-setting-divider"></div>
                        <button class="mp-share-btn" class:copied={shareFeedback} onclick={handleShare}>
                            {#if shareFeedback}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                {shareFeedback}
                            {:else}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    {@html shareIcon}
                                </svg>
                                Share
                            {/if}
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
{/if}

<style>
    /* --- FAB (Floating Action Button) --- */
    .mp-fab {
        position: fixed;
        bottom: 16px;
        right: 16px;
        z-index: 1000;
        width: 48px;
        height: 48px;
        box-sizing: border-box;
        border-radius: 50%;
        background: rgba(24, 24, 24, 0.85);
        border: 2px solid rgba(255, 215, 0, 0.5);
        color: var(--color-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease, border-color 0.2s ease;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        font-family: Arial, sans-serif;
    }

    .mp-fab:hover, .mp-fab.active {
        background: rgba(255, 215, 0, 0.12);
        border-color: var(--color-primary);
    }

    .mp-fab.disabled {
        border-color: rgba(255, 255, 255, 0.15);
        color: var(--color-text-muted);
        opacity: 0.5;
        cursor: default;
    }

    .mp-fab.disabled:hover {
        background: rgba(24, 24, 24, 0.85);
        border-color: rgba(255, 255, 255, 0.15);
    }

    /* --- Badge --- */
    .mp-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        background: var(--color-primary);
        color: #000;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        line-height: 1;
        pointer-events: none;
    }

    .mp-badge.bump {
        animation: mp-badge-bump 0.4s ease;
    }

    @keyframes mp-badge-bump {
        0% { transform: scale(1); }
        40% { transform: scale(1.3); }
        100% { transform: scale(1); }
    }

    /* --- No focus outlines on any interactive element --- */
    .mp-sheet button, .mp-fab {
        outline: none;
    }

    /* --- Bottom Sheet --- */
    .mp-sheet {
        position: fixed;
        bottom: -1px;
        left: 0;
        right: 0;
        padding-bottom: 1px;
        z-index: 1002;
        background: rgba(24, 24, 24, 0.98);
        border-top: 1px solid var(--color-border-medium);
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        animation: mp-sheet-in 0.2s ease-out;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        display: flex;
        flex-direction: column;
    }

    @keyframes mp-sheet-in {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
    }

    /* --- Drag handle --- */
    .mp-sheet-handle {
        display: flex;
        justify-content: center;
        padding: 10px 0 6px 0;
        cursor: grab;
    }

    .mp-sheet-handle-bar {
        width: 36px;
        height: 4px;
        border-radius: 2px;
        background: var(--color-border-light);
        opacity: 0.5;
    }

    /* --- Pin button --- */
    .mp-pin {
        flex-shrink: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        font-size: 12px;
        line-height: 1;
        opacity: 0.4;
        transition: opacity 0.15s ease;
    }

    .mp-pin:hover {
        opacity: 0.7;
    }

    .mp-pin.pinned {
        opacity: 1;
    }

    /* --- Tab bar --- */
    .mp-tabs {
        display: flex;
        gap: 2px;
        padding: 6px;
    }

    .mp-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        background: none;
        border: none;
        border-radius: 8px;
        color: var(--color-text-muted);
        font-family: inherit;
        font-size: 0.75em;
        font-weight: 600;
        padding: 5px 2px;
        cursor: pointer;
        transition: color 0.15s ease, background 0.15s ease;
        white-space: nowrap;
    }

    .mp-tab:hover {
        color: var(--color-text-light);
        background: rgba(255, 255, 255, 0.05);
    }

    .mp-tab.active {
        color: var(--color-primary);
        background: rgba(255, 215, 0, 0.1);
    }

    .mp-tab-emoji {
        font-size: 13px;
        line-height: 1;
    }

    .mp-tab-player-count {
        display: none;
    }

    /* --- Sheet content --- */
    .mp-sheet-content {
        padding: 10px;
        overflow-y: auto;
        height: 200px;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
    }

    /* --- Option grid --- */
    .mp-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
    }

    .mp-grid-btn {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 10px 4px;
        height: 56px;
        min-width: 0;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.04);
        border: 1.5px solid transparent;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
        box-sizing: border-box;
    }

    .mp-grid-btn:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    .mp-grid-btn:active {
        transform: scale(0.96);
    }

    .mp-grid-btn.selected {
        background: rgba(255, 215, 0, 0.12);
        border-color: var(--color-primary);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.1);
    }

    .mp-grid-emoji {
        font-size: 22px;
        line-height: 1;
    }

    .mp-grid-label {
        font-size: 0.7em;
        color: var(--color-text-muted);
        font-family: inherit;
        line-height: 1;
    }

    .mp-grid-btn.selected .mp-grid-label {
        color: var(--color-primary);
    }

    .mp-two-phase {
        position: absolute;
        top: 3px;
        right: 3px;
        font-size: 8px;
        font-weight: 700;
        color: var(--color-text-muted);
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 1px 3px;
        line-height: 1;
    }

    /* --- Emote buttons --- */
    .mp-emote-btn:active, .mp-emote-btn.emote-active {
        background: rgba(255, 215, 0, 0.25);
        border-color: var(--color-primary);
        transform: scale(0.92);
    }

    .mp-emote-btn.emote-active .mp-grid-emoji {
        animation: mp-emote-bounce 0.3s ease;
    }

    @keyframes mp-emote-bounce {
        0% { transform: scale(1); }
        30% { transform: scale(0.85); }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); }
    }

    /* --- Settings tab --- */
    .mp-settings {
        display: flex;
        flex-direction: column;
        gap: 2px;
        height: 100%;
    }

    .mp-setting-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s ease;
        width: 100%;
        box-sizing: border-box;
        font-family: inherit;
        text-align: left;
    }

    .mp-setting-row:hover {
        background: rgba(255, 255, 255, 0.07);
    }

    .mp-setting-row:active {
        background: rgba(255, 255, 255, 0.1);
    }

    .mp-setting-icon {
        flex-shrink: 0;
        color: var(--color-text-muted);
    }

    .mp-setting-label {
        flex: 1;
        color: var(--color-text-light);
        font-size: 0.8em;
    }

    .mp-setting-divider {
        flex: 1;
        min-height: 4px;
    }

    .mp-share-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 8px;
        background: rgba(255, 215, 0, 0.08);
        color: var(--color-primary);
        font-family: inherit;
        font-size: 0.8em;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        box-sizing: border-box;
    }

    .mp-share-btn:hover {
        background: rgba(255, 215, 0, 0.15);
        border-color: rgba(255, 215, 0, 0.5);
    }

    .mp-share-btn:active {
        transform: scale(0.98);
    }

    .mp-share-btn.copied {
        background: rgba(74, 222, 128, 0.12);
        border-color: rgba(74, 222, 128, 0.4);
        color: #4ade80;
    }

    /* --- Toggle switch --- */
    .mp-toggle-switch {
        position: relative;
        width: 44px;
        height: 24px;
        border-radius: 24px;
        background: var(--color-border-dark);
        transition: background-color 0.2s ease;
        flex-shrink: 0;
    }

    .mp-toggle-switch.on {
        background-color: #3a5f3a;
    }

    .mp-toggle-knob {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--color-text-muted);
        transition: all 0.2s ease;
    }

    .mp-toggle-switch.on .mp-toggle-knob {
        left: 23px;
        background: var(--color-primary);
    }

    /* --- Desktop: floating panel instead of full-width sheet --- */
    @media (min-width: 641px) {
        .mp-sheet {
            left: auto;
            right: 16px;
            bottom: 76px;
            width: 240px;
            border-radius: 12px;
            border: 1px solid var(--color-border-medium);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        .mp-sheet-handle {
            display: none;
        }

        .mp-tab-emoji {
            display: none;
        }

        .mp-tab {
            flex: 0 1 auto;
            font-size: 0.7em;
            padding: 5px 6px;
        }

        .mp-tabs {
            justify-content: space-evenly;
        }

        .mp-sheet-content {
            height: 160px;
            padding: 8px;
        }

        .mp-grid {
            gap: 4px;
        }

        .mp-grid-btn {
            height: 48px;
            padding: 6px 4px;
        }

        .mp-grid-emoji {
            font-size: 18px;
        }

        .mp-setting-row {
            padding: 6px 8px;
            gap: 8px;
        }

        .mp-setting-label {
            font-size: 0.75em;
        }

        .mp-toggle-switch {
            width: 36px;
            height: 20px;
        }

        .mp-toggle-knob {
            width: 14px;
            height: 14px;
        }

        .mp-toggle-switch.on .mp-toggle-knob {
            left: 19px;
        }
    }

    /* --- Mobile: larger FAB, ensure touch targets --- */
    @media (max-width: 640px) {
        .mp-fab {
            width: 52px;
            height: 52px;
        }

        .mp-grid-btn {
            height: 60px;
            padding: 12px 4px;
        }

        .mp-grid-emoji {
            font-size: 24px;
        }

        .mp-setting-row {
            padding: 12px 10px;
        }

        .mp-tab-player-count {
            display: block;
            position: absolute;
            top: -14px;
            right: 10px;
            font-size: 9px;
            font-weight: 600;
            color: var(--color-text-muted);
        }
    }
</style>
