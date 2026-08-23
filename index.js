const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const config = require('./config.json');
const Giveaway = require('./models/Giveaway');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.commands = new Collection();

// 1. Load Commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// 2. Load Events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// 3. Connect to MongoDB
mongoose.connect(config.mongoURI)
    .then(() => console.log('✅ Connected to MongoDB Atlas!'))
    .catch((error) => console.error('❌ MongoDB connection error:', error));

// 4. Giveaway Tracker (Runs every 60 seconds)
const { endGiveaway } = require('./utils/giveawayManager'); // Import our new brain

// ... (Keep your intent setup and command/event loading above this) ...

// Connect to MongoDB
mongoose.connect(config.mongoURI)
    .then(() => console.log('✅ Connected to MongoDB Atlas!'))
    .catch((error) => console.error('❌ MongoDB connection error:', error));

// HYBRID BOOT-UP: Rebuild precise timers if the bot restarts
client.once('clientReady', async c => {
    console.log(`✅ Ready! Logged in as ${c.user.tag}`);

    const pendingGiveaways = await Giveaway.find({ ended: false });
    const now = Date.now();

    for (const giveaway of pendingGiveaways) {
        const delay = giveaway.endsAt.getTime() - now;
        
        if (delay <= 0) {
            // If it ended while the bot was offline, end it immediately
            endGiveaway(client, giveaway._id);
        } else {
            // Otherwise, schedule the exact timer
            setTimeout(() => endGiveaway(client, giveaway._id), delay);
        }
    }
});

client.login(config.token);