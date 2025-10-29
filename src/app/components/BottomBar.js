'use client'
import style from "../homepage.module.css";
import { forwardRef, useState, useRef, useImperativeHandle, useEffect } from "react";
import Hls from "hls.js";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

const BottomBar = forwardRef((props, ref) => {

    const playerRef = useRef(null);
    const hlsRef = useRef(null);
    const trackPlaying = useRef(null);
    const isSeeking = useRef(false);
    const listenedSegments = useRef(new Set());

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

    useEffect(() => {
        playerRef.current.volume = 0.2;
    }, [])

    const playTrack = async (songID) => {
        try{
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${songID}`)
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${response.data.data.audioUrl}`;
            if (!url) throw "Audio URL not found";
            
            // Reset lyrics state khi chuyển bài mới
            setLyrics([]);
            setCurrentLyricIndex(-1);
            setIsLyricsSynced(true);
            
            // Fetch lyrics nếu có
            await fetchLyrics(songID);
            
            await handleTrack(url, response.data.data);
            console.log("Playing track:", response.data.data.title);
        }
        catch(error) {
            console.error("Error playing track:", error);
            return "error"; 
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
            const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
            
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

    const handleTrack = async (url, track) => {
        // Mỗi bài 1 instance => xóa instance cũ khi qua bài mới
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
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
        // setTrackPlaying(true);
        // trackPlaying.current = info;
        hls.attachMedia(playerRef.current); 
        hls.loadSource(url);
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            setDuration(data.levels[0].details.totalduration);
            let hasCounted;
            // Khi reload trang, nhạc tạm dừng
            if (!trackPlaying.current && localStorage.getItem("playbackTime")) {
                playerRef.current.pause(); 
                setIsPlaying(false);
                hasCounted = localStorage.getItem("hasCounted");
            }
            // Khi đổi bài mới
            else {
                setIsPlaying(true);
                listenedSegments.current.clear();
                localStorage.setItem("listenedSegments", JSON.stringify([...listenedSegments.current]));
                hasCounted = false;
                localStorage.setItem("hasCounted", false);
            }
            // console.log(isPlaying);
            trackPlaying.current = track;
            trackPlaying.current.hasCounted = hasCounted;
            trackPlaying.current.duration = data.levels[0].details.totalduration;
            localStorage.setItem("playedTrack", trackPlaying.current._id); 
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            console.log('HLS error:', data);
            if (data.details === "bufferSeekOverHole") {
                console.log("hello");
            }
            if (data.details === "bufferStalledError") {
                console.log("hello");
                hls.startLoad(playerRef.current.currentTime);
            }
        });
    }

    // Tăng playCount và lưu vào danh sách đã nghe khi nghe hơn 40% duration của bài
    const handleListendSegments = () => {
        const {_id} = JSON.parse(localStorage.getItem("userInfo")); 
        if (!_id) return; // Chỉ khi đăng nhập mới chạy

        const saved = localStorage.getItem("listenedSegments");
        if (saved) listenedSegments.current = new Set(JSON.parse(saved));

        listenedSegments.current.add(Math.round(playerRef.current.currentTime));
        // console.log(listenedSegments.current.size);
        // console.log(trackPlaying.current.duration);
        // console.log((listenedSegments.current.size / Math.round(trackPlaying.current.duration)) >= 0.4)
        if ((listenedSegments.current.size / Math.round(trackPlaying.current.duration)) >= 0.4 && !trackPlaying.current.hasCounted) {
            increasePlayCount();
            addToHistory(_id);
            trackPlaying.current.hasCounted = true;
            localStorage.setItem("hasCounted", true);
        }
    }

    const increasePlayCount = async () => {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${trackPlaying.current._id}/playCount`);
            console.log(res.data.message);
        } catch(err) {
            console.error("Track has not gotten any playCount!", err);
        } 
    }

    const addToHistory = async (_id) => {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/history/${_id}`, {trackID: trackPlaying.current._id});
            console.log(res.data.message);
        } catch(err) {
            console.error("Track has not been added to history", err);
        }
    }

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

        // Giữ tiến trình bài hiện tại khi reload trang
        const playedTrack = localStorage.getItem("playedTrack");        
        const saved = localStorage.getItem("playbackTime");
        if (saved && playedTrack && !trackPlaying.current) {
            playTrack(playedTrack);
            playerRef.current.currentTime = parseFloat(saved);
        }

        const timeUpdate = () => {
            if (!isSeeking.current) {
                const currentTime = playerRef.current.currentTime;
                setProgress(currentTime);
                localStorage.setItem("playbackTime", currentTime);

                // Ghi nhận tổng thời lượng đã nghe
                if (!playerRef.current.paused) {
                    handleListendSegments();
                    localStorage.setItem("listenedSegments", JSON.stringify([...listenedSegments.current]));
                }
                
                // Cập nhật lyrics với tần suất cao hơn để đồng bộ chính xác
                updateCurrentLyric(currentTime);
            }
        }

        const ended = () => {
            setIsPlaying(false);
            setCurrentLyricIndex(-1); // Reset lyrics khi hết bài
        }

        // Lắng nghe sự kiện với tần suất cao hơn
        player.addEventListener("timeupdate", timeUpdate);
        player.addEventListener("ended", ended);
        
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
        }
    }, [lyrics, isLyricsSynced]);

    const togglePlay = () => {
        const player = playerRef.current;
        if (player.paused) {
            player.play();
            setIsPlaying(true);
        } else {
            player.pause();
            setIsPlaying(false);
        }
    };

    const toggleLyrics = () => {
        setShowLyrics(!showLyrics);
    };

    const minutes = Math.floor(progress / 60);
    const seconds = Math.floor(progress % 60);

    useImperativeHandle(ref, () => ({
        playTrack,
    }));

    return (
        <>
        <div className={style["bottom-bar-container"]} hidden={true}>
            <div className={style["audio-player"]}>
                <audio controls type="audio/mpeg" ref={playerRef} autoPlay hidden />
            </div>
            {trackPlaying.current ? (
            <div className={style["song-in-bottom-bar"]}>
                <Link href="/play" className={clsx(style["mini-thumbnail2"], style["no-select"])}>
                    <Image src={trackPlaying.current.thumbnailUrl} className={style["cover2"]} width={500} height={500} alt="Thumbnail" />
                </Link> 
                <div className={style["song-detail2"]}>
                    <Link href="/play" className={style["mini-song-name"]}>
                        <div className={clsx(style["bold-text"], style["no-select"])}>
                            {trackPlaying.current.title}
                        </div>  
                    </Link>
                    <a href="/play" className={clsx(style["mini-artist-name"], style["no-select"])}>
                        {trackPlaying.current.artist}
                    </a>
                </div> 
            </div>
            ) : (
            <div className={style["song-in-bottom-bar"]}> 
            </div>
            )}
            <div className={style["music-player"]}>
                <div className={style["bottom-menu"]}>
                    <button className={style["shuffle"]}>
                        <img src="/shuffle.png" className={style["menu-btn"]}/>
                    </button>
                    <button className={style["previous"]}>
                        <img src="/previous.png" className={style["menu-btn"]}/>
                    </button>
                    <a className={style["play"]} onClick={togglePlay}>
                        <img src={!isPlaying ? "/play.png" : "pause.png"} className={style["menu-btn"]}/>
                    </a>
                    <button className={style["next"]}>
                        <img src="/next.png" className={style["menu-btn"]}/>
                    </button>
                    <button className={style["repeat"]}>
                        <img src="/repeat.png" className={style["menu-btn"]}/>
                    </button>
                    <button 
                        className={clsx(style["lyrics-btn"], { [style["active"]]: showLyrics })} 
                        onClick={toggleLyrics}
                    >
                        <img src="/lyrics.png" className={style["menu-btn"]}/>
                    </button>
                </div>
                <div className={style["progress"]}>
                    <div className={clsx(style["current-time"], style["no-select"])}>
                        {minutes}:{String(seconds).padStart(2, "0")}
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={progress}
                        onMouseDown={() => {
                            isSeeking.current = true;
                        }}
                        onChange={(e) => setProgress(e.target.value)}
                        onMouseUp={() => {
                            playerRef.current.currentTime = progress;
                            isSeeking.current = false;
                            hlsRef.current.stopLoad();
                            hlsRef.current.startLoad(progress);
                        }}
                        className={style["progress-bar"]}
                        style={{
                        background: `linear-gradient(to right, #3c74cfff ${progress / duration * 100}%, #333 ${progress / duration * 100}%)`,
                        borderRadius: '50px',
                        }}
                    />
                    <span className={clsx(style["duration"], style["no-select"])}>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}</span>
                </div>

            </div>
        </div>
         {/* Lyrics Panel với cải tiến scroll detection */}
        {showLyrics && (
            <div className={style["lyrics-panel"]}>
                <div className={style["lyrics-header"]}>
                    <h2>Lyrics</h2>
                    <div className={style["lyrics-controls"]}>
                        <button 
                            className={style["close-lyrics"]} 
                            onClick={toggleLyrics}
                        >
                            <Image src="/close.png" alt="Close" width={24} height={24}/>
                        </button>
                    </div>
                </div>
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
                                    style["lyric-line"],
                                    { 
                                        [style["current-lyric"]]: index === currentLyricIndex,
                                        [style["upcoming-lyric"]]: index === currentLyricIndex + 1,
                                        [style["past-lyric"]]: index < currentLyricIndex
                                    }
                                )}
                                style={{ 
                                    position: 'relative',
                                    cursor: 'pointer',
                                    padding: '12px 16px',
                                    borderRadius: '6px',
                                    transition: 'all 0.3s ease',
                                    margin: '4px 0',
                                    backgroundColor: index === currentLyricIndex ? 'rgba(60, 116, 207, 0.2)' : 'transparent',
                                    borderLeft: index === currentLyricIndex ? '3px solid #3c74cfff' : '3px solid transparent',
                                    opacity: index < currentLyricIndex ? 0.6 : 1,
                                    transform: index === currentLyricIndex ? 'scale(1.02)' : 'scale(1)'
                                }}
                                onClick={() => jumpToLyricTime(lyric.time)}
                            >
                                <span className={style["lyric-text"]}>
                                    {lyric.text || "♪"}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className={style["no-lyrics"]}>
                            <p>No lyrics available</p>
                        </div>
                    )}
                </div>
            </div>
        )}
        </>
    );
});

export default BottomBar;