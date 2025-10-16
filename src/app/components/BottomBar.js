'use client'
import "../play/play.css"
import { forwardRef, useState, useRef, useImperativeHandle } from "react";
import Hls from "hls.js";
import axios from "axios";
import Link from "next/link";

const BottomBar = forwardRef((props, ref) => {
    const playerRef = useRef(null);
    const hlsRef = useRef(null);
    const [trackPlaying, setTrackPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const isSeeking = useRef(false);

    const playTrack = async (songID) => {
		axios
			.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${songID}`)
			.then((response) => {
				const url = `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${response.data.data.audioUrl}`;
				if (!url) throw "Audio URL not found";
				handleTrack(url);
				console.log("Playing track:", response.data.data.title);
				console.log("Audio URL:", url);
			})
			.catch((error) => {
				console.error("Error playing track:", error);
			});
	};

    const handleTrack = async (url) => {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        const hls = new Hls(); 
        hlsRef.current = hls;
        setTrackPlaying(true);
        hls.attachMedia(playerRef.current); 
        hls.loadSource(url); 
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            loadProgress(data.levels[0].details.totalduration);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
        });
    }

    const loadProgress = (audioDuration) => { 
        const saved = localStorage.getItem("playbackTime");
        if (saved) playerRef.currentTime = parseFloat(saved);
        setIsPlaying(true);

        const loadMetadata = () => {
            setDuration(audioDuration);
        }

        const timeUpdate = () => {
            if (!isSeeking.current) {
                setProgress(playerRef.current.currentTime);
                localStorage.setItem("playbackTime", playerRef.current.currentTime);
            }
        }

        const ended = () => setIsPlaying(false);

        playerRef.current.addEventListener("loadedmetadata", loadMetadata);

        playerRef.current.addEventListener("timeupdate", timeUpdate);

        playerRef.current.addEventListener("ended", ended);

        return () => {
            playerRef.current.removeEventListener("loadmetadata", loadMetadata);
            playerRef.current.removeEventListener("timeupdate", timeUpdate);
            playerRef.current.removeEventListener("ended", ended);
        };
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

    const minutes = Math.floor(progress / 60);
    const seconds = Math.floor(progress % 60);

    useImperativeHandle(ref, () => ({
        playTrack,
    }));

    return (
        <div className="bottom-bar-container" hidden={true}>
            <div className="audio-player">
                <audio controls type="audio/mpeg" ref={playerRef} autoPlay hidden />
            </div>
            <div className="song-in-bottom-bar">
                <Link href="/play" className="mini-thumbnail2 no-select">
                    <img src="/albumcover.jpg" className="cover2"/>
                </Link> 
                <div className="song-detail2">
                    <Link href="/play" className="mini-song-name">
                        <div className="bold-text no-select">
                            beside you
                        </div>  
                    </Link>
                    <a href="/play" className="mini-artist-name no-select">
                    keshi
                    </a>
                </div> 
            </div>
            <div className="music-player">
                <div className="bottom-menu">
                    <button className="shuffle">
                        <img src="/shuffle.png" className="menu-btn"/>
                    </button>
                    <button className="previous">
                        <img src="/previous.png" className="menu-btn"/>
                    </button>
                    <a className="play" onClick={togglePlay}>
                        <img src={!isPlaying ? "/play.png" : "pause.png"} className="menu-btn"/>
                    </a>
                    <button className="next">
                        <img src="/next.png" className="menu-btn"/>
                    </button>
                    <button className="repeat">
                        <img src="/repeat.png" className="menu-btn"/>
                    </button>
                </div>
                <div className="progress">
                    <div className="current-time no-select">
                        {minutes}:{String(seconds).padStart(2, "0")}
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={progress}
                        onMouseDown={() => isSeeking.current = true}
                        onChange={(e) => setProgress(e.target.value)}
                        onMouseUp={() => {
                            playerRef.current.currentTime = progress;
                            isSeeking.current = false;
                        }}
                        className="progress-bar"
                        style={{
                        background: `linear-gradient(to right, #3c74cfff ${progress / duration * 100}%, #333 ${progress / duration * 100}%)`,
                        borderRadius: '50px',
                        }}
                    />
                    <span className="duration no-select">{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}</span>
                </div>
            </div>
        </div>
    )
});

export default BottomBar;