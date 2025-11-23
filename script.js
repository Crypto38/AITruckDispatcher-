// ===== AITruckDispatcher v20 - Ultimate Load Brain =====

// grab elements
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn  = document.getElementById("sendBtn");

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
  "AITruckDispatcher v20 loaded. Paste a load like: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 aggressive from Atlanta to Chicago."
);

// send handler
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

// -------- Parse the text into numbers + options --------

function parseLoad(text) {
  // grab all numbers in order
  const nums = text.match(/[\d.]+/g) || [];

  if (nums.length < 3) {
    return { error: "I need at least: pay, loaded miles, deadhead miles. Example: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 aggressive." };
  }

  const pay    = parseFloat(nums[0]); // line haul pay
  const miles  = parseFloat(nums[1]); // loaded miles
  const dead   = parseFloat(nums[2]); // deadhead miles
  const fuel   = nums[3] ? parseFloat(nums[3]) : 4.00; // fuel price
  const mpg    = nums[4] ? parseFloat(nums[4]) : 7.0;  // truck mpg

  // style (normal/aggressive/safe)
  let style = "normal";
  if (/aggressive/i.test(text)) style = "aggressive";
  if (/safe|conservative/i.test(text)) style = "safe";

  // rough lane text (everything after 'from')
  let lane = "";
  const fromIndex = text.toLowerCase().indexOf("from ");
  if (fromIndex !== -1) {
    lane = text.substring(fromIndex).trim();
  }

  return { pay, miles, dead, fuel, mpg, style, lane };
}

// --------- Do the math & decision logic ---------

function analyzeLoad({ pay, miles, dead, fuel, mpg, style }) {
  const totalMiles = miles + dead;
  const fuelGallons = totalMiles / mpg;
  const fuelCost = fuelGallons * fuel;
  const net = pay - fuelCost;
  const rpm = pay / miles;

  // verdict + action
  let verdict = "";
  let action = "";

  if (rpm >= 3.2) {
    verdict = "🚀 Killer Load.";
    action  = "You can TAKE it or counter slightly higher.";
  } else if (rpm >= 2.8) {
    verdict = "💎 Strong Load.";
    action  = "Good to TAKE or counter a little higher.";
  } else if (rpm >= 2.5) {
    verdict = "✅ Solid Load.";
    action  = "COUNTER a bit higher and see if they move.";
  } else if (rpm >= 2.2) {
    verdict = "⚠ Weak Load.";
    action  = "COUNTER hard. Only take if truck is stuck.";
  } else {
    verdict = "❌ Trash RPM.";
    action  = "SKIP if possible. This is donation work.";
  }

  // target RPM based on style
  let targetRPM;
  if (style === "aggressive") {
    targetRPM = 3.1;
  } else if (style === "safe") {
    targetRPM = 2.8;
  } else {
    // normal
    targetRPM = 3.0;
  }

  const lowTargetRPM = targetRPM - 0.1;
  const highTargetRPM = targetRPM + 0.1;

  const lowPay  = roundTo10(lowTargetRPM  * miles);
  const highPay = roundTo10(highTargetRPM * miles);

  return {
    totalMiles,
    fuelGallons,
    fuelCost,
    net,
    rpm,
    verdict,
    action,
    style,
    lowPay,
    highPay,
  };
}

function roundTo10(x) {
  return Math.round(x / 10) * 10;
}

// --------- Build broker message text ---------

function buildBrokerMessage(info, parsed) {
  const { pay, miles, dead, fuel, mpg, style, lane } = parsed;
  const { lowPay, highPay, rpm, net } = info;

  const styleLabel =
    style === "aggressive" ? "aggressive"
    : style === "safe"     ? "conservative"
    : "normal";

  const laneText = lane || "(route not specified)";

  return (
`Broker message (copy & tweak):

"Hi, this is [YOUR NAME] with [CARRIER]. Looking at your load ${laneText}.
For about ${miles} loaded and ${dead} deadhead at fuel around $${fuel.toFixed(2)}/gal and truck mpg around ${mpg}, $${pay.toFixed(
      2
    )} is a bit tight for us.

To make this work in a ${styleLabel} way and still run it profitably, we’d need to be closer to about $${lowPay.toFixed(
      0
    )}–$${highPay.toFixed(
      0
    )} all-in. 

That keeps us near $${rpm.toFixed(
      2
    )}+ per loaded mile and leaves some room after fuel (roughly $${net.toFixed(
      2
    )} net). 

Can you get me closer to that range?"`
  );
}

// ------------- Main handler ----------------

function handleLoadText(text) {
  const parsed = parseLoad(text);
  if (parsed.error) {
    addMessage(parsed.error);
    return;
  }

  const info = analyzeLoad(parsed);

  // summary line
  addMessage(
    `Pay: $${parsed.pay.toFixed(2)} | Miles: ${parsed.miles} | Deadhead: ${parsed.dead} | Fuel: $${parsed.fuel.toFixed(
      2
    )} | MPG: ${parsed.mpg.toFixed(2)}`
  );

  addMessage(
    `Fuel Cost: $${info.fuelCost.toFixed(2)} | Net Profit (est): $${info.net.toFixed(
      2
    )} | RPM (loaded): $${info.rpm.toFixed(2)}`
  );

  addMessage(
    `${info.verdict} Style: ${parsed.style.toUpperCase()}. Suggested counter: around $${info.lowPay.toFixed(
      0
    )}–$${info.highPay.toFixed(0)}. Action: ${info.action}`
  );

  const brokerText = buildBrokerMessage(info, parsed);
  addMessage(brokerText);
}
