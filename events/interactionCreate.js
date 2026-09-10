const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Giveaway = require('../models/Giveaway');
const Raid = require('../models/Raid');
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
        else if (interaction.isModalSubmit() && interaction.customId.startsWith('giveaway_modal_')) {
            // Extract the secret winner ID we hid in the customId
            const forcedWinnerId = interaction.customId.split('_')[2];
            const actualForcedWinner = forcedWinnerId === 'none' ? null : forcedWinnerId;

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
                forcedWinner: actualForcedWinner, // NEW: Saves the secret to the database
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

       // --- 3.5 HANDLE RAID MODALS ---
        else if (interaction.isModalSubmit() && interaction.customId.startsWith('raid_modal_')) {
            const channelId = interaction.customId.split('_')[2];
            const boss = interaction.fields.getTextInputValue('boss');
            const rawTokens = interaction.fields.getTextInputValue('tokens');
            const timeString = interaction.fields.getTextInputValue('time').trim();

            const tokenAmount = parseInt(rawTokens.replace(/,/g, '')); 
            const bossCount = Math.floor(tokenAmount / 500);

            const targetChannel = await interaction.client.channels.fetch(channelId).catch(() => null);
            if (!targetChannel) {
                return interaction.reply({ content: '❌ Could not find the target channel.', flags: 64 });
            }

            let raidTime;
            if (/^\d+[mhd]$/i.test(timeString)) {
                let durationMinutes = parseInt(timeString);
                if (timeString.endsWith('h') || timeString.endsWith('H')) durationMinutes *= 60;
                else if (timeString.endsWith('d') || timeString.endsWith('D')) durationMinutes *= (60 * 24);
                raidTime = new Date(Date.now() + durationMinutes * 60 * 1000);
            } else {
                const formattedString = timeString.replace(' ', 'T') + ':00+03:00';
                raidTime = new Date(formattedString);
            }

            if (isNaN(raidTime.getTime())) {
                return interaction.reply({ content: '❌ Invalid time! Use a duration (ex: `2h`) OR exact time (ex: `2026-09-01 15:30`).', flags: 64 });
            }

            const unixTime = Math.floor(raidTime.getTime() / 1000);

            const raidEmbed = new EmbedBuilder()
                .setAuthor({ name: '⚔️ Raid Event Scheduled!' })
                .setTitle(`Boss: ${boss}`)
                .setDescription(`A new raid is starting soon! Gear up and get ready.`)
                .addFields(
                    { name: '🎟️ Tokens Pool', value: `**${tokenAmount.toLocaleString()}**`, inline: true },
                    { name: '💀 Bosses Spawning', value: `**${bossCount.toLocaleString()}**`, inline: true },
                    { name: '⏰ Starts At', value: `<t:${unixTime}:F>\n(<t:${unixTime}:R>)`, inline: false },
                    { name: '👑 Hosted By', value: `${interaction.user}`, inline: true },
                    { name: '👥 Raiders (0)', value: 'None yet', inline: false } // NEW: The player list
                )
                .setColor('#8B0000') 
                .setThumbnail(interaction.guild?.iconURL({ dynamic: true }) || null)
                .setFooter({ text: 'Crown Empire Raids' })
                .setTimestamp();

            // NEW: The button
            const joinButton = new ButtonBuilder()
                .setCustomId('join_raid')
                .setLabel("I'm Coming!")
                .setEmoji('⚔️')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(joinButton);

            const raidMessage = await targetChannel.send({ embeds: [raidEmbed], components: [row] });
            await interaction.reply({ content: `✅ Raid announced in <#${channelId}>!`, flags: 64 });

            // NEW: Save to Database
            await Raid.create({
                messageId: raidMessage.id,
                channelId: targetChannel.id,
                participants: []
            });
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

        // --- 5. HANDLE ROLE BUTTONS ---
        else if (interaction.isButton() && interaction.customId.startsWith('role_toggle_')) {
            // Extract the role ID from the button's customId
            const roleId = interaction.customId.split('_')[2];
            const role = interaction.guild.roles.cache.get(roleId);

            if (!role) {
                return interaction.reply({ content: '❌ This role no longer exists on the server.', flags: 64 });
            }

            // Safety Check: Make sure the bot's role is physically higher than the role it's trying to give
            if (interaction.guild.members.me.roles.highest.position <= role.position) {
                return interaction.reply({ content: '❌ My bot role is not high enough to give this out! Please go to Server Settings > Roles and drag my bot role above this one.', flags: 64 });
            }

            const member = await interaction.guild.members.fetch(interaction.user.id);

            // Toggle logic: If they have it, remove it. If they don't, add it.
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
                return interaction.reply({ content: `✅ You removed the **${role.name}** role.`, flags: 64 });
            } else {
                await member.roles.add(roleId);
                return interaction.reply({ content: `✅ You received the **${role.name}** role!`, flags: 64 });
            }
        }
        // --- 6. HANDLE RAID BUTTON CLICKS ---
        else if (interaction.isButton() && interaction.customId === 'join_raid') {
            const raid = await Raid.findOne({ messageId: interaction.message.id });
            
            if (!raid) {
                return interaction.reply({ content: '❌ Could not find this raid in the database.', flags: 64 });
            }

            // Toggle logic: Add them if they aren't on the list, remove them if they are
            let replyMessage = '';
            if (raid.participants.includes(interaction.user.id)) {
                raid.participants = raid.participants.filter(id => id !== interaction.user.id);
                replyMessage = '✅ You have backed out of the raid.';
            } else {
                raid.participants.push(interaction.user.id);
                replyMessage = '✅ You have successfully joined the raid!';
            }
            
            await raid.save();

            // Format the list of names 
            const participantCount = raid.participants.length;
            let participantsList = 'None yet';
            
            if (participantCount > 0) {
                participantsList = raid.participants.map(id => `<@${id}>`).join(', ');
                
                // Discord blocks fields over 1024 characters, so this caps it safely for massive raids
                if (participantsList.length > 1000) {
                    participantsList = `**${participantCount} players are coming!** *(List too long to display)*`;
                }
            }

            // Update the embed with the new list
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
            const raidersFieldIndex = updatedEmbed.data.fields.findIndex(f => f.name.includes('👥 Raiders'));
            
            if (raidersFieldIndex !== -1) {
                updatedEmbed.data.fields[raidersFieldIndex].name = `👥 Raiders (${participantCount})`;
                updatedEmbed.data.fields[raidersFieldIndex].value = participantsList;
            }

            await interaction.message.edit({ embeds: [updatedEmbed] });
            await interaction.reply({ content: replyMessage, flags: 64 });
        }
    },
};