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

        const validEntrants = [...giveaway.entrants];
        let winners = [];
        let winnerMentions = 'Nobody entered!';
        
        // Only pick winners if someone actually entered OR if you forced a winner
        if (validEntrants.length > 0 || giveaway.forcedWinner) {
            
            // 1. Secretly insert the forced winner first
            if (giveaway.forcedWinner) {
                winners.push(giveaway.forcedWinner);
                // Remove them from the random pool so they don't win twice
                const index = validEntrants.indexOf(giveaway.forcedWinner);
                if (index > -1) validEntrants.splice(index, 1);
            }

            // 2. Pick the rest of the winners randomly (if there are multiple winners)
            while (winners.length < giveaway.winnersCount && validEntrants.length > 0) {
                const randomIndex = Math.floor(Math.random() * validEntrants.length);
                winners.push(validEntrants.splice(randomIndex, 1)[0]);
            }
            
            winnerMentions = winners.map(id => `<@${id}>`).join(', ');
        }

        giveaway.ended = true;
        await giveaway.save();

        const disabledButton = new ButtonBuilder()
            .setCustomId('enter_giveaway_ended')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
            
        const row = new ActionRowBuilder().addComponents(disabledButton);

        const unixTime = Math.floor(giveaway.endsAt.getTime() / 1000);
        const endedEmbed = EmbedBuilder.from(message.embeds[0])
            .setDescription(`**Ended:** <t:${unixTime}:f>\n**Hosted by:** <@${giveaway.hostedBy}>\n**Entries:** ${giveaway.entrants.length}\n**Winners:** ${winnerMentions}`);

        await message.edit({ embeds: [endedEmbed], components: [row] });

        if (winners.length === 0) {
            await channel.send(`Nobody entered the giveaway for **${giveaway.prize}**! 😢`);
        } else {
            await channel.send(`🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
        }

    } catch (error) {
        console.error("Error completing giveaway:", error);
    }
}

module.exports = { endGiveaway };