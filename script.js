document.getElementById("sendBtn").addEventListener("click", () => {
    const raw = document.getElementById("userInput").value.toLowerCase();
    const output = document.getElementById("output");
    const truck = document.getElementById("truckSelect").value;

    if (!raw.trim()) {
        output.innerHTML = "Please enter load info.";
        return;
    }

    // Extract all numbers in the order they appear
    const nums = raw.match(/[\d.]+/g)?.map(Number) || [];

    let pay = nums[0] || 0;
    let miles = nums[1] || 0;
    let deadhead = nums[2] || 0;
    let fuelPrice = nums[3] || 0;
    let mpg = nums[4] || 7; // default 7 MPG

    // Detect style automatically
    let style = "normal";
    if (raw.includes("agg")) style = "aggressive";
    if (raw.includes("normal")) style = "normal";

    // Calculations
    let totalMiles = miles + deadhead;
    let fuelCost = (totalMiles / mpg) * fuelPrice;
    let netProfit = pay - fuelCost;
    let rpm = miles > 0 ? pay / miles : 0;

    let verdict = "";
    let suggestion = "";
    let brokerScript = "";

    if (style === "aggressive") {
        verdict = "🔥 Aggressive Mode";
        suggestion = "Ask for at least $" + (pay + 50);

        let counter = pay + 50;

        brokerScript =
`Hi, this is dispatch for ${truck}.
For this load: ${miles} miles + ${deadhead} deadhead.
Fuel is around $${fuelPrice}. We need about $${counter} all-in.
Can you get us closer to that?`;
    } else {
        if (rpm >= 2.2) verdict = "✅ Good load";
        else if (rpm >= 1.8) verdict = "⚠️ Mid load";
        else verdict = "❌ Weak load";

        suggestion = "Normal mode: Ask for around $" + (pay + 25);

        let counter = pay + 25;

        brokerScript =
`Hi, this is dispatch for ${truck}.
Looking at ${miles} miles + ${deadhead} deadhead.
Fuel is $${fuelPrice}. Pay is $${pay}. Can you get closer to $${counter}?`;
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
${brokerScript.replace(/\n/g, "<br>")}
`;
});
