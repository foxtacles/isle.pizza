<script>
    import { memoryUnlocks, memoryCompletions } from '../stores.js';
    import { AnimationTitles, CATALOG_OBJECT_IDS, TOTAL_ANIMATIONS } from './multiplayer/animationTitles.js';
    import BackButton from './BackButton.svelte';

    let filter = 'all'; // 'all' | 'unlocked' | 'locked'

    $: unlockCount = $memoryUnlocks.size;
    $: loaded = $memoryCompletions !== null;

    // Group completions by objectId for lookup
    $: completionsByAnim = ($memoryCompletions || []).reduce((map, c) => {
        if (!map[c.objectId]) map[c.objectId] = [];
        map[c.objectId].push(c);
        return map;
    }, {});

    // Build display list from all catalog animations
    $: displayList = CATALOG_OBJECT_IDS.map(objectId => {
        const comps = completionsByAnim[objectId];
        if (comps && comps.length > 0) {
            const sorted = [...comps].sort((a, b) => a.t - b.t);
            return {
                objectId,
                title: AnimationTitles[objectId] || null,
                unlocked: true,
                playCount: comps.length,
                firstPlayed: sorted[0].t,
                lastPlayed: sorted[sorted.length - 1].t,
                participants: sorted[sorted.length - 1].participants || []
            };
        }
        return { objectId, title: AnimationTitles[objectId] || null, unlocked: false, playCount: 0 };
    });

    $: filtered = filter === 'all' ? displayList
        : filter === 'unlocked' ? displayList.filter(a => a.unlocked)
        : displayList.filter(a => !a.unlocked);

    function formatDate(timestamp) {
        if (!timestamp) return '';
        return new Date(timestamp * 1000).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    }
</script>

<div class="page-content" class:loading={!loaded}>
    <BackButton />

    <div class="memories-header">
        <h1 class="memories-title">Nick Brick's Memories</h1>
        <div class="memories-progress">
            <span class="progress-count">{unlockCount}</span>
            <span class="progress-separator">/</span>
            <span class="progress-total">{TOTAL_ANIMATIONS}</span>
        </div>
    </div>

    <div class="memories-subtitle">Help Nick remember what happened on the island.</div>

    <div class="filter-bar">
        <button class="filter-btn" class:active={filter === 'all'} onclick={() => filter = 'all'}>
            All
        </button>
        <button class="filter-btn" class:active={filter === 'unlocked'} onclick={() => filter = 'unlocked'}>
            Unlocked ({unlockCount})
        </button>
        <button class="filter-btn" class:active={filter === 'locked'} onclick={() => filter = 'locked'}>
            Locked ({TOTAL_ANIMATIONS - unlockCount})
        </button>
    </div>

    {#if filtered.length === 0}
        <div class="empty-message">
            {#if filter === 'unlocked'}
                No memories yet. Join a multiplayer room and play some animations!
            {:else}
                No memories to display.
            {/if}
        </div>
    {:else}
        <div class="memories-grid">
            {#each filtered as anim}
                <div class="memory-card" class:unlocked={anim.unlocked}>
                    <div class="card-header">
                        <span class="card-check">{anim.unlocked ? '\u2713' : ''}</span>
                        {#if anim.playCount > 0}
                            <span class="card-plays">{anim.playCount}x</span>
                        {/if}
                    </div>
                    <div class="card-title">
                        {anim.title || `Animation #${anim.objectId}`}
                    </div>
                    {#if anim.unlocked && anim.lastPlayed}
                        <div class="card-date">{formatDate(anim.lastPlayed)}</div>
                    {/if}
                    {#if anim.participants && anim.participants.length > 0}
                        <div class="card-participants">
                            {anim.participants.map(p => p.displayName).join(', ')}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .page-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
    }

    .page-content.loading {
        visibility: hidden;
    }

    .memories-header {
        display: flex;
        align-items: baseline;
        gap: 16px;
        margin-bottom: 4px;
    }

    .memories-title {
        font-family: Arial, sans-serif;
        font-size: 22px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
    }

    .memories-progress {
        font-family: 'Consolas', 'Menlo', monospace;
        font-size: 18px;
    }

    .progress-count {
        color: rgba(76, 175, 80, 0.9);
        font-weight: 700;
    }

    .progress-separator {
        color: rgba(255, 255, 255, 0.25);
        margin: 0 2px;
    }

    .progress-total {
        color: rgba(255, 255, 255, 0.35);
    }

    .memories-subtitle {
        font-family: Arial, sans-serif;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 20px;
    }

    .filter-bar {
        display: flex;
        gap: 6px;
        margin-bottom: 20px;
    }

    .filter-btn {
        padding: 6px 14px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        background: none;
        color: rgba(255, 255, 255, 0.5);
        font-family: Arial, sans-serif;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s;
    }

    .filter-btn:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .filter-btn.active {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.25);
        color: rgba(255, 255, 255, 0.9);
    }

    .empty-message {
        font-family: Arial, sans-serif;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.35);
        text-align: center;
        padding: 40px 20px;
    }

    .memories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 10px;
        width: 100%;
    }

    .memory-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        padding: 12px;
        transition: background 0.15s, border-color 0.15s;
    }

    .memory-card.unlocked {
        border-color: rgba(76, 175, 80, 0.2);
    }

    .memory-card.unlocked:hover {
        background: rgba(76, 175, 80, 0.04);
        border-color: rgba(76, 175, 80, 0.35);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }

    .card-check {
        color: rgba(76, 175, 80, 0.8);
        font-size: 14px;
        font-weight: 700;
    }

    .card-plays {
        font-family: 'Consolas', 'Menlo', monospace;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.25);
    }

    .card-title {
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.75);
        line-height: 1.3;
        margin-bottom: 4px;
    }

    .card-date {
        font-family: Arial, sans-serif;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.3);
    }

    .card-participants {
        font-family: Arial, sans-serif;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.25);
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    @media (max-width: 480px) {
        .memories-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .memories-title {
            font-size: 18px;
        }
    }
</style>
