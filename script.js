function addMessage(text, sender) {
  const box = document.getElementById('chatBox');
  const div = document.createElement('div');
  div.className = 'msg ' + sender;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

const OPENING_LINES = [
  "Hello, I'm your AITruckDispatcher. Tell me a load and I’ll break it down for you.",
  "You can paste a load description and I'll estimate RPM, profit, and strength.",
  "Running Amazon Relay? Ask me how to protect your score or avoid bad loads."
];

addMessage(OPENING_LINES[0], 'bot');

function basicReply(text) {
  const lower = text.toLowerCase();

  if (lower.includes('rpm') || lower.includes('rate')) {
    return "To check RPM, divide total pay by loaded miles. Enter both and I'll calculate.";
  }

  if (lower.includes('hello') || lower.includes('hi')) {
    return "Hello! Send me any load details and I’ll analyze it immediately.";
  }

  if (lower.includes('relay')) {
    return "Amazon Relay strategy: Keep on-time above 97%, avoid canceled blocks, and choose short deadhead lanes.";
  }

  return "Got it. Send me the load (pay, miles, deadhead) and I’ll break it down.";
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();

  if (!text) return;

  addMessage(text, 'user');

  const reply = basicReply(text);
  setTimeout(() => addMessage(reply, 'bot'), 400);

  input.value = '';
}
