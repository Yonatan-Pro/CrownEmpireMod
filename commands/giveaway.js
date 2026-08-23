const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Open the giveaway creation form')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('giveaway_modal')
            .setTitle('Create a Giveaway');

        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Duration (Ex: 10m, 2h, 1d)')
            .setPlaceholder('m = minutes, h = hours, d = days')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const winnersInput = new TextInputBuilder()
            .setCustomId('winners')
            .setLabel('Number of Winners')
            .setValue('1')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const prizeInput = new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('Prize')
            .setPlaceholder('What are you giving away?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description')
            .setPlaceholder('Optional details about the giveaway')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const row1 = new ActionRowBuilder().addComponents(durationInput);
        const row2 = new ActionRowBuilder().addComponents(winnersInput);
        const row3 = new ActionRowBuilder().addComponents(prizeInput);
        const row4 = new ActionRowBuilder().addComponents(descInput);

        modal.addComponents(row1, row2, row3, row4);
        await interaction.showModal(modal);
    },
};