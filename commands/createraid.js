const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createraid')
        .setDescription('Open the raid menu to announce a new boss raid')
        .addChannelOption(option => 
            option.setName('target_channel')
                .setDescription('The channel where the raid will be posted')
                .setRequired(true)),
        // The Administrator lock was removed from here so Raid Hosts can see the command

    async execute(interaction) {
        // --- SECURITY CHECK ---
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const isRaidHost = interaction.member.roles.cache.some(role => role.name.toLowerCase() === 'raid host');

        if (!isAdmin && !isRaidHost) {
            return interaction.reply({ content: '❌ You must be an Administrator or have the **Raid host** role to start a raid!', flags: 64 });
        }

        // --- COMMAND LOGIC ---
        const targetChannel = interaction.options.getChannel('target_channel');

        const modal = new ModalBuilder()
            .setCustomId(`raid_modal_${targetChannel.id}`)
            .setTitle('Create Boss Raid');

        const bossInput = new TextInputBuilder()
            .setCustomId('boss')
            .setLabel('Boss Name')
            .setPlaceholder('Ex: Kor')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const tokensInput = new TextInputBuilder()
            .setCustomId('tokens')
            .setLabel('Tokens Required / Rewarded')
            .setPlaceholder('Ex: 100000')
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