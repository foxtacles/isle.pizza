// Emscripten-related functions for game launching and canvas events
import { gameRunning, debugUIVisible, multiplayerPlayerCount, thirdPersonEnabled, showNameBubbles, allowCustomize, connectionStatus, animationState } from '../stores.js';
import { pauseInstallAudio } from './audio.js';

const DEFAULT_RENDERER = "0 0x682656f3 0x0 0x0 0x4000000"; // WebGL default
let progressUpdates = 0;

export function launchGame() {
    pauseInstallAudio();

    const rendererSelect = document.getElementById('renderer-select');
    const rendererValue = rendererSelect ? rendererSelect.value : DEFAULT_RENDERER;

    startGame(rendererValue);
}

export function startGame(rendererValue) {
    const mainContainer = document.getElementById('main-container');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const canvas = document.getElementById('canvas');

    if (!window.Module.running) return;

    mainContainer.style.display = 'none';
    canvasWrapper.style.display = 'grid';

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    window.Module["disableOffscreenCanvases"] ||= rendererValue === "0 0x682656f3 0x0 0x0 0x2000000";
    console.log("disableOffscreenCanvases: " + window.Module["disableOffscreenCanvases"]);

    window.Module["removeRunDependency"]("isle");
    canvas.focus();
    gameRunning.set(true);

    // Prevent browser zoom on trackpad pinch-to-zoom (browsers send wheel events
    // with ctrlKey: true). Only prevent default for pinch-zoom (ctrlKey) or when
    // the target is the canvas — allow normal scrolling in UI overlays.
    document.addEventListener('wheel', function (event) {
        if (event.ctrlKey || event.target === canvas) {
            event.preventDefault();
        }
    }, { passive: false });

    // Safari fires proprietary gesture events for trackpad pinch separately
    document.addEventListener('gesturestart', function (event) {
        event.preventDefault();
    });
    document.addEventListener('gesturechange', function (event) {
        event.preventDefault();
    });
}

export function setupCanvasEvents() {
    const canvas = document.getElementById('canvas');
    const loadingGifOverlay = document.getElementById('loading-gif-overlay');
    const statusMessageBar = document.getElementById('emscripten-status-message');

    canvas.addEventListener('presenterProgress', function (event) {
        // Intro animation is ready
        if (event.detail.objectName === 'Lego_Smk' && event.detail.tickleState === 1) {
            loadingGifOverlay.style.display = 'none';
            canvas.style.setProperty('display', 'block', 'important');
            debugUIVisible.set(true);
        }
        else if (progressUpdates < 1003) {
            progressUpdates++;
            const percent = (progressUpdates / 1003 * 100).toFixed();
            statusMessageBar.innerHTML = 'Loading LEGO® Island... please wait! <code>' + percent + '%</code>';
        }
    });

    canvas.addEventListener('playerCountChanged', function (event) {
        multiplayerPlayerCount.set(event.detail.count);
    });

    canvas.addEventListener('thirdPersonChanged', function (event) {
        thirdPersonEnabled.set(event.detail.enabled);
    });

    canvas.addEventListener('nameBubblesChanged', function (event) {
        showNameBubbles.set(event.detail.enabled);
    });

    canvas.addEventListener('allowCustomizeChanged', function (event) {
        allowCustomize.set(event.detail.enabled);
    });

    const STATUS_MAP = { 0: 'connected', 1: 'reconnecting', 2: 'failed', 3: 'rejected' };
    canvas.addEventListener('connectionStatusChanged', function (event) {
        const status = STATUS_MAP[event.detail.status] || null;
        connectionStatus.set(status);
        if (status === 'rejected') {
            sessionStorage.setItem('mp-rejected', '1');
        }
    });

    canvas.addEventListener('animationsAvailable', function (event) {
        try {
            const data = JSON.parse(event.detail.json);
            animationState.set(data);
        } catch (e) {
            console.error('[Anim] Failed to parse:', e);
            animationState.set(null);
        }
    });

    canvas.addEventListener('extensionProgress', function (event) {
        statusMessageBar.innerHTML = 'Loading ' + event.detail.name + '... please wait! <code>' + event.detail.progress + '%</code>';
    });
}
