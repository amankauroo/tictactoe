const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {}; // roomId -> { players: [], board: [], turn, winner }

io.on("connection", (socket) => {
  console.log(`🔗 ${socket.id} connected`);

  // Player joins a room
  socket.on("joinRoom", (roomId, playerName) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        board: Array(9).fill(""),
        turn: "X",
        winner: null,
      };
    }

    const room = rooms[roomId];

    // Prevent more than 2 players
    if (room.players.length >= 2) {
      socket.emit("roomFull");
      return;
    }

    socket.join(roomId);
    const symbol = room.players.length === 0 ? "X" : "O";
    room.players.push({ id: socket.id, name: playerName, symbol });

    // Notify player who joined
    socket.emit("joined", { symbol, roomId });

    // Update all players in room
    io.to(roomId).emit(
      "playerList",
      room.players.map((p) => `${p.name} (${p.symbol})`)
    );
    io.to(roomId).emit("updateBoard", room.board, room.winner);
  });

  // Player makes a move
  socket.on("makeMove", ({ roomId, index }) => {
    const room = rooms[roomId];
    if (!room || room.winner) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    if (room.turn !== player.symbol || room.board[index] !== "") return;

    room.board[index] = player.symbol;

    // Win combos
    const combos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    if (combos.some((c) => c.every((i) => room.board[i] === player.symbol))) {
      room.winner = player.symbol;
    }

    room.turn = room.turn === "X" ? "O" : "X";
    io.to(roomId).emit("updateBoard", room.board, room.winner);
  });

  // Chat messages
  socket.on("sendMessage", ({ roomId, message, name }) => {
    io.to(roomId).emit("chatMessage", { name, message });
  });

  // Reset the game
  socket.on("resetGame", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    room.board = Array(9).fill("");
    room.winner = null;
    room.turn = "X";

    io.to(roomId).emit("updateBoard", room.board, room.winner);
    io.to(roomId).emit("gameReset");
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`❌ ${socket.id} disconnected`);
    for (const [roomId, room] of Object.entries(rooms)) {
      room.players = room.players.filter((p) => p.id !== socket.id);
      io.to(roomId).emit(
        "playerList",
        room.players.map((p) => `${p.name} (${p.symbol})`)
      );
      if (room.players.length === 0) delete rooms[roomId];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
