    let fuelPrice = nums[3] || 0;
    let mpg       = nums[4] || 0;

    // If missing, use truck defaults
    if (!fuelPrice) fuelPrice = profile.fuelPrice;
    if (!mpg) mpg = profile.mpg;

    // ----------- DETECT STYLE -----------

    const lower = raw.toLowerCase();
    let style = "normal";

    if (lower.includes("agg")) style = "aggressive";
    if (lower.includes("normal")) style = "normal";

    // ----------- CALCULATIONS -----------
    const totalMiles = miles + deadhead;
    const fuelCost = mpg > 0 ? (totalMiles / mpg) * fuelPrice : 0;
    const netProfit = pay - fuelCost;
    const rpm = miles > 0 ? pay / miles : 0;

    // ----------- VERDICT / SUGGESTION / SCRIPT -----------

    let verdict = "";
    let suggestion = "";
    let brokerScript = "";

    if (style === "aggressive") {
        verdict = "🔥 Aggressive Mode";
        suggestion = "Ask for at least $50 more.";
        const counter = pay + 50;

        brokerScript =
            "Hi, this is dispatch for " + truckName + ".\n" +
            "For this load: " + miles + " miles + " + deadhead + " deadhead.\n" +
            "Fuel is around $" + fuelPrice.toFixed(2) + ".\n" +
            "We need about $" + counter.toFixed(0) + " all-in. Can you get us closer?";
    } 
    else {
        if (rpm >= 2.2) verdict = "✅ Good Load";
        else if (rpm >= 1.8) verdict = "⚠️ Borderline Load";
