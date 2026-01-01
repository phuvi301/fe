"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useBottomBar } from "~/context/BottombarContext";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import clsx from "clsx";
import layout from "~/app/styles/homepage.module.scss";
import style from "./track.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPaperPlane, faThumbsUp, faTrashCan, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";

const DEFAULT_AVATAR = "/avatar-default.svg";

export default function TrackDetail({ initialTrackData, id }) {
    const router = useRouter();
    const { bottomBarRef, nowPlaying, isPlaying, isLiked, setIsLiked, trackLikeCount, setTrackLikeCount, toggleLike } = useBottomBar();
    
    // State dữ liệu bài hát
    const [trackData, setTrackData] = useState(initialTrackData);

    // State xử lý Hydration (Avatar & Like status)
    const [userAvatar, setUserAvatar] = useState(DEFAULT_AVATAR);
    const [savedIsLiked, setSavedIsLiked] = useState(false);
    
    // State UI & Logic khác
    const [commentText, setCommentText] = useState("");
    const [likeLoading, setLikeLoading] = useState(false);
    const [showLikeToast, setShowLikeToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    
    const [commentList, setCommentList] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(true);
    const [typeSubmit, setTypeSubmit] = useState("track");
    
    const [isNeedCreateBlock, setIsNeedCreateBlock] = useState(!initialTrackData.comments);
    const [placeCreateBlock, setPlaceCreateBlock] = useState(initialTrackData._id);
    const [blockSubmit, setBlockSubmit] = useState(initialTrackData.comments);
    
    const isCurrentTrack = nowPlaying.current?._id === id;
    const commentInputRef = useRef();

    // 1. Fix lỗi Hydration Avatar: Lấy avatar thật từ localStorage sau khi mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const userData = JSON.parse(localStorage.getItem("userInfo") || "{}");
            if (userData?.thumbnailUrl) {
                setUserAvatar(userData.thumbnailUrl);
            }
        }
    }, []);

    // 2. Fix lỗi Hydration Like Button: Lấy trạng thái like từ localStorage sau khi mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const userData = JSON.parse(localStorage.getItem("userInfo") || "{}");
            if ((userData.likedTracks || []).includes(id)) {
                setSavedIsLiked(true);
            } else {
                setSavedIsLiked(false);
            }
        }
    }, [id]);

    // 3. Sync dữ liệu ban đầu vào Context (Fix lỗi Loop: Bỏ trackData.likeCount khỏi dependency)
    useEffect(() => {
        if (nowPlaying.current?._id === id) {
            setTrackLikeCount(trackData.likeCount || 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, nowPlaying.current?._id, setTrackLikeCount]); 

    // 4. Logic check User Like Status từ API để đảm bảo đồng bộ mới nhất
    useEffect(() => {
        const checkUserLike = async () => {
            const userData = JSON.parse(localStorage.getItem("userInfo") || "{}");
            const tokenPart = document.cookie.split('accessToken=')[1];
            const accessToken = tokenPart ? tokenPart.split(';')[0] : null;

            if (userData._id && accessToken) {
                try {
                    const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userData._id}`, {
                        headers: { token: `Bearer ${accessToken}` },
                    });
                    
                    const userLikedTracks = userRes.data.data.likedTracks || [];
                    
                    // Cập nhật context nếu đang nghe bài này
                    if (nowPlaying.current?._id === id) {
                        setIsLiked(userLikedTracks.includes(id));
                    }
                    
                    // Cập nhật localStorage
                    const updatedUserData = { ...userData, likedTracks: userLikedTracks };
                    localStorage.setItem("userInfo", JSON.stringify(updatedUserData));

                    // Cập nhật state nội bộ
                    setSavedIsLiked(userLikedTracks.includes(id));

                } catch (userError) {
                    console.error("Failed to fetch user like status", userError);
                }
            }
        };
        checkUserLike();
    }, [id, nowPlaying.current?._id, setIsLiked]);

    // 5. Fetch Comments
    useEffect(() => {
        const fetchCommentData = async () => {
            try {
                if (!trackData.comments) return;
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/${trackData.comments}`);
                setCommentList(res.data.data);
                setIsSubmitted(false);
            } catch (error) {
                console.error("Failed to fetch comments", error);
            }
        };

        if (id && trackData.comments && isSubmitted) fetchCommentData();
    }, [id, trackData.comments, isSubmitted]);

    // 6. Sync like count từ Context về Local State (khi người dùng like ở bottom bar)
    useEffect(() => {
        if (isCurrentTrack && trackLikeCount !== undefined) {
            setTrackData(prev => prev ? { 
                ...prev, 
                likeCount: Math.max(0, trackLikeCount) 
            } : prev);
        }
    }, [trackLikeCount, isCurrentTrack]);

    // --- CÁC HÀM XỬ LÝ ---

    const handleCreateBlock = async () => {
        if (!isNeedCreateBlock) return blockSubmit;
        try {
            const tokenPart = document.cookie.split("accessToken=")[1];
            const token = tokenPart ? tokenPart.split(";")[0] : "";
            
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/comments/`,
                { id: placeCreateBlock, type: typeSubmit },
                { headers: { token: `Bearer ${token}` } }
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
            const tokenPart = document.cookie.split("accessToken=")[1];
            const token = tokenPart ? tokenPart.split(";")[0] : "";

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/comments/comment`,
                { id: blockId, content: commentText, timeline: 0 },
                { headers: { token: `Bearer ${token}` } }
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
            const tokenPart = document.cookie.split("accessToken=")[1];
            const token = tokenPart ? tokenPart.split(";")[0] : "";
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/${blockId}/${cmtId}`, {
                headers: { token: `Bearer ${token}` },
            });
            setIsSubmitted(true);
        } catch (error) {
            console.log(error);
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
    }, [commentText, trackData]);

    const handlePlayPause = async () => {
        if (nowPlaying.current?._id === id) {
            if (isPlaying) bottomBarRef.current?.pause();
            else bottomBarRef.current?.resume();
        } else {
            await bottomBarRef.current?.play(id, `single-track-${id}`);
        }
    };

    const handleLikeToggle = async () => {
        if (likeLoading) return;
        try {
            setLikeLoading(true);
            const result = await toggleLike(id);
            
            // Cập nhật Optimistic UI
            setTrackData((prev) => ({
                ...prev,
                likeCount: Math.max(0, result.likeCount || 0),
            }));
            
            // Cập nhật savedIsLiked để UI đổi màu ngay lập tức
            const userData = JSON.parse(localStorage.getItem("userInfo") || "{}");
            if ((userData.likedTracks || []).includes(id)) {
                setSavedIsLiked(true);
            } else {
                setSavedIsLiked(false);
            }

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
        if (trackData?.owner?._id) router.push(`/artist/${trackData.owner._id}`);
    };

    const formatDuration = (seconds) => {
        const total = Number(seconds);
        if (!Number.isFinite(total) || total <= 0) return "--:--";
        const min = Math.floor(total / 60);
        const sec = Math.floor(total % 60);
        return `${min}:${sec < 10 ? "0" + sec : sec}`;
    };

    const formatNumber = (num) => new Intl.NumberFormat("vi-VN").format(num);

    // Tính toán trạng thái Like an toàn cho Hydration
    const currentIsLiked = isCurrentTrack ? isLiked : savedIsLiked;

    // --- RENDER UI ---
    return (
        <div className={layout.background}>
            <Header />
            <Sidebar />

            <div className={style.trackPageWrapper}>
                <div className={style.pageLayout}>
                    {/* Left Side */}
                    <div className={style.leftMainSection}>
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
                                            alt={trackData.owner?.nickname || "Artist"}
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
                                <div className={style.trackStats}>
                                    <div className={style.statItem}>
                                        <span className={style.statNumber}>{formatNumber(trackData.playCount || 0)}</span>
                                        <span>plays</span>
                                    </div>
                                    <span className={style.metaDot}>•</span>
                                    <div className={style.statItem}>
                                        <span className={style.statNumber}>{formatNumber(trackData.likeCount || 0)}</span>
                                        <span>likes</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={style.trackBodySection}>
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

                            <div className={style.artistInfoSection}>
                                <div className={style.artistCard} onClick={goToArtist}>
                                    <img
                                        src={trackData.owner?.thumbnailUrl || trackData.thumbnailUrl}
                                        alt="Artist"
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

                            <div className={style.bottomBar}>
                                <img
                                    src={userAvatar}
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
                                            if (e.key === "Enter" && commentText.trim()) handleSubmitComment();
                                        }}
                                    />
                                    <div className={style.inputActions}>
                                        {commentText.length > 0 && (
                                            <button className={style.inputBtn} onClick={() => setCommentText("")} title="Clear">
                                                <FontAwesomeIcon icon={faXmarkCircle} />
                                            </button>
                                        )}
                                        {commentText.trim().length > 0 && (
                                            <button className={clsx(style.inputBtn, style.sendBtn)} title="Submit" onClick={handleSubmitComment}>
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
            {showLikeToast && <div className={style.likeToast}>{toastMessage}</div>}
        </div>
    );
}

// --- COMPONENTS PHỤ ---

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
                isOwner={typeof window !== "undefined" && data.owner._id === JSON.parse(localStorage.getItem("userInfo") || "{}")?._id}
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
                                isOwner={typeof window !== "undefined" && cmt.message.owner._id === JSON.parse(localStorage.getItem("userInfo") || "{}")?._id}
                                cmtId={cmt.message._id}
                                blockId={data.replies}
                                replyId={cmt.message.replies}
                                isLiked={cmt.message.isLiked}
                                handleDeleteComment={handleDeleteComment}
                                handleReplyButton={handleReplyButton}
                            />
                        ))}

                    <div className={style.expandWrapper}>
                        <button
                            className={style.expandBtn}
                            onClick={() => (showReplies ? handleCloseReply() : handleShowReply())}
                        >
                            {showReplies ? (
                                <>
                                    <FontAwesomeIcon icon={faChevronUp} className={style.iconBlue} />
                                    Hide replies
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faChevronDown} className={style.iconBlue} />
                                    Show replies
                                </>
                            )}
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