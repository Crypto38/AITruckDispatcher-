// ===== AITruckDispatcher v20 - FINAL CLEAN VERSION =====

// connect UI
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// display message
function addMessage(text, sender = "ai") {
    const div = document.createElement("div");
    div.className = sender === "user" ? "msg-user" : "msg-ai";
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// initial message
addMessage("AITruckDispatcher v20 loaded. Enter: pay miles deadhead fuel mpg(optional) style(optional).");

// send handler
function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;
    addMessage("You: " + text, "user");
    userInput.value = "";
    analyzeLoad(text);
}

sendBtn.onclick = handleSend;
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
});

// MAIN LOGIC
function analyzeLoad(text) {
    const nums = text.match(/[\d.]+/g);
    if (!nums || nums.length < 4) {
        addMessage("ERROR: Format must be: pay miles deadhead fuel mpg(optional) style(optional)");
        return;
    }

    const pay       = parseFloat(nums[0]);
    const miles     = parseFloat(nums[1]);
    const dead      = parseFloat(nums[2]);
    const fuelPrice = parseFloat(nums[3]);
    const mpg       = nums[4] ? parseFloat(nums[4]) : 7;

    let style = "NORMAL";
    const lower = text.toLowerCase();
    if (lower.includes("aggressive")) style = "AGGRESSIVE";

    const totalMiles = miles + dead;
    const fuelCost   = (totalMiles / mpg) * fuelPrice;
    const net        = pay - fuelCost;
    const rpm        = pay / miles;

    let verdict = "";
    if (rpm >= 3.0) verdict = "🔥 AMAZING LOAD";
    else if (rpm >= 2.5) verdict = "💎 STRONG LOAD";
    else if (rpm >= 2.2) verdict = "👍 DECENT LOAD";
    else verdict = "⚠️ WEAK — COUNTER";

    let counterLow, counterHigh;
    if (style === "AGGRESSIVE") {
        counterLow  = Math.round((pay + 60) / 10) * 10;
        counterHigh = Math.round((pay + 110) / 10) * 10;
    } else {
        counterLow  = Math.round((pay + 20) / 10) * 10;
        counterHigh = Math.round((pay + 70) / 10) * 10;
    }

    const brokerMessage =
`"Hi, this is [YOUR NAME] with [CARRIER]. For around ${miles} loaded and ${dead} deadhead,
at fuel about $${fuelPrice}/gal and mpg around ${mpg}, $${pay} is tight.

To run this profitably in ${style.toLowerCase()} mode, we’d need $${counterLow}–$${counterHigh} all-in.

Can you get me closer to that range?"`;

    addMessage(
`Pay: $${pay}
Miles: ${miles} | Deadhead: ${dead}
Fuel Cost: $${fuelCost.toFixed(2)}
Net Profit: $${net.toFixed(2)}
RPM: ${rpm.toFixed(2)}
Style: ${style}
Verdict: ${verdict}
Suggested counter: $${counterLow}–$${counterHigh}

Broker message:
${brokerMessage}`
    );
}
