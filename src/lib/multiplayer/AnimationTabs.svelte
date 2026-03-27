<script>
    import { onMount } from 'svelte';
    import { bestAnimTab } from './constants.js';
    import AnimationLegend from './AnimationLegend.svelte';

    export let animations = [];
    export let animTab = 'scene';
    export let onTabChange = (tab) => { animTab = tab; };
    export let onFilteredChange = () => {};
    export let showLegend = false;
    export let onToggleLegend = () => {};

    $: sceneAnims = animations.filter(a => a.category === 1);
    $: npcAnims = animations.filter(a => a.category === 0);
    $: filteredAnims = animTab === 'scene' ? sceneAnims : npcAnims;
    $: onFilteredChange(filteredAnims);

    function selectBestTab() {
        const best = bestAnimTab(sceneAnims, npcAnims, animTab);
        if (best !== animTab) onTabChange(best);
    }

    onMount(() => selectBestTab());
</script>

<div class="anim-tabs-wrapper">
    <div class="anim-tabs">
        <button class="anim-tab" class:active={animTab === 'scene' && !showLegend}
            onclick={() => { if (showLegend) onToggleLegend(); onTabChange('scene'); }}>
            Scene{#if sceneAnims.length}&nbsp;({sceneAnims.length}){/if}
        </button>
        <button class="anim-tab" class:active={animTab === 'act' && !showLegend}
            onclick={() => { if (showLegend) onToggleLegend(); onTabChange('act'); }}>
            Act{#if npcAnims.length}&nbsp;({npcAnims.length}){/if}
        </button>
        <button class="legend-btn" class:active={showLegend}
            onclick={onToggleLegend} title="Help">
            <img class="legend-btn-img" src="images/infosign.webp" alt="?" />
        </button>
    </div>

    {#if showLegend}
        <AnimationLegend onDismiss={onToggleLegend} />
    {:else}
        <slot {filteredAnims} />
    {/if}
</div>

<style>
    .anim-tabs-wrapper {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
    }

    .anim-tabs {
        display: flex;
        gap: 2px;
        margin-bottom: 6px;
        flex-shrink: 0;
    }

    .anim-tab {
        flex: 1;
        padding: 6px 0;
        border: none;
        border-radius: 7px;
        background: var(--color-surface-subtle);
        color: var(--color-text-muted);
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.15s ease;
        outline: none;
    }

    @media (hover: hover) {
        .anim-tab:hover {
            background: var(--color-surface-hover);
        }
    }

    .anim-tab.active {
        background: var(--color-primary-surface);
        color: var(--color-primary);
    }

    .legend-btn {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid var(--color-border-light);
        background: var(--color-surface-subtle);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.15s ease;
        outline: none;
        align-self: center;
        margin-left: 2px;
        padding: 0;
        overflow: hidden;
    }

    .legend-btn-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    }

    @media (hover: hover) {
        .legend-btn:hover {
            border-color: var(--color-primary-border);
        }
    }

    .legend-btn.active {
        border-color: var(--color-primary-border);
        box-shadow: 0 0 0 1px var(--color-primary-border);
    }
</style>
