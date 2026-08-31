const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolemenu')
        .setDescription('Create a button that allows users to claim a specific role')
        .addChannelOption(option => 
            option.setName('target_channel')
                .setDescription('The channel where the role menu will be posted')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('target_role')
                .setDescription('The role users will receive')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The description text for the embed')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('target_channel');
        const role = interaction.options.getRole('target_role');
        const message = interaction.options.getString('message');

        // We embed the specific role ID straight into the button's custom ID
        const embed = new EmbedBuilder()
            .setTitle('🎭 Role Selection')
            .setDescription(`${message}\n\nClick the button below to claim or remove the <@&${role.id}> role.`)
            .setColor('#2B2D31')
            .setFooter({ text: 'Crown Empire Roles', iconURL: interaction.guild.iconURL({ dynamic: true }) });

        const button = new ButtonBuilder()
            .setCustomId(`role_toggle_${role.id}`)
            .setLabel(`Get ${role.name}`)
            .setEmoji('✨')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        await channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: `✅ Role menu successfully sent to <#${channel.id}>!`, flags: 64 });
    }
};