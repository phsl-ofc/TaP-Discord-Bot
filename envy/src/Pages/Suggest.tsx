import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import { SiGithub } from "react-icons/si";

const useStyles = makeStyles((theme) => {
    return {
        wrapper: {
            textAlign: "center",
            margin: "auto",
        },
        githubButton: {
            background: "black",
            borderRadius: 3,
            border: 0,
            color: "white",
            height: 48,
            padding: "0 30px",
            "&:hover": {
                background: "#5c5c5c",
            },
        },
    };
});

export default function Suggest() {
    const classes = useStyles();

    return (
        <div className={classes.wrapper}>
            <h1>Suggestion Page</h1>
            {/* GitHub button */}
            <a
                style={{ textDecoration: "none" }}
                href="https://github.com/BenPVandenberg/TaP-Discord-Bot/issues"
            >
                <IconButton className={classes.githubButton}>
                    <SiGithub style={{ marginRight: "10px" }} size={36} />{" "}
                    Issue/Suggestion Submission
                </IconButton>
            </a>
        </div>
    );
}
