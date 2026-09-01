const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createraid')
        .setDescription('Open the raid menu to announce a new boss raid')
        .addChannelOption(option => 
            option.setName('target_channel')
                .setDescription('The channel where the raid will be posted')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('target_channel');

        const modal = new ModalBuilder()
            // Hide the channel ID in the custom ID just like the announcement command
            .setCustomId(`raid_modal_${targetChannel.id}`)
            .setTitle('Create Boss Raid');

        const bossInput = new TextInputBuilder()
            .setCustomId('boss')
            .setLabel('Boss Name')
            .setPlaceholder('Ex: The Ice Dragon')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const tokensInput = new TextInputBuilder()
            .setCustomId('tokens')
            .setLabel('Tokens Required / Rewarded')
            .setPlaceholder('Ex: 500')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const timeInput = new TextInputBuilder()
            .setCustomId('time')
            .setLabel('Time (Ex: 15m, OR 2026-09-01 15:30)')
            .setPlaceholder('Use duration (2h) or exact format (YYYY-MM-DD HH:MM)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(bossInput);
        const row2 = new ActionRowBuilder().addComponents(tokensInput);
        const row3 = new ActionRowBuilder().addComponents(timeInput);

        modal.addComponents(row1, row2, row3);
        await interaction.showModal(modal);
    }
};