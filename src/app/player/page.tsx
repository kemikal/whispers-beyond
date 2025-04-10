"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PlayerData = {
  name: string;
  stats: { hp: number; movement: number; actions: number };
  inventory: string[];
};

export default function PlayerPage() {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const playerId = localStorage.getItem("playerId");

    if (!playerId || playerId.length !== 24) {
      router.push("/");
      return;
    }

    fetch(`/api/player/${playerId}`)
      .then((res) => res.json())
      .then((data) => {
        setPlayer(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <main className="p-8">Laddar spelarinfo...</main>;
  }

  if (!player) {
    return <main className="p-8 text-red-600">Kunde inte hitta spelare.</main>;
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-4">{player.name}</h1>
      <h2 className="text-xl font-semibold mb-2">Stats</h2>
      <ul className="mb-4">
        <li>HP: {player.stats.hp}</li>
        <li>Rörelser: {player.stats.movement}</li>
        <li>Handlingar: {player.stats.actions}</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">Inventory</h2>
      <ul className="mb-4">
        {player.inventory.length > 0 ? (
          player.inventory.map((item, i) => <li key={i}>{item}</li>)
        ) : (
          <li>Tom</li>
        )}
      </ul>

      <button
        onClick={() => router.push("/lobby")}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Gå till lobbyn
      </button>
    </main>
  );
}
