<script>
    import { signInWithDiscord, signInWithGoogle, signInAnonymously } from '../core/auth.js';

    export let open = false;
    export let onClose = () => {};

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') {
            onClose();
        }
    }

    function handleGoogle() {
        onClose();
        signInWithGoogle();
    }

    function handleDiscord() {
        onClose();
        signInWithDiscord();
    }

    async function handleGuest() {
        await signInAnonymously();
        onClose();
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-backdrop" on:click={handleBackdropClick}>
        <div class="modal-panel">
            <button class="modal-close" on:click={onClose} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>

            <div class="modal-header">
                <h2>Sign in</h2>
                <p>Save your progress across devices</p>
            </div>

            <div class="modal-body">
                <button class="provider-button google" on:click={handleGoogle}>
                    <svg class="provider-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </button>

                <button class="provider-button discord" on:click={handleDiscord}>
                    <svg class="provider-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" fill="#fff"/>
                    </svg>
                    Continue with Discord
                </button>

                <div class="divider">
                    <span>or</span>
                </div>

                <button class="guest-button" on:click={handleGuest}>
                    Continue as Guest
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        backdrop-filter: blur(2px);
    }

    .modal-panel {
        position: relative;
        box-sizing: border-box;
        background: #1a1a1a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 32px 28px;
        width: 340px;
        max-width: calc(100vw - 48px);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
    }

    .modal-close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s;
    }

    .modal-close:hover {
        color: rgba(255, 255, 255, 0.8);
    }

    .modal-header {
        text-align: center;
        margin-bottom: 24px;
    }

    .modal-header h2 {
        font-family: Arial, sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin: 0 0 6px;
    }

    .modal-header p {
        font-family: Arial, sans-serif;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.4);
        margin: 0;
    }

    .modal-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .provider-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 11px 16px;
        border: none;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.15s, transform 0.1s;
    }

    .provider-button:hover {
        opacity: 0.9;
    }

    .provider-button:active {
        transform: scale(0.98);
    }

    .provider-icon {
        flex-shrink: 0;
    }

    .provider-button.google {
        background: #fff;
        color: #3c4043;
    }

    .provider-button.discord {
        background: #5865F2;
        color: #fff;
    }

    .divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 6px 0;
    }

    .divider::before,
    .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
    }

    .divider span {
        font-family: Arial, sans-serif;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.3);
    }

    .guest-button {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        padding: 11px 16px;
        color: rgba(255, 255, 255, 0.5);
        font-family: Arial, sans-serif;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
    }

    .guest-button:hover {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.7);
    }
</style>
