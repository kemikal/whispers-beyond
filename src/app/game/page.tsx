"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socketClient";

export default function GamePage() {
  const gridCols = 32;
  const gridRows = 18;
  const [grid, setGrid] = useState<number[][]>([]);
  const [playerPosition, setPlayerPosition] = useState<[number, number] | null>(null);
  const [players, setPlayers] = useState<{ name: string; position: [number, number] }[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [movesLeft, setMovesLeft] = useState(5);
  const [actionsLeft, setActionsLeft] = useState(1);
  const [localPlayerName, setLocalPlayerName] = useState("P");

  useEffect(() => {
    fetch("/api/socket");
    socket.connect();
    setGrid(Array.from({ length: gridRows }, () => Array(gridCols).fill(0)));

    socket.on("current-players", (existingPlayers: { name: string; position: [number, number] }[]) => {
      const name = localStorage.getItem("playerName") || "P";
      const offset = existingPlayers.length;
      const initialPos: [number, number] = [Math.floor(gridCols / 2) + offset, Math.floor(gridRows / 2)];

      setPlayerPosition(initialPos);
      setLocalPlayerName(name);
      setPlayers([...existingPlayers, { name, position: initialPos }]);
      socket.emit("join-lobby", { name, position: initialPos });
    });

    socket.on("player-joined", ({ name, position }: { name: string; position: [number, number] }) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.name === name)) return prev;
        return [...prev, { name, position }];
      });
    });

    socket.on("player-moved", ({ name, position }: { name: string; position: [number, number] }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.name === name ? { ...p, position } : p))
      );
    });

    socket.on("turn-changed", (nextPlayerName: string) => {
      setPlayers((prevPlayers) => {
        const index = prevPlayers.findIndex((p) => p.name === nextPlayerName);
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
    const occupied = players.some(p => p.position[0] === col && p.position[1] === row);
    return distance > 0 && distance <= movesLeft && !occupied;
  }

  if (!playerPosition) return null;

  return (
    <main className="p-4 flex justify-center items-center min-h-screen">
      {playerPosition && (
        <>
          <div className="absolute top-4 left-4 bg-white bg-opacity-80 p-4 rounded shadow text-sm z-10">
            <div className="mb-2">
              <strong>Spelare:</strong>
              <ul className="list-disc list-inside">
                {players.map((p, i) => (
                  <li key={i} className={i === currentTurnIndex ? "font-bold text-blue-600" : ""}>
                    {p.name} {i === currentTurnIndex && "(tur)"}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-1"><strong>Tur:</strong> {players[currentTurnIndex]?.name}</div>
            <div><strong>Rörelser kvar:</strong> {movesLeft}</div>
            <div><strong>Handlingar kvar:</strong> {actionsLeft}</div>
            {players[currentTurnIndex]?.name === localPlayerName && (
              <button
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => {
                  const nextIndex = (currentTurnIndex + 1) % players.length;
                  socket.emit("end-turn", players[nextIndex].name);
                }}
              >
                Klar
              </button>
            )}
          </div>
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
                      if (canMove && players[currentTurnIndex]?.name === localPlayerName) {
                        setPlayerPosition([colIndex, rowIndex]);
                        setMovesLeft((prev) => prev - distance);
                        setPlayers((prev) =>
                          prev.map((p, i) =>
                            i === currentTurnIndex ? { ...p, position: [colIndex, rowIndex] } : p
                          )
                        );
                        socket.emit("player-move", {
                          name: players[currentTurnIndex].name,
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
                      (players.find((p) => p.position[0] === colIndex && p.position[1] === rowIndex)?.name.charAt(0) ??
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
