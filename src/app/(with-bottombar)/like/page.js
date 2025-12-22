"use client";
import { useEffect, useState } from "react";
import Header from "~/app/components/Header";
import Sidebar from "~/app/components/Sidebar";
import layout from "~/app/homepage.module.scss";
import styles from "./like.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPlayCircle, faShuffle } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import clsx from "clsx";
import axios from "axios";
import { useBottomBar } from "~/context/BottombarContext";

const processDuration = (seconds) => {
    if (!seconds || seconds == 0) return "0:0";
    const roundupSecond = Math.floor(seconds);
    const minute = Math.floor(roundupSecond / 60);
    const second = roundupSecond % 60;
    return `${minute}:${second}`;
};

const Page = () => {
    const [userData, setUserData] = useState(null);
    const { bottomBarRef, shufflePlaylist } = useBottomBar();

    const handlePlayTrack = async (songId) => {
        const index = userData.likedTracks.findIndex((track) => track._id === songId);
        await bottomBarRef.current.play(songId, "liked-" + userData?._id, index);
    };

    const handlePlayLikedTracks = async () => {
        const idx = shufflePlaylist ? Math.floor(Math.random() * (userData?.likedTracks.length)) : 0;
        await bottomBarRef.current.play(userData?.likedTracks[idx]._id, "liked-" + userData?._id, idx);
    }

    useEffect(() => {
        const getLikedList = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem("userInfo"));
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userData._id}`, {
                    params: {
                        likes: true,
                    },
                    headers: {
                        token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                    },
                });
                setUserData(res.data.data);
            } catch (error) {
                console.log(error);
            }
        };

        getLikedList();
    }, []);

    const renderRow = () => {
        return userData.likedTracks.map((track, index) => (
            <div key={track._id} className={clsx(styles["track-row"])} onClick={() => handlePlayTrack(track._id)}>
                <div className={clsx(styles["col-index"])}>
                    <span className={clsx(styles["number"])}>{index + 1}</span>
                    <span className={clsx(styles["play-icon"])}>
                        <FontAwesomeIcon icon={faPlay} />
                    </span>
                </div>
                <div className={clsx(styles["col-title"], styles["track-info"])}>
                    <img src={track.thumbnailUrl} alt="thumb" />
                    <div className={clsx(styles["track-text"])}>
                        <div className={clsx(styles["track-name"])}>{track.title}</div>
                        <div className={clsx(styles["track-sub"])}>{track.artist}</div>
                    </div>
                </div>
                <div className={clsx(styles["col-album"])}>{track.artist}</div>
                <div className={clsx(styles["col-duration"])}>{processDuration(track.duration)}</div>
            </div>
        ));
    };

    return (
        <main className={layout.background}>
            <Header />
            <Sidebar />
            <div className={styles.pageWrapper}>
                <div className={clsx(styles["playlist-header"])}>
                    <div className={clsx(styles["playlist-cover"])}>
                        <FontAwesomeIcon className={clsx(styles["heart-icon"])} icon={faHeart} />
                    </div>
                    <div className={clsx(styles["playlist-details"])}>
                        <span className={clsx(styles["label"])}>Playlist</span>
                        <h1>Liked Tracks</h1>
                        <div className={clsx(styles["meta"])}>
                            <span className={clsx(styles["username"])}>
                                {userData?.nickname || userData?.username || "Loading"}
                            </span>{" "}
                            • {userData?.likedTracks?.length || 0} tracks
                        </div>
                    </div>
                </div>

                <div className={clsx(styles["action-bar"])}>
                    <button className={clsx(styles["btn-play"])} onClick={handlePlayLikedTracks}>
                        <FontAwesomeIcon icon={faPlay} />
                    </button>
                    <button className={clsx(styles["btn-icon"])}>
                        <FontAwesomeIcon icon={faShuffle} />
                    </button>
                </div>

                <div className={clsx(styles["track-list-header"])}>
                    <div className={clsx(styles["col-index"])}>
                        <span className={clsx(styles["number"])}>#</span>
                    </div>
                    <div className={clsx(styles["col-title"])}>Title</div>
                    <div className={clsx(styles["col-album"])}>Artist</div>
                    <div className={clsx(styles["col-duration"], styles["col-header-duration"])}>
                        <FontAwesomeIcon icon={faClock} />
                    </div>
                </div>

                <div className={clsx(styles["track-list"])}>
                    {userData ? (
                        <>{renderRow()}</>
                    ) : (
                        <span className={clsx(styles["track-details"])}>Songs you like will appear here</span>
                    )}
                </div>
            </div>
        </main>
    );
};

export default Page;
