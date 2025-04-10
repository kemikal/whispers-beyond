"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socketClient";
import PlayerHUD from "./playerHUD";
import InitiativeHUD from "./innitiativeHUD";

export default function GamePage() {
  const gridCols = 80;
  const gridRows = 40;
  const [grid, setGrid] = useState<number[][]>([]);
  const [playerPosition, setPlayerPosition] = useState<[number, number] | null>(null);
  const [players, setPlayers] = useState<{ id: string; name: string; position: [number, number] }[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [movesLeft, setMovesLeft] = useState(5);
  const [actionsLeft, setActionsLeft] = useState(1);
  const [localPlayerName, setLocalPlayerName] = useState("P");
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [gameReady, setGameReady] = useState(false);

  useEffect(() => {
    if (!socket.connected) {
      console.log("🔁 Försöker ansluta socket...");
      socket.connect();
    }
    socket.on("connect", () => {
      const id = localStorage.getItem("playerId");
      const name = localStorage.getItem("playerName");
      if (id) setLocalPlayerId(id);
      if (name) setLocalPlayerName(name);
      
      console.log("🔌 Socket connected:", socket.id);

      const playerId = localStorage.getItem("playerId");
      if (playerId) {
        console.log("📨 Sending join-game with playerId:", playerId);
        socket.emit("join-game", { playerId });
      } else {
        console.warn("⚠️ No playerId in localStorage");
      }

      setTimeout(() => {
        const name = localStorage.getItem("playerName") || "P";
        setLocalPlayerName(name);
      }, 50);
      
      // Fallback initial position if no other players
      setGrid(Array.from({ length: gridRows }, () => Array(gridCols).fill(0)));
      fetch("/api/socket");
    });

    socket.on("current-players", (existingPlayers: { id: string; name: string; position: [number, number] }[]) => {
      console.log("📦 Received current-players:", existingPlayers);
      const id = localStorage.getItem("playerId");
      console.log("🎮 Local playerId from storage:", id);
      const local = existingPlayers.find(p => p.id === id);
      console.log("🔍 Found local player:", local);
      setPlayers(existingPlayers);
      if (local?.position) {
        setPlayerPosition(local.position);
      }
    });

    socket.on("player-joined", ({ id, name, position }: { id: string; name: string; position: [number, number] }) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.id === id)) return prev;
        const updatedPlayers = [...prev, { id, name, position }];
        console.log("👥 Players list updated:", updatedPlayers);
        return updatedPlayers;
      });
    });

    socket.on("player-moved", ({ id, position }: { id: string; position: [number, number] }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, position } : p))
      );
    });

    socket.on("turn-changed", (nextPlayerId: string) => {
      setPlayers((prevPlayers) => {
        const index = prevPlayers.findIndex((p) => p.id === nextPlayerId);
        if (index !== -1) {
          setCurrentTurnIndex(index);
          setMovesLeft(5);
          setActionsLeft(1);
        }
        return prevPlayers;
      });
    });

    return () => {
      socket.off("current-players");
      socket.off("player-joined");
      socket.off("player-moved");
      socket.off("turn-changed");
    };
  }, [localPlayerName]);

  useEffect(() => {
    console.log("🔍 Checking if game is ready...");
    console.log("🧭 playerPosition:", playerPosition);
    console.log("👥 players:", players);
    if (playerPosition && players.length > 0) {
      setGameReady(true);
    }
  }, [playerPosition, players]);

  function canMoveTo(col: number, row: number): boolean {
    if (!playerPosition || movesLeft <= 0) return false;
    const distance = Math.abs(playerPosition[0] - col) + Math.abs(playerPosition[1] - row);
    const occupied = players.some(p => p.position && p.position[0] === col && p.position[1] === row);
    return distance > 0 && distance <= movesLeft && !occupied;
  }

  if (!gameReady) {
    return (
      <main className="flex justify-center items-center min-h-screen text-xl font-bold">
        Laddar spel...
      </main>
    );
  }

  return (
    <main className="p-4 flex flex-col justify-center items-center min-h-screen">
      {playerPosition && (
        <>
          <InitiativeHUD players={players} currentTurnIndex={currentTurnIndex} />
          <PlayerHUD
            players={players}
            currentTurnIndex={currentTurnIndex}
            movesLeft={movesLeft}
            actionsLeft={actionsLeft}
            localPlayerId={localPlayerId}
            onEndTurn={() => {
              const nextIndex = (currentTurnIndex + 1) % players.length;
              socket.emit("end-turn", players[nextIndex].id);
            }}
          />
          <div
            className="grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gridTemplateRows: `repeat(${gridRows}, 1fr)`,
              width: "100vw",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            {grid.map((rowArray, rowIndex) =>
              rowArray.map((_, colIndex) => {
                const distance = Math.abs(playerPosition[0] - colIndex) + Math.abs(playerPosition[1] - rowIndex);
                const isVisible = distance <= 10;
                const canMove = canMoveTo(colIndex, rowIndex);
                const playerInTile = players.find((p) => p.position?.[0] === colIndex && p.position?.[1] === rowIndex);

                if (isVisible && playerInTile) {
                  console.log("👀 Player in visible tile", colIndex, rowIndex, ":", playerInTile);
                }

                return (
                  <div
                    key={`${colIndex}-${rowIndex}`}
                    onClick={() => {
                      if (canMove && players[currentTurnIndex]?.id === localPlayerId) {
                        setPlayerPosition([colIndex, rowIndex]);
                        setMovesLeft((prev) => prev - distance);
                        setPlayers((prev) =>
                          prev.map((p, i) =>
                            i === currentTurnIndex ? { ...p, position: [colIndex, rowIndex] } : p
                          )
                        );
                        socket.emit("player-move", {
                          id: players[currentTurnIndex].id,
                          position: [colIndex, rowIndex],
                        });
                      }
                    }}
                    className={`border flex items-center justify-center text-sm font-bold cursor-pointer ${
                      canMove ? "bg-green-100" : ""
                    }`}
                    style={{
                      backgroundColor: isVisible ? (canMove ? "#d0f0d0" : "white") : "#ccc",
                      height: `calc(100vh / ${gridRows})`,
                      width: `calc(100vw / ${gridCols})`,
                      fontSize: "1rem",
                    }}
                  >
                    {isVisible &&
                      (players.find(
                        (p) => p.position?.[0] === colIndex && p.position?.[1] === rowIndex
                      )?.name.charAt(0) ?? (canMove ? "→" : ""))}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </main>
  );
}
