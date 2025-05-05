import { LocalStorageManager } from './LocalStorageManager.js';
import { getColorForUser, generateUUID, generateTimestamp } from '../utils/helpers.js';
import { fetchWithErrorHandling } from '../utils/helpers.js'; // Corrected import
import { displayMessage } from '../utils/uiHelpers.js';

const webAppUrl = 'https://script.google.com/macros/s/AKfycbx0BTH66hmLvmJfSWCkm2go4FQDcwhZ2_3_6ITiPl_ctXp9xyQxHNzay_ageWmnAqu7/exec';
const uuids = new Set();

/**
 * Manages notices, including fetching, saving, and posting notices.
 */
export class NoticeManager {
    /**
     * Fetches notices from the server.
     * @param {number} lastRowNumber - The last row number fetched.
     * @returns {Promise<{success: boolean, notices: Array, lastRowNumber: number}>} - A promise resolving to the fetched notices and status.
     */
    static fetchFromServer(lastRowNumber) {
        const url = `${webAppUrl}?action=getNotices&lastRowNumber=${lastRowNumber}`;
        return fetchWithErrorHandling(url)
            .then(data => {
                if (data.data.length === 0) {
                    displayMessage('No new notices available.', 'orange');
                    return { success: false, notices: [] };
                }
                return { success: true, notices: data.data, lastRowNumber: data.lastRowNumber };
            })
            .catch(() => ({ success: false, notices: [] }));
    }

    /**
     * Saves notices to local storage.
     * @param {Array} noticesArray - The array of notices to save.
     */
    static saveToLocal(noticesArray) {
        const storedNotices = LocalStorageManager.getItem('notices', []);
        const updatedNotices = [...storedNotices, ...noticesArray];
        LocalStorageManager.setItem('notices', updatedNotices);
    }

    /**
     * Loads notices from local storage.
     * @returns {Array} - The array of stored notices.
     */
    static loadFromLocal() {
        return LocalStorageManager.getItem('notices', []);
    }

    /**
     * Saves the last row number to local storage.
     * @param {number} rowNumber - The last row number to save.
     */
    static saveLastRowNumber(rowNumber) {
        LocalStorageManager.setItem('lastRowNumber', rowNumber);
    }

    /**
     * Loads the last row number from local storage.
     * @returns {number} - The last row number.
     */
    static loadLastRowNumber() {
        return LocalStorageManager.getItem('lastRowNumber', 0);
    }

    /**
     * Creates a notice element for display.
     * @param {Array} row - The row data for the notice.
     * @returns {HTMLElement|null} - The created notice element or null if the notice already exists.
     */
    static createNoticeElement(row) {
        const [id, author, content, timestamp] = row;
        if (uuids.has(id)) return null;

        uuids.add(id);
        const noticeDiv = document.createElement('div');
        const isCurrentUser = author === LocalStorageManager.getItem('authorName');
        noticeDiv.className = isCurrentUser ? 'my_notice' : 'notice';

        const authorColor = getColorForUser(author);
        noticeDiv.innerHTML = `
            <div class="author" style="color: ${authorColor};">~${author}</div>
            <p>${content}</p>
            <div class="timestamp">
                ${timestamp}
                ${isCurrentUser ? '<span class="tick" style="display: none;">✔</span>' : ''}
            </div>
        `;
        return noticeDiv;
    }

    /**
     * Appends notices to the container.
     * @param {Array} noticesArray - The array of notices to append.
     * @param {HTMLElement} container - The container element.
     */
    static appendToContainer(noticesArray, container) {
        const fragment = document.createDocumentFragment();
        noticesArray.forEach(row => {
            const noticeElement = this.createNoticeElement(row);
            if (noticeElement) {
                fragment.appendChild(noticeElement);
            }
        });
        container.appendChild(fragment);
    }

    /**
     * Fetches and handles notices, saving them locally and appending to the container.
     * @param {number} lastRowNumber - The last row number fetched.
     * @param {HTMLElement} container - The container element.
     * @returns {Promise<{success: boolean, newLastRowNumber: number}>} - A promise resolving to the fetch status and new last row number.
     */
    static fetchAndHandleNotices(lastRowNumber, container) {
        return this.fetchFromServer(lastRowNumber)
            .then(({ success, notices, lastRowNumber: newLastRowNumber }) => {
                if (success) {
                    this.saveLastRowNumber(newLastRowNumber);
                    this.saveToLocal(notices);
                    this.appendToContainer(notices, container);
                }
                return { success, newLastRowNumber };
            });
    }

    /**
     * Posts a new notice to the server and appends it to the container.
     * @param {string} author - The name of the author.
     * @param {string} content - The content of the notice.
     * @param {HTMLElement} container - The container element.
     * @param {HTMLInputElement} inputElement - The input element for the notice content.
     * @param {HTMLElement} messageDiv - The message display element.
     * @returns {string} - The ID of the posted notice.
     */
    static postNotice(author, content, container, inputElement, messageDiv) {
        const id = generateUUID();
        const timestamp = generateTimestamp();
        const noticeElement = this.createNoticeElement([id, author, content, timestamp]);

        if (noticeElement) {
            container.appendChild(noticeElement);
        }

        const previousContent = content;
        inputElement.value = '';

        const formData = new URLSearchParams({ id, timestamp, author, content });
        const url = `${webAppUrl}?action=postNotice`;

        fetchWithErrorHandling(url, { method: 'POST', body: formData })
            .then(data => {
                if (!data.success) {
                    uuids.delete(id);
                    container.removeChild(noticeElement);
                    displayMessage(data.error || 'Failed to post notice.', 'red');
                    inputElement.value = previousContent;
                } else {
                    const audio = document.getElementById('post_audio');
                    audio.currentTime = 0;
                    audio.play();

                    const tickElement = noticeElement.querySelector('.tick');
                    if (tickElement) {
                        tickElement.style.display = 'inline';
                    }
                }
            })
            .catch(() => {
                uuids.delete(id);
                container.removeChild(noticeElement);
                inputElement.value = previousContent;
            });

        return id;
    }
}
