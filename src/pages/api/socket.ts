import { Server } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "@/types/next";
import dbConnect from "@/lib/mongodb";
import Player from "@/models/player";

const connectedPlayers = new Map<
  string,
  { id: string; socketId: string; name: string; position: [number, number] }
>();
const playerIdToSocket = new Map<string, string>();

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
    });

    io.on("connection", (socket) => {
      console.log("🔌 Ny spelare ansluten:", socket.id);

      socket.on("join-lobby", async ({ playerId }) => {
        if (connectedPlayers.has(socket.id)) return;

        await dbConnect();
        const player = await Player.findById(playerId);

        if (!player) {
          console.warn("⚠️ Kunde inte hitta spelare med ID:", playerId);
          return;
        }

        const takenPositions = Array.from(connectedPlayers.values()).map(p => p.position);
        const centerX = 40;
        const centerY = 20;

        let position: [number, number] = [centerX, centerY];
        const spiralOffsets = [
          [0, 0], [1, 0], [0, 1], [-1, 0], [0, -1],
          [1, 1], [-1, 1], [-1, -1], [1, -1],
          [2, 0], [0, 2], [-2, 0], [0, -2]
        ];

        for (const [dx, dy] of spiralOffsets) {
          const testPos: [number, number] = [centerX + dx, centerY + dy];
          if (!takenPositions.some(([x, y]) => x === testPos[0] && y === testPos[1])) {
            position = testPos;
            break;
          }
        }

        socket.data.name = player.name;
        socket.data.position = position;

        connectedPlayers.set(socket.id, {
          id: playerId,
          socketId: socket.id,
          name: player.name,
          position,
        });
        playerIdToSocket.set(playerId, socket.id);
        console.log("👤 Spelare registrerad:", player.name, position);

        socket.broadcast.emit("player-joined", { id: socket.id, name: player.name, position });
        socket.emit("current-players", Array.from(connectedPlayers.values()));
      });

      socket.on("join-game", async ({ playerId }) => {
        const socketId = playerIdToSocket.get(playerId);
        let player = socketId ? connectedPlayers.get(socketId) : null;

        if (!player) {
          // Player may not be registered yet in this socket session
          await dbConnect();
          const dbPlayer = await Player.findById(playerId);
          if (dbPlayer) {
            const position: [number, number] = [40, 20];
            player = {
              id: playerId,
              socketId: socket.id,
              name: dbPlayer.name,
              position
            };
            connectedPlayers.set(socket.id, player);
            playerIdToSocket.set(playerId, socket.id);
            console.log("👤 Spelare laddad direkt i join-game:", dbPlayer.name, position);
          }
        }

        if (player) {
          socket.emit("current-players", Array.from(connectedPlayers.values()));
          console.log("🎮 Game join: sent current-players to", player.name);
        } else {
          console.warn("⚠️ join-game: player not found for id", playerId);
        }
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

      socket.on("disconnect", async () => {
        console.log("❌ Spelare kopplade från:", socket.id);
        const playerData = connectedPlayers.get(socket.id);
        if (playerData) {
          try {
            await dbConnect();
            await Player.findOneAndUpdate({ name: playerData.name }, { lastKnownPosition: playerData.position });
            console.log("💾 Sparade spelarens position i databasen:", playerData.position);
          } catch (err) {
            console.error("⚠️ Kunde inte spara spelarens position:", err);
          }
        }

        connectedPlayers.delete(socket.id);
        if (playerData) {
          playerIdToSocket.delete(playerData.id);
        }
        io.emit("player-left", { id: socket.id });
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}