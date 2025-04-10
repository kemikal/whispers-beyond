import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Player from "@/models/player";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { name, password } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Namn krävs" }, { status: 400 });
  }

  const existing = await Player.findOne({ name });
  if (existing) {
    return NextResponse.json({ error: "Spelare finns redan" }, { status: 409 });
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

  const newPlayer = await Player.create({
    name,
    password: hashedPassword,
    stats: { hp: 100, movement: 5, actions: 1 },
    inventory: [],
  });

  return NextResponse.json({ id: newPlayer._id, name: newPlayer.name });
}

export async function PUT(req: NextRequest) {
  await dbConnect();
  const { name, password } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Namn krävs" }, { status: 400 });
  }

  const player = await Player.findOne({ name });

  if (!player) {
    return NextResponse.json({ error: "Spelare hittades inte" }, { status: 404 });
  }

  if (player.password && password) {
    const valid = await bcrypt.compare(password, player.password);
    if (!valid) {
      return NextResponse.json({ error: "Fel lösenord" }, { status: 401 });
    }
  }

  return NextResponse.json({ id: player._id, name: player.name });
}


