// OPFS Config Manager - handles saving/loading configuration via Origin Private File System
import { configToastVisible, configToastMessage, configToastError } from '../stores.js';

const CONFIG_FILE = 'isle.ini';
const RELAY_URL = __RELAY_URL__;
let toastTimeout = null;

// Multiplayer state (kept in sync with INI)
let _mpEnabled = false;
let _mpRoom = null;
let _mpRelayUrl = RELAY_URL;

export function setMultiplayerConfig(enabled, room = null, relayUrl = RELAY_URL) {
    _mpEnabled = enabled;
    _mpRoom = room;
    _mpRelayUrl = relayUrl;
}

export { RELAY_URL };

// ============================================================================
// Core OPFS Operations
// ============================================================================

/**
 * Get OPFS root directory
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function getOpfsRoot() {
    try {
        return await navigator.storage.getDirectory();
    } catch (e) {
        console.error("OPFS not available or permission denied.", e);
        return null;
    }
}

/**
 * Get a file handle from OPFS
 * @param {string} filename - Name of the file
 * @param {boolean} create - Whether to create the file if it doesn't exist
 * @returns {Promise<FileSystemFileHandle|null>}
 */
export async function getFileHandle(filename = CONFIG_FILE, create = true) {
    try {
        const root = await getOpfsRoot();
        if (!root) return null;
        return await root.getFileHandle(filename, { create });
    } catch (e) {
        if (e.name === 'NotFoundError') return null;
        console.error("Failed to get file handle:", e);
        return null;
    }
}

/**
 * Check if a file exists in OPFS
 * @param {string} filename - Name of the file
 * @returns {Promise<boolean>}
 */
export async function fileExists(filename) {
    const handle = await getFileHandle(filename, false);
    return handle !== null;
}

/**
 * Read a binary file from OPFS
 * @param {string} filename - Name of the file
 * @returns {Promise<ArrayBuffer|null>} - File contents or null if not found
 */
export async function readBinaryFile(filename) {
    try {
        const handle = await getFileHandle(filename, false);
        if (!handle) return null;

        const file = await handle.getFile();
        return await file.arrayBuffer();
    } catch (e) {
        console.error('Failed to read binary file:', e);
        return null;
    }
}

/**
 * Write a binary file to OPFS using Web Worker pattern (Safari-compatible)
 * @param {string} filename - Name of the file
 * @param {ArrayBuffer|Uint8Array} data - Binary data to write
 * @param {boolean} silent - If true, don't show toast notification
 * @param {string} toastMsg - Custom toast message (default: 'Settings saved')
 * @returns {Promise<boolean>} - True if successful
 */
export async function writeBinaryFile(filename, data, silent = false, toastMsg = 'Settings saved') {
    const workerCode = `
        self.onmessage = async (e) => {
            try {
                const root = await navigator.storage.getDirectory();
                const handle = await root.getFileHandle(e.data.filename, { create: true });
                const accessHandle = await handle.createSyncAccessHandle();
                const bytes = new Uint8Array(e.data.buffer);

                accessHandle.truncate(0);
                accessHandle.write(bytes, { at: 0 });
                accessHandle.flush();
                accessHandle.close();

                self.postMessage({ status: 'success', message: 'File saved: ' + e.data.filename });
            } catch (err) {
                self.postMessage({ status: 'error', message: 'Failed to save file: ' + err.message });
            }
        };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    return new Promise((resolve) => {
        worker.postMessage({ filename, buffer: data });

        worker.onmessage = (e) => {
            console.log(e.data.message);
            URL.revokeObjectURL(workerUrl);
            worker.terminate();

            if (e.data.status === 'success') {
                if (!silent) {
                    showToast(toastMsg);
                }
                resolve(true);
            } else {
                resolve(false);
            }
        };

        worker.onerror = (e) => {
            console.error('An error occurred in the file-saving worker:', e.message);
            URL.revokeObjectURL(workerUrl);
            worker.terminate();
            resolve(false);
        };
    });
}

/**
 * Write a text file to OPFS
 * @param {string} filename - Name of the file
 * @param {string} content - Text content to write
 * @param {boolean} silent - If true, don't show toast notification
 * @param {string} toastMsg - Custom toast message
 * @returns {Promise<boolean>} - True if successful
 */
export async function writeTextFile(filename, content, silent = false, toastMsg = 'Settings saved') {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    return writeBinaryFile(filename, data.buffer, silent, toastMsg);
}

/**
 * List all files in OPFS matching a pattern
 * @param {RegExp} pattern - Regular expression to match filenames
 * @returns {Promise<string[]>} - Array of matching filenames
 */
export async function listFiles(pattern) {
    try {
        const root = await getOpfsRoot();
        if (!root) return [];

        const files = [];
        for await (const entry of root.values()) {
            if (entry.kind === 'file' && pattern.test(entry.name)) {
                files.push(entry.name);
            }
        }
        return files;
    } catch (e) {
        console.error('Failed to list files:', e);
        return [];
    }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 */
function showToast(message) {
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    configToastMessage.set(message);
    configToastError.set(false);
    configToastVisible.set(true);
    toastTimeout = setTimeout(() => configToastVisible.set(false), 2000);
}

// ============================================================================
// Multiplayer Config Operations
// ============================================================================

export async function updateMultiplayerInConfig(enabled, roomName = null, relayUrl = RELAY_URL) {
    setMultiplayerConfig(enabled, roomName, relayUrl);

    // Read existing INI text
    let text = '';
    try {
        const handle = await getFileHandle(CONFIG_FILE, false);
        if (handle) {
            const file = await handle.getFile();
            text = await file.text();
        }
    } catch (e) {
        // File doesn't exist yet, start fresh
    }

    // Process line-by-line: remove existing multiplayer config
    const lines = text.split('\n');
    const filtered = [];
    let inMultiplayerSection = false;
    let hasExtensionsSection = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip existing multiplayer key in [extensions]
        if (trimmed.toLowerCase().startsWith('multiplayer=')) continue;

        // Track/skip [multiplayer] section
        if (trimmed === '[multiplayer]') {
            inMultiplayerSection = true;
            continue;
        }
        if (inMultiplayerSection) {
            if (trimmed.startsWith('[')) {
                inMultiplayerSection = false;
                // Fall through to process this line normally
            } else {
                continue;
            }
        }

        if (trimmed === '[extensions]') hasExtensionsSection = true;
        filtered.push(line);
    }

    // Build result
    const result = [];
    let extensionsWritten = false;

    for (const line of filtered) {
        result.push(line);
        if (line.trim() === '[extensions]') {
            result.push(`Multiplayer=${enabled ? 'YES' : 'NO'}`);
            extensionsWritten = true;
        }
    }

    // If no [extensions] section existed, add one
    if (!hasExtensionsSection) {
        result.push('[extensions]');
        result.push(`Multiplayer=${enabled ? 'YES' : 'NO'}`);
    }

    // Append [multiplayer] section if enabled
    if (enabled && roomName) {
        result.push('[multiplayer]');
        result.push(`relay url=${relayUrl}`);
        result.push(`room=${roomName}`);
    }

    // Clean up trailing empty lines and ensure final newline
    let output = result.join('\n').replace(/\n+$/, '') + '\n';

    return writeTextFile(CONFIG_FILE, output, true);
}

// ============================================================================
// Config File Operations
// ============================================================================

export async function loadConfig(form) {
    const handle = await getFileHandle(CONFIG_FILE, true);
    if (!handle) return null;

    try {
        const file = await handle.getFile();
        const text = await file.text();
        if (!text) {
            console.log('No existing config file found, using defaults.');
            return null;
        }

        const config = {};
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.startsWith('[') || !line.includes('=')) continue;
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();
            config[key.trim()] = value;
        }

        applyConfigToForm(form, config);
        console.log('Config loaded from', CONFIG_FILE);
        return config;
    } catch (e) {
        console.error('Failed to load config:', e);
        return null;
    }
}

function applyConfigToForm(form, config) {
    const elements = form.elements;
    for (const key in config) {
        if (key === "files") {
            const hdMusic = elements["HD Music"];
            const widescreenBgs = elements["Widescreen Backgrounds"];
            const badEnding = elements["Extended Bad Ending FMV"];
            if (hdMusic) hdMusic.checked = config[key].includes("hdmusic.si");
            if (widescreenBgs) widescreenBgs.checked = config[key].includes("widescreen.si");
            if (badEnding) badEnding.checked = config[key].includes("badend.si");
            continue;
        }

        if (key === "directives") {
            const outroFmv = elements["Outro FMV"];
            if (outroFmv) outroFmv.checked = config[key].includes("intro:3");
            continue;
        }

        const element = elements[key];
        if (!element) continue;

        const value = config[key];

        if (element.type === 'checkbox') {
            element.checked = (value === 'YES');
        } else if (element.nodeName === 'RADIO') {
            for (const radio of element) {
                if (radio.value === value) {
                    radio.checked = true;
                    break;
                }
            }
        } else {
            element.value = value;
        }
    }
}

export async function saveConfig(form, getSiFiles, silent = false) {
    let iniContent = '[isle]\n';
    const elements = form.elements;

    for (const element of elements) {
        if (!element.name || element.dataset.notIni === "true") continue;

        let value;
        switch (element.type) {
            case 'checkbox':
                value = element.checked ? 'YES' : 'NO';
                iniContent += `${element.name}=${value}\n`;
                break;
            case 'radio':
                if (element.checked) {
                    value = element.value;
                    iniContent += `${element.name}=${value}\n`;
                }
                break;
            default:
                value = element.value;
                iniContent += `${element.name}=${value}\n`;
                break;
        }
    }

    const hdTextures = elements["Texture Loader"];
    if (hdTextures) {
        iniContent += "[extensions]\n";
        const value = hdTextures.checked ? 'YES' : 'NO';
        iniContent += `${hdTextures.name}=${value}\n`;
        iniContent += `Multiplayer=${_mpEnabled ? 'YES' : 'NO'}\n`;
    }

    const siFiles = getSiFiles();
    const outroFmv = elements["Outro FMV"];

    if (siFiles.length > 0 || (outroFmv && outroFmv.checked)) {
        iniContent += `SI Loader=YES\n`;
        iniContent += "[si loader]\n";
    }

    if (siFiles.length > 0) {
        iniContent += `files=${siFiles.join(',')}\n`;
    }

    let directives = [];
    if (outroFmv && outroFmv.checked) {
        directives = directives.concat([
            "FullScreenMovie:\\lego\\scripts\\intro:3",
            "Disable3d:\\lego\\scripts\\credits:499",
            "Prepend:\\lego\\scripts\\intro:3:\\lego\\scripts\\credits:499",
            "RemoveWith:\\lego\\scripts\\credits:499:\\lego\\scripts\\intro:3"
        ]);
    }

    if (directives.length > 0) {
        iniContent += `directives=${directives.join(",\\\n")}\n`;
    }

    if (_mpEnabled && _mpRoom) {
        iniContent += "[multiplayer]\n";
        iniContent += `relay url=${_mpRelayUrl}\n`;
        iniContent += `room=${_mpRoom}\n`;
    }

    return writeTextFile(CONFIG_FILE, iniContent, silent);
}
