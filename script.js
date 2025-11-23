// ===== AITruckDispatcher v20 – Smart RPM + Counter + Broker Script =====

// Grab UI elements
const chatBox  = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn   = document.getElementById("sendBtn");

// Add a message to the screen
function addMessage(text) {
  const div = document.createElement("div");
  div.className = "msg-bot";
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Initial message
addMessage(
  "AITruckDispatcher v20 loaded. " +
  "Paste a load like: 1500 pay 520 miles 80 deadhead fuel 4.25 mpg 7 aggressive from Atlanta to Chicago."
);

// Handle send / Enter
function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  // show what you typed
  const div = document.createElement("div");
  div.className = "msg-user";
  div.textContent = "You: " + text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  userInput.value = "";
  handleLoadText(text);
}

sendBtn.onclick = handleSend;
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSend();
});

// Core brain – parse load & give advice
function handleLoadText(text) {
  const lower = text.toLowerCase();

  // grab numbers in order
  const nums = lower.match(/[\d.]+/g) || [];

  const pay       = parseFloat(nums[0] || 0); // line haul
  const miles     = parseFloat(nums[1] || 0); // loaded miles
  const dead      = parseFloat(nums[2] || 0); // deadhead miles
  const fuelPrice = parseFloat(nums[3] || 4.00); // fuel per gallon
  const mpg       = parseFloat(nums[4] || 7.0);  // truck mpg

  // optional style: aggressive / normal / soft
  let style = "normal";
  if (lower.includes("aggressive")) style = "aggressive";
  if (lower.includes("soft"))       style = "soft";

  // optional route: "from X to Y"
  let origin = "";
  let dest   = "";
  const routeMatch = /from\s+(.+?)\s+to\s+(.+?)(?:$|\s)/i.exec(text);
  if (routeMatch) {
    origin = routeMatch[1].trim();
    dest   = routeMatch[2].trim();
  }

  // math
  const totalMiles = miles + dead;
  const fuelCost   = totalMiles > 0 && mpg > 0
    ? (totalMiles / mpg) * fuelPrice
    : 0;
  const net        = pay - fuelCost;
  const rpm        = miles > 0 ? pay / miles : 0;

  // verdict + suggested counter
  let verdict = "";
  let action  = "";
  let bumpLow = pay;
  let bumpHigh = pay;

  if (rpm >= 3.0) {
    verdict  = "🔥 Amazing load. TAKE IT or counter just a little higher.";
    action   = "TAKE or small COUNTER.";
    bumpLow  = pay + 25;
