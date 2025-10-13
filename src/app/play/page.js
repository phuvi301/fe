"use client";

import { useRef, useEffect, useState } from "react";
import './play.css';
import songs from './mockData.js'
import { Sacramento } from "next/font/google";
import {FixedSizeList as List} from "react-window";
import axios from "axios";

export default function Home() {
  
  const [searchInput, setSearchInput] = useState("");
  const searchInputRef = useRef(null);
  const clearInput = () => {
    setSearchInput("");
    searchInputRef.current.focus();
  };

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("Collapsing");
    const curr = localStorage.getItem("progress");
    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed));
    }

    if (curr !== null) {
      setProgress(JSON.parse(curr));
    }
  }, []);

  // const [collapsed, setCollapsed] = useState(() => {
  //   if (typeof window !== "undefined") {
  //     const savedCollapsed = localStorage.getItem("queueState");
  //     return savedCollapsed !== null ? savedCollapsed === "true" : false;
  //   }
  //   return false;
  // })

  useEffect(() => {
      localStorage.setItem("Collapsing", JSON.stringify(collapsed));
  }, [collapsed]);

  const queueSong = Array.from({length: songs.length}, (_, i) => 
  ({
      title: songs[i].title,
      artist: songs[i].artist
  }));

  const listSong = ({index, style}) => {
    const song = songs[index];
    return (
    <div style={style} className="listSong">
      <img src="/play.png" className="play-button no-select"/>
      <button className="next-song-queue">
        <div className="song-in-queue">
          <div className="mini-thumbnail">
            <img src="/albumcover.jpg" className="cover no-select"/>
          </div>  
          <div className="song-detail">
            <div className="song-name-queue">
              <div className="bold-text no-select">
                {song.title}
              </div>  
            </div>
            <div className="artist-name-queue no-select">
              {song.artist}
            </div>
          </div>  
        </div>  
      </button>    
    </div>
  );};

  const [progress, setProgress] = useState(0);

  const handleProgressChange = (e) => {
    setProgress(e.target.value);
  };

  const durationSeconds = 3 * 60 + 45;
  const currentTimeSeconds = (progress / 100) * durationSeconds;
  const minutes = Math.floor(currentTimeSeconds / 60);
  const seconds = Math.floor(currentTimeSeconds % 60);

  useEffect(() => {
    localStorage.setItem("progress", JSON.stringify(progress))
  }, [progress]);

  const [trackPlaying, setTrackPlaying] = useState("");

  const playTrack = async (track) => {
		console.log(track);
		axios
			.post("http://localhost:8080/api/tracks/getTrack/", { title: track })
			.then((response) => {
				console.log("Response data:", response.data);
				const url = response.data.data.audioUrl;
				if (!url) throw "Audio URL not found";
				setTrackPlaying(url);
				console.log("Playing track:", track);
				console.log("Audio URL:", url);
			})
			.catch((error) => {
				console.error("Error playing track:", error);
			});
  }

  return (
    <div className="background">
      <header>
        {/* Logo */}
        <a href="/"><img id="logo" src="/logo.png"/></a>
        {/* Search bar */}
        <div className="search-container">
          <div className="search-bar">
            <span className="search-btn" title="Search">
              <img src="/search-button.png" alt="Search" />
            </span>
            <input type="text" placeholder="What do you wanna listen today?" id="search-input" spellCheck="false" autoCorrect="off" autoCapitalize="off" 
              ref={searchInputRef}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <span className="clear-btn" onClick={clearInput} title="Clear">
                <img src="/cancel-icon.png" alt="Cancel" />
              </span>
            )}
            <span className="micro-button" title="Music recognition">
              <img src="/microphone.png" alt="Recognition" />
            </span>
          </div>
        </div>
        {/* Profile */}
        <button id="profile-button" title="Profile"><img src="/hcmut.png" /></button>
      </header>
      <div className="child">
        {!collapsed ? (
          <div className="queue-container">
            <div className="queue-header">
              <div className="text-queue">
                <div className="bold-text no-select">
                  Queue
                </div>
              </div>
              <div className="compress">
                <button className="compress-btn icon no-select" title="Compress" onClick={() => {
                    setCollapsed(true)}
                  }>
                  <img src="/compress.png" alt="Compress" />
                </button>
              </div>
            </div>
            <div className="is-playing-container">
              <div className="playing-text">
                <div className="bold-text no-select">
                  Playing
                </div>
              </div>
              <div className="playing-song-container">
                <img src="/play.png" className="play-button2 no-select"/>
                <button className="playing-song-queue">
                  <div className="song-in-queue">
                    <div className="mini-thumbnail">
                      <img src="/albumcover.jpg" className="cover no-select"/>
                    </div>  
                    <div className="song-detail">
                      <div className="song-name-queue">
                        <div className="bold-text no-select">
                          beside you
                        </div>  
                      </div>
                      <div className="artist-name-queue no-select">
                        keshi
                      </div>
                    </div>  
                  </div>  
                </button> 
              </div>
            </div>
            <div className="next-song-list">
              <div className="next-text">
                <div className="bold-text no-select">
                  Next
                </div>
              </div>
              <div className="list-song-container">
                <List
                  height={332}
                  itemCount={queueSong.length}
                  itemSize={70}
                  width="100%"
                >
                  {listSong}
                </List>  
              </div>  
            </div> 
          </div>
        ) : (
          <div className="collapsed">
            <div className="enlarge">
                <button className="enlarge-btn icon" title="Enlarge" onClick={() => {
                    setCollapsed(false)}
                  }>
                  <img src="/enlarge.png" alt="Enlarge" />
                </button>
              </div>
          </div>
        )}
        {/* <div className={`queue-container ${collapsed ? "collapsed" : ""}`} id="queue-container">
          <div className="queue-header">
            <div className="text-queue">
              <div className="bold-text">
                Queue
              </div>
            </div>
            <div className="compress">
              <button className="compress-btn" title="Compress" onClick={() => {
                const container = document.getElementById("queue-container");
                container.style.display = "none";
                setCollapsed(!collapsed)}
                }>
                <img src="/compress.png" alt="Compress" />
              </button>
            </div>
          </div>
        </div> */}
        {/* <div className="card">
          <div className="banner-container">
            <img src="/albumcover.jpg" alt="cover"/>
          </div>
        </div> */}
        {trackPlaying && (
          <div className="audio-player">
            <audio controls type="audio/mpeg" />
          </div>
        )}
      </div>
      <div className="bottom-bar-container">
        <div className="song-in-bottom-bar">
          <a href="/play" className="mini-thumbnail2 no-select">
              <img src="/albumcover.jpg" className="cover2"/>
          </a> 
          <div className="song-detail2">
            <a href="/play" className="mini-song-name">
              <div className="bold-text no-select">
                beside you
              </div>  
            </a>
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
            <a className="play" onClick={() => playTrack("keshi - LIMBO (Visualizer)")}>
              <img src="/play.png" className="menu-btn"/>
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
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="progress-bar"
              style={{
                background: `linear-gradient(to right, #3c74cfff ${progress}%, #333 ${progress}%)`,
                borderRadius: '5px',
              }}
            />
            <span className="duration no-select">3:45</span>
          </div>
        </div>
      </div>
    </div>
  )
}
