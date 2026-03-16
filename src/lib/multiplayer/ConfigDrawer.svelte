<script>
    import { onMount, onDestroy } from 'svelte';
    import StyleGrid from './StyleGrid.svelte';
    import SettingsPanel from './SettingsPanel.svelte';
    import ShareButton from './ShareButton.svelte';

    export let walkOptions;
    export let idleOptions;
    export let settingsItems;
    export let settingsState;
    export let selectedWalk;
    export let selectedIdle;
    export let shareFeedback;
    export let onSelectWalk;
    export let onSelectIdle;
    export let onShare;
    export let onClose;

    let expandedSection = null;
    let touchStartY = 0;
    let touchDeltaY = 0;
    let swiping = false;

    const sections = [
        { id: 'walk', emoji: '\u{1F6B6}', label: 'Walk' },
        { id: 'idle', emoji: '\u{1F343}', label: 'Idle' },
        { id: 'settings', emoji: '\u{2699}\u{FE0F}', label: 'Settings' },
    ];

    function toggleSection(id) {
        expandedSection = expandedSection === id ? null : id;
    }

    function handleTouchStart(e) {
        touchStartY = e.touches[0].clientY;
        touchDeltaY = 0;
        swiping = true;
    }

    function handleTouchMove(e) {
        if (!swiping) return;
        touchDeltaY = Math.max(0, e.touches[0].clientY - touchStartY);
    }

    function handleTouchEnd() {
        if (touchDeltaY > 60) onClose();
        touchDeltaY = 0;
        swiping = false;
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') onClose();
    }

    function handleBackdropClick(e) {
        if (e.target.classList.contains('drawer-backdrop')) {
            onClose();
        }
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="drawer-backdrop" onclick={handleBackdropClick}>
    <div class="drawer"
        style={touchDeltaY > 0 ? `transform: translateY(${touchDeltaY}px)` : ''}>

        <!-- Drag handle -->
        <div class="drawer-handle"
            ontouchstart={handleTouchStart}
            ontouchmove={handleTouchMove}
            ontouchend={handleTouchEnd}>
            <div class="drawer-handle-bar"></div>
        </div>

        <!-- Accordion sections -->
        {#each sections as section}
            <button class="section-header" class:expanded={expandedSection === section.id}
                onclick={() => toggleSection(section.id)}>
                <span class="section-emoji">{section.emoji}</span>
                <span class="section-label">{section.label}</span>
                <span class="section-caret" class:expanded={expandedSection === section.id}>&#x25B8;</span>
            </button>

            {#if expandedSection === section.id}
                <div class="section-content">
                    {#if section.id === 'walk'}
                        <StyleGrid options={walkOptions} selected={selectedWalk} onSelect={onSelectWalk} />
                    {:else if section.id === 'idle'}
                        <StyleGrid options={idleOptions} selected={selectedIdle} onSelect={onSelectIdle} />
                    {:else if section.id === 'settings'}
                        <SettingsPanel {settingsItems} {settingsState} {shareFeedback} {onShare} />
                    {/if}
                </div>
            {/if}
        {/each}

        <!-- Share button always visible -->
        {#if expandedSection !== 'settings'}
            <div class="drawer-share">
                <ShareButton {shareFeedback} {onShare} />
            </div>
        {/if}
    </div>
</div>

<style>
    .drawer-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1002;
        background: rgba(0, 0, 0, 0.3);
    }

    .drawer {
        position: fixed;
        bottom: -1px;
        left: 0;
        right: 0;
        padding-bottom: 1px;
        z-index: 1003;
        background: rgba(24, 24, 24, 0.95);
        border-top: 1px solid var(--color-border-medium);
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        animation: drawer-in 0.2s ease-out;
        display: flex;
        flex-direction: column;
        padding: 0 6px 8px;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        font-family: Arial, sans-serif;
    }

    @keyframes drawer-in {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
    }

    .drawer-handle {
        display: flex;
        justify-content: center;
        padding: 10px 0 6px 0;
        cursor: grab;
    }

    .drawer-handle-bar {
        width: 36px;
        height: 4px;
        border-radius: 2px;
        background: var(--color-border-light);
        opacity: 0.5;
        animation: handle-hint 0.4s ease 0.25s;
    }

    @keyframes handle-hint {
        0% { transform: translateY(0); }
        50% { transform: translateY(4px); }
        100% { transform: translateY(0); }
    }

    .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 10px;
        background: none;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        width: 100%;
        text-align: left;
        transition: background 0.15s ease;
        font-family: inherit;
        box-sizing: border-box;
        outline: none;
    }

    @media (hover: hover) {
        .section-header:hover {
            background: rgba(255, 255, 255, 0.05);
        }
    }

    .section-header.expanded {
        background: rgba(255, 215, 0, 0.06);
    }

    .section-emoji {
        font-size: 18px;
        line-height: 1;
    }

    .section-label {
        flex: 1;
        font-size: 0.85em;
        font-weight: 600;
        color: var(--color-text-light);
    }

    .section-caret {
        font-size: 14px;
        color: var(--color-text-muted);
        transition: transform 0.15s ease;
        line-height: 1;
    }

    .section-caret.expanded {
        transform: rotate(90deg);
    }

    .section-content {
        padding: 4px 6px 8px;
        animation: section-expand 0.15s ease-out;
    }

    @keyframes section-expand {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .drawer-share {
        padding: 6px 4px 2px;
    }
</style>
