const { Schema, model } = require('mongoose');

const raidSchema = new Schema({
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    participants: { type: [String], default: [] }
});

module.exports = model('Raid', raidSchema);