document.getElementById("sendBtn").addEventListener("click", () => {
  const raw = document.getElementById("userInput").value;
  const output = document.getElementById("output");
  const truckSelect = document.getElementById("truckSelect");

  if (!raw.trim()) {
    output.innerHTML = "Please enter load details.";
    return;
  }

  // ===== Truck defaults (you can tweak these) =====
  const truckDefaults = {
    "Truck 1": { mpg: 7,   fuelPrice: 4.25 },
    "Truck 2": { mpg: 6.5, fuelPrice: 4.10 },
    "Truck 3": { mpg: 8,   fuelPrice: 4.50 }
  };

  const truckName = truckSelect.value;
  const defaults = truckDefaults[truckName] || truckDefaults["Truck 1"];

  // ===== Grab ALL numbers from the string, in order =====
  const nums = (raw.match(/[\d.]+/g) || []).map(Number);

  let pay       = nums[0] || 0;
  let miles     = nums[1] || 0;
  let deadhead  = nums[2] || 0;
  let fuelPrice = nums[3] || defaults.fuelPrice; // uses truck default if missing
  let mpg       = nums[4] || defaults.mpg;       // uses truck default if missing

  // ===== Detect style from words anywhere =====
  let style = "normal";
  const lower = raw.toLowerCase();
  if (lower.includes("agg")) style = "aggressive";
  if (lower.includes("normal")) style = "normal";

  // ===== Calculations =====
  let totalMiles = miles + deadhead;
  let fuelCost   = mpg > 0 ? (totalMiles / mpg) * fuelPrice : 0;
  let netProfit  = pay - fuelCost;
  let rpm        = miles > 0 ? pay / miles : 0;

  let verdict = "";
  let suggestion = "";
  let brokerScript = "";

  if (style === "aggressive") {
    verdict = "🔥 Aggressive Mode";
    suggestion = "Ask for at least $50 more";
    let counter = pay + 50;

    brokerScript =
`Hi, this is dispatch for ${truckName}.
For this load: ${miles} miles + ${deadhead} deadhead.
Fuel is around $${fuelPrice}. We need about $${counter} all-in.
Can you get us closer to that?`;
  } else {
    if (rpm >= 2.2) {
      verdict = "✅ Good Load";
    } else if (rpm >= 1.8) {
      verdict = "⚠️ Borderline Load";
    } else {
      verdict = "❌ Weak Load";
    }

    suggestion = "Normal mode: Ask for about $25 more";
    let counter = pay + 25;

    brokerScript =
`Hi, this is dispatch for ${truckName}.
Looking at ${miles} miles + ${deadhead} deadhead.
Fuel is $${fuelPrice}. Pay is $${pay}. Can you get closer to $${counter}?`;
  }

  // ===== Output =====
  output.innerHTML = `
<strong>RESULTS:</strong><br><br>
Pay: $${pay}<br>
Miles: ${miles}<br>
Deadhead: ${deadhead}<br>
Total Miles: ${totalMiles}<br>
Fuel Cost: $${fuelCost.toFixed(2)}<br>
Net Profit: $${netProfit.toFixed(2)}<br>
RPM: ${rpm.toFixed(2)}<br><br>

Verdict: ${verdict}<br>
Suggestion: ${suggestion}<br><br>

<strong>Broker Script:</strong><br>
${brokerScript.replace(/\n/g, "<br>")}
  `;
});
