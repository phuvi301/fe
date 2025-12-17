'use client'
import style from "../homepage.module.css";
import { forwardRef, useState, useRef, useImperativeHandle, useEffect, use } from "react";
import Hls from "hls.js";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { useBottomBar } from "~/context/BottombarContext";
import { resolve } from "styled-jsx/css";
import { useImageColors } from "../hooks/useImageColors";
import { usePathname } from 'next/navigation';

const BottomBar = forwardRef((props, ref) => {
    const { nowPlaying, playback, url, setUrl, getTrack, playlistPlaying, setCurrTrack, shufflePlaylist, setShufflePlaylist, handlePlaylist, repeatMode, setRepeatMode, volume, setVolume } = useBottomBar();

    const playerRef = useRef(null);
    const hlsRef = useRef(null);
    const isSeeking = useRef(false);
    const listenedSegments = useRef(new Set());
    const repeatRef = useRef("off");
    const shuffleRef = useRef([]);

    const list = shufflePlaylist && playlistPlaying ? shufflePlaylist : playlistPlaying?.tracks;

    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);
    const [lyrics, setLyrics] = useState([]);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const lyricsContentRef = useRef(null);
    
    // Thêm state để theo dõi việc đồng bộ lyrics
    const [isLyricsSynced, setIsLyricsSynced] = useState(true);
    
    // Thêm refs để theo dõi scroll behavior
    const scrollTimeoutRef = useRef(null);
    const isAutoScrollingRef = useRef(false);
    const lastScrollTopRef = useRef(0);

    // Them state va hook cho mau sac
    const [currentThumbnail, setCurrentThumbnail] = useState(null);
    const { colors, isLoading } = useImageColors(currentThumbnail);

    //Close lyrics khi chuyển trang
    const pathname = usePathname();

    //Volume state
    const previousVolumeRef = useRef(volume);

    //Like button state
    const [isLiked, setIsLiked] = useState(false);
    const [likeToast, setLikeToast] = useState({show: false, message: ""});
    const toastTimeoutRef = useRef(null);

    useEffect(() => {
        repeatRef.current = repeatMode;
    }, [repeatMode]);

    useEffect(() => {
        shuffleRef.current = shufflePlaylist;
    }, [shufflePlaylist]);

    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.volume = volume;
        }
        if (volume > 0) {
            previousVolumeRef.current = volume;
        }
    }, [volume]);

    useEffect(() => {
        // Automatically close lyrics overlay on navigation
        setShowLyrics(false);
    }, [pathname]);

    const getOwnerId = (track) => {
    if (!track?.owner) return null;
    // Nếu owner là object (đã populate), lấy _id. Nếu là chuỗi, lấy chính nó.
    return typeof track.owner === 'object' ? track.owner._id : track.owner;
    };
    const artistId = getOwnerId(nowPlaying.current);

    //Toggle likes + show toast
    const toggleLike = () => {
        const newLiked = !isLiked;
        setIsLiked(newLiked);

        // Clear any existing hide timeout so we can restart the toast lifecycle
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = null;
        }

        // Force-remount the toast to restart CSS animation:
        // hide immediately, then show again after a tiny delay.
        setLikeToast({ show: false, message: "" });
        const message = newLiked ? "Added to Liked Tracks" : "Removed from Liked Tracks";

        setTimeout(() => {
            setLikeToast({ show: true, message });
            // auto-hide after 2.5s
            toastTimeoutRef.current = setTimeout(() => {
                setLikeToast({ show: false, message: "" });
                toastTimeoutRef.current = null;
            }, 2500);
        }, 40); // 30-60ms is enough to force reflow/remount
    };
    //cleanup toast timeout on unmount
    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    //Helper giúp chọn icon dựa trên volume
    const getVolumeIcon = (v) => {
        if (v === 0) return "/mute_speaker.png";
        if (v > 0 && v < 0.3) return "/low_speaker.png";
        if (v >= 0.3 && v < 0.7) return "/med_speaker.png";
        return "/high_speaker.png";
    };
    
    // toggle mute / unmute khi click icon
    const toggleMute = () => {
        if (volume === 0) {
            const restore = previousVolumeRef.current ?? 0.5;
            setVolume(restore);
            if (playerRef.current) playerRef.current.volume = restore;
        } else {
            setVolume(0);
            if (playerRef.current) playerRef.current.volume = 0;
        }
    };


    // Hàm fetch lyrics từ API hoặc file
    const fetchLyrics = async (songID) => {
        try {
            // Thử fetch từ API trước
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${songID}/lyrics`);
            if (response.data && response.data.lyrics) {
                parseLyrics(response.data.lyrics);
                return;
            }
        } catch (error) {
            console.log("API lyrics not found, trying mock data...");
        }
        
        try {
            // Thử dùng mock lyrics từ file
            const { mockLyrics } = await import('../mockData/lyrics.js');
            if (mockLyrics[songID]) {
                parseLyrics(mockLyrics[songID]);
                return;
            }
        } catch (error) {
            console.log("Mock lyrics not found, using default...");
        }
    };

    const parseLyrics = (lyricsText) => {
        if (!lyricsText || typeof lyricsText !== 'string') {
            console.log("Invalid lyrics data");
            setLyrics([]);
            return;
        }

        const lines = lyricsText.split('\n');
        const parsedLyrics = [];
        
        lines.forEach((line, lineIndex) => {
            // Hỗ trợ nhiều format timestamp khác nhau
            const lrcMatch = line.match(/\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/);
            const simpleMatch = line.match(/\[(\d{1,2}):(\d{2})\](.*)/);
            
            if (lrcMatch) {
                const minutes = parseInt(lrcMatch[1]);
                const seconds = parseInt(lrcMatch[2]);
                const milliseconds = parseInt(lrcMatch[3].padEnd(3, '0'));
                const text = lrcMatch[4].trim();
                const time = minutes * 60 + seconds + milliseconds / 1000;
                
                if (!isNaN(time) && time >= 0) {
                    parsedLyrics.push({ 
                        time, 
                        text: text || "♪",
                        originalLine: line,
                        lineIndex 
                    });
                }
            } else if (simpleMatch) {
                const minutes = parseInt(simpleMatch[1]);
                const seconds = parseInt(simpleMatch[2]);
                const text = simpleMatch[3].trim();
                const time = minutes * 60 + seconds;
                
                if (!isNaN(time) && time >= 0) {
                    parsedLyrics.push({ 
                        time, 
                        text: text || "♪",
                        originalLine: line,
                        lineIndex 
                    });
                }
            }
        });
        
        // Sắp xếp theo thời gian
        parsedLyrics.sort((a, b) => a.time - b.time);
        setLyrics(parsedLyrics);
    };

    // Cải thiện hàm cập nhật lyric hiện tại với thuật toán tìm kiếm nhanh hơn
    const updateCurrentLyric = (currentTime) => {
        if (!lyrics.length || !isLyricsSynced) return;
        
        // Tìm index của lyric hiện tại với thuật toán binary search cho hiệu suất tốt hơn
        let index = -1;
        let left = 0;
        let right = lyrics.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (lyrics[mid].time <= currentTime) {
                index = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        // Kiểm tra nếu đang ở giữa 2 lyrics
        if (index >= 0 && index < lyrics.length - 1) {
            const currentLyric = lyrics[index];
            const nextLyric = lyrics[index + 1];
            
            // Nếu thời gian hiện tại quá gần với lyric tiếp theo (< 0.5s), chưa chuyển
            if (nextLyric.time - currentTime < 0.1 && currentTime < nextLyric.time) {
                // Giữ nguyên index hiện tại
            }
        }
        
        // Chỉ cập nhật nếu thay đổi
        if (index !== currentLyricIndex) {
            setCurrentLyricIndex(index);
            
            // Auto scroll lyrics
            if (index >= 0 && lyricsContentRef.current && isLyricsSynced) {
                scrollToCurrentLyric(index);
            }
            
            // Debug log với thông tin chi tiết
            if (index >= 0 && lyrics[index]) {
                const lyric = lyrics[index];
            }
        }
    };

    // Cải thiện hàm auto-scroll với animation mượt hơn
    const scrollToCurrentLyric = (index) => {
        const lyricsContainer = lyricsContentRef.current;
        if (!lyricsContainer || !isLyricsSynced) return;
        
        // Đánh dấu đây là auto scroll để tránh trigger user scroll handler
        isAutoScrollingRef.current = true;
        
        const currentLyricElement = lyricsContainer.querySelector(`[data-lyric-index="${index}"]`);
        if (currentLyricElement) {
            const containerHeight = lyricsContainer.offsetHeight;
            const elementTop = currentLyricElement.offsetTop;
            const elementHeight = currentLyricElement.offsetHeight;
            
            // Tính toán vị trí scroll để đưa lyric hiện tại vào giữa màn hình
            const scrollTop = elementTop - (containerHeight / 1.5) + (elementHeight / 2);
            
            lyricsContainer.scrollTo({
                top: Math.max(0, scrollTop),
                behavior: 'smooth'
            });
            
            // Reset flag sau khi scroll xong
            setTimeout(() => {
                isAutoScrollingRef.current = false;
            }, 300); // 300ms để đảm bảo animation hoàn thành
        }
    };

    // Hàm xử lý scroll event để tự động tắt sync
    const handleLyricsScroll = (event) => {
        const container = event.target;
        const currentScrollTop = container.scrollTop;
        
        // Bỏ qua nếu đang auto scroll
        if (isAutoScrollingRef.current) {
            lastScrollTopRef.current = currentScrollTop;
            return;
        }
        
        // Kiểm tra xem có phải user scroll không (scroll position thay đổi đáng kể)
        const scrollDiff = Math.abs(currentScrollTop - lastScrollTopRef.current);
        
        if (scrollDiff > 5 && isLyricsSynced) { // Threshold 5px để tránh trigger nhầm
            setIsLyricsSynced(false);
        }
        
        lastScrollTopRef.current = currentScrollTop;
        
        // Clear timeout cũ và set timeout mới để tự động bật lại sync
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        
        // Tự động bật lại sync sau 3 giây không scroll
        scrollTimeoutRef.current = setTimeout(() => {
            if (!isLyricsSynced) {
                setIsLyricsSynced(true);
                
                // Đồng bộ lại với thời gian hiện tại
                if (playerRef.current) {
                    updateCurrentLyric(playerRef.current.currentTime);
                }
            }
        }, 3000); // 3 giây
    };

    // Cải thiện hàm jump với validation
    const jumpToLyricTime = (time) => {
        if (!playerRef.current || !time || time < 0) return;
        
        const player = playerRef.current;
        
        // Kiểm tra time có hợp lệ không
        if (time > duration) {
            console.warn(`⚠️ Jump time ${time}s exceeds duration ${duration}s`);
            return;
        }
        
        player.currentTime = time;
        setProgress(time);
        
        // Cập nhật localStorage
        localStorage.setItem("playbackTime", time);
        
        // Tạm thời tắt auto-sync trong 1 giây để tránh conflict
        setIsLyricsSynced(false);
        setTimeout(() => {
            setIsLyricsSynced(true);
            updateCurrentLyric(time);
        }, 100);
        
        console.log(`⏭️ Jumped to: ${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`);
    };

    const handleTrack = (audioUrl) => {
        return new Promise((resolve) => {
            // Mỗi bài 1 instance => xóa instance cũ khi qua bài mới
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            const applyDuration = (dur) => {
                const numericDuration = Number(dur);
                if (!Number.isFinite(numericDuration) || numericDuration <= 0) return;
                setDuration(numericDuration);
                nowPlaying.current.duration = numericDuration;
            };

            // Cấu hình hls
            const hls = new Hls({
                maxBufferLength: 30,
                maxBufferSize: 60 * 1000 * 1000,
                maxMaxBufferLength: 600,
                seekMode: 'Accurate',
                maxFragLookUpTolerance: 0.1,
                liveSyncDurationCount: 3,
                liveMaxLatencyDurationCount: 10
            });
            hlsRef.current = hls;

            const audioEl = playerRef.current;

            // Cập nhật duration từ metadata (fallback cho trường hợp manifest không có totalduration)
            audioEl.onloadedmetadata = () => applyDuration(audioEl.duration);

            // Lắng nghe sự kiện LEVEL_LOADED để lấy totalduration chính xác
            hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
                applyDuration(data?.details?.totalduration);
            });

            hls.attachMedia(audioEl); 
            hls.loadSource(audioUrl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // Manifest PARSED không phải lúc nào cũng có details; duration sẽ được set ở LEVEL_LOADED/metadata
                let hasCounted;
                // Khi reload trang, nhạc tạm dừng
                if (url) {
                    audioEl.pause(); 
                    setIsPlaying(false);
                    hasCounted = localStorage.getItem("hasCounted");
                    setUrl(null);
                }
                // Khi đổi bài mới
                else {
                    setIsPlaying(true);
                    listenedSegments.current.clear();
                    localStorage.setItem("listenedSegments", JSON.stringify([...listenedSegments.current]));
                    hasCounted = false;
                    localStorage.setItem("hasCounted", false);
                }

                nowPlaying.current.hasCounted = hasCounted;
                localStorage.setItem("playedTrack", nowPlaying.current._id); 

                resolve();
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.log('HLS error:', data);
                if (data.details === "bufferSeekOverHole") {
                }
                if (data.details === "bufferStalledError") {
                    hls.startLoad(playerRef.current.currentTime);
                }

                resolve();
            });
        });
    }

    // Tăng playCount và lưu vào danh sách đã nghe khi nghe hơn 40% duration của bài
    const handleListendSegments = () => {
        const {_id} = JSON.parse(localStorage.getItem("userInfo")); 
        if (!_id) return; // Chỉ khi đăng nhập mới chạy

        const saved = localStorage.getItem("listenedSegments");
        if (saved) listenedSegments.current = new Set(JSON.parse(saved));

        listenedSegments.current.add(Math.round(playerRef.current.currentTime));
        if ((listenedSegments.current.size / Math.round(nowPlaying.current.duration)) >= 0.4 && !nowPlaying.current.hasCounted) {
            increasePlayCount();
            addToHistory(_id);
            nowPlaying.current.hasCounted = true;
            localStorage.setItem("hasCounted", true);
        }
    }

    const increasePlayCount = async () => {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${nowPlaying.current._id}/playCount`);
            console.log(res.data.message);
        } catch(err) {
            console.error("Track has not gotten any playCount!", err);
        } 
    }

    const addToHistory = async (_id) => {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/history/${_id}`, {trackID: nowPlaying.current._id});
        } catch(err) {
            console.error("Track has not been added to history", err);
        }
    }

    const saveProgressToRedis = async (plID = null, idx = null) => {
        const {_id} = JSON.parse(localStorage.getItem("userInfo")); 
        if (!_id || !nowPlaying.current) return; // Chỉ đăng nhập mới lưu vào redis

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/progress/${_id}`, {
                trackID: nowPlaying.current._id, 
                playbackTime: playerRef.current.currentTime, 
                playlistID: plID,
                index: idx,
                repeat: repeatRef.current,
                shuffle: shuffleRef.current,
                volume: playerRef.current.volume
            });
        } catch(err) {
            console.error("Error while saving progress", err);
        }
    }

    const updatePlaybackTime = async () => {
        const {_id} = JSON.parse(localStorage.getItem("userInfo")); 
        if (!_id || !nowPlaying.current) return; // Chỉ đăng nhập mới lưu vào redis

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/playback/${_id}`, {
                playbackTime: playerRef.current.currentTime, 
                repeat: repeatRef.current,
                shuffle: shuffleRef.current,
                volume: playerRef.current.volume
            });
        } catch(err) {
            console.error("Error while updating playbackTime", err);
        }
    }

    const saveProgress = () => {
        if (!isSeeking.current && !playerRef.current.paused) updatePlaybackTime();
    }

    const play = async (trackID, playlistID = null, index = null, tracks = null) => {
        const res = await getTrack(trackID);

        setLyrics([]);
        setCurrentLyricIndex(-1);
        await fetchLyrics(trackID);
        
        nowPlaying.current = res.track;
        setCurrTrack(res.track);
        handleTrack(res.url);

        await handlePlaylist(playlistID, index, shufflePlaylist, tracks);
        // await handlePlaylist(playlistID, index, tracks);
        saveProgressToRedis(playlistID, index);
    }

    // Effect để cập nhật thumbnail khi bài hát thay đổi
    useEffect(() => {
        if (nowPlaying.current?.thumbnailUrl && nowPlaying.current.thumbnailUrl !== currentThumbnail) {
            setCurrentThumbnail(nowPlaying.current.thumbnailUrl);
        }
    }, [nowPlaying.current, currentThumbnail]);

    useEffect(() => {
        if (url) {
            handleTrack(url);
            playerRef.current.currentTime = parseFloat(playback.playbackTime);
        }
    }, [url])

    // Effect để setup scroll listener
    useEffect(() => {
        const lyricsContainer = lyricsContentRef.current;
        
        if (lyricsContainer && showLyrics) {
            // Thêm scroll event listener với passive để tối ưu performance
            lyricsContainer.addEventListener('scroll', handleLyricsScroll, { passive: true });
            
            return () => {
                lyricsContainer.removeEventListener('scroll', handleLyricsScroll);
            };
        }
    }, [showLyrics, isLyricsSynced]);

    // Cleanup timeout khi component unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const player = playerRef.current;

        const timeUpdate = () => {
            if (!isSeeking.current) {
                setProgress(playerRef.current.currentTime);

                // Ghi nhận tổng thời lượng đã nghe
                if (!playerRef.current.paused) {
                    handleListendSegments();
                    localStorage.setItem("listenedSegments", JSON.stringify([...listenedSegments.current]));
                }
                // Cập nhật lyrics với tần suất cao hơn để đồng bộ chính xác
                updateCurrentLyric(playerRef.current.currentTime);
            }
        }

        const handleBeforeUnload = () => {
            if (player && !isNaN(player.currentTime)) {
                updatePlaybackTime();
            }
        };

        const ended = async () => {
            setIsPlaying(false);
            setCurrentLyricIndex(-1); // Reset lyrics khi hết bài
            if (repeatMode === "track") {
                await play(nowPlaying.current._id, playlistPlaying ? playlistPlaying._id : null, playlistPlaying ? list.findIndex((track) => track._id === nowPlaying.current._id) : null);
                return;
            }
            if (playlistPlaying) {
                if (repeatMode === "context" && list.findIndex((track) => track._id === nowPlaying.current._id) === playlistPlaying.tracks.length - 1) {
                    await play(list[0]._id, playlistPlaying._id, 0);
                }
                else {
                    const nextTrackIdx = list.findIndex((track) => track._id === nowPlaying.current._id) + 1;
                    if (nextTrackIdx >= playlistPlaying.tracks.length) return;
                    const nextTrackID = list[nextTrackIdx]._id;
                    await play(nextTrackID, playlistPlaying._id, nextTrackIdx);
                }
            }
            else {
                if (repeatMode === "context") await play(nowPlaying.current._id);
            }
        }

        // Lắng nghe sự kiện với tần suất cao hơn
        player.addEventListener("timeupdate", timeUpdate);
        player.addEventListener("ended", ended);
        window.addEventListener("beforeunload", handleBeforeUnload);

        saveProgress();
        const interval = setInterval(saveProgress, 3000);
        
        // Thêm event listener cho seeking để tạm dừng sync
        const handleSeeking = () => {
            setIsLyricsSynced(false);
        };
        
        const handleSeeked = () => {
            setTimeout(() => {
                setIsLyricsSynced(true);
                updateCurrentLyric(playerRef.current.currentTime);
            }, 100);
        };

        player.addEventListener("seeking", handleSeeking);
        player.addEventListener("seeked", handleSeeked);

        return () => {
            player.removeEventListener("timeupdate", timeUpdate);
            player.removeEventListener("ended", ended);
            player.removeEventListener("seeking", handleSeeking);
            player.removeEventListener("seeked", handleSeeked);
            clearInterval(interval);
            window.removeEventListener("beforeunload", handleBeforeUnload);    
        }
    }, [lyrics, isLyricsSynced]);

    const togglePlay = () => {
        if (!nowPlaying.current) return;
        const player = playerRef.current;
        if (player.paused) {
            player.play();
            setIsPlaying(true);
        } else {
            saveProgress();
            player.pause();
            setIsPlaying(false);
        }
    };

    const toggleLyrics = () => {
        setShowLyrics(!showLyrics);
    };

    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const minutes = Math.floor(progress / 60);
    const seconds = Math.floor(progress % 60);
    const durationMinutes = Math.floor(safeDuration / 60);
    const durationSeconds = Math.floor(safeDuration % 60);
    const progressPercent = safeDuration > 0 ? Math.min(100, (progress / safeDuration) * 100) : 0;

    const toggleNext = async () => {
        if (repeatMode === "track") {
            setRepeatMode("context");
            await play(nowPlaying.current._id, playlistPlaying ? playlistPlaying._id : null, playlistPlaying ? list.findIndex((track) => track._id === nowPlaying.current._id) : null);
            return;
        }
        if (playlistPlaying) {
            if (repeatMode === "context" && list.findIndex((track) => track._id === nowPlaying.current._id) === playlistPlaying.tracks.length - 1) {
                await play(list[0]._id, playlistPlaying._id, 0);
            }
            else {
                const nextTrackIdx = list.findIndex((track) => track._id === nowPlaying.current._id) + 1;
                if (nextTrackIdx >= playlistPlaying.tracks.length) return;
                const nextTrackID = list[nextTrackIdx]._id;
                await play(nextTrackID, playlistPlaying._id, nextTrackIdx);
            }
        }
        else {
            if (repeatMode === "context") await play(nowPlaying.current._id);
        }
    }

    const togglePrevious = async () => {
        if (playlistPlaying) {
            const prevTrackIdx = list.findIndex((track) => track._id === nowPlaying.current._id) - 1;
            if (prevTrackIdx < 0) return;
            const prevTrackID = list[prevTrackIdx]._id;
            await play(prevTrackID, playlistPlaying._id, prevTrackIdx);
        }
        else {
            await play(nowPlaying.current._id);
        }
    }

    const toggleRepeat = async () => {
        if (repeatMode === "off") setRepeatMode("context");
        else if (repeatMode === "context") setRepeatMode("track");
        else setRepeatMode("off");
    }

    const shuffleTracks = async () => {
        if (playlistPlaying) {
            const tracks = playlistPlaying.tracks;
            const idxPlaying = playlistPlaying.tracks.findIndex((track) => track._id === nowPlaying.current._id);
            let arr = Array.from({ length: tracks.length }, (_, i) => i).filter(i => i !== idxPlaying);
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            arr = [idxPlaying, ...arr];
            setShufflePlaylist(arr.map(i => tracks[i]));
        }
        else setShufflePlaylist([nowPlaying.current]);
    };

    const toggleShuffle = () => {
        if (!shufflePlaylist) {
            shuffleTracks();
        }
        else {
            setShufflePlaylist(null)
        }
    }

    useImperativeHandle(ref, () => ({
        play,
        fetchLyrics,
        shuffleTracks
    }));

    return (
        <>
        <div className={style["bottom-bar-container"]} hidden={true}>
            <div className={style["audio-player"]}>
                <audio controls type="audio/mpeg" ref={playerRef} autoPlay hidden />
            </div>
            {nowPlaying.current ? (
            <div className={style["song-in-bottom-bar"]}>
                <Link href="/play" className={clsx(style["mini-thumbnail2"], style["no-select"])}>
                    <Image src={nowPlaying.current.thumbnailUrl} className={style["cover2"]} width={500} height={500} alt="Thumbnail" />
                </Link> 
                <div className={style["song-detail2"]}>
                    <Link href="/play" className={style["mini-song-name"]}>
                        <div className={clsx(style["bold-text"], style["no-select"])}>
                            {nowPlaying.current.title}
                        </div>  
                    </Link>
                    <Link 
                        /* Logic: Nếu có owner ID thì link tới đó, không thì link # */
                        href={artistId ? `/artist/${artistId}` : "#"} 
                        className={clsx(style["mini-artist-name"], style["no-select"])}
                        onClick={(e) => {
                        if (!artistId) e.preventDefault(); 
                        }}
                    >
                        {nowPlaying.current.artist} 
                    </Link>
                </div>
                <div className={style["like-btn-container"]}>
                    <button className={style["like-btn"]} onClick={toggleLike}>
                        {isLiked ? (
                                <Image
                                    src="/blue_heart.png"
                                    className={style["like-icon"]}
                                    width={15}
                                    height={15}
                                    alt="Liked"
                                />
                        ) : (
                            <Image
                                src="/unlike.png"
                                className={style["like-icon"]}
                                width={15}
                                height={15}
                                alt="Unlike"
                            />
                        )}
                    </button>
                </div>
            </div>
            ) : (
            <div className={style["song-in-bottom-bar"]}> 
            </div>
            )}
            <div className={style["music-player"]}>
                <div className={style["bottom-menu"]}>
                    <a className={style["shuffle"]}  onClick={toggleShuffle}>
                        <img src={shufflePlaylist ? "/shuffle-on.png" : "/shuffle.png"} className={style["menu-btn"]}/>
                    </a>
                    <button className={style["previous"]} onClick={togglePrevious}>
                        <img src="/previous.png" className={style["menu-btn"]}/>
                    </button>
                    <a className={style["play"]} onClick={togglePlay}>
                        <img
                            src={!isPlaying ? "/play.png" : "/pause.png"}
                            alt={!isPlaying ? "Play" : "Pause"}
                            className={style["menu-btn"]}
                        />
                    </a>
                    <button className={style["next"]} onClick={toggleNext}>
                        <img src="/next.png" className={style["menu-btn"]}/>
                    </button>
                    <button className={style["repeat"]} onClick={toggleRepeat}>
                        <img src={repeatMode === "off" ? "/repeat.png" : (repeatMode === "track" ? "/repeat-one.png" : "/repeat-blue.png")} className={style["menu-btn"]}/>
                    </button>
                </div>
                <div className={style["progress"]}>
                    <div className={clsx(style["current-time"], style["no-select"])}>
                        {minutes}:{String(seconds).padStart(2, "0")}
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={safeDuration}
                        step="0.1"
                        value={progress}
                        onMouseDown={() => {
                            isSeeking.current = true;
                        }}
                        onChange={(e) => setProgress(e.target.value)}
                        onMouseUp={() => {
                            if(!nowPlaying.current) return;
                            playerRef.current.currentTime = progress;
                            isSeeking.current = false;
                            hlsRef.current.stopLoad();
                            hlsRef.current.startLoad(progress);
                        }}
                        className={style["progress-bar"]}
                        style={{
                            background: `linear-gradient(to right, #3c74cfff ${progressPercent}%, #333 ${progressPercent}%)`,
                            borderRadius: '50px',
                        }}
                    />
                    <span className={clsx(style["duration"], style["no-select"])}>{durationMinutes}:{String(durationSeconds).padStart(2, "0")}</span>
                </div>

            </div>
            <div className={style["right-container"]}>
                <div className={style["queue-container"]}>
                    <button className={style["queue-btn"]}>
                        <img src="/queue.png" className={style["menu-btn"]}/>
                    </button>
                </div>
                <div className={style["lyrics-container"]}>
                    <button 
                        className={clsx(style["lyrics-btn"], { [style["active"]]: showLyrics })} 
                        onClick={toggleLyrics}
                    >
                        <img src="/lyrics.png" className={style["menu-btn"]}/>
                    </button>
                </div>
                <div className={style["volume-container"]}>
                    <button
                        onClick={toggleMute}
                        className={style["volume-icon-btn"]}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        aria-label={volume === 0 ? "Unmute" : "Mute"}
                    >
                        <img
                            className={style["volume-icon"]}
                            src={getVolumeIcon(volume)}
                            alt="Volume"
                            width={18}
                            height={18}
                            style={{ opacity: 0.9 }}
                        />
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setVolume(v);
                            if (playerRef.current) playerRef.current.volume = v;
                        }}
                        className={style["volume-slider"]}
                        style={{
                            background: `linear-gradient(to right, #3c74cfff ${volume * 100}%, #333 ${volume * 100}%)`
                        }}
                    />
                </div>
            </div>
        </div>
        {/* Like toast */}
        {likeToast.show && (
            <div className={style["like-toast"]} role="status" aria-live="polite">
                {likeToast.message}
            </div>
        )}
         {/* Lyrics Panel với gradient background động từ thumbnail */}
        {showLyrics && (
    <div 
        className={style["lyrics-overlay"]}
        style={{
            background: `linear-gradient(135deg, 
                ${colors.darkVibrant}22 0%, 
                ${colors.darkMuted}44 10%, 
                #000000 70%, 
                ${colors.vibrant}11 100%)`,
        }}
    >
        <div 
            className={style["lyrics-panel"]}
            style={{
                background: `linear-gradient(180deg, 
                    ${colors.darkVibrant}66 0%, 
                    ${colors.darkMuted}33 30%, 
                    rgba(0,0,0,0.8) 100%)`,
            }}
        >
            {nowPlaying.current && (
            <div 
                className={style["lyrics-header"]}
                style={{
                    background: `linear-gradient(90deg, 
                        ${colors.darkVibrant}88 0%, 
                        ${colors.muted}44 100%)`,
                    borderBottom: `1px solid ${colors.vibrant}66`,
                }}
            >
                
                    <div className={style["lyrics-details"]}>
                        <Image 
                            className={style["lyrics-thumbnail"]} 
                            src={nowPlaying.current.thumbnailUrl} 
                            width={80} 
                            height={80}
                            alt="Thumbnail"
                            style={{
                                boxShadow: `0 4px 20px ${colors.vibrant}44`,
                            }}
                        />
                        <div className={style["lyrics-song-info"]}>
                            <h3 className={style["lyrics-song-title"]} style={{ color: colors.lightVibrant || '#ffffff' }}>
                                {nowPlaying.current.title}
                            </h3>
                            <h4 className={style["lyrics-song-artist"]}>
                                {nowPlaying.current.artist}
                            </h4>
                        </div>
                    </div>
                
                <div className={style["lyrics-controls"]}>
                    <button 
                        className={style["close-lyrics"]} 
                        onClick={toggleLyrics}
                        style={{
                            backgroundColor: `${colors.vibrant}22`,
                            border: `1px solid ${colors.vibrant}66`,
                            transition: 'all 0.3s ease'
                        }}

                    >
                        <Image src="/close.png" alt="Close" width={24} height={24}/>
                    </button>
                </div>
            </div>)}

            <div 
                className={style["lyrics-content"]}
                ref={lyricsContentRef}
            >
                {lyrics.length > 0 ? (
                    lyrics.map((lyric, index) => (
                        <div    
                            key={index}
                            data-lyric-index={index}
                            className={clsx(
                                style["lyric-line"]
                            )}
                            style={{ 
                                borderLeft: index === currentLyricIndex 
                                    ? `3px solid ${colors.vibrant}` 
                                    : '3px solid transparent',
                                opacity: index < currentLyricIndex ? 0.6 : 1,
                                transform: index === currentLyricIndex ? 'scale(1.02)' : 'scale(1)',
                                color: index === currentLyricIndex 
                                    ? colors.lightVibrant || '#ffffff'
                                    : index < currentLyricIndex 
                                        ? '#888888'
                                        : '#cccccc',
                                boxShadow: index === currentLyricIndex
                                    ? `0 4px 12px ${colors.vibrant}33`
                                    : 'none',
                                backdropFilter: index === currentLyricIndex ? 'blur(2px)' : 'none'
                            }}
                            onClick={() => jumpToLyricTime(lyric.time)}
                        >
                            <span className={style["lyric-text"]}>
                                {lyric.text || "♪"}
                            </span>
                            {/* Thêm hiệu ứng glow cho lyric hiện tại */}
                            {index === currentLyricIndex && (
                                <div
                                    style={{
                                        background: `linear-gradient(90deg, 
                                            transparent 0%, 
                                            ${colors.vibrant}11 50%, 
                                            transparent 100%)`,
                                        pointerEvents: 'none',
                                        zIndex: -1
                                    }}
                                />
                            )}
                        </div>
                    ))
                ) : (
                    <div 
                        className={style["no-lyrics"]}
                    >
                        <p>No lyrics available for this track</p>
                    </div>
                )}
            </div>
        </div>
    </div>
        )}
        </>
    );
});

export default BottomBar;