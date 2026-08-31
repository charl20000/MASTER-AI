const API_URL = window.location.origin;
let messageHistory = [];

async function sendMessage() {
    const input = document.getElementById('inputMessage');
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';
    input.focus();
    showTyping();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history: messageHistory })
        });

        const data = await response.json();
        hideTyping();

        if (data.success) {
            addMessage(data.message, 'bot');
            messageHistory.push({ role: 'user', content: message });
            messageHistory.push({ role: 'assistant', content: data.message });
        } else {
            addMessage('❌ ' + (data.error || data.message || 'Erreur inconnue'), 'bot');
        }
    } catch (error) {
        hideTyping();
        addMessage('❌ Erreur de connexion : ' + error.message, 'bot');
    }
}

function addMessage(text, sender) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerHTML = `
        <div class="avatar">${sender === 'user' ? '👤' : '🧠'}</div>
        <div class="bubble">${text}</div>
    `;
    container.appendChild(div);
    document.getElementById('chatContainer').scrollTop = document.getElementById('chatContainer').scrollHeight;
}

function showTyping() {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'message bot';
    div.id = 'typingIndicator';
    div.innerHTML = `
        <div class="avatar">🧠</div>
        <div class="bubble">
            <span class="typing-dots"><span>•</span><span>•</span><span>•</span></span>
        </div>
    `;
    container.appendChild(div);
    document.getElementById('chatContainer').scrollTop = document.getElementById('chatContainer').scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

document.getElementById('inputMessage').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});

async function checkStatus() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        const dot = document.querySelector('.dot');
        const statusText = document.getElementById('statusText');
        const statsInfo = document.getElementById('statsInfo');
        
        if (data.apiStatus === '✅ En ligne') {
            dot.style.background = '#22c55e';
            statusText.textContent = 'API OK';
            statsInfo.textContent = '✅ API connectée';
        } else {
            dot.style.background = '#ef4444';
            statusText.textContent = 'Hors ligne';
            statsInfo.textContent = '❌ API déconnectée';
        }
    } catch (e) {
        document.querySelector('.dot').style.background = '#ef4444';
        document.getElementById('statusText').textContent = 'Erreur';
    }
}

checkStatus();
setInterval(checkStatus, 60000);
