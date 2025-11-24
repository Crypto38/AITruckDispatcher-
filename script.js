// AI TruckDispatcher v30 - FULL JS (10 TRUCKS + SMART PARSER)

document.getElementById("sendBtn").addEventListener("click", () => {
    
    const raw = document.getElementById("userInput").value;
    const output = document.getElementById("output");
    const truckSelect = document.getElementById("truckSelect");

    if (!raw.trim()) {
        output.innerHTML = "Please enter load details.";
        return;
    }

    // ----------- TRUCK PROFILES (10 TRUCKS) -----------
    const truckProfiles = {
        "Truck 1":  { mpg: 7.0, fuelPrice: 4.25 },
        "Truck 2":  { mpg: 6.5, fuelPrice: 4.10 },
        "Truck 3":  { mpg: 8.0, fuelPrice: 4.50 },
        "Truck 4":  { mpg: 7.2, fuelPrice: 4.20 },
        "Truck 5":  { mpg: 6.8, fuelPrice: 4.18 },
        "Truck 6":  { mpg: 7.5, fuelPrice: 4.30 },
        "Truck 7":  { mpg: 6.9, fuelPrice: 4.40 },
        "Truck 8":  { mpg: 7.8, fuelPrice: 4.35 },
        "Truck 9":  { mpg: 6.7, fuelPrice: 4.15 },
        "Truck 10": { mpg: 8.1, fuelPrice: 4.55 }
    };

    const truckName = truckSelect.value;
    const profile = truckProfiles[truckName];

    // ----------- EXTRACT NUMBERS IN ORDER -----------
    const nums = raw.match(/[\d.]+/g)?.map(Number) || [];

    let pay       = nums[0] || 0;
    let miles     = nums[1] || 0;
    let deadhead  = nums[2] || 0;
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
