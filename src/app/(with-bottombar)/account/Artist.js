"use client";
import { faPlay, faShare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useBottomBar } from "~/context/BottombarContext";
import styles from "./Account.module.css";
import ConfirmModal from "~/app/components/ConfirmModal";
import Image from "next/image";
import axios from "axios";


function Artist() {
    const [uploadedSongs, setUploadedSongs] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [deleteTrackId, setDeleteTrackId] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const { bottomBarRef } = useBottomBar();

    const toggleTrack = async (trackId) => {
        await bottomBarRef.current.play(trackId);
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

    const fetchUserInfo = async () => {
        try {
            const storedUserInfo = JSON.parse(localStorage.getItem("userInfo"));
            if (!storedUserInfo) return;

            const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${storedUserInfo._id}`);
            const updatedUserInfo = userRes.data.data;
            
            localStorage.removeItem("artistFollowerCounts");
            localStorage.removeItem("followAdjustments");
            
            localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
            setUserInfo(updatedUserInfo);
        } catch (err) {
            console.error("Lỗi khi tải thông tin user:", err);
            setUserInfo(JSON.parse(localStorage.getItem("userInfo")));
        }
    };

    const handleDeleteTrack = async (trackId) => {
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
        } finally {
            setDeleteTrackId(null);
            setIsConfirmOpen(false);
        }
    };

    useEffect(() => {
        // Fetch thông tin user mới nhất khi component được mount
        fetchUserInfo();
    }, []);

    useEffect(() => {
        if (!userInfo) return;
        fetchTracks(userInfo);
    }, [userInfo]);

    return (
        <>
            <div className={styles["personal-info-wrapper"]}>
                <Image
                    src={userInfo?.thumbnailUrl || "/hcmut.png"}
                    alt=""
                    width={600}
                    height={600}
                    loading="eager"
                    className={styles["personal-info-image"]}
                />
                <div className={styles["personal-name-group"]}>
                    <h4 className={styles["personal-name"]}>{userInfo?.nickname || userInfo?.username || userInfo?.email}</h4>
                    <p className={styles["personal-bio"]}>{userInfo?.bio}</p>
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
                        <div className={styles["personal-upload-item"]} key={track._id} onClick={() => toggleTrack(track._id)}>
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
                                <button
                                    className={styles["personal-upload-item-delete-btn"]}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // handleDeleteTrack(track._id);
                                        setDeleteTrackId(track._id);
                                        setIsConfirmOpen(true);
                                    }}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                            <span className={styles["personal-upload-item-name"]}>{track.title}</span>
                        </div>
                    ))}
                    <ConfirmModal
                        isOpen={isConfirmOpen && !!deleteTrackId}
                        onClose={() => { // Đóng khi bấm Hủy
                            setDeleteTrackId(null);
                            setIsConfirmOpen(false)}
                        }                     
                        onConfirm={() => handleDeleteTrack(deleteTrackId)}    // Chạy hàm xóa khi bấm Yes     
                        title="Delete Track"
                        message="Are you sure you want to delete this track? This action cannot be undone."
                    />
                </div>
            </div>
        </>
    );
}

export default Artist;
