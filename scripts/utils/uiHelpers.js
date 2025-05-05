export function displayMessage(text, color = 'red') {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<span style="color: ${color}; text-align: center; display: block;">${text}</span>`;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 30000);
}

export function scrollToBottom() {
    const noticesContainer = document.getElementById('noticesContainer');
    noticesContainer.scrollTop = noticesContainer.scrollHeight;
}

export function autoResizeTextarea() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
}
