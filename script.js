// =======================================
// LEVEL 5 BRAIN FOR AITruckDispatcher
// =======================================

// -------- Chat UI helper --------
function addMessage(text, sender) {
    const box = document.getElementById('chatbox');
    if (!box) return;
    const div = document.createElement('div');
    div.className = 'msg ' + sender;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// -------- Opening lines --------
addMessage("Hello, I'm your AITruckDispatcher. Tell me about a load, lane, rate, or Amazon Relay plan.", 'bot');

// -------- Number helper --------
const toNum = (x) => parseFloat(x) || 0;

// -------- Extract load from messy text --------
function parseLoad(text) {
    const numbers = text.match(/[\d.]+/g) || [];

    if (numbers.length < 2) {
        return null;
    }

    // Best guess pattern:
    // Pay, loaded miles, deadhead miles, fuel cost, mpg
    return {
        pay: toNum(numbers[0]),
        loaded: toNum(numbers[1]),
        deadhead: toNum(numbers[2] || 0),
        fuel: toNum(numbers[3] || 4.25),
        mpg: toNum(numbers[4] || 7)
    };
}

// -------- Analyze load details --------
function analyze(pay, loaded, deadhead, fuel, mpg) {
    const totalMiles = loaded + deadhead;
    const gallons = totalMiles / mpg;
    const fuelCost = gallons * fuel;
    const rpm = loaded > 0 ? (pay / loaded).toFixed(2) : "0.00";
    const profit = (pay - fuelCost).toFixed(2);

    let verdict = "";
    if (rpm >= 3.00) verdict = "🔥 Excellent load. Strong RPM.";
    else if (rpm >= 2.50) verdict = "✅ Solid load. Above average RPM.";
    else if (rpm >= 2.00) verdict = "⚠️ Borderline. Negotiate higher.";
    else verdict = "❌ Weak load. Avoid unless no options.";

    return {
        pay,
        loaded,
        deadhead,
        fuelCost: fuelCost.toFixed(2),
        profit,
        rpm,
        verdict
    };
}

// -------- Respond to counter-offer question --------
function negotiationAdvice(result) {
    const rpm = parseFloat(result.rpm);

    if (rpm >= 3.00) {
        return "That load is already very strong (RPM near or above 3). Counter $50 higher just to see if they'll take it, but you’re already winning.";
    }
    if (rpm >= 2.50) {
        return "Counter about $75 higher. This usually brings RPM close to 3.0 and still lands you in the sweet zone.";
    }
    if (rpm >= 2.00) {
        return "You NEED to counter higher. I'd push $150+ more to bring RPM into the safe zone.";
    }
    return "This load is weak. Counter very high ($200–$300 more) or avoid it entirely.";
}

// -------- On Send --------
function sendMessage() {
    const input = document.getElementById('userInput');
    let text = input.value.trim();
    if (text === "") return;

    addMessage(text, 'user');
    input.value = "";

    // Check if asking negotiation question
    if (text.toLowerCase().includes("counter")) {
        if (!window.lastResult) {
            addMessage("Give me a load first so I can calculate RPM and advise a counter offer.", "bot");
            return;
        }
        const advice = negotiationAdvice(window.lastResult);
        addMessage(advice, "bot");
        return;
    }

    // Try to parse load
    const load = parseLoad(text);

    if (!load || load.pay === 0 || load.loaded === 0) {
        addMessage("Give me a load like: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7", 'bot');
        return;
    }

    const result = analyze(load.pay, load.loaded, load.deadhead, load.fuel, load.mpg);
    window.lastResult = result;

    const msg = `I parsed that load and ran the numbers:
Pay: $${result.pay}
Loaded Miles: ${result.loaded}
Deadhead Miles: ${result.deadhead}
Fuel Cost: $${result.fuelCost}
Net Profit: $${result.profit}
RPM: $${result.rpm}
Verdict: ${result.verdict}
If you want negotiation help, ask: "What should I counter at?"`;

    addMessage(msg, "bot");
}

// -------- Level 3 Calculator still works --------
function analyzeLoad() {
    const pay = toNum(document.getElementById('pay').value);
    const miles = toNum(document.getElementById('miles').value);
    const dead = toNum(document.getElementById('deadhead').value);
    const fuel = toNum(document.getElementById('fuel').value);
    const mpg = toNum(document.getElementById('mpg').value);

    const result = analyze(pay, miles, dead, fuel, mpg);

    document.getElementById('analysis').textContent =
        `Pay: $${result.pay}
Loaded Miles: ${result.loaded}
Deadhead Miles: ${result.deadhead}
Fuel Cost: $${result.fuelCost}
Net Profit: $${result.profit}
RPM: $${result.rpm}
Verdict: ${result.verdict}`;
}
