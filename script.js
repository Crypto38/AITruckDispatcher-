
function addMessage(text, sender) {
  const box = document.getElementById('chatbox');
  const div = document.createElement('div');
  div.className = 'msg ' + sender;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

const OPENING_LINES = [
  "Hello, I'm your AITruckDispatcher. Tell me about a load or lane you're looking at.",
  "You can paste a load description and I'll help you check RPM, deadhead, and risk.",
  "Running Amazon Relay? Ask me how to protect your score while still making money."
];

addMessage(OPENING_LINES[0], 'bot');

function basicReply(text) {
  const lower = text.toLowerCase();
  if (lower.includes('rpm') || lower.includes('rate per mile')) {
    return "To check RPM, divide total pay by total miles including deadhead. Over $2.50/mile on Amazon short lanes is usually decent, under $1.80 is weak in many markets.";
  }
  if (lower.includes('amazon')) {
    return "On Amazon Relay, the game is: protect your score, minimize cancellations, and combine short hops into strong daily totals. Avoid cheap loads that drag your score down for small money.";
  }
  if (lower.includes('deadhead')) {
    return "High deadhead kills profit. Try to keep deadhead under 15–20% of your loaded miles. If you must deadhead, it's better to do it into a strong freight market than into a dead zone.";
  }
  if (lower.includes('lane') || lower.includes('route')) {
    return "Strong lanes have consistent freight both ways. Weak lanes pay good one way but force you into cheap reloads or long deadhead. I can help you compare options if you give me city-to-city and pay.";
  }
  if (lower.includes('10 trucks') || lower.includes('fleet')) {
    return "For a 10-truck fleet, standardize rules: minimum RPM, max deadhead, approved markets, and a weekly target per truck. AITruckDispatcher helps you apply the same rules to every load, every day.";
  }
  if (lower.includes('negotiate') || lower.includes('counter')) {
    return "A simple negotiation script: 'Thanks for the offer. For this lane and miles, we would need $___ to make this work today. Can you get closer to that? We can run it on-time with no issues.'";
  }
  return "Got it. If you want a deeper check, tell me pay, loaded miles, and deadhead, or describe the load and what you are unsure about (price, timing, market, etc.).";
}

function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  input.value = '';

  setTimeout(() => {
    const response = basicReply(text);
    addMessage(response, 'bot');
  }, 600);
}

function analyzeLoad() {
  const pay = parseFloat(document.getElementById('pay').value || '0');
  const miles = parseFloat(document.getElementById('miles').value || '0');
  const deadhead = parseFloat(document.getElementById('deadhead').value || '0');
  const fuel = parseFloat(document.getElementById('fuel').value || '0');
  const mpg = parseFloat(document.getElementById('mpg').value || '0');

  const analysisEl = document.getElementById('analysis');

  if (!pay || !miles) {
    analysisEl.textContent = 'Enter at least pay and loaded miles to analyze a load.';
    return;
  }

  const totalMiles = miles + (deadhead || 0);
  const rpm = pay / totalMiles;
  const gallons = totalMiles / (mpg || 7);
  const fuelCost = gallons * (fuel || 4);
  const roughProfit = pay - fuelCost;

  let verdict = '';
  if (rpm >= 2.5) verdict = '🔥 Strong RPM. This looks like a solid starting point, especially if it keeps you in or moves you into a good freight market.';
  else if (rpm >= 2.0) verdict = '🟡 Decent but not amazing. This might work if it sets you up for a strong reload or keeps your Amazon score healthy.';
  else verdict = '🔻 Weak RPM. Only worth it if it saves your score, gets you out of a bad area, or you have no better options today.';

  const text =
    'Total miles (with deadhead): ' + totalMiles.toFixed(0) + ' mi\n' +
    'Estimated RPM: $' + rpm.toFixed(2) + '/mi\n' +
    'Estimated fuel cost: $' + fuelCost.toFixed(0) + '\n' +
    'Very rough profit after fuel: $' + roughProfit.toFixed(0) + '\n\n' +
    'Verdict: ' + verdict + '\n\n' +
    'Reminder: This is a demo Level 2 logic model. In production, AITruckDispatcher would also check market conditions, score impact, and reload options.';

  analysisEl.textContent = text;
}
