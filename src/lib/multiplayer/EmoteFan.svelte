<script>
    import HotbarPopover from './HotbarPopover.svelte';
    import StyleGrid from './StyleGrid.svelte';
    import SettingsPanel from './SettingsPanel.svelte';
    import AnimationPanel from './AnimationPanel.svelte';

    export let emoteOptions;
    export let activeEmote;
    export let onEmote;
    export let walkOptions = [];
    export let idleOptions = [];
    export let settingsItems = [];
    export let settingsState = {};
    export let selectedWalk = 0;
    export let selectedIdle = 0;
    export let onSelectWalk = () => {};
    export let onSelectIdle = () => {};
    export let shareFeedback = '';
    export let onShare = () => {};
    export let animations = [];
    export let animCurrentInterest = null;
    export let animPendingInterest = -1;
    export let onToggleInterest = () => {};
    export let animActivity = null;
    export let visible = false;

    let activePopover = null;
    let triggers = [];
    let settingsTrigger;
    let actsTrigger;
    let animTab = 'scene';
    let actsListEl;

    $: sceneAnims = animations.filter(a => a.category === 1);
    $: npcAnims = animations.filter(a => a.category === 0);
    $: filteredAnims = animTab === 'scene' ? sceneAnims : npcAnims;

    // Disable strip during countdown and playback
    $: animLocked = animations.some(a => (a.sessionState === 2 || a.sessionState === 3) && a.localInSession);
    $: if (animLocked) { activePopover = null; }

    $: stylePopovers = [
        { name: 'emote', label: 'Emote', emoji: emoteOptions[0].emoji, options: emoteOptions, selected: activeEmote, onSelect: onEmote, align: 'start' },
        { name: 'walk', label: 'Walk', emoji: walkOptions[selectedWalk].emoji, options: walkOptions, selected: selectedWalk, onSelect: onSelectWalk, align: 'start' },
        { name: 'idle', label: 'Idle', emoji: idleOptions[selectedIdle].emoji, options: idleOptions, selected: selectedIdle, onSelect: onSelectIdle },
    ];

    // Close popovers when strip hides
    $: if (!visible) { activePopover = null; }

    function togglePopover(name) {
        activePopover = activePopover === name ? null : name;
    }

    function closePopover() {
        activePopover = null;
    }

    // JS-based touch scrolling for acts list (bypasses touch-action: none on .strip ancestor)
    let touchStartY = 0;
    let touchStartScroll = 0;

    function handleActsTouch(e) {
        touchStartY = e.touches[0].clientY;
        touchStartScroll = actsListEl.scrollTop;
    }

    function handleActsMove(e) {
        if (!actsListEl) return;
        const dy = touchStartY - e.touches[0].clientY;
        actsListEl.scrollTop = touchStartScroll + dy;
        e.preventDefault();
    }
</script>

<div class="strip" class:visible class:countdown-lock={animLocked}>
    {#each stylePopovers as pop, i}
        <div class="indicator-wrapper" bind:this={triggers[i]}>
            <button class="strip-btn" class:active={activePopover === pop.name}
                onclick={() => togglePopover(pop.name)} title={pop.label}>
                <span class="strip-emoji">{pop.emoji}</span>
                <span class="strip-label">{pop.label}</span>
            </button>
            <HotbarPopover open={activePopover === pop.name} triggerEl={triggers[i]} onClose={closePopover} align={pop.align}>
                <div class="popover-content">
                    <StyleGrid options={pop.options} selected={pop.selected} onSelect={pop.onSelect} />
                </div>
            </HotbarPopover>
        </div>
    {/each}

    <!-- Settings popover (includes Share, matching desktop) -->
    <div class="indicator-wrapper" bind:this={settingsTrigger}>
        <button class="strip-btn" class:active={activePopover === 'settings'}
            onclick={() => togglePopover('settings')} title="Settings">
            <span class="strip-emoji">&#x2699;&#xFE0F;</span>
            <span class="strip-label">Settings</span>
        </button>
        <HotbarPopover open={activePopover === 'settings'} triggerEl={settingsTrigger} onClose={closePopover}>
            <div class="popover-settings">
                <SettingsPanel {settingsItems} {settingsState} {shareFeedback} {onShare} />
            </div>
        </HotbarPopover>
    </div>

    <!-- Anims popover (animation discovery) -->
    <div class="indicator-wrapper" bind:this={actsTrigger}>
        <button class="strip-btn" class:active={activePopover === 'acts'}
            onclick={() => togglePopover('acts')} title="Animations">
            <span class="acts-btn-wrapper">
                <span class="strip-emoji">&#x1F3AD;</span>
                {#if animActivity}
                    <span class="activity-dot"
                        class:available={animActivity === 'available'}
                        class:joinable={animActivity === 'joinable'}
                        class:gathering={animActivity === 'gathering'}
                        class:countdown={animActivity === 'countdown'}
                        class:playing={animActivity === 'playing'}></span>
                {/if}
            </span>
            <span class="strip-label">Anims</span>
        </button>
        <HotbarPopover open={activePopover === 'acts'} triggerEl={actsTrigger} onClose={closePopover} align="end">
            <div class="popover-acts">
                <div class="acts-tabs">
                    <button class="acts-tab" class:active={animTab === 'scene'}
                        onclick={() => { animTab = 'scene'; }}>
                        Scene{#if sceneAnims.length}&nbsp;({sceneAnims.length}){/if}
                    </button>
                    <button class="acts-tab" class:active={animTab === 'act'}
                        onclick={() => { animTab = 'act'; }}>
                        Act{#if npcAnims.length}&nbsp;({npcAnims.length}){/if}
                    </button>
                </div>
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="acts-list" bind:this={actsListEl}
                    ontouchstart={handleActsTouch} ontouchmove={handleActsMove}>
                    {#key animTab}
                        <AnimationPanel animations={filteredAnims} currentInterest={animCurrentInterest} pendingInterest={animPendingInterest} {onToggleInterest} isMobile={true} scrollContainer={actsListEl} />
                    {/key}
                </div>
            </div>
        </HotbarPopover>
    </div>
</div>

<style>
    .strip {
        position: fixed;
        bottom: 14px;
        left: 8px;
        right: 72px;
        z-index: 1001;
        display: flex;
        align-items: stretch;
        gap: 2px;
        padding: 4px;
        background: rgba(24, 24, 24, 0.95);
        border: 1px solid var(--color-border-medium);
        border-radius: 14px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
        transform: translateX(100%);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.2s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.15s ease;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        font-family: Arial, sans-serif;
    }

    .strip.visible {
        transform: translateX(0);
        opacity: 1;
        pointer-events: auto;
    }

    .strip.countdown-lock .strip-btn { opacity: 0.3; pointer-events: none; }

    /* === Shared button base === */
    .strip-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        flex: 1;
        min-width: 0;
        padding: 6px 2px;
        background: rgba(255, 255, 255, 0.04);
        border: 1.5px solid transparent;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
        outline: none;
        font-family: inherit;
        box-sizing: border-box;
    }

    .strip-btn:active {
        background: rgba(255, 215, 0, 0.25);
        border-color: var(--color-primary);
        transform: scale(0.95);
    }

    .strip-btn.active {
        background: rgba(255, 215, 0, 0.12);
        border-color: rgba(255, 215, 0, 0.4);
    }

    .strip-emoji {
        font-size: 22px;
        line-height: 1;
    }

    .strip-label {
        font-size: 0.65em;
        color: var(--color-text-muted);
        line-height: 1;
        white-space: nowrap;
    }

    /* === Indicator wrapper (popover anchors) === */
    .indicator-wrapper {
        position: relative;
        flex: 1;
        min-width: 0;
        display: flex;
    }

    .popover-content {
        width: 200px;
    }

    .popover-settings {
        width: 220px;
    }

    /* === Acts popover === */
    .popover-acts {
        width: 260px;
        display: flex;
        flex-direction: column;
        height: 220px;
    }

    .acts-tabs {
        display: flex;
        gap: 2px;
        margin-bottom: 6px;
        flex-shrink: 0;
    }

    .acts-tab {
        flex: 1;
        padding: 7px 0;
        border: none;
        border-radius: 7px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--color-text-muted);
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.15s ease;
        outline: none;
    }

    .acts-tab:active {
        transform: scale(0.97);
    }

    .acts-tab.active {
        background: rgba(255, 215, 0, 0.12);
        color: var(--color-primary);
    }

    .acts-list {
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
        touch-action: pan-y;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
    }

    .acts-list::-webkit-scrollbar { width: 4px; }
    .acts-list::-webkit-scrollbar-track { background: transparent; }
    .acts-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); border-radius: 2px; }

    /* Mobile overrides for AnimationPanel inside popover */
    .acts-list :global(.anim-panel) { width: 100%; }
    .acts-list :global(.anim-list) { max-height: none; overflow-y: visible; overscroll-behavior: auto; touch-action: auto; }
    .acts-list :global(.anim-row) { padding: 9px 8px; }

    .acts-btn-wrapper {
        position: relative;
        display: inline-flex;
    }

    .activity-dot {
        position: absolute;
        top: -2px;
        right: -4px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        border: 1.5px solid rgba(24, 24, 24, 0.95);
        animation: dot-appear 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
    }

    @keyframes dot-appear {
        from { transform: scale(0); }
        to { transform: scale(1); }
    }

    .activity-dot.available {
        background: rgba(76, 175, 80, 0.7);
    }

    .activity-dot.joinable {
        background: rgba(100, 181, 246, 0.95);
    }

    .activity-dot.gathering {
        background: rgba(255, 193, 7, 0.85);
    }

    .activity-dot.countdown {
        background: rgba(255, 152, 0, 0.9);
        animation: activity-pulse 1s ease-in-out infinite;
    }

    .activity-dot.playing {
        background: rgba(0, 188, 212, 0.7);
    }

    @keyframes activity-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
</style>
