"use client";
import { faPlay, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useBottomBar } from "~/context/BottombarContext";
import styles from "./Account.module.css";
import ConfirmModal from "~/app/components/ConfirmModal";
import axios from "axios";

// Helper lấy token
const getAccessToken = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
    return match ? match[2] : null;
};

function Artist() {
    const [uploadedSongs, setUploadedSongs] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Delete states
    const [deleteTrackId, setDeleteTrackId] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    const { bottomBarRef } = useBottomBar();

    const toggleTrack = async (trackId) => {
        await bottomBarRef.current.play(trackId);
    };

    const fetchData = async () => {
        try {
            // Lấy userInfo từ localStorage để có ID
            const storedInfo = localStorage.getItem("userInfo");
            if (!storedInfo) return;
            
            const parsedUser = JSON.parse(storedInfo);
            
            // Gọi song song: Lấy info mới nhất VÀ lấy danh sách bài hát
            // Lưu ý: Nếu user._id không đổi thì không cần fetch lại user info nếu không cần thiết, 
            // nhưng để sync follow count thì nên fetch.
            const [userRes, tracksRes] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${parsedUser._id}`),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${parsedUser._id}?tracks=true`)
            ]);

            setUserInfo(userRes.data.data);
            setUploadedSongs(tracksRes.data.data.tracks || []);

            // Sync lại localStorage với info mới nhất
            localStorage.setItem("userInfo", JSON.stringify(userRes.data.data));

        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteTrack = async (trackId) => {
        try {
            const token = getAccessToken();
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${trackId}`, {
                headers: { token: `Bearer ${token}` },
                withCredentials: true,
            });
            // Update UI bằng cách lọc mảng local (nhanh hơn gọi lại API)
            setUploadedSongs(prev => prev.filter(t => t._id !== trackId));
        } catch (err) {
            console.error("Error deleting track:", err);
            alert("Failed to delete track");
        } finally {
            setDeleteTrackId(null);
            setIsConfirmOpen(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <>
            <div className={styles["personal-info-wrapper"]}>
                <img
                    src={userInfo?.thumbnailUrl || "/hcmut.png"}
                    alt="Avatar"
                    className={styles["personal-info-image"]}
                />
                <div className={styles["personal-name-group"]}>
                    <h4 className={styles["personal-name"]}>{userInfo?.nickname || userInfo?.username || "Unknown"}</h4>
                    <p className={styles["personal-bio"]}>{userInfo?.bio || "No bio yet."}</p>
                    <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
                        <p className={styles["personal-follower"]}><strong>{userInfo?.followerCount || 0}</strong> Followers</p>
                        <p className={styles["personal-follower"]}><strong>{userInfo?.followingCount || 0}</strong> Following</p>
                    </div>
                </div>
            </div>

            <div className={styles["personal-upload-wrapper"]}>
                <p className={styles["personal-upload-title"]}>Your Uploaded Songs ({uploadedSongs.length})</p>
                <div className={styles["personal-upload-list"]}>
                    {uploadedSongs.length === 0 && <p style={{color: '#999'}}>You haven't uploaded any songs yet.</p>}
                    
                    {uploadedSongs.map((track) => (
                        <div className={styles["personal-upload-item"]} key={track._id} onClick={() => toggleTrack(track._id)}>
                            <div className={styles["personal-upload-item-overlay"]}>
                                <img
                                    src={track.thumbnailUrl || "/background.jpg"}
                                    alt=""
                                    className={styles["personal-upload-item-image"]}
                                    loading="lazy"
                                />
                                <button className={styles["personal-upload-item-play-btn"]}>
                                    <FontAwesomeIcon icon={faPlay} />
                                </button>
                                <button
                                    className={styles["personal-upload-item-delete-btn"]}
                                    onClick={(e) => {
                                        e.stopPropagation();
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
                        onClose={() => {
                            setDeleteTrackId(null);
                            setIsConfirmOpen(false);
                        }}                     
                        onConfirm={() => handleDeleteTrack(deleteTrackId)}         
                        title="Delete Track"
                        message="Are you sure you want to delete this track? This action cannot be undone."
                    />
                </div>
            </div>
        </>
    );
}

export default Artist;