// ===== AITruckDispatcher v10 (FINAL WORKING VERSION) =====

// get required elements
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// add messages into chat
function addMessage(text, sender = "ai") {
    const div = document.createElement("div");
    div.className = sender === "user" ? "msg-user" : "msg-ai";
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// opening message
addMessage("AITruckDispatcher v10 loaded. Paste a load with pay, miles, deadhead, fuel price, optional mpg, and style (normal/aggressive).");

// send button handler
function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage("You: " + text, "user");
    userInput.value = "";

    handleLoadText(text);
}

sendBtn.onclick = handleSend;

// allow Enter key to send
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
});

// ===== MAIN LOAD PARSER =====

function handleLoadText(text) {
    const nums = text.match(/(\d+(\.\d+)?)/g);
    if (!nums || nums.length < 4) {
        addMessage("Invalid format. Enter: pay miles deadhead fuel [mpg] [style]");
        return;
    }

    let pay = parseFloat(nums[0]);
    let miles = parseFloat(nums[1]);
    let dead = parseFloat(nums[2]);
    let fuelPrice = parseFloat(nums[3]);
    let mpg = nums[4] ? parseFloat(nums[4]) : 7;

    // detect style (normal/aggressive)
    let style = "normal";
    if (/aggressive/i.test(text)) style = "aggressive";

    // calculations
    let totalMiles = miles + dead;
    let fuelCost = (totalMiles / mpg) * fuelPrice;
    let net = pay - fuelCost;
    let rpm = pay / miles;

    // determine verdict
    let verdict = "";
    if (rpm >= 3.00) verdict = "🔥 Amazing Load!";
    else if (rpm >= 2.50) verdict = "💎 Strong Load.";
    else if (rpm >= 2.20) verdict = "👍 Decent Load.";
    else verdict = "⚠️ Weak RPM. COUNTER.";

    // if aggressive style apply suggestion
    if (style === "aggressive") {
        verdict += " (Aggressive Mode: Ask for $150–$300 more.)";
    }

    // output result
    addMessage(
        `Pay: $${pay}
Miles: ${miles}
Deadhead: ${dead}
Fuel Cost: $${fuelCost.toFixed(2)}
Net Profit: $${net.toFixed(2)}
RPM: ${rpm.toFixed(2)}
Verdict: ${verdict}`
    );
}
