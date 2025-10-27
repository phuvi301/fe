"use client";
import { faPlay, faShare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useBottomBar } from "~/context/BottombarContext";
import styles from "./Account.module.css";
import Image from "next/image";
import axios from "axios";


function Artist() {
    const [uploadedSongs, setUploadedSongs] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const { bottomBarRef } = useBottomBar();

    const handleTrackPlay = async (trackId) => {
        await bottomBarRef.current.playTrack(trackId);
    };

    const fetchTracks = async (user) => {
        try {
            const tracksRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/tracks`, { ids: user.tracks })
            setUploadedSongs(tracksRes.data.data);
        } catch (err) {
            console.error("Lỗi khi tải bài hát:", err);
        }
    };

    const fetchPlaylists = async (user) => {
        try {
            const playlistsRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/playlists`, { ids: user.playlists });
            setPlaylists(playlistsRes.data.data);
        } catch (err) {
            console.error("Lỗi khi tải playlist:", err);
        }
    };

    useEffect(() => {
        // Fetch bài hát và playlist khi component được mount
        setUserInfo(JSON.parse(localStorage.getItem("userInfo"))); // Lấy thông tin user từ localStorage
    }, []);

    useEffect(() => {
        if (!userInfo) return;
        fetchTracks(userInfo);
        fetchPlaylists(userInfo);
    }, [userInfo]);

    return (
        <>
            <div className={styles["personal-info-wrapper"]}>
                <Image
                    src={"/song/11.jpg"}
                    alt=""
                    width={100}
                    height={100}
                    className={styles["personal-info-image"]}
                />
                <div className={styles["personal-name-group"]}>
                    <h4 className={styles["personal-name"]}>{userInfo?.nickname || userInfo?.username || userInfo?.email}</h4>
                    <p className={styles["personal-follower"]}>Follower: {userInfo?.followerCount}</p>
                    <p className={styles["personal-follower"]}>Following: {userInfo?.followingCount}</p>
                </div>
                <button className={styles["personal-share-btn"]}>
                    <FontAwesomeIcon icon={faShare} className={styles["button-icon"]} />
                    <span className={styles["button-info"]}>Share</span>
                </button>
            </div>
            <div className={styles["personal-upload-wrapper"]}>
                <p className={styles["personal-upload-title"]}>Your Uploaded Songs</p>
                <div className={styles["personal-upload-list"]}>
                    {uploadedSongs?.map((track) => (
                        <div className={styles["personal-upload-item"]} key={track._id}>
                            <Image
                                src={track.thumbnailUrl || "/background.jpg"}
                                width={100}
                                height={100}
                                alt=""
                                className={styles["personal-upload-item-image"]}
                            />
                            <span className={styles["personal-upload-item-name"]}>{track.title}</span>
                            <button className={styles["personal-upload-item-play-btn"]} onClick={() => handleTrackPlay(track._id)}>
                                <FontAwesomeIcon icon={faPlay} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles["personal-playlist-wrapper"]}>
                <p className={styles["personal-playlist-title"]}>Your Playlists</p>
                <div className={styles["personal-playlist-list"]}>
                    {playlists?.map((playlist) => (
                        <div className={styles["personal-playlist-item"]} key={playlist._id}>
                            <Image
                                src={playlist.thumbnailUrl || "/background.jpg"}
                                width={100}
                                height={100}
                            alt=""
                            className={styles["personal-playlist-item-image"]}
                        />
                        <div className={styles["personal-playlist-item-content"]}>
                            <button className={styles["personal-playlist-item-play-btn"]}>
                                <FontAwesomeIcon icon={faPlay} />
                            </button>
                            <div className={styles["personal-playlist-item-info"]}>
                                <span className={styles["personal-playlist-item-name"]}>{playlist.title}</span>
                            </div>
                            <div className={styles["playlist-item-wrapper"]}>
                                <div className={styles["playlist-item"]}>
                                    <Image
                                        src={"/background.jpg"}
                                        width={100}
                                        height={100}
                                        alt=""
                                        className={styles["playlist-item-image"]}
                                    />
                                    <button className={styles["playlist-item-play-btn"]}>
                                        <FontAwesomeIcon icon={faPlay} />
                                    </button>
                                    <span className={styles["playlist-item-name"]}>item name</span>
                                </div>
                                <div className={styles["playlist-item"]}>
                                    <Image
                                        src={"/background.jpg"}
                                        width={100}
                                        height={100}
                                        alt=""
                                        className={styles["playlist-item-image"]}
                                    />
                                    <button className={styles["playlist-item-play-btn"]}>
                                        <FontAwesomeIcon icon={faPlay} />
                                    </button>
                                    <span className={styles["playlist-item-name"]}>item name</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Artist;
