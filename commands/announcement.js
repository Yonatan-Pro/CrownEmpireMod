const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Send a premium announcement to a specific channel')
        .addChannelOption(option => 
            option.setName('target_channel')
                .setDescription('The channel where the announcement will be posted')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('ping')
                .setDescription('Who do you want to notify?')
                .setRequired(false)
                .addChoices(
                    { name: 'Don\'t ping anyone', value: 'none' },
                    { name: 'Ping @everyone', value: 'everyone' },
                    { name: 'Ping @here', value: 'here' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('target_channel');
        const pingChoice = interaction.options.getString('ping') || 'none';

        // We hide BOTH the channel ID and the ping choice inside the custom ID!
        const modal = new ModalBuilder()
            .setCustomId(`announce_modal_${targetChannel.id}_${pingChoice}`)
            .setTitle('Create Server Announcement');

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

        const imageInput = new TextInputBuilder()
            .setCustomId('image_url')
            .setLabel('Banner Image URL (Optional)')
            .setPlaceholder('Paste a link to an image or GIF ending in .png/.gif')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const row1 = new ActionRowBuilder().addComponents(titleInput);
        const row2 = new ActionRowBuilder().addComponents(messageInput);
        const row3 = new ActionRowBuilder().addComponents(imageInput);

        modal.addComponents(row1, row2, row3);
        await interaction.showModal(modal);
    }
};