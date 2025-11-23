/* Global Styles */
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background-color: #0d1117;
  color: #c9d1d9;
}

header.hero {
  text-align: center;
  padding: 30px 10px;
  background: #161b22;
  border-bottom: 1px solid #30363d;
}

h1 {
  margin: 0;
  font-size: 28px;
  color: #58a6ff;
}

p {
  margin: 5px 0 0;
  color: #8b949e;
}

.main {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 10px 20px;
}

/* Cards */
.card {
  background: #161b22;
  border: 1px solid #30363d;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 6px;
}

.subtitle {
  color: #8b949e;
  margin-bottom: 10px;
}

/* Chatbox */
#chatbox {
  height: 200px;
  overflow-y: auto;
  background: #0d1117;
  border: 1px solid #30363d;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 6px;
}

.msg {
  margin: 5px 0;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.msg.bot {
  background-color: #1f6feb;
  color: white;
}

.msg.user {
  background-color: #30363d;
}

/* Inputs */
.input-row {
  display: flex;
  gap: 6px;
}

input[type="text"],
input[type="number"] {
  flex: 1;
  padding: 8px;
  border: 1px solid #30363d;
  background: #0d1117;
  color: #c9d1d9;
  border-radius: 4px;
}

button {
  padding: 8px 12px;
  background: #238636;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background: #2ea043;
}

/* Profit Checker */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

label {
  font-size: 13px;
}

#analysis {
  margin-top: 10px;
  white-space: pre-wrap;
  background: #0d1117;
  border: 1px solid #30363d;
  padding: 10px;
  border-radius: 6px;
  min-height: 80px;
  font-size: 13px;
  }
