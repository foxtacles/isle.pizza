<script>
    import { onMount } from 'svelte';

    export let emoteOptions;
    export let activeEmote;
    export let onEmote;
    export let onGear;

    // Config mode props
    export let configOpen = false;
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
    let activeTab = 'walk';

    onMount(() => {
        requestAnimationFrame(() => { visible = true; });
    });

    function handleEmote(index) {
        onEmote(index);
    }
</script>

<div class="strip" class:visible class:config-mode={configOpen}>
    {#if !configOpen}
        <!-- EMOTE MODE -->
        <button class="strip-btn strip-gear"
            onclick={onGear}
            title="Settings">
            <span class="strip-emoji">&#x2699;&#xFE0F;</span>
            <span class="strip-label">More</span>
        </button>

        <div class="strip-divider"></div>

        {#each emoteOptions as opt, i}
            <button class="strip-btn"
                class:active={activeEmote === i}
                onclick={() => handleEmote(i)}
                title={opt.label}>
                <span class="strip-emoji">{opt.emoji}</span>
                <span class="strip-label">{opt.label}</span>
            </button>
        {/each}
    {:else}
        <!-- SETTINGS MODE -->
        <div class="tab-row">
            <button class="back-btn" onclick={onGear} title="Back to emotes">
                <span class="back-arrow">&#x2190;</span>
            </button>

            <div class="strip-divider"></div>

            <button class="tab-btn" class:active={activeTab === 'walk'}
                onclick={() => activeTab = 'walk'}>
                <span class="tab-emoji">&#x1F6B6;</span>
                <span class="tab-label">Walk</span>
            </button>
            <button class="tab-btn" class:active={activeTab === 'idle'}
                onclick={() => activeTab = 'idle'}>
                <span class="tab-emoji">&#x1F343;</span>
                <span class="tab-label">Idle</span>
            </button>
            <button class="tab-btn" class:active={activeTab === 'settings'}
                onclick={() => activeTab = 'settings'}>
                <span class="tab-emoji">&#x2699;&#xFE0F;</span>
                <span class="tab-label">More</span>
            </button>
        </div>

        <div class="content-row">
            {#if activeTab === 'walk'}
                <div class="scroll-strip">
                    {#each walkOptions as opt, i}
                        <button class="strip-btn" class:selected={selectedWalk === i}
                            onclick={() => onSelectWalk(i)}>
                            <span class="strip-emoji">{opt.emoji}</span>
                            <span class="strip-label">{opt.label}</span>
                        </button>
                    {/each}
                </div>
            {:else if activeTab === 'idle'}
                <div class="scroll-strip">
                    {#each idleOptions as opt, i}
                        <button class="strip-btn" class:selected={selectedIdle === i}
                            onclick={() => onSelectIdle(i)}>
                            <span class="strip-emoji">{opt.emoji}</span>
                            <span class="strip-label">{opt.label}</span>
                        </button>
                    {/each}
                </div>
            {:else if activeTab === 'settings'}
                <div class="settings-strip">
                    {#each settingsItems as item}
                        <button class="setting-toggle" class:on={settingsState[item.key]}
                            onclick={item.toggle}>
                            <svg class="setting-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                {@html item.icon}
                            </svg>
                            <span class="setting-name">{item.label}</span>
                        </button>
                    {/each}
                    <div class="strip-divider"></div>
                    <button class="setting-toggle share-toggle" class:copied={shareFeedback}
                        onclick={onShare}>
                        {#if shareFeedback}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span class="setting-name">{shareFeedback}</span>
                        {:else}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            <span class="setting-name">Share</span>
                        {/if}
                    </button>
                </div>
            {/if}
        </div>
    {/if}
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

    /* Config mode: two-row layout */
    .strip.config-mode {
        flex-direction: column;
        gap: 0;
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

    .strip-btn.selected {
        background: rgba(255, 215, 0, 0.12);
        border-color: var(--color-primary);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.1);
    }

    .strip-btn.selected .strip-label {
        color: var(--color-primary);
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

    /* === Tab row === */
    .tab-row {
        display: flex;
        align-items: stretch;
        gap: 2px;
        padding: 2px 2px 0;
        width: 100%;
        box-sizing: border-box;
    }

    .tab-row .strip-divider {
        height: auto;
        width: 1px;
        margin: 6px 1px;
    }

    .back-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        min-width: 36px;
        padding: 6px 2px;
        background: rgba(255, 255, 255, 0.04);
        border: 1.5px solid rgba(255, 215, 0, 0.2);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
        outline: none;
        font-family: inherit;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
    }

    .back-btn:active {
        background: rgba(255, 215, 0, 0.25);
        transform: scale(0.95);
    }

    .back-arrow {
        font-size: 18px;
        color: var(--color-text-light);
        line-height: 1;
    }

    .tab-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 8px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        border-radius: 8px 8px 0 0;
        cursor: pointer;
        transition: all 0.15s ease;
        outline: none;
        font-family: inherit;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
    }

    .tab-btn.active {
        background: rgba(255, 215, 0, 0.08);
        border-bottom-color: var(--color-primary);
    }

    .tab-btn.active .tab-label {
        color: var(--color-primary);
    }

    .tab-emoji {
        font-size: 16px;
        line-height: 1;
    }

    .tab-label {
        font-size: 0.75em;
        font-weight: 600;
        color: var(--color-text-muted);
        line-height: 1;
        white-space: nowrap;
    }

    /* === Content row === */
    .content-row {
        width: 100%;
        padding: 2px;
        box-sizing: border-box;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .scroll-strip {
        display: flex;
        gap: 2px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding: 2px;
    }

    .scroll-strip::-webkit-scrollbar {
        display: none;
    }

    .scroll-strip .strip-btn {
        flex-shrink: 0;
        flex: 0 0 auto;
        min-width: 52px;
        max-width: none;
    }

    /* === Settings strip === */
    .settings-strip {
        display: flex;
        gap: 2px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding: 2px;
    }

    .settings-strip::-webkit-scrollbar {
        display: none;
    }

    .settings-strip .strip-divider {
        height: auto;
        width: 1px;
        margin: 6px 1px;
    }

    .setting-toggle {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        flex-shrink: 0;
        padding: 6px 6px;
        min-width: 52px;
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

    .setting-toggle:active {
        transform: scale(0.95);
    }

    .setting-toggle.on {
        background: rgba(255, 215, 0, 0.12);
        border-color: var(--color-primary);
    }

    .setting-toggle.on .setting-icon {
        color: var(--color-primary);
    }

    .setting-toggle.on .setting-name {
        color: var(--color-primary);
    }

    .setting-icon {
        color: var(--color-text-muted);
        flex-shrink: 0;
    }

    .setting-name {
        font-size: 0.6em;
        color: var(--color-text-muted);
        line-height: 1;
        white-space: nowrap;
    }

    .share-toggle {
        border-color: rgba(255, 215, 0, 0.2);
        color: var(--color-primary);
    }

    .share-toggle .setting-icon,
    .share-toggle .setting-name {
        color: var(--color-primary);
    }

    .share-toggle svg {
        color: var(--color-primary);
    }

    .share-toggle.copied {
        background: rgba(74, 222, 128, 0.12);
        border-color: rgba(74, 222, 128, 0.4);
    }

    .share-toggle.copied .setting-name,
    .share-toggle.copied svg {
        color: #4ade80;
    }
</style>
