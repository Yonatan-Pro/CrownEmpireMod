const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Start a new server giveaway')
        .addUserOption(option => 
            option.setName('target_winner')
                .setDescription('Secretly guarantee this user wins (Leave blank for random)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetWinner = interaction.options.getUser('target_winner');
        const winnerId = targetWinner ? targetWinner.id : 'none';

        // We hide the secret winner's ID inside the modal data
        const modal = new ModalBuilder()
            .setCustomId(`giveaway_modal_${winnerId}`)
            .setTitle('Create Giveaway');

        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Duration (Ex: 10m, 2h, 1d)')
            .setPlaceholder('m = minutes, h = hours, d = days')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const winnersInput = new TextInputBuilder()
            .setCustomId('winners')
            .setLabel('Number of Winners')
            .setPlaceholder('Ex: 1')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const prizeInput = new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('Giveaway Prize')
            .setPlaceholder('Ex: 1,000,000 Coins!')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(durationInput);
        const row2 = new ActionRowBuilder().addComponents(winnersInput);
        const row3 = new ActionRowBuilder().addComponents(prizeInput);

        modal.addComponents(row1, row2, row3);
        await interaction.showModal(modal);
    }
};