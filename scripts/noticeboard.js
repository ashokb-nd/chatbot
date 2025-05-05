import { AuthorNameManager } from './managers/AuthorNameManager.js';
import { NoticeManager } from './managers/NoticeManager.js';
import { displayMessage, scrollToBottom, autoResizeTextarea } from './utils/uiHelpers.js';
import { shouldScrollToBottom, debounce } from './utils/helpers.js';

const FETCH_INTERVAL_MS = 180000; // Interval for fetching notices
const MAX_NOTICE_LENGTH = 1000;  // Maximum allowed notice content length

const noticesContainer = document.getElementById('noticesContainer');
const postNoticeForm = document.getElementById('postNoticeForm');
const authorNameInput = document.getElementById('authorName');
const noticeContentInput = document.getElementById('noticeContent');
const messageDiv = document.getElementById('message');
let lastRowNumber = 0;

displayMessage("version 9.0.3", "green");
/**
 * Initializes the noticeboard application.
 * Sets up event listeners, loads stored notices, and starts periodic fetching of new notices.
 */
function initialize() {
    AuthorNameManager.initialize(authorNameInput);

    const storedNotices = NoticeManager.loadFromLocal();
    NoticeManager.appendToContainer(storedNotices, noticesContainer);
    lastRowNumber = NoticeManager.loadLastRowNumber();

    setInterval(() => {
        fetchNotices().then(fetched => {
            if (fetched && shouldScrollToBottom(noticesContainer)) {
                scrollToBottom();
            }
        });
    }, FETCH_INTERVAL_MS);

    setupEventListeners();
    fetchNotices().then(scrollToBottom);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/chatbot/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }
}

/**
 * Sets up event listeners for form submission and input changes.
 */
function setupEventListeners() {
    postNoticeForm.addEventListener('submit', handleFormSubmit);
    authorNameInput.addEventListener('input', debounce(() => AuthorNameManager.save(authorNameInput), 300));
    noticeContentInput.addEventListener('input', autoResizeTextarea);
}

/**
 * Handles the form submission for posting a new notice.
 * @param {Event} event - The form submission event.
 */
function handleFormSubmit(event) {
    event.preventDefault();
    const author = authorNameInput.value.trim();
    const content = noticeContentInput.value.trim();

    // set focus to message input area
    noticeContentInput.focus();

    if (author && content) {
        postNotice(author, content);
    } else {
        displayMessage('Please enter your name.', 'orange');
    }
}

/**
 * Fetches notices from the server and appends them to the container.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating success.
 */
function fetchNotices() {
    return NoticeManager.fetchAndHandleNotices(lastRowNumber, noticesContainer)
        .then(({ success, newLastRowNumber }) => {
            if (success) {
                lastRowNumber = newLastRowNumber;
            }
            return success;
        });
}

/**
 * Posts a new notice to the server and appends it to the container.
 * @param {string} author - The name of the author.
 * @param {string} content - The content of the notice.
 */
function postNotice(author, content) {
    if (content.length > MAX_NOTICE_LENGTH) {
        displayMessage(`Notice content exceeds ${MAX_NOTICE_LENGTH} characters. Please split it into multiple posts.`, 'orange');
        return;
    }

    const id = NoticeManager.postNotice(author, content, noticesContainer, noticeContentInput, messageDiv);
    if (id) scrollToBottom();
}

initialize();
