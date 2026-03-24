// IndexedDB-based memory persistence for animation completions
import { memoryUnlocks, memoryCompletions } from '../stores.js';
import { authSession, authReady } from './auth.js';
import { API_URL } from './config.js';

const DB_NAME = 'isle-pizza-memories';
const DB_VERSION = 1;
const STORE_NAME = 'completions';

let db = null;
let currentSession = null;

export async function initMemories() {
    try {
        db = await new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const database = e.target.result;
                const store = database.createObjectStore(STORE_NAME, { autoIncrement: true });
                store.createIndex('objectId', 'objectId', { unique: false });
                store.createIndex('eventId', 'eventId', { unique: true });
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => reject(e.target.error);
        });
        await rebuildStores();

        // Wait for initial auth check to complete, then sync if logged in.
        // authReady resolves once regardless of timing — no race conditions.
        currentSession = await authReady;
        if (currentSession) {
            await syncWithServer();
        }

        // Watch subsequent auth transitions (login/logout after init).
        // The subscription fires immediately with the current value — if it
        // matches what authReady gave us, it's a no-op.
        authSession.subscribe(session => {
            if (session === undefined) return;

            const wasLoggedIn = !!currentSession;
            const nowLoggedIn = !!session;
            currentSession = session;

            if (wasLoggedIn === nowLoggedIn) return;
            if (nowLoggedIn) syncWithServer();
            else clearLocalMemories();
        });
    } catch (e) {
        console.error('[Memory] Failed to open IndexedDB:', e);
    }
}

export async function recordCompletion(objectId, eventId, participants) {
    if (!db) return;
    try {
        let wasDuplicate = false;
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const req = tx.objectStore(STORE_NAME).add({
                objectId,
                eventId,
                t: Math.floor(Date.now() / 1000),
                participants
            });
            req.onerror = (e) => {
                if (req.error?.name === 'ConstraintError') {
                    e.preventDefault();
                    wasDuplicate = true;
                }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });

        if (wasDuplicate) return;

        await rebuildStores();

        if (currentSession && participants.length > 0) {
            reportToServer(objectId, eventId, participants);
        }
    } catch (e) {
        console.error('[Memory] Failed to record completion:', e);
    }
}

/**
 * Read all completions from IndexedDB, rebuild the Svelte stores,
 * and return the records array.
 */
async function rebuildStores() {
    if (!db) return [];
    const records = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
    memoryUnlocks.set(new Set(records.map(r => r.objectId)));
    memoryCompletions.set(records);
    return records;
}

/**
 * Clear all completions from IndexedDB and reset both stores.
 */
export async function clearLocalMemories() {
    if (!db) {
        memoryUnlocks.set(new Set());
        memoryCompletions.set([]);
        return;
    }
    try {
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
        memoryUnlocks.set(new Set());
        memoryCompletions.set([]);
        console.log('[Memory] Cleared local memories');
    } catch (e) {
        console.error('[Memory] Failed to clear local memories:', e);
    }
}

// --- Server sync ---

async function reportToServer(objectId, eventId, participants) {
    try {
        await fetch(`${API_URL}/api/memories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ objectId, eventId, participants })
        });
    } catch (e) {
        console.warn('[Memory] Failed to report to server:', e);
    }
}

async function syncWithServer() {
    if (!db) return;
    try {
        const localCompletions = await rebuildStores();

        const res = await fetch(`${API_URL}/api/memories/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ completions: localCompletions })
        });

        if (!res.ok) return;

        const { completions: serverCompletions } = await res.json();
        if (!Array.isArray(serverCompletions)) return;

        // Merge server-only completions into IndexedDB
        const localEventIds = new Set(localCompletions.map(c => c.eventId));
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const sc of serverCompletions) {
            if (!localEventIds.has(sc.event_id)) {
                store.add({
                    objectId: sc.object_id,
                    eventId: sc.event_id,
                    t: sc.completed_at,
                    participants: JSON.parse(sc.participants || '[]')
                });
            }
        }

        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e.target.error);
        });

        await rebuildStores();
        console.log('[Memory] Synced with server');
    } catch (e) {
        console.warn('[Memory] Sync failed:', e);
    }
}
