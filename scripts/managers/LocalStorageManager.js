export class LocalStorageManager {
    static getItem(key, defaultValue = null) {
        const value = localStorage.getItem(key);
        try {
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.warn(`Non-JSON value found for key "${key}":`, value);
            return value || defaultValue;
        }
    }

    static setItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static removeItem(key) {
        localStorage.removeItem(key);
    }
}
