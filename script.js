// ================================
// Truck Profiles (10 trucks)
// ================================
let trucks = {
  1: { mpg: 7.0, fuel: 4.25 },
  2: { mpg: 7.0, fuel: 4.25 },
  3: { mpg: 7.0, fuel: 4.25 },
  4: { mpg: 7.0, fuel: 4.25 },
  5: { mpg: 7.0, fuel: 4.25 },
  6: { mpg: 7.0, fuel: 4.25 },
  7: { mpg: 7.0, fuel: 4.25 },
  8: { mpg: 7.0, fuel: 4.25 },
  9: { mpg: 7.0, fuel: 4.25 },
  10: { mpg: 7.0, fuel: 4.25 }
};

let selectedTruck = 1;

// ================================
// Toggle dropdown menu
// ================================
function toggleTruckMenu() {
  const menu = document.getElementById("truckMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// Select truck
function selectTruck(num) {
  selectedTruck = num;
  document.getElementById("truckBtn").innerText = "Truck " + num;
  document.getElementById("truckMenu").style.display = "none";
}

// ================================
// Dispatcher Calculator
// ================================
function analyzeLoad() {
  let txt = document.getElementById("input").value.trim();
  if (!txt) return;

  let mpg = trucks[selectedTruck].mpg;
  let fuelPrice = trucks[selectedTruck].fuel;

  let parts = txt.split(" ");
  let pay = Number(parts[0]);
  let miles = Number(parts[1]);
  let dead = Number(parts[2]);

  let fuelCost = (miles + dead) / mpg * fuelPrice;
  let net = pay - fuelCost;
  let rpm = pay / miles;

  let verdict = (rpm >= 2.50 ? "🔥 Strong load!" : "⚠️ Weak load.");
  let ask = pay + 60;

  let out = `
Pay: $${pay}
Miles: ${miles}
Deadhead: ${dead}
Fuel Cost: $${fuelCost.toFixed(2)}
Net Profit: $${net.toFixed(2)}
RPM: ${rpm.toFixed(2)}
Verdict: ${verdict}

Suggested counter: ~$${ask}

Broker script:
"Hi, this is [YOUR NAME] with [CARRIER]. Looking at your load around ${miles} loaded and ${dead} deadhead miles, fuel is near $${fuelPrice}/gal and $${pay} is a bit tight. Can you get me closer to about $${ask} all-in?"
`;

  document.getElementById("result").innerText = out;
}

// ================================
// Bind send button
// ================================
document.getElementById("sendBtn").onclick = analyzeLoad;
