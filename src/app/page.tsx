"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAction = async (type: "register" | "login") => {
    if (!name) return setError("Namn krävs");

    const res = await fetch("/api/player", {
      method: type === "register" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Något gick fel");
      return;
    }

    localStorage.setItem("playerId", data.id);
    localStorage.setItem("playerName", data.name);
    router.push("/player");
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-4">Whispers Beyond</h1>

      <label className="block mb-2">
        Namn:
        <input
          className="w-full p-2 border rounded mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block mb-4">
        Lösenord:
        <input
          type="password"
          className="w-full p-2 border rounded mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="flex gap-4">
        <button
          onClick={() => handleAction("login")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Logga in
        </button>
        <button
          onClick={() => handleAction("register")}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Registrera
        </button>
      </div>
    </main>
  );
}