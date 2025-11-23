/* ==========================================================
   LEVEL 6 BRAIN FOR AITRUCKDISPATCHER
   Full upgrade: smarter load analysis, counter offers,
   lane knowledge, route logic, Amazon Relay strategy,
   aggressive-mode negotiation, and high-RPM detection.
   ========================================================== */


// ----- Chat UI helper -----
function addMessage(text, sender = "bot") {
    const box = document.getElementById("chatbox");
    if (!box) return;
    const div = document.createElement("div");
    div.className = "msg " + sender;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}


// ----- Opening line -----
addMessage("I'm your AITruckDispatcher. Paste a load (pay, miles, deadhead, fuel, mpg) or ask what to counter at.");


// ----- Extract numbers from ANY load text -----
function extractNumbers(text) {
    const nums = text.match(/[\d\.]+/g);
    if (!nums) return null;
    return nums.map(Number);
}


// ----- Main load parser -----
function analyzeLoad(text) {
    const nums = extractNumbers(text);
    if (!nums || nums.length < 4) {
        return "I need: pay, loaded miles, deadhead miles, fuel price, mpg.";
    }

    let [pay, loaded, deadhead, fuelCost, mpg] = nums;

    if (!mpg) mpg = 7;
    const totalMiles = loaded + deadhead;
    const gallons = totalMiles / mpg;
    const fuelExp = gallons * fuelCost;
    const net = pay - fuelExp;
    const rpm = pay / loaded;

    let verdict = "";
    if (rpm >= 3.00) verdict = "🔥 Excellent RPM. Strong load.";
    else if (rpm >= 2.50) verdict = "✅ Solid load. Above average RPM.";
    else verdict = "⚠️ Low RPM. Only take if it positions you well.";

    return (
        `Pay: $${pay.toFixed(2)} ` +
        `Loaded Miles: ${loaded} ` +
        `Deadhead Miles: ${deadhead} ` +
        `Total Miles: ${totalMiles} ` +
        `Fuel Cost (est): $${fuelExp.toFixed(2)} ` +
        `Net Profit (after fuel): $${net.toFixed(2)} ` +
        `RPM (loaded miles): $${rpm.toFixed(2)} ` +
        `Verdict: ${verdict}`
    );
}


// ----- Counter Offer Calculator -----
function counterSuggestion(text) {
    const nums = extractNumbers(text);
    if (!nums || nums.length < 3) return "I need pay + loaded miles + deadhead miles.";

    let [pay, loaded, deadhead] = nums;
    const rpm = pay / loaded;

    let target = 0;

    if (rpm < 2.0) target = loaded * 3.0;
    else if (rpm < 2.50) target = loaded * 2.85;
    else if (rpm < 2.80) target = loaded * 3.00;
    else target = loaded * 3.10;

    const ask = Math.round(target);

    return (
        `Based on this load’s RPM, you should counter around **$${ask}**. ` +
        `Start slightly high so you can “meet in the middle.”`
    );
}


// ----- Route logic -----
function routeKnowledge(text) {
    text = text.toLowerCase();

    if (text.includes("atlanta") && text.includes("chicago")) {
        return "Atlanta → Chicago lanes often pay $2.60–$3.10 RPM depending on season. Avoid Chicago suburbs unless delivery times are flexible. Counter high.";
    }

    if (text.includes("nyc") || text.includes("new york")) {
        return "NYC lanes require higher pay due to tolls + traffic. Minimum RPM should be $3.25+.";
    }

    if (text.includes("texas")) {
        return "Texas outbound loads pay weaker. If it's going INTO Texas, negotiate high leaving it.";
    }

    return null;
}


// ----- Aggressive Negotiation Mode -----
function aggressiveMode(text) {
    return (
        "AGGRESSIVE MODE ENABLED:\n" +
        "• Start very high: ask +$150–$250 over your target.\n" +
        "• Mention deadhead + fuel cost.\n" +
        "• Say: “For those miles, this load must be at least ___.”\n" +
        "• Don’t accept low-ball counters—make THEM chase YOU."
    );
}


// ----- MASTER RESPONDER -----
function respond(text) {

    if (text.toLowerCase().includes("aggressive")) {
        return aggressiveMode(text);
    }

    if (text.toLowerCase().includes("counter")) {
        return counterSuggestion(text);
    }

    const lane = routeKnowledge(text);
    if (lane) return lane + "\n\n" + analyzeLoad(text);

    return analyzeLoad(text);
}


// ----- SEND BUTTON -----
function sendChat() {
    const input = document.getElementById("user-input").value.trim();
    if (!input) return;
    addMessage(input, "user");
    const response = respond(input);
    addMessage(response, "bot");
}
