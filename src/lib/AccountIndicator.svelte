<script>
    import { tick } from 'svelte';
    import { computePosition, flip, shift, offset } from '@floating-ui/dom';
    import { authSession, signInWithDiscord, signInWithGoogle, signOut } from '../core/auth.js';
    import { currentPage } from '../stores.js';
    import { navigateTo, navigateToMultiplayer } from '../core/navigation.js';
    import SignInModal from './SignInModal.svelte';
    import GoogleIcon from './icons/GoogleIcon.svelte';
    import DiscordIcon from './icons/DiscordIcon.svelte';

    let openMenu = null; // null | 'nav' | 'account'
    let showSignInModal = false;

    let navButtonEl, navDropdownEl;
    let accountButtonEl, accountDropdownEl;

    const menuConfig = {
        nav:     () => [navButtonEl, navDropdownEl],
        account: () => [accountButtonEl, accountDropdownEl],
    };

    async function positionDropdown(reference, floating) {
        // Keep invisible during measurement to prevent jerk on open
        floating.style.visibility = 'hidden';
        const { x, y } = await computePosition(reference, floating, {
            placement: 'bottom-end',
            middleware: [offset(6), flip(), shift({ padding: 8 })]
        });
        Object.assign(floating.style, { left: `${x}px`, top: `${y}px`, visibility: '' });
    }

    async function toggleMenu(name) {
        openMenu = openMenu === name ? null : name;
        if (openMenu) {
            await tick();
            const [button, dropdown] = menuConfig[name]();
            if (button && dropdown) positionDropdown(button, dropdown);
        }
    }

    function closeMenus() {
        openMenu = null;
    }

    function handleAuthClick() {
        if ($authSession === undefined) return;
        if ($authSession === null) {
            showSignInModal = true;
        } else {
            toggleMenu('account');
        }
    }

    function handleClickOutside(event) {
        if (!openMenu) return;
        const wrapperClass = openMenu === 'nav' ? '.nav-menu-wrapper' : '.account-menu-wrapper';
        if (!event.target.closest(wrapperClass)) closeMenus();
    }

    function navAction(fn) {
        closeMenus();
        fn();
    }

    $: $currentPage, closeMenus();
    $: $authSession, closeMenus();

    $: if ($authSession && showSignInModal) {
        showSignInModal = false;
    }

    $: displayName = $authSession?.user?.isAnonymous
        ? 'Guest'
        : ($authSession?.user?.name || 'Player');
    $: userImage = $authSession?.user?.image || null;
    $: isGuest = $authSession?.user?.isAnonymous === true;

    let imgLoaded = false;
    let imgFailed = false;
    $: { userImage; imgLoaded = false; imgFailed = false; }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="nav-bar">
    <div class="nav-menu-wrapper">
        <button class="nav-circle" bind:this={navButtonEl} onclick={() => toggleMenu('nav')} title="Menu">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.8" stroke-linecap="round">
                <line x1="4" y1="6" x2="16" y2="6"/>
                <line x1="4" y1="10" x2="16" y2="10"/>
                <line x1="4" y1="14" x2="16" y2="14"/>
            </svg>
        </button>

        {#if openMenu === 'nav'}
            <div class="dropdown" bind:this={navDropdownEl}>
                <button class="dropdown-item" onclick={() => navAction(() => navigateTo('save-editor'))}>Save Editor</button>
                <button class="dropdown-item" onclick={() => navAction(navigateToMultiplayer)}>Multiplayer</button>
                <button class="dropdown-item" onclick={() => navAction(() => navigateTo('memories'))}>Nick Brick's Memories</button>
            </div>
        {/if}
    </div>

    <div class="account-menu-wrapper">
        <button
            class="nav-circle"
            bind:this={accountButtonEl}
            onclick={handleAuthClick}
            disabled={$authSession === undefined}
            title={$authSession ? displayName : ($authSession === null ? 'Sign in' : '')}
        >
            <svg class="avatar-placeholder" class:hidden={imgLoaded} class:signed-out={!$authSession} viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="12" r="5" fill="currentColor"/>
                <path d="M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="currentColor"/>
            </svg>
            {#if $authSession && userImage && !imgFailed}
                <img class="avatar-img" class:loaded={imgLoaded} src={userImage} alt="" crossorigin="anonymous"
                    onload={() => imgLoaded = true} onerror={() => imgFailed = true} />
            {/if}
        </button>

        {#if openMenu === 'account'}
            <div class="dropdown" bind:this={accountDropdownEl}>
                <div class="dropdown-header">
                    {isGuest ? 'Guest' : displayName}
                </div>

                {#if isGuest}
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-sublabel">Link an account to save across devices</div>
                    <button class="dropdown-item link-google" onclick={() => navAction(signInWithGoogle)}>
                        <GoogleIcon size={16} />
                        Link with Google
                    </button>
                    <button class="dropdown-item link-discord" onclick={() => navAction(signInWithDiscord)}>
                        <DiscordIcon size={16} />
                        Link with Discord
                    </button>
                {/if}

                <div class="dropdown-divider"></div>
                <button class="dropdown-item signout" onclick={() => navAction(signOut)}>Sign out</button>
            </div>
        {/if}
    </div>
</div>

<SignInModal open={showSignInModal} onClose={() => showSignInModal = false} />

<style>
    .nav-bar {
        position: absolute;
        top: 12px;
        right: 16px;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .nav-menu-wrapper,
    .account-menu-wrapper {
        position: relative;
    }

    .nav-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        background: var(--color-surface-hover);
        cursor: pointer;
        padding: 0;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: border-color 0.15s;
    }

    .nav-circle:hover {
        border-color: rgba(255, 255, 255, 0.35);
    }

    .nav-circle:disabled {
        pointer-events: none;
    }

    .avatar-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        opacity: 0;
    }

    .avatar-img.loaded {
        opacity: 1;
    }

    .avatar-placeholder {
        width: 20px;
        height: 20px;
        margin-top: -2px;
        color: rgba(255, 255, 255, 0.5);
    }

    .avatar-placeholder.signed-out {
        color: rgba(255, 255, 255, 0.25);
    }

    .avatar-placeholder.hidden {
        visibility: hidden;
    }

    /* Dropdowns — positioned dynamically by floating-ui */
    .dropdown {
        position: absolute;
        width: max-content;
        min-width: 220px;
        background: #1a1a1a;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        font-family: Arial, sans-serif;
    }

    .dropdown-header {
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.85);
    }

    .dropdown-sublabel {
        padding: 2px 14px 8px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.35);
        line-height: 1.3;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 9px 14px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 13px;
        font-family: inherit;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
    }

    .dropdown-item:hover {
        background: rgba(255, 255, 255, 0.06);
    }

    .dropdown-item.link-google,
    .dropdown-item.link-discord {
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
    }

    .dropdown-item.signout {
        color: rgba(255, 255, 255, 0.5);
    }

    .dropdown-divider {
        height: 1px;
        background: var(--color-surface-hover);
        margin: 2px 0;
    }
</style>
