const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {}; // roomId -> { players: [], board: Array(9), turn, winner }

io.on("connection", (socket) => {
  console.log(`🔗 ${socket.id} connected`);

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

    if (room.players.length >= 2) {
      socket.emit("roomFull");
      return;
    }

    socket.join(roomId);
    room.players.push({
      id: socket.id,
      name: playerName,
      symbol: room.players.length === 0 ? "X" : "O",
    });

    socket.emit("joined", {
      symbol: room.players.length === 1 ? "X" : "O",
      roomId,
    });
    io.to(roomId).emit(
      "playerList",
      room.players.map((p) => p.name)
    );

    io.to(roomId).emit("updateBoard", room.board, room.winner);
  });

  socket.on("makeMove", ({ roomId, index }) => {
    const room = rooms[roomId];
    if (!room || room.winner) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player || room.turn !== player.symbol || room.board[index] !== "")
      return;

    room.board[index] = player.symbol;

    // Check for win
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

    if (
      combos.some((combo) =>
        combo.every((i) => room.board[i] === player.symbol)
      )
    ) {
      room.winner = player.symbol;
    }

    room.turn = room.turn === "X" ? "O" : "X";
    io.to(roomId).emit("updateBoard", room.board, room.winner);
  });

  socket.on("sendMessage", ({ roomId, message, name }) => {
    io.to(roomId).emit("chatMessage", { name, message });
  });
  socket.on("resetGame", () => {
    io.emit("gameReset");
  });

  socket.on("disconnect", () => {
    console.log(`❌ ${socket.id} disconnected`);
    for (const [roomId, room] of Object.entries(rooms)) {
      room.players = room.players.filter((p) => p.id !== socket.id);
      io.to(roomId).emit(
        "playerList",
        room.players.map((p) => p.name)
      );
      if (room.players.length === 0) delete rooms[roomId];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
