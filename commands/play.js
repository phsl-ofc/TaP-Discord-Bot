const ytdl = require('ytdl-core');
const config = require('../config.json');
// ranks.js
// ========
module.exports = {
  name: 'play',
  description: 'plays a audio clip',
  execute(message, args) {
    const play_config = config.commands.play; // eslint-disable-line
    args[0] = args[0].toLowerCase();
    if (message.channel.type === 'dm') return;

    // if an argument is given and its valid
    if (args && play_config[args[0]]) {
      const voiceChannel = message.member.voice.channel;

      if (!voiceChannel) {
        return message.reply('please join a voice channel first!');
      }

      message.react('👍');

      // join and play yt audio
      voiceChannel.join().then(connection => {
        const audioLink = play_config[args[0]];
        const stream = ytdl(audioLink, { filter: 'audioonly' });
        const dispatcher = connection.play(stream);

        dispatcher.on('finish', () => voiceChannel.leave());
      });
    }
    else {
      let all_sounds = '';

      // get all current sounds
      for (const sound in play_config) {
        all_sounds += '-' + sound + '\n';
      }

      message.reply('Available sounds:\n' + all_sounds);
    }

    return;
  },
};
