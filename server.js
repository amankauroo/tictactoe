import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    if (!rooms[room])
      rooms[room] = { players: [], board: Array(9).fill(null), turn: "X" };

    if (rooms[room].players.length < 2) {
      rooms[room].players.push(socket.id);
      socket.emit("joinedRoom", {
        room,
        symbol: rooms[room].players.length === 1 ? "X" : "O",
      });
      io.to(room).emit(
        "chatMessage",
        `Player ${rooms[room].players.length} joined.`
      );
    } else {
      socket.emit("roomFull");
    }
  });

  socket.on("makeMove", ({ room, index, symbol }) => {
    const game = rooms[room];
    if (!game) return;

    if (game.board[index] === null && game.turn === symbol) {
      game.board[index] = symbol;
      game.turn = symbol === "X" ? "O" : "X";
      io.to(room).emit("updateBoard", { board: game.board, turn: game.turn });
    }
  });

  socket.on("resetGame", (room) => {
    if (rooms[room]) {
      rooms[room].board = Array(9).fill(null);
      rooms[room].turn = "X";
      io.to(room).emit("updateBoard", { board: rooms[room].board, turn: "X" });
      io.to(room).emit("chatMessage", "Game reset!");
    }
  });

  socket.on("sendChat", ({ room, message }) => {
    io.to(room).emit("chatMessage", message);
  });

  socket.on("disconnect", () => {
    for (const room in rooms) {
      rooms[room].players = rooms[room].players.filter((p) => p !== socket.id);
      if (rooms[room].players.length === 0) delete rooms[room];
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
