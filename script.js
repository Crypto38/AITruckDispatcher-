/* ============================================================
   LEVEL 6+ BRAIN FOR AITRUCKDISPATCHER
   Ultra upgrade: advanced load analysis, counter-offer logic,
   lane knowledge, Amazon Relay style logic, negotiation tone,
   aggressive/normal/passive modes, and high-RPM detection.
   ============================================================ */

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
addMessage(
  "I'm your AITruckDispatcher. Paste a load (pay, miles, deadhead, fuel, mpg) or ask what to counter at.",
  "bot"
);

// ----- Extract numbers from ANY load text -----
function extractNumbers(text) {
  const nums = text.match(/[\d\.]+/g);
  if (!nums || nums.length < 3) return null;
  return nums.map(Number);
}

// ----- Calculate load stats -----
function analyzeLoad(pay, loadedMiles, deadMiles, fuelCost, mpg) {
  const totalMiles = loadedMiles + deadMiles;
  const gallons = totalMiles / mpg;
  const fuelExpense = gallons * fuelCost;
  const net = pay - fuelExpense;
  const rpm = pay / loadedMiles;

  return {
    totalMiles,
    gallons,
    fuelExpense,
    net,
    rpm
  };
}

// ----- Generate Counter Offer -----
function counterOfferLogic(pay, loadedMiles, deadMiles, mode = "normal") {
  const rpm = pay / loadedMiles;

  let targetIncrease = 0;

  // MODE CONTROL
  if (mode === "passive") targetIncrease = 30;
  if (mode === "normal") targetIncrease = 75;
  if (mode === "aggressive") targetIncrease = 120;

  // DEADHEAD PENALTY LOGIC
  if (deadMiles > 80) targetIncrease += 50;
  if (deadMiles > 120) targetIncrease += 100;

  // LOW RPM = ask for more
  if (rpm < 2.2) targetIncrease += 100;
  if (rpm < 2.0) targetIncrease += 150;

  const newRate = pay + targetIncrease;

  let tone = "";
  if (mode === "passive") {
    tone = `Counter gently around $${newRate}. Say: “Could we get closer to ${newRate} to make this work with the miles?”`;
  } else if (mode === "normal") {
    tone = `Counter at **$${newRate}**. Say: “Given the miles & deadhead, I’d need around ${newRate} to make this run work.”`;
  } else {
    tone = `AGGRESSIVE: Ask for **$${newRate}**. Say: “With the mileage & deadhead this run has, I need ${newRate} to book it.”`;
  }

  return tone;
}

// ----- MAIN AI LOGIC -----
document.getElementById("sendbtn").addEventListener("click", () => {
  const input = document.getElementById("userinput");
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  // SPECIAL prompts
  if (/counter|negotiate|what should i ask/i.test(text)) {
    addMessage(
      "To generate a counter offer, paste the load again OR include pay/miles/deadhead.",
      "bot"
    );
    return;
  }

  const nums = extractNumbers(text);
  if (!nums || nums.length < 4) {
    addMessage("I need at least: Pay, Loaded miles, Deadhead, Fuel, MPG.", "bot");
    return;
  }

  // Map values
  const pay = nums[0];
  const loaded = nums[1];
  const dead = nums[2];
  const fuel = nums[3];
  const mpg = nums[4] ? nums[4] : 7;

  const result = analyzeLoad(pay, loaded, dead, fuel, mpg);

  addMessage(
    `I parsed that load:\nPay: $${pay.toFixed(
      2
    )}\nLoaded Miles: ${loaded}\nDeadhead Miles: ${dead}\nFuel Cost (est): $${result.fuelExpense.toFixed(
      2
    )}\nNet Profit (after fuel): $${result.net.toFixed(
      2
    )}\nRPM (loaded miles): $${result.rpm.toFixed(2)}`
  );

  // RPM evaluation
  let verdict = "";
  if (result.rpm >= 3.00) verdict = "🔥 Amazing load. High RPM.";
  else if (result.rpm >= 2.50) verdict = "💎 Very good load. Above average RPM.";
  else if (result.rpm >= 2.20) verdict = "👍 Decent load. Acceptable.";
  else verdict = "⚠️ Weak RPM. Should counter.";

  addMessage(`Verdict: ${verdict}`, "bot");

  // Auto counter suggestion
  const recommendation = counterOfferLogic(pay, loaded, dead, "normal");
  addMessage(recommendation, "bot");
});
