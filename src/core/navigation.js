// Navigation utilities
import { get } from 'svelte/store';
import { currentPage, multiplayerRoom } from '../stores.js';

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
