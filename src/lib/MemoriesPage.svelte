<script>
    import { memoryUnlocks, memoryCompletions } from '../stores.js';
    import { buildingThumbnails, actorThumbnails } from '../core/thumbnails.js';
    import { AnimationTitles, AnimationLocations, LocationLabels, CATALOG_OBJECT_IDS, TOTAL_ANIMATIONS } from './multiplayer/animationCatalog.js';
    import { ActorDisplayNames } from '../core/savegame/actorConstants.js';
    import BackButton from './BackButton.svelte';

    let filter = 'all';
    let selectedLocation = null;
    let introOpen = true;

    $: unlockCount = $memoryUnlocks.size;
    $: loaded = $memoryCompletions !== null;
    $: progressPct = TOTAL_ANIMATIONS > 0 ? Math.round((unlockCount / TOTAL_ANIMATIONS) * 100) : 0;

    // Group completions by objectId for lookup
    $: completionsByAnim = ($memoryCompletions || []).reduce((map, c) => {
        if (!map[c.objectId]) map[c.objectId] = [];
        map[c.objectId].push(c);
        return map;
    }, {});

    // Pass completionsByAnim explicitly so Svelte detects the reactive dependency
    $: locationGroups = buildLocationGroups(completionsByAnim);

    function buildLocationGroups(comps) {
        const groups = {};
        for (const objectId of CATALOG_OBJECT_IDS) {
            const locId = AnimationLocations[objectId];
            const label = locId != null ? (LocationLabels[locId] || `Location ${locId}`) : 'Island';
            if (!groups[label]) groups[label] = [];
            groups[label].push(buildEntry(objectId, comps));
        }
        return Object.keys(groups).map(label => {
            const anims = groups[label];
            const unlocked = anims.filter(a => a.unlocked).length;
            return { label, anims, unlocked, total: anims.length };
        }).sort((a, b) => {
            const ratioA = a.total > 0 ? a.unlocked / a.total : 0;
            const ratioB = b.total > 0 ? b.unlocked / b.total : 0;
            if (ratioB !== ratioA) return ratioB - ratioA;
            return a.label.localeCompare(b.label);
        });
    }

    function buildEntry(objectId, comps) {
        const c = comps[objectId];
        if (c && c.length > 0) {
            const sorted = [...c].sort((a, b) => b.t - a.t); // newest first
            return {
                objectId,
                title: AnimationTitles[objectId] || null,
                unlocked: true,
                completions: sorted.map(comp => ({
                    eventId: comp.eventId,
                    timestamp: comp.t,
                    participants: comp.participants || []
                }))
            };
        }
        return { objectId, title: AnimationTitles[objectId] || null, unlocked: false };
    }

    $: selectedGroup = selectedLocation
        ? locationGroups.find(g => g.label === selectedLocation)
        : null;

    // Reactive so filter changes trigger re-evaluation
    $: displayAnims = selectedGroup ? filterAnims(selectedGroup.anims, filter) : [];

    function filterAnims(anims, currentFilter) {
        let result = anims;
        if (currentFilter === 'unlocked') result = anims.filter(a => a.unlocked);
        else if (currentFilter === 'locked') result = anims.filter(a => !a.unlocked);
        return [...result].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));
    }

    function selectLocation(label) {
        if (selectedLocation === label) {
            selectedLocation = null;
        } else {
            selectedLocation = label;
            filter = 'all';
        }
    }

    function formatDate(timestamp) {
        if (!timestamp) return '';
        const d = new Date(timestamp * 1000);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let relative;
        if (diffMins < 1) relative = 'Just now';
        else if (diffMins < 60) relative = `${diffMins}m ago`;
        else if (diffHours < 24) relative = `${diffHours}h ago`;
        else if (diffDays < 7) relative = `${diffDays}d ago`;
        else relative = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        return `${relative} · ${time}`;
    }

    function locPct(group) {
        return group.total > 0 ? (group.unlocked / group.total * 100) : 0;
    }
</script>

<div class="page-content" class:loading={!loaded}>
    <BackButton />

    <!-- Hero -->
    <div class="hero">
        <img class="hero-avatar" src="images/nick_closeup.webp" alt="Nick Brick" />
        <div class="hero-text">
            <h1>Nick Brick's Memories</h1>
            <p class="hero-subtitle">Help Nick remember what happened on the island.</p>
        </div>
        <div class="hero-progress">
            <span class="progress-num">{unlockCount}</span>
            <span class="progress-sep">/</span>
            <span class="progress-den">{TOTAL_ANIMATIONS}</span>
        </div>
    </div>
    <div class="progress-track">
        <div class="progress-fill" style="width: {progressPct}%"></div>
    </div>

    <!-- Introduction -->
    <button class="intro-toggle" onclick={() => introOpen = !introOpen}>
        <span class="intro-toggle-label">How does this work?</span>
        <span class="intro-toggle-arrow" class:open={introOpen}></span>
    </button>
    {#if introOpen}
        <div class="intro">
            <p class="intro-text">
                Join a multiplayer room and explore LEGO Island together to reenact the original
                in-game animations. Each animation needs specific characters to perform it and a
                spectator to trigger it — so you always need at least two players. When an animation
                plays successfully, it's saved as a memory for everyone involved.
            </p>
            <div class="intro-steps">
                <div class="intro-step">
                    <span class="step-num">1</span>
                    <span class="step-text">Create or join a room from the <a href="#multiplayer">Multiplayer page</a></span>
                </div>
                <div class="intro-step">
                    <span class="step-num">2</span>
                    <span class="step-text">Visit locations on the island and browse available animations from the hotbar</span>
                </div>
                <div class="intro-step">
                    <span class="step-num">3</span>
                    <span class="step-text">Mark interest in an animation and wait for other players to fill the required roles</span>
                </div>
                <div class="intro-step">
                    <span class="step-num">4</span>
                    <span class="step-text">Collect all {TOTAL_ANIMATIONS} memories across the island</span>
                </div>
            </div>
        </div>
    {/if}

    <!-- Location Grid -->
    <div class="loc-grid">
        {#each locationGroups as group}
            <button
                class="loc-card"
                class:selected={selectedLocation === group.label}
                class:has-unlocks={group.unlocked > 0}
                onclick={() => selectLocation(group.label)}
            >
                <div class="loc-thumb">
                    {#if $buildingThumbnails[group.label]}
                        <img src={$buildingThumbnails[group.label]} alt={group.label} />
                    {:else}
                        <div class="thumb-spinner loc-spinner"></div>
                    {/if}
                </div>
                <div class="loc-info">
                    <span class="loc-name">{group.label}</span>
                    <div class="loc-progress-row">
                        <div class="loc-bar-track">
                            <div class="loc-bar-fill" style="width: {locPct(group)}%"></div>
                        </div>
                        <span class="loc-count">{group.unlocked}/{group.total}</span>
                    </div>
                </div>
            </button>
        {/each}
    </div>

    <!-- Detail Panel -->
    {#if selectedGroup}
        <div class="detail">
            <div class="detail-head">
                <h2>{selectedGroup.label}</h2>
                <span class="detail-count">{selectedGroup.unlocked}/{selectedGroup.total}</span>
                <div class="detail-filters">
                    <button class="filter-btn" class:active={filter === 'all'} onclick={() => filter = 'all'}>All</button>
                    <button class="filter-btn" class:active={filter === 'unlocked'} onclick={() => filter = 'unlocked'}>Unlocked</button>
                    <button class="filter-btn" class:active={filter === 'locked'} onclick={() => filter = 'locked'}>Locked</button>
                </div>
            </div>

            {#if displayAnims.length === 0}
                <div class="empty">
                    {#if filter === 'unlocked'}
                        No memories unlocked here yet.
                    {:else if filter === 'locked'}
                        All memories here are unlocked!
                    {:else}
                        No animations found.
                    {/if}
                </div>
            {:else}
                <div class="anim-list">
                    {#each displayAnims as anim}
                        <div class="anim-group" class:unlocked={anim.unlocked}>
                            <!-- Animation header -->
                            <div class="anim-header">
                                <span class="anim-icon">{anim.unlocked ? '\u2713' : '?'}</span>
                                <span class="anim-title">{anim.title || `Animation #${anim.objectId}`}</span>
                                {#if anim.completions}
                                    <span class="anim-count">{anim.completions.length}x</span>
                                {/if}
                            </div>

                            <!-- Completion cards (one per play) -->
                            {#if anim.completions}
                                <div class="completions">
                                    {#each anim.completions as comp}
                                        <div class="comp-card">
                                            <div class="comp-roster">
                                                {#each comp.participants as p, idx}
                                                    <div class="comp-participant" class:self={idx === 0}>
                                                        <div class="participant-avatar">
                                                            {#if $actorThumbnails[p.charIndex]}
                                                                <img src={$actorThumbnails[p.charIndex]} alt={ActorDisplayNames[p.charIndex]} />
                                                            {:else}
                                                                <div class="thumb-spinner participant-spinner"></div>
                                                            {/if}
                                                        </div>
                                                        <span class="participant-player">{p.displayName}</span>
                                                        <span class="participant-char">as {ActorDisplayNames[p.charIndex] || `#${p.charIndex}`}</span>
                                                    </div>
                                                {/each}
                                            </div>
                                            <div class="comp-meta">
                                                <span class="comp-date">{formatDate(comp.timestamp)}</span>
                                                <a class="comp-share" href="#memory/{comp.eventId}" title="Share">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .page-content {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        max-width: 720px;
        margin: 0 auto;
        padding: 0 12px;
        box-sizing: border-box;
    }

    .page-content :global(*) {
        box-sizing: border-box;
    }

    .page-content.loading {
        visibility: hidden;
    }

    .page-content a {
        color: var(--color-primary);
        text-decoration: none;
    }

    .page-content a:hover {
        text-decoration: underline;
    }

    /* --- Hero --- */
    .hero {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 0 8px;
    }

    .hero-avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        object-fit: cover;
        image-rendering: pixelated;
        border: 2px solid var(--color-primary);
        flex-shrink: 0;
        box-shadow: var(--shadow-glow);
    }

    .hero-text {
        flex: 1;
        min-width: 0;
    }

    .hero-text h1 {
        font-size: 1.05em;
        font-weight: 700;
        color: var(--color-text-light);
        margin: 0;
        line-height: 1.2;
    }

    .hero-subtitle {
        font-size: 0.75em;
        color: var(--color-text-muted);
        margin: 2px 0 0;
    }

    .hero-progress {
        font-family: 'Consolas', 'Menlo', monospace;
        font-size: 14px;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .progress-num {
        color: var(--color-primary);
        font-weight: 700;
    }

    .progress-sep {
        color: var(--color-text-muted);
        margin: 0 1px;
    }

    .progress-den {
        color: var(--color-text-muted);
    }

    .progress-track {
        height: 4px;
        background: var(--color-border-dark);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 12px;
    }

    .progress-fill {
        height: 100%;
        background: var(--color-primary);
        border-radius: 2px;
        transition: width 0.4s ease;
    }

    /* --- Introduction --- */
    .intro-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 0;
        margin-bottom: 4px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.75em;
        color: var(--color-text-muted);
        transition: color 0.15s;
    }

    .intro-toggle:hover {
        color: var(--color-text-medium);
    }

    .intro-toggle-label {
        text-decoration: underline;
        text-decoration-color: var(--color-border-dark);
        text-underline-offset: 2px;
    }

    .intro-toggle-arrow {
        display: inline-block;
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid currentColor;
        transition: transform 0.15s;
    }

    .intro-toggle-arrow.open {
        transform: rotate(180deg);
    }

    .intro {
        padding: 12px 14px;
        margin-bottom: 12px;
        background: var(--gradient-panel);
        border: 1px solid var(--color-border-dark);
        border-radius: 8px;
    }

    .intro-text {
        font-size: 0.8em;
        line-height: 1.5;
        color: var(--color-text-medium);
        margin: 0 0 10px;
    }

    .intro-steps {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .intro-step {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .step-num {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--color-primary-glow);
        color: var(--color-primary);
        font-family: 'Consolas', 'Menlo', monospace;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .step-text {
        font-size: 0.8em;
        color: var(--color-text-medium);
    }

    /* --- Location Grid --- */
    .loc-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 8px;
    }

    .loc-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px 8px 8px;
        background: var(--gradient-panel);
        border: 1px solid var(--color-border-dark);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
        box-shadow: var(--shadow-sm);
    }

    .loc-card:hover {
        background: var(--gradient-hover);
        border-color: var(--color-border-medium);
    }

    .loc-card.selected {
        border-color: var(--color-primary);
        box-shadow: var(--shadow-glow);
    }

    .loc-card.has-unlocks .loc-name {
        color: var(--color-primary);
    }

    .loc-thumb {
        width: 72px;
        height: 72px;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loc-thumb img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .loc-spinner {
        width: 24px;
        height: 24px;
    }

    .loc-info {
        width: 100%;
        text-align: center;
    }

    .loc-name {
        font-size: 0.75em;
        font-weight: 600;
        color: var(--color-text-medium);
        display: block;
        margin-bottom: 4px;
    }

    .loc-progress-row {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .loc-bar-track {
        flex: 1;
        height: 3px;
        background: var(--color-border-dark);
        border-radius: 2px;
        overflow: hidden;
    }

    .loc-bar-fill {
        height: 100%;
        background: var(--color-primary);
        border-radius: 2px;
        transition: width 0.3s;
    }

    .loc-count {
        font-family: 'Consolas', 'Menlo', monospace;
        font-size: 10px;
        color: var(--color-text-muted);
        white-space: nowrap;
    }

    /* --- Detail Panel --- */
    .detail {
        margin-top: 8px;
        padding: 12px;
        background: var(--gradient-panel);
        border: 1px solid var(--color-border-dark);
        border-radius: 8px;
        box-shadow: var(--shadow-sm);
    }

    .detail-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        flex-wrap: wrap;
    }

    .detail-head h2 {
        font-size: 0.9em;
        font-weight: 700;
        color: var(--color-text-light);
        margin: 0;
    }

    .detail-count {
        font-family: 'Consolas', 'Menlo', monospace;
        font-size: 11px;
        color: var(--color-text-muted);
    }

    .detail-filters {
        display: flex;
        gap: 4px;
        margin-left: auto;
    }

    .filter-btn {
        padding: 4px 10px;
        border: 1px solid var(--color-border-dark);
        border-radius: 12px;
        background: none;
        color: var(--color-text-muted);
        font-size: 0.75em;
        cursor: pointer;
        transition: all 0.15s;
    }

    .filter-btn:hover {
        background: var(--color-bg-panel);
        border-color: var(--color-border-medium);
        color: var(--color-text-medium);
    }

    .filter-btn.active {
        background: var(--color-primary-glow);
        border-color: var(--color-primary);
        color: var(--color-primary);
    }

    .empty {
        font-size: 0.8em;
        color: var(--color-text-muted);
        text-align: center;
        padding: 20px 12px;
    }

    /* --- Animation List --- */
    .anim-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .anim-group {
        border-bottom: 1px solid var(--color-border-dark);
    }

    .anim-group:last-child {
        border-bottom: none;
    }

    .anim-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 4px;
    }

    .anim-icon {
        width: 16px;
        font-size: 12px;
        font-weight: 700;
        text-align: center;
        color: var(--color-border-dark);
        flex-shrink: 0;
    }

    .anim-group.unlocked .anim-icon {
        color: var(--color-primary);
    }

    .anim-title {
        flex: 1;
        font-size: 0.8em;
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .anim-group.unlocked .anim-title {
        color: var(--color-text-light);
    }

    .anim-count {
        font-family: 'Consolas', 'Menlo', monospace;
        font-size: 10px;
        color: var(--color-text-muted);
        flex-shrink: 0;
    }

    /* --- Completion Cards --- */
    .completions {
        display: flex;
        flex-direction: column;
        padding: 0 0 8px 28px;
        gap: 6px;
    }

    .comp-card {
        padding: 8px 10px;
        border-radius: 6px;
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-dark);
    }

    .comp-roster {
        display: flex;
        flex-direction: column;
    }

    .comp-participant {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
    }

    .comp-participant.self {
        border-left: 2px solid var(--color-primary);
        padding-left: 8px;
        margin-left: -10px;
    }

    .comp-participant.self .participant-player {
        color: var(--color-primary);
    }

    .comp-participant.self .participant-avatar {
        box-shadow: 0 0 0 1.5px var(--color-primary);
    }

    .participant-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--color-bg-input);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .participant-avatar img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .participant-spinner {
        width: 12px;
        height: 12px;
    }

    .participant-player {
        font-size: 0.75em;
        font-weight: 600;
        color: var(--color-text-light);
        white-space: nowrap;
        flex-shrink: 0;
    }

    .participant-char {
        font-size: 0.7em;
        color: var(--color-text-muted);
        margin-left: auto;
        text-align: right;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
    }

    .comp-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 4px;
        margin-top: 2px;
    }

    .comp-date {
        font-size: 0.65em;
        color: var(--color-text-muted);
        white-space: nowrap;
    }

    .comp-share {
        color: var(--color-text-muted);
        opacity: 0.4;
        transition: all 0.15s;
        display: flex;
        align-items: center;
    }

    .comp-share:hover {
        opacity: 1;
        color: var(--color-primary);
        text-decoration: none;
    }

    /* --- Responsive --- */
    @media (max-width: 480px) {
        .hero-text h1 {
            font-size: 0.9em;
        }

        .hero-avatar {
            width: 48px;
            height: 48px;
        }

        .loc-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
        }

        .loc-thumb {
            width: 60px;
            height: 60px;
        }

        .detail-filters {
            margin-left: 0;
            width: 100%;
        }

        .completions {
            padding-left: 16px;
        }

        .participant-char {
            display: none;
        }

        .participant-avatar {
            width: 24px;
            height: 24px;
        }
    }
</style>
