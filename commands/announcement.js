const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Send a formatted announcement to a specific channel')
        .addChannelOption(option => 
            option.setName('target_channel')
                .setDescription('The channel where the announcement will be posted')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // We grab the channel you selected and embed its ID into the Modal's secret customId
        const targetChannel = interaction.options.getChannel('target_channel');

        const modal = new ModalBuilder()
            .setCustomId(`announce_modal_${targetChannel.id}`)
            .setTitle('Create Announcement');

        const titleInput = new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Announcement Title')
            .setPlaceholder('Ex: Massive Server Update!')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const messageInput = new TextInputBuilder()
            .setCustomId('message')
            .setLabel('Announcement Message')
            .setPlaceholder('Type your full announcement here...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(titleInput);
        const row2 = new ActionRowBuilder().addComponents(messageInput);

        modal.addComponents(row1, row2);
        await interaction.showModal(modal);
    }
};