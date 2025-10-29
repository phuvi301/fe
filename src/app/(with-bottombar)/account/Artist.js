"use client";
import { faPlay, faShare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useBottomBar } from "~/context/BottombarContext";
import styles from "./Account.module.css";
import Image from "next/image";
import axios from "axios";


function Artist() {
    const [uploadedSongs, setUploadedSongs] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const { bottomBarRef } = useBottomBar();

    const handleTrackPlay = async (trackId) => {
        await bottomBarRef.current.chooseTrack(trackId);
        await bottomBarRef.current.fetchLyrics(trackId);
        bottomBarRef.current.saveProgressToRedis();
    };

    const fetchTracks = async (user) => {
        try {
            const tracksRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user._id}?tracks=true`);
            console.log("Uploaded songs:", tracksRes.data.data.tracks);
            setUploadedSongs(tracksRes.data.data.tracks);
        } catch (err) {
            console.error("Lỗi khi tải bài hát:", err);
        }
    };

    const handleDeleteTrack = async (trackId) => {
        if(!confirm("Are you sure you want to delete this track?")) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${trackId}`, {
                headers: {
                    token: `Bearer ${document.cookie.split('accessToken=')[1]}`,
                },
                withCredentials: true,
            });
            // Cập nhật lại danh sách bài hát sau khi xóa
            fetchTracks(userInfo);
        } catch (err) {
            console.error("Lỗi khi xóa bài hát:", err);
        }
    };

    useEffect(() => {
        // Fetch bài hát và playlist khi component được mount
        setUserInfo(JSON.parse(localStorage.getItem("userInfo"))); // Lấy thông tin user từ localStorage
    }, []);

    useEffect(() => {
        if (!userInfo) return;
        fetchTracks(userInfo);
    }, [userInfo]);

    return (
        <>
            <div className={styles["personal-info-wrapper"]}>
                <Image
                    src={userInfo?.avatar || "/hcmut.png"}
                    alt=""
                    width={600}
                    height={600}
                    loading="eager"
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
                        <div className={styles["personal-upload-item"]} key={track._id} onClick={() => handleTrackPlay(track._id)}>
                            <div className={styles["personal-upload-item-overlay"]}>
                                <Image
                                    src={track.thumbnailUrl || "/background.jpg"}
                                    width={600}
                                    height={600}
                                    alt=""
                                    className={styles["personal-upload-item-image"]}
                                />
                                <button className={styles["personal-upload-item-play-btn"]}>
                                    <FontAwesomeIcon icon={faPlay} />
                                </button>
                                <button className={styles["personal-upload-item-delete-btn"] } onClick={(e) => { e.stopPropagation(); handleDeleteTrack(track._id); }}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                            <span className={styles["personal-upload-item-name"]}>{track.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Artist;
