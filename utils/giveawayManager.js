const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Giveaway = require('../models/Giveaway');

async function endGiveaway(client, giveawayId) {
    try {
        const giveaway = await Giveaway.findById(giveawayId);
        if (!giveaway || giveaway.ended) return;

        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel) return;

        const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
        if (!message) return;

        // Pull the valid entrants straight from MongoDB
        const validEntrants = [...giveaway.entrants];
        let winnerMentions = 'Nobody entered!';
        
        if (validEntrants.length > 0) {
            const winners = [];
            for (let i = 0; i < giveaway.winnersCount; i++) {
                if (validEntrants.length === 0) break;
                const randomIndex = Math.floor(Math.random() * validEntrants.length);
                winners.push(validEntrants.splice(randomIndex, 1)[0]);
            }
            winnerMentions = winners.map(id => `<@${id}>`).join(', ');
        }

        // Lock it in the database
        giveaway.ended = true;
        await giveaway.save();

        // Disable the button so no one else can click it
        const disabledButton = new ButtonBuilder()
            .setCustomId('enter_giveaway_ended')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
            
        const row = new ActionRowBuilder().addComponents(disabledButton);

        const unixTime = Math.floor(giveaway.endsAt.getTime() / 1000);
        const endedEmbed = EmbedBuilder.from(message.embeds[0])
            .setDescription(`Ended: <t:${unixTime}:f>\nHosted by: <@${giveaway.hostedBy}>\nEntries: **${giveaway.entrants.length}**\nWinners: **${winnerMentions}**`);

        await message.edit({ embeds: [endedEmbed], components: [row] });

        if (giveaway.entrants.length === 0) {
            await channel.send(`Nobody entered the giveaway for **${giveaway.prize}**! 😢`);
        } else {
            await channel.send(`🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
        }

    } catch (error) {
        console.error("Error completing giveaway:", error);
    }
}

module.exports = { endGiveaway };