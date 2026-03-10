<script>
    import { gameRunning, multiplayerRoom, multiplayerPlayerCount } from '../stores.js';
    import { showToast } from '../core/toast.js';
    import { keepVisible } from '../core/keep-visible.js';

    let expanded = false;
    let openCategory = null;
    let selectedWalk = 0;
    let selectedIdle = 0;
    let activeEmote = -1;
    let isTouchDevice = false;
    let thirdPersonCam = true;
    let showNameBubbles = true;
    let allowCustomize = true;
    let showHelp = false;

    // Close toolbar when leaving Isle world
    $: if ($multiplayerPlayerCount == null) {
        expanded = false;
        openCategory = null;
    }

    $: disabled = $multiplayerPlayerCount == null;

    const walkOptions = [
        { emoji: '\u{1F6B6}', label: 'Normal', id: 0 },
        { emoji: '\u{1F3C3}', label: 'Leaning', id: 3 },
        { emoji: '\u{1F57A}', label: 'Joyful', id: 1 },
        { emoji: '\u{1F327}\u{FE0F}', label: 'Gloomy', id: 2 },
        { emoji: '\u{1F648}', label: 'Scared', id: 4 },
        { emoji: '\u{26A1}', label: 'Hyper', id: 5 }
    ];

    const idleOptions = [
        { emoji: '\u{1F343}', label: 'Sway' },
        { emoji: '\u{1FAA9}', label: 'Groove' },
        { emoji: '\u{1F64C}', label: 'Excited' }
    ];

    const emoteOptions = [
        { emoji: '\u{1F44B}', label: 'Wave' },
        { emoji: '\u{1F3A9}', label: 'Hat Tip' },
        { emoji: '\u{1F9F1}', label: 'Disassemble' }
    ];

    const svgIcons = {
        emote: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
        camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
        bubble: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        wand: '<path d="M3 21l10-10"/><path d="M13 11l2.5-2.5a1.5 1.5 0 0 1 2 0l.5.5a1.5 1.5 0 0 1 0 2L15.5 13.5"/><path d="M7 3l.5 1.5L9 5l-1.5.5L7 7l-.5-1.5L5 5l1.5-.5z" fill="currentColor" stroke="none"/><path d="M17 2l.4 1.1L18.5 3.5l-1.1.4L17 5l-.4-1.1L15.5 3.5l1.1-.4z" fill="currentColor" stroke="none"/><path d="M21 8l.4 1.1L22.5 9.5l-1.1.4L21 11l-.4-1.1L19.5 9.5l1.1-.4z" fill="currentColor" stroke="none"/>',
        help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    };

    const helpItems = [
        { emoji: walkOptions[0].emoji, title: 'Walk Style', desc: 'Change how your character walks. Hover or tap to pick from several walking animations.' },
        { emoji: idleOptions[0].emoji, title: 'Idle Style', desc: 'Change what your character does while standing still. Choose from sway, groove, or excited.' },
        { svg: svgIcons.emote, title: 'Emotes', desc: 'Trigger a one-time animation like waving or tipping your hat. Other players will see it too.' },
        { svg: svgIcons.camera, title: 'Third-Person Camera', desc: 'Toggle a camera that follows behind your character so you can see yourself walking, riding vehicles, and performing emotes.' },
        { svg: svgIcons.bubble, title: 'Name Bubbles', desc: 'Show or hide the floating name labels above other players\u2019 characters.' },
        { svg: svgIcons.wand, title: 'Customization', desc: 'Allow other players to click on your character to cycle your colors, hats, moods, and sounds.' },
        { svg: svgIcons.share, title: 'Share', desc: 'Copy a link to this room so you can invite others to join.' },
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
        if (!expanded) refocusCanvas();
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
            window.Module._mp_set_walk_animation(walkOptions[index].id);
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
        if (showHelp) return;
        if (isTouchDevice && openCategory && !e.target.closest('.mp-category')) {
            openCategory = null;
        }
    }

    function handleWindowKeydown(e) {
        if (showHelp && e.key === 'Escape') showHelp = false;
    }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

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

        <!-- Toolbar (horizontal) -->
        {#if expanded}
            <div class="mp-toolbar">
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
                            {@html svgIcons.emote}
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

                <div class="mp-divider"></div>

                <!-- Camera toggle -->
                <button class="mp-cat-btn mp-toggle-btn" class:toggle-active={thirdPersonCam}
                    onclick={toggleThirdPersonCam} title="Toggle 3rd-person camera">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        {@html svgIcons.camera}
                    </svg>
                </button>

                <!-- Name bubble toggle -->
                <button class="mp-cat-btn mp-toggle-btn" class:toggle-active={showNameBubbles}
                    onclick={toggleNameBubbles} title="Toggle name bubbles">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        {@html svgIcons.bubble}
                    </svg>
                </button>

                <!-- Customize toggle -->
                <button class="mp-cat-btn mp-toggle-btn" class:toggle-active={allowCustomize}
                    onclick={toggleAllowCustomize} title="Allow other players to customize you">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        {@html svgIcons.wand}
                    </svg>
                </button>

                <div class="mp-divider"></div>

                <!-- Help -->
                <button class="mp-cat-btn mp-toggle-btn" onclick={() => showHelp = true} title="Toolbar guide">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        {@html svgIcons.help}
                    </svg>
                </button>

                <!-- Share -->
                <button class="mp-cat-btn mp-toggle-btn mp-share-btn" onclick={handleCopyLink} title="Copy room link">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        {@html svgIcons.share}
                    </svg>
                </button>
            </div>
        {/if}
    </div>

    <!-- Help modal -->
    {#if showHelp}
        <div class="mp-help-backdrop" role="presentation" onclick={() => showHelp = false} onkeydown={() => {}}>
            <div class="mp-help-panel" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
                <div class="mp-help-header">
                    <span class="mp-help-title">Toolbar Guide</span>
                    <button class="mp-help-close" onclick={() => showHelp = false}>&times;</button>
                </div>
                <div class="mp-help-body">
                    {#each helpItems as item}
                        <div class="mp-help-row">
                            <span class="mp-help-icon" class:mp-help-icon-svg={item.svg}>
                                {#if item.svg}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        {@html item.svg}
                                    </svg>
                                {:else}
                                    {item.emoji}
                                {/if}
                            </span>
                            <div class="mp-help-text">
                                <strong>{item.title}</strong>
                                <span>{item.desc}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
{/if}

<style>
    .mp-overlay {
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
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

    /* --- Toolbar (horizontal, anchored to right of toggle) --- */
    .mp-toolbar {
        position: absolute;
        top: 50%;
        left: calc(100% + 6px);
        transform: translateY(-50%);
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 4px;
        background: rgba(24, 24, 24, 0.9);
        border: 1px solid var(--color-border-medium);
        border-radius: 22px;
        padding: 4px;
        height: 44px;
        box-sizing: border-box;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        animation: mp-toolbar-in 0.15s ease-out;
        white-space: nowrap;
    }

    @keyframes mp-toolbar-in {
        from { opacity: 0; transform: translateY(-50%) translateX(-8px); }
        to { opacity: 1; transform: translateY(-50%) translateX(0); }
    }

    /* --- Divider --- */
    .mp-divider {
        width: 1px;
        height: 24px;
        background: var(--color-border-medium);
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

    /* --- Popout (dropdown below buttons) --- */
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

    /* --- Help modal --- */
    .mp-help-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1001;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
    }

    .mp-help-panel {
        max-width: 340px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        background: rgba(24, 24, 24, 0.98);
        border: 1px solid var(--color-border-medium);
        border-radius: 12px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
        animation: mp-help-in 0.15s ease-out;
    }

    @keyframes mp-help-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }

    .mp-help-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-bottom: 1px solid var(--color-border-medium);
    }

    .mp-help-title {
        color: var(--color-text-light);
        font-size: 0.85em;
        font-weight: 700;
    }

    .mp-help-close {
        background: none;
        border: none;
        color: var(--color-text-muted);
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
        transition: color 0.15s ease;
    }

    .mp-help-close:hover {
        color: var(--color-text-light);
    }

    .mp-help-body {
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .mp-help-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }

    .mp-help-icon {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background: rgba(255, 215, 0, 0.1);
        font-size: 16px;
        line-height: 1;
    }

    .mp-help-icon-svg {
        color: var(--color-primary);
    }

    .mp-help-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .mp-help-text strong {
        color: var(--color-text-light);
        font-size: 0.75em;
    }

    .mp-help-text span {
        color: var(--color-text-muted);
        font-size: 0.7em;
        line-height: 1.4;
    }

    /* --- Mobile --- */
    @media (max-width: 480px) {
        .mp-toolbar {
            height: 40px;
            gap: 2px;
            padding: 3px;
        }

        .mp-cat-btn {
            width: 32px;
            height: 32px;
            font-size: 16px;
        }

        .mp-opt-btn {
            min-width: 42px;
            min-height: 42px;
        }
    }
</style>
