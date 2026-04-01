// Cloud sync for save files and config
import { authSession, authReady } from './auth.js';
import { API_URL } from './config.js';
import { readBinaryFile, writeBinaryFile, writeTextFile, getFileHandle, getOpfsRoot, CONFIG_FILE } from './opfs.js';
import { PLAYERS_FILE, HISTORY_FILE, getSaveFileName } from './savegame/constants.js';
import { configVersion, savesVersion } from '../stores.js';

// All save files we sync
const SAVE_FILES = [
    ...Array.from({ length: 9 }, (_, i) => getSaveFileName(i)),
    PLAYERS_FILE,
    HISTORY_FILE,
];

let currentSession = null;
let opfsAvailable = false;

export async function initCloudSync() {
    // Skip entirely if OPFS is not available
    opfsAvailable = !!(await getOpfsRoot());
    if (!opfsAvailable) return;

    currentSession = await authReady;
    if (currentSession) {
        await syncOnLogin();
    }

    authSession.subscribe(session => {
        if (session === undefined) return;
        const wasLoggedIn = !!currentSession;
        const nowLoggedIn = !!session;
        currentSession = session;
        if (wasLoggedIn === nowLoggedIn) return;
        if (nowLoggedIn) {
            syncOnLogin();
        }
    });

    // Listen for individual slot saves (gameplay) — debounced
    window.addEventListener('opfs-save-slot-written', (e) => {
        if (currentSession) {
            const slotFile = getSaveFileName(e.detail.slot);
            pendingFiles.add(slotFile);
            pendingFiles.add(HISTORY_FILE);
            scheduleSaveUpload();
        }
    });

    // Listen for full state changes (player registration/switching)
    window.addEventListener('opfs-save-state-changed', () => {
        if (currentSession) {
            for (const f of SAVE_FILES) pendingFiles.add(f);
            scheduleSaveUpload();
        }
    });

    // Listen for config writes
    window.addEventListener('opfs-config-written', (e) => {
        if (currentSession) {
            uploadConfig(e.detail.iniText);
        }
    });
}

async function syncOnLogin() {
    await syncSaves().catch(e => console.warn('[CloudSync] Save sync failed:', e));
    await syncConfig().catch(e => console.warn('[CloudSync] Config sync failed:', e));
}

// --- Save sync ---

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

async function syncSaves() {
    // Read all local save files
    const localSaves = [];
    for (const filename of SAVE_FILES) {
        const data = await readBinaryFile(filename);
        if (data) {
            localSaves.push({ filename, data: arrayBufferToBase64(data) });
        }
    }

    const res = await fetch(`${API_URL}/api/cloud/saves/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ saves: localSaves }),
    });

    if (!res.ok) return;

    const { saves: serverSaves } = await res.json();
    if (!Array.isArray(serverSaves) || serverSaves.length === 0) return;

    // Server returned saves — write them to OPFS (cloud overrides local)
    for (const save of serverSaves) {
        try {
            const buffer = base64ToArrayBuffer(save.data);
            await writeBinaryFile(save.filename, buffer, true);
        } catch (e) {
            console.warn('[CloudSync] Failed to write save file:', save.filename, e);
        }
    }
    savesVersion.update(n => n + 1);
}

// --- Debounced batch upload ---

const pendingFiles = new Set();
let uploadTimer = null;
const UPLOAD_DEBOUNCE_MS = 3000;

function scheduleSaveUpload() {
    if (uploadTimer) clearTimeout(uploadTimer);
    uploadTimer = setTimeout(flushSaveUpload, UPLOAD_DEBOUNCE_MS);
}

async function flushSaveUpload() {
    uploadTimer = null;
    const filenames = [...pendingFiles];
    pendingFiles.clear();
    if (filenames.length === 0) return;

    const saves = [];
    for (const filename of filenames) {
        const data = await readBinaryFile(filename);
        if (data) {
            saves.push({ filename, data: arrayBufferToBase64(data) });
        }
    }

    if (saves.length === 0) return;

    fetch(`${API_URL}/api/cloud/saves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ saves }),
    }).catch(e => console.warn('[CloudSync] Save upload failed:', e));
}

// --- Config sync ---

async function syncConfig() {
    // Read local config
    let localConfig = null;
    try {
        const handle = await getFileHandle(CONFIG_FILE, false);
        if (handle) {
            const file = await handle.getFile();
            localConfig = await file.text();
        }
    } catch {}

    const res = await fetch(`${API_URL}/api/cloud/config/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ config: localConfig || '' }),
    });

    if (!res.ok) return;

    const { config: serverConfig } = await res.json();
    if (!serverConfig) return;

    // Server returned config — write to OPFS (cloud overrides local)
    await writeTextFile(CONFIG_FILE, serverConfig, true);
    configVersion.update(n => n + 1);
}

function uploadConfig(iniText) {
    fetch(`${API_URL}/api/cloud/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ config: iniText }),
    }).catch(e => console.warn('[CloudSync] Config upload failed:', e));
}
