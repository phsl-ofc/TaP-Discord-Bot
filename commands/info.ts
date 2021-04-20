import Discord from "discord.js";
import assert from "assert";
// info.js
// ========
module.exports = {
    name: "info",
    description: "gets info of a user",
    requireVoice: false,
    async execute(message: Discord.Message, args: string[]) {
        let rMember; // Takes the user mentioned, or the ID of a user
        assert(message.guild);

        try {
            const memberToSearch =
                message.mentions.users.first() ||
                message.guild.members.cache.get(args[0]);
            assert(memberToSearch);
            rMember = message.guild.member(memberToSearch);
        } catch (e) {
            return message.reply("usage: .info <@user | userid>");
        }

        // if there is no user mentioned, or provided, it will say this
        if (!rMember) {
            return message.reply("Who that user? I dunno him.");
        }
        const rUser = rMember.user;
        const micon = `https://cdn.discordapp.com/avatars/${rMember.id}/${rUser.avatar}.jpg`;

        let roles_display;
        try {
            roles_display =
                // @ts-ignore
                rMember._roles
                    // @ts-ignore
                    .map((r) => `${message.guild.roles.cache.get(r).name}`)
                    .join(" | ") || "\u200B";
        } catch (e) {
            roles_display = "\u200B";
        }

        const member_embed = new Discord.MessageEmbed()
            .setDescription("__**Member Information**__")
            .setColor(rMember.displayHexColor)
            .setThumbnail(micon) // Their icon
            .addField("Name", `${rUser.username}#${rUser.discriminator}`)
            .addField("ID", rMember.id) // Their ID
            .addField("Status", rUser.presence.status)
            .addField("Joined at", rMember.joinedAt) // When they joined
            .addField("Roles", roles_display);

        message.channel.send(member_embed);
    },
};
