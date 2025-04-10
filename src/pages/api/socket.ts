import { Server } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "@/types/next";

const connectedPlayers = new Map<string, { id: string; name: string; position: [number, number] }>();

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

        connectedPlayers.set(socket.id, { id: socket.id, name, position });
        console.log("👤 Spelare registrerad:", name, position);

        socket.broadcast.emit("player-joined", { id: socket.id, name, position });
        socket.emit("current-players", Array.from(connectedPlayers.values()));
      });

      socket.on("start-game", () => {
        io.emit("game-started");
      });

      socket.on("player-move", ({ id, position }) => {
        socket.broadcast.emit("player-moved", { id, position });
      });

      socket.on("end-turn", (nextPlayerId) => {
        io.emit("turn-changed", nextPlayerId);
      });

      socket.on("disconnect", () => {
        console.log("❌ Spelare kopplade från:", socket.id);
        connectedPlayers.delete(socket.id);
        io.emit("player-left", { id: socket.id });
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}