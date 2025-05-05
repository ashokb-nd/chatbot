// Constants and Global Variables
const noticesContainer = document.getElementById('noticesContainer');
const postNoticeForm = document.getElementById('postNoticeForm');
const authorNameInput = document.getElementById('authorName');
const noticeContentInput = document.getElementById('noticeContent');
const messageDiv = document.getElementById('message');
const webAppUrl = 'https://script.google.com/macros/s/AKfycbx0BTH66hmLvmJfSWCkm2go4FQDcwhZ2_3_6ITiPl_ctXp9xyQxHNzay_ageWmnAqu7/exec';
const fixedColors = [
    '#8B4513', '#556B2F', '#4682B4', '#6A5ACD', '#708090',
    '#2F4F4F', '#8B0000', '#B8860B', '#A0522D', '#5F9EA0',
    '#7B68EE', '#483D8B', '#2E8B57', '#4B0082', '#696969',
    '#8B008B', '#9932CC', '#8FBC8F', '#778899', '#6B8E23'
];
const userColorMap = new Map();
let lastRowNumber = 0;
let uuids = new Set();

// Utility Functions
function generateTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

function generateUUID() {
    return crypto.randomUUID();
}

function generateRandomSuffix() {
    return Math.random().toString(36).substring(2, 6);
}

function getColorForUser(username) {
    if (!userColorMap.has(username)) {
        const colorIndex = userColorMap.size % fixedColors.length;
        userColorMap.set(username, fixedColors[colorIndex]);
    }
    return userColorMap.get(username);
}

// Local Storage Management
function initializeAuthorName() {
    if (!localStorage.getItem('authorName')) {
        const defaultName = `User_${generateRandomSuffix()}`;
        localStorage.setItem('authorName', defaultName);
    }
    authorNameInput.value = localStorage.getItem('authorName');
}

function saveAuthorName() {
    localStorage.setItem('authorName', authorNameInput.value.trim());
}

// UI Helpers
function displayMessage(text, color = 'red') {
    messageDiv.innerHTML = `<span style="color: ${color}; text-align: center; display: block;">${text}</span>`;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 30000);
}

function scrollToBottom() {
    noticesContainer.scrollTop = noticesContainer.scrollHeight;
}

function autoResizeTextarea() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
}

// Notice Management
function createNoticeElement(row) {
    const [id, author, content, timestamp] = row;
    if (uuids.has(id)) return null;

    uuids.add(id);
    const noticeDiv = document.createElement('div');
    const isCurrentUser = author === localStorage.getItem('authorName');
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

function appendNotices(noticesArray) {
    const fragment = document.createDocumentFragment();
    noticesArray.forEach(row => {
        const noticeElement = createNoticeElement(row);
        if (noticeElement) {
            fragment.appendChild(noticeElement);
        }
    });
    noticesContainer.appendChild(fragment);
}

// Fetch Notices
function fetchNotices() {
    return fetch(`${webAppUrl}?action=getNotices&lastRowNumber=${lastRowNumber}`)
        .then(response => response.json())
        .then(data => {
            lastRowNumber = data.lastRowNumber;
            const noticesArray = data.data;
            if (noticesArray.length === 0) {
                displayMessage('No new notices available.', 'orange');
                return false;
            }
            appendNotices(noticesArray);
            return true;
        })
        .catch(error => {
            console.error('Error fetching notices:', error);
            displayMessage('Failed to load notices. Please try again later.');
            return false;
        });
}

// Post Notice
function postNotice(author, content) {
    if (content.length > 1000) {
        displayMessage('Notice content exceeds 1000 characters. Please split it into multiple posts.', 'orange');
        return;
    }

    const id = generateUUID();
    const timestamp = generateTimestamp();
    const noticeElement = createNoticeElement([id, author, content, timestamp]);

    if (noticeElement) {
        noticesContainer.appendChild(noticeElement);
        scrollToBottom();
    }

    const previousContent = content;
    noticeContentInput.value = '';

    const formData = new URLSearchParams({ id, timestamp, author, content });

    fetch(`${webAppUrl}?action=postNotice`, {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                uuids.delete(id);
                noticesContainer.removeChild(noticeElement);
                displayMessage(data.error || 'Failed to post notice.');
                noticeContentInput.value = previousContent;
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
        .catch(error => {
            console.error('Error posting notice:', error);
            uuids.delete(id);
            noticesContainer.removeChild(noticeElement);
            displayMessage('Failed to post notice. Please try again later.');
            noticeContentInput.value = previousContent;
        });
}

// Event Listeners
postNoticeForm.addEventListener('submit', function(event) {
    event.preventDefault();
    noticeContentInput.focus();
    const author = authorNameInput.value.trim();
    const content = noticeContentInput.value.trim();

    if (author && content) {
        postNotice(author, content);
    } else {
        displayMessage('Please enter your name.', 'orange');
    }
});

authorNameInput.addEventListener('input', () => {
    clearTimeout(saveAuthorNameTimeout);
    saveAuthorNameTimeout = setTimeout(saveAuthorName, 300);
});

noticeContentInput.addEventListener('input', autoResizeTextarea);

// Initialization
initializeAuthorName();
fetchNotices().then(scrollToBottom);

// Periodic Updates
setInterval(() => {
    fetchNotices().then(fetched => {
        if (fetched && noticesContainer.scrollHeight - noticesContainer.scrollTop <= noticesContainer.clientHeight + 100) {
            scrollToBottom();
        }
    });
}, 180000);
