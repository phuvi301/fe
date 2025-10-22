"use client";

import { useRef, useEffect, useState } from "react";
import './play.css';
import songs from './mockData.js'
import { Sacramento } from "next/font/google";
import { Virtuoso } from "react-virtuoso";
import Header from "../../components/Header";

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
    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed));
    }

    
  }, []);

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

  return (
    <div className="background">
      <Header />
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
                <Virtuoso
                  style={{ height: 332, width: '100%' }}
                  totalCount={queueSong.length}
                  itemContent={(index) => listSong({ index })}
                />
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
        <div className="card">
          <div className="banner-container">
            <img src="/albumcover.jpg" alt="cover"/>
          </div>
        </div>
      </div>
    </div>
  )
}
