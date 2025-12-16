"use client";

import { useRef, useEffect, useState } from "react";
import layout from "~/app/homepage.module.css";
import styles from "./play.module.css";
import { Virtuoso } from "react-virtuoso";
import Header from "../../components/Header";
import { useBottomBar } from "~/context/BottombarContext";
import Sidebar from "~/app/components/Sidebar";
import clsx from "clsx";

export default function Home() {
    const { bottomBarRef, nowPlaying, playlistPlaying, shufflePlaylist } = useBottomBar();

    // const [collapsed, setCollapsed] = useState(false);

    // useEffect(() => {
    //     const savedCollapsed = localStorage.getItem("Collapsing");
    //     if (savedCollapsed !== null) {
    //         setCollapsed(JSON.parse(savedCollapsed));
    //     }
    // }, []);

    // useEffect(() => {
    //     localStorage.setItem("Collapsing", JSON.stringify(collapsed));
    // }, [collapsed]);


    // console.log(bottomBarRef.current?.shuffle)
    const list = shufflePlaylist && playlistPlaying ? shufflePlaylist : playlistPlaying?.tracks;

    const getIndex = (targetID, weight) => {
        return (list?.findIndex((track) => track._id === targetID) ?? 0) + weight;
    }

    const toggleTrack = async (trackId) => {
        const index = getIndex(nowPlaying.current._id, 0);
        await bottomBarRef.current.play(trackId, playlistPlaying._id, index);
    };

    const totalCount = Math.max(0, (list?.length ?? 0) - (list?.findIndex((song) => song._id === nowPlaying.current?._id) ?? 0) - 1);

    const listSong = ({ index, style }) => {
        const song = list?.[index + getIndex(nowPlaying.current._id, 1)];
        return (
            <div style={style} className={styles["listSong"]} onClick={async () => await toggleTrack(song._id)}>
                <img src="/play.png" className={clsx(styles["play-button"], styles["no-select"])} />
                <button className={styles["next-song-queue"]}>
                    <div className={styles["song-in-queue"]}>
                        <div className={styles["mini-thumbnail"]}>
                            <img src={song?.thumbnailUrl} className={clsx(styles["cover"], styles["no-select"])} />
                        </div>
                        <div className={styles["song-detail"]}>
                            <div className={styles["song-name-queue"]}>
                                <div className={clsx(styles["bold-text"], styles["no-select"])}>{song?.title}</div>
                            </div>
                            <div className={clsx(styles["artist-name-queue"], styles["no-select"])}>{song?.artist}</div>
                        </div>
                    </div>
                </button>
            </div>
        );
    };

    return (
        <div className={layout.background}>
            <Sidebar/>
            <Header />
            <div className={styles["child"]}>
                <div className={styles["queue-container"]}>
                    <div className={styles["is-playing-container"]}>
                        <div className={styles["playing-text"]}>
                            <div className={clsx(styles["bold-text"], styles["no-select"])}>Playing</div>
                        </div>
                        <div className={styles["playing-song-container"]}>
                            <img src="/play.png" className={clsx(styles["play-button2"], styles["no-select"])} />
                            <button className={styles["playing-song-queue"]}>
                                <div className={styles["song-in-queue"]}>
                                    <div className={styles["mini-thumbnail"]}>
                                        <img
                                            src={nowPlaying.current?.thumbnailUrl}
                                            className={clsx(styles["cover"], styles["no-select"])}
                                        />
                                    </div>
                                    <div className={styles["song-detail"]}>
                                        <div className={styles["song-name-queue"]}>
                                            <div className={clsx(styles["bold-text"], styles["no-select"])}>
                                                {nowPlaying.current?.title}
                                            </div>
                                        </div>
                                        <div className={clsx(styles["artist-name-queue"], styles["no-select"])}>
                                            {nowPlaying.current?.artist}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className={styles["next-song-list"]}>
                        <div className={styles["next-text"]}>
                            <div className={clsx(styles["bold-text"], styles["no-select"])}>Next</div>
                        </div>
                        <div className={styles["list-song-container"]}>
                            <Virtuoso
                                style={{ height: "100%", width: "100%", overflow: "overlay" }}
                                totalCount={totalCount}
                                itemContent={(index) => listSong({ index })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
