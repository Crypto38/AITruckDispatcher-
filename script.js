function addMessage(text, sender) {
  const box = document.getElementById("chatbox");
  const div = document.createElement("div");
  div.className = "msg " + sender;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

addMessage("I’m AITruckDispatcher. Tell me a load or lane and I’ll help you think like a dispatcher.", "bot");

function basicReply(text) {
  const lower = text.toLowerCase();

  if (lower.includes("rpm") || lower.includes("rate per mile")) {
    return "To check RPM: total pay ÷ (loaded miles + deadhead). Over $2.50/mi is strong on short lanes, under ~$1.80 is usually weak.";
  }

  if (lower.includes("amazon")) {
    return "On Amazon Relay: protect your score, avoid last-minute cancels, and chain good short loads into a strong daily total.";
  }

  if (lower.includes("deadhead")) {
    return "Try to keep deadhead under ~15–20% of loaded miles. If you must deadhead, do it into a strong freight area, not a dead zone.";
  }

  if (lower.includes("negotiate") || lower.includes("counter")) {
    return "Simple script: 'Thanks for the offer. For these miles we’d need $___ to make this work. Can you get closer to that? We can run it on-time with no issues.'";
  }

  if (lower.includes("10 trucks") || lower.includes("fleet")) {
    return "For a 10-truck fleet, set rules: minimum RPM, max deadhead, good/bad markets, and weekly revenue targets per truck. Then stick to them.";
  }

  return "Got it. If you give me pay, loaded miles, and deadhead, I can help you analyze the load more precisely.";
}

function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    const reply = basicReply(text);
    addMessage(reply, "bot");
  }, 400);
}

function analyzeLoad() {
  const pay = parseFloat(document.getElementById("pay").value || "0");
  const miles = parseFloat(document.getElementById("miles").value || "0");
  const deadhead = parseFloat(document.getElementById("deadhead").value || "0");
  const fuel = parseFloat(document.getElementById("fuel").value || "0");
  const mpg = parseFloat(document.getElementById("mpg").value || "0");

  const out = document.getElementById("analysis");

  if (!pay || !miles) {
    out.textContent = "Enter at least pay and loaded miles.";
    return;
  }

  const totalMiles = miles + (deadhead || 0);
  const rpm = pay / totalMiles;
  const gallons = totalMiles / (mpg || 7);
  const fuelCost = gallons * (fuel || 4);
  const roughProfit = pay - fuelCost;

  let verdict;
  if (rpm >= 2.5) {
    verdict = "🔥 Strong RPM. Good starting point, especially if it keeps you in or moves you into a good freight market.";
  } else if (rpm >= 2.0) {
    verdict = "🟡 Decent. Might be worth it if it sets you up for a strong reload or protects your score.";
  } else {
    verdict = "🔻 Weak RPM. Only take it if you need to move the truck, save score, or escape a bad area.";
  }

  out.textContent =
    "Total miles (with deadhead): " + totalMiles.toFixed(0) + " mi\n" +
    "Estimated RPM: $" + rpm.toFixed(2) + "/mi\n" +
    "Estimated fuel cost: $" + fuelCost.toFixed(0) + "\n" +
    "Very rough profit after fuel: $" + roughProfit.toFixed(0) + "\n\n" +
    "Verdict: " + verdict;
}
