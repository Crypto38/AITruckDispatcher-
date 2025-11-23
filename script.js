// =======================================
// LEVEL 6 BRAIN – AITruckDispatcher
// Style B: Normal Negotiator
// =======================================

// ----- Chat UI helper -----
function addMessage(text, sender) {
  const box = document.getElementById("chatbox");
  if (!box) return;
  const div = document.createElement("div");
  div.className = "msg " + sender;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// Opening message
addMessage(
  "I'm your AITruckDispatcher. Paste a load (pay, miles, deadhead, fuel, mpg) or ask what to counter at.",
  "bot"
);

// Last analyzed load, for follow-up questions
let lastLoadStats = null;

// ----- Helpers -----
function toNum(x, fallback = 0) {
  const n = parseFloat(x);
  return isNaN(n) ? fallback : n;
}

// Parse numbers from a free-text load line
// Example: "1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7"
function parseLoadFromText(text) {
  const nums = (text.match(/[\d.]+/g) || []).map((s) => parseFloat(s));
  if (nums.length < 2) return null; // need at least pay + miles

  const pay = nums[0];
  const loaded = nums[1];
  const deadhead = nums.length >= 3 ? nums[2] : 0;
  const fuel = nums.length >= 4 ? nums[3] : 4.0;
  const mpg = nums.length >= 5 ? nums[4] : 7.0;

  return { pay, loaded, deadhead, fuel, mpg };
}

// Core math for any load
function computeStats(pay, loaded, deadhead, fuel, mpg) {
  loaded = toNum(loaded, 0);
  deadhead = toNum(deadhead, 0);
  fuel = toNum(fuel, 4.0);
  mpg = toNum(mpg, 7.0);
  pay = toNum(pay, 0);

  const totalMiles = loaded + deadhead;
  const gallons = totalMiles > 0 && mpg > 0 ? totalMiles / mpg : 0;
  const fuelCost = gallons * fuel;
  const netProfit = pay - fuelCost;
  const rpm = loaded > 0 ? pay / loaded : 0;

  let verdict;
  if (rpm >= 3.0) verdict = "🔥 Excellent load. Strong RPM for most lanes.";
  else if (rpm >= 2.5) verdict = "✅ Solid load. Above average RPM.";
  else if (rpm >= 2.0) verdict = "🟡 Borderline. Depends on lane & market—try to bump it.";
  else verdict = "❌ Weak load. Only take if market is dead or you need to move the truck.";

  return { pay, loaded, deadhead, fuel, mpg, totalMiles, gallons, fuelCost, netProfit, rpm, verdict };
}

// Format stats as text
function formatStats(stats) {
  return (
    `Pay: $${stats.pay.toFixed(2)}\n` +
    `Loaded Miles: ${stats.loaded}\n` +
    `Deadhead Miles: ${stats.deadhead}\n` +
    `Total Miles: ${stats.totalMiles}\n` +
    `Fuel Cost (est): $${stats.fuelCost.toFixed(2)}\n` +
    `Net Profit (after fuel): $${stats.netProfit.toFixed(2)}\n` +
    `RPM (loaded miles): $${stats.rpm.toFixed(2)}\n` +
    `Verdict: ${stats.verdict}`
  );
}

// ----- Negotiation logic (Style B – normal) -----
function negotiationAdvice(stats) {
  const rpm = stats.rpm;
  const loaded = stats.loaded;

  // Decide target RPM (normal/aggressive but realistic)
  let targetRPM;
  if (rpm >= 3.0) {
    targetRPM = rpm + 0.10; // small bump
  } else if (rpm >= 2.5) {
    targetRPM = 3.0; // push to ~3.0
  } else if (rpm >= 2.0) {
    targetRPM = 2.6; // push to mid/upper 2s
  } else {
    targetRPM = 2.3; // try to drag trash load into barely acceptable
  }

  const currentPay = stats.pay;
  const targetPay = targetRPM * loaded;
  let bump = targetPay - currentPay;
  if (bump < 0) bump = 0;

  // Round bump to a sensible number (nearest 25/50)
  const roundedBump = Math.round(bump / 25) * 25;
  const suggestedPay = currentPay + roundedBump;

  let msg = `Right now this load is about $${rpm.toFixed(2)} per loaded mile.\n`;

  if (roundedBump <= 0) {
    msg +=
      "You’re already near or above a very strong RPM. You can still test a small bump ($50–$100), but I’d focus on locking it in fast.\n";
  } else {
    msg +=
      `I’d aim around **$${suggestedPay.toFixed(0)}** total pay (about $${roundedBump.toFixed(
        0
      )} more) to bring it closer to roughly $${targetRPM.toFixed(2)} RPM.\n`;
    msg +=
      "Style B (normal): Start slightly higher so you can ‘meet in the middle’ and still land near that number.\n";
  }

  msg +=
    "\nExample counter you can send:\n" +
    `"For those miles and the deadhead on this run, I’d need to be closer to $${suggestedPay.toFixed(
      0
    )} to make it work. Can you get me there?"`;

  return msg;
}

// ----- Take or skip advice -----
function takeOrSkipAdvice(stats) {
  const rpm = stats.rpm;
  const deadRatio =
    stats.totalMiles > 0 ? stats.deadhead / stats.totalMiles : 0;

  let msg = `Take or skip?\nRPM: $${rpm.toFixed(2)} on ${stats.loaded} loaded miles and ${stats.deadhead} deadhead.\n`;

  if (deadRatio > 0.35) {
    msg += "⚠️ High deadhead percentage. This makes the load weaker.\n";
  }

  if (rpm >= 3.0) {
    msg += "Recommendation: ✅ TAKE IT. Strong load in most markets.\n";
  } else if (rpm >= 2.5) {
    msg += "Recommendation: 👍 Probably take it, especially if the lane has good reloads.\n";
  } else if (rpm >= 2.0) {
    msg +=
      "Recommendation: 🤔 Borderline. Take it only if the market is slow, timing is perfect, or it sets up a better reload.\n";
  } else {
    msg +=
      "Recommendation: ❌ Usually SKIP unless you’re stuck, protecting a score, or escaping a bad area.\n";
  }

  return msg;
}

// ----- Dispatcher brain for chat -----
function dispatcherBrain(text) {
  const lower = text.toLowerCase();

  // If asking to counter
  if (
    lower.includes("counter") ||
    lower.includes("negotiate") ||
    lower.includes("ask for") ||
    lower.includes("how much should i")
  ) {
    if (!lastLoadStats) {
      return (
        "Give me a load first (pay, miles, deadhead, fuel, mpg), then ask what to counter at.\n" +
        'Example: "1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7"'
      );
    }
    return negotiationAdvice(lastLoadStats);
  }

  // If asking take or skip
  if (
    lower.includes("take it") ||
    lower.includes("skip it") ||
    lower.includes("take or skip") ||
    lower.includes("is this worth") ||
    lower.includes("good or bad")
  ) {
    if (!lastLoadStats) {
      return "Run the load through the calculator or paste it with numbers first, then I can tell you if it looks like a take or skip.";
    }
    return takeOrSkipAdvice(lastLoadStats);
  }

  // Try to parse a load from text
  const parsed = parseLoadFromText(text);
  if (parsed && parsed.pay && parsed.loaded) {
    const stats = computeStats(
      parsed.pay,
      parsed.loaded,
      parsed.deadhead,
      parsed.fuel,
      parsed.mpg
    );
    lastLoadStats = stats;
    return (
      "I parsed that load and ran the numbers:\n" +
      formatStats(stats) +
      "\n\nNow you can ask: \"What should I counter at?\" or \"Should I take it or skip it?\""
    );
  }

  // RPM help
  if (lower.includes("rpm")) {
    return (
      "RPM = total pay ÷ LOADED miles only.\n" +
      "Example: $1200 on 400 loaded miles = $3.00 RPM.\n" +
      'You can paste loads like: "1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7" and I’ll break it down.'
    );
  }

  // Generic help
  if (lower.includes("help") || lower.includes("what can you do")) {
    return (
      "I can:\n" +
      "• Break down loads (RPM, fuel, profit, verdict).\n" +
      "• Suggest normal counter offers (Style B).\n" +
      "• Tell you if a load is more like TAKE or SKIP.\n" +
      'Try: "1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7"'
    );
  }

  // Greeting
  if (lower.startsWith("yo") || lower.startsWith("hi") || lower.startsWith("hello")) {
    return (
      "Yo. Paste a load with pay, miles, deadhead, fuel, mpg and I’ll break it down.\n" +
      'Then ask: "What should I counter at?"'
    );
  }

  // Fallback
  return (
    "I didn’t fully catch that. Try one of these:\n" +
    '• "1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7"\n' +
    '• "What should I counter at?" (after a load)\n' +
    '• "Is this worth it, should I take it or skip it?"'
  );
}

// ----- Chat send handler -----
function sendMessage() {
  const input = document.getElementById("userInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  const reply = dispatcherBrain(text);
  addMessage(reply, "bot");
}

// ----- Calculator (bottom panel) -----
function analyzeLoad() {
  const pay = toNum(document.getElementById("pay").value);
  const loaded = toNum(document.getElementById("miles").value);
  const deadhead = toNum(document.getElementById("deadhead").value);
  const fuel = toNum(document.getElementById("fuel").value || 4.0);
  const mpg = toNum(document.getElementById("mpg").value || 7.0);

  const stats = computeStats(pay, loaded, deadhead, fuel, mpg);
  lastLoadStats = stats; // sync with chat brain

  const box = document.getElementById("analysis");
  if (!box) return;
  box.textContent = formatStats(stats);
}
