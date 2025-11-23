// ==== LEVEL 5 BRAIN FOR AITRUCKDISPATCHER ====

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
  "Hello, I'm your AITruckDispatcher. Tell me about a load, lane, rate, or Amazon Relay plan."
];

// show welcome message
addMessage(OPENING_LINES[0], 'bot');

// ---------- Helpers for numbers / loads ----------
let lastLoad = null; // remembers last analyzed load (for follow-up questions)

function safeNumber(value, fallback) {
  const n = parseFloat(value);
  return isNaN(n) ? fallback : n;
}

function readNumberById(id, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  return safeNumber(el.value, fallback);
}

function computeLoadStats(pay, loadedMiles, deadheadMiles, fuelCostPerGallon, mpg) {
  loadedMiles = safeNumber(loadedMiles, 0);
  deadheadMiles = safeNumber(deadheadMiles, 0);
  mpg = safeNumber(mpg, 7);
  fuelCostPerGallon = safeNumber(fuelCostPerGallon, 4);

  const totalMiles = loadedMiles + deadheadMiles;
  const fuelCost = totalMiles > 0 ? (totalMiles / mpg) * fuelCostPerGallon : 0;
  const netProfit = pay - fuelCost;
  const rpm = loadedMiles > 0 ? pay / loadedMiles : 0;

  return {
    pay,
    loadedMiles,
    deadheadMiles,
    fuelCostPerGallon,
    mpg,
    fuelCost,
    netProfit,
    rpm,
    totalMiles
  };
}

function verdictFromRPM(rpm) {
  if (rpm >= 3.5) return "🔥 Killer load. Top-tier RPM for most lanes.";
  if (rpm >= 3.0) return "🔥 Excellent load. Strong RPM for most lanes.";
  if (rpm >= 2.5) return "✅ Solid load. Above average RPM.";
  if (rpm >= 2.0) return "🟡 Okay. Depends on lane, market, and schedule.";
  return "❌ Weak RPM. Only take if market is dead, score reasons, or it's part of a bigger plan.";
}

// ---------- Load Profit Checker (calculator button) ----------
function analyzeLoad() {
  const pay = readNumberById('pay', 0);
  const loadedMiles = readNumberById('miles', 0);
  const deadheadMiles = readNumberById('deadhead', 0);
  const fuelCostPerGallon = readNumberById('fuel', 4);
  const mpg = readNumberById('mpg', 7);

  const stats = computeLoadStats(pay, loadedMiles, deadheadMiles, fuelCostPerGallon, mpg);
  lastLoad = stats; // remember for follow-up chat questions

  const analysisEl = document.getElementById('analysis');
  if (!analysisEl) return;

  const lines = [];
  lines.push(`Pay: $${stats.pay.toFixed(2)}`);
  lines.push(`Loaded Miles: ${stats.loadedMiles}`);
  lines.push(`Deadhead Miles: ${stats.deadheadMiles}`);
  lines.push(`Fuel Cost: $${stats.fuelCost.toFixed(2)}`);
  lines.push(`Net Profit: $${stats.netProfit.toFixed(2)}`);
  lines.push(`RPM: $${stats.rpm.toFixed(2)}`);
  lines.push('');
  lines.push(`Verdict: ${verdictFromRPM(stats.rpm)}`);

  analysisEl.textContent = lines.join('\n');
}

// expose for HTML onclick
window.analyzeLoad = analyzeLoad;

// ---------- Level 5 Lane Intel ----------

const STATE_INTEL = {
  TX: { outbound: "strong", detail: "Texas is usually solid outbound for dry van and reefer." },
  GA: { outbound: "strong", detail: "Atlanta / GA is a busy hub with good reload options." },
  FL: { outbound: "weak", detail: "Florida pays coming in, weak getting out. Plan your reload." },
  CA: { outbound: "mixed", detail: "Good money in and out, but long miles and higher expenses." },
  NY: { outbound: "mixed", detail: "Decent money but tolls, traffic, borough headaches." },
  NJ: { outbound: "strong", detail: "Jersey & PA area usually have plenty of freight." },
  PA: { outbound: "strong", detail: "Good freight and reload options, especially around major cities." },
  IL: { outbound: "strong", detail: "Chicago area is a major freight hub." },
  IN: { outbound: "strong", detail: "Indiana is often decent for reloads." },
  OH: { outbound: "strong", detail: "Ohio is a good central region for freight." },
  WA: { outbound: "mixed", detail: "Can pay well in, reloads depend on lane and season." },
  OR: { outbound: "mixed", detail: "Similar to WA — depends on customer and season." },
  CO: { outbound: "weak", detail: "Denver can be a trap—okay going in, weaker coming out." },
  AZ: { outbound: "mixed", detail: "PHX/Tucson can be hit or miss depending on season." },
  NV: { outbound: "mixed", detail: "Vegas / Reno are hit or miss, often reload to CA or AZ." }
};

function extractStatePair(text) {
  // Look for pattern "NY to FL" or "ny -> fl"
  const matchAbbr = text.match(/(?:from\s+)?([A-Za-z]{2})\s*(?:to|->)\s*([A-Za-z]{2})/i);
  if (matchAbbr) {
    return [matchAbbr[1].toUpperCase(), matchAbbr[2].toUpperCase()];
  }
  return null;
}

function laneIntelResponse(text) {
  const pair = extractStatePair(text);
  if (!pair) return null;

  const [origin, dest] = pair;
  const o = STATE_INTEL[origin] || { outbound: "mixed", detail: "No special intel coded. Check the market and past runs." };
  const d = STATE_INTEL[dest] || { outbound: "mixed", detail: "No special intel coded. Check reloads carefully." };

  let msg = `Lane intel for ${origin} → ${dest}:\n`;
  msg += `• Origin (${origin}) outbound: ${o.outbound}. ${o.detail}\n`;
  msg += `• Destination (${dest}) outbound: ${d.outbound}. ${d.detail}\n\n`;

  if (d.outbound === "weak") {
    msg += "Tip: Make sure the money going IN is strong enough to cover a weak reload or some deadhead.\n";
  } else if (d.outbound === "strong") {
    msg += "Tip: You can sometimes accept a slightly lower rate in if you know reloads pay well out of the destination.\n";
  } else {
    msg += "Tip: Treat this lane as case-by-case. Watch recent RPM and your broker/shipper history.\n";
  }

  return msg;
}

// ---------- Amazon Relay Strategy ----------

function amazonRelayResponse(text) {
  if (!/amazon|relay/i.test(text)) return null;

  let msg = "Amazon Relay Strategy:\n";
  msg += "• Protect your score first: on-time arrivals and departures matter more than squeezing every dollar from one load.\n";
  msg += "• Be careful with short-notice rescue loads if your HOS or weather is tight.\n";
  msg += "• Avoid chronic late facilities if you can’t build in extra buffer time.\n";
  msg += "• Stacking blocks: leave room for traffic and delays between trips so you don’t hit a cascade of late arrivals.\n";
  msg += "• Use high-RPM lanes to rebuild your score, then chase bonus or surge blocks when your score is strong.\n";
  return msg;
}

// ---------- Text → Load parser (for chat) ----------

function parseLoadFromText(text) {
  // Example: "1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7"
  const nums = (text.match(/[\d\.]+/g) || []).map(parseFloat);
  if (nums.length < 2) return null; // need at least pay + miles

  const pay = nums[0];
  const loadedMiles = nums[1];
  const deadheadMiles = nums.length >= 3 ? nums[2] : 0;
  const fuel = nums.length >= 4 ? nums[3] : 4;
  const mpg = nums.length >= 5 ? nums[4] : 7;

  return computeLoadStats(pay, loadedMiles, deadheadMiles, fuel, mpg);
}

// ---------- Negotiation & Take/Skip Logic ----------

function negotiationAdvice(stats) {
  const rpm = stats.rpm;
  let targetRPM;
  if (rpm >= 3.5) targetRPM = rpm + 0.25;
  else if (rpm >= 3.0) targetRPM = 3.25;
  else if (rpm >= 2.5) targetRPM = 3.0;
  else if (rpm >= 2.0) targetRPM = 2.5;
  else targetRPM = 2.0;

  const targetPay = targetRPM * stats.loadedMiles;
  const bump = targetPay - stats.pay;

  let msg = `Right now this load is around $${rpm.toFixed(2)} RPM.\n`;
  if (bump <= 0) {
    msg += "You’re already at or above a strong RPM. You can still ask for a little more, but this is already good.\n";
  } else {
    msg += `I’d push for about $${targetPay.toFixed(0)} total pay (≈ $${bump.toFixed(0)} more) to bring it closer to ~$${targetRPM.toFixed(2)} RPM.\n`;
    msg += "Tip: Start a bit higher so you can ‘meet in the middle’ and still land near that target.\n";
  }
  return msg;
}

function takeOrSkipAdvice(stats) {
  const rpm = stats.rpm;
  const totalMiles = stats.totalMiles || (stats.loadedMiles + stats.deadheadMiles);
  const deadheadRatio = totalMiles > 0 ? stats.deadheadMiles / totalMiles : 0;

  let msg = `Take or skip?\nCurrent RPM: $${rpm.toFixed(2)} on ${stats.loadedMiles} loaded miles (${stats.deadheadMiles} deadhead).\n`;

  if (deadheadRatio >= 0.35) {
    msg += "⚠️ A lot of this trip is deadhead. Make sure pickup / drop are worth it.\n";
  }

  if (rpm >= 3.0) {
    msg += "Recommendation: ✅ TAKE IT. This is a strong load in most markets.\n";
  } else if (rpm >= 2.5) {
    msg += "Recommendation: 👍 Probably take it, especially if the lane is good for reloads.\n";
  } else if (rpm >= 2.0) {
    msg += "Recommendation: 🤔 Borderline. Only take if market is soft, timing is perfect, or it sets up a better reload.\n";
  } else {
    msg += "Recommendation: ❌ Normally SKIP unless you’re stuck, protecting a score, or chaining it into a bigger plan.\n";
  }

  return msg;
}

// ---------- Danger / Risk Checks ----------

function riskChecks(text, stats) {
  let warnings = [];

  if (/3\s*stops|three stops|multi[-\s]*stop|multi stop/i.test(text)) {
    warnings.push("⚠️ Multi-stop load. Watch for tight appointment windows and extra handling time.");
  }

  if (/live unload|live load/i.test(text)) {
    warnings.push("⚠️ Live load/unload. Build in buffer for long dock times.");
  }

  if (/mountain|grade|snow|ice|blizzard|rockies/i.test(text)) {
    warnings.push("⚠️ Mountain or winter conditions mentioned. Factor in speed, fuel burn, and safety.");
  }

  if (stats) {
    const rpm = stats.rpm;
    if (rpm < 2.0 && stats.deadheadMiles > 100) {
      warnings.push("⚠️ Low RPM plus high deadhead. This is very close to a trash load.");
    }
  }

  if (warnings.length === 0) return null;
  return "Risk check:\n" + warnings.join('\n');
}

// ---------- Main dispatcher brain ----------

function dispatcherBrain(userText) {
  const text = userText.trim();
  const lower = text.toLowerCase();

  // 1. Lane intel
  const lane = laneIntelResponse(text);
  if (lane) return lane;

  // 2. Amazon Relay questions
  const relay = amazonRelayResponse(text);
  if (relay) return relay;

  // 3. Parse load info from text if numbers present
  let statsFromText = null;
  if (/\d/.test(text)) {
    statsFromText = parseLoadFromText(text);
    if (statsFromText) {
      lastLoad = statsFromText; // update memory
      const baseVerdict =
        `I parsed that load and ran the numbers:\n` +
        `Pay: $${statsFromText.pay.toFixed(2)}\n` +
        `Loaded Miles: ${statsFromText.loadedMiles}\n` +
        `Deadhead Miles: ${statsFromText.deadheadMiles}\n` +
        `Fuel Cost: $${statsFromText.fuelCost.toFixed(2)}\n` +
        `Net Profit: $${statsFromText.netProfit.toFixed(2)}\n` +
        `RPM: $${statsFromText.rpm.toFixed(2)}\n` +
        `Verdict: ${verdictFromRPM(statsFromText.rpm)}\n`;

      const risk = riskChecks(text, statsFromText);
      return baseVerdict + (risk ? "\n" + risk : "");
    }
  }

  // 4. Negotiation / counter offer using last load
  if (/(what should i counter|what should i ask|counter at|negotiate)/i.test(lower)) {
    if (!lastLoad) {
      return "Give me the pay, loaded miles, deadhead miles, fuel price, and MPG in one line and I’ll suggest a counter. Example: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7";
    }
    const advice = negotiationAdvice(lastLoad);
    const risk = riskChecks(text, lastLoad);
    return advice + (risk ? "\n" + risk : "");
  }

  // 5. Take or skip question
  if (/(take it|skip it|take or skip|is this good|should i book|should i take)/i.test(lower)) {
    if (!lastLoad) {
      return "Run the load through the calculator first (pay, miles, deadhead, fuel, MPG), then ask me again and I’ll tell you whether to take or skip.";
    }
    const decision = takeOrSkipAdvice(lastLoad);
    const risk = riskChecks(text, lastLoad);
    return decision + (risk ? "\n" + risk : "");
  }

  // 6. Generic RPM help
  if (/rpm|rate per mile|how much per mile/i.test(lower)) {
    return "To calculate RPM: divide total pay by LOADED miles only. You can paste a full load like: 1200 pay 430 miles 75 deadhead fuel 4.00 mpg 7 and I’ll break it down.";
  }

  // 7. If user just asks something general
  if (/hello|hi|yo|hey/i.test(lower)) {
    return "Yo. I’m your AI dispatcher. Drop a load like: 1200 pay 430 miles 75 deadhead fuel 4.00 mpg 7 or ask about a lane (NY to FL) or Amazon Relay.";
  }

  if (/help|what can you do|how to use/i.test(lower)) {
    return "You can:\n• Paste full loads and I’ll break them down (RPM, profit, fuel, risk).\n• Ask if you should TAKE or SKIP a load after calculating it.\n• Ask what to COUNTER at based on the last load.\n• Ask about lanes like: NY to FL, GA to NJ.\n• Ask about Amazon Relay strategy.";
  }

  // Fallback
  return "I didn’t fully catch that. Try one of these:\n" +
    "• Paste a full load: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7\n" +
    "• Ask: \"Is NY to FL a good lane?\"\n" +
    "• Ask: \"What should I counter at?\" after you run a load in the calculator.\n" +
    "• Ask an Amazon Relay question.";
}

// ---------- Send message handler (chat button) ----------

function sendMessage() {
  const input = document.getElementById('userInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';

  const reply = dispatcherBrain(text);
  addMessage(reply, 'bot');
}

// expose for HTML onclick
window.sendMessage = sendMessage;
