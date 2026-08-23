const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Giveaway = require('../models/Giveaway');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reroll')
        .setDescription('Pick a new winner for a completed giveaway')
        .addStringOption(option => 
            option.setName('message_id')
                .setDescription('The ID of the giveaway message')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');
        const giveaway = await Giveaway.findOne({ messageId: messageId });

        if (!giveaway) {
            return interaction.reply({ content: '❌ Could not find a giveaway with that message ID in the database.', flags: 64 });
        }

        if (!giveaway.ended) {
            return interaction.reply({ content: '❌ You can only reroll a giveaway that has already ended!', flags: 64 });
        }

        if (giveaway.entrants.length === 0) {
            return interaction.reply({ content: '❌ Nobody entered that giveaway, so there is no one to reroll!', flags: 64 });
        }

        // Pick a new random winner
        const randomIndex = Math.floor(Math.random() * giveaway.entrants.length);
        const newWinnerId = giveaway.entrants[randomIndex];

        await interaction.reply({ content: `✅ Reroll successful!`, flags: 64 });
        await interaction.channel.send(`🎉 **REROLL!** Congratulations <@${newWinnerId}>! You are the new winner of **${giveaway.prize}**!`);
    }
};