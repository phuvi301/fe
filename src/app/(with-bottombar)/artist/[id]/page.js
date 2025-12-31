'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import clsx from 'clsx';
import { useBottomBar } from '~/context/BottombarContext';
import Sidebar from "../../../components/Sidebar";
import Header from '../../../components/Header';
import layout from "~/app/homepage.module.scss";
import style from "./artist.module.css";

// --- Helper Functions ---

// Lấy token an toàn hơn việc split chuỗi thủ công
const getAccessToken = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
    return match ? match[2] : null;
};

// Format số (1.000.000)
const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num || 0);

// Format thời lượng (mm:ss)
const formatDuration = (seconds) => {
    const total = Number(seconds);
    if (!Number.isFinite(total) || total <= 0) return "--:--";
    const min = Math.floor(total / 60);
    const sec = Math.floor(total % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
};

// Hàm lấy duration từ Audio object (Fallback nếu backend không trả về)
const fetchAudioDuration = (url) => {
    return new Promise((resolve) => {
        if (!url) return resolve(0);
        const audio = new Audio(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${url}`);
        audio.preload = "metadata";
        
        audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0);
        audio.onerror = () => resolve(0);
    });
};

export default function ArtistPage() {
    const { id } = useParams();
    const { bottomBarRef, nowPlaying, shufflePlaylist } = useBottomBar();
    
    // --- State ---
    const [artistData, setArtistData] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Follow State
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [showFollowToast, setShowFollowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // --- Logic Fetch Data ---

    // Xử lý duration cho danh sách bài hát
    const enrichTrackDurations = async (items) => {
        if (!items || !Array.isArray(items)) return [];
        
        return Promise.all(items.map(async (track) => {
            const currentDuration = Number(track?.duration);
            if (Number.isFinite(currentDuration) && currentDuration > 0) {
                return { ...track, duration: currentDuration };
            }
            // Chỉ fetch bằng Audio object nếu thiếu duration
            const fetchedDuration = await fetchAudioDuration(track.audioUrl);
            return { ...track, duration: fetchedDuration };
        }));
    };

    // Kiểm tra trạng thái Follow
    const checkFollowStatus = async () => {
        const token = getAccessToken();
        if (!token) return setIsFollowing(false);

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${id}/follow-status`, {
                headers: { token: `Bearer ${token}` }
            });
            setIsFollowing(response.data.data.isFollowing);
        } catch (error) {
            console.warn("Check follow status failed:", error.message);
            setIsFollowing(false);
        }
    };

    // Fetch Artist & Tracks
    useEffect(() => {
        let active = true;

        const fetchData = async () => {
            try {
                // 1. Fetch thông tin Artist
                const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`);
                if (!active) return;
                
                let artistInfo = userRes.data.data;
                
                // 2. Fetch Tracks của Artist
                try {
                    const tracksRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}?tracks=true`);
                    const rawTracks = tracksRes.data.data.tracks || [];
                    
                    const enrichedTracks = await enrichTrackDurations(rawTracks);
                    if (!active) return;
                    
                    setTracks(enrichedTracks);

                    // Tính tổng lượt nghe (nếu API user chưa trả về sẵn)
                    const calculatedPlays = enrichedTracks.reduce((sum, t) => sum + (t.playCount || 0), 0);
                    artistInfo = {
                        ...artistInfo,
                        totalPlays: artistInfo.totalPlays || calculatedPlays, // Ưu tiên data từ user API nếu có
                        name: artistInfo.nickname || artistInfo.username
                    };
                } catch (trackErr) {
                    console.error("Failed to fetch tracks", trackErr);
                    setTracks([]);
                }

                setArtistData(artistInfo);
                await checkFollowStatus();

            } catch (error) {
                console.error("Failed to fetch artist", error);
            } finally {
                if (active) setLoading(false);
            }
        };

        if (id) fetchData();

        return () => { active = false; };
    }, [id]);

    // --- Handlers ---

    const handleFollowToggle = async () => {
        const token = getAccessToken();
        const userInfoRaw = localStorage.getItem("userInfo");
        const userData = userInfoRaw ? JSON.parse(userInfoRaw) : null;

        if (!token || !userData?._id) {
            triggerToast("Please log in to follow artists");
            return;
        }

        setFollowLoading(true);
        try {
            if (isFollowing) {
                // Unfollow
                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${id}/follow`, {
                    headers: { token: `Bearer ${token}` }
                });
                updateFollowState(false, -1);
                triggerToast("Unfollowed artist");
            } else {
                // Follow
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${id}/follow`, {}, {
                    headers: { token: `Bearer ${token}` }
                });
                updateFollowState(true, 1);
                triggerToast("Followed artist");
            }
        } catch (error) {
            console.error("Follow toggle error:", error);
            triggerToast("Action failed. Please try again.");
        } finally {
            setFollowLoading(false);
        }
    };

    // Cập nhật State & LocalStorage sau khi Follow/Unfollow
    const updateFollowState = (newStatus, countChange) => {
        setIsFollowing(newStatus);
        
        // Update Artist Display Data
        setArtistData(prev => ({
            ...prev,
            followerCount: Math.max((prev.followerCount || 0) + countChange, 0)
        }));

        // Update User LocalStorage Data (Sync số lượng đang follow)
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        if (userInfo) {
            userInfo.followingCount = Math.max((userInfo.followingCount || 0) + countChange, 0);
            localStorage.setItem("userInfo", JSON.stringify(userInfo));
        }
    };

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowFollowToast(true);
        setTimeout(() => setShowFollowToast(false), 3000);
    };

    const handlePlayTrack = async (trackId = null, index = null) => {
        if (!tracks.length) return;
        const artistPlaylistId = `artist-${id}`;
        
        // Logic chọn bài: Nếu click bài cụ thể -> lấy bài đó. Nếu bấm nút Play lớn -> Random hoặc bài đầu.
        let idx = 0;
        let songId = null;

        if (typeof index === 'number') {
            idx = index;
            songId = trackId;
        } else {
            idx = shufflePlaylist ? Math.floor(Math.random() * tracks.length) : 0;
            songId = tracks[idx]?._id;
        }

        if (songId) {
            await bottomBarRef.current.play(songId, artistPlaylistId, idx, tracks);
        }
    };

    // --- Render ---

    if (loading) return <div className={style.artistLoading}>Loading...</div>;
    if (!artistData) return <div className={style.artistError}>Artist not found</div>;

    return (
        <div className={layout.background}>
            <Header />
            <Sidebar />
            <div className={style.artistPageWrapper}>
                {/* Banner */}
                <div 
                    className={style.artistHeaderSection} 
                    style={{ backgroundImage: `linear-gradient(transparent, rgba(0,0,0,0.6)), url(${artistData.thumbnailUrl})` }}
                >
                    <div className={style.artistInfoContent}>
                        <div className={style.verifiedBadge}>
                            <img src="/verified.png" alt="verified" /> 
                            <span>Verified Artist</span>
                        </div>
                        <h2 className={style.artistNameLarge}>{artistData.name}</h2>
                        <div className={style.artistStats}>
                            <p className={style.monthlyListeners}>{formatNumber(artistData.totalPlays)} listeners</p>
                            <span className={style.statsDot}>•</span>
                            <p className={style.followerCount}>{formatNumber(artistData.followerCount)} followers</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className={style.artistBodySection}>
                    <div className={style.artistActions}>
                        <button className={style.btnPlayBig} onClick={() => handlePlayTrack()}>
                            <img src="/play.png" alt="Play" />
                        </button>
                        <button 
                            className={clsx(style.btnFollow, isFollowing && style.following)} 
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                        >
                            {followLoading ? "Loading..." : isFollowing ? "Following" : "Follow"}
                        </button>
                        <button className={style.btnMore}>•••</button>
                    </div>

                    <h2 className={style.sectionTitle}>Popular Songs</h2>
                    <div className={style.artistTrackList}>
                        {tracks.map((track, index) => (
                            <div 
                                key={track._id} 
                                className={clsx(style.trackRow, nowPlaying.current?._id === track._id && 'active')}
                                onClick={() => handlePlayTrack(track._id, index)}
                            >
                                <div className={style.trackIndex}>
                                    <span className={style.indexNum}>{index + 1}</span>
                                    <img src="/play.png" className={style.indexPlayIcon} alt="play"/>
                                </div>
                                <div className={style.trackInfo}>
                                    <img src={track.thumbnailUrl} alt={track.title} className={style.trackThumb} />
                                    <span className={style.trackTitle}>{track.title}</span>
                                </div>
                                <div className={style.trackPlays}>
                                    {formatNumber(track.playCount)}
                                </div>
                                <div className={style.trackDuration}>
                                    {formatDuration(track.duration)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {showFollowToast && (
                <div className={style.followToast}>
                    {toastMessage}
                </div>
            )}
        </div>
    );
}