// AITruckDispatcher v30 - with load type, verdict colors, and LOCAL STORAGE history

const HISTORY_KEY = "ai_truck_dispatcher_v30_history";

// Load & render history on page load
window.addEventListener("load", () => {
  const historyDiv = document.getElementById("history");
  if (!historyDiv) return;

  const saved = localStorage.getItem(HISTORY_KEY);
  let historyItems = [];
  try {
    historyItems = saved ? JSON.parse(saved) : [];
  } catch (e) {
    historyItems = [];
  }
  renderHistory(historyItems, historyDiv);
});

document.getElementById("sendBtn").addEventListener("click", () => {
  const raw = document.getElementById("userInput").value || "";
  const output = document.getElementById("output");
  const truckSelect = document.getElementById("truckSelect");
  const loadTypeSelect = document.getElementById("loadTypeSelect");
  const historyDiv = document.getElementById("history");

  if (!raw.trim()) {
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
  // Works with "1500 pay 520 miles 80 deadhead 4.25 fuel 7 mpg normal"
  const nums = raw.match(/[\d.]+/g)?.map(Number) || [];

  let pay       = nums[0] || 0;
  let miles     = nums[1] || 0;
  let deadhead  = nums[2] || 0;
  let fuelPrice = nums[3] || 0;
  let mpg       = nums[4] || 0;

  // ---------- IF FUEL OR MPG MISSING, USE TRUCK DEFAULTS ----------
  if (!fuelPrice) fuelPrice = profile.fuelPrice;
  if (!mpg)       mpg       = profile.mpg;
  if (!mpg)       mpg       = 7; // safety default

  // ---------- DETECT STYLE FROM KEYWORDS ----------
  const lower = raw.toLowerCase();
  let style = "normal";
  if (lower.includes("agg")) style = "aggressive";
  if (lower.includes("normal")) style = "normal";

  // ---------- CALCULATIONS ----------
  const totalMiles = miles + deadhead;
  const fuelCost   = mpg > 0 ? (totalMiles / mpg) * fuelPrice : 0;
  const netProfit  = pay - fuelCost;
  const rpm        = miles > 0 ? pay / miles : 0;

  // ---------- VERDICT / SUGGESTION / SCRIPT ----------
  let verdict       = "";
  let suggestion    = "";
  let brokerScript  = "";
  let verdictClass  = "borderline";

  if (style === "aggressive") {
    verdict      = "🔥 Aggressive Mode";
    verdictClass = "aggressive";
    const counter = pay + 50;
    suggestion = "Aggressive mode: Ask for at least $50 more if possible.";
    brokerScript =
      "Hi, this is dispatch for " + truckName + ".\n" +
      "We have a " + loadType + " load: " + miles + " miles + " + deadhead + " deadhead.\n" +
      "Fuel is around $" + fuelPrice.toFixed(2) + ".
