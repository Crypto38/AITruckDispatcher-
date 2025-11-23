function addMessage(text, sender) {
    const box = document.getElementById('chatbox');
    const div = document.createElement('div');
    div.className = 'msg ' + sender;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

const OPENING_LINES = [
    "Hello, I'm your AITruckDispatcher. Tell me about a load, lane, rate, or Amazon Relay plan.",
];

addMessage(OPENING_LINES[0], 'bot');

function basicReply(text) {
    const lower = text.toLowerCase();

    if (lower.includes('rpm') || lower.includes('rate')) {
        return "To calculate RPM: rate ÷ miles. Paste the load and I'll break it down.";
    }

    if (lower.includes('relay')) {
        return "Amazon Relay tip: Stay above 90% on-time, minimize deadhead, and accept roundtrips whenever possible.";
    }

    if (lower.includes('load')) {
        return "Paste the full load (pay, miles, deadhead) and I’ll analyze it for you.";
    }

    return "Got it. Tell me a load, lane, rate, or question about Amazon Relay.";
}

function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');

    const reply = basicReply(text);
    addMessage(reply, 'bot');

    input.value = "";
}

function analyzeLoad() {
    const pay = parseFloat(document.getElementById("pay").value);
    const miles = parseFloat(document.getElementById("miles").value);
    const deadhead = parseFloat(document.getElementById("deadhead").value);
    const fuel = parseFloat(document.getElementById("fuel").value);
    const mpg = parseFloat(document.getElementById("mpg").value);

    if (isNaN(pay) || isNaN(miles) || isNaN(deadhead) || isNaN(fuel) || isNaN(mpg)) {
        document.getElementById("analysis").textContent = "❗ Enter all values correctly.";
        return;
    }

    const totalMiles = miles + deadhead;
    const fuelUsed = totalMiles / mpg;
    const fuelCost = fuelUsed * fuel;
    const net = pay - fuelCost;
    const rpm = pay / miles;

    let strength = "Weak Load ❌";
    if (rpm >= 2.25) strength = "Strong Load 💰";
    if (rpm >= 2.75) strength = "🔥 Excellent Load";

    const result =
        `Pay: $${pay.toFixed(2)}
Loaded Miles: ${miles}
Deadhead Miles: ${deadhead}
Fuel Cost: $${fuelCost.toFixed(2)}
Net Profit: $${net.toFixed(2)}
RPM: $${rpm.toFixed(2)}

Verdict: ${strength}`;

    document.getElementById("analysis").textContent = result;
}
