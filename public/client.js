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

joinBtn.onclick = () => {
  roomId = roomInput.value.trim();
  playerName = nameInput.value.trim();
  if (!roomId || !playerName) return alert("Enter both name and room ID!");
  socket.emit("joinRoom", roomId, playerName);
};

socket.on("joined", (data) => {
  symbol = data.symbol;
  roomId = data.roomId;
  statusEl.textContent = `You are ${symbol} in room ${roomId}`;
  createBoard();
});

socket.on("roomFull", () => alert("Room full! Try another ID."));

socket.on("updateBoard", (board, winner) => {
  for (let i = 0; i < 9; i++) {
    boardEl.children[i].textContent = board[i];
  }
  if (winner) statusEl.textContent = `${winner} wins!`;
});

socket.on("playerList", (players) => {
  statusEl.textContent = `Players: ${players.join(" vs ")} (${symbol})`;
});

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
