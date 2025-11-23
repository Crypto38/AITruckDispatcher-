const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Add message to chat
function addMessage(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Handle input
sendBtn.onclick = () => {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("You: " + text);
  addMessage("Truck: " + currentTruck);

  userInput.value = "";
};

// ===== TRUCK DROPDOWN =====
let currentTruck = "Truck 1";

const truckBtn = document.getElementById("truckBtn");
const truckMenu = document.getElementById("truckMenu");

truckBtn.onclick = () => {
  truckMenu.style.display =
    truckMenu.style.display === "block" ? "none" : "block";
};

document.querySelectorAll(".truck-option").forEach(opt => {
  opt.onclick = () => {
    currentTruck = opt.textContent;
    truckBtn.textContent = opt.textContent;
    truckMenu.style.display = "none";
  };
});
