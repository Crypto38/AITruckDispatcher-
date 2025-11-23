// ==== LEVEL 3 BRAIN FOR AITRUCKDISPATCHER ====

// Add a message bubble to the chat
function addMessage(text, sender) {
  const box = document.getElementById('chatbox');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'msg ' + sender;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// Opening line
const OPENING_LINES = [
  "Hello, I'm your AITruckDispatcher. Tell me about a load, lane, rate, or Amazon Relay plan.",
  "You can paste a full load: pay, miles, deadhead, fuel, mpg – I'll do the math.",
  "Running Amazon Relay? Ask me how to protect your score and avoid trash loads."
];

addMessage(OPENING_LINES[0], 'bot');

// Small helper: read number input safely
function readNumber(id, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  const v = parseFloat(el.value);
  if (isNaN(v)) return fallback;
  return v;
}

// ==== LOAD PROFIT CALCULATOR (same as before, just wrapped nicer) ====

function analyzeLoad() {
  const pay = readNumber('pay', 0);
  const miles = readNumber('miles', 0);
  const deadhead = readNumber('deadhead', 0);
  const fuelCost = readNumber('fuel', 4.00);
  const mpg = readNumber('mpg', 7);

  const totalMiles = miles + deadhead;
  const gallons = mpg > 0 ? totalMiles / mpg : 0;
  const fuelSpend = gallons * fuelCost;
  const net = pay - fuelSpend;
  const rpm = miles > 0 ? pay / miles : 0;

  let verdict;
  if (rpm === 0 || !isFinite(rpm)) {
    verdict = "⚠️ I need at least pay and loaded miles to judge this.";
  } else if (rpm < 1.5) {
    verdict = "⚠️ Weak load. Only take if it sets up a much better reload.";
  } else if (rpm < 2.0) {
    verdict = "🟡 Meh. Workable, but try to pair it with a strong backhaul.";
  } else if (rpm < 2.5) {
    verdict = "✅ Solid regional load for most markets.";
  } else {
    verdict = "🔥 Excellent load. Strong RPM for most lanes.";
  }

  const text =
    `Pay: $${pay.toFixed(2)}\n` +
    `Loaded Miles: ${miles}\n` +
    `Deadhead Miles: ${deadhead}\n` +
    `Fuel Cost: $${fuelSpend.toFixed(2)}\n` +
    `Net Profit: $${net.toFixed(2)}\n` +
    `RPM: $${rpm.toFixed(2)}\n\n` +
    `Verdict: ${verdict}`;

  const analysisBox = document.getElementById('analysis');
  if (analysisBox) {
    analysisBox.textContent = text;
  }

  return { pay, miles, deadhead, fuelCost, mpg, rpm, verdict, summary: text };
}

// ==== LEVEL 3: SMART PARSER FOR LOAD TEXT ====

// Find a number that comes after certain keywords
function extractNumberAfterKeyword(text, keywords) {
  const lower = text.toLowerCase();
  let best = null;

  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword);
    if (idx !== -1) {
      const slice = text.slice(idx + keyword.length, idx + keyword.length + 40);
      const match = slice.match(/\$?\s*([\d]+(?:\.\d+)?)/);
      if (match) {
        const num = parseFloat(match[1]);
        if (!isNaN(num)) {
          best = num;
          break;
        }
      }
    }
  }

  return best;
}

function parseLoadFromText(text) {
  const pay = extractNumberAfterKeyword(text, ['pay', 'paying', 'line haul', 'rate']);
  const miles = extractNumberAfterKeyword(text, ['loaded miles', 'loaded', 'all in miles', 'linehaul miles', 'miles']);
  const deadhead = extractNumberAfterKeyword(text, ['deadhead', 'dh']);
  const fuel = extractNumberAfterKeyword(text, ['fuel', 'diesel']);
  const mpg = extractNumberAfterKeyword(text, ['mpg', 'miles per gallon']);

  return { pay, miles, deadhead, fuel, mpg };
}

// Try to parse a free-text load, fill the form, and analyze
function analyzeLoadFromText(text) {
  const parsed = parseLoadFromText(text);

  const missing = [];
  if (parsed.pay == null) missing.push('pay');
  if (parsed.miles == null) missing.push('loaded miles');

  // Use defaults if not mentioned
  if (parsed.deadhead == null) parsed.deadhead = 0;
  if (parsed.fuel == null) parsed.fuel = readNumber('fuel', 4.00);
  if (parsed.mpg == null) parsed.mpg = readNumber('mpg', 7);

  if (missing.length > 0) {
    return {
      success: false,
      message:
        "I couldn’t find " +
        missing.join(' and ') +
        ". Try something like:\n" +
        "\"Pay 1200, 430 loaded miles, 75 deadhead, fuel 4.00, 7 mpg.\""
    };
  }

  // Fill the form inputs
  const payInput = document.getElementById('pay');
  const milesInput = document.getElementById('miles');
  const deadInput = document.getElementById('deadhead');
  const fuelInput = document.getElementById('fuel');
  const mpgInput = document.getElementById('mpg');

  if (payInput) payInput.value = parsed.pay;
  if (milesInput) milesInput.value = parsed.miles;
  if (deadInput) deadInput.value = parsed.deadhead;
  if (fuelInput) fuelInput.value = parsed.fuel;
  if (mpgInput) mpgInput.value = parsed.mpg;

  const result = analyzeLoad();

  return {
    success: true,
    message:
      "I parsed that load and ran the numbers:\n\n" +
      result.summary +
      "\n\nYou can tweak the numbers in the calculator below if something looks off."
  };
}

// ==== CHAT LOGIC (LEVEL 3) ====

function laneAdvice() {
  return [
    "Lane strategy basics:",
    "- Look at ROUND-TRIP RPM, not just one direction.",
    "- Avoid long deadhead into weak markets unless RPM is very strong.",
    "- Protect Amazon Relay score: avoid constant late check-ins and cancellations.",
    "- Keep a few \"go-to\" lanes where you know typical rates and backhauls."
  ].join("\n");
}

function helpText() {
  return [
    "Here’s what I can do:",
    "1) Paste a full load (pay, miles, deadhead, fuel, mpg) and I’ll auto-analyze it.",
    "2) Ask about RPM, lanes, or Amazon Relay strategy.",
    "3) Use the Load Profit Checker below for quick manual checks."
  ].join("\n");
}

function handleDispatcher(text) {
  const lower = text.toLowerCase().trim();

  if (!lower) {
    return "Type a question or paste a load. For example: \"Pay 1200, 430 loaded, 75 deadhead, fuel 4.00, 7 mpg.\"";
  }

  if (lower === 'help') {
    return helpText();
  }

  if (lower.includes('lane') && (lower.includes('best') || lower.includes('good') || lower.includes('strong'))) {
    return laneAdvice();
  }

  if (lower.includes('amazon relay')) {
    return [
      "Amazon Relay tips:",
      "- Protect your score: on-time arrivals and no-shows matter more than squeezing every dollar.",
      "- Don’t grab trash loads just to stay moving; look at RPM + deadhead + where it leaves you.",
      "- Watch weekend and holiday freight – good money but more risk for delays."
    ].join("\n");
  }

  if (lower.includes('rpm') || lower.includes('rate per mile')) {
    return "RPM = total pay ÷ loaded miles. Paste the full load (pay, miles, deadhead, fuel, mpg) and I’ll crunch it for you.";
  }

  // If the message looks like a load description, try to parse it
  if (
    lower.includes('pay') ||
    lower.includes('paying') ||
    lower.includes('$') ||
    lower.includes('loaded') ||
    lower.includes('deadhead') ||
    lower.includes('dh')
  ) {
    const parsedReply = analyzeLoadFromText(text);
    if (parsedReply.success) {
      return parsedReply.message;
    } else {
      return parsedReply.message;
    }
  }

  // Default fallback
  return "I’m not sure yet. Try pasting a load with pay, miles, deadhead, fuel, mpg — or type \"help\" for examples.";
}

// Send button handler
function sendMessage() {
  const input = document.getElementById('userInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';

  const reply = handleDispatcher(text);
  setTimeout(() => addMessage(reply, 'bot'), 200);
}

// Allow pressing Enter on desktop (won’t hurt mobile)
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('userInput');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});
