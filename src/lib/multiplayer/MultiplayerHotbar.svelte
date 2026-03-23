<script>
    import { onDestroy } from 'svelte';
    import { fly } from 'svelte/transition';
    import HotbarPopover from './HotbarPopover.svelte';
    import StyleGrid from './StyleGrid.svelte';
    import SettingsPanel from './SettingsPanel.svelte';
    import AnimationPanel from './AnimationPanel.svelte';
    import PeopleIcon from './PeopleIcon.svelte';
    import AnimationTabs from './AnimationTabs.svelte';

    export let visible = false;
    export let emoteOptions;
    export let walkOptions;
    export let idleOptions;
    export let settingsItems;
    export let settingsState;
    export let selectedWalk;
    export let selectedIdle;
    export let activeEmote;
    export let playerCount;
    export let badgeBump;
    export let shareFeedback;
    export let onEmote;
    export let onSelectWalk;
    export let onSelectIdle;
    export let onShare;
    export let animations = [];
    export let animCurrentInterest = null;
    export let animPendingInterest = -1;
    export let onToggleInterest = () => {};
    export let animActivity = null;
    export let animsDisabled = false;

    let animTab = 'scene';
    let filteredAnims = [];
    let animTabsRef;

    // Disable hotbar interactions during countdown and playback
    $: animLocked = animations.some(a => (a.sessionState === 2 || a.sessionState === 3) && a.localInSession);
    $: if (animLocked) { activePopover = null; }

    // Close anims popover when switching to 1st person
    $: if (animsDisabled && activePopover === 'anims') { activePopover = null; }

    $: styleDropdowns = [
        { key: 'emote', label: 'Emote', emoji: emoteOptions[0].emoji, title: 'Emotes',
          options: emoteOptions, selected: activeEmote, onSelect: handleEmoteSelect },
        { key: 'walk', label: 'Walk', emoji: walkOptions[selectedWalk].emoji, title: 'Walk style',
          options: walkOptions, selected: selectedWalk, onSelect: (i) => handleStyleSelect(onSelectWalk, i) },
        { key: 'idle', label: 'Idle', emoji: idleOptions[selectedIdle].emoji, title: 'Idle style',
          options: idleOptions, selected: selectedIdle, onSelect: (i) => handleStyleSelect(onSelectIdle, i) },
    ];

    // One-time bounce when activity transitions to joinable
    let animBounce = false;
    let prevActivity = null;
    let bounceTimer;
    $: {
        if (animActivity === 'joinable' && prevActivity !== 'joinable') {
            animBounce = true;
            clearTimeout(bounceTimer);
            bounceTimer = setTimeout(() => { animBounce = false; }, 600);
        }
        prevActivity = animActivity;
    }

    let activePopover = null;
    let triggerEls = {};
    let pinned = true;
    let hidden = false;
    let hideTimer;
    let mouseInside = false;

    $: shown = visible && !hidden;
    $: if (!visible) { activePopover = null; hidden = false; mouseInside = false; clearTimeout(hideTimer); }

    function keepAlive() { hidden = false; clearTimeout(hideTimer); }
    function scheduleHide() { clearTimeout(hideTimer); hideTimer = setTimeout(() => { hidden = true; }, 1000); }
    function resetHideTimer() { keepAlive(); if (!pinned && !mouseInside) scheduleHide(); }
    function handleMouseEnter() { mouseInside = true; keepAlive(); }
    function handleMouseLeave() { mouseInside = false; if (!pinned && activePopover === null) scheduleHide(); }
    function closePopover() { activePopover = null; resetHideTimer(); }

    function togglePopover(name) {
        if (animLocked) return;
        if (activePopover === name) { activePopover = null; resetHideTimer(); }
        else {
            if (name === 'anims') animTabsRef?.selectBestTab();
            activePopover = name; keepAlive();
        }
    }

    function handleEmoteSelect(index) { onEmote(index); closePopover(); }
    function handleStyleSelect(callback, index) { callback(index); keepAlive(); }

    function togglePin() {
        pinned = !pinned;
        if (pinned) keepAlive();
        else resetHideTimer();
    }

    onDestroy(() => { clearTimeout(hideTimer); clearTimeout(bounceTimer); });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hotbar-zone">
    {#if shown}
        <div class="hotbar" class:countdown-lock={animLocked} transition:fly={{ y: 48, duration: 200 }}
            onmouseenter={handleMouseEnter} onmouseleave={handleMouseLeave}>
            {#each styleDropdowns as dd (dd.key)}
                <div class="indicator-wrapper" bind:this={triggerEls[dd.key]}>
                    <button class="indicator-btn" class:active={activePopover === dd.key}
                        onclick={() => togglePopover(dd.key)} title={dd.title}>
                        <span class="indicator-label">{dd.label}</span>
                        <span class="indicator-emoji">{dd.emoji}</span>
                        <span class="indicator-caret">&#x25BE;</span>
                    </button>
                    <HotbarPopover open={activePopover === dd.key} triggerEl={triggerEls[dd.key]} onClose={closePopover}>
                        <div class="popover-grid"><StyleGrid options={dd.options} selected={dd.selected} onSelect={dd.onSelect} /></div>
                    </HotbarPopover>
                </div>
            {/each}

            <div class="divider"></div>

            <div class="indicator-wrapper" bind:this={triggerEls.anims}>
                <button class="indicator-btn"
                    class:active={activePopover === 'anims'}
                    class:activity-available={!activePopover && !animsDisabled && animActivity === 'available'}
                    class:activity-joinable={!activePopover && !animsDisabled && animActivity === 'joinable'}
                    class:activity-gathering={!activePopover && !animsDisabled && animActivity === 'gathering'}
                    class:activity-countdown={!activePopover && !animsDisabled && animActivity === 'countdown'}
                    class:activity-playing={!activePopover && !animsDisabled && animActivity === 'playing'}
                    class:bounce={animBounce}
                    class:anims-disabled={animsDisabled}
                    disabled={animsDisabled}
                    onclick={() => togglePopover('anims')} title="Animations">
                    <span class="indicator-label">Animations</span>
                    <span class="indicator-emoji">&#x1F3AC;</span>
                    <span class="indicator-caret">&#x25BE;</span>
                </button>
                <HotbarPopover open={activePopover === 'anims'} triggerEl={triggerEls.anims}
                    onClose={closePopover} align="start">
                    <div class="popover-anims">
                        <AnimationTabs bind:this={animTabsRef} {animations} bind:animTab onFilteredChange={(a) => filteredAnims = a}>
                            {#key animTab}
                                <AnimationPanel animations={filteredAnims} currentInterest={animCurrentInterest} pendingInterest={animPendingInterest} {onToggleInterest} />
                            {/key}
                        </AnimationTabs>
                    </div>
                </HotbarPopover>
            </div>

            <div class="divider"></div>

            <div class="indicator-wrapper" bind:this={triggerEls.settings}>
                <button class="indicator-btn" class:active={activePopover === 'settings'}
                    onclick={() => togglePopover('settings')} title="Settings">
                    <span class="indicator-emoji">&#x2699;&#xFE0F;</span>
                </button>
                <HotbarPopover open={activePopover === 'settings'} triggerEl={triggerEls.settings} onClose={closePopover}>
                    <div class="popover-settings"><SettingsPanel {settingsItems} {settingsState} {shareFeedback} {onShare} /></div>
                </HotbarPopover>
            </div>

            <button class="pin-btn" class:pinned onclick={togglePin}
                title={pinned ? 'Unpin (auto-hide)' : 'Pin (stay visible)'}>&#x1F4CC;</button>

            {#if playerCount != null}
                <span class="player-count" class:bump={badgeBump}><PeopleIcon />{playerCount}</span>
            {/if}
        </div>
    {:else if visible}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="hotbar-trigger" onmouseenter={keepAlive}></div>
    {/if}
</div>

<style>
    .hotbar-zone {
        position: fixed; bottom: 0; left: 0; right: 0; height: 64px;
        z-index: 1000; display: flex; justify-content: center; align-items: flex-end;
        padding-bottom: 16px; pointer-events: none;
    }
    .hotbar-trigger {
        position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
        width: 300px; height: 16px; pointer-events: auto;
    }

    .hotbar {
        pointer-events: auto;
        display: flex; align-items: center; gap: 4px; padding: 4px 8px;
        background: rgba(24, 24, 24, 0.85); border: 1px solid var(--color-border-medium);
        border-radius: 12px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4); touch-action: none;
        user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
        font-family: Arial, sans-serif;
    }

    .hotbar.countdown-lock .indicator-btn { opacity: 0.3; pointer-events: none; }
    .hotbar.countdown-lock .divider { opacity: 0.2; }

    .divider {
        width: 1px; height: 28px; background: var(--color-border-light);
        opacity: 0.4; margin: 0 2px; flex-shrink: 0;
    }

    .indicator-wrapper { position: relative; }

    .indicator-btn {
        display: flex; align-items: center; gap: 4px; padding: 4px 6px;
        background: none; border: 1.5px solid transparent; border-radius: 10px;
        cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease;
        font-family: inherit; outline: none;
    }
    @media (hover: hover) { .indicator-btn:hover { background: var(--color-surface-hover); } }
    .indicator-btn.active { background: var(--color-primary-surface); border-color: var(--color-primary-border); }

    .indicator-label { font-size: 0.7em; font-weight: 600; color: var(--color-text-muted); line-height: 1; }
    .indicator-btn.active .indicator-label { color: var(--color-primary); }
    .indicator-emoji { font-size: 20px; line-height: 1; }

    /* Activity states: tinted background + colored label to signal actionable content */
    .indicator-btn.activity-available {
        background: rgba(76, 175, 80, 0.08); border-color: rgba(76, 175, 80, 0.3);
    }
    .indicator-btn.activity-available .indicator-label { color: rgba(76, 175, 80, 0.9); }

    .indicator-btn.activity-joinable {
        background: rgba(100, 181, 246, 0.1); border-color: rgba(100, 181, 246, 0.4);
        animation: nudge-join 2s ease-in-out infinite;
    }
    .indicator-btn.activity-joinable .indicator-label { color: rgba(100, 181, 246, 0.95); }

    .indicator-btn.activity-gathering {
        background: rgba(255, 193, 7, 0.08); border-color: rgba(255, 193, 7, 0.35);
    }
    .indicator-btn.activity-gathering .indicator-label { color: rgba(255, 193, 7, 0.9); }

    .indicator-btn.activity-countdown {
        background: rgba(255, 152, 0, 0.1); border-color: rgba(255, 152, 0, 0.5);
        animation: nudge-countdown 1s ease-in-out infinite;
    }
    .indicator-btn.activity-countdown .indicator-label { color: rgba(255, 152, 0, 0.95); }

    .indicator-btn.activity-playing {
        background: rgba(0, 188, 212, 0.08); border-color: rgba(0, 188, 212, 0.35);
    }
    .indicator-btn.activity-playing .indicator-label { color: rgba(0, 188, 212, 0.9); }

    @keyframes nudge-join {
        0%, 100% { background: rgba(100, 181, 246, 0.06); }
        50% { background: rgba(100, 181, 246, 0.15); }
    }
    @keyframes nudge-countdown {
        0%, 100% { background: rgba(255, 152, 0, 0.06); }
        50% { background: rgba(255, 152, 0, 0.18); }
    }
    .indicator-btn.bounce {
        animation: activity-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes activity-bounce {
        0% { transform: scale(1); }
        40% { transform: scale(1.15); }
        100% { transform: scale(1); }
    }

    .indicator-btn.anims-disabled { opacity: 0.3; cursor: default; }

    .indicator-caret { font-size: 10px; color: var(--color-text-muted); line-height: 1; }

    .pin-btn {
        flex-shrink: 0; border: none; border-radius: 50%; background: transparent;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        padding: 4px; font-size: 12px; line-height: 1; opacity: 0.3;
        transition: opacity 0.15s ease; outline: none;
    }
    @media (hover: hover) { .pin-btn:hover { opacity: 0.7; } }
    .pin-btn.pinned { opacity: 1; }

    .player-count {
        display: flex; align-items: center; gap: 3px; padding: 2px 6px;
        font-size: 12px; font-weight: 700; color: var(--color-primary); white-space: nowrap;
    }
    .player-count.bump { animation: badge-bump 0.4s ease; }
    @keyframes badge-bump { 0% { transform: scale(1); } 40% { transform: scale(1.2); } 100% { transform: scale(1); } }

    .popover-grid { width: 200px; }
    .popover-settings { width: 220px; }

    /* === Animations tabbed popover === */
    .popover-anims {
        width: 300px;
        display: flex;
        flex-direction: column;
    }

</style>
