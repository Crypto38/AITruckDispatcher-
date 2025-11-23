document.getElementById("sendBtn").addEventListener("click", () => {
    const input = document.getElementById("userInput").value.trim();
    const output = document.getElementById("output");
    const truck = document.getElementById("truckSelect").value;

    if (!input) {
        output.innerHTML = "Please enter load details.";
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

    // Style logic
    if (style === "aggressive") {
        if (rpm >= 2.5) verdict = "🔥 STRONG LOAD";
        else if (rpm >= 2.0) verdict = "⚠️ OK load";
        else verdict = "❌ Weak load";

        let counter = pay + 50;
        suggestion = `Aggressive mode: Ask for around $${counter}.`;

        brokerScript =
            `Hi, this is dispatch for ${truck}. Looking at your load ` +
            `(${miles} miles, ${deadhead} deadhead). At fuel near $${fuelPrice}/gal ` +
            `${pay} is a little tight. For aggressive mode we need about $${counter} all-in. ` +
            `Can you get us closer to that range?`;
    } else {
        if (rpm >= 2.2) verdict = "✅ Good load";
        else if (rpm >= 1.8) verdict = "⚠️ Borderline";
        else verdict = "❌ Weak load";

        let counter = pay + 25;
        suggestion = `Normal mode: Ask for around $${counter}.`;

        brokerScript =
            `Hi, this is dispatch for ${truck}. Reviewing your load ` +
            `${miles} miles + ${deadhead} deadhead. With fuel costs we would need around $${counter} all-in. ` +
            `Can you get closer to that range?`;
    }

    // Output
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
        ${brokerScript}
    `;
});
