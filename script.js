const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(msg, sender = "ai") {
    const div = document.createElement("div");
    div.textContent = (sender === "user" ? "You: " : "AI: ") + msg;
    div.style.margin = "6px 0";
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.onclick = () => {
    let text = userInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    userInput.value = "";

    let parsed = text.match(/(\d+)/g);
    if (!parsed || parsed.length < 4) {
        addMessage("Invalid format. Enter: pay miles deadhead fuel mpg(optional) lane(optional)");
        return;
    }

    let pay = parseFloat(parsed[0]);
    let miles = parseFloat(parsed[1]);
    let dead = parseFloat(parsed[2]);
    let fuel = parseFloat(parsed[3]);
    let mpg = parsed[4] ? parseFloat(parsed[4]) : 7;

    let fuelCost = ((miles + dead) / mpg) * fuel;
    let net = pay - fuelCost;
    let rpm = pay / miles;

    let verdict = "⚠ Weak — COUNTER.";
    if (rpm >= 3.00) verdict = "🔥 Amazing — BOOK IT!";
    else if (rpm >= 2.50) verdict = "💎 Strong — Take it.";
    else if (rpm >= 2.20) verdict = "👍 Decent — Negotiable.";

    addMessage(
        `Pay: $${pay}
Miles: ${miles}
Deadhead: ${dead}
Fuel Cost: $${fuelCost.toFixed(2)}
Net Profit: $${net.toFixed(2)}
RPM: ${rpm.toFixed(2)}
Verdict: ${verdict}`
    );
};
