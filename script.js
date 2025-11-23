// ==== LEVEL 6 BRAIN FOR AITRUCKDISPATCHER ====
// Chat + Load Calculator + Strategy + Lane Memory (in-browser)

// ---------- Chat UI helper ----------
function addMessage(text, sender) {
  const box = document.getElementById('chatbox');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'msg ' + sender;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// ---------- Opening line ----------
const OPENING_LINES = [
  "Hello, I'm your AITruckDispatcher. Tell me about a load, lane, rate, or Amazon Relay plan.",
];

addMessage(OPENING_LINES[0], 'bot');

// ---------- Small helper: read number input safely ----------
function num(id, fallback = 0) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  const v = parseFloat(el.value);
  return isNaN(v) ? fallback : v;
}

// ---------- Lane Memory (in-page only) ----------
// We store recent loads keyed by a simple lane label string.
const laneMemory = {}; // { laneKey: [ {rpm, pay, miles, deadhead} ] }

function rememberLane(laneKey, rpm, pay, miles, deadhead) {
  if (!laneKey) return;
  if (!laneMemory[laneKey]) laneMemory[laneKey] = [];
  laneMemory[laneKey].push({ rpm, pay, miles, deadhead });

  // Keep only last 5 loads per lane so it won't grow forever
  if (laneMemory[laneKey].length > 5) {
    laneMemory[laneKey].shift();
  }
}

function summarizeLane(laneKey) {
  const loads = laneMemory[laneKey];
  if (!loads || loads.length === 0) return null;
  let totalRpm = 0;
  let totalPay = 0;
  let totalMiles = 0;
  loads.forEach(l => {
    totalRpm += l.rpm;
    totalPay += l.pay;
    totalMiles += l.miles;
  });
  const avgRpm = totalRpm / loads.length;
  const avgPay = totalPay / loads.length;
  const avgMiles = totalMiles / loads.length;
  return {
    count: loads.length,
    avgRpm,
    avgPay,
    avgMiles
  };
}

// Try to pull a lane label from text like "NYC to Chicago", "Atlanta – Miami"
function extractLane(text) {
  const lower = text.toLowerCase();
  // Very simple heuristic: look for " to "
  const parts = lower.split(' to ');
  if (parts.length === 2) {
    const from = parts[0].trim();
    const to = parts[1].trim();
    if (from && to) {
      return from + ' -> ' + to;
    }
  }
  return null;
}

// ---------- Profit Calculator (used by button + chat) ----------
function analyzeNumbers(pay, loadedMiles, deadheadMiles, fuelCostPerGallon, truckMpg) {
  const totalMiles = loadedMiles + deadheadMiles;
  const gallons = totalMiles / (truckMpg || 1);
  const fuelCost = gallons * fuelCostPerGallon;
  const netProfit = pay - fuelCost;
  const rpm = totalMiles > 0 ? pay / totalMiles : 0;

  // Verdict
  let verdict = '';
  if (rpm >= 3.0) {
    verdict = '🔥 Excellent load. Strong RPM for most lanes.';
  } else if (rpm >= 2.5) {
    verdict = '✅ Solid load. Above average RPM.';
  } else if (rpm >= 2.0) {
    verdict = '😐 Mid. Depends on lane, time, and market.';
  } else {
    verdict = '⚠️ Weak. Only worth it if it sets you up for a bigger move.';
  }

  return { totalMiles, gallons, fuelCost, netProfit, rpm, verdict };
}

// ---------- Strategy Engine (Level 6) ----------
// mode can be 'defensive', 'normal', 'aggressive'
function buildStrategyAdvice(rpm, totalMiles, pay, laneKey, textContext) {
  const lower = textContext.toLowerCase();

  // Detect if user hinted at a style
  let mode = 'normal';
  if (lower.includes('aggressive') || lower.includes('push hard')) {
    mode = 'aggressive';
  } else if (lower.includes('play it safe') || lower.includes('defensive')) {
    mode = 'defensive';
  }

  // Default recommended target RPM
  let targetRpm;
  if (mode === 'aggressive') {
    targetRpm = 3.1;
  } else if (mode === 'defensive') {
    targetRpm = 2.5;
  } else {
    targetRpm = 2.8;
  }

  // Adjust based on what it already is
  let suggestPay = pay;
  if (totalMiles > 0) {
    const desiredPay = targetRpm * totalMiles;
    if (desiredPay > pay) {
      suggestPay = Math.round(desiredPay / 10) * 10; // round to nearest $10
    }
  }

  // Lane intel
  let laneLine = '';
  if (laneKey) {
    const stats = summarizeLane(laneKey);
    if (stats) {
      laneLine = `Lane history for **${laneKey}**: last ${stats.count} loads averaged about $${stats.avgRpm.toFixed(2)} RPM on ~${Math.round(stats.avgMiles)} miles. `;
    }
  }

  // Amazon Relay / block-style hints
  let relayLine = '';
  if (lower.includes('relay') || lower.includes('block')) {
    relayLine =
      "Amazon Relay tip: watch the **return leg** and total time at the dock. A cheap outbound can be okay if the round-trip block still keeps your overall RPM strong.";
  }

  // Build natural-language suggestion
  let advice = '';
  if (suggestPay > pay) {
    const diff = suggestPay - pay;
    advice =
      `Right now this load is around $${rpm.toFixed(2)} RPM. In **${mode.toUpperCase()}** mode, I'd aim around **$${suggestPay.toFixed(
        0
      )}** total pay (≈ $${diff.toFixed(
        0
      )} more) to bring it closer to our target RPM.\n\n` +
      `Example counter you can send:\n` +
      `"With the miles and deadhead on this run, I'd need to be closer to **$${suggestPay.toFixed(
        0
      )}** to make it work."`;
  } else {
    advice =
      `RPM is already strong at about $${rpm.toFixed(
        2
      )}. In **${mode.toUpperCase()}** mode I'd still try to bump it slightly — maybe ask for **$${(pay + 25).toFixed(
        0
      )}–$${(pay + 75).toFixed(
        0
      )}**, then settle near your current rate or a bit higher.`;
  }

  return { advice, laneLine, relayLine };
}

// ---------- Chat Understanding (Level 6) ----------
function parseLoadDescription(text) {
  const lower = text.toLowerCase();

  // Soft defaults
  let pay = 0;
  let loadedMiles = 0;
  let deadheadMiles = 0;
  let fuel = 4.0;
  let mpg = 7;

  // Pay: look for patterns like "1500", "$1500"
  const payMatch = lower.match(/\$?\s*(\d{3,5})\s*(pay|rate|for this|all in|total)?/);
  if (payMatch) {
    pay = parseFloat(payMatch[1]);
  }

  // Miles: try to find "xxx miles", "xxx mi"
  const milesMatches = [...lower.matchAll(/(\d{2,4})\s*(miles|mi)/g)];
  if (milesMatches.length > 0) {
    loadedMiles = parseFloat(milesMatches[0][1]);
  }
  if (milesMatches.length > 1) {
    deadheadMiles = parseFloat(milesMatches[1][1]);
  } else {
    // Look for "deadhead 80" etc.
    const dh = lower.match(/deadhead\s*(\d{1,4})/);
    if (dh) deadheadMiles = parseFloat(dh[1]);
  }

  // Fuel cost per gallon – e.g. "fuel 4.25"
  const fuelMatch = lower.match(/fuel\s*(\d+(\.\d+)?)/);
  if (fuelMatch) fuel = parseFloat(fuelMatch[1]);

  // MPG – e.g. "mpg 7"
  const mpgMatch = lower.match(/mpg\s*(\d+(\.\d+)?)/);
  if (mpgMatch) mpg = parseFloat(mpgMatch[1]);

  return { pay, loadedMiles, deadheadMiles, fuel, mpg };
}

// ---------- Core Chat Logic ----------
function basicReply(text) {
  const lower = text.toLowerCase();

  // Help keyword
  if (lower.includes('help')) {
    return "Paste a load like: `1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7` or ask about RPM, counter offers, or Amazon Relay strategy.";
  }

  // If they mention just RPM
  if (lower.includes('rpm') && !lower.match(/\d/)) {
    return "To check RPM, drop in the **pay**, **loaded miles**, **deadhead**, fuel price and MPG. I’ll calculate RPM and tell you if the load is 🔥 or trash.";
  }

  // Try to parse a full load description
  const { pay, loadedMiles, deadheadMiles, fuel, mpg } = parseLoadDescription(text);

  if (pay > 0 && loadedMiles > 0) {
    const calc = analyzeNumbers(pay, loadedMiles, deadheadMiles, fuel, mpg);

    const laneKey = extractLane(text);
    rememberLane(laneKey, calc.rpm, pay, loadedMiles, deadheadMiles);

    const strategy = buildStrategyAdvice(
      calc.rpm,
      calc.totalMiles,
      pay,
      laneKey,
      text
    );

    let laneLineOut = '';
    if (strategy.laneLine) {
      laneLineOut = '\n\n' + strategy.laneLine;
    }

    let relayLineOut = '';
    if (strategy.relayLine) {
      relayLineOut = '\n\n' + strategy.relayLine;
    }

    return (
      `I parsed that load and ran the numbers:\n` +
      `• Pay: $${pay.toFixed(2)}\n` +
      `• Loaded Miles: ${loadedMiles}\n` +
      `• Deadhead Miles: ${deadheadMiles}\n` +
      `• Total Miles: ${calc.totalMiles}\n` +
      `• Fuel Cost (est): $${calc.fuelCost.toFixed(2)}\n` +
      `• Net Profit (after fuel): $${calc.netProfit.toFixed(2)}\n` +
      `• RPM: $${calc.rpm.toFixed(2)}\n` +
      `• Verdict: ${calc.verdict}\n\n` +
      strategy.advice +
      laneLineOut +
      relayLineOut +
      `\n\nYou can also plug the same numbers into the calculator below to see it laid out visually.`
    );
  }

  // Fallback small talk
  if (lower.includes('hi') || lower.includes('hello')) {
    return "What’s up. Tell me about a load or lane you’re looking at and I’ll break it down.";
  }

  return "I didn’t see clear pay + miles in that. Try something like: `1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7`, or ask about RPM, counter offers, or Amazon Relay.";
}

// ---------- Wire up chat box ----------
function sendMessage() {
  const input = document.getElementById('userInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  input.value = '';
  const reply = basicReply(text);
  addMessage(reply, 'bot');
}

// Support pressing Enter to send
const userInputEl = document.getElementById('userInput');
if (userInputEl) {
  userInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
}

// ---------- Load Profit Checker button ----------
function analyzeLoad() {
  const pay = num('pay', 0);
  const loadedMiles = num('miles', 0);
  const deadheadMiles = num('deadhead', 0);
  const fuel = num('fuel', 4.0);
  const mpg = num('mpg', 7);

  const { totalMiles, gallons, fuelCost, netProfit, rpm, verdict } =
    analyzeNumbers(pay, loadedMiles, deadheadMiles, fuel, mpg);

  const pre = document.getElementById('analysis');
  if (!pre) return;

  const outLines = [];
  outLines.push(`Pay: $${pay.toFixed(2)}`);
  outLines.push(`Loaded Miles: ${loadedMiles}`);
  outLines.push(`Deadhead Miles: ${deadheadMiles}`);
  outLines.push(`Fuel Cost: $${fuelCost.toFixed(2)}`);
  outLines.push(`Net Profit: $${netProfit.toFixed(2)}`);
  outLines.push(`RPM: $${rpm.toFixed(2)}`);
  outLines.push('');
  outLines.push(`Verdict: ${verdict}`);

  pre.textContent = outLines.join('\n');

  // Also feed this to lane memory if user had a lane described in the last chat
  // (Best effort – laneKey only when user pasted a full sentence in chat.)
}

// Expose for HTML buttons
window.sendMessage = sendMessage;
window.analyzeLoad = analyzeLoad;
