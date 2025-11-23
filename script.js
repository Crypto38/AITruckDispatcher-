/* === LEVEL 6 AI BRAIN FOR AITRUCKDISPATCHER === */

/* Chatbox UI helper */
function addMessage(text, sender = "bot") {
    const box = document.getElementById("chat-box");
    if (!box) return;
    const div = document.createElement("div");
    div.className = "msg " + sender;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

/* Opening line */
addMessage("I'm your AITruckDispatcher. Paste a load (pay, miles, deadhead, fuel, mpg) or ask what to counter at.");

/* Parse numbers safely */
function readNum(text) {
    const n = parseFloat(text);
    return isNaN(n) ? 0 : n;
}

/* Extract structured load info */
function parseLoad(str) {
    const pay = parseFloat(str.match(/(\d+\.?\d*)\s*pay/i)?.[1] || 0);
    const miles = parseFloat(str.match(/(\d+\.?\d*)\s*miles/i)?.[1] || 0);
    const dead = parseFloat(str.match(/(\d+\.?\d*)\s*deadhead/i)?.[1] || 0);
    const fuel = parseFloat(str.match(/fuel\s*(\d+\.?\d*)/i)?.[1] || 4.00);
    const mpg = parseFloat(str.match(/mpg\s*(\d+\.?\d*)/i)?.[1] || 7);

    const laneMatch = str.match(/from\s+([A-Za-z ]+)\s+to\s+([A-Za-z ]+)/i);
    const lane = laneMatch ? {
        origin: laneMatch[1].trim(),
        dest: laneMatch[2].trim()
    } : null;

    const strategyMatch = str.match(/(aggressive|defensive|normal)/i);
    const strategy = strategyMatch ? strategyMatch[1].toLowerCase() : "normal";

    return { pay, miles, dead, fuel, mpg, lane, strategy };
}

/* Lane memory storage */
let LANE_HISTORY = [];

/* Fuel cost calculator */
function fuelCost(totalMiles, mpg, fuelPrice) {
    if (mpg <= 0) return 0;
    return (totalMiles / mpg) * fuelPrice;
}

/* Strategy-based counter */
function strategyCounter(rpm, currentPay) {
    if (rpm >= 3.2) return currentPay; // already excellent

    if (rpm < 2.0) return currentPay + 200;
    if (rpm < 2.5) return currentPay + 150;
    if (rpm < 2.8) return currentPay + 100;
    return currentPay + 60;
}

/* Handle user message */
function sendChat() {
    const input = document.getElementById("user-input");
    if (!input.value.trim()) return;

    const text = input.value.trim();
    addMessage(text, "user");

    const data = parseLoad(text);

    if (data.pay > 0 && data.miles > 0) {
        const totalMiles = data.miles + data.dead;
        const fuel = fuelCost(totalMiles, data.mpg, data.fuel);
        const net = data.pay - fuel;
        const rpm = data.miles > 0 ? (data.pay / data.miles).toFixed(2) : 0;

        /* Save lane history */
        if (data.lane) {
            LANE_HISTORY.push({
                lane: `${data.lane.origin} -> ${data.lane.dest}`,
                rpm: parseFloat(rpm)
            });
        }

        addMessage(
            `I parsed that load and ran the numbers:\n` +
            `Pay: $${data.pay.toFixed(2)} Loaded Miles: ${data.miles}\n` +
            `Deadhead Miles: ${data.dead} Total Miles: ${totalMiles}\n` +
            `Fuel Cost (est): $${fuel.toFixed(2)} Net Profit (after fuel): $${net.toFixed(2)}\n` +
            `RPM (loaded miles): ${rpm}\n` +
            `Verdict: ${rpm >= 3 ? "🔥 Strong lane." : rpm >= 2.5 ? "✔ Solid." : "⚠ Weak lane."}`
        );

        /* Strategy logic */
        if (data.strategy) {
            let counter = strategyCounter(rpm, data.pay);

            if (data.strategy === "aggressive") {
                counter += 50;
            } else if (data.strategy === "defensive") {
                counter -= 25;
            }

            addMessage(
                `Strategy mode: **${data.strategy.toUpperCase()}**.\n` +
                `Suggested counter-offer: $${counter} total pay.\n` +
                `Phrase you can say: "Based on miles and deadhead, I’d need closer to $${counter} to make this lane work."`
            );
        }

        /* Lane memory output */
        if (data.lane) {
            const laneName = `${data.lane.origin} -> ${data.lane.dest}`;
            const history = LANE_HISTORY.filter(x => x.lane === laneName);

            if (history.length > 1) {
                const avg = (history.reduce((a, b) => a + b.rpm, 0) / history.length).toFixed(2);
                addMessage(
                    `Lane memory: ${laneName}\n` +
                    `Past RPMs: ${history.map(h => h.rpm).join(", ")}\n` +
                    `Average RPM: ${avg}`
                );
            }
        }
    } else {
        addMessage("I couldn’t detect a load. Try something like: '1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 from Atlanta to Chicago aggressive'");
    }

    input.value = "";
}
