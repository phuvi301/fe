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
    const isSeeking = useRef(false);
    const listenedSegments = useRef(new Set());

    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        playerRef.current.volume = 0
    }, [])

    const playTrack = async (songID) => {
		try{
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${songID}`);
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${response.data.data.audioUrl}`;
            if (!url) throw "Audio URL not found";
            console.log(response.data.data.thumbnailUrl)
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
        hls.attachMedia(playerRef.current); 
        hls.loadSource(url);
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            setDuration(data.levels[0].details.totalduration);
            let hasCounted;
            // Khi reload trang, nhạc tạm dừng
            if (!trackPlaying.current) {
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

    // Tăng playCount khi nghe hơn 40% duration của bài
    const handleListendSegments = () => {
        const saved = localStorage.getItem("listenedSegments");
        if (saved) listenedSegments.current = new Set(JSON.parse(saved));

        listenedSegments.current.add(Math.round(playerRef.current.currentTime));
        if ((listenedSegments.current.size / Math.round(trackPlaying.current.duration)) >= 0.4 && !trackPlaying.current.hasCounted) {
            increasePlayCount();
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
                setProgress(playerRef.current.currentTime);
                localStorage.setItem("playbackTime", playerRef.current.currentTime);

                // Ghi nhận tổng thời lượng đã nghe
                if (!playerRef.current.paused) {
                    handleListendSegments();
                    localStorage.setItem("listenedSegments", JSON.stringify([...listenedSegments.current]));
                }
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

    const minutes = Math.floor(progress / 60);
    const seconds = Math.floor(progress % 60);

    useImperativeHandle(ref, () => ({
        playTrack,
    }));

    return (
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
    )
});

export default BottomBar;