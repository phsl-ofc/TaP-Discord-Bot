import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import SoundTable from "../Components/SoundTable";
import SoundUpload from "../Components/SoundUpload";

type Sound = {
    name: string;
    occurrences: number;
    ownerID: number | null;
    ownerName: string;
};

const useStyles = makeStyles((theme) => {
    return {
        wrapper: {
            textAlign: "center",
            margin: "auto",
        },
        pageHeader: {
            paddingBottom: "10px",
        },
    };
});

export default function Sounds() {
    const [allSounds, setAllSounds] = useState<Sound[]>([]);

    const updateSounds = async () => {
        const newAllSounds: Sound[] = [];
        let sounds: any;
        let soundData: any; // res responce

        // get /play statistics
        await axios
            .get("https://api.tandp.me/data/play")
            .then((res) => {
                soundData = res.data;
            })
            .catch((err) => {
                Swal.fire({
                    title: "Error with the server: GET /data/play",
                    text:
                        err.response.data.msg ||
                        `HTTP Code ${err.response.status}`,
                    icon: "error",
                });
            });

        // get all available sounds
        await axios
            .get("https://api.tandp.me/sounds")
            .then((res) => {
                sounds = res.data;
            })
            .catch((err) => {
                Swal.fire({
                    title: "Error with the server: GET /sounds",
                    text:
                        err.response.data.msg ||
                        `HTTP Code ${err.response.status}`,
                    icon: "error",
                });
            });

        // if we have data for a song then update allSounds
        sounds.forEach((sound: string) => {
            sound = sound.slice(0, -4);
            if (soundData[sound] === undefined) soundData[sound] = {};

            newAllSounds.push({
                name: sound,
                occurrences: soundData[sound]["occurrences"] ?? 0,
                ownerID: soundData[sound]["ownerID"] ?? null,
                ownerName: soundData[sound]["ownerName"] ?? "",
            });
        });

        // sort by highest frequency
        newAllSounds.sort((a, b) => b.occurrences - a.occurrences);

        setAllSounds(newAllSounds);
    };

    // run on mount
    useEffect(() => {
        updateSounds();
    }, []); // * This empty array makes useEffect act like componentDidMount

    const classes = useStyles();

    return (
        <div className={classes.wrapper}>
            <h1 className={classes.pageHeader}>Sounds</h1>
            <Grid container direction="row" justify="center" spacing={5}>
                <Grid item>
                    <SoundTable sounds={allSounds} />
                </Grid>
                <Grid item>
                    <SoundUpload />
                </Grid>
            </Grid>
        </div>
    );
}
