"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useBottomBar } from "~/context/BottombarContext";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import clsx from "clsx";
import layout from "~/app/homepage.module.scss";
import style from "./track.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faPaperPlane, faThumbsUp, faTrashCan, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";

const DEFAULT_AVATAR = "/avatar-default.svg"

export default function TrackPage() {
    const { id } = useParams();
    const router = useRouter();
    const { bottomBarRef, nowPlaying, isPlaying, setIsPlaying, addToPlaylistView, isLiked, setIsLiked, trackLikeCount, setTrackLikeCount, toggleLike } = useBottomBar();
    const [trackData, setTrackData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [likeLoading, setLikeLoading] = useState(false);
    const [showLikeToast, setShowLikeToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const isCurrentTrack = nowPlaying.current?._id === id;

    useEffect(() => {
        const fetchTrackData = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${id}`);
                const trackData = res.data.data;
                
                if (trackData) {
                    trackData.likeCount = Math.max(0, trackData.likeCount || 0);
                }
                
                setTrackData(trackData);

                if (nowPlaying.current?._id === id) {
                    setTrackLikeCount(res.data.data.likeCount || 0);
                }

                const userData = JSON.parse(localStorage.getItem("userInfo") || "{}");
                const accessToken = document.cookie.split('accessToken=')[1]?.split(';')[0];
                
                if (userData._id && accessToken) {
                    try {
                        const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userData._id}`, {
                            headers: {
                                token: `Bearer ${accessToken}`,
                            },
                        });
                        
                        const userLikedTracks = userRes.data.data.likedTracks || [];
                        
                        if (nowPlaying.current?._id === id) {
                            setIsLiked(userLikedTracks.includes(id));
                        }
                        
                        const updatedUserData = { ...userData, likedTracks: userLikedTracks };
                        localStorage.setItem("userInfo", JSON.stringify(updatedUserData));
                    } catch (userError) {
                        console.error("Failed to fetch user like status", userError);
                        if (userData?.likedTracks && nowPlaying.current?._id === id) {
                            setIsLiked(userData.likedTracks.includes(id));
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch track data", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTrackData();
        }
    }, [id, nowPlaying.current?._id, setIsLiked, setTrackLikeCount]);

    useEffect(() => {
        if (isCurrentTrack && trackLikeCount !== undefined) {
            setTrackData(prev => prev ? { 
                ...prev, 
                likeCount: Math.max(0, trackLikeCount) 
            } : prev);
        }
    }, [trackLikeCount, isCurrentTrack]);

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

    const handleLikeToggle = async () => {
        if (likeLoading) return;
        
        try {
            setLikeLoading(true);

            const result = await toggleLike(id);
            
            setTrackData((prev) => ({
                ...prev,
                likeCount: Math.max(0, result.likeCount || 0),
            }));
            
            setToastMessage(result.message);
            setShowLikeToast(true);
            setTimeout(() => setShowLikeToast(false), 3000);

        } catch (error) {
            console.error("Failed to toggle like", error);
            
            const errorMessage = error.message === "Please log in to like tracks" 
                ? "Please log in to like tracks" 
                : "Failed to update like status. Please try again.";
                
            setToastMessage(errorMessage);
            setShowLikeToast(true);
            setTimeout(() => setShowLikeToast(false), 3000);
        } finally {
            setLikeLoading(false);
        }
    };

    const goToArtist = () => {
        if (trackData?.owner?._id) {
            router.push(`/artist/${trackData.owner._id}`);
        }
    };

    const formatDuration = (seconds) => {
        const total = Number(seconds);
        if (!Number.isFinite(total) || total <= 0) return "--:--";
        const min = Math.floor(total / 60);
        const sec = Math.floor(total % 60);
        return `${min}:${sec < 10 ? "0" + sec : sec}`;
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat("vi-VN").format(num);
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

    const currentIsLiked = isCurrentTrack ? isLiked : (() => {
        const userData = JSON.parse(localStorage.getItem("userInfo") || "{}");
        return (userData.likedTracks || []).includes(id);
    })();

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
                                <img src={trackData.thumbnailUrl} alt={trackData.title} className={style.trackImage} />
                            </div>

                            <div className={style.trackInfoContainer}>
                                <div className={style.trackType}>Song</div>
                                <h1 className={style.trackTitle}>{trackData.title}</h1>
                                <div className={style.trackMeta}>
                                    <div className={style.artistContainer}>
                                        <img
                                            src={trackData.owner?.thumbnailUrl || trackData.thumbnailUrl}
                                            alt={trackData.owner?.nickname || trackData.owner?.username || "Artist"}
                                            className={style.smallArtistAvatar}
                                        />
                                        <span className={style.artistLink} onClick={goToArtist}>
                                            {trackData.owner?.nickname || trackData.owner?.username || "Unknown Artist"}
                                        </span>
                                    </div>
                                    <span className={style.metaDot}>•</span>
                                    <span className={style.trackYear}>
                                        {trackData.createdAt ? new Date(trackData.createdAt).getFullYear() : "Unknown"}
                                    </span>
                                    <span className={style.metaDot}>•</span>
                                    <span className={style.trackDuration}>{formatDuration(trackData.duration)}</span>
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
                                        className={clsx(style.likeButton, currentIsLiked && style.liked)}
                                        onClick={handleLikeToggle}
                                        disabled={likeLoading}
                                        style={{ opacity: likeLoading ? 0.6 : 1 }}
                                    >
                                        <img
                                            src={currentIsLiked ? "/like_colored.png" : "/like.png"}
                                            alt="Like"
                                            width={20}
                                            height={20}
                                        />
                                    </button>

                                    <button className={style.moreButton}>•••</button>
                                </div>
                            </div>

                            {/* Artist Info */}
                            <div className={style.artistInfoSection}>
                                <div className={style.artistCard} onClick={goToArtist}>
                                    <img
                                        src={trackData.owner?.thumbnailUrl || trackData.thumbnailUrl}
                                        alt={trackData.owner?.nickname || trackData.owner?.username || "Artist"}
                                        className={style.artistAvatar}
                                    />
                                    <div className={style.artistInfo}>
                                        <div className={style.artistLabel}>Artist</div>
                                        <h3 className={style.artistName}>
                                            {trackData.owner?.nickname || trackData.owner?.username || "Unknown Artist"}
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
                                <span className={style.commentsCount}>73 comments</span>
                            </div>

                            {/* Scrollable Comment List */}
                            <div className={style.commentListWrapper}>
                                <BlockComment />
                            </div>

                            {/* 3. Bottom Input Bar */}
                            <div className={style.bottomBar}>
                                <img src="/default_avatar.png" className={style.inputAvatar} alt="me" />

                                <div className={style.inputContainer}>
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        className={style.textInput}
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && commentText.trim()) {
                                                console.log("Submitting:", commentText);
                                                setCommentText("");
                                            }
                                        }}
                                    />
                                    <div className={style.inputActions}>
                                        {commentText.length > 0 && (
                                            <button
                                                className={style.inputBtn}
                                                onClick={() => setCommentText("")}
                                                title="Clear"
                                            >
                                                <FontAwesomeIcon icon={faXmarkCircle} />
                                            </button>
                                        )}

                                        {commentText.trim().length > 0 && (
                                            <button
                                                className={clsx(style.inputBtn, style.sendBtn)}
                                                title="Submit"
                                                onClick={() => setCommentText("")}
                                            >
                                                <FontAwesomeIcon icon={faPaperPlane} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Like Toast Notification */}
            {showLikeToast && (
                <div className={style.likeToast}>
                    {toastMessage}
                </div>
            )}
        </div>
    );
}

const BlockComment = () => {
    return (
        <div className={style.thread}>
            <MainComment />

            <div className={style.repliesContainer}>
                <RepliedComment />

                <div className={style.repliesLevel2}>
                    <RepliedComment />
                    <RepliedComment />
                </div>

                <div className={style.expandWrapper}>
                    <button className={style.expandBtn}>
                        <FontAwesomeIcon icon={faChevronDown} className={style.iconBlue} />
                        Ấn phản hồi
                    </button>
                </div>
            </div>
        </div>
    );
};

const MainComment = ({ username, thumbnailUrl, timeline, content, likeCount }) => {
    return (
        <div className={style.parentComment}>
            <img src={thumbnailUrl || DEFAULT_AVATAR} className={style.avatar} alt="user" />

            <div className={style.commentBody}>
                <div className={style.commentMeta}>
                    <span className={style.username}>{username}</span>
                    <span className={style.timestamp}>{timeline}</span>
                    <button className={style.deleteBtn} title="Delete">
                        <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                </div>
                <div className={style.commentText}>{content}</div>
                <div className={style.toolbar}>
                    <button className={style.toolbarBtn}>
                        <FontAwesomeIcon icon={faThumbsUp} />
                    </button>
                    <span className={style.likeCount}>{likeCount}</span>
                    <button className={style.replyTextBtn}>Phản hồi</button>
                </div>
            </div>
        </div>
    );
};

const RepliedComment = () => {
    return (
        <div className={style.replyRow}>
            <img src="/default_avatar.png" className={style.avatarSmall} alt="user" />
            <div className={style.commentBody}>
                <div className={style.commentMeta}>
                    <span className={style.username}>@Tuoutudong</span>
                    <span className={style.timestamp}>6 tháng trước</span>
                    <button className={style.deleteBtn} title="Delete">
                        <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                </div>
                <div className={style.commentText}>
                    <span className={style.mentionLink}>@huule5146</span> tục mà có duyên...
                </div>
                <div className={style.toolbar}>
                    <button className={style.toolbarBtn}>
                        <FontAwesomeIcon icon={faThumbsUp} />
                    </button>
                    <span className={style.likeCount}>3</span>
                    <button className={style.replyTextBtn}>Phản hồi</button>
                </div>
            </div>
        </div>
    );
};
