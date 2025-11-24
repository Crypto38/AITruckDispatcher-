document.getElementById("sendBtn").addEventListener("click", () => {
  const raw = document.getElementById("userInput").value;
  const output = document.getElementById("output");
  const truck = document.getElementById("truckSelect").value;

  if (!raw.trim()) {
    output.innerHTML = "Please enter load details.";
    return;
  }

  // ---- Truck profiles (defaults per truck) ----
  const truckProfiles = {
    "Truck 1": { mpg: 7,   fuelPrice: 4.25 },
    "Truck 2": { mpg: 6.5, fuelPrice: 4.10 },
    "Truck 3": { mpg: 8,   fuelPrice: 4.50 }
  };

  // ---- Pull ALL numbers from the string ----
  const nums = raw.match(/[\d.]+/g)?.map(Number) || [];

  // Order: pay, miles, deadhead, fuelPrice, mpg
  let pay       = nums[0] || 0;
  let miles     = nums[1] || 0;
  let deadhead  = nums[2] || 0;
  let fuelPrice = nums[3] || 0;
  let mpg       = nums[4] || 0;

  // If user did NOT type fuel/mpg, use truck defaults
  const profile = truckProfiles[truck];
  if (profile) {
    if (!fuelPrice) fuelPrice = profile.fuelPrice;
    if (!mpg)       mpg       = profile.mpg;
  }
  if (!mpg) mpg = 7; // safety default

  // ---- Detect style from words anywhere ----
  let style = "normal";
  const lower = raw.toLowerCase();
  if (lower.includes("agg")) style = "aggressive";
  if (lower.includes("normal")) style = "normal";

  // ---- Calculations ----
  const totalMiles = miles + deadhead;
  const fuelCost   = mpg > 0 ? (totalMiles / mpg) * fuelPrice : 0;
  const netProfit  = pay - fuelCost;
  const rpm        = miles > 0 ? pay / miles : 0;

  let verdict = "";
  let suggestion = "";
  let brokerScript = "";

  if (style === "aggressive") {
    verdict = "🔥 Aggressive Mode";
    suggestion = "Ask for at least $50 more";
    const counter = pay + 50;

    brokerScript =
`Hi, this is dispatch for ${truck}.
For this load: ${miles} miles + ${deadhead} deadhead.
Fuel is around $${fuelPrice} and we’re running about ${mpg} MPG.
We need about $${counter} all-in. Can you get us closer to that?`;
  } else {
    if (rpm >= 2.2)       verdict = "✅ Good Load";
    else if (rpm >= 1.8)  verdict = "⚠️ Borderline Load";
    else                  verdict = "❌ Weak load";

    const counter = pay + 25;
    suggestion = `Normal mode: Ask for around $${counter}.`;

    brokerScript =
`Hi, this is dispatch for ${truck}.
Looking at ${miles} miles + ${deadhead} deadhead.
Fuel is about $${fuelPrice} and the truck averages ${mpg} MPG.
Pay is $${pay}. Can you get us closer to $${counter}?`;
  }

  // ---- Output ----
  output.innerHTML = `
<strong>RESULTS:</strong><br><br>
Pay: $${pay}<br>
Miles: ${miles}<br>
Deadhead: ${deadhead}<br>
Total Miles: ${totalMiles}<br>
Fuel Price: $${fuelPrice}<br>
MPG: ${mpg}<br>
Fuel Cost: $${fuelCost.toFixed(2)}<br>
Net Profit: $${netProfit.toFixed(2)}<br>
RPM: ${rpm.toFixed(2)}<br><br>
Verdict: ${verdict}<br>
Suggestion: ${suggestion}<br><br>
<strong>Broker Script:</strong><br>
${brokerScript.replace(/\n/g, "<br>")}
`;
});
