// ===== AITruckDispatcher v31 – Multi-Truck Weekly Profit =====

// DOM refs
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const voiceOutToggle = document.getElementById("voiceOutToggle");
const copyScriptBtn = document.getElementById("copyScriptBtn");
const historyList = document.getElementById("historyList");
const truckSelect = document.getElementById("truckSelect");

const lastNetEl = document.getElementById("lastNet");
const dayProfitEl = document.getElementById("dayProfit");
const weekProfitEl = document.getElementById("weekProfit");

// ===== STATE =====
let lastBrokerScript = "";
let history = [];

// 10-truck fleet with placeholders + weekProfit bucket
let trucks = [
  { id: "t1", label: "Truck 1", mpg: 7.0, weekProfit: 0 },
  { id: "t2", label: "Truck 2", mpg: 6.8, weekProfit: 0 },
  { id: "t3", label: "Truck 3", mpg: 7.2, weekProfit: 0 },
  { id: "t4", label: "Truck 4", mpg: 6.5, weekProfit: 0 },
  { id: "t5", label: "Truck 5", mpg: 7.0, weekProfit: 0 },
  { id: "t6", label: "Truck 6", mpg: 6.7, weekProfit: 0 },
  { id: "t7", label: "Truck 7", mpg: 7.3, weekProfit: 0 },
  { id: "t8", label: "Truck 8", mpg: 6.9, weekProfit: 0 },
  { id: "t9", label: "Truck 9", mpg: 7.1, weekProfit: 0 },
  { id: "t10", label: "Truck 10", mpg: 6.6, weekProfit: 0 }
];

let selectedTruckId = "t1";

// ===== LOCAL STORAGE (save per-truck weekly profit) =====
function loadTrucksFromStorage() {
  try {
    const raw = localStorage.getItem("aiTD_trucks_v31");
    if (!raw) return;
    const saved = JSON.parse(raw);
    trucks = trucks.map((t) => {
      const found = saved.find((s) => s.id === t.id);
      return found
        ? {
            ...t,
            weekProfit: typeof found.weekProfit === "number" ? found.weekProfit : 0
          }
        : t;
    });
  } catch (e) {
    // ignore
  }
}

function saveTrucksToStorage() {
  try {
    const skinny = trucks.map((t) => ({
      id: t.id,
      weekProfit: t.weekProfit
    }));
    localStorage.setItem("aiTD_trucks_v31", JSON.stringify(skinny));
  } catch (e) {
    // ignore
  }
}

// ===== TRUCK UTILS =====
function initTruckSelect() {
  if (!truckSelect) return;
  truckSelect.innerHTML = "";
  trucks.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.label;
    truckSelect.appendChild(opt);
  });
  truckSelect.value = selectedTruckId;
}

function getSelectedTruck() {
  const found = trucks.find((t) => t.id === selectedTruckId);
  return found || trucks[0];
}

function setSelectedTruck(id) {
  selectedTruckId = id;
  if (truckSelect) truckSelect.value = id;
  updateProfitPanel(null); // refresh week total display
}

// ===== UI HELPERS =====
function addMessage(text, sender = "ai") {
  const div = document.createElement("div");
  div.className = sender === "user" ? "msg msg-user" : "msg msg-ai";
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (sender === "ai" && voiceOutToggle && voiceOutToggle.checked) {
    speakText(text);
  }
}

function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  if (!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// ===== PARSE + ANALYZE =====
function parseLoadText(text) {
  const nums = text.match(/[\d.]+/g);
  if (!nums || nums.length < 4) return null;

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

function analyzeLoad(d) {
  const { pay, miles, deadhead, fuelPrice, mpg, style } = d;

  const totalMiles = miles + deadhead;
  const gallons = totalMiles / mpg;
  const fuelCost = gallons * fuelPrice;
  const netProfit = pay - fuelCost;
  const rpm = miles > 0 ? pay / miles : 0;
  const deadRatio = miles > 0 ? deadhead / miles : 0;

  let verdict = "";
  let emoji = "";
  let action = "";
  let laneNote = "";
  let suggestedCounter = pay;

  if (rpm >= 3.0) {
    emoji = "💎";
    verdict = "Excellent RPM. Strong load.";
    action = "Good to TAKE or hold firm. ";
    suggestedCounter = pay + 50;
  } else if (rpm >= 2.5) {
    emoji = "✅";
    verdict = "Solid RPM. Good load.";
    action = "Take or COUNTER a little higher. ";
    suggestedCounter = pay + 60;
  } else if (rpm >= 2.2) {
    emoji = "😐";
    verdict = "Borderline but workable.";
    action = "OK to take if needed, but try to bump it. ";
    suggestedCounter = pay + 80;
  } else {
    emoji = "⚠";
    verdict = "Weak RPM. Be careful.";
    action = "COUNTER hard or PASS unless you must move the truck. ";
    suggestedCounter = pay + 100;
  }

  if (deadRatio > 0.3) {
    laneNote += "High deadhead. Push harder on rate. ";
  } else if (deadRatio > 0) {
    laneNote += "Deadhead is reasonable. ";
  }

  if (style === "aggressive") {
    suggestedCounter += 30;
    laneNote += "Aggressive mode: aim higher on the counter.";
  } else {
    laneNote += "Normal mode: balance rate and keeping wheels turning.";
  }

  const dayProfit = netProfit;
  const weekProfitGuess = netProfit * 5;

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
    emoji,
    action,
    laneNote,
    suggestedCounter,
    dayProfit,
    weekProfitGuess
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
    emoji,
    action,
    laneNote,
    suggestedCounter
  } = result;

  const truck = getSelectedTruck();

  return [
    `Truck: ${truck.label}`,
    `Pay: $${pay.toFixed(2)}  Miles: ${miles.toFixed(
      0
    )}  Deadhead: ${deadhead.toFixed(0)}`,
    `Fuel Cost: $${fuelCost.toFixed(2)}  Net Profit: $${netProfit.toFixed(
      2
    )}  RPM (loaded): ${rpm.toFixed(2)}`,
    `Style: ${style.toUpperCase()}  Verdict: ${emoji} ${verdict}`,
    `Suggested counter: ~$${suggestedCounter.toFixed(
      0
    )}. ${action}${laneNote}`
  ].join("\n");
}

function buildBrokerScript(result) {
  const { pay, miles, deadhead, fuelCost, netProfit, suggestedCounter } =
    result;
  const truck = getSelectedTruck();

  return (
    `Hi, this is [YOUR NAME] with [CARRIER]. ` +
    `Looking at your load for ${truck.label}, around ${miles.toFixed(
      0
    )} loaded and ${deadhead.toFixed(
      0
    )} deadhead miles, with fuel cost about $${fuelCost.toFixed(
      2
    )} on this run, $${pay.toFixed(
      2
    )} is a bit tight for us. ` +
    `To make this work profitably, we'd need to be closer to about $${suggestedCounter.toFixed(
      0
    )} all-in. ` +
    `That keeps us near a healthy net (roughly $${netProfit.toFixed(
      2
    )} after fuel). Can you get me closer to that range?`
  );
}

// ===== PROFIT PANEL (per selected truck) =====
function updateProfitPanel(resultOrNull) {
  const truck = getSelectedTruck();

  if (resultOrNull) {
    lastNetEl.textContent = `$${resultOrNull.netProfit.toFixed(2)}`;
    dayProfitEl.textContent = `$${resultOrNull.dayProfit.toFixed(2)}`;
  }

  weekProfitEl.textContent = `$${truck.weekProfit.toFixed(
    2
  )} (for ${truck.label})`;
}

// Add profit to selected truck
function addProfitToCurrentTruck(netProfit) {
  const truck = getSelectedTruck();
  truck.weekProfit += netProfit;
  saveTrucksToStorage();
  updateProfitPanel(null);
}

// ===== HISTORY =====
function addToHistory(rawText, summary, brokerScript, result) {
  history.unshift({ rawText, summary, brokerScript, result });
  if (history.length > 10) history.pop();
  renderHistory();
}

function renderHistory() {
  if (!historyList) return;
  historyList.innerHTML = "";
  history.forEach((item) => {
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

// ===== MAIN SEND HANDLER =====
function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("You: " + text, "user");
  userInput.value = "";

  const parsed = parseLoadText(text);
  if (!parsed) {
    addMessage(
      "I need at least: pay miles deadhead fuel. Example: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 aggressive.",
      "ai"
    );
    return;
  }

  const result = analyzeLoad(parsed);
  const summary = buildSummaryText(result);
  const brokerScript = buildBrokerScript(result);

  // Save for copy button
  lastBrokerScript = brokerScript;

  // Update per-truck weekly profit
  addProfitToCurrentTruck(result.netProfit);

  // Update global profit panel (last load + truck weekly)
  updateProfitPanel(result);

  // Chat output
  addMessage(summary, "ai");
  addMessage(
    "Broker script ready. Tap 'Copy broker script' to copy.",
    "ai"
  );

  // History
  addToHistory(text, summary, brokerScript, result);
}

// ===== BUTTON EVENTS =====
sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSend();
  }
});

if (truckSelect) {
  truckSelect.addEventListener("change", (e) => {
    setSelectedTruck(e.target.value);
  });
}

if (copyScriptBtn) {
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
}

// ===== INIT =====
loadTrucksFromStorage();
initTruckSelect();
setSelectedTruck(selectedTruckId);

addMessage(
  "AITruckDispatcher v31 loaded. Select a truck, then enter: pay miles deadhead fuel mpg(optional) style(optional).",
  "ai"
);
