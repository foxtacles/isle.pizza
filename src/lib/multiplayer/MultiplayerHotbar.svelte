<script>
    import { onDestroy } from 'svelte';
    import { fly } from 'svelte/transition';
    import EmoteButton from './EmoteButton.svelte';
    import HotbarPopover from './HotbarPopover.svelte';
    import StyleGrid from './StyleGrid.svelte';
    import SettingsPanel from './SettingsPanel.svelte';
    import PeopleIcon from './PeopleIcon.svelte';

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

    let activePopover = null;
    let walkTrigger;
    let idleTrigger;
    let settingsTrigger;
    let pinned = true;
    let hidden = false;
    let hideTimer;

    $: shown = visible && !hidden;

    function keepAlive() {
        hidden = false;
        clearTimeout(hideTimer);
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { hidden = true; }, 1000);
    }

    function resetHideTimer() {
        keepAlive();
        if (!pinned) scheduleHide();
    }

    // Close popovers and reset when becoming invisible
    $: if (!visible) {
        activePopover = null;
        hidden = false;
        clearTimeout(hideTimer);
    }

    function handleZoneLeave() {
        if (!pinned && activePopover === null) scheduleHide();
    }

    function togglePopover(name) {
        if (activePopover === name) {
            activePopover = null;
            resetHideTimer();
        } else {
            activePopover = name;
            clearTimeout(hideTimer);
            hidden = false;
        }
    }

    function closePopover() {
        activePopover = null;
        resetHideTimer();
    }

    function handleSelectWalk(index) {
        onSelectWalk(index);
        closePopover();
    }

    function handleSelectIdle(index) {
        onSelectIdle(index);
        closePopover();
    }

    function handleEmote(index) {
        onEmote(index);
        resetHideTimer();
    }

    function togglePin() {
        pinned = !pinned;
        if (pinned) {
            hidden = false;
            clearTimeout(hideTimer);
        } else {
            resetHideTimer();
        }
    }

    onDestroy(() => { clearTimeout(hideTimer); });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hotbar-zone" class:active={visible}
    onmouseenter={keepAlive}
    onmouseleave={handleZoneLeave}>
    {#if shown}
        <div class="hotbar" transition:fly={{ y: 48, duration: 200 }}>
            <!-- Emote buttons -->
            {#each emoteOptions as opt, i}
                <EmoteButton emoji={opt.emoji} label={opt.label}
                    active={activeEmote === i}
                    onclick={() => handleEmote(i)} />
            {/each}

            <div class="divider"></div>

            <!-- Walk indicator -->
            <div class="indicator-wrapper" bind:this={walkTrigger}>
                <button class="indicator-btn" class:active={activePopover === 'walk'}
                    onclick={() => togglePopover('walk')} title="Walk style">
                    <span class="indicator-label">Walk</span>
                    <span class="indicator-emoji">{walkOptions[selectedWalk].emoji}</span>
                    <span class="indicator-caret">&#x25BE;</span>
                </button>
                <HotbarPopover open={activePopover === 'walk'} triggerEl={walkTrigger} onClose={closePopover}>
                    <div class="popover-content">
                        <StyleGrid options={walkOptions} selected={selectedWalk} onSelect={handleSelectWalk} />
                    </div>
                </HotbarPopover>
            </div>

            <!-- Idle indicator -->
            <div class="indicator-wrapper" bind:this={idleTrigger}>
                <button class="indicator-btn" class:active={activePopover === 'idle'}
                    onclick={() => togglePopover('idle')} title="Idle style">
                    <span class="indicator-label">Idle</span>
                    <span class="indicator-emoji">{idleOptions[selectedIdle].emoji}</span>
                    <span class="indicator-caret">&#x25BE;</span>
                </button>
                <HotbarPopover open={activePopover === 'idle'} triggerEl={idleTrigger} onClose={closePopover}>
                    <div class="popover-content">
                        <StyleGrid options={idleOptions} selected={selectedIdle} onSelect={handleSelectIdle} />
                    </div>
                </HotbarPopover>
            </div>

            <!-- Settings -->
            <div class="indicator-wrapper" bind:this={settingsTrigger}>
                <button class="indicator-btn" class:active={activePopover === 'settings'}
                    onclick={() => togglePopover('settings')} title="Settings">
                    <span class="indicator-emoji">&#x2699;&#xFE0F;</span>
                </button>
                <HotbarPopover open={activePopover === 'settings'} triggerEl={settingsTrigger} onClose={closePopover}>
                    <div class="popover-content popover-settings">
                        <SettingsPanel {settingsItems} {settingsState} {shareFeedback} {onShare} />
                    </div>
                </HotbarPopover>
            </div>

            <!-- Pin button -->
            <button class="pin-btn" class:pinned onclick={togglePin}
                title={pinned ? 'Unpin (auto-hide)' : 'Pin (stay visible)'}>&#x1F4CC;</button>

            <!-- Player count -->
            {#if playerCount != null}
                <span class="player-count" class:bump={badgeBump}>
                    <PeopleIcon />
                    {playerCount}
                </span>
            {/if}
        </div>
    {/if}
</div>

<style>
    .hotbar-zone {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        padding-bottom: 16px;
        pointer-events: none;
    }

    .hotbar-zone.active {
        pointer-events: auto;
    }


    .hotbar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: rgba(24, 24, 24, 0.85);
        border: 1px solid var(--color-border-medium);
        border-radius: 12px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        font-family: Arial, sans-serif;
    }

    .divider {
        width: 1px;
        height: 28px;
        background: var(--color-border-light);
        opacity: 0.4;
        margin: 0 2px;
        flex-shrink: 0;
    }

    .indicator-wrapper {
        position: relative;
    }

    .indicator-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 6px;
        background: none;
        border: 1.5px solid transparent;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
        font-family: inherit;
        outline: none;
    }

    @media (hover: hover) {
        .indicator-btn:hover {
            background: rgba(255, 255, 255, 0.08);
        }
    }

    .indicator-btn.active {
        background: rgba(255, 215, 0, 0.12);
        border-color: rgba(255, 215, 0, 0.4);
    }

    .indicator-label {
        font-size: 0.7em;
        font-weight: 600;
        color: var(--color-text-muted);
        line-height: 1;
    }

    .indicator-btn.active .indicator-label {
        color: var(--color-primary);
    }

    .indicator-emoji {
        font-size: 20px;
        line-height: 1;
    }

    .indicator-caret {
        font-size: 10px;
        color: var(--color-text-muted);
        line-height: 1;
    }

    .pin-btn {
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
        opacity: 0.3;
        transition: opacity 0.15s ease;
        outline: none;
    }

    @media (hover: hover) {
        .pin-btn:hover {
            opacity: 0.7;
        }
    }

    .pin-btn.pinned {
        opacity: 1;
    }

    .player-count {
        display: flex;
        align-items: center;
        gap: 3px;
        padding: 2px 6px;
        font-size: 12px;
        font-weight: 700;
        color: var(--color-primary);
        white-space: nowrap;
    }

    .player-count.bump {
        animation: badge-bump 0.4s ease;
    }

    @keyframes badge-bump {
        0% { transform: scale(1); }
        40% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }

    .popover-content {
        width: 200px;
    }

    .popover-settings {
        width: 220px;
    }

    /* Emote buttons in hotbar need to be compact */
    .hotbar :global(.emote-btn) {
        width: 44px;
        height: 40px;
        padding: 4px 2px;
    }

    .hotbar :global(.emote-emoji) {
        font-size: 20px;
    }

    .hotbar :global(.emote-label) {
        font-size: 0.6em;
    }
</style>
