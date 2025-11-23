// ==== LEVEL 4 BRAIN FOR AITruckDispatcher ====

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

// Opening lines in the chat
const OPENING_LINES = [
  "Hello, I'm your AITruckDispatcher. Tell me about a load, lane, rate, or Amazon Relay plan.",
  "You can paste a full load: pay, miles, deadhead, fuel, mpg and I'll analyze it.",
  "Running Amazon Relay? Ask me how to protect your score and avoid trash loads."
];

addMessage(OPENING_LINES[0], 'bot');

let lastLoadAnalysis = null; // remember the last load so we can negotiate on it

// ==== Helpers ====

function readNumber(id, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  const v = parseFloat(el.value);
  return isNaN(v) ? fallback : v;
}

function money(n) {
  return '$' + n.toFixed(2);
}

// Core math for any load
function analyzeNumbers(pay, miles, deadhead, fuel, mpg) {
  pay = pay || 0;
  miles = miles || 0;
  deadhead = deadhead || 0;
  fuel = fuel || 4.0;
  mpg = mpg || 7;

  const totalMiles = miles + deadhead;
  const gallons = totalMiles > 0 && mpg > 0 ? totalMiles / mpg : 0;
  const fuelCost = gallons * fuel;
  const net = pay - fuelCost;
  const rpm = miles > 0 ? pay / miles : 0;

  let verdict = 'OK load.';
  if (rpm >= 3.0) {
    verdict = '🔥 Excellent load. Strong RPM for most lanes.';
  } else if (rpm >= 2.5) {
    verdict = '✅ Solid load. Above average RPM.';
  } else if (rpm >= 2.1) {
    verdict = '⚠️ Borderline. Depends on lane & market.';
  } else {
    verdict = '🚫 Weak load. Consider countering or passing.';
  }

  return {
    pay,
    miles,
    deadhead,
    fuel,
    mpg,
    fuelCost,
    net,
    rpm,
    verdict
  };
}

function formatAnalysis(result) {
  return (
    'Pay: ' + money(result.pay) + '\n' +
    'Loaded Miles: ' + result.miles + '\n' +
    'Deadhead Miles: ' + result.deadhead + '\n' +
    'Fuel Cost: ' + money(result.fuelCost) + '\n' +
    'Net Profit: ' + money(result.net) + '\n' +
    'RPM: $' + result.rpm.toFixed(2) + '\n' +
    'Verdict: ' + result.verdict
  );
}

// ==== Button: Load Profit Checker (bottom panel) ====

function analyzeLoad() {
  const pay = readNumber('pay', 0);
  const miles = readNumber('miles', 0);
  const deadhead = readNumber('deadhead', 0);
  const fuel = readNumber('fuel', 4.0);
  const mpg = readNumber('mpg', 7);

  const result = analyzeNumbers(pay, miles, deadhead, fuel, mpg);
  lastLoadAnalysis = result;

  const pre = document.getElementById('analysis');
  if (pre) {
    pre.textContent = formatAnalysis(result);
  }
}

// ==== Text parsing for loads in chat (Level 3/4) ====

function parseLoadFromText(text) {
  // Grab all numbers in the text in order: pay, miles, deadhead, fuel, mpg
  const matches = text.match(/[\d,.]+/g);
  if (!matches || matches.length < 2) return null;

  function toNum(s) {
    return parseFloat(s.replace(/,/g, ''));
  }

  const pay = toNum(matches[0]);
  const miles = toNum(matches[1]);
  const deadhead = matches.length > 2 ? toNum(matches[2]) : 0;
  const fuel = matches.length > 3 ? toNum(matches[3]) : 4.0;
  const mpg = matches.length > 4 ? toNum(matches[4]) : 7;

  return { pay, miles, deadhead, fuel, mpg };
}

function handleParsedLoad(parsed, mentionText) {
  // Fill the bottom calculator with the parsed numbers
  const payInput = document.getElementById('pay');
  const milesInput = document.getElementById('miles');
  const deadheadInput = document.getElementById('deadhead');
  const fuelInput = document.getElementById('fuel');
  const mpgInput = document.getElementById('mpg');

  if (payInput) payInput.value = parsed.pay;
  if (milesInput) milesInput.value = parsed.miles;
  if (deadheadInput) deadheadInput.value = parsed.deadhead;
  if (fuelInput) fuelInput.value = parsed.fuel;
  if (mpgInput) mpgInput.value = parsed.mpg;

  const result = analyzeNumbers(
    parsed.pay,
    parsed.miles,
    parsed.deadhead,
    parsed.fuel,
    parsed.mpg
  );
  lastLoadAnalysis = result;

  const analysisText = formatAnalysis(result);
  const pre = document.getElementById('analysis');
  if (pre) pre.textContent = analysisText;

  let extraHint =
    '\n\nIf you want, ask: "What should I counter at?" and I\'ll suggest a rate.';
  if (mentionText && mentionText.includes('amazon')) {
    extraHint += '\nYou can also ask me about protecting your Amazon Relay score.';
  }

  addMessage(
    "I parsed that load and ran the numbers:\n" +
      analysisText +
      extraHint,
    'bot'
  );
}

// ==== Negotiation / Strategy ====

function suggestCounterOffer(result) {
  const rpm = result.rpm;

  if (rpm >= 3.0) {
    return (
      "This load is already 🔥 at about $" +
      rpm.toFixed(2) +
      " RPM. You can still test a small bump of $50–$100, " +
      "but for most lanes I'd focus on locking it in fast."
    );
  }

  let targetRpm;
  if (rpm >= 2.5) {
    targetRpm = 3.0;
  } else if (rpm >= 2.1) {
    targetRpm = 2.5;
  } else {
    targetRpm = 2.25;
  }

  const targetPay = targetRpm * result.miles;
  const extra = targetPay - result.pay;

  return (
    "Right now this load is around $" +
    rpm.toFixed(2) +
    " RPM. I'd push for about $" +
    targetPay.toFixed(0) +
    " total pay (≈ $" +
    extra.toFixed(0) +
    " more) to bring it closer to ~" +
    targetRpm.toFixed(2) +
    " RPM.\n\n" +
    "Tip: start a little higher so you can 'meet in the middle' and still land close to that target."
  );
}

function amazonRelayTips() {
  return [
    "Amazon Relay safety / score tips:",
    "- Protect your on-time: leave early for FC / relay yards, assume delays at the gate.",
    "- Don’t spam-cancel: too many cancels will crush your score. Only cancel true trash loads.",
    "- Watch for fake RPM: high rate but crazy deadhead, bad weather, or impossible appointment times.",
    "- Keep a clean record: no late pickups, no no-shows, no safety incidents.",
    "- Mix in some 'easy wins': short, simple loads at decent rates to keep score and cash flow healthy."
  ].join('\n');
}

// ==== Chat routing ====

function handleChat(text) {
  const lower = text.toLowerCase().trim();

  if (!lower) {
    addMessage(
      "Tell me about a load, lane, rate, or ask about Amazon Relay strategy.",
      'bot'
    );
    return;
  }

  // Did they paste a full load?
  const parsed = parseLoadFromText(text);
  const looksLikeLoad =
    parsed &&
    (lower.includes('load') ||
      lower.includes('lane') ||
      lower.includes('rate') ||
      lower.includes('$') ||
      lower.includes('miles'));

  if (parsed && looksLikeLoad) {
    handleParsedLoad(parsed, lower);
    return;
  }

  // Negotiation / counter offer
  if (
    lower.includes('counter') ||
    lower.includes('negotiate') ||
    lower.includes('ask for') ||
    lower.includes('how much should i') ||
    lower.includes('what should i ask')
  ) {
    if (!lastLoadAnalysis) {
      addMessage(
        "Paste a full load first (pay, miles, deadhead, fuel, mpg) and I'll suggest a counter-offer.",
        'bot'
      );
    } else {
      addMessage(suggestCounterOffer(lastLoadAnalysis), 'bot');
    }
    return;
  }

  // RPM explanation
  if (lower.includes('rpm')) {
    addMessage(
      "RPM = pay ÷ LOADED miles.\n" +
        "Example: $1200 on 400 loaded miles = $3.00 RPM.\n" +
        "General targets (varies by market):\n" +
        "- $3.00+ 🔥 short hops / tough markets\n" +
        "- $2.50–$3.00 ✅ solid\n" +
        "- $2.25–$2.50 ⚠️ maybe, depends on lane\n" +
        "- Under $2.25 🚫 usually trash unless it's super easy / light.",
      'bot'
    );
    return;
  }

  // Amazon Relay / safety / score
  if (
    lower.includes('amazon') ||
    lower.includes('relay') ||
    lower.includes('score')
  ) {
    addMessage(amazonRelayTips(), 'bot');
    return;
  }

  if (
    lower.includes('safety') ||
    lower.includes('safe') ||
    lower.includes('risk') ||
    lower.includes('dangerous')
  ) {
    addMessage(
      "Safety filter:\n" +
        "- Low rate + tight appointment + bad weather = skip it.\n" +
        "- New drivers: avoid mountains in snow, NYC / tight cities at rush hour, and crazy-tight appointment windows.\n" +
        "- If risk is high, the RPM has to be VERY strong or it's not worth it.",
      'bot'
    );
    return;
  }

  // Very simple multi-truck guidance
  if (
    lower.includes('two trucks') ||
    lower.includes('3 trucks') ||
    lower.includes('three trucks') ||
    lower.includes('fleet') ||
    lower.includes('which truck') ||
    lower.includes('assign')
  ) {
    addMessage(
      "Basic fleet logic:\n" +
        "- Give best-paying, time-sensitive loads to your most reliable driver.\n" +
        "- Keep one truck flexible for last-minute high-pay spot loads.\n" +
        "- Avoid stacking tight back-to-back appointments on the same truck; leave buffer time.\n" +
        "- Match light loads to weaker trucks or new drivers so they can learn on easier runs.",
      'bot'
    );
    return;
  }

  // Fallback
  addMessage(
    "Got it. Paste a full load (pay, miles, deadhead, fuel, mpg) and I'll break it down — or ask about RPM, negotiation, Amazon Relay, or safety.",
    'bot'
  );
}

// ==== Send message from input ====

function sendMessage() {
  const input = document.getElementById('userInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  input.value = '';
  handleChat(text);
}

// Allow pressing Enter to send (if keyboard has Enter)
document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('userInput');
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});
