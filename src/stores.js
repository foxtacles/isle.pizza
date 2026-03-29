import { writable } from 'svelte/store';
import { validateRoomName } from './core/room-names.js';

const PAGE_MAP = {
    '#read-me': 'read-me',
    '#configure': 'configure',
    '#free-stuff': 'free-stuff',
    '#save-editor': 'save-editor',
    '#multiplayer': 'multiplayer',
    '#memories': 'memories'
};

// Parse a hash string into { page, room, invalidRoom }
export function parseHash(hash) {
    if (hash.startsWith('#r/')) {
        const room = hash.slice(3);
        if (validateRoomName(room)) {
            return { page: 'multiplayer', room };
        }
        return { page: 'multiplayer', room: null, invalidRoom: true };
    }
    return { page: PAGE_MAP[hash] || 'main', room: null };
}

// Page navigation - initialize from URL hash to prevent flicker on reload
function getInitialState() {
    if (typeof window === 'undefined') return { page: 'main', room: null };
    return parseHash(window.location.hash);
}

const initial = getInitialState();

export const currentPage = writable(initial.page);
export const multiplayerRoom = writable(initial.room);
// Set on startup if the initial URL had an invalid room
export const initialInvalidRoom = initial.invalidRoom || false;

// Debug mode
export const debugEnabled = writable(false);

// Sound state
export const soundEnabled = writable(false);

// Popup visibility
export const showUpdatePopup = writable(false);
export const showGoodbyePopup = writable(false);
export const goodbyeProgress = writable(0);

// Install state
export const installState = writable({
    installed: false,
    installing: false,
    progress: 0,
    missingFiles: []
});

// Config toast
export const configToastVisible = writable(false);
export const configToastMessage = writable('Settings saved');

// Debug UI visible (set when game reaches intro animation)
export const debugUIVisible = writable(false);

// Game running state
export const gameRunning = writable(false);

// Multiplayer player count (push-based from C++ via CustomEvent)
export const multiplayerPlayerCount = writable(null);

// Third-person camera state (push-based from C++ via CustomEvent)
export const thirdPersonEnabled = writable(true);

// Name bubbles visibility (push-based from C++ via CustomEvent)
export const showNameBubbles = writable(true);

// Allow customization setting (push-based from C++ via CustomEvent)
export const allowCustomize = writable(true);

// Connection status (push-based from C++ via CustomEvent)
// Values: null (no session), 'connected', 'reconnecting', 'failed'
export const connectionStatus = writable(null);

// Service worker registration
export const swRegistration = writable(null);

// OPFS availability
export const opfsDisabled = writable(false);

// Animation state pushed from C++ backend (reactive, always current)
// { location, state, currentAnimIndex, animations[] }
export const animationState = writable(null);

// Set of animIndex values the player has completed at least once (from IndexedDB)
export const memoryUnlocks = writable(new Set());

// All completion records from IndexedDB (null = not loaded yet)
export const memoryCompletions = writable(null);

// Crash state — set when game aborts/crashes
export const gameCrashed = writable(null);

// Save editor state
export const saveEditorState = writable({
    slots: [],           // Array of SaveSlot objects
    selectedSlot: null,  // Currently selected slot number
    loading: true,
    error: null
});
