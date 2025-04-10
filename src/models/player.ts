import { Schema, model, models } from "mongoose";

const playerSchema = new Schema({
  name: { type: String, required: true },
  password: String,
  stats: {
    hp: { type: Number, default: 100 },
    movement: { type: Number, default: 5 },
    actions: { type: Number, default: 1 }
  },
  inventory: [String],
  lastKnownPosition: {
    type: [Number],
    default: [40, 20]
  },
}, { timestamps: true });

const Player = models.Player || model("Player", playerSchema);

export default Player;