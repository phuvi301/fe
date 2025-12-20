'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Image from 'next/image';
import { useBottomBar } from '~/context/BottombarContext';
import Sidebar from "../../../components/Sidebar";
import Header from '../../../components/Header';
import clsx from 'clsx';
import layout from "~/app/homepage.module.scss";
import style from "./artist.module.css";
export default function ArtistPage() {
    const { id } = useParams();
    const { bottomBarRef, nowPlaying, shufflePlaylist } = useBottomBar();
    const [artistData, setArtistData] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const enrichTrackDurations = async (items) => {
        const fetchDuration = (track) => {
            return new Promise((resolve) => {
                if (!track?.audioUrl) return resolve(0);

                const audio = new Audio(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${track.audioUrl}`);
                audio.preload = "metadata";

                const cleanup = () => {
                    audio.onloadedmetadata = null;
                    audio.onerror = null;
                    audio.src = "";
                };

                audio.onloadedmetadata = () => {
                    const dur = Math.round(audio.duration);
                    cleanup();
                    resolve(Number.isFinite(dur) ? dur : 0);
                };

                audio.onerror = () => {
                    cleanup();
                    resolve(0);
                };
            });
        };

        const enriched = await Promise.all(items.map(async (track) => {
            const currentDuration = Number(track?.duration);
            if (Number.isFinite(currentDuration) && currentDuration > 0) {
                return { ...track, duration: currentDuration };
            }
            const fetchedDuration = await fetchDuration(track);
            return { ...track, duration: fetchedDuration };
        }));

        return enriched;
    };

    // Check follow status
    const checkFollowStatus = async () => {
        try {
            const token = document.cookie.split('accessToken=')[1]?.split(';')[0];
            if (!token) {
                return;
            }

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${id}/follow-status`, {
                headers: { token: `Bearer ${token}` }
            });
            setIsFollowing(response.data.data.isFollowing);
        } catch (error) {
            console.error("Error checking follow status:", error.response?.status, error.response?.data || error.message);
        }
    };

    // Handle follow/unfollow
    const handleFollowToggle = async () => {
        try {
            setFollowLoading(true);
            const token = document.cookie.split('accessToken=')[1]?.split(';')[0];
            if (!token) {
                alert("Please login to follow artists");
                return;
            }
            
            if (isFollowing) {
                // Unfollow
                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${id}/follow`, {
                    headers: { token: `Bearer ${token}` }
                });
                setIsFollowing(false);
                
                setArtistData(prev => ({
                    ...prev,
                    followerCount: Math.max((prev.followerCount || 0) - 1, 0)
                }));

                setTimeout(async () => {
                    try {
                        const refreshRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/artist-profile`);
                        setArtistData(prev => ({
                            ...prev,
                            followerCount: refreshRes.data.artist.followerCount || 0
                        }));
                    } catch (error) {
                        console.error("Failed to refresh artist data:", error);
                    }
                }, 500);

            } else {
                // Follow
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${id}/follow`, {}, {
                    headers: { token: `Bearer ${token}` }
                });
                setIsFollowing(true);
                
                setArtistData(prev => ({
                    ...prev,
                    followerCount: (prev.followerCount || 0) + 1
                }));

                setTimeout(async () => {
                    try {
                        const refreshRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/artist-profile`);
                        setArtistData(prev => ({
                            ...prev,
                            followerCount: refreshRes.data.artist.followerCount || 0
                        }));
                    } catch (error) {
                        console.error("Failed to refresh artist data:", error);
                    }
                }, 500);
            }
        } catch (error) {
            console.error("Error toggling follow:", error.response?.data || error.message);
            alert("Failed to update follow status");
        } finally {
            setFollowLoading(false);
        }
    };

    // Format numbers
    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    // Format duration
    const formatDuration = (seconds) => {
        const total = Number(seconds);
        if (!Number.isFinite(total) || total <= 0) return "--:--";
        const min = Math.floor(total / 60);
        const sec = Math.floor(total % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    // Fetch dữ liệu từ Backend
    useEffect(() => {
        let active = true;

        const fetchArtistData = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/artist-profile`);
                if (!active) return;
                setArtistData(res.data.artist);
                const enriched = await enrichTrackDurations(res.data.tracks || []);
                if (!active) return;
                setTracks(enriched);
                
                // Check follow status after fetching artist data
                await checkFollowStatus();
            } catch (error) {
                console.error("Failed to fetch artist profile", error);
            } finally {
                if (active) setLoading(false);
            }
        };

        if (id) fetchArtistData();

        return () => {
            active = false;
        };
    }, [id]);

    // Xử lý phát bài: ưu tiên bài được click; nếu không, phát bài đầu hoặc ngẫu nhiên
    const handlePlayTrack = async (trackId = null, index = null) => {
        const artistPlaylistId = `artist-${id}`;

        let idx = 0;
        let songId = null;

        if (typeof index === 'number' && index >= 0 && index < tracks.length) {
            // Người dùng click vào một bài cụ thể trong danh sách
            idx = index;
            songId = trackId ?? tracks[idx]?._id;
        } else {
            // Nhấn nút Play lớn: tôn trọng shuffle nếu đang bật
            idx = shufflePlaylist ? Math.floor(Math.random() * tracks.length) : 0;
            songId = tracks[idx]?._id;
        }

        if (!songId) return;
        await bottomBarRef.current.play(songId, artistPlaylistId, idx, tracks);
    };

    if (loading) return <div className={style.artistLoading}>Loading...</div>;
    if (!artistData) return <div className={style.artistError}>Artist not found</div>;

    return (
        <div className={layout.background}>
            <Header />
            <Sidebar />
            <div className={style.artistPageWrapper}>
                {/* Artist Banner / Header Section */}
                <div className={style.artistHeaderSection} style={{
                    backgroundImage: `linear-gradient(transparent, rgba(0,0,0,0.6)), url(${artistData.thumbnailUrl})`
                }}>
                    <div className={style.artistInfoContent}>
                        <div className={style.verifiedBadge}>
                            <img src="/verified.png" alt="verified" /> 
                            <span>Verified Artist</span>
                        </div>
                        <h2 className={style.artistNameLarge}>{artistData.name}</h2>
                        <div className={style.artistStats}>
                            <p className={style.monthlyListeners}>{formatNumber(artistData.totalPlays)} listeners</p>
                            <span className={style.statsDot}>•</span>
                            <p className={style.followerCount}>
                                {formatNumber(artistData.followerCount || 0)} followers
                            </p>
                        </div>
                    </div>
                </div>

                {/* Popular Songs Section */}
                <div className={style.artistBodySection}>
                    <div className={style.artistActions}>
                        <button className={style.btnPlayBig} onClick={() => tracks.length > 0 && handlePlayTrack()}>
                            <img src="/play.png" alt="Play" />
                        </button>
                        <button 
                            className={clsx(style.btnFollow, isFollowing && style.following)} 
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            key={`follow-btn-${isFollowing}-${artistData?.followerCount}`}
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
                                    <Link href={`/track/${track._id}`} className={style.trackTitle}>
                                        {track.title}
                                    </Link>
                                </div>
                                <div className={style.trackPlays}>
                                    {formatNumber(track.playCount || 0)}
                                </div>
                                <div className={style.trackDuration}>
                                    {formatDuration(track.duration || 0)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div >
        </div>
    );
}