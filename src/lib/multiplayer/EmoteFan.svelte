<script>
    import { onMount } from 'svelte';
    import HotbarPopover from './HotbarPopover.svelte';
    import StyleGrid from './StyleGrid.svelte';

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

    let visible = false;
    let activePopover = null;
    let triggers = [];
    let settingsTrigger;

    $: stylePopovers = [
        { name: 'emote', label: 'Emote', emoji: emoteOptions[0].emoji, options: emoteOptions, selected: activeEmote, onSelect: onEmote, align: 'start' },
        { name: 'walk', label: 'Walk', emoji: walkOptions[selectedWalk].emoji, options: walkOptions, selected: selectedWalk, onSelect: onSelectWalk, align: 'start' },
        { name: 'idle', label: 'Idle', emoji: idleOptions[selectedIdle].emoji, options: idleOptions, selected: selectedIdle, onSelect: onSelectIdle },
    ];

    onMount(() => {
        requestAnimationFrame(() => { visible = true; });
    });

    function togglePopover(name) {
        activePopover = activePopover === name ? null : name;
    }

    function closePopover() {
        activePopover = null;
    }
</script>

<div class="strip" class:visible>
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

    <!-- Settings popover -->
    <div class="indicator-wrapper" bind:this={settingsTrigger}>
        <button class="strip-btn" class:active={activePopover === 'settings'}
            onclick={() => togglePopover('settings')} title="Settings">
            <span class="strip-emoji">&#x2699;&#xFE0F;</span>
            <span class="strip-label">Settings</span>
        </button>
        <HotbarPopover open={activePopover === 'settings'} triggerEl={settingsTrigger} onClose={closePopover}>
            <div class="popover-content popover-settings">
                {#each settingsItems as item}
                    <button class="settings-row" onclick={item.toggle}>
                        <svg class="settings-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            {@html item.icon}
                        </svg>
                        <span class="settings-label">{item.label}</span>
                        <span class="toggle-switch" class:on={settingsState[item.key]}>
                            <span class="toggle-knob"></span>
                        </span>
                    </button>
                {/each}
            </div>
        </HotbarPopover>
    </div>

    <!-- Share button -->
    <button class="strip-btn share-btn" class:copied={shareFeedback}
        onclick={onShare} title={shareFeedback || 'Share'}>
        {#if shareFeedback}
            <svg class="share-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        {:else}
            <svg class="share-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
        {/if}
        <span class="strip-label">{shareFeedback || 'Share'}</span>
    </button>
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
    }

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
        -webkit-tap-highlight-color: transparent;
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
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    /* === Settings popover rows === */
    .settings-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        width: 100%;
        text-align: left;
        -webkit-tap-highlight-color: transparent;
        font-family: inherit;
        box-sizing: border-box;
        outline: none;
    }

    .settings-row:active {
        background: rgba(255, 255, 255, 0.1);
    }

    .settings-icon {
        flex-shrink: 0;
        color: var(--color-text-muted);
    }

    .settings-label {
        flex: 1;
        color: var(--color-text-light);
        font-size: 0.8em;
    }

    .toggle-switch {
        position: relative;
        width: 44px;
        height: 24px;
        border-radius: 24px;
        background: var(--color-border-dark);
        transition: background-color 0.2s ease;
        flex-shrink: 0;
    }

    .toggle-switch.on {
        background-color: #3a5f3a;
    }

    .toggle-knob {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--color-text-muted);
        transition: all 0.2s ease;
    }

    .toggle-switch.on .toggle-knob {
        left: 23px;
        background: var(--color-primary);
    }

    /* === Share button === */
    .share-btn {
        border-color: rgba(255, 215, 0, 0.2);
    }

    .share-btn .strip-label,
    .share-icon {
        color: var(--color-primary);
    }

    .share-btn.copied {
        background: rgba(74, 222, 128, 0.12);
        border-color: rgba(74, 222, 128, 0.4);
    }

    .share-btn.copied .strip-label,
    .share-btn.copied .share-icon {
        color: #4ade80;
    }
</style>
