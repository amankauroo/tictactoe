const socket = io();

const nameInput = document.getElementById("nameInput");
const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const messagesEl = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let symbol = "";
let roomId = "";
let playerName = "";

// Join room
joinBtn.onclick = () => {
  roomId = roomInput.value.trim();
  playerName = nameInput.value.trim();
  if (!roomId || !playerName) return alert("Enter both name and room ID!");
  socket.emit("joinRoom", roomId, playerName);
};

// After joining
socket.on("joined", (data) => {
  symbol = data.symbol;
  roomId = data.roomId;
  statusEl.textContent = `Joined room ${roomId}. You are ${symbol}`;
  createBoard();
});

// Room full
socket.on("roomFull", () => alert("Room full! Try another ID."));

// Update board
socket.on("updateBoard", (board, winner) => {
  for (let i = 0; i < 9; i++) {
    if (boardEl.children[i]) boardEl.children[i].textContent = board[i];
  }
  if (winner) {
    statusEl.textContent = `${winner} wins!`;
  } else {
    statusEl.textContent = `Your symbol: ${symbol} | Turn: ${
      board.filter((v) => v).length % 2 === 0 ? "X" : "O"
    }`;
  }
});

// Update player list
socket.on("playerList", (players) => {
  const info = players.length
    ? players.join(" vs ")
    : "Waiting for opponent...";
  statusEl.textContent = `${info} — You are ${symbol}`;
});

// Create board
function createBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", () => {
      socket.emit("makeMove", { roomId, index: i });
    });
    boardEl.appendChild(cell);
  }
}

// Add reset button
const resetBtn = document.createElement("button");
resetBtn.textContent = "Reset Game";
resetBtn.classList.add("reset-btn");
resetBtn.onclick = () => {
  if (!roomId) return alert("Join a room first!");
  socket.emit("resetGame", roomId);
};
document.body.appendChild(resetBtn);

// When server resets game
socket.on("gameReset", () => {
  for (let i = 0; i < 9; i++) {
    if (boardEl.children[i]) boardEl.children[i].textContent = "";
  }
  statusEl.textContent = `New game started. You are ${symbol}`;
});

// Chat
sendBtn.onclick = () => {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("sendMessage", { roomId, message, name: playerName });
    messageInput.value = "";
  }
};

socket.on("chatMessage", ({ name, message }) => {
  const div = document.createElement("div");
  div.textContent = `${name}: ${message}`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
});
