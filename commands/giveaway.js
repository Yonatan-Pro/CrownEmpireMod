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

        const modal = new ModalBuilder()
            .setCustomId(`giveaway_modal_${winnerId}`)
            .setTitle('Create Giveaway');

        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Duration (Ex: 10m, 2h, 1d)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const winnersInput = new TextInputBuilder()
            .setCustomId('winners')
            .setLabel('Number of Winners')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const prizeInput = new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('Giveaway Prize')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // NEW: Optional Requirements
        const reqMessagesInput = new TextInputBuilder()
            .setCustomId('req_messages')
            .setLabel('Required Messages (Optional)')
            .setPlaceholder('Ex: 20 (Leave blank for none)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const reqInvitesInput = new TextInputBuilder()
            .setCustomId('req_invites')
            .setLabel('Required Invites (Optional)')
            .setPlaceholder('Ex: 1 (Leave blank for none)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const row1 = new ActionRowBuilder().addComponents(durationInput);
        const row2 = new ActionRowBuilder().addComponents(winnersInput);
        const row3 = new ActionRowBuilder().addComponents(prizeInput);
        const row4 = new ActionRowBuilder().addComponents(reqMessagesInput);
        const row5 = new ActionRowBuilder().addComponents(reqInvitesInput);

        modal.addComponents(row1, row2, row3, row4, row5);
        await interaction.showModal(modal);
    }
};