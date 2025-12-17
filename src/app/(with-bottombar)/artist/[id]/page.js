'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { useBottomBar } from '~/context/BottombarContext';
import Sidebar from "../../../components/Sidebar";
import Header from '../../../components/Header';
import clsx from 'clsx';
import layout from "~/app/homepage.module.css";
import style from "./artist.module.css";
export default function ArtistPage() {
    const { id } = useParams();
    const { bottomBarRef, nowPlaying } = useBottomBar();
    const [artistData, setArtistData] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    const enrichTrackDurations = async (items) => {
        const fetchDuration = (track) => {
            return new Promise((resolve) => {
                if (!track?.audioUrl) return resolve(0);

                const audio = new Audio(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${track.audioUrl}`);
                audio.preload = "metadata";

                const cleanup = () => {
                    audio.onloadedmetadata = null;
                    audio.onerror = null;
                    audio.src = "";
                };

                audio.onloadedmetadata = () => {
                    const dur = Math.round(audio.duration);
                    cleanup();
                    resolve(Number.isFinite(dur) ? dur : 0);
                };

                audio.onerror = () => {
                    cleanup();
                    resolve(0);
                };
            });
        };

        const enriched = await Promise.all(items.map(async (track) => {
            const currentDuration = Number(track?.duration);
            if (Number.isFinite(currentDuration) && currentDuration > 0) {
                return { ...track, duration: currentDuration };
            }
            const fetchedDuration = await fetchDuration(track);
            return { ...track, duration: fetchedDuration };
        }));

        return enriched;
    };

    // Fetch dữ liệu từ Backend
    useEffect(() => {
        let active = true;

        const fetchArtistData = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/artist-profile`);
                if (!active) return;
                setArtistData(res.data.artist);
                const enriched = await enrichTrackDurations(res.data.tracks || []);
                if (!active) return;
                setTracks(enriched);
            } catch (error) {
                console.error("Failed to fetch artist profile", error);
            } finally {
                if (active) setLoading(false);
            }
        };

        if (id) fetchArtistData();

        return () => {
            active = false;
        };
    }, [id]);

    // Xử lý khi nhấn play bài hát trong danh sách
    const handlePlayTrack = async (trackId, index) => {
        const artistPlaylistId = `artist-${id}`;
        console.log("bbbbbbbbbbbbbbbbbb", tracks)
        await bottomBarRef.current.play(trackId, artistPlaylistId, index, tracks);
    };

    const formatDuration = (seconds) => {
        const total = Number(seconds);
        if (!Number.isFinite(total) || total <= 0) return "--:--";
        const min = Math.floor(total / 60);
        const sec = Math.floor(total % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    if (loading) return <div className={style.artistLoading}>Loading...</div>;
    if (!artistData) return <div className={style.artistError}>Artist not found</div>;

    return (
        <div className={layout.background}>
            <Header />
            <Sidebar />
            <div className={style.artistPageWrapper}>
                {/* Artist Banner / Header Section */}
                <div className={style.artistHeaderSection} style={{
                    backgroundImage: `linear-gradient(transparent, rgba(0,0,0,0.6)), url(${artistData.thumbnailUrl})`
                }}>
                    <div className={style.artistInfoContent}>
                        <div className={style.verifiedBadge}>
                            <img src="/verified.png" alt="verified" /> 
                            <span>Verified Artist</span>
                        </div>
                        <h2 className={style.artistNameLarge}>{artistData.name}</h2>
                        <p className={style.monthlyListeners}>{formatNumber(artistData.totalPlays)} listeners</p>
                    </div>
                </div>

                {/* Popular Songs Section */}
                <div className={style.artistBodySection}>
                    <div className={style.artistActions}>
                        <button className={style.btnPlayBig} onClick={() => tracks.length > 0 && handlePlayTrack(tracks[0]._id, 0)}>
                            <img src="/play.png" alt="Play" />
                        </button>
                        <button className={style.btnFollow}>Following</button>
                            <button className={style.btnMore}>•••</button>
                    </div>

                    <h2 className={style.sectionTitle}>Popular Songs</h2>
                    <div className={style.artistTrackList}>
                        {tracks.map((track, index) => (
                            <div 
                                key={track._id} 
                                className={clsx(style.trackRow, nowPlaying.current?._id === track._id && 'active')}
                                onClick={() => handlePlayTrack(track._id, index)}
                            >
                                <div className={style.trackIndex}>
                                    <span className={style.indexNum}>{index + 1}</span>
                                    <img src="/play.png" className={style.indexPlayIcon} alt="play"/>
                                </div>
                                <div className={style.trackInfo}>
                                    <img src={track.thumbnailUrl} alt={track.title} className={style.trackThumb} />
                                    <span className={style.trackTitle}>{track.title}</span>
                                </div>
                                <div className={style.trackPlays}>
                                    {formatNumber(track.playCount || 0)}
                                </div>
                                <div className={style.trackDuration}>
                                    {formatDuration(track.duration || 0)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div >
        </div>
    );
}