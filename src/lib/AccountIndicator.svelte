<script>
    import { authSession, signInWithDiscord, signInWithGoogle, signInAnonymously, signOut } from '../core/auth.js';
    import { memoryUnlocks, currentPage } from '../stores.js';
    import { navigateTo } from '../core/navigation.js';
    import { TOTAL_ANIMATIONS } from './multiplayer/animationTitles.js';

    let open = false;

    function toggle() {
        open = !open;
    }

    function close() {
        open = false;
    }

    function goToMemories() {
        close();
        navigateTo('memories');
    }

    function handleSignOut() {
        close();
        signOut();
    }

    function handleClickOutside(event) {
        if (!event.target.closest('.account-indicator')) {
            close();
        }
    }

    // Close dropdown when navigating to another page or when auth state changes
    $: $currentPage, close();
    $: $authSession, close();

    $: displayName = $authSession?.user?.isAnonymous
        ? 'Guest'
        : ($authSession?.user?.name || 'Player');
    $: unlockCount = $memoryUnlocks.size;
</script>

<svelte:window onclick={handleClickOutside} />

<div class="account-indicator">
    {#if $authSession === undefined}
        <!-- Loading session, don't render anything -->
    {:else if $authSession}
        <button class="account-button logged-in" onclick={toggle}>
            <span class="account-name">{displayName}</span>
            <span class="account-caret">{open ? '\u25B4' : '\u25BE'}</span>
        </button>
    {:else}
        <button class="account-button" onclick={toggle}>
            <span class="account-label">Sign in</span>
            <span class="account-caret">{open ? '\u25B4' : '\u25BE'}</span>
        </button>
    {/if}

    {#if open}
        <div class="account-dropdown">
            {#if $authSession}
                <button class="dropdown-item memories-link" onclick={goToMemories}>
                    <span class="memories-count">{unlockCount} / {TOTAL_ANIMATIONS}</span>
                    <span class="memories-label">Memories</span>
                </button>
                {#if $authSession.user?.isAnonymous}
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-header">Link an account to save across devices</div>
                    <button class="dropdown-item provider" onclick={() => { close(); signInWithDiscord(); }}>
                        Link with Discord
                    </button>
                    <button class="dropdown-item provider" onclick={() => { close(); signInWithGoogle(); }}>
                        Link with Google
                    </button>
                {/if}
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" onclick={handleSignOut}>Sign out</button>
            {:else}
                <div class="dropdown-header">Sign in to save progress across devices</div>
                <button class="dropdown-item provider" onclick={() => { close(); signInWithDiscord(); }}>
                    Continue with Discord
                </button>
                <button class="dropdown-item provider" onclick={() => { close(); signInWithGoogle(); }}>
                    Continue with Google
                </button>
                <button class="dropdown-item guest" onclick={() => { close(); signInAnonymously(); }}>
                    Continue as Guest
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item memories-link" onclick={goToMemories}>
                    <span class="memories-count">{unlockCount} / {TOTAL_ANIMATIONS}</span>
                    <span class="memories-label">Memories</span>
                </button>
            {/if}
        </div>
    {/if}
</div>

<style>
    .account-indicator {
        position: fixed;
        top: 12px;
        right: 16px;
        z-index: 100;
    }

    .account-button {
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 6px 12px;
        color: rgba(255, 255, 255, 0.6);
        font-family: Arial, sans-serif;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
    }

    .account-button:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .account-button.logged-in {
        color: rgba(255, 255, 255, 0.85);
    }

    .account-caret {
        font-size: 9px;
        opacity: 0.5;
    }

    .account-dropdown {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        min-width: 200px;
        background: #1a1a1a;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        font-family: Arial, sans-serif;
    }

    .dropdown-header {
        padding: 10px 14px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.45);
        line-height: 1.4;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 9px 14px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.75);
        font-size: 13px;
        font-family: inherit;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
    }

    .dropdown-item:hover {
        background: rgba(255, 255, 255, 0.06);
    }

    .dropdown-item.provider {
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
    }

    .dropdown-item.guest {
        color: rgba(255, 255, 255, 0.55);
    }

    .dropdown-item.memories-link {
        gap: 8px;
    }

    .memories-count {
        font-weight: 700;
        color: rgba(76, 175, 80, 0.9);
        font-size: 14px;
        min-width: 55px;
    }

    .memories-label {
        color: rgba(255, 255, 255, 0.55);
        font-size: 12px;
    }

    .dropdown-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.08);
        margin: 2px 0;
    }
</style>
