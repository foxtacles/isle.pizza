<script>
    import { onMount } from 'svelte';
    import { bestAnimTab } from './constants.js';

    export let animations = [];
    export let animTab = 'scene';
    export let onTabChange = (tab) => { animTab = tab; };
    export let onFilteredChange = () => {};

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

<div class="anim-tabs">
    <button class="anim-tab" class:active={animTab === 'scene'}
        onclick={() => onTabChange('scene')}>
        Scene{#if sceneAnims.length}&nbsp;({sceneAnims.length}){/if}
    </button>
    <button class="anim-tab" class:active={animTab === 'act'}
        onclick={() => onTabChange('act')}>
        Act{#if npcAnims.length}&nbsp;({npcAnims.length}){/if}
    </button>
</div>

<slot {filteredAnims} />

<style>
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
</style>
