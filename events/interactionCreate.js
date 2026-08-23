const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Giveaway = require('../models/Giveaway');
const { endGiveaway } = require('../utils/giveawayManager');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // --- 1. HANDLE SLASH COMMANDS ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const replyData = { content: 'There was an error executing this command!', flags: 64 };
                interaction.replied || interaction.deferred ? await interaction.followUp(replyData) : await interaction.reply(replyData);
            }
        } 
        
        // --- 2. HANDLE GIVEAWAY MODALS ---
        else if (interaction.isModalSubmit() && interaction.customId === 'giveaway_modal') {
            const durationStr = interaction.fields.getTextInputValue('duration').toLowerCase().trim();
            const winnerCount = parseInt(interaction.fields.getTextInputValue('winners'));
            const prize = interaction.fields.getTextInputValue('prize');

            let durationMinutes = parseInt(durationStr);
            if (durationStr.endsWith('h')) durationMinutes *= 60;
            else if (durationStr.endsWith('d')) durationMinutes *= (60 * 24);

            if (isNaN(durationMinutes) || isNaN(winnerCount)) {
                return interaction.reply({ content: '❌ Please enter valid numbers for time and winners!', flags: 64 });
            }

            const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);
            const unixTime = Math.floor(endsAt.getTime() / 1000);
            
            const giveawayEmbed = new EmbedBuilder()
                .setAuthor({ name: '🎉 New Giveaway Hosted!' })
                .setTitle(prize)
                .setDescription(`Click the button below to enter!\n\n**Ends:** <t:${unixTime}:R> ( <t:${unixTime}:f> )\n**Hosted by:** ${interaction.user}\n**Entries:** 0\n**Winners:** ${winnerCount}`)
                .setColor('#5865F2')
                .setThumbnail(interaction.guild?.iconURL({ dynamic: true }) || null)
                .setTimestamp(endsAt);

            const enterButton = new ButtonBuilder()
                .setCustomId('enter_giveaway')
                .setLabel('Enter Giveaway')
                .setEmoji('🎁')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(enterButton);

            await interaction.reply({ content: 'Giveaway successfully launched!', flags: 64 });
            const giveawayMessage = await interaction.channel.send({ embeds: [giveawayEmbed], components: [row] });

            const newGiveaway = await Giveaway.create({
                messageId: giveawayMessage.id,
                channelId: interaction.channel.id,
                prize: prize,
                endsAt: endsAt,
                winnersCount: winnerCount,
                hostedBy: interaction.user.id,
                ended: false
            });

            const delay = endsAt.getTime() - Date.now();
            setTimeout(() => endGiveaway(client, newGiveaway._id), delay);
        }

        // --- 3. HANDLE ANNOUNCEMENT MODALS ---
        else if (interaction.isModalSubmit() && interaction.customId.startsWith('announce_modal_')) {
            const customIdParts = interaction.customId.split('_');
            const channelId = customIdParts[2];
            const pingType = customIdParts[3];

            const title = interaction.fields.getTextInputValue('title');
            const message = interaction.fields.getTextInputValue('message');
            
            let imageUrl = null;
            try {
                imageUrl = interaction.fields.getTextInputValue('image_url');
            } catch (error) {
                // Silently ignore if the field is missing due to caching
            }

            const targetChannel = await interaction.client.channels.fetch(channelId).catch(() => null);

            if (!targetChannel) {
                return interaction.reply({ content: '❌ Could not find the target channel.', flags: 64 });
            }

            // UPGRADED "LIVELY" UI
            const announceEmbed = new EmbedBuilder()
                .setAuthor({ 
                    name: `${interaction.guild.name} • Official Announcement`, 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setTitle(`✨ ${title}`)
                .setDescription(`>>> ${message}\n\n`) 
                .setColor('#FFD700') 
                .setFooter({ 
                    text: `Published by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                })
                .setTimestamp();

            // DYNAMIC BANNER SYSTEM
            if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
                announceEmbed.setImage(imageUrl);
            } 
            else if (interaction.guild.iconURL()) {
                announceEmbed.setImage(interaction.guild.iconURL({ dynamic: true, size: 1024 }));
            }

            let pingContent = '';
            if (pingType === 'everyone') pingContent = '@everyone';
            else if (pingType === 'here') pingContent = '@here';

            await targetChannel.send({ content: pingContent, embeds: [announceEmbed] });
            await interaction.reply({ content: `✅ Premium announcement sent to <#${channelId}>!`, flags: 64 });
        }

        // --- 4. HANDLE GIVEAWAY BUTTON CLICKS ---
        else if (interaction.isButton() && interaction.customId === 'enter_giveaway') {
            const giveaway = await Giveaway.findOne({ messageId: interaction.message.id });
            
            if (!giveaway || giveaway.ended) {
                return interaction.reply({ content: '❌ This giveaway has already ended!', flags: 64 });
            }

            if (giveaway.entrants.includes(interaction.user.id)) {
                return interaction.reply({ content: 'You have already entered this giveaway! 🎉', flags: 64 });
            }

            giveaway.entrants.push(interaction.user.id);
            await giveaway.save();

            const unixTime = Math.floor(giveaway.endsAt.getTime() / 1000);
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setDescription(`Click the button below to enter!\n\n**Ends:** <t:${unixTime}:R> ( <t:${unixTime}:f> )\n**Hosted by:** <@${giveaway.hostedBy}>\n**Entries:** ${giveaway.entrants.length}\n**Winners:** ${giveaway.winnersCount}`);

            await interaction.message.edit({ embeds: [updatedEmbed] });
            await interaction.reply({ content: 'Entry confirmed! Good luck! 🍀', flags: 64 });
        }
    },
};