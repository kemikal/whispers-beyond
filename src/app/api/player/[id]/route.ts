import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Player from "@/models/player";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await dbConnect();

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Ogiltigt ID" }, { status: 400 });
  }

  const player = await Player.findById(id);

  if (!player) {
    return NextResponse.json({ error: "Spelare hittades inte" }, { status: 404 });
  }

  return NextResponse.json({
    name: player.name,
    stats: player.stats,
    inventory: player.inventory,
  });
}