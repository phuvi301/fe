'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { useBottomBar } from '~/context/BottombarContext';
import Sidebar from "../../../components/Sidebar";
import Header from '../../../components/Header';
import clsx from 'clsx';
import layout from "~/app/homepage.module.scss";
import style from "./track.module.css";

export default function TrackPage() {
    const { id } = useParams();
    const router = useRouter();
    const { bottomBarRef, nowPlaying, isPlaying, setIsPlaying, addToPlaylistView } = useBottomBar();
    const [trackData, setTrackData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        const fetchTrackData = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${id}`);
                setTrackData(res.data.data);
                
                // TODO: Fetch like status từ API khi có API like
            } catch (error) {
                console.error("Failed to fetch track data", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTrackData();
        }
    }, [id]);

    // Xử lý play/pause bài hát
    const handlePlayPause = async () => {
        if (nowPlaying.current?._id === id) {
            if (isPlaying) {
                bottomBarRef.current?.pause();
            } else {
                bottomBarRef.current?.resume();
            }
        } else {
            await bottomBarRef.current?.play(id, `single-track-${id}`);
        }
    };

    // Xử lý like/unlike bài hát
    const handleLikeToggle = async () => {
        try {
            // TODO: Implement API call để like/unlike khi có API
            
            // Temporary toggle for UI demonstration
            setIsLiked(!isLiked);
            setTrackData(prev => ({
                ...prev,
                likeCount: isLiked ? (prev.likeCount || 1) - 1 : (prev.likeCount || 0) + 1
            }));
        } catch (error) {
            console.error("Failed to toggle like", error);
        }
    };

    // Chuyển đến trang nghệ sĩ
    const goToArtist = () => {
        if (trackData?.owner?._id) {
            router.push(`/artist/${trackData.owner._id}`);
        }
    };

    // Format thời gian
    const formatDuration = (seconds) => {
        const total = Number(seconds);
        if (!Number.isFinite(total) || total <= 0) return "--:--";
        const min = Math.floor(total / 60);
        const sec = Math.floor(total % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    // Format số
    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    if (loading) {
        return (
            <div className={layout.background}>
                <Header />
                <Sidebar />
                <div className={style.trackPageWrapper}>
                    <div className={style.trackLoading}>Loading...</div>
                </div>
            </div>
        );
    }

    if (!trackData) {
        return (
            <div className={layout.background}>
                <Header />
                <Sidebar />
                <div className={style.trackPageWrapper}>
                    <div className={style.trackError}>Track not found</div>
                </div>
            </div>
        );
    }

    const isCurrentTrack = nowPlaying.current?._id === id;

    return (
        <div className={layout.background}>
            <Header />
            <Sidebar />
            
            <div className={style.trackPageWrapper}>
                {/* Main Layout */}
                <div className={style.pageLayout}>
                    {/* Left Side */}
                    <div className={style.leftMainSection}>
                        {/* Track Header Section */}
                        <div className={style.trackHeaderSection}>
                            <div className={style.trackImageContainer}>
                                <img 
                                    src={trackData.thumbnailUrl} 
                                    alt={trackData.title}
                                    className={style.trackImage}
                                />
                            </div>

                            <div className={style.trackInfoContainer}>
                                <div className={style.trackType}>Song</div>
                                <h1 className={style.trackTitle}>{trackData.title}</h1>
                                <div className={style.trackMeta}>
                                    <div className={style.artistContainer}>
                                        <img 
                                            src={trackData.owner?.thumbnailUrl || trackData.thumbnailUrl}
                                            alt={trackData.owner?.nickname || trackData.owner?.username || 'Artist'}
                                            className={style.smallArtistAvatar}
                                        />
                                        <span 
                                            className={style.artistLink}
                                            onClick={goToArtist}
                                        >
                                            {trackData.owner?.nickname || trackData.owner?.username || 'Unknown Artist'}
                                        </span>
                                    </div>
                                    <span className={style.metaDot}>•</span>
                                    <span className={style.trackYear}>
                                        {trackData.createdAt ? new Date(trackData.createdAt).getFullYear() : 'Unknown'}
                                    </span>
                                    <span className={style.metaDot}>•</span>
                                    <span className={style.trackDuration}>
                                        {formatDuration(trackData.duration)}
                                    </span>
                                </div>
                                {/* Track Stats */}
                                <div className={style.trackStats}>
                                    <div className={style.statItem}>
                                        <span className={style.statNumber}>
                                            {formatNumber(trackData.playCount || 0)}
                                        </span>
                                        <span>plays</span>
                                    </div>
                                    <span className={style.metaDot}>•</span>
                                    <div className={style.statItem}>
                                        <span className={style.statNumber}>
                                            {formatNumber(trackData.likeCount || 0)}
                                        </span>
                                        <span>likes</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Track Body Section */}
                        <div className={style.trackBodySection}>
                            {/* Track Controls */}
                            <div className={style.trackControlsSection}>
                                <div className={style.controlsWrapper}>
                                    <button 
                                        className={clsx(style.playButton, isCurrentTrack && isPlaying && style.playing)} 
                                        onClick={handlePlayPause}
                                    >
                                        <img 
                                            src={isCurrentTrack && isPlaying ? "/pause.png" : "/play.png"} 
                                            alt={isCurrentTrack && isPlaying ? "Pause" : "Play"}
                                        />
                                    </button>

                                    <button 
                                        className={clsx(style.likeButton, isLiked && style.liked)} 
                                        onClick={handleLikeToggle}
                                    >
                                        <img 
                                            src={isLiked ? "/like_colored.png" : "/like.png"} 
                                            alt="Like"
                                            width={20}
                                            height={20}
                                        />
                                    </button>

                                    <button className={style.moreButton}>
                                        •••
                                    </button>
                                </div>
                            </div>

                            {/* Artist Info */}
                            <div className={style.artistInfoSection}>
                                <div 
                                    className={style.artistCard}
                                    onClick={goToArtist}
                                >
                                    <img 
                                        src={trackData.owner?.thumbnailUrl || trackData.thumbnailUrl}
                                        alt={trackData.owner?.nickname || trackData.owner?.username || 'Artist'}
                                        className={style.artistAvatar}
                                    />
                                    <div className={style.artistInfo}>
                                        <div className={style.artistLabel}>Artist</div>
                                        <h3 className={style.artistName}>
                                            {trackData.owner?.nickname || trackData.owner?.username || 'Unknown Artist'}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Comments */}
                    <div className={style.rightMainSection}>
                        <div className={style.commentsSection}>
                            <div className={style.commentsHeader}>
                                <h3 className={style.commentsTitle}>Comments</h3>
                                <span className={style.commentsCount}>0 comments</span>
                            </div>
                            
                            <div className={style.commentsPlaceholder}>
                                <h4>No comments yet</h4>
                                <p>Be the first to share what you think!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
