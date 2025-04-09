import { Server } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "@/types/next";

const connectedPlayers = new Map<string, { position: [number, number] }>();

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
    });

    io.on("connection", (socket) => {
      console.log("🔌 Ny spelare ansluten:", socket.id);

      socket.on("join-lobby", ({ name, position }) => {
        socket.data.name = name;
        socket.data.position = position;
        connectedPlayers.set(name, { position });

        socket.broadcast.emit("player-joined", { name, position });
        socket.emit("current-players", Array.from(connectedPlayers.entries()).map(([name, { position }]) => ({ name, position })));
      });

      socket.on("start-game", () => {
        io.emit("game-started");
      });

      socket.on("player-move", ({ name, position }) => {
        socket.broadcast.emit("player-moved", { name, position });
      });

      socket.on("end-turn", (nextPlayerName) => {
        io.emit("turn-changed", nextPlayerName);
      });

      socket.on("disconnect", () => {
        console.log("❌ Spelare kopplade från:", socket.id);
        const name = socket.data.name;
        connectedPlayers.delete(name);
        io.emit("player-left", { name });
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}