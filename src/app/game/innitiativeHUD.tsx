"use client";
import React from "react";

type Player = {
  id: string;
  name: string;
  position?: [number, number];
};

interface InitiativeHUDProps {
  players: Player[];
  currentTurnIndex: number;
}

export default function InitiativeHUD({
  players,
  currentTurnIndex,
}: InitiativeHUDProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white bg-opacity-90 p-4 rounded shadow text-sm">
      <div className="mb-2 text-center font-bold">Initiativordning</div>
      <ul className="flex flex-col items-center gap-1">
        {players.map((p, i) => (
          <li
            key={p.id}
            className={`px-2 py-1 rounded ${
              i === currentTurnIndex ? "bg-blue-500 text-white font-bold" : "bg-gray-200"
            }`}
          >
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
