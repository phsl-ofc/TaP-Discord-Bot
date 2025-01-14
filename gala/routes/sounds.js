const express = require("express");
const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const sql = require("../utilities/sql");
const fetch = require("node-fetch");

const router = express.Router();

/* GET sounds listing. */
router.get(
    "/",
    asyncHandler(async (req, res, next) => {
        const rtnDataArr = [];
        const [rows] = await sql.query("SELECT * FROM Discord_Bot.SoundStats;");
        if (rows.length === 0) {
            res.status(400).send({ msg: "DB reporting no sounds" });
            return;
        }

        rows.forEach((element) => {
            rtnDataArr.push({
                name: element.SoundName,
                occurrences: element.Occurrences,
                ownerID: element.OwnerID,
                ownerName: element.OwnerName,
                volume: element.Volume,
                hidden: element.isHidden === 1,
            });
        });

        res.status(200).send(rtnDataArr);
    })
);

// update the properties of a sound
// can update volume or isHidden
router.put(
    "/:soundName",
    asyncHandler(async (req, res, next) => {
        const { soundName } = req.params;
        const { user: userID, volume, hidden } = req.body;

        // verify that all parameters are provided
        if (
            !userID === undefined &&
            !volume === undefined &&
            !hidden === undefined
        ) {
            return res
                .status(400)
                .send({ msg: "Missing user + volume and/or hidden in body" });
        }
        if (userID === undefined) {
            return res.status(400).send({ msg: "Missing user in body" });
        }
        if (!volume === undefined && !hidden === undefined) {
            return res
                .status(400)
                .send({ msg: "Missing volume and/or hidden in body" });
        }

        // verify user is an admin
        const [validUsers] = await sql.query(
            "SELECT UserID FROM Discord_Bot.User where isAdmin = true;"
        );
        const userIsValid = validUsers.some((el) => el.UserID === userID);

        if (!userIsValid) {
            return res
                .status(401)
                .send({ msg: "You are not authorized to update sounds" });
        }

        let sqlResponse;

        // make change to database
        if (volume !== undefined && hidden !== undefined) {
            [sqlResponse] = await sql.query(
                "UPDATE Sound SET Volume = ?, isHidden = ? WHERE (SoundName = ?);",
                [volume, hidden == true ? 1 : 0, soundName] // eslint-disable-line eqeqeq
            );
        } else if (volume !== undefined) {
            [sqlResponse] = await sql.query(
                "UPDATE Sound SET Volume = ? WHERE (SoundName = ?);",
                [volume, soundName]
            );
        } else if (hidden !== undefined) {
            [sqlResponse] = await sql.query(
                "UPDATE Sound SET isHidden = ? WHERE (SoundName = ?);",
                [hidden == true ? 1 : 0, soundName] // eslint-disable-line eqeqeq
            );
        }

        // check changes were made
        if (!sqlResponse.affectedRows) {
            res.status(404).send({ msg: "Sound doesn't exist" });
        }

        res.status(200).send();
    })
);

// upload a new sound to the bot
router.post(
    "/upload",
    asyncHandler(async (req, res, next) => {
        if (!req.files) {
            return res.status(400).send({ msg: "No file was uploaded" });
        }

        // accessing the file
        const myFile = req.files.file;
        const userID = req.body.user;

        if (!userID) {
            return res.status(401).send({ msg: "Must provide a user ID" });
        }

        const [validUsers] = await sql.query(
            "SELECT UserID FROM Discord_Bot.User;"
        );

        // eslint-disable-next-line eqeqeq
        const userIsValid = validUsers.some((el) => el.UserID == userID);
        if (!userIsValid) {
            return res
                .status(401)
                .send({ msg: "You are not authorized to upload sounds" });
        }

        // verify the file is valid
        if (!myFile.name.endsWith(".mp3") || myFile.mimetype !== "audio/mpeg") {
            return res.status(415).send({
                msg: "File uploaded isn't a correct format. Must be a .mp3 file",
            });
        }

        // check for spaces (it can't be played by the bot)
        if (myFile.name.indexOf(" ") !== -1) {
            return res
                .status(400)
                .send({ msg: "Spaces aren't permitted in the filename" });
        }

        const fullFilePath = path.join(
            process.env.SOUNDS_DIR,
            myFile.name.toLowerCase()
        );

        // check if file already exists
        if (fs.existsSync(fullFilePath)) {
            return res.status(400).send({ msg: "That file already exists" });
        }

        const localName = myFile.name.slice(0, -4).toLowerCase();
        // add sound to the db
        try {
            await sql.query(
                `INSERT INTO Sound (SoundName, UploadDate, Owner) VALUES (?, CONVERT_TZ(NOW(), 'UTC', 'America/New_York'), ?);`,
                [localName, userID || null]
            );
        } catch (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res
                    .status(409)
                    .send({ msg: "That file already exists in the database" });
            }
        }

        // all checks are done now to add the sound
        // mv() method places the file inside public directory
        myFile.mv(fullFilePath, (err) => {
            if (err) {
                return res.status(500).send({
                    msg: "Error occurred: Unable to move file to bot dir",
                });
            }
        });

        // Successful upload

        // log to discord webhook
        fetch(process.env.DISCORD_LOG_WEBHOOK, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: `New sound uploaded: ${localName}`,
                username: "T&P Web App Logs",
                // eslint-disable-next-line camelcase
                avatar_url:
                    "https://icons-for-free.com/iconfiles/png/512/info-131964752893297302.png",
            }),
        });

        // returning the response with file name
        return res.status(201).send({
            fileName: myFile.name.toLowerCase(),
            name: localName,
        });
    })
);

module.exports = router;
