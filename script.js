// ===== AITruckDispatcher v20 =====

// UI references
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Write message to screen
function addMessage(text, sender = "ai") {
    const div = document.createElement("div");
    div.className = sender === "user" ? "msg user" : "msg ai";
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Opening system message
addMessage(
    "AITruckDispatcher v20 loaded. Enter: pay miles deadhead fuel mpg(optional) style(optional)."
);

// Handle sending
function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage("You: " + text, "user");
    userInput.value = "";

    processLoad(text);
}

sendBtn.onclick = handleSend;
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
});

// ====== Core Dispatcher Logic ======

function processLoad(text) {
    const nums = text.match(/([\d.]+)/g);
    if (!nums || nums.length < 4) {
        addMessage("Invalid format. Enter: pay miles deadhead fuel mpg(optional) style(optional).");
        return;
    }

    let pay = parseFloat(nums[0]);
    let miles = parseFloat(nums[1]);
    let dead = parseFloat(nums[2]);
    let fuel = parseFloat(nums[3]);
    let mpg = nums[4] ? parseFloat(nums[4]) : 6.5;

    let parts = text.split(" ");
    let style = parts.includes("aggressive") ? "AGGRESSIVE" : "NORMAL";

    // Calculations
    let totalMiles = miles + dead;
    let fuelCost = (totalMiles / mpg) * fuel;
    let net = pay - fuelCost;
    let rpm = pay / miles;

    // Determine rating
    let verdict = "⚠️ Weak Load.";
    let suggested = "$???";
    let brokerNote = "";

    if (style === "AGGRESSIVE") {
        suggested = `$${(pay * 1.10).toFixed(0)}–$${(pay * 1.15).toFixed(0)}`;
        if (rpm >= 2.70) verdict = "💎 Strong Load.";
        else if (rpm >= 2.20) verdict = "👍 Decent Load.";
    } else {
        suggested = `$${(pay * 1.03).toFixed(0)}–$${(pay * 1.07).toFixed(0)}`;
        if (rpm >= 2.50) verdict = "💎 Strong Load.";
        else if (rpm >= 2.00) verdict = "👍 Decent Load.";
    }

    brokerNote = `Broker message: Hi, this is [YOUR NAME] with [CARRIER]. Looking at your load. For about ${miles} loaded and ${dead} deadhead at fuel around $${fuel}/gal and truck MPG approx ${mpg}, $${pay} is a bit tight for us. To make this work in a ${style === "AGGRESSIVE" ? "aggressive" : "normal"} way and still run it profitably, we'd need to be closer to about ${suggested} all-in. Can you get me closer to that range?`;

    // Final output
    let output = 
`Pay: $${pay}
Miles: ${miles} | Deadhead: ${dead}
Fuel Cost: $${fuelCost.toFixed(2)}
Net Profit: $${net.toFixed(2)}
RPM: ${rpm.toFixed(2)}
Style: ${style}
Verdict: ${verdict}
Suggested counter: ${suggested}

${brokerNote}`;

    addMessage(output);
}
