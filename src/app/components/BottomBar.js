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

    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const playTrack = async (songID) => {
		try{
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${songID}`)
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${response.data.data.audioUrl}`;
            if (!url) throw "Audio URL not found";
            console.log(response.data.data.thumbnailUrl)
            await handleTrack(url, [response.data.data.title, response.data.data.artist, response.data.data.thumbnailUrl]);
            console.log("Playing track:", response.data.data.title);
            console.log("Audio URL:", url);
        }
        catch(error) {
            console.error("Error playing track:", error);
            return "error"; 
        }
	};

    const handleTrack = async (url, info) => {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
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
        trackPlaying.current = info;

        hls.attachMedia(playerRef.current); 
        hls.loadSource(url); 
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            setDuration(data.levels[0].details.totalduration);
            setIsPlaying(true);
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

    useEffect(() => { 
        if (!playerRef.current) return;
        const player = playerRef.current;
        const saved = localStorage.getItem("playbackTime");
        if (saved) player.currentTime = parseFloat(saved);

        const timeUpdate = () => {
            if (!isSeeking.current) {
                setProgress(player.currentTime);
                localStorage.setItem("playbackTime", player.currentTime);
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
    }, [playerRef.current]);

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
                    <img src={trackPlaying.current[2]} className={style["cover2"]}/>
                </Link> 
                <div className={style["song-detail2"]}>
                    <Link href="/play" className={style["mini-song-name"]}>
                        <div className={clsx(style["bold-text"], style["no-select"])}>
                            {trackPlaying.current[0]}
                        </div>  
                    </Link>
                    <a href="/play" className={clsx(style["mini-artist-name"], style["no-select"])}>
                        {trackPlaying.current[1]}
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