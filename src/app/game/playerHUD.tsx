"use client";
import React from "react";

type Player = {
  id: string;
  name: string;
  position?: [number, number];
};

interface PlayerHUDProps {
  players: Player[];
  currentTurnIndex: number;
  movesLeft: number;
  actionsLeft: number;
  localPlayerId: string | null;
  onEndTurn: () => void;
}

export default function PlayerHUD({
  players,
  currentTurnIndex,
  movesLeft,
  actionsLeft,
  localPlayerId,
  onEndTurn,
}: PlayerHUDProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white bg-opacity-90 p-4 rounded shadow text-sm">
      <div className="mb-2">
        <strong>Spelare:</strong>
        <ul className="list-disc list-inside">
          {players.map((p, i) => (
            <li key={p.id} className={i === currentTurnIndex ? "font-bold text-blue-600" : ""}>
              {p.name} {i === currentTurnIndex && "(tur)"}
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-1"><strong>Tur:</strong> {players[currentTurnIndex]?.name}</div>
      <div><strong>Rörelser kvar:</strong> {movesLeft}</div>
      <div><strong>Handlingar kvar:</strong> {actionsLeft}</div>
      {players[currentTurnIndex]?.id === localPlayerId && (
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={onEndTurn}
        >
          Klar
        </button>
      )}
    </div>
  );
}
