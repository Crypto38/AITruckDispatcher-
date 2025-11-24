document.getElementById("sendBtn").addEventListener("click", () => {

    const raw = document.getElementById("userInput").value.toLowerCase();
    const output = document.getElementById("output");
    const truck = document.getElementById("truckSelect").value;

    if (!raw.trim()) {
        output.innerHTML = "Enter load info.";
        return;
    }

    // extract ALL numbers in the order they appear
    const nums = raw.match(/[\d.]+/g)?.map(Number) || [];

    let pay       = nums[0] || 0;
    let miles     = nums[1] || 0;
    let deadhead  = nums[2] || 0;
    let fuel      = nums[3] || 0;
    let mpg       = nums[4] || 7;

    // choose style automatically
    let style = raw.includes("agg") ? "aggressive" : "normal";

    // calculations
    const totalMiles = miles + deadhead;
    const fuelCost = (totalMiles / mpg) * fuel;
    const net = pay - fuelCost;
    const rpm = miles ? pay / miles : 0;

    let verdict;
    let askPrice;
    let script;

    if (style === "aggressive") {
        verdict = "🔥 Aggressive Mode";
        askPrice = pay + 50;
        script =
`Hi, this is dispatch for ${truck}.
${miles} miles + ${deadhead} DH.
Fuel ~$${fuel}. We need $${askPrice}.`;
    } else {
        if (rpm >= 2.2) verdict = "✅ Good Load";
        else if (rpm >= 1.8) verdict = "⚠️ Mid Load";
        else verdict = "❌ Weak Load";

        askPrice = pay + 25;
        script =
`Hi, this is dispatch for ${truck}.
${miles} miles + ${deadhead} DH.
Fuel $${fuel}. Can you get us to $${askPrice}?`;
    }

    output.innerHTML = `
<strong>RESULTS</strong><br><br>
Pay: $${pay}<br>
Miles: ${miles}<br>
Deadhead: ${deadhead}<br>
Total Miles: ${totalMiles}<br>
Fuel Cost: $${fuelCost.toFixed(2)}<br>
Net Profit: $${net.toFixed(2)}<br>
RPM: ${rpm.toFixed(2)}<br><br>

Verdict: ${verdict}<br><br>

<strong>Broker Script:</strong><br>
${script.replace(/\n/g,"<br>")}
`;
});
