import { Server } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "@/types/next";

const connectedPlayers = new Set<string>();

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
    });

    io.on("connection", (socket) => {
      console.log("🔌 Ny spelare ansluten:", socket.id);

      socket.on("join-lobby", (name) => {
        socket.data.name = name;
        connectedPlayers.add(name);
        socket.broadcast.emit("player-joined", name);
        socket.emit("current-players", Array.from(connectedPlayers));
      });

      socket.on("start-game", () => {
        io.emit("game-started");
      });

      socket.on("disconnect", () => {
        console.log("❌ Spelare kopplade från:", socket.id);
        connectedPlayers.delete(socket.data.name);
        io.emit("player-left", socket.data.name);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}