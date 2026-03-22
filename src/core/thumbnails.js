// Preloads 3D thumbnails for the Memories page.
// Starts a Web Worker that fetches WORLD.WDB, parses it, and renders
// building and actor thumbnails on a background thread using OffscreenCanvas.
// The main thread only receives finished data URLs — zero blocking.
//
// Only actors that appear in the user's completions are rendered.
import { writable, get } from 'svelte/store';
import { memoryCompletions } from '../stores.js';

/** Maps location label (e.g. "Pizzeria") to a data URL of the rendered building. */
export const buildingThumbnails = writable({});

/** Maps charIndex (0-65) to a data URL of the rendered actor. */
export const actorThumbnails = writable({});

/** Collect unique charIndices from completion data. */
function getNeededActors(completions) {
    const indices = new Set();
    for (const c of completions) {
        if (c.participants) {
            for (const p of c.participants) {
                indices.add(p.charIndex);
            }
        }
    }
    return [...indices];
}

/** Wait for memoryCompletions to be loaded (non-null). */
function waitForCompletions() {
    return new Promise(resolve => {
        const current = get(memoryCompletions);
        if (current !== null) {
            resolve(current);
            return;
        }
        const unsub = memoryCompletions.subscribe(val => {
            if (val !== null) {
                unsub();
                resolve(val);
            }
        });
    });
}

export async function initThumbnails() {
    try {
        const completions = await waitForCompletions();
        const actorIndices = getNeededActors(completions);

        const worker = new Worker(
            new URL('./thumbnails.worker.js', import.meta.url),
            { type: 'module' }
        );

        worker.onmessage = (e) => {
            switch (e.data.type) {
                case 'buildings':
                    buildingThumbnails.set(e.data.thumbnails);
                    break;
                case 'actors':
                    actorThumbnails.set(e.data.thumbnails);
                    worker.terminate();
                    break;
                case 'error':
                    console.warn('[Thumbnails] Worker error:', e.data.message);
                    worker.terminate();
                    break;
            }
        };

        worker.onerror = (e) => {
            console.warn('[Thumbnails] Worker failed:', e.message);
        };

        worker.postMessage({ actorIndices });
    } catch (e) {
        console.warn('[Thumbnails] Thumbnails unavailable:', e);
    }
}
