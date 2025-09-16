window.onload = () => {
  const chatBox = document.getElementById('chat-box');
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  history.forEach(msg => {
    const html = msg.role === 'bot' ? marked.parse(msg.text) : escapeHtml(msg.text);
    chatBox.innerHTML += `<div class="message ${msg.role}">${msg.icon} ${msg.name}:<br>${html}</div>`;
  });
  hljs.highlightAll();
  enhanceCodeBlocks();
  chatBox.scrollTop = chatBox.scrollHeight;
};

async function sendMessage() {
  const input = document.getElementById('message');
  const chatBox = document.getElementById('chat-box');
  const userText = input.value.trim();
  if (!userText) return;

  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  history.push({ role: 'user', icon: '👤', name: 'あなた', text: userText });
  chatBox.innerHTML += `<div class="message user">👤 あなた: ${escapeHtml(userText)}</div>`;
  input.value = '';

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });

    const data = await response.json();
    const htmlReply = marked.parse(data.reply);
    history.push({ role: 'bot', icon: '🤖', name: 'ボット', text: data.reply });
    chatBox.innerHTML += `<div class="message bot">🤖 ボット:<br>${htmlReply}</div>`;
    hljs.highlightAll();
    enhanceCodeBlocks();
    chatBox.scrollTop = chatBox.scrollHeight;

    localStorage.setItem('chatHistory', JSON.stringify(history));
  } catch (error) {
    chatBox.innerHTML += `<div class="message bot">⚠️ エラー: 応答を取得できませんでした</div>`;
  }
}

function clearHistory() {
  localStorage.removeItem('chatHistory');
  document.getElementById('chat-box').innerHTML = '';
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

function enhanceCodeBlocks() {
  document.querySelectorAll('pre code').forEach((block, index) => {
    const wrapper = block.parentElement;
    if (wrapper.querySelector('.copy-btn')) return;

    const button = document.createElement('button');
    button.textContent = '📋 コピー';
    button.className = 'copy-btn btn btn-sm btn-outline-secondary';
    button.style.position = 'absolute';
    button.style.top = '5px';
    button.style.right = '10px';
    button.style.transition = 'background-color 0.3s ease, transform 0.3s ease';

    button.onclick = () => {
      navigator.clipboard.writeText(block.textContent);
      button.textContent = '✅ コピー済み';
      button.style.backgroundColor = '#198754';
      button.style.color = '#fff';
      button.style.transform = 'scale(1.05)';
      setTimeout(() => {
        button.textContent = '📋 コピー';
        button.style.backgroundColor = '';
        button.style.color = '';
        button.style.transform = '';
      }, 1500);
    };

    wrapper.style.position = 'relative';
    wrapper.insertBefore(button, block);
  });
}
