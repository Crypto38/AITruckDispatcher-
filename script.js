// ===== AITruckDispatcher v10 – Simple Smart Brain =====

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// add a message into the chat window
function addMessage(text, sender = "ai") {
  const div = document.createElement("div");
  div.className = sender === "user" ? "msg user" : "msg ai";
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// opening line
addMessage(
  "AITruckDispatcher v10 loaded. Paste a load with pay, miles, deadhead, fuel price, optional mpg, and style (normal/aggressive)."
);

// handle send button / enter key
function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("You: " + text, "user");
  userInput.value = "";

  handleLoadText(text);
}

sendBtn.onclick = handleSend;
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSend();
});

// core logic: parse, analyze, respond
function handleLoadText(text) {
  // grab all numbers in the text
  const nums = text.match(/[\d.]+/g);

  if (!nums || nums.length < 4) {
    addMessage(
      "I need at least pay, loaded miles, deadhead miles, and fuel price.\nExample: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 aggressive"
    );
    return;
  }

  const pay = parseFloat(nums[0]);          // line haul pay $
  const loaded = parseFloat(nums[1]);       // loaded miles
  const dead = parseFloat(nums[2]);         // deadhead miles
  const fuelPrice = parseFloat(nums[3]);    // $ / gallon
  const mpg = nums[4] ? parseFloat(nums[4]) : 7; // default 7 mpg if missing

  // basic safety
  if (!isFinite(pay) || !isFinite(loaded) || loaded <= 0) {
    addMessage("That load looks invalid. Check that pay and loaded miles are correct.");
    return;
  }

  // fuel, net, rpm
  const totalMiles = loaded + dead;
  const gallons = mpg > 0 ? totalMiles / mpg : 0;
  const fuelCost = gallons * fuelPrice;
  const net = pay - fuelCost;
  const rpm = pay / loaded;

  // verdict based on RPM
  let verdict;
  if (rpm >= 3.0) {
    verdict = "🔥 Excellent RPM. Take it or counter slightly higher.";
  } else if (rpm >= 2.5) {
    verdict = "💎 Strong load. Good for most lanes.";
  } else if (rpm >= 2.2) {
    verdict = "👍 Decent. Okay if it positions you in a better market.";
  } else {
    verdict = "⚠️ Weak RPM. Try to counter or skip if possible.";
  }

  // style: aggressive or normal in the text
  const lower = text.toLowerCase();
  const aggressive = lower.includes("aggressive");
  const targetRpm = aggressive ? 3.0 : 2.7;

  let counterText;
  if (rpm >= targetRpm) {
    counterText =
      "Rate is already near target. You can still ask for +$50 to +$100 to see if they move.";
  } else {
    const targetPay = targetRpm * loaded;
    const extra = Math.max(0, Math.round(targetPay - pay));
    const ask = Math.round(pay + extra);
    counterText = `I'd counter around $${ask} total (about +$${extra} more) to be near $${targetRpm.toFixed(
      2
    )}/mile.`;
  }

  // reply message
  const reply =
    `I broke down that load:\n` +
    `Pay: $${pay.toFixed(2)}\n` +
    `Loaded Miles: ${loaded}\n` +
    `Deadhead Miles: ${dead}\n` +
    `Fuel Price: $${fuelPrice.toFixed(2)}/gal\n` +
    `MPG: ${mpg.toFixed(2)}\n` +
    `Estimated Fuel Cost: $${fuelCost.toFixed(2)}\n` +
    `Net (after fuel): $${net.toFixed(2)}\n` +
    `RPM (loaded miles): $${rpm.toFixed(2)}/mile\n\n` +
    `Verdict: ${verdict}\n` +
    `Counter suggestion: ${counterText}`;

  addMessage(reply, "ai");
}
