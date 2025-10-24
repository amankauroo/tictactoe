const socket = io();

let room = null;
let symbol = null;

const boardDiv = document.getElementById("board");
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");
const roomInfo = document.getElementById("roomInfo");
const turnInfo = document.getElementById("turnInfo");
const resetBtn = document.getElementById("resetBtn");
const gameDiv = document.getElementById("game");
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

joinBtn.onclick = () => {
  room = roomInput.value.trim();
  if (!room) return alert("Enter a room name");
  socket.emit("joinRoom", room);
};

socket.on("joinedRoom", (data) => {
  room = data.room;
  symbol = data.symbol;
  roomInfo.textContent = `Joined Room: ${room} | You are: ${symbol}`;
  gameDiv.classList.remove("hidden");
  initBoard();
});

socket.on("roomFull", () => alert("Room is full"));

function initBoard() {
  boardDiv.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", () => makeMove(i));
    boardDiv.appendChild(cell);
  }
}

function makeMove(index) {
  socket.emit("makeMove", { room, index, symbol });
}

socket.on("updateBoard", ({ board, turn }) => {
  const cells = boardDiv.querySelectorAll(".cell");
  board.forEach((v, i) => (cells[i].textContent = v || ""));
  turnInfo.textContent = `Turn: ${turn}`;
});

resetBtn.onclick = () => socket.emit("resetGame", room);

sendBtn.onclick = () => {
  const msg = chatInput.value.trim();
  if (!msg) return;
  socket.emit("sendChat", { room, message: `${symbol}: ${msg}` });
  chatInput.value = "";
};

socket.on("chatMessage", (msg) => {
  const div = document.createElement("div");
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});
