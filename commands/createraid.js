const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createraid')
        .setDescription('Announce a new boss raid to the server')
        .addStringOption(option => 
            option.setName('boss')
                .setDescription('The name of the boss being raided')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('tokens')
                .setDescription('The number of tokens required or rewarded')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('time')
                .setDescription('When it starts (Ex: 30m, 2h, 1d)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const boss = interaction.options.getString('boss');
        const tokens = interaction.options.getInteger('tokens');
        const timeString = interaction.options.getString('time').toLowerCase().trim();

        // Parse the time just like our giveaway command
        let durationMinutes = parseInt(timeString);
        if (timeString.endsWith('h')) durationMinutes *= 60;
        else if (timeString.endsWith('d')) durationMinutes *= (60 * 24);

        if (isNaN(durationMinutes)) {
            return interaction.reply({ content: '❌ Please enter a valid time format (Ex: 30m, 2h, 1d)!', flags: 64 });
        }

        const raidTime = new Date(Date.now() + durationMinutes * 60 * 1000);
        const unixTime = Math.floor(raidTime.getTime() / 1000);

        const raidEmbed = new EmbedBuilder()
            .setAuthor({ name: '⚔️ Raid Event Scheduled!' })
            .setTitle(`Boss: ${boss}`)
            .setDescription(`A new raid is starting soon! Gear up and get ready.`)
            .addFields(
                { name: '🎟️ Tokens', value: `**${tokens}**`, inline: true },
                // The :F flag shows the full local date/time, the :R flag shows a live countdown
                { name: '⏰ Starts At', value: `<t:${unixTime}:F>\n(<t:${unixTime}:R>)`, inline: true },
                { name: '👑 Hosted By', value: `${interaction.user}`, inline: true }
            )
            .setColor('#8B0000') // Dark Blood Red
            .setThumbnail(interaction.guild?.iconURL({ dynamic: true }) || null)
            .setFooter({ text: 'Crown Empire Raids' })
            .setTimestamp();

        await interaction.reply({ embeds: [raidEmbed] });
    }
};