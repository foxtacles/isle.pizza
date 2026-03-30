// Navigation utilities
import { get } from 'svelte/store';
import { currentPage, multiplayerRoom, scenePlayerEventId, scenePlayerData } from '../stores.js';

export function navigateTo(page) {
    if (get(currentPage) === page) return;
    currentPage.set(page);
    history.pushState({ page }, '', '#' + page);
}

export function navigateBack() {
    history.back();
}

export function navigateToRoom(name) {
    if (get(currentPage) === 'multiplayer' && get(multiplayerRoom) === name) return;
    multiplayerRoom.set(name);
    currentPage.set('multiplayer');
    history.pushState({ page: 'multiplayer', room: name }, '', '#r/' + name);
}

export function navigateToMultiplayer() {
    if (get(currentPage) === 'multiplayer' && get(multiplayerRoom) === null) return;
    multiplayerRoom.set(null);
    currentPage.set('multiplayer');
    history.pushState({ page: 'multiplayer' }, '', '#multiplayer');
}

export function navigateToMemory(eventId) {
    scenePlayerEventId.set(eventId);
    scenePlayerData.set(null);
    currentPage.set('scene-player');
    history.pushState({ page: 'scene-player', eventId }, '', '#memory/' + eventId);
}

export function navigateToScene(animIndex, participants, language = null, timestamp = null) {
    // Use short keys to minimize encoded URL length
    const data = { a: animIndex, p: participants.map(p => ({ n: p.displayName, c: p.charIndex })) };
    if (language && language !== 'en') data.l = language;
    if (timestamp) data.t = timestamp;
    const encoded = btoa(JSON.stringify(data));
    scenePlayerEventId.set(null);
    scenePlayerData.set(data);
    currentPage.set('scene-player');
    history.pushState({ page: 'scene-player', sceneData: encoded }, '', '#scene/' + encoded);
}
