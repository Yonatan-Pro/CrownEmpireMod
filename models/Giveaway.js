const { Schema, model } = require('mongoose');

const giveawaySchema = new Schema({
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    prize: { type: String, required: true },
    endsAt: { type: Date, required: true },
    winnersCount: { type: Number, required: true, default: 1 },
    hostedBy: { type: String, required: true }, // NEW: Tracks the host
    entrants: { type: [String], default: [] },  // NEW: Tracks who clicks the button
    forcedWinner: { type: String, default: null },
    reqMessages: { type: Number, default: 0 }, // NEW: Tracks required messages
    reqInvites: { type: Number, default: 0 },  // NEW: Tracks required invites
    ended: { type: Boolean, default: false }
});

module.exports = model('Giveaway', giveawaySchema);