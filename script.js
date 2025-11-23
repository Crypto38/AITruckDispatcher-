// ===== AITruckDispatcher v30 – Core Brain =====

// Grab elements
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Basic message helper
function addMessage(text, sender = "ai") {
  const div = document.createElement("div");
  div.className = `msg msg-${sender}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Intro line
addMessage(
  "AITruckDispatcher v30 loaded. Paste a load like: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 aggressive.",
  "ai"
);

// Handle send
function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("You: " + text, "user");
  userInput.value = "";

  const reply = analyzeText(text);
  addMessage(reply, "ai");
}

sendBtn.onclick = handleSend;
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSend();
});

// Parse + analyze the load text
function analyzeText(text) {
  // pull out all numbers
  const nums = text.match(/[\d.]+/g);

  if (!nums || nums.length < 4) {
    return (
      "I need at least 4 numbers: pay, miles, deadhead, fuel price. " +
      "Optional: mpg, style (normal/aggressive)."
    );
  }

  const pay = parseFloat(nums[0]);        // linehaul pay $
  const miles = parseFloat(nums[1]);      // loaded miles
  const dead = parseFloat(nums[2]);       // deadhead miles
  const fuelPrice = parseFloat(nums[3]);  // fuel cost per gallon $
  const mpg = nums[4] ? parseFloat(nums[4]) : 7; // default MPG 7

  // detect style
  let style = "NORMAL";
  if (/agg/i.test(text)) style = "AGGRESSIVE";
  else if (/norm/i.test(text)) style = "NORMAL";

  // ---- math ----
  const totalMiles = miles + dead;
  const gallons = totalMiles / mpg;
  const fuelCost = gallons * fuelPrice;
  const net = pay - fuelCost;
  const rpm = pay / miles;

  // verdict + target RPM
  let verdict = "";
  let emoji = "";
  let targetRpm;

  if (rpm >= 3.0) {
    emoji = "💎";
    verdict = "STRONG load.";
    targetRpm = style === "AGGRESSIVE" ? rpm + 0.05 : rpm; // squeeze a bit more
  } else if (rpm >= 2.5) {
    emoji = "✅";
    verdict = "Good load.";
    targetRpm = style === "AGGRESSIVE" ? 3.0 : 2.7;
  } else if (rpm >= 2.2) {
    emoji = "⚠️";
    verdict = "Borderline load.";
    targetRpm = style === "AGGRESSIVE" ? 2.7 : 2.5;
  } else {
    emoji = "🚫";
    verdict = "Weak load.";
    targetRpm = style === "AGGRESSIVE" ? 2.5 : 2.3;
  }

  const suggestedPay = targetRpm * miles;
  const diff = suggestedPay - pay;

  let diffText;
  if (diff > 25) {
    diffText = `Ask for about $${diff.toFixed(0)} more (target $${suggestedPay.toFixed(
      0
    )}).`;
  } else if (diff < -25) {
    diffText = `You're about $${Math.abs(
      diff
    ).toFixed(0)} above the target; still ok if truck needs to move.`;
  } else {
    diffText = "Pay is already close to target.";
  }

  // broker script
  const script =
    `Hi, this is [YOUR NAME] with [CARRIER]. Looking at your load around ${miles} loaded ` +
    `and ${dead} deadhead miles, with fuel near $${fuelPrice.toFixed(
      2
    )}/gal, $${pay.toFixed(
      0
    )} is a bit tight for us. To make this work in ${style.toLowerCase()} mode, ` +
    `we'd need to be closer to about $${suggestedPay.toFixed(
      0
    )} all in. Can you get me closer to that range?`;

  // final message
  const lines = [
    `Pay: $${pay.toFixed(2)}  Miles: ${miles}  Deadhead: ${dead}`,
    `Fuel: $${fuelPrice.toFixed(2)}/gal  MPG: ${mpg.toFixed(2)}  Total miles: ${totalMiles}`,
    `Fuel Cost: $${fuelCost.toFixed(2)}  Net Profit: $${net.toFixed(
      2
    )}  RPM (loaded): ${rpm.toFixed(2)}`,
    `Style: ${style}  Verdict: ${emoji} ${verdict}`,
    `Suggested counter: ~$${suggestedPay.toFixed(0)}. ${diffText}`,
    "",
    "Broker script (copy / tweak):",
    script,
  ];

  return lines.join("\n");
}
