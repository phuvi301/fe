'use client'
import style from "../homepage.module.css";
import { forwardRef, useState, useRef, useImperativeHandle, useEffect } from "react";
import Hls from "hls.js";
import axios from "axios";
import Link from "next/link";
import clsx from "clsx";

const BottomBar = forwardRef((props, ref) => {

    const playerRef = useRef(null);
    const hlsRef = useRef(null);
    const trackPlaying = useRef(null);
    const playlistPlayingRef = useRef([])
    const isSeeking = useRef(false);
    const listenedSegments = useRef(new Set());

    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    // Thêm state cho lyrics
    const [showLyrics, setShowLyrics] = useState(false);
    const [lyrics, setLyrics] = useState([]);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

    useEffect(() => {
        playerRef.current.volume = 0.2;
    }, [])

    const playTrack = async (songID) => {
		try{
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${songID}`)
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${response.data.data.audioUrl}`;
            if (!url) throw "Audio URL not found";
            console.log(response.data.data.thumbnailUrl)
            
            // Fetch lyrics nếu có
            await fetchLyrics(songID);
            
            await handleTrack(url, response.data.data);
            console.log("Playing track:", response.data.data.title);
            console.log("Audio URL:", url);
            console.log("Id song:", response.data.data._id);
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
            }
        } catch (error) {
            // Nếu không có lyrics từ API, dùng lyrics mặc định để demo
            console.log("No lyrics found, using sample lyrics");
            
            // Thêm lyrics mẫu để demo
            const sampleLyrics = `[00:15.20]Em ơi anh yêu em nhiều lắm
[00:20.50]Từng đêm anh mơ về em
[00:25.80]Những kỷ niệm ngày xưa ta có
[00:31.10]Giờ đây chỉ còn trong tim
[00:36.40]Chorus: Em có biết không
[00:41.70]Trái tim anh đau đớn
[00:47.00]Khi em ra đi xa anh
[00:52.30]Để lại nỗi nhớ thương
[00:57.60]Verse 2: Những chiều hoàng hôn
[01:02.90]Anh ngồi nhìn ra phố
[01:08.20]Tìm kiếm bóng dáng em
[01:13.50]Trong từng người qua lại
[01:18.80]Bridge: Ước gì thời gian quay lại
[01:24.10]Để anh nói với em
[01:29.40]Rằng anh yêu em nhiều lắm
[01:34.70]Và không bao giờ quên`;
            
            parseLyrics(sampleLyrics);
        }
    };

    // Parse lyrics với timestamp (format .lrc)
    const parseLyrics = (lyricsText) => {
        const lines = lyricsText.split('\n');
        const parsedLyrics = [];
        
        lines.forEach(line => {
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3].padEnd(3, '0'));
                const text = match[4].trim();
                const time = minutes * 60 + seconds + milliseconds / 1000;
                
                parsedLyrics.push({ time, text });
            }
        });
        
        setLyrics(parsedLyrics);
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
                // console.log(trackPlaying.current.hasCounted);
                setProgress(playerRef.current.currentTime);
                localStorage.setItem("playbackTime", playerRef.current.currentTime);

                // Ghi nhận tổng thời lượng đã nghe
                if (!playerRef.current.paused) {
                    handleListendSegments();
                    localStorage.setItem("listenedSegments", JSON.stringify([...listenedSegments.current]));
                }
                updateCurrentLyric(playerRef.current.currentTime);
            }
        }

        const ended = () => {
            setIsPlaying(false);
        }

        player.addEventListener("timeupdate", timeUpdate);
        player.addEventListener("ended", ended);

        return () => {
            player.removeEventListener("timeupdate", timeUpdate);
            player.removeEventListener("ended", ended);
        }
    }, []);

    const loadSampleLyrics = () => {
        // Sử dụng timestamps ngắn hơn để dễ test (bắt đầu từ 5 giây)
        const sampleLyrics = `[00:05.00]Bài hát bắt đầu
[00:10.00]Dòng lyrics thứ hai
[00:15.00]Dòng lyrics thứ ba
[00:20.00]Chorus: Phần điệp khúc
[00:25.00]Tiếp tục với câu tiếp theo
[00:30.00]Verse 2: Đoạn thứ hai
[00:35.00]Gần kết thúc rồi
[00:40.00]Kết thúc bài hát`;
        
        parseLyrics(sampleLyrics);
        setShowLyrics(true);
        
        // Debug: In ra lyrics đã parse
        console.log("Sample lyrics loaded for testing");
    };

    // Thêm hàm test timeline giả lập
    const testLyricsSync = () => {
        if (lyrics.length === 0) {
            alert("Vui lòng load lyrics trước khi test!");
            return;
        }
        
        console.log("Bắt đầu test đồng bộ lyrics");
        let testTime = 0;
        
        const testInterval = setInterval(() => {
            testTime += 1; // Tăng 1 giây mỗi lần
            console.log(`Test time: ${testTime}s`);
            
            // Giả lập updateCurrentLyric
            updateCurrentLyric(testTime);
            
            // Dừng test sau 45 giây
            if (testTime >= 45) {
                clearInterval(testInterval);
                console.log("Test đồng bộ lyrics hoàn thành");
            }
        }, 1000); // Chạy mỗi giây
    };

    // Cải thiện hàm updateCurrentLyric với debug
    const updateCurrentLyric = (currentTime) => {
        if (lyrics.length === 0) return;
        
        let index = -1;
        for (let i = 0; i < lyrics.length; i++) {
            if (currentTime >= lyrics[i].time) {
                index = i;
            } else {
                break;
            }
        }
        
        // Debug log khi lyrics thay đổi
        if (index !== currentLyricIndex && index >= 0) {
            console.log(`Lyrics changed to: "${lyrics[index].text}" at ${currentTime}s`);
        }
        
        setCurrentLyricIndex(index);
    };

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

    // Thêm hàm để jump đến thời điểm lyrics được click
    const jumpToLyricTime = (time) => {
        if (playerRef.current) {
            playerRef.current.currentTime = time;
            setProgress(time);
            
            // Cập nhật localStorage để lưu vị trí mới
            localStorage.setItem("playbackTime", time);
            
            // Debug log
            console.log(`Jumped to lyric time: ${time}s`);
            
            // Cập nhật ngay lyrics hiện tại
            updateCurrentLyric(time);
        }
    };

    const minutes = Math.floor(progress / 60);
    const seconds = Math.floor(progress % 60);

    useImperativeHandle(ref, () => ({
        playTrack,
        playlistPlayingRef,
        trackPlaying
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
                    <img src={trackPlaying.current.thumbnailUrl} className={style["cover2"]}/>
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
                            title="Hiển thị lời bài hát"
                        >
                            <img src="/lyrics.png" className={style["menu-btn"]}/>
                        </button>
                        {/* Nút test tạm thời */}
                        {/* <button 
                            onClick={loadSampleLyrics}
                            style={{ padding: '5px 10px', fontSize: '12px', background: '#666', color: 'white', border: 'none', borderRadius: '3px', marginRight: '5px' }}
                        >
                            Load Lyrics
                        </button>
                        <button 
                            onClick={testLyricsSync}
                            style={{ padding: '5px 10px', fontSize: '12px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '3px' }}
                        >
                            Test Sync
                        </button> */}
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
                    {/* Lyrics Panel */}
            {showLyrics && (
                <div className={style["lyrics-panel"]}>
                    <div className={style["lyrics-header"]}>
                        <h3>Lời bài hát</h3>
                        {/* Debug info */}
                        {/* <div style={{ fontSize: '12px', color: '#666' }}>
                            Time: {minutes}:{String(seconds).padStart(2, "0")}
                            <br />
                        </div> */}
                        <button 
                            className={style["close-lyrics"]} 
                            onClick={toggleLyrics}
                        >
                            ✕
                        </button>
                    </div>
                    <div className={style["lyrics-content"]}>
                        {lyrics.length > 0 ? (
                            lyrics.map((lyric, index) => (
                                <div
                                    key={index}
                                    className={clsx(
                                        style["lyric-line"],
                                        { [style["current-lyric"]]: index === currentLyricIndex }
                                    )}
                                    style={{ 
                                        position: 'relative',
                                        cursor: 'pointer', // Thêm cursor pointer
                                        padding: '8px 12px', // Tăng padding để dễ click
                                        borderRadius: '4px', // Bo góc nhẹ
                                        transition: 'all 0.2s ease' // Smooth transition
                                    }}
                                    onClick={() => jumpToLyricTime(lyric.time)} // Thêm onClick handler
                                    onMouseEnter={(e) => {
                                        // Thêm hover effect
                                        if (index !== currentLyricIndex) {
                                            e.target.style.backgroundColor = '#333';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        // Remove hover effect
                                        if (index !== currentLyricIndex) {
                                            e.target.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                    title={`Click để jump đến ${Math.floor(lyric.time / 60)}:${String(Math.floor(lyric.time % 60)).padStart(2, "0")}`} // Tooltip
                                >
                                    <span style={{ 
                                        fontSize: '10px', 
                                        color: '#666', 
                                        marginRight: '10px',
                                        minWidth: '40px', // Đảm bảo timestamp có width cố định
                                        display: 'inline-block'
                                    }}>
                                        {Math.floor(lyric.time / 60)}:{String(Math.floor(lyric.time % 60)).padStart(2, "0")}
                                    </span>
                                    {lyric.text}
                                </div>
                            ))
                        ) : (
                            <div className={style["no-lyrics"]}>
                                Không có lời bài hát
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
});

export default BottomBar;