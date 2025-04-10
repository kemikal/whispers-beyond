"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socketClient";
import { useRouter } from "next/navigation";

export default function Lobby() {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/socket");
    socket.connect();

    socket.on("current-players", (list: { id: string; name: string }[]) => {
      setPlayers(list);
    });

    socket.on("player-joined", (player: { id: string; name: string }) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.id === player.id)) return prev;
        return [...prev, player];
      });
    });

    socket.on("game-started", () => {
      router.push("/game");
    });

    socket.on("player-left", (player: { id: string }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinLobby = () => {
    if (name && !hasJoined) {
      socket.emit("join-lobby", { name });
      setHasJoined(true);
      localStorage.setItem("playerName", name);
    }
  };

  const startGame = () => {
    socket.emit("start-game");
  };

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Whispers Beyond – Lobby</h1>

      {!hasJoined && (
        <div className="mb-4">
          <input
            className="border p-2 w-full mb-2"
            placeholder="Ditt namn"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={joinLobby}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded"
          >
            Gå med i lobby
          </button>
        </div>
      )}

      <h2 className="text-lg font-semibold">Anslutna spelare:</h2>
      <ul className="list-disc ml-4 mb-4">
        {players.map((p, i) => (
          <li key={i}>{p.name}</li>
        ))}
      </ul>

      {players.length >= 1 && (
        <button
          onClick={startGame}
          className="w-full px-4 py-2 bg-green-700 text-white rounded"
        >
          Starta spel
        </button>
      )}
    </main>
  );
}