document.getElementById("sendBtn").addEventListener("click", function () {
    const input = document.getElementById("userInput").value.trim();
    const output = document.getElementById("output");
    const truck = document.getElementById("truckSelect").value;

    if (!input) {
        output.innerHTML = "Please enter load info.";
        return;
    }

    const parts = input.split(" ");
    let pay = parseFloat(parts[0]);
    let miles = parseFloat(parts[1]);
    let deadhead = parseFloat(parts[2]) || 0;
    let fuelPrice = parseFloat(parts[3]) || 4.25;
    let mpg = parseFloat(parts[4]) || 7;
    let style = parts[5] ? parts[5].toLowerCase() : "normal";

    let totalMiles = miles + deadhead;
    let fuelCost = (totalMiles / mpg) * fuelPrice;
    let netProfit = pay - fuelCost;
    let rpm = pay / miles;

    let verdict = "";
    let suggestion = "";
    let brokerScript = "";

    if (style === "aggressive") {
        verdict = "🔥 Aggressive Mode";
        suggestion = "Ask for at least $50 more.";

        let counter = pay + 50;

        brokerScript =
            `Hi, this is dispatch for ${truck}.\n` +
            `${miles} loaded miles + ${deadhead} deadhead.\n` +
            `We are seeing fuel at ${fuelPrice} and ${mpg} MPG.\n` +
            `Can you get us to **$${counter}** on this?`;

    } else {
        if (rpm >= 2.2) verdict = "✅ Good Load";
        else if (rpm >= 1.8) verdict = "⚠️ Meh Load";
        else verdict = "❌ Weak Load";

        suggestion = "Normal mode: Ask for $25 more.";

        let counter = pay + 25;

        brokerScript =
            `Hi, this is dispatch for ${truck}.\n` +
            `${miles} miles + ${deadhead} deadhead.\n` +
            `Pay is $${pay}. Can you get closer to **$${counter}**?`;
    }

    output.innerHTML = `
        <strong>RESULTS:</strong><br><br>
        Pay: $${pay}<br>
        Miles: ${miles}<br>
        Deadhead: ${deadhead}<br>
        Total Miles: ${totalMiles}<br>
        Fuel Cost: $${fuelCost.toFixed(2)}<br>
        Net Profit: $${netProfit.toFixed(2)}<br>
        RPM: ${rpm.toFixed(2)}<br><br>

        Verdict: ${verdict}<br>
        Suggestion: ${suggestion}<br><br>

        <strong>Broker Script:</strong><br>
        ${brokerScript.replace(/\n/g, "<br>")}
    `;
});
