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
    targetRpm
