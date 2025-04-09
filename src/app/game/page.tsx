"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socketClient";

export default function GamePage() {
  const gridSize = 10;
  const [grid, setGrid] = useState<number[][]>([]);
  const [playerPosition, setPlayerPosition] = useState<[number, number] | null>(null);
  const [players, setPlayers] = useState<{ name: string; position: [number, number] }[]>([]);

  useEffect(() => {
    fetch("/api/socket");
    socket.connect();

    const initialPos: [number, number] = [Math.floor(gridSize / 2), Math.floor(gridSize / 2)];
    console.log("pl init pos", initialPos);
    
    setPlayerPosition(initialPos);
    const name = localStorage.getItem("playerName") || "P";
    setPlayers([{ name, position: initialPos }]);
    setGrid(Array.from({ length: gridSize }, () => Array(gridSize).fill(0)));

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!playerPosition) return null;

  return (
    <main className="p-4 flex justify-center items-center min-h-screen">
      {playerPosition && (
        <div
          className="grid"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: "100%",
            maxWidth: "500px",
            aspectRatio: "1 / 1",
          }}
        >
          {grid.map((row, y) =>
            row.map((_, x) => {
              const distance =
                Math.abs(playerPosition[0] - x) + Math.abs(playerPosition[1] - y);
              const isVisible = distance <= 5;
              return (
                <div
                  key={`${x}-${y}`}
                  className="border flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: isVisible ? "white" : "#ccc",
                    aspectRatio: "1 / 1",
                    width: "100%",
                  }}
                >
                  {isVisible &&
                    players.find((p) => p.position[0] === x && p.position[1] === y)?.name.charAt(0)}
                </div>
              );
            })
          )}
        </div>
      )}
    </main>
  );
}
