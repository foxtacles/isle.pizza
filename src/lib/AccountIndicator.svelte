<script>
    import { tick } from 'svelte';
    import { computePosition, flip, shift, offset } from '@floating-ui/dom';
    import { authSession, signInWithDiscord, signInWithGoogle, signOut } from '../core/auth.js';
    import { currentPage } from '../stores.js';
    import { navigateTo, navigateToMultiplayer } from '../core/navigation.js';
    import SignInModal from './SignInModal.svelte';

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
    $: if (userImage) { imgLoaded = false; imgFailed = false; }
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
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Link with Google
                    </button>
                    <button class="dropdown-item link-discord" onclick={() => navAction(signInWithDiscord)}>
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" fill="#5865F2"/>
                        </svg>
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
        background: rgba(255, 255, 255, 0.08);
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
        background: rgba(255, 255, 255, 0.08);
        margin: 2px 0;
    }
</style>
