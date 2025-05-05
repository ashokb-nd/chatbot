import { LocalStorageManager } from './LocalStorageManager.js';
import { generateRandomSuffix } from '../utils/helpers.js';

export class AuthorNameManager {
    static initialize(inputElement) {
        const authorName = LocalStorageManager.getItem('authorName', `User_${generateRandomSuffix()}`);
        LocalStorageManager.setItem('authorName', authorName);
        inputElement.value = authorName;
    }

    static save(inputElement) {
        const authorName = inputElement.value.trim();
        LocalStorageManager.setItem('authorName', authorName);
    }

    static get() {
        return LocalStorageManager.getItem('authorName');
    }
}
