<script>
    import { gameRunning, multiplayerRoom, multiplayerPlayerCount } from '../stores.js';
    import { showToast } from '../core/toast.js';
    import { keepVisible } from '../core/keep-visible.js';

    let expanded = false;
    let openCategory = null;
    let characterExpanded = false;
    let selectedWalk = 0;
    let selectedIdle = 0;
    let activeEmote = -1;
    let isTouchDevice = false;
    let thirdPersonCam = true;
    let showNameBubbles = true;
    let allowCustomize = true;

    // Close toolbar when leaving Isle world
    $: if ($multiplayerPlayerCount == null) {
        expanded = false;
        openCategory = null;
        characterExpanded = false;
    }

    $: disabled = $multiplayerPlayerCount == null;

    const walkOptions = [
        { emoji: '\u{1F6B6}', label: 'Normal' },
        { emoji: '\u{1F604}', label: 'Joyful' },
        { emoji: '\u{1F614}', label: 'Gloomy' },
        { emoji: '\u{1F3C3}', label: 'Leaning' },
        { emoji: '\u{1F628}', label: 'Scared' },
        { emoji: '\u{1F92A}', label: 'Hyper' }
    ];

    const idleOptions = [
        { emoji: '\u{1F3B5}', label: 'Sway' },
        { emoji: '\u{1F483}', label: 'Groove' },
        { emoji: '\u{1F64C}', label: 'Excited' }
    ];

    const emoteOptions = [
        { emoji: '\u{1F44B}', label: 'Wave' },
        { emoji: '\u{1F3A9}', label: 'Hat Tip' }
    ];

    function detectTouch(node) {
        const mql = window.matchMedia('(any-pointer: coarse)');
        isTouchDevice = mql.matches;
        const handler = (e) => { isTouchDevice = e.matches; };
        mql.addEventListener('change', handler);
        return { destroy() { mql.removeEventListener('change', handler); } };
    }

    function refocusCanvas() {
        document.getElementById('canvas')?.focus();
    }

    function toggleToolbar() {
        if (disabled) return;
        expanded = !expanded;
        openCategory = null;
        characterExpanded = false;
        if (!expanded) refocusCanvas();
    }

    function toggleCharacterMenu() {
        characterExpanded = !characterExpanded;
        if (!characterExpanded) openCategory = null;
    }

    function toggleThirdPersonCam() {
        thirdPersonCam = !thirdPersonCam;
        window.Module?._mp_toggle_third_person();
        refocusCanvas();
    }

    function toggleNameBubbles() {
        showNameBubbles = !showNameBubbles;
        window.Module?._mp_toggle_name_bubbles();
        refocusCanvas();
    }

    function toggleAllowCustomize() {
        allowCustomize = !allowCustomize;
        window.Module?._mp_toggle_allow_customize();
        refocusCanvas();
    }

    function handleCategoryEnter(category) {
        if (!isTouchDevice) openCategory = category;
    }

    function handleCategoryLeave() {
        if (!isTouchDevice) openCategory = null;
    }

    function handleCategoryClick(category) {
        if (isTouchDevice) {
            openCategory = openCategory === category ? null : category;
        }
    }

    function selectWalk(index) {
        selectedWalk = index;
        if (window.Module?._mp_set_walk_animation) {
            window.Module._mp_set_walk_animation(index);
        }
        openCategory = null;
        refocusCanvas();
    }

    function selectIdle(index) {
        selectedIdle = index;
        if (window.Module?._mp_set_idle_animation) {
            window.Module._mp_set_idle_animation(index);
        }
        openCategory = null;
        refocusCanvas();
    }

    function triggerEmote(index) {
        if (window.Module?._mp_trigger_emote) {
            window.Module._mp_trigger_emote(index);
        }
        activeEmote = index;
        setTimeout(() => { activeEmote = -1; }, 300);
        openCategory = null;
        refocusCanvas();
    }

    async function handleCopyLink() {
        const url = `${window.location.origin}${window.location.pathname}#r/${$multiplayerRoom}`;
        try {
            await navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard');
        } catch {
            showToast('Could not copy link');
        }
        refocusCanvas();
    }

    function handleWindowClick(e) {
        if (isTouchDevice && !e.target.closest('.mp-category')) {
            if (openCategory) openCategory = null;
            if (characterExpanded && !e.target.closest('.mp-character-wrap')) {
                characterExpanded = false;
            }
        }
    }
</script>

<svelte:window onclick={handleWindowClick} />

{#if $gameRunning && $multiplayerRoom}
    <div class="mp-overlay" use:keepVisible use:detectTouch>
        <!-- Main toggle -->
        <button class="mp-toggle" class:active={expanded} class:disabled onclick={toggleToolbar}
            title={disabled ? 'Multiplayer (enter Isle world to use)' : 'Multiplayer'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {#if $multiplayerPlayerCount != null}
                <span class="mp-badge">{$multiplayerPlayerCount}</span>
            {/if}
        </button>

        <!-- Toolbar (vertical) -->
        {#if expanded}
            <div class="mp-toolbar">
                <!-- Character button + horizontal sub-bar -->
                <div class="mp-character-wrap">
                    <button class="mp-cat-btn" class:has-popout={characterExpanded}
                        onclick={toggleCharacterMenu} title="Character">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </button>

                    {#if characterExpanded}
                        <div class="mp-character-bar">
                            <!-- Walk -->
                            <div class="mp-category" role="group"
                                onmouseenter={() => handleCategoryEnter('walk')}
                                onmouseleave={handleCategoryLeave}
                            >
                                <button class="mp-cat-btn" class:has-popout={openCategory === 'walk'}
                                    onclick={() => handleCategoryClick('walk')}
                                    title="Walk style">
                                    {walkOptions[selectedWalk].emoji}
                                </button>
                                {#if openCategory === 'walk'}
                                    <div class="mp-popout">
                                        {#each walkOptions as opt, i}
                                            <button class="mp-opt-btn" class:selected={selectedWalk === i}
                                                onclick={() => selectWalk(i)} title={opt.label}>
                                                {opt.emoji}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>

                            <!-- Idle -->
                            <div class="mp-category" role="group"
                                onmouseenter={() => handleCategoryEnter('idle')}
                                onmouseleave={handleCategoryLeave}
                            >
                                <button class="mp-cat-btn" class:has-popout={openCategory === 'idle'}
                                    onclick={() => handleCategoryClick('idle')}
                                    title="Idle style">
                                    {idleOptions[selectedIdle].emoji}
                                </button>
                                {#if openCategory === 'idle'}
                                    <div class="mp-popout">
                                        {#each idleOptions as opt, i}
                                            <button class="mp-opt-btn" class:selected={selectedIdle === i}
                                                onclick={() => selectIdle(i)} title={opt.label}>
                                                {opt.emoji}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>

                            <!-- Emotes -->
                            <div class="mp-category" role="group"
                                onmouseenter={() => handleCategoryEnter('emote')}
                                onmouseleave={handleCategoryLeave}
                            >
                                <button class="mp-cat-btn" class:has-popout={openCategory === 'emote'}
                                    onclick={() => handleCategoryClick('emote')}
                                    title="Emotes">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                                    </svg>
                                </button>
                                {#if openCategory === 'emote'}
                                    <div class="mp-popout">
                                        {#each emoteOptions as opt, i}
                                            <button class="mp-opt-btn mp-emote-opt" class:emote-active={activeEmote === i}
                                                onclick={() => triggerEmote(i)} title={opt.label}>
                                                {opt.emoji}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="mp-divider"></div>

                <!-- Camera toggle -->
                <button class="mp-cat-btn mp-toggle-btn" class:toggle-active={thirdPersonCam}
                    onclick={toggleThirdPersonCam} title="Toggle 3rd-person camera">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 7l-7 5 7 5V7z"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                </button>

                <!-- Name bubble toggle -->
                <button class="mp-cat-btn mp-toggle-btn" class:toggle-active={showNameBubbles}
                    onclick={toggleNameBubbles} title="Toggle name bubbles">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>

                <!-- Customize toggle -->
                <button class="mp-cat-btn mp-toggle-btn" class:toggle-active={allowCustomize}
                    onclick={toggleAllowCustomize} title="Allow other players to customize you">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 21l10-10"/>
                        <path d="M13 11l2.5-2.5a1.5 1.5 0 0 1 2 0l.5.5a1.5 1.5 0 0 1 0 2L15.5 13.5"/>
                        <path d="M7 3l.5 1.5L9 5l-1.5.5L7 7l-.5-1.5L5 5l1.5-.5z" fill="currentColor" stroke="none"/>
                        <path d="M17 2l.4 1.1L18.5 3.5l-1.1.4L17 5l-.4-1.1L15.5 3.5l1.1-.4z" fill="currentColor" stroke="none"/>
                        <path d="M21 8l.4 1.1L22.5 9.5l-1.1.4L21 11l-.4-1.1L19.5 9.5l1.1-.4z" fill="currentColor" stroke="none"/>
                    </svg>
                </button>

                <div class="mp-divider"></div>

                <!-- Share -->
                <button class="mp-cat-btn mp-toggle-btn mp-share-btn" onclick={handleCopyLink} title="Copy room link">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                </button>
            </div>
        {/if}
    </div>
{/if}

<style>
    .mp-overlay {
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* --- Toggle button --- */
    .mp-toggle {
        position: relative;
        width: 44px;
        height: 44px;
        box-sizing: border-box;
        border-radius: 50%;
        background: rgba(24, 24, 24, 0.85);
        border: 2px solid rgba(255, 215, 0, 0.5);
        color: var(--color-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease, border-color 0.2s ease;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        flex-shrink: 0;
    }

    .mp-toggle:hover, .mp-toggle.active {
        background: rgba(255, 215, 0, 0.12);
        border-color: var(--color-primary);
    }

    .mp-toggle.disabled {
        border-color: rgba(255, 255, 255, 0.15);
        color: var(--color-text-muted);
        opacity: 0.5;
        cursor: default;
    }

    .mp-toggle.disabled:hover {
        background: rgba(24, 24, 24, 0.85);
        border-color: rgba(255, 255, 255, 0.15);
    }

    .mp-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        background: var(--color-primary);
        color: #000;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        line-height: 1;
        pointer-events: none;
    }

    /* --- Toolbar (vertical) --- */
    .mp-toolbar {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background: rgba(24, 24, 24, 0.9);
        border: 1px solid var(--color-border-medium);
        border-radius: 22px;
        padding: 4px;
        width: 44px;
        box-sizing: border-box;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        animation: mp-toolbar-in 0.15s ease-out;
    }

    @keyframes mp-toolbar-in {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* --- Divider --- */
    .mp-divider {
        width: 24px;
        height: 1px;
        background: var(--color-border-medium);
    }

    /* --- Character wrapper (anchors the horizontal sub-bar) --- */
    .mp-character-wrap {
        position: relative;
    }

    /* --- Horizontal character sub-bar --- */
    .mp-character-bar {
        position: absolute;
        top: 50%;
        left: calc(100% + 6px);
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(24, 24, 24, 0.9);
        border: 1px solid var(--color-border-medium);
        border-radius: 22px;
        padding: 4px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        animation: mp-charbar-in 0.15s ease-out;
        white-space: nowrap;
    }

    @keyframes mp-charbar-in {
        from { opacity: 0; transform: translateY(-50%) translateX(-8px); }
        to { opacity: 1; transform: translateY(-50%) translateX(0); }
    }

    /* --- Category wrapper (for popout positioning) --- */
    .mp-category {
        position: relative;
    }

    /* --- Category buttons --- */
    .mp-cat-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: transparent;
        border: 1.5px solid transparent;
        box-sizing: border-box;
        color: var(--color-text-light);
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        padding: 0;
        line-height: 1;
    }

    .mp-cat-btn:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    .mp-cat-btn.has-popout {
        background: rgba(255, 215, 0, 0.12);
        border-color: rgba(255, 215, 0, 0.4);
    }

    /* --- Toggle buttons (camera, name bubbles, share) --- */
    .mp-toggle-btn {
        color: var(--color-text-muted);
    }

    .mp-toggle-btn:hover {
        color: var(--color-text-light);
    }

    .mp-toggle-btn.toggle-active {
        color: var(--color-primary);
        border-color: rgba(255, 215, 0, 0.4);
        background: rgba(255, 215, 0, 0.12);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.15);
    }

    .mp-share-btn:hover {
        color: var(--color-primary);
    }

    /* --- Popout (dropdown below buttons in the character bar) --- */
    .mp-popout {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 3px;
        background: rgba(24, 24, 24, 0.95);
        border: 1px solid var(--color-border-medium);
        border-radius: 12px;
        padding: 5px;
        /* Invisible bridge so hover doesn't break crossing the gap */
        padding-top: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        animation: mp-popout-in 0.12s ease-out;
    }

    @keyframes mp-popout-in {
        from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    /* Arrow */
    .mp-popout::after {
        content: '';
        position: absolute;
        top: 5px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        width: 8px;
        height: 8px;
        background: rgba(24, 24, 24, 0.95);
        border-left: 1px solid var(--color-border-medium);
        border-top: 1px solid var(--color-border-medium);
    }

    /* --- Option buttons inside popout --- */
    .mp-opt-btn {
        width: 38px;
        height: 38px;
        border-radius: 8px;
        background: transparent;
        border: 1.5px solid transparent;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.12s ease;
        padding: 0;
        line-height: 1;
    }

    .mp-opt-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        transform: scale(1.1);
    }

    .mp-opt-btn.selected {
        background: rgba(255, 215, 0, 0.15);
        border-color: var(--color-primary);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.15);
    }

    .mp-emote-opt:active, .mp-emote-opt.emote-active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        transform: scale(0.9);
    }

    /* --- Mobile --- */
    @media (max-width: 480px) {
        .mp-opt-btn {
            min-width: 42px;
            min-height: 42px;
        }
    }
</style>
