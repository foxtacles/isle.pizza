<script>
    import { memoryUnlocks, memoryCompletions } from '../stores.js';
    import { buildingThumbnails, actorThumbnails } from '../core/thumbnails.js';
    import { AnimationTitles, AnimationLocations, LocationLabels, CATALOG_OBJECT_IDS, TOTAL_ANIMATIONS } from './multiplayer/animationCatalog.js';
    import { ActorDisplayNames } from '../core/savegame/actorConstants.js';
    import BackButton from './BackButton.svelte';

    let filter = 'all';
    let selectedLocation = null;
    let introOpen = false;
    let expandedAnims = new Set();
    let showAllComps = new Set();
    const COMP_CAP = 5;

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
        }).sort((a, b) => a.label.localeCompare(b.label));
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

    function toggleSet(current, key) {
        const next = new Set(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
    }

    function toggleAnim(objectId) {
        expandedAnims = toggleSet(expandedAnims, objectId);
    }

    function toggleShowAll(objectId) {
        showAllComps = toggleSet(showAllComps, objectId);
    }

    function visibleCompletions(anim) {
        if (!anim.completions) return [];
        if (showAllComps.has(anim.objectId)) return anim.completions;
        return anim.completions.slice(0, COMP_CAP);
    }

    function formatDateShort(timestamp, now) {
        if (!timestamp) return '';
        const d = new Date(timestamp * 1000);
        const diffMs = (now || Date.now()) - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function formatDateFull(timestamp) {
        if (!timestamp) return '';
        const d = new Date(timestamp * 1000);
        const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        return `${date} \u00b7 ${time}`;
    }

    function locPct(group) {
        return group.total > 0 ? (group.unlocked / group.total * 100) : 0;
    }
</script>

{#snippet avatarStack(participants)}
    <div class="comp-avatars">
        {#each participants as p, idx}
            <div
                class="comp-av"
                class:self={idx === 0}
                title="{p.displayName} as {ActorDisplayNames[p.charIndex] || `#${p.charIndex}`}"
            >
                {#if $actorThumbnails[p.charIndex]}
                    <img src={$actorThumbnails[p.charIndex]} alt={ActorDisplayNames[p.charIndex]} />
                {:else}
                    <span class="comp-av-fallback">{(ActorDisplayNames[p.charIndex] || '?')[0]}</span>
                {/if}
            </div>
        {/each}
    </div>
{/snippet}

<div class="page-content" class:loading={!loaded}>
    <BackButton />
    <div class="page-inner-content memories-inner">

    <!-- Hero -->
    <div class="hero">
        <img class="hero-avatar" src="images/nick_closeup.webp" alt="Nick Brick" />
        <div class="hero-text">
            <h1>Nick Brick's Memories</h1>
            <div class="hero-meta">
                <span class="hero-subtitle">Help Nick remember what happened on the island.</span>
                <span class="hero-progress">
                    <span class="progress-num">{unlockCount}</span>
                    <span class="progress-sep">/</span>
                    <span class="progress-den">{TOTAL_ANIMATIONS}</span>
                </span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: {progressPct}%"></div>
            </div>
        </div>
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
                    <span class="step-text">Explore the island and browse available animations from the hotbar</span>
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
                        {@const now = Date.now()}
                        <div class="anim-group" class:unlocked={anim.unlocked}>
                            <!-- Animation header (clickable for unlocked) -->
                            <button
                                class="anim-header"
                                class:expandable={anim.unlocked}
                                onclick={() => anim.unlocked && toggleAnim(anim.objectId)}
                            >
                                <span class="anim-icon">{anim.unlocked ? '\u2713' : '?'}</span>
                                <span class="anim-title">{anim.title || `Animation #${anim.objectId}`}</span>
                                {#if anim.completions}
                                    <div class="anim-preview">
                                        {@render avatarStack(anim.completions[0].participants)}
                                        <span class="anim-meta">{anim.completions.length}x &middot; {formatDateShort(anim.completions[0].timestamp, now)}</span>
                                    </div>
                                    <span class="anim-chevron" class:open={expandedAnims.has(anim.objectId)}></span>
                                {/if}
                            </button>

                            <!-- Expanded completion rows -->
                            {#if anim.completions && expandedAnims.has(anim.objectId)}
                                <div class="completions">
                                    {#each visibleCompletions(anim) as comp}
                                        <div class="comp-row">
                                            {@render avatarStack(comp.participants)}
                                            <div class="comp-names">
                                                {#each comp.participants as p, idx}
                                                    {#if idx < 3}
                                                        {#if idx > 0}<span class="comp-sep">&middot;</span>{/if}
                                                        <span class="comp-name" class:self={idx === 0}>
                                                            {p.displayName}
                                                            {#if idx === 0}
                                                                <span class="comp-char">as {ActorDisplayNames[p.charIndex] || `#${p.charIndex}`}</span>
                                                            {/if}
                                                        </span>
                                                    {/if}
                                                {/each}
                                                {#if comp.participants.length > 3}
                                                    <span class="comp-more">+{comp.participants.length - 3}</span>
                                                {/if}
                                            </div>
                                            <div class="comp-end">
                                                <span class="comp-time" title={formatDateFull(comp.timestamp)}>{formatDateShort(comp.timestamp, now)}</span>
                                                <a class="comp-link" href="#memory/{comp.eventId}" title="Share" onclick={e => e.stopPropagation()}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    {/each}
                                    {#if anim.completions.length > COMP_CAP && !showAllComps.has(anim.objectId)}
                                        <button class="comp-show-more" onclick={() => toggleShowAll(anim.objectId)}>
                                            Show {anim.completions.length - COMP_CAP} more
                                        </button>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
    </div>
</div>

<style>
    .page-content.loading {
        visibility: hidden;
    }

    .memories-inner {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        text-align: left;
    }

    /* --- Hero --- */
    .hero {
        display: flex;
        align-items: center;
        gap: 14px;
        padding-bottom: 8px;
    }

    .hero-avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
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

    .hero-meta {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-top: 2px;
    }

    .hero-subtitle {
        font-size: 0.75em;
        color: var(--color-text-muted);
    }

    .hero-progress {
        font-family: 'Consolas', 'Menlo', monospace;
        font-size: 11px;
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
        height: 3px;
        background: var(--color-border-dark);
        border-radius: 2px;
        overflow: hidden;
        margin-top: 6px;
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
        font: inherit;
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
        grid-template-columns: repeat(5, 1fr);
        gap: 6px;
        margin-bottom: 8px;
    }

    .loc-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 6px 6px;
        background: var(--gradient-panel);
        border: 1px solid var(--color-border-dark);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        box-shadow: var(--shadow-sm);
        font: inherit;
        color: inherit;
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
        width: 68px;
        height: 68px;
        border-radius: 5px;
        overflow: hidden;
        margin-bottom: 4px;
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
        width: 20px;
        height: 20px;
    }

    .loc-info {
        width: 100%;
        text-align: center;
    }

    .loc-name {
        font-size: 0.7em;
        font-weight: 600;
        color: var(--color-text-medium);
        display: block;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .loc-progress-row {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .loc-bar-track {
        flex: 1;
        height: 2px;
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
        font-size: 9px;
        color: var(--color-text-muted);
        white-space: nowrap;
    }

    /* --- Detail Panel --- */
    .detail {
        margin-top: 8px;
        padding: 4px 0;
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
        gap: 12px;
        margin-left: auto;
    }

    .filter-btn {
        padding: 2px 0;
        border: none;
        background: none;
        font: inherit;
        color: var(--color-text-muted);
        font-size: 0.75em;
        cursor: pointer;
        transition: color 0.15s;
        border-bottom: 1.5px solid transparent;
    }

    .filter-btn:hover {
        color: var(--color-text-medium);
    }

    .filter-btn.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
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
        width: 100%;
        background: none;
        border: none;
        font: inherit;
        color: inherit;
        cursor: default;
        text-align: left;
        border-radius: 4px;
        transition: background 0.12s;
    }

    .anim-header.expandable {
        cursor: pointer;
    }

    .anim-header.expandable:hover {
        background: rgba(255, 255, 255, 0.03);
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
        color: rgba(76, 175, 80, 0.7);
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
        color: var(--color-text-medium);
    }

    .anim-preview {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .anim-meta {
        font-size: 0.7em;
        color: var(--color-text-muted);
        white-space: nowrap;
    }

    .anim-chevron {
        display: inline-block;
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid var(--color-text-muted);
        flex-shrink: 0;
        transition: transform 0.15s;
        transform: rotate(-90deg);
    }

    .anim-chevron.open {
        transform: rotate(0deg);
    }

    /* --- Avatar Stack (shared by header + completion rows) --- */
    .comp-avatars {
        display: flex;
        flex-shrink: 0;
    }

    .comp-av {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--color-bg-input);
        border: 1.5px solid var(--color-bg-elevated);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .comp-av + .comp-av {
        margin-left: -8px;
    }

    .comp-av.self {
        border-color: var(--color-primary);
        z-index: 1;
    }

    .comp-av img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .comp-av-fallback {
        font-size: 10px;
        font-weight: 700;
        color: var(--color-text-muted);
        text-transform: uppercase;
    }

    /* --- Completion Rows --- */
    .completions {
        display: flex;
        flex-direction: column;
        padding: 0 0 6px 28px;
    }

    .comp-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 5px 0;
        min-height: 32px;
    }

    .comp-row + .comp-row {
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .comp-names {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: baseline;
        overflow: hidden;
        white-space: nowrap;
    }

    .comp-name {
        font-size: 0.72em;
        color: var(--color-text-medium);
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .comp-name.self {
        color: var(--color-primary);
        font-weight: 600;
    }

    .comp-char {
        font-size: 0.9em;
        color: var(--color-text-muted);
        font-weight: 400;
        margin-left: 3px;
    }

    .comp-sep {
        color: var(--color-text-muted);
        margin: 0 5px;
        flex-shrink: 0;
        font-size: 0.72em;
    }

    .comp-more {
        font-size: 0.68em;
        color: var(--color-text-muted);
        margin-left: 5px;
        flex-shrink: 0;
    }

    .comp-end {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        margin-left: auto;
    }

    .comp-time {
        font-size: 0.65em;
        color: var(--color-text-muted);
        white-space: nowrap;
    }

    .comp-link {
        color: var(--color-text-muted);
        opacity: 0;
        transition: opacity 0.15s;
        display: flex;
        align-items: center;
        padding: 4px;
    }

    .comp-row:hover .comp-link {
        opacity: 0.5;
    }

    .comp-link:hover {
        opacity: 1;
        color: var(--color-primary);
        text-decoration: none;
    }

    .comp-show-more {
        background: none;
        border: none;
        font: inherit;
        color: var(--color-text-muted);
        font-size: 0.7em;
        cursor: pointer;
        padding: 6px 0;
        text-align: center;
        transition: color 0.15s;
    }

    .comp-show-more:hover {
        color: var(--color-primary);
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
            grid-template-columns: repeat(3, 1fr);
        }

        .loc-thumb {
            width: 48px;
            height: 48px;
        }

        .detail-filters {
            margin-left: 0;
            width: 100%;
        }

        .completions {
            padding-left: 16px;
        }

        .comp-av {
            width: 20px;
            height: 20px;
        }

        .comp-av + .comp-av {
            margin-left: -6px;
        }

        .comp-char {
            display: none;
        }

        .comp-link {
            opacity: 0.4;
        }

        .comp-row {
            gap: 8px;
        }

        .anim-meta {
            display: none;
        }
    }
</style>
