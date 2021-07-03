import assert from "assert";
import Discord from "discord.js";
import * as log from "../utilities/log";
import * as sql from "../utilities/sql";
const config = require("../config.json");

export default async function onVoiceStateUpdate(
    oldMember: Discord.VoiceState,
    newMember: Discord.VoiceState,
) {
    const sessionID = newMember.sessionID ?? oldMember.sessionID;

    // Check if sessionID is valid
    if (!sessionID) {
        log.logToDiscord(
            "voiceStateUpdate: No Session for both states",
            log.WARNING,
        );
        log.logToDiscord(`${{ oldMember, newMember }}`, log.DEBUG);
        return;
    }
    // Assert member is not null
    if (!newMember.member) {
        log.logToDiscord("voiceStateUpdate: Member Exception", log.WARNING);
        return;
    }

    // if a bot
    if (newMember.member.user.bot) return;

    const inVoiceRole = await newMember.guild.roles.fetch(
        config["in_voice_role_id"],
    );

    // send an error if we cant find the role
    if (!inVoiceRole) {
        log.logToDiscord(
            `Cant find role ${config["in_voice_role_id"]}`,
            log.WARNING,
        );
    }

    if (oldMember.channelID !== null && newMember.channelID === null) {
        // leave event
        await sql.dbCloseVoiceLog(
            newMember.member,
            oldMember.channelID,
            sessionID,
        );

        // remove in voice role
        if (inVoiceRole) {
            newMember.member.roles.remove(inVoiceRole);
        }
    } else if (oldMember.channelID === null && newMember.channelID !== null) {
        // Join event
        assert(newMember.channel);
        await sql.dbMakeVoiceLog(
            newMember.member,
            newMember.channelID,
            newMember.channel.name,
            sessionID,
        );

        // add the invoice role
        if (inVoiceRole) {
            newMember.member.roles.add(inVoiceRole);
        }
    } else if (
        oldMember.channelID !== null &&
        newMember.channelID !== null &&
        oldMember.channelID !== newMember.channelID
    ) {
        // switch channels event
        await sql.dbCloseVoiceLog(
            newMember.member,
            oldMember.channelID,
            sessionID,
        );
        assert(newMember.channel);
        await sql.dbMakeVoiceLog(
            newMember.member,
            newMember.channelID,
            newMember.channel.name,
            sessionID,
        );
    }
}
