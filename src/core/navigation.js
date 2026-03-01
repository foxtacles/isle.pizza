// Navigation utilities
import { currentPage, multiplayerRoom } from '../stores.js';

export function navigateTo(page) {
    currentPage.set(page);
    history.pushState({ page }, '', '#' + page);
}

export function navigateBack() {
    history.back();
}

export function navigateToRoom(name) {
    multiplayerRoom.set(name);
    currentPage.set('multiplayer');
    history.pushState({ page: 'multiplayer', room: name }, '', '#r/' + name);
}

export function navigateToMultiplayer() {
    multiplayerRoom.set(null);
    currentPage.set('multiplayer');
    history.pushState({ page: 'multiplayer' }, '', '#multiplayer');
}
