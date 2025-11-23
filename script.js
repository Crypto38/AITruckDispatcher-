// ====== DOM HOOKS ======
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const voiceOutToggle = document.getElementById("voiceOutToggle");
const truckSelect = document.getElementById("truckSelect");
const copyScriptBtn = document.getElementById("copyScriptBtn");
const historyList = document.getElementById("historyList");

const lastNetEl = document.getElementById("lastNet");
const dayProfitEl = document.getElementById("dayProfit");
const weekProfitEl = document.getElementById("weekProfit");

// ====== STATE ======
const trucks = [
  { id: "t1", name: "Truck 1 – 2020 Cascadia", mpg: 7.0 },
  { id: "t2", name: "Truck 2 – 2018 Volvo", mpg: 6.5 },
  { id: "t3", name: "Truck 3 – Daycab City", mpg: 7.5 },
  { id: "t4", name: "Truck 4 – Owner Op", mpg: 6.8 }
];

let history = []; // last loads
let lastBrokerScript = "";
let recognition = null;

// ====== INIT ======
function initTruckSelect() {
  trucks.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    truckSelect.appendChild(opt);
  });
}

function getSelectedTruck() {
  const id = truckSelect.value || trucks[0].id;
  return trucks.find((t) => t.id === id) || trucks[0];
}

function addMessage(text, sender = "ai") {
  const div = document.createElement("div");
  div.className = "msg " + (sender === "user" ? "msg-user" : "msg-ai");
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (sender === "ai" && voiceOutToggle.checked) {
    speakText(text);
  }
}

// Basic TTS
function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// ====== VOICE INPUT ======
function initVoiceInput() {
  const SR =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;
  if (!SR) {
    micBtn.style.display = "none"; // hide mic if not supported
    return;
  }
  recognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    userInput.value = transcript;
  };

  recognition.onerror = () => {
    // ignore errors silently for now
  };
}

micBtn.addEventListener("click", () => {
  if (!recognition) return;
  recognition.start();
});

// ====== PARSE / LOGIC ======
function parseLoadText(text) {
  const nums = text.match(/[\d.]+/g);
  if (!nums || nums.length < 4) {
    return null;
  }

  const truck = getSelectedTruck();

  const pay = parseFloat(nums[0]);
  const miles = parseFloat(nums[1]);
  const deadhead = parseFloat(nums[2]);
  const fuelPrice = parseFloat(nums[3]);
  const mpg = nums[4] ? parseFloat(nums[4]) : truck.mpg;

  const lower = text.toLowerCase();
  let style = "normal";
  if (lower.includes("aggressive")) style = "aggressive";

  return { pay, miles, deadhead, fuelPrice, mpg, style };
}

function analyzeLoad(data) {
  const { pay, miles, deadhead, fuelPrice, mpg, style } = data;

  const totalMiles = miles + deadhead;
  const gallons = totalMiles / mpg;
  const fuelCost = gallons * fuelPrice;
  const netProfit = pay - fuelCost;
  const rpm = pay / miles;
  const deadRatio = deadhead / miles;

  // Verdict & AI flavor
  let verdict = "";
  let verdictEmoji = "";
  let laneNote = "";
  let suggestedCounter = pay;
  let action = "";

  if (rpm >= 3.0) {
    verdict = "🔥 Excellent RPM. Strong load.";
    verdictEmoji = "💎";
    action = "Good to TAKE or hold firm.";
    suggestedCounter = pay + 50;
  } else if (rpm >= 2.5) {
    verdict = "✅ Solid RPM. Good load.";
    verdictEmoji = "✅";
    action = "Take or counter a little higher.";
    suggestedCounter = pay + 60;
  } else if (rpm >= 2.2) {
    verdict = "😐 Decent but not amazing.";
    verdictEmoji = "⚠";
    action =
      "OK to take if market is slow. If possible, counter $50–$100 higher.";
    suggestedCounter = pay + 80;
  } else {
    verdict = "⚠ Weak RPM. Be careful.";
    verdictEmoji = "⚠";
    action =
      "Best to COUNTER hard or PASS unless market is extremely soft for you.";
    suggestedCounter = pay + 100;
  }

  if (deadRatio > 0.3) {
    laneNote += "High deadhead. Try to push rate because of empty miles. ";
  } else if (deadRatio < 0.15 && deadhead > 0) {
    laneNote += "Deadhead is manageable. ";
  }

  if (style === "aggressive") {
    laneNote += "Aggressive mode: push harder on the counter.";
    suggestedCounter += 30;
  } else {
    laneNote += "Normal mode: prioritize consistency over max dollar.";
  }

  const dayProfit = netProfit;
  const weekProfit = netProfit * 5; // assume 5 similar loads / week

  return {
    pay,
    miles,
    deadhead,
    fuelPrice,
    mpg,
    totalMiles,
    fuelCost,
    netProfit,
    rpm,
    style,
    verdict,
    verdictEmoji,
    laneNote,
    suggestedCounter,
    action,
    dayProfit,
    weekProfit
  };
}

function buildSummaryText(result) {
  const {
    pay,
    miles,
    deadhead,
    fuelCost,
    netProfit,
    rpm,
    style,
    verdict,
    verdictEmoji,
    laneNote,
    suggestedCounter,
    action,
    dayProfit,
    weekProfit
  } = result;

  const lines = [];
  lines.push(
    `Pay: $${pay.toFixed(2)}  Miles: ${miles.toFixed(
      0
    )}  Deadhead: ${deadhead.toFixed(0)}`
  );
  lines.push(
    `Fuel Cost: $${fuelCost.toFixed(2)}  Net Profit: $${netProfit.toFixed(
      2
    )}  RPM (loaded): ${rpm.toFixed(2)}`
  );
  lines.push(
    `Style: ${style.toUpperCase()}  Verdict: ${verdictEmoji} ${verdict}`
  );
  lines.push(
    `Suggested counter: ~$${suggestedCounter.toFixed(
      0
    )}. Action: ${action} ${laneNote}`
  );
  lines.push(
    `If you ran this load 1x/day for 5 days: Day profit ≈ $${dayProfit.toFixed(
      2
    )}, Week profit ≈ $${weekProfit.toFixed(2)}.`
  );

  return lines.join(" ");
}

function buildBrokerScript(result) {
  const { pay, miles, deadhead, fuelCost, netProfit, suggestedCounter } =
    result;

  return (
    `Hi, this is [YOUR NAME] with [CARRIER]. ` +
    `Looking at your load around ${miles.toFixed(
      0
    )} loaded and ${deadhead.toFixed(
      0
    )} deadhead miles, with fuel around $${fuelCost.toFixed(
      2
    )} on this run, $${pay.toFixed(
      2
    )} is a bit tight for us. ` +
    `To make this work profitably, we'd need to be closer to about $${suggestedCounter.toFixed(
      0
    )} all-in. ` +
    `That keeps us near a healthy profit (roughly $${netProfit.toFixed(
      2
    )} net). Can you get me closer to that range?`
  );
}

function updateProfitPanel(result) {
  lastNetEl.textContent = `$${result.netProfit.toFixed(2)}`;
  dayProfitEl.textContent = `$${result.dayProfit.toFixed(2)}`;
  weekProfitEl.textContent = `$${result.weekProfit.toFixed(2)}`;
}

// ====== HISTORY ======
function addToHistory(rawText, summary, brokerScript, result) {
  history.unshift({ rawText, summary, brokerScript, result });
  if (history.length > 10) history.pop();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  history.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "history-item";
    const r = item.result;
    li.textContent = `$${r.pay.toFixed(0)} · ${r.miles.toFixed(
      0
    )}mi · RPM ${r.rpm.toFixed(2)}`;
    li.addEventListener("click", () => {
      addMessage(item.rawText, "user");
      addMessage(item.summary, "ai");
      lastBrokerScript = item.brokerScript;
      updateProfitPanel(item.result);
    });
    historyList.appendChild(li);
  });
}

// ====== MAIN SEND HANDLER ======
function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  const parsed = parseLoadText(text);
  if (!parsed) {
    const msg =
      "Couldn't read that load. Use at least: pay miles deadhead fuel. Example: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 aggressive.";
    addMessage(msg, "ai");
    return;
  }

  const result = analyzeLoad(parsed);
  const summary = buildSummaryText(result);
  const brokerScript = buildBrokerScript(result);

  lastBrokerScript = brokerScript;

  addMessage(summary, "ai");
  addMessage("Broker script ready. Tap 'Copy broker script' to copy.", "ai");

  updateProfitPanel(result);
  addToHistory(text, summary, brokerScript, result);
}

// ====== COPY SCRIPT BUTTON ======
copyScriptBtn.addEventListener("click", async () => {
  if (!lastBrokerScript) {
    addMessage("No broker script yet. Analyze a load first.", "ai");
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(lastBrokerScript);
      addMessage("Broker script copied to clipboard.", "ai");
    } catch {
      addMessage("Couldn't copy automatically. Copy manually if needed.", "ai");
    }
  } else {
    addMessage("Clipboard not supported on this device.", "ai");
  }
});

// ====== EVENTS ======
sendBtn.addEventListener("click", handleSend);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSend();
  }
});

// ====== STARTUP MESSAGE ======
initTruckSelect();
initVoiceInput();

addMessage(
  "AITruckDispatcher v30 loaded. Enter: pay miles deadhead fuel mpg(optional) style(optional). Example: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 aggressive.",
  "ai"
);
