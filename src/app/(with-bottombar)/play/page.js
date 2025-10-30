"use client";

import { useRef, useEffect, useState } from "react";
import "./play.css";
import { Virtuoso } from "react-virtuoso";
import Header from "../../components/Header";
import { useBottomBar } from "~/context/BottombarContext";

export default function Home() {
    const { bottomBarRef, nowPlaying, playlistPlaying } = useBottomBar();

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

    const getIndex = (targetID, weight) => {
        return (playlistPlaying?.tracks?.findIndex((track) => track._id === targetID) ?? 0) + weight;
    }

    const toggleTrack = async (trackId) => {
        const index = getIndex(nowPlaying.current._id, 0); 
        await bottomBarRef.current.play(trackId, playlistPlaying._id, index);
    };

    const totalCount = Math.max(0, (playlistPlaying?.tracks?.length ?? 0) - (playlistPlaying?.tracks?.findIndex((song) => song._id === nowPlaying.current?._id) ?? 0) - 1);

    const listSong = ({ index, style }) => {
        const song = playlistPlaying?.tracks[index + getIndex(nowPlaying.current._id, 1)];
        return (
            <div style={style} className="listSong" onClick={async () => await toggleTrack(song._id)}>
                <img src="/play.png" className="play-button no-select" />
                <button className="next-song-queue">
                    <div className="song-in-queue">
                        <div className="mini-thumbnail">
                            <img src={song?.thumbnailUrl} className="cover no-select" />
                        </div>
                        <div className="song-detail">
                            <div className="song-name-queue">
                                <div className="bold-text no-select">{song?.title}</div>
                            </div>
                            <div className="artist-name-queue no-select">{song?.artist}</div>
                        </div>
                    </div>
                </button>
            </div>
        );
    };

    return (
        <div className="background">
            <Header />
            <div className="child">
                {!collapsed ? (
                    <div className="queue-container">
                        <div className="queue-header">
                            <div className="text-queue">
                                <div className="bold-text no-select">Queue</div>
                            </div>
                            <div className="compress">
                                <button
                                    className="compress-btn icon no-select"
                                    title="Compress"
                                    onClick={() => {
                                        setCollapsed(true);
                                    }}
                                >
                                    <img src="/compress.png" alt="Compress" />
                                </button>
                            </div>
                        </div>
                        <div className="is-playing-container">
                            <div className="playing-text">
                                <div className="bold-text no-select">Playing</div>
                            </div>
                            <div className="playing-song-container">
                                <img src="/play.png" className="play-button2 no-select" />
                                <button className="playing-song-queue">
                                    <div className="song-in-queue">
                                        <div className="mini-thumbnail">
                                            <img
                                                src={nowPlaying.current?.thumbnailUrl}
                                                className="cover no-select"
                                            />
                                        </div>
                                        <div className="song-detail">
                                            <div className="song-name-queue">
                                                <div className="bold-text no-select">
                                                    {nowPlaying.current?.title}
                                                </div>
                                            </div>
                                            <div className="artist-name-queue no-select">
                                                {nowPlaying.current?.artist}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                        <div className="next-song-list">
                            <div className="next-text">
                                <div className="bold-text no-select">Next</div>
                            </div>
                            <div className="list-song-container">
                                <Virtuoso
                                    style={{ height: 332, width: "100%" }}
                                    totalCount={totalCount}
                                    itemContent={(index) => listSong({ index })}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="collapsed">
                        <div className="enlarge">
                            <button
                                className="enlarge-btn icon"
                                title="Enlarge"
                                onClick={() => {
                                    setCollapsed(false);
                                }}
                            >
                                <img src="/enlarge.png" alt="Enlarge" />
                            </button>
                        </div>
                    </div>
                )}
                <div className="card">
                    <div className="banner-container">
                        <img src="/albumcover.jpg" alt="cover" />
                    </div>
                </div>
            </div>
        </div>
    );
}
