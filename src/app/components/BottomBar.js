'use client'
import style from "../styles/BottomBar.module.scss";
import { forwardRef, useState, useRef, useImperativeHandle, useEffect } from "react";
import Hls from "hls.js";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { useBottomBar } from "~/context/BottombarContext";
import { useImageColors } from "../hooks/useImageColors";
import { usePathname } from 'next/navigation';
import FullPlayer from "./FullPlayer"; // Component hiển thị trên di động

const BottomBar = forwardRef((props, ref) => {
    const { 
        nowPlaying, playback, url, setUrl, recommendPlaylist, getTrack, 
        playlistPlaying, setCurrTrack, shufflePlaylist, setShufflePlaylist, 
        handlePlaylist, repeatMode, setRepeatMode, volume, setVolume, 
        showQueue, setShowQueue, isLiked, setIsLiked, trackLikeCount, toggleLike,
    } = useBottomBar();

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

    // State quản lý việc mở FullPlayer trên di động
    const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
    
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

    //Like toast state
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
        setShowLyrics(false);
    }, [pathname]);

    useEffect(() => {
        if (showQueue) setShowLyrics(false);
    }, [showQueue]);

    const getOwnerId = (track) => {
        if (!track?.owner) return null;
        return typeof track.owner === 'object' ? track.owner._id : track.owner;
    };
    const artistId = getOwnerId(nowPlaying.current);

    //Toggle likes + show toast
    const handleToggleLike = async (e) => {
        if(e) e.stopPropagation(); // Chặn nổi bọt sự kiện
        try {
            const result = await toggleLike();
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = null;
            }
            if (result?.message) {
                setLikeToast({ show: true, message: result.message });
                toastTimeoutRef.current = setTimeout(() => {
                    setLikeToast({ show: false, message: "" });
                    toastTimeoutRef.current = null;
                }, 3000);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("userInfo"));
        setIsLiked(userData?.likedTracks.includes(nowPlaying.current?._id))
    }, [nowPlaying.current?._id])

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    const getVolumeIcon = (v) => {
        if (v === 0) return "/mute_speaker.png";
        if (v > 0 && v < 0.3) return "/low_speaker.png";
        if (v >= 0.3 && v < 0.7) return "/med_speaker.png";
        return "/high_speaker.png";
    };
    
    const toggleMute = (e) => {
        if(e) e.stopPropagation();
        if (volume === 0) {
            const restore = previousVolumeRef.current ?? 0.5;
            setVolume(restore);
            if (playerRef.current) playerRef.current.volume = restore;
        } else {
            setVolume(0);
            if (playerRef.current) playerRef.current.volume = 0;
        }
    };

    // --- LYRICS LOGIC (Giữ nguyên) ---
    const fetchLyrics = async (songID) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${songID}/lyrics`);
            if (response.data && response.data.lyrics) {
                parseLyrics(response.data.lyrics);
                return;
            }
        } catch (error) {
            console.log("API lyrics not found, trying mock data...");
        }
    };

    const parseLyrics = (lyricsText) => {
        if (!lyricsText || typeof lyricsText !== 'string') {
            setLyrics([]);
            return;
        }
        const lines = lyricsText.split('\n');
        const parsedLyrics = [];
        lines.forEach((line, lineIndex) => {
            const lrcMatch = line.match(/\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/);
            const simpleMatch = line.match(/\[(\d{1,2}):(\d{2})\](.*)/);
            if (lrcMatch) {
                const minutes = parseInt(lrcMatch[1]);
                const seconds = parseInt(lrcMatch[2]);
                const milliseconds = parseInt(lrcMatch[3].padEnd(3, '0'));
                const text = lrcMatch[4].trim();
                const time = minutes * 60 + seconds + milliseconds / 1000;
                if (!isNaN(time) && time >= 0) {
                    parsedLyrics.push({ time, text: text || "♪", originalLine: line, lineIndex });
                }
            } else if (simpleMatch) {
                const minutes = parseInt(simpleMatch[1]);
                const seconds = parseInt(simpleMatch[2]);
                const text = simpleMatch[3].trim();
                const time = minutes * 60 + seconds;
                if (!isNaN(time) && time >= 0) {
                    parsedLyrics.push({ time, text: text || "♪", originalLine: line, lineIndex });
                }
            }
        });
        parsedLyrics.sort((a, b) => a.time - b.time);
        setLyrics(parsedLyrics);
    };

    const updateCurrentLyric = (currentTime) => {
        if (!lyrics.length || !isLyricsSynced) return;
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
        if (index >= 0 && index < lyrics.length - 1) {
            const currentLyric = lyrics[index];
            const nextLyric = lyrics[index + 1];
            if (nextLyric.time - currentTime < 0.1 && currentTime < nextLyric.time) { }
        }
        if (index !== currentLyricIndex) {
            setCurrentLyricIndex(index);
            if (index >= 0 && lyricsContentRef.current && isLyricsSynced) {
                scrollToCurrentLyric(index);
            }
        }
    };

    const scrollToCurrentLyric = (index) => {
        const lyricsContainer = lyricsContentRef.current;
        if (!lyricsContainer || !isLyricsSynced) return;
        isAutoScrollingRef.current = true;
        const currentLyricElement = lyricsContainer.querySelector(`[data-lyric-index="${index}"]`);
        if (currentLyricElement) {
            const containerHeight = lyricsContainer.offsetHeight;
            const elementTop = currentLyricElement.offsetTop;
            const elementHeight = currentLyricElement.offsetHeight;
            const scrollTop = elementTop - (containerHeight / 1.5) + (elementHeight / 2);
            lyricsContainer.scrollTo({
                top: Math.max(0, scrollTop),
                behavior: 'smooth'
            });
            setTimeout(() => {
                isAutoScrollingRef.current = false;
            }, 300);
        }
    };

    const handleLyricsScroll = (event) => {
        const container = event.target;
        const currentScrollTop = container.scrollTop;
        if (isAutoScrollingRef.current) {
            lastScrollTopRef.current = currentScrollTop;
            return;
        }
        const scrollDiff = Math.abs(currentScrollTop - lastScrollTopRef.current);
        if (scrollDiff > 5 && isLyricsSynced) {
            setIsLyricsSynced(false);
        }
        lastScrollTopRef.current = currentScrollTop;
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            if (!isLyricsSynced) {
                setIsLyricsSynced(true);
                if (playerRef.current) {
                    updateCurrentLyric(playerRef.current.currentTime);
                }
            }
        }, 3000);
    };

    const jumpToLyricTime = (time) => {
        if (!playerRef.current || !time || time < 0) return;
        const player = playerRef.current;
        if (time > duration) return;
        
        // Gọi hàm seek chung
        handleSeek(time);
        
        localStorage.setItem("playbackTime", time);
        setIsLyricsSynced(false);
        setTimeout(() => {
            setIsLyricsSynced(true);
            updateCurrentLyric(time);
        }, 100);
    };

    // --- HLS & AUDIO LOGIC ---
    const handleTrack = (audioUrl) => {
        return new Promise((resolve) => {
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
            audioEl.onloadedmetadata = () => applyDuration(audioEl.duration);
            hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
                applyDuration(data?.details?.totalduration);
            });
            hls.attachMedia(audioEl); 
            hls.loadSource(audioUrl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                let hasCounted;
                if (url) {
                    audioEl.pause(); 
                    setIsPlaying(false);
                    hasCounted = localStorage.getItem("hasCounted");
                    setUrl(null);
                }
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
                if (data.details === "bufferSeekOverHole" || data.details === "bufferStalledError") {
                    hls.startLoad(playerRef.current.currentTime);
                }
                resolve();
            });
        });
    }

    // --- PLAY COUNT & HISTORY ---
    const handleListendSegments = () => {
        const rawInfo = localStorage.getItem("userInfo");
        if (!rawInfo) return;
        const {_id} = JSON.parse(rawInfo); 
        if (!_id) return;

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
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${nowPlaying.current._id}/playCount`);
        } catch(err) { console.error("Track has not gotten any playCount!", err); } 
    }

    const addToHistory = async (_id) => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/history/${_id}`, {trackID: nowPlaying.current._id});
        } catch(err) { console.error("Track has not been added to history", err); }
    }

    // --- REDIS PROGRESS ---
    const saveProgressToRedis = async (plID = null, idx = null) => {
        const rawInfo = localStorage.getItem("userInfo");
        if (!rawInfo) return;
        const {_id} = JSON.parse(rawInfo); 
        if (!_id || !nowPlaying.current) return;
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/progress/${_id}`, {
                trackID: nowPlaying.current._id, 
                playbackTime: playerRef.current.currentTime, 
                playlistID: plID, index: idx, repeat: repeatRef.current, shuffle: shuffleRef.current, volume: playerRef.current.volume
            });
        } catch(err) { console.error("Error while saving progress", err); }
    }

    const updatePlaybackTime = async () => {
        const rawInfo = localStorage.getItem("userInfo");
        if (!rawInfo) return;
        const {_id} = JSON.parse(rawInfo); 
        if (!_id || !nowPlaying.current) return;
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/playback/${_id}`, {
                playbackTime: playerRef.current.currentTime, 
                repeat: repeatRef.current, shuffle: shuffleRef.current, volume: playerRef.current.volume
            });
        } catch(err) { console.error("Error while updating playbackTime", err); }
    }

    const saveProgress = () => {
        if (!isSeeking.current && !playerRef.current.paused) updatePlaybackTime();
    }

    // --- PLAY/PAUSE/NAVIGATE LOGIC ---
    const play = async (trackID, playlistID = null, index = null, tracks = null) => {
        const res = await getTrack(trackID);
        setLyrics([]);
        setCurrentLyricIndex(-1);
        await fetchLyrics(trackID);
        nowPlaying.current = res.track;
        setCurrTrack(res.track);
        handleTrack(res.url);

        if (!playlistID && !tracks) {
            tracks = await recommendPlaylist(trackID);
            playlistID = `recommend-${trackID}`;
            index = 0;
        }
        await handlePlaylist(playlistID, index, shufflePlaylist, tracks);
        saveProgressToRedis(playlistID, index);
    }

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

    useEffect(() => {
        const lyricsContainer = lyricsContentRef.current;
        if (lyricsContainer && showLyrics) {
            lyricsContainer.addEventListener('scroll', handleLyricsScroll, { passive: true });
            return () => {
                lyricsContainer.removeEventListener('scroll', handleLyricsScroll);
            };
        }
    }, [showLyrics, isLyricsSynced]);

    useEffect(() => {
        const player = playerRef.current;
        const timeUpdate = () => {
            if (!isSeeking.current) {
                setProgress(playerRef.current.currentTime);
                if (!playerRef.current.paused) {
                    handleListendSegments();
                    localStorage.setItem("listenedSegments", JSON.stringify([...listenedSegments.current]));
                }
                updateCurrentLyric(playerRef.current.currentTime);
            }
        }
        const handleBeforeUnload = () => {
            if (player && !isNaN(player.currentTime)) updatePlaybackTime();
        };
        const ended = async () => {
            setIsPlaying(false);
            setCurrentLyricIndex(-1);
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
            } else {
                if (repeatMode === "context") await play(nowPlaying.current._id);
            }
        }

        player.addEventListener("timeupdate", timeUpdate);
        player.addEventListener("ended", ended);
        window.addEventListener("beforeunload", handleBeforeUnload);

        saveProgress();
        const interval = setInterval(saveProgress, 3000);
        
        const handleSeeking = () => setIsLyricsSynced(false);
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

    // --- HANDLE SEEK CHUNG CHO CẢ 2 PLAYER ---
    const handleSeek = (val) => {
        if (!playerRef.current || !nowPlaying.current) return;
        const newTime = parseFloat(val);
        setProgress(newTime);
        playerRef.current.currentTime = newTime;
        
        // Logic HLS buffer hole handling
        if (hlsRef.current) {
            hlsRef.current.stopLoad();
            hlsRef.current.startLoad(newTime);
        }
    }

    const togglePlay = (e) => {
        if(e) e.stopPropagation();
        if (!nowPlaying.current) return;
        const player = playerRef.current;
        if (player.isRecording) return;
        if (player.paused) {
            player.play();
            setIsPlaying(true);
        } else {
            saveProgress();
            player.pause();
            setIsPlaying(false);
        }
    };

    const pause = () => {
        if (!nowPlaying.current) return;
        const player = playerRef.current;
        if (!player.paused) {
            saveProgress();
            player.pause();
            setIsPlaying(false);
        }
    };

    const resume = () => {
        if (!nowPlaying.current) return;
        const player = playerRef.current;
        if (player.paused) {
            player.play();
            setIsPlaying(true);
        }
    };

    const toggleQueue = (e) => {
        if(e) e.stopPropagation();
        const newVal = !showQueue;
        setShowQueue(newVal);
        if (newVal) setShowLyrics(false);
    };

    const toggleLyrics = (e) => {
        if(e) e.stopPropagation();
        const newVal = !showLyrics;
        setShowLyrics(newVal);
        if (newVal) setShowQueue(false);
    };

    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const minutes = Math.floor(progress / 60);
    const seconds = Math.floor(progress % 60);
    const durationMinutes = Math.floor(safeDuration / 60);
    const durationSeconds = Math.floor(safeDuration % 60);
    const progressPercent = safeDuration > 0 ? Math.min(100, (progress / safeDuration) * 100) : 0;

    const toggleNext = async (e) => {
        if(e) e.stopPropagation();
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

    const togglePrevious = async (e) => {
        if(e) e.stopPropagation();
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

    const toggleRepeat = async (e) => {
        if(e) e.stopPropagation();
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

    const toggleShuffle = (e) => {
        if(e) e.stopPropagation();
        if (!shufflePlaylist) {
            shuffleTracks();
        }
        else {
            setShufflePlaylist(null)
        }
    }

    useImperativeHandle(ref, () => ({
        play, pause, resume, fetchLyrics, shuffleTracks, togglePlay, playerRef,
    }));

    return (
        <>
            {/* Click vào container chính để mở FullPlayer */}
            <div 
                className={style["bottom-bar-container"]} 
                hidden={true} 
                onClick={() => {
                    if (window.innerWidth <= 1024) {
                        setIsFullPlayerOpen(true);
                    }
                }}
            >
                <div className={style["audio-player"]}>
                    <audio controls type="audio/mpeg" ref={playerRef} autoPlay />
                </div>
                {nowPlaying.current ? (
                <div className={style["song-in-bottom-bar"]}>
                    <div  className={clsx(style["mini-thumbnail2"], style["no-select"])}>
                        <Image src={nowPlaying.current.thumbnailUrl} className={style["cover2"]} width={500} height={500} alt="Thumbnail" />
                    </div> 
                    <div className={style["song-detail2"]}>
                        <div className={style["mini-song-name"]}>
                            <Link 
                                href={`/track/${nowPlaying.current._id}`}
                                className={clsx(style["bold-text"], style["no-select"])}
                                onClick={(e) => e.stopPropagation()} // Stop propagation
                            >
                                {nowPlaying.current.title}
                            </Link>  
                        </div>
                        <Link 
                            href={artistId ? `/artist/${artistId}` : "#"} 
                            className={clsx(style["mini-artist-name"], style["no-select"])}
                            onClick={(e) => {
                                e.stopPropagation(); // Stop propagation
                                if (!artistId) e.preventDefault(); 
                            }}
                        >
                            {nowPlaying.current.artist} 
                        </Link>
                    </div>
                    <div className={style["like-btn-container"]}>
                        <button className={style["like-btn"]} onClick={handleToggleLike}>
                            {isLiked ? (
                                    <Image src="/blue_heart.png" className={style["like-icon"]} width={15} height={15} alt="Liked"/>
                            ) : (
                                <Image src="/unlike.png" className={style["like-icon"]} width={15} height={15} alt="Unlike"/>
                            )}
                        </button>
                    </div>
                </div>
                ) : (
                <div className={style["song-in-bottom-bar"]}></div>
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
                    <div 
                        className={style["progress"]} 
                        onClick={(e) => e.stopPropagation()} // Ngăn chặn mở player khi click vào thanh progress vùng trống
                    >
                        <div className={clsx(style["current-time"], style["no-select"])}>
                            {minutes}:{String(seconds).padStart(2, "0")}
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={safeDuration}
                            step="0.1"
                            value={progress}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                isSeeking.current = true;
                            }}
                            onChange={(e) => {
                                // Chỉ update UI khi kéo
                                setProgress(e.target.value);
                            }}
                            onMouseUp={(e) => {
                                e.stopPropagation();
                                isSeeking.current = false;
                                handleSeek(e.target.value); // Sử dụng hàm chung
                            }}
                            // OnTouch events cho mobile
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                isSeeking.current = true;
                            }}
                            onTouchEnd={(e) => {
                                e.stopPropagation();
                                isSeeking.current = false;
                                // Lưu ý: với touch cần xử lý kỹ hơn nếu e.target.value không chuẩn, 
                                // nhưng input range thường tự xử lý value change
                                handleSeek(progress); 
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
                        <button className={style["queue-btn"]} onClick={toggleQueue}>
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
                        >
                            <img
                                className={style["volume-icon"]}
                                src={getVolumeIcon(volume)}
                                alt="Volume"
                                width={18} height={18}
                                style={{ opacity: 0.9 }}
                            />
                        </button>
                        <input
                            type="range"
                            min="0" max="1" step="0.01"
                            value={volume}
                            onClick={(e) => e.stopPropagation()}
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

            {/* --- LYRICS OVERLAY (Giữ nguyên code của bạn) --- */}
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
                {/* ... Header, Content Lyrics ... */}
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
                                width={80} height={80} alt="Thumbnail"
                            />
                            <div className={style["lyrics-song-info"]}>
                                <h3 className={style["lyrics-song-title"]}>{nowPlaying.current.title}</h3>
                                <p className={style["lyrics-song-artist"]}>{nowPlaying.current.artist}</p>
                            </div>
                    </div>
                    <div className={style["lyrics-controls"]}>
                        <button className={style["close-lyrics"]} onClick={toggleLyrics}>
                            <Image src="/close.png" alt="Close" width={24} height={24}/>
                        </button>
                    </div>
                </div>

                <div className={style["lyrics-content"]} ref={lyricsContentRef}>
                    {lyrics.length > 0 ? (
                        lyrics.map((lyric, index) => (
                            <div key={index} data-lyric-index={index} 
                                className={style["lyric-line"]}
                                style={{ color: index === currentLyricIndex ? (colors.lightVibrant || '#fff') : '#ccc', opacity: index < currentLyricIndex ? 0.6 : 1 }}
                                onClick={() => jumpToLyricTime(lyric.time)}>
                                {lyric.text || "♪"}
                            </div>
                        ))
                    ) : <div className={style["no-lyrics"]}><p>No lyrics available</p></div>}
                </div>
            </div>
        </div>
            )}

            {/* Queue overlay */}
            {showQueue && (
                <div className={style["queueOverlay"]}>
                    <div className={style["queuePanel"]}>
                        {/* Playing section */}
                        <div className={style["queuePlaying"]}>
                            <div className={style["queueSectionHeader"]}>Playing</div>
                            {nowPlaying.current ? (
                                <div className={style["queuePlayingRow"]}>
                                    <img src={nowPlaying.current.thumbnailUrl || '/background.jpg'} className={style["queueThumb"]} alt="thumb" />
                                    <div className={style["queueMeta"]}>
                                        <Link
                                            href={nowPlaying.current._id ? `/track/${nowPlaying.current._id}` : "#"}
                                            className={style["queueTrackTitle"]}
                                            title={nowPlaying.current.title}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!nowPlaying.current._id) e.preventDefault();
                                            }}
                                        >
                                            {nowPlaying.current.title}
                                        </Link>
                                        <Link
                                            href={artistId ? `/artist/${artistId}` : "#"}
                                            className={style["queueTrackArtist"]}
                                            title={nowPlaying.current.artist}
                                            onClick={(e) => {
                                                if (!artistId) e.preventDefault();
                                            }}
                                        >
                                            {nowPlaying.current.artist}
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className={style["queueEmpty"]}>No track is playing</div>
                            )}
                        </div>
                        {/* Up Next section */}
                        <div className={style["queueUpNextHeader"]}>
                            <div className={style["queueSectionHeader"]}>Up Next</div>
                        </div>
                        <div className={style["queueList"]}>
                            {(() => {
                                const base = list || [];
                                const currIdx = base.findIndex(t => t?._id === nowPlaying.current?._id);
                                const upNext = currIdx >= 0 ? base.slice(currIdx + 1) : base;
                                console.log(upNext)
                                return upNext.length > 0 ? (
                                    upNext.map((track, idx) => (
                                        <div key={track._id || idx} className={style["queueListItem"]} onClick={async () => {
                                            try {
                                                const plID = playlistPlaying?._id ?? null;
                                                const index = base.findIndex(t => t?._id === nowPlaying.current?._id) ?? 0; // follow existing play() usage
                                                await play(track._id, plID, index, playlistPlaying?.tracks ?? null);
                                            } catch (e) {
                                                console.error('Error playing from queue', e);
                                            }
                                        }}>
                                            {/* Nút play */}
                                            <img src="/play.png" className={style["queuePlayButton"]} alt="Play" />
                                            {/* Thông tin nhạc */}
                                            <img src={track?.thumbnailUrl || '/background.jpg'} className={style["queueThumbSmall"]} alt="thumb" />
                                            <div className={style["queueMeta"]}>
                                                <Link
                                                    href={track?._id ? `/track/${track._id}` : "#"}
                                                    className={style["queueTrackTitle"]}
                                                    title={track?.title}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!track?._id) e.preventDefault();
                                                    }}
                                                >
                                                    {track?.title}
                                                </Link>
                                                <Link
                                                    href={getOwnerId(track) ? `/artist/${getOwnerId(track)}` : "#"}
                                                    className={style["queueTrackArtist"]}
                                                    title={track?.artist}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!getOwnerId(track)) e.preventDefault();
                                                    }}
                                                >
                                                    {track?.artist}
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={style["queueEmpty"]}>No upcoming tracks</div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* --- FULL PLAYER COMPONENT (MOBILE) --- */}
            {/* <FullPlayer 
                isOpen={isFullPlayerOpen}
                onClose={() => setIsFullPlayerOpen(false)}
                currentSong={nowPlaying.current ? {
                    name: nowPlaying.current.title,
                    artist: nowPlaying.current.artist,
                    coverUrl: nowPlaying.current.thumbnailUrl,
                    _id: nowPlaying.current._id
                } : null}
                isPlaying={isPlaying}
                onPlayPause={() => togglePlay(null)} // FullPlayer không cần event object
                onNext={() => toggleNext(null)}
                onPrev={() => togglePrevious(null)}
                currentTime={progress}
                duration={safeDuration}
                onSeek={handleSeek} // Truyền hàm seek đã được tách
                // Các props phụ nếu cần
                isLiked={isLiked}
                onLike={() => handleToggleLike(null)}
                // shuffle, repeat state nếu bạn muốn hiển thị status bên FullPlayer
            /> */}
        </>
    );
});

export default BottomBar;