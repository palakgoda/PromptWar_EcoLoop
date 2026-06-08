// --- Chat Assistant Client Logic ---

let conversationHistory = [];

/**
 * Initializes the chat assistant event listeners.
 */
export function initAssistant(state) {
  const chatForm = document.getElementById('chat-input-form');
  const chatInput = document.getElementById('chat-input');
  const chatBox = document.getElementById('chat-box');

  if (!chatForm || !chatInput || !chatBox) return;

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // Sanitize user input to protect against simple XSS/Injection
    const sanitizedMessage = sanitizeString(message);
    chatInput.value = '';

    // Append user message
    appendMessage(chatBox, 'user', sanitizedMessage);
    conversationHistory.push({ role: 'user', content: sanitizedMessage });

    // Scroll to bottom
    scrollToBottom(chatBox);

    // Show typing indicator
    const typingIndicator = showTypingIndicator(chatBox);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sanitizedMessage,
          history: conversationHistory.slice(-6), // Keep context size optimized (last 6 exchanges)
          persona: state.persona,
          footprint: state.currentWeeklyFootprint,
          completedActions: state.completedActions
        })
      });

      // Remove typing indicator
      typingIndicator.remove();

      if (!response.ok) {
        throw new Error('Failed to fetch from assistant endpoint');
      }

      const data = await response.json();
      const reply = data.reply || 'Sorry, I encountered an error answering your request.';
      
      appendMessage(chatBox, 'assistant', reply);
      conversationHistory.push({ role: 'assistant', content: reply });
      scrollToBottom(chatBox);
    } catch (err) {
      console.error(err);
      typingIndicator.remove();
      appendMessage(chatBox, 'assistant', 'Sorry, I am having trouble connecting to my server right now. Please check if the server is running.');
      scrollToBottom(chatBox);
    }
  });
}

/**
 * Sanitizes input string to prevent script injection.
 */
function sanitizeString(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

/**
 * Renders simple markdown-like text (line breaks, bold, bullet points) as clean HTML.
 */
function formatMessageHTML(text) {
  // Convert double linebreaks to paragraphs
  let html = text
    .split(/\n\n+/)
    .map(p => {
      // Bold syntax **text** -> <strong>text</strong>
      let formatted = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Bullets check
      if (formatted.trim().startsWith('*') || formatted.trim().startsWith('-')) {
        const items = formatted
          .split(/\n[\*\-]\s+/)
          .map(item => item.replace(/^[\*\-]\s+/, '').trim())
          .filter(item => item.length > 0);
        
        return `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
      }
      
      return `<p>${formatted.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  return html;
}

function appendMessage(container, sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}-message`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  if (sender === 'assistant') {
    contentDiv.innerHTML = formatMessageHTML(text);
  } else {
    contentDiv.textContent = text;
  }

  msgDiv.appendChild(contentDiv);
  container.appendChild(msgDiv);
}

function showTypingIndicator(container) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message assistant-message typing-indicator-message';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = `
    <div class="typing-indicator" aria-label="Assistant is typing">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  
  msgDiv.appendChild(contentDiv);
  container.appendChild(msgDiv);
  scrollToBottom(container);
  return msgDiv;
}

function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}
