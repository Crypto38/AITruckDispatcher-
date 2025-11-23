// ===== AITruckDispatcher v30 — FINAL FIXED JS =====

// Grab elements from HTML
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const output = document.getElementById("output");
const truckSelect = document.getElementById("truckSelect");

// Default MPG + fuel per truck (editable later)
const trucks = {
    "Truck 1": { mpg: 7.0, fuel: 4.25 },
    "Truck 2": { mpg: 6.7, fuel: 4.20 },
    "Truck 3": { mpg: 7.2, fuel: 4.30 },
    "Truck 4": { mpg: 6.9, fuel: 4.18 },
    "Truck 5": { mpg: 7.5, fuel: 4.40 },
    "Truck 6": { mpg: 6.8, fuel: 4.12 },
    "Truck 7": { mpg: 7.1, fuel: 4.28 },
    "Truck 8": { mpg: 7.0, fuel: 4.22 },
    "Truck 9": { mpg: 6.6, fuel: 4.15 },
    "Truck 10": { mpg: 7.3, fuel: 4.35 }
};

// Main calculation function
function analyzeLoad(text) {
    const parts = text.split(" ");

    let pay = parseFloat(parts[0]);
    let miles = parseFloat(parts[1]);
    let dead = parseFloat(parts[2]);
    let fuelPrice = parseFloat(parts[3] || trucks[truckSelect.value].fuel);
    let mpg = parseFloat(parts[4] || trucks[truckSelect.value].mpg);
    let style = (parts[5] || "normal").toLowerCase();

    if (isNaN(pay) || isNaN(miles) || isNaN(dead)) {
        return "❌ Format example:\n1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 aggressive";
    }

    let totalMiles = miles + dead;
    let fuelCost = (totalMiles / mpg) * fuelPrice;
    let net = pay - fuelCost;
    let rpm = pay / miles;

    let verdict = rpm >= 2.4 ? "🔥 Strong load" : "⚠️ Weak load";
    let counter = style === "aggressive" ? pay + 90 : pay + 50;

    return `
<b>Truck:</b> ${truckSelect.value}
<b>Pay:</b> $${pay}
<b>Miles:</b> ${miles}
<b>Deadhead:</b> ${dead}

<b>Fuel:</b> $${fuelPrice}/gal
<b>MPG:</b> ${mpg}
<b>Fuel Cost:</b> $${fuelCost.toFixed(2)}

<b>Net Profit:</b> $${net.toFixed(2)}
<b>RPM:</b> ${rpm.toFixed(2)}
<b>Verdict:</b> ${verdict}

<b>Suggested Counter:</b> $${counter}

<b>Broker Script:</b>
"Hi, this is Dispatch. Based on ${miles} miles + ${dead} deadhead
and fuel at $${fuelPrice}, $${pay} is tight.
I’d need around $${counter} to move this. Can you get me closer?"
`;
}

// When user presses Send
sendBtn.addEventListener("click", () => {
    const text = input.value.trim();

    if (!text) {
        output.innerHTML = "❌ Enter a load first.";
        return;
    }

    output.innerHTML = analyzeLoad(text);
});
