<script>
    import { CharacterNameMap } from '../../core/savegame/actorConstants.js';
    import { AnimationTitles } from './animationTitles.js';

    export let animations = [];
    export let currentInterest = null;
    export let onToggleInterest = () => {};

    // Build sort order from CharacterNameMap keys (same order as g_characters[])
    const charSortOrder = Object.fromEntries(Object.keys(CharacterNameMap).map((name, i) => [name, i]));

    function missingCount(anim) {
        return anim.slots.filter(s => !s.filled).length;
    }

    // Lowest g_characters index across all slot names (for grouping by character)
    function charOrder(anim) {
        let best = 9999;
        for (const slot of anim.slots) {
            for (const name of slot.names) {
                const order = charSortOrder[name];
                if (order !== undefined && order < best) best = order;
            }
        }
        return best;
    }

    $: sorted = [...animations].sort((a, b) => {
        if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
        const ma = missingCount(a), mb = missingCount(b);
        if (ma !== mb) return ma - mb;
        if (a.slots.length !== b.slots.length) return a.slots.length - b.slots.length;
        return charOrder(a) - charOrder(b);
    });

    function formatNeeds(slots) {
        const named = [];
        let anyCount = 0;
        for (const s of slots) {
            if (s.filled) continue;
            if (s.names.length === 1 && s.names[0] === 'any') {
                anyCount++;
            } else {
                named.push(s.names.map(n => CharacterNameMap[n] || n).join(' or '));
            }
        }
        if (anyCount) named.push(anyCount === 1 ? '+1 player' : `+${anyCount} players`);
        return named.join(', ');
    }
</script>

<div class="anim-panel">
    <div class="anim-list">
        {#each sorted as anim (anim.animIndex)}
            <button class="anim-row"
                class:eligible={anim.eligible}
                class:interested={currentInterest === anim.animIndex}
                class:dimmed={!anim.eligible && !anim.atLocation}
                onclick={() => onToggleInterest(anim.animIndex)}>
                <div class="row-left">
                    <span class="anim-name">{AnimationTitles[anim.objectId] || anim.name}</span>
                    {#if anim.eligible}
                        <span class="anim-sub ready-text">Ready</span>
                    {:else if anim.atLocation}
                        <span class="anim-sub needs-text">{formatNeeds(anim.slots)}</span>
                    {/if}
                </div>
                <span class="slot-dots">
                    {#each [...anim.slots].sort((a, b) => (b.filled ? 1 : 0) - (a.filled ? 1 : 0)) as slot}
                        <span class="dot" class:filled={slot.filled}></span>
                    {/each}
                </span>
            </button>
        {:else}
            <div class="empty">Explore the island to discover scenes</div>
        {/each}
    </div>
</div>

<style>
    .anim-panel {
        width: 300px;
        font-family: Arial, sans-serif;
    }

    .anim-list {
        max-height: 240px;
        overflow-y: auto;
        overscroll-behavior: contain;
        touch-action: pan-y;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
    }

    .anim-list::-webkit-scrollbar {
        width: 4px;
    }

    .anim-list::-webkit-scrollbar-track {
        background: transparent;
    }

    .anim-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.12);
        border-radius: 2px;
    }

    .anim-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 5px 6px;
        background: none;
        border: none;
        border-left: 3px solid transparent;
        cursor: pointer;
        transition: background 0.12s ease;
        text-align: left;
        font-family: inherit;
        outline: none;
        box-sizing: border-box;
    }

    .anim-row + .anim-row {
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    @media (hover: hover) {
        .anim-row:hover {
            background: rgba(255, 255, 255, 0.06);
        }
    }

    .anim-row.eligible {
        border-left-color: rgba(76, 175, 80, 0.5);
    }

    .anim-row.interested {
        border-left-color: var(--color-primary);
        background: rgba(255, 215, 0, 0.06);
    }

    .anim-row.dimmed {
        opacity: 0.4;
    }

    .row-left {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
        flex: 1;
    }

    .anim-name {
        font-size: 11px;
        font-weight: 600;
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .anim-sub {
        font-size: 10px;
        line-height: 1.2;
    }

    .ready-text {
        color: rgba(76, 175, 80, 0.85);
    }

    .needs-text {
        color: var(--color-text-muted);
        opacity: 0.55;
    }

    .slot-dots {
        display: flex;
        align-items: center;
        gap: 3px;
        flex-shrink: 0;
        margin-left: 8px;
    }

    .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .dot.filled {
        background: rgba(76, 175, 80, 0.7);
        border-color: rgba(76, 175, 80, 0.85);
    }

    .interested .dot.filled {
        background: rgba(255, 215, 0, 0.7);
        border-color: rgba(255, 215, 0, 0.85);
    }

    .empty {
        padding: 12px; text-align: center;
        font-size: 11px; color: var(--color-text-muted); opacity: 0.4;
    }
</style>
