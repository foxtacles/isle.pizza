import App from './App.svelte';
import { mount } from 'svelte';
import './app.css';

function signalCrash(message) {
    window.dispatchEvent(new CustomEvent('game-crash', { detail: { message } }));
}

// Global Module object required by Emscripten - must be defined before isle.js loads
window.Module = {
    arguments: ['--ini', '/config/isle.ini'],
    running: false,
    preRun: function () {
        window.Module["addRunDependency"]("isle");
        window.Module.running = true;
    },
    canvas: null, // Will be set after mount
    onAbort: function (what) {
        signalCrash(String(what || 'Unknown error'));
    },
    onExit: function (code) {
        if (code !== 0) {
            signalCrash('Game exited with code ' + code);
        } else {
            window.location.reload();
        }
    }
};

// Safety net: catch worker errors that bypass abort() (e.g. WASM trap instructions)
window.addEventListener('unhandledrejection', function (event) {
    if (window.Module.running && event.reason?.message?.includes('Aborted')) {
        signalCrash(event.reason.message);
    }
});

// Catch uncaught errors from worker threads (e.g. RuntimeError: unreachable)
window.addEventListener('error', function (event) {
    if (window.Module.running && event.message?.includes('RuntimeError')) {
        signalCrash(event.message);
    }
});

// Mount Svelte app
const app = mount(App, {
    target: document.getElementById('app')
});

// Set canvas reference after mount
window.Module.canvas = document.getElementById('canvas');

export default app;
