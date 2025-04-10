"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socketClient";
import PlayerHUD from "./playerHUD";
import InitiativeHUD from "./innitiativeHUD";

export default function GamePage() {
  const gridCols = 32;
  const gridRows = 18;
  const [grid, setGrid] = useState<number[][]>([]);
  const [playerPosition, setPlayerPosition] = useState<[number, number] | null>(null);
  const [players, setPlayers] = useState<{ id: string; name: string; position?: [number, number] }[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [movesLeft, setMovesLeft] = useState(5);
  const [actionsLeft, setActionsLeft] = useState(1);
  const [localPlayerName, setLocalPlayerName] = useState("P");
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);

  useEffect(() => {
    socket.on("connect", () => {
      setLocalPlayerId(socket.id ?? null);
      const name = localStorage.getItem("playerName") || "P";
      setLocalPlayerName(name);

      setTimeout(() => {
        const offset = players.length;
        const position: [number, number] = [Math.floor(gridCols / 2) + offset, Math.floor(gridRows / 2)];
        setPlayerPosition(position);
        socket.emit("join-lobby", { name, position });
        console.log("📨 Sent join-lobby on connect (delayed):", { name, position });
      }, 50);
      
      // Fallback initial position if no other players
      setGrid(Array.from({ length: gridRows }, () => Array(gridCols).fill(0)));
      fetch("/api/socket");
    });

    socket.connect();

    socket.on("current-players", (existingPlayers: { id: string; name: string; position: [number, number] }[]) => {
      if (!socket.id) return;

      console.log("📦 Received players from server:", existingPlayers);
      console.log("🎮 Local player name:", localPlayerName);

      const alreadyJoined = existingPlayers.some(p => p.id === socket.id);
      console.log("🎯 Already joined:", alreadyJoined);

      const offset = existingPlayers.length;
      const initialPos: [number, number] = [Math.floor(gridCols / 2) + offset, Math.floor(gridRows / 2)];
      console.log("📍 Initial position:", initialPos);

      if (!alreadyJoined) {
        const updatedPlayers = [...existingPlayers, { id: socket.id as string, name: localPlayerName, position: initialPos }];
        setPlayers(updatedPlayers);
        console.log("👥 Players list updated:", updatedPlayers);
      } else {
        setPlayers(existingPlayers);
        console.log("👥 Players list updated:", existingPlayers);
        const localPlayer = existingPlayers.find(p => p.id === socket.id);
        if (localPlayer) {
          setPlayerPosition(localPlayer.position);
        }
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
      socket.disconnect();
    };
  }, []);

  function canMoveTo(col: number, row: number): boolean {
    if (!playerPosition || movesLeft <= 0) return false;
    const distance = Math.abs(playerPosition[0] - col) + Math.abs(playerPosition[1] - row);
    const occupied = players.some(p => p.position && p.position[0] === col && p.position[1] === row);
    return distance > 0 && distance <= movesLeft && !occupied;
  }

  if (!playerPosition) return null;

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
                const distance =
                  Math.abs(playerPosition[0] - colIndex) + Math.abs(playerPosition[1] - rowIndex);
                const isVisible = distance <= 10;
                const canMove = canMoveTo(colIndex, rowIndex);
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
                      (players.find((p) => p.position && p.position[0] === colIndex && p.position[1] === rowIndex)?.name.charAt(0) ??
                        (canMove ? "→" : ""))}
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
