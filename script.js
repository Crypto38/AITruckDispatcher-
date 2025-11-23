// AITruckDispatcher v30 – single-truck helper

const inputEl = document.getElementById("loadInput");
const sendBtn = document.getElementById("sendBtn");
const truckBtn = document.getElementById("truckBtn");
const outputEl = document.getElementById("output");

let activeTruckIndex = 0; // for future multi-truck use

function addLine(text = "") {
  outputEl.value += (outputEl.value ? "\n" : "") + text;
}

// Very simple RPM + fuel/ profit calculator
function analyzeLoad(text) {
  // Expected format: pay miles deadhead fuel mpg(optional) style(optional)
  // Example: 1500 520 80 4.25 7 aggressive

  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 4) {
    return "Format: pay miles deadhead fuel mpg(optional) style(optional)\nExample: 1500 520 80 4.25 7 aggressive";
  }

  const pay = parseFloat(parts[0]);
  const miles = parseFloat(parts[1]);
  const dead = parseFloat(parts[2]);
  const fuelPrice = parseFloat(parts[3]);

  if ([pay, miles, dead, fuelPrice].some(v => isNaN(v))) {
    return "Could not read numbers. Use: pay miles deadhead fuel mpg(optional) style(optional)";
  }

  const mpg = parts[4] ? parseFloat(parts[4]) : 7.0;
  const style = (parts[5] || "normal").toLowerCase();

  const totalMiles = miles + dead;
  const fuelCost = (totalMiles / mpg) * fuelPrice;
  const net = pay - fuelCost;
  const rpm = pay / miles;

  let verdict = "";
  let icon = "";
  let targetExtra = 0;

  if (rpm >= 3.0) {
    verdict = "🔥 Great load.";
    icon = "✅";
  } else if (rpm >= 2.5) {
    verdict = "💎 Strong load.";
    icon = "✅";
    targetExtra = 50;
  } else if (rpm >= 2.0) {
    verdict = "⚠️ Meh. Try to bump it.";
    icon = "⚠️";
    targetExtra = 100;
  } else {
    verdict = "❌ Weak. Look for more money.";
    icon = "❌";
    targetExtra = 150;
  }

  // Rough suggested counter
  const suggested = targetExtra ? pay + targetExtra : pay;

  const summary = [
    `Pay: $${pay.toFixed(2)}  Miles: ${miles}  Deadhead: ${dead}`,
    `Fuel: $${fuelPrice.toFixed(2)}/gal  MPG: ${mpg.toFixed(2)}  Total miles: ${totalMiles}`,
    `Fuel Cost: $${fuelCost.toFixed(2)}  Net Profit: $${net.toFixed(2)}  RPM: ${rpm.toFixed(2)}`,
    `Style: ${style.toUpperCase()}  Verdict: ${icon} ${verdict}`,
    `Suggested counter: ~$${suggested.toFixed(0)}`
  ].join("\n");

  return summary;
}

function handleSend() {
  const text = inputEl.value.trim();
  if (!text) return;
  outputEl.value = ""; // clear for new response
  addLine(analyzeLoad(text));
}

// Wire up button + Enter key
sendBtn.onclick = handleSend;
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSend();
  }
});

// For now truck button just shows which truck is active
if (truckBtn) {
  truckBtn.textContent = "Truck 1";
  truckBtn.onclick = () => {
    alert("Multi-truck selector coming later. Right now everything uses Truck 1.");
  };
}

// Initial hint
addLine("AITruckDispatcher v30 loaded. Enter: pay miles deadhead fuel mpg(optional) style(optional).");
addLine("Example: 1500 520 80 4.25 7 aggressive");
