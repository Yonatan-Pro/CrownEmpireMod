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
        
        // --- 2. HANDLE MODAL SUBMISSIONS ---
        else if (interaction.isModalSubmit() && interaction.customId === 'giveaway_modal') {
            const durationStr = interaction.fields.getTextInputValue('duration').toLowerCase().trim();
            const winnerCount = parseInt(interaction.fields.getTextInputValue('winners'));
            const prize = interaction.fields.getTextInputValue('prize');

            // SMART TIME PARSER: Checks for m, h, or d
            let durationMinutes = parseInt(durationStr);
            if (durationStr.endsWith('h')) durationMinutes *= 60;
            else if (durationStr.endsWith('d')) durationMinutes *= (60 * 24);
            // If they just type a number without a letter, it defaults to minutes

            if (isNaN(durationMinutes) || isNaN(winnerCount)) {
                return interaction.reply({ content: '❌ Please enter valid numbers for time and winners!', flags: 64 });
            }

            const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);
            const unixTime = Math.floor(endsAt.getTime() / 1000);
            
            // UPGRADED PREMIUM UI
            const giveawayEmbed = new EmbedBuilder()
                .setAuthor({ name: '🎉 New Giveaway Hosted!' })
                .setTitle(prize)
                .setDescription(`Click the button below to enter!\n\n**Ends:** <t:${unixTime}:R> ( <t:${unixTime}:f> )\n**Hosted by:** ${interaction.user}\n**Entries:** 0\n**Winners:** ${winnerCount}`)
                .setColor('#5865F2') // Discord Blurple
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

        // --- 2.5 HANDLE ANNOUNCEMENT MODALS ---
        else if (interaction.isModalSubmit() && interaction.customId.startsWith('announce_modal_')) {
            // Break apart our secret custom ID to get the data
            const customIdParts = interaction.customId.split('_');
            const channelId = customIdParts[2];
            const pingType = customIdParts[3];

            const title = interaction.fields.getTextInputValue('title');
            const message = interaction.fields.getTextInputValue('message');
            const imageUrl = interaction.fields.getTextInputValue('image_url');

            const targetChannel = await interaction.client.channels.fetch(channelId).catch(() => null);

            if (!targetChannel) {
                return interaction.reply({ content: '❌ Could not find the target channel.', flags: 64 });
            }

            // UPGRADED PREMIUM UI
            const announceEmbed = new EmbedBuilder()
                .setAuthor({ 
                    name: `${interaction.guild.name} Announcement`, 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setTitle(`📢 ${title}`)
                .setDescription(message)
                .setColor('#2B2D31') // Very sleek dark theme 
                .setThumbnail(interaction.guild?.iconURL({ dynamic: true }) || null)
                .setFooter({ 
                    text: `Published by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                })
                .setTimestamp();

            // Only add the image if they provided a valid link
            if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
                announceEmbed.setImage(imageUrl);
            }

            // Figure out the ping text
            let pingContent = '';
            if (pingType === 'everyone') pingContent = '@everyone';
            else if (pingType === 'here') pingContent = '@here';

            // Send it! (If pingContent is empty, it just sends the embed silently)
            await targetChannel.send({ content: pingContent, embeds: [announceEmbed] });
            await interaction.reply({ content: `✅ Premium announcement sent to <#${channelId}>!`, flags: 64 });
        }

        // --- 3. HANDLE BUTTON CLICKS ---
        else if (interaction.isButton() && interaction.customId === 'enter_giveaway') {
            const giveaway = await Giveaway.findOne({ messageId: interaction.message.id });
            
            if (!giveaway || giveaway.ended) {
                return interaction.reply({ content: '❌ This giveaway has already ended!', flags: 64 });
            }

            if (giveaway.entrants.includes(interaction.user.id)) {
                return interaction.reply({ content: 'You have already entered this giveaway! 🎉', flags: 64 });
            }

            // Save user to database
            giveaway.entrants.push(interaction.user.id);
            await giveaway.save();

            // Instantly update the Entries text on the embed
            const unixTime = Math.floor(giveaway.endsAt.getTime() / 1000);
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setDescription(`Ends: <t:${unixTime}:R> ( <t:${unixTime}:f> )\nHosted by: <@${giveaway.hostedBy}>\nEntries: **${giveaway.entrants.length}**\nWinners: **${giveaway.winnersCount}**`);

            await interaction.message.edit({ embeds: [updatedEmbed] });
            await interaction.reply({ content: 'Entry confirmed! Good luck! 🍀', flags: 64 });
        }
    },
};