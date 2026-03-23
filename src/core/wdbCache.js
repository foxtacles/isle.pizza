import { WdbParser } from './formats/WdbParser.js';

let cached = null;

/**
 * Fetch and parse WORLD.WDB once, returning cached result on subsequent calls.
 * @returns {Promise<{ wdbParser: WdbParser, wdbData: object }>}
 */
export async function getWdb() {
    if (cached) return cached;

    const response = await fetch('/LEGO/data/WORLD.WDB');
    if (!response.ok) {
        throw new Error(`Failed to load WORLD.WDB: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const wdbParser = new WdbParser(buffer);
    const wdbData = wdbParser.parse();
    cached = { wdbParser, wdbData };
    return cached;
}
