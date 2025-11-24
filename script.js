// AITruckDispatcher v30 – 10 trucks, load types, color verdicts, and PERMANENT HISTORY

document.getElementById("sendBtn").addEventListener("click", () => {
  const raw = (document.getElementById("userInput").value || "").trim();
  const output = document.getElementById("output");
  const truckSelect = document.getElementById("truckSelect");
  const loadTypeSelect = document.getElementById("loadType"); // HTML select id="loadType"
  const historyDiv = document.getElementById("history");

  if (!raw) {
    output.innerHTML = "Please enter load details.";
    return;
  }

  // ---------- TRUCK PROFILES (10 TRUCKS) ----------
  const truckProfiles = {
    "Truck 1":  { mpg: 7.0, fuelPrice: 4.25 },
    "Truck 2":  { mpg: 6.5, fuelPrice: 4.10 },
    "Truck 3":  { mpg: 8.0, fuelPrice: 4.50 },
    "Truck 4":  { mpg: 7.2, fuelPrice: 4.20 },
    "Truck 5":  { mpg: 6.8, fuelPrice: 4.18 },
    "Truck 6":  { mpg: 7.5, fuelPrice: 4.30 },
    "Truck 7":  { mpg: 6.9, fuelPrice: 4.40 },
    "Truck 8":  { mpg: 7.8, fuelPrice: 4.35 },
    "Truck 9":  { mpg: 6.7, fuelPrice: 4.15 },
    "Truck 10": { mpg: 8.1, fuelPrice: 4.55 }
  };

  const truckName = truckSelect.value || "Truck 1";
  const profile = truckProfiles[truckName] || truckProfiles["Truck 1"];
  const loadType = loadTypeSelect ? (loadTypeSelect.value || "Dry Van") : "Dry Van";

  // ---------- EXTRACT NUMBERS IN ORDER ----------
  // Works with: "1500 pay 520 miles 80 deadhead 4.25 fuel 7 mpg aggressive"
  const nums = raw.match(/[\d.]+/g)?.map(Number) || [];

  let pay       = nums[0] || 0;
  let miles     = nums[1] || 0;
  let deadhead  = nums[2] || 0;
  let fuelPrice = nums[3] || 0;
  let mpg       = nums[4] || 0;

  // ---------- IF FUEL OR MPG MISSING, USE TRUCK DEFAULT ----------
  if (!fuelPrice) fuelPrice = profile.fuelPrice;
  if (!mpg)       mpg       = profile.mpg;
  if (!mpg)       mpg       = 7; // safety default

  // ---------- DETECT STYLE FROM KEYWORDS ----------
  const lower = raw.toLowerCase();
  let style = "normal";
  if (lower.includes("agg"))    style = "aggressive";
  if (lower.includes("normal")) style = "normal";

  // ---------- CALCULATIONS ----------
  const totalMiles = miles + deadhead;
  const fuelCost   = mpg > 0 ? (totalMiles / mpg) * fuelPrice : 0;
  const netProfit  = pay - fuelCost;
  const rpm        = miles > 0 ? pay / miles : 0;

  // ---------- VERDICT / SUGGESTION / SCRIPT ----------
  let verdict = "";
  let suggestion = "";
  let brokerScript = "";
  let verdictClass = "borderline";

  if (style === "aggressive") {
    verdict = "🔥 Aggressive Mode";
    verdictClass = "aggressive";
    const counter = pay + 50;
    suggestion = "Aggressive mode: Ask for at least $" + counter.toFixed(0);

    brokerScript =
      "Hi, this is dispatch for " + truckName + ".\n" +
      "We have a " + loadType + " load: " + miles + " miles + " + deadhead + " deadhead.\n" +
      "Fuel is around $" + fuelPrice.toFixed(2) + ". RPM is " + rpm.toFixed(2) + ".\n" +
      "We're looking for about $" + counter.toFixed(0) + " all in to make this work.";
  } else {
    if (rpm >= 2.2) {
      verdict = "✅ Good Load";
      verdictClass = "good";
    } else if (rpm >= 1.8) {
      verdict = "⚠️ Borderline Load";
      verdictClass = "borderline";
    } else {
      verdict = "❌ Weak Load";
      verdictClass = "weak";
    }

    const counter = pay + 25;
    suggestion = "Normal mode: Ask for around $" + counter.toFixed(0) + ".";

    brokerScript =
      "Hi, this is dispatch for " + truckName + ".\n" +
      "Looking at " + miles + " miles + " + deadhead + " deadhead (" + loadType + " load).\n" +
      "Fuel is $" + fuelPrice.toFixed(2) + ". Pay is $" + pay.toFixed(2) + ".\n" +
      "Can you get closer to $" + counter.toFixed(0) + "?";
  }

  // ---------- OUTPUT CARD ----------
  output.innerHTML = `
    <div class="summaryBox ${verdictClass}">
      <strong>RESULTS:</strong><br><br>
      Truck: ${truckName}<br>
      Load Type: ${loadType}<br>
      Pay: $${pay.toFixed(2)}<br>
      Miles: ${miles}<br>
      Deadhead: ${deadhead}<br>
      Total Miles: ${totalMiles}<br>
      Fuel Price: $${fuelPrice.toFixed(2)}<br>
      MPG: ${mpg.toFixed(1)}<br>
      Fuel Cost: $${fuelCost.toFixed(2)}<br>
      Net Profit: $${netProfit.toFixed(2)}<br>
      RPM: ${rpm.toFixed(2)}<br><br>
      Verdict: ${verdict}<br>
      Suggestion: ${suggestion}<br><br>
      <strong>Broker Script:</strong><br>
      ${brokerScript.replace(/\n/g, "<br>")}
    </div>
  `;

  // ---------- HISTORY ENTRY ----------
  if (historyDiv) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();

    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <div><strong>${timestamp}</strong> - ${truckName} (${loadType})</div>
      <div>Pay $${pay.toFixed(0)}, Miles ${miles}, DH ${deadhead}, RPM ${rpm.toFixed(2)}</div>
    `;
    historyDiv.appendChild(item);
    saveHistory(); // save after adding new item
  }
});

// ---------- SAVE HISTORY TO LOCAL STORAGE ----------
function saveHistory() {
  const historyEl = document.getElementById("history");
  if (!historyEl) return;
  const html = historyEl.innerHTML;
  try {
    localStorage.setItem("dispatcherHistory", html);
  } catch (e) {
    console.warn("Could not save history:", e);
  }
}

// ---------- LOAD HISTORY FROM LOCAL STORAGE ----------
function loadHistory() {
  const historyEl = document.getElementById("history");
  if (!historyEl) return;
  try {
    const stored = localStorage.getItem("dispatcherHistory");
    if (stored) {
      historyEl.innerHTML = stored;
    }
  } catch (e) {
    console.warn("Could not load history:", e);
  }
}

// load saved history when page opens
loadHistory();
