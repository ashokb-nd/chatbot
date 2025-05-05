const fixedColors = [
    '#8B4513', '#556B2F', '#4682B4', '#6A5ACD', '#708090',
    '#2F4F4F', '#8B0000', '#B8860B', '#A0522D', '#5F9EA0',
    '#7B68EE', '#483D8B', '#2E8B57', '#4B0082', '#696969',
    '#8B008B', '#9932CC', '#8FBC8F', '#778899', '#6B8E23'
];
const userColorMap = new Map();

import { displayMessage } from './uiHelpers.js'; // Ensure this import exists for displayMessage

export function generateTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

export function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback implementation for UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function generateRandomSuffix() {
    return Math.random().toString(36).substring(2, 6);
}

export function getColorForUser(username) {
    if (!userColorMap.has(username)) {
        const colorIndex = userColorMap.size % fixedColors.length;
        userColorMap.set(username, fixedColors[colorIndex]);
    }
    return userColorMap.get(username);
}

export function shouldScrollToBottom(container) {
    return container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
}

export function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

export async function fetchWithErrorHandling(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        displayMessage('An error occurred. Please try again later.', 'red');
        throw error;
    }
}
