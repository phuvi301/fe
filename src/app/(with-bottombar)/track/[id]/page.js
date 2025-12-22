"use client";

import { useEffect, useRef, useState } from "react";
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

const DEFAULT_AVATAR = "/avatar-default.svg";

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
    const [commentList, setCommentList] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(true);
    const [typeSubmit, setTypeSubmit] = useState("track");
    const [isNeedCreateBlock, setIsNeedCreateBlock] = useState(true);
    const [placeCreateBlock, setPlaceCreateBlock] = useState(null);
    const [blockSubmit, setBlockSubmit] = useState();
    const commentInputRef = useRef();

    useEffect(() => {
        const fetchTrackData = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${id}`);
                const trackData = res.data.data;
                
                if (trackData) {
                    trackData.likeCount = Math.max(0, trackData.likeCount || 0);
                }

                setTrackData(res.data.data);
                setIsNeedCreateBlock(!res.data.data.comments);
                setPlaceCreateBlock(res.data.data._id);
                setTypeSubmit("track");
                setBlockSubmit(res.data.data.comments);
                // TODO: Fetch like status từ API khi có API like
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
        const fetchCommentData = async () => {
            try {
                if (!trackData.comments) return;
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/${trackData.comments}`);
                setCommentList(res.data.data);
                setIsSubmitted(false);
            } catch (error) {
                console.error("Failed to fetch track comments data", error);
            }
        };

        if (id && trackData && isSubmitted) fetchCommentData();
    }, [id, trackData, isSubmitted]);

    const handleCreateBlock = async () => {
        if (!isNeedCreateBlock) return blockSubmit;
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/comments/`,
                {
                    id: placeCreateBlock,
                    type: typeSubmit,
                },
                {
                    headers: {
                        token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                    },
                }
            );
            if (typeSubmit === "track") setTrackData((prev) => ({ ...prev, comments: res.data.data._id }));
            setBlockSubmit(res.data.data._id);
            return res.data.data._id;
        } catch (error) {
            console.error("Failed to create comment block", error);
            return;
        }
    };

    const handleSubmitComment = async () => {
        const blockId = await handleCreateBlock();
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/comments/comment`,
                {
                    id: blockId,
                    content: commentText,
                    timeline: 0,
                },
                {
                    headers: {
                        token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                    },
                }
            );
        } catch (error) {
            console.error("Failed to add comment", error);
            return;
        }
        setIsSubmitted(true);
        setCommentText("");
    };

    const handleDeleteComment = async (blockId, cmtId) => {
        try {
            const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/${blockId}/${cmtId}`, {
                headers: {
                    token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                },
            });
            setIsSubmitted(true);
        } catch (error) {
            console.log(error);
            return;
        }
    };

    const handleReplyButton = (displayName, cmtId, replyId) => {
        setCommentText(`@${displayName} `);
        setBlockSubmit(replyId);
        setIsNeedCreateBlock(!replyId);
        setPlaceCreateBlock(cmtId);
        setTypeSubmit("comments");
        commentInputRef.current.focus();
    };

    useEffect(() => {
        if (!trackData) return;
        if (commentText.includes("@") && typeSubmit === "comments") return;

        setBlockSubmit(trackData.comments);
        setIsNeedCreateBlock(!trackData.comments);
        setPlaceCreateBlock(trackData._id);
        setTypeSubmit("track");
    }, [commentText]);

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
                                <span className={style.commentsCount}>{commentList?.comments?.length ?? 0} comments</span>
                            </div>

                            {/* Scrollable Comment List */}
                            <div className={style.commentListWrapper}>
                                {commentList?.comments?.map((cmt) => (
                                    <BlockComment
                                        key={cmt._id}
                                        blockId={commentList?._id}
                                        handleDeleteComment={handleDeleteComment}
                                        handleReplyButton={handleReplyButton}
                                        data={cmt.message}
                                        isSubmitted={isSubmitted}
                                    />
                                ))}
                            </div>

                            {/* 3. Bottom Input Bar */}
                            <div className={style.bottomBar}>
                                <img
                                    src={JSON.parse(localStorage.getItem("userInfo"))?.thumbnailUrl || DEFAULT_AVATAR}
                                    className={style.inputAvatar}
                                    alt="me"
                                />

                                <div className={style.inputContainer}>
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        className={style.textInput}
                                        value={commentText}
                                        ref={commentInputRef}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && commentText.trim()) {
                                                handleSubmitComment();
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
                                                onClick={handleSubmitComment}
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

const BlockComment = ({ data, blockId, isSubmitted, handleDeleteComment, handleReplyButton }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [replyData, setReplyData] = useState(null);

    useEffect(() => {
        handleShowReply(true);
    }, [isSubmitted]);

    const handleShowReply = async (bypass = false) => {
        if (bypass && !showReplies) return;
        setShowReplies(true);
        if (!bypass && replyData) return;
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/${data.replies}`);
            setReplyData(res.data.data);
        } catch (error) {
            console.log(error);
            setShowReplies(false);
            return;
        }
    };

    const handleCloseReply = () => setShowReplies(false);

    return (
        <div className={style.thread}>
            <Comment
                typeComment={"main"}
                username={data.owner.displayName}
                thumbnailUrl={data.owner.thumbnailUrl}
                timeline={data.timeline}
                content={data.content}
                likeCount={data.likeCount}
                isOwner={data.owner._id === JSON.parse(localStorage.getItem("userInfo"))?._id}
                cmtId={data._id}
                blockId={blockId}
                replyId={data.replies}
                isLiked={data.isLiked}
                handleDeleteComment={handleDeleteComment}
                handleReplyButton={handleReplyButton}
            />

            {data.replies && (
                <div className={style.repliesContainer}>
                    {showReplies &&
                        replyData?.comments?.map((cmt) => (
                            <Comment
                                key={cmt._id}
                                typeComment={"reply"}
                                username={cmt.message.owner.displayName}
                                thumbnailUrl={cmt.message.owner.thumbnailUrl}
                                timeline={cmt.message.timeline}
                                content={cmt.message.content}
                                likeCount={cmt.message.likeCount}
                                isOwner={cmt.message.owner._id === JSON.parse(localStorage.getItem("userInfo"))?._id}
                                cmtId={cmt.message._id}
                                blockId={data.replies}
                                replyId={cmt.message.replies}
                                isLiked={cmt.message.isLiked}
                                handleDeleteComment={handleDeleteComment}
                                handleReplyButton={handleReplyButton}
                            />
                        ))}

                    {/* <div className={style.repliesLevel2}>
                    <Comment typeComment={"reply"} />

                    <Comment typeComment={"reply"} />
                </div> */}

                    <div className={style.expandWrapper}>
                        <button
                            className={style.expandBtn}
                            onClick={() => (showReplies ? handleCloseReply() : handleShowReply())}
                        >
                            <FontAwesomeIcon icon={faChevronDown} className={style.iconBlue} />
                            {showReplies ? "Hide replies" : "Show replies"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Comment = ({
    username,
    thumbnailUrl,
    timeline,
    content,
    likeCount,
    isOwner,
    blockId,
    cmtId,
    replyId,
    isLiked,
    handleDeleteComment,
    handleReplyButton,
    typeComment = "main",
}) => {
    return (
        <div
            className={clsx({
                [style.parentComment]: typeComment === "main",
                [style.replyRow]: typeComment === "reply",
            })}
        >
            <img
                src={thumbnailUrl || DEFAULT_AVATAR}
                className={clsx({
                    [style.avatar]: typeComment === "main",
                    [style.avatarSmall]: typeComment === "reply",
                })}
                alt="user"
            />

            <div className={style.commentBody}>
                <div className={style.commentMeta}>
                    <span className={style.username}>{username}</span>
                    {/* <span className={style.timestamp}>{timeline}</span> */}
                    {isOwner && (
                        <button
                            className={style.deleteBtn}
                            title="Delete"
                            onClick={() => handleDeleteComment(blockId, cmtId)}
                        >
                            <FontAwesomeIcon icon={faTrashCan} />
                        </button>
                    )}
                </div>
                <div className={style.commentText}>{content}</div>
                <div className={style.toolbar}>
                    <button
                        className={clsx(style.toolbarBtn, {
                            [style.liked]: isLiked,
                        })}
                    >
                        <FontAwesomeIcon icon={faThumbsUp} />
                    </button>
                    <span className={style.likeCount}>{likeCount}</span>
                    <button className={style.replyTextBtn} onClick={() => handleReplyButton(username, cmtId, replyId)}>
                        Reply
                    </button>
                </div>
            </div>
        </div>
    );
};