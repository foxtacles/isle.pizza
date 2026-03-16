<script>
    import { onMount, onDestroy } from 'svelte';
    import { gameRunning, multiplayerRoom, multiplayerPlayerCount, thirdPersonEnabled, showNameBubbles, allowCustomize } from '../../stores.js';
    import { keepVisible } from '../../core/keep-visible.js';
    import { emoteOptions, walkOptions, idleOptions, settingsItems } from './constants.js';
    import MultiplayerHotbar from './MultiplayerHotbar.svelte';
    import MultiplayerFab from './MultiplayerFab.svelte';
    import EmoteFan from './EmoteFan.svelte';
    import ConfigDrawer from './ConfigDrawer.svelte';
    import PeopleIcon from './PeopleIcon.svelte';

    let selectedWalk = 0;
    let selectedIdle = 0;
    let activeEmote = -1;
    let badgeBump = false;
    let shareFeedback = '';
    let prevPlayerCount = null;
    let isDesktop = false;

    // Mobile state
    let fanOpen = false;
    let drawerOpen = false;

    const timers = {};
    onDestroy(() => Object.values(timers).forEach(clearTimeout));

    function flash(key, duration, onExpire) {
        clearTimeout(timers[key]);
        timers[key] = setTimeout(onExpire, duration);
    }

    // Media query for desktop/mobile switch
    let mql;
    function handleMediaChange(e) {
        isDesktop = e.matches;
        // Close mobile UI when switching to desktop
        if (isDesktop) {
            fanOpen = false;
            drawerOpen = false;
        }
    }

    onMount(() => {
        mql = window.matchMedia('(min-width: 481px)');
        isDesktop = mql.matches;
        mql.addEventListener('change', handleMediaChange);
    });

    onDestroy(() => {
        mql?.removeEventListener('change', handleMediaChange);
    });

    $: disabled = $multiplayerPlayerCount == null;

    // Close mobile UI when leaving Isle world
    $: if ($multiplayerPlayerCount == null) {
        fanOpen = false;
        drawerOpen = false;
    }

    // Badge pulse when player count changes
    $: {
        if (prevPlayerCount !== null && $multiplayerPlayerCount !== null && $multiplayerPlayerCount !== prevPlayerCount) {
            badgeBump = true;
            flash('badge', 400, () => { badgeBump = false; });
        }
        prevPlayerCount = $multiplayerPlayerCount;
    }

    $: settingsState = { thirdPersonCam: $thirdPersonEnabled, showNameBubbles: $showNameBubbles, allowCustomize: $allowCustomize };

    function refocusCanvas() {
        document.getElementById('canvas')?.focus();
    }

    function selectWalk(index) {
        selectedWalk = index;
        window.Module?._mp_set_walk_animation?.(walkOptions[index].id);
    }

    function selectIdle(index) {
        selectedIdle = index;
        window.Module?._mp_set_idle_animation?.(idleOptions[index].id);
    }

    function triggerEmote(index) {
        window.Module?._mp_trigger_emote?.(index);
        activeEmote = index;
        flash('emote', 300, () => { activeEmote = -1; });
    }

    function showShareFeedback(msg) {
        shareFeedback = msg;
        flash('share', 2000, () => { shareFeedback = ''; });
    }

    async function handleShare() {
        const url = `${window.location.origin}${window.location.pathname}#r/${$multiplayerRoom}`;
        if (navigator.share && matchMedia('(pointer: coarse)').matches) {
            try {
                await navigator.share({ text: "Let's play LEGO Island together!", url });
                showShareFeedback('Shared!');
            } catch { /* user cancelled */ }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                showShareFeedback('Link copied!');
            } catch { /* ignore */ }
        }
    }

    // Mobile: FAB tap
    function handleFabClick() {
        if (disabled) return;
        if (drawerOpen) {
            drawerOpen = false;
            refocusCanvas();
        } else {
            fanOpen = !fanOpen;
            if (!fanOpen) refocusCanvas();
        }
    }

    // Mobile: emote from fan
    function handleFanEmote(index) {
        triggerEmote(index);
        // Brief delay so the flash is visible, then close
        flash('fan-close', 200, () => { fanOpen = false; });
    }

    // Mobile: gear button in fan → open drawer
    function handleFanGear() {
        fanOpen = false;
        drawerOpen = true;
    }

    // Mobile: close drawer
    function handleCloseDrawer() {
        drawerOpen = false;
        refocusCanvas();
    }

    // Mobile: close fan
    function handleCloseFan() {
        fanOpen = false;
        refocusCanvas();
    }
</script>

{#if $gameRunning && $multiplayerRoom}
    <div use:keepVisible>
        {#if isDesktop}
            <!-- Desktop: hotbar always in DOM so it can animate in/out -->
            <MultiplayerHotbar
                visible={!disabled}
                {emoteOptions} {walkOptions} {idleOptions} {settingsItems} {settingsState}
                {selectedWalk} {selectedIdle} {activeEmote}
                playerCount={$multiplayerPlayerCount} {badgeBump} {shareFeedback}
                onEmote={triggerEmote} onSelectWalk={selectWalk} onSelectIdle={selectIdle}
                onShare={handleShare} />

            <!-- Minimal badge when hotbar is disabled -->
            {#if disabled}
                <div class="desktop-badge" class:bump={badgeBump}>
                    <PeopleIcon />
                    {#if $multiplayerPlayerCount != null}
                        {$multiplayerPlayerCount}
                    {/if}
                </div>
            {/if}
        {:else}
            <!-- Mobile: FAB stays visible; highlights when fan or drawer is open -->
            <MultiplayerFab
                playerCount={$multiplayerPlayerCount} {badgeBump} {disabled}
                active={drawerOpen || fanOpen}
                onclick={handleFabClick} />

            {#if fanOpen && !disabled}
                <EmoteFan
                    {emoteOptions} {activeEmote}
                    onEmote={handleFanEmote}
                    onGear={handleFanGear}
                    onClose={handleCloseFan} />
            {/if}

            {#if drawerOpen && !disabled}
                <ConfigDrawer
                    {walkOptions} {idleOptions} {settingsItems} {settingsState}
                    {selectedWalk} {selectedIdle} {shareFeedback}
                    onSelectWalk={selectWalk} onSelectIdle={selectIdle}
                    onShare={handleShare} onClose={handleCloseDrawer} />
            {/if}
        {/if}
    </div>
{/if}

<style>
    .desktop-badge {
        position: fixed;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        background: rgba(24, 24, 24, 0.85);
        border: 1px solid var(--color-border-medium);
        border-radius: 20px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: var(--color-text-muted);
        font-size: 12px;
        font-weight: 700;
        font-family: Arial, sans-serif;
        user-select: none;
        opacity: 0.6;
    }

    .desktop-badge.bump {
        animation: badge-bump 0.4s ease;
    }

    @keyframes badge-bump {
        0% { transform: translateX(-50%) scale(1); }
        40% { transform: translateX(-50%) scale(1.2); }
        100% { transform: translateX(-50%) scale(1); }
    }
</style>
