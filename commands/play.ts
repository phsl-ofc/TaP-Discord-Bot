import fs from "fs";
import Discord from "discord.js";
import assert from "assert";
import * as sql from "../utilities/sql";
// ranks.js
// ========
module.exports = {
    name: "play",
    description: "plays a audio clip",
    requireVoice: true,
    async execute(message: Discord.Message, args: string[]) {
        const all_sounds = fs.readdirSync("./audio");

        // put arg to lowercase if it exists
        try {
            args[0] = args[0].toLowerCase();
            assert(message.member);

            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) {
                return message.reply("please join a voice channel first!");
            }

            // check if file exists
            if (!fs.existsSync(`./audio/${args[0]}.mp3`)) {
                throw "not a valid sound";
            }

            message.react("👍");

            // join and play yt audio
            await voiceChannel.join().then((connection) => {
                const dispatcher = connection.play(`./audio/${args[0]}.mp3`);
                dispatcher.on("finish", () => voiceChannel.leave());
            });

            // sound played successfully, therefore update database
            sql.dbMakeSoundLog(args[0], message.member);
        } catch (e) {
            let sound_list = "";
            const hidden_sounds = ["stfu0", "stfu1", "stfu2", "timeout"];

            // get all current sounds
            for (const sound in all_sounds) {
                const cur_sound = all_sounds[sound].slice(0, -4);

                if (!hidden_sounds.includes(cur_sound)) {
                    sound_list += "-" + cur_sound + "\n";
                }
            }

            assert(message.member);
            const member_embed = new Discord.MessageEmbed()
                .setTitle("__**Available sounds**__")
                .setDescription(sound_list)
                .setColor(message.member.displayHexColor)
                .setThumbnail(
                    "https://img2.pngio.com/white-speaker-icon-computer-icons-sound-symbol-audio-free-png-audio-clips-png-910_512.png",
                ); // Their icon

            message.channel.send(member_embed);
        }
    },
};
