// ===== AITruckDispatcher v20 - Smart Load Evaluator =====

// connect DOM elements
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// message display function
function addMessage(text, sender = "ai") {
    const div = document.createElement("div");
    div.className = sender === "user" ? "msg-user" : "msg-ai";
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// initial display line
addMessage(
    "AITruckDispatcher v20 loaded. Paste a load like: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 aggressive from Atlanta to Chicago."
);

// main handling logic
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

// PROCESSING THE LOAD STRING
function processLoad(input) {
    // extract all numbers from user input
    const nums = input.match(/(\d+(\.\d+)?)/g);

    if (!nums || nums.length < 4) {
        addMessage("Invalid format. Use: pay miles deadhead fuel mpg(optional) style(optional).");
        return;
    }

    // assign required values
    const pay = parseFloat(nums[0]);
    const miles = parseFloat(nums[1]);
    const dead = parseFloat(nums[2]);
    const fuelPrice = parseFloat(nums[3]);
    const mpg = nums[4] ? parseFloat(nums[4]) : 7.0;

    // extract style if the word aggressive or normal is present
    const style = input.toLowerCase().includes("aggressive")
        ? "AGGRESSIVE"
        : "NORMAL";

    // use a default mpg if insane value provided
    const truckMPG = mpg < 3 || mpg > 15 ? 7 : mpg;

    // compute values
    const fuelCost = ((miles + dead) / truckMPG) * fuelPrice;
    const net = pay - fuelCost;
    const rpm = pay / miles;

    // determine verdict
    let verdict = "";
    if (rpm >= 3.00) verdict = "🔥 Excellent Load.";
    else if (rpm >= 2.50) verdict = "💎 Strong Load.";
    else if (rpm >= 2.20) verdict = "👍 Decent Load.";
    else verdict = "⚠️ Weak Load. COUNTER.";

    // compute suggested counter
    let counterLow = pay;
    let counterHigh = pay;

    if (style === "AGGRESSIVE") {
        counterLow = Math.round(pay + 60);
        counterHigh = Math.round(pay + 110);
    } else {
        counterLow = Math.round(pay + 10);
        counterHigh = Math.round(pay + 60);
    }

    // broker message builder
    const brokerMessage = 
`Hi, this is [YOUR NAME] with [CARRIER]. Looking at your load. 
For about ${miles} loaded and ${dead} deadhead at fuel around $${fuelPrice}/gal 
and truck mpg around ${truckMPG}, $${pay}.00 is a bit tight for us.

To make this work in a ${style.toLowerCase()} way and still run it profitably, 
we’d need to be closer to about $${counterLow}–$${counterHigh} all-in.

That keeps us near $${(counterLow/miles).toFixed(2)}+ per loaded mile 
and leaves room after fuel (roughly $${net.toFixed(2)} net). 
Can you get me closer to that range?`;

    // final output
    addMessage(
`Pay: $${pay}
Miles: ${miles}
Deadhead: ${dead}
Fuel Cost: $${fuelCost.toFixed(2)}
Net Profit: $${net.toFixed(2)}
RPM: ${rpm.toFixed(2)}
Style: ${style}
Verdict: ${verdict}
Suggested counter: $${counterLow}–$${counterHigh}
Broker message: ${brokerMessage}`
    );
}
