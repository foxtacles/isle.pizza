<script>
    import { onMount, onDestroy } from 'svelte';

    export let emoteOptions;
    export let activeEmote;
    export let onEmote;
    export let onGear;
    export let onClose;

    let visible = false;
    let stripEl;

    onMount(() => {
        requestAnimationFrame(() => { visible = true; });
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    function handleKeydown(e) {
        if (e.key === 'Escape') onClose();
    }

    function handleBackdropClick(e) {
        if (stripEl && !stripEl.contains(e.target)) {
            onClose();
        }
    }

    function handleEmote(index) {
        onEmote(index);
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="strip-backdrop" onclick={handleBackdropClick}>
    <div class="strip" class:visible bind:this={stripEl}>
        <!-- Gear button first (leftmost) -->
        <button class="strip-btn strip-gear"
            style="--delay: {emoteOptions.length * 30}ms"
            onclick={onGear}
            title="Settings">
            <span class="strip-emoji">&#x2699;&#xFE0F;</span>
            <span class="strip-label">More</span>
        </button>

        <div class="strip-divider"></div>

        {#each emoteOptions as opt, i}
            <button class="strip-btn"
                class:active={activeEmote === i}
                style="--delay: {i * 30}ms"
                onclick={() => handleEmote(i)}
                title={opt.label}>
                <span class="strip-emoji">{opt.emoji}</span>
                <span class="strip-label">{opt.label}</span>
            </button>
        {/each}
    </div>
</div>

<style>
    .strip-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1001;
    }

    .strip {
        position: fixed;
        bottom: 14px;
        left: 8px;
        right: 72px;
        z-index: 1002;
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

    .strip-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        flex: 1;
        max-width: 44px;
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

    .strip-btn:active, .strip-btn.active {
        background: rgba(255, 215, 0, 0.25);
        border-color: var(--color-primary);
        transform: scale(0.95);
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

    .strip-divider {
        width: 1px;
        background: var(--color-border-light);
        opacity: 0.4;
        margin: 4px 1px;
        flex-shrink: 0;
    }

    .strip-gear {
        border-color: rgba(255, 215, 0, 0.2);
    }
</style>
