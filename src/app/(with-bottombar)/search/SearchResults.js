"use client";

import { useBottomBar } from "~/context/BottombarContext";
import Image from "next/image";
import Link from "next/link";
import style from "./search.module.css";
import axios from "axios";

export default function SearchResults({ results, query }) {
    const { bottomBarRef } = useBottomBar();

    const getOwnerId = (track) => {
        if (!track?.owner) return null;
        return typeof track.owner === 'object' ? track.owner._id : track.owner;
    };

    const toggleTrack = async (trackId) => {
        await bottomBarRef.current.play(trackId);
    };

    const handleDownload = async (trackId) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/download/${trackId}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `track_${trackId}.mp3`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error downloading the track:", error);
        }
    };

    return (
        <div>
            <h1>Search results for: “{query}”</h1>
            
            {results.length === 0 ? (
                <div style={{ color: '#ccc', marginTop: '20px' }}>No results found.</div>
            ) : (
                <div className={style.resultsContainer}>
                    {results.map((song) => (
                        <div className={style.resultItem} key={song._id}>
                            <Image
                                src={song.thumbnailUrl || "/default_thumbnail.jpg"}
                                alt={song.title}
                                width={150}
                                height={150}
                                className={style.thumbnail}
                            />
                            <div className={style.songInfo}>
                                <div className={style.playAndTitle}>
                                    <div className={style.playButtonContainer} onClick={() => toggleTrack(song._id)}>
                                        <Image src="/play_black.png" alt="Play" width={24} height={24}/>
                                    </div>
                                    <div className={style.titleArtist}>
                                        <Link 
                                            href={`/track/${song._id}`}
                                            className={style.title}
                                        >
                                            <h3>{song.title}</h3>
                                        </Link>
                                        <Link 
                                            href={getOwnerId(song) ? `/artist/${getOwnerId(song)}` : "#"} 
                                            className={style.artist}
                                            onClick={(e) => {
                                                if (!getOwnerId(song)) e.preventDefault(); 
                                            }}
                                        >
                                            {song.artist}
                                        </Link>
                                    </div>
                                </div>
                                <div className={style.resultItemDetails}>
                                    <div className={style.ButtonContainer}>
                                        <Image src="/like.png" alt="Like" width={15} height={15} id={style.likeIcon}/>
                                        <span className={style.buttonText}> Like</span>
                                    </div>
                                    <div className={style.ButtonContainer}>
                                        <Image src="/copy.png" alt="Copy Link" width={18} height={18}/>
                                        <span className={style.buttonText}> Copy Link</span>
                                    </div>
                                    <div className={style.ButtonContainer} onClick={() => handleDownload(song._id)}>
                                        <Image src="/download.png" alt="Download" width={18} height={18}/>
                                        <span className={style.buttonText}> Download</span>
                                    </div>
                                    <div className={style.ButtonContainer}>
                                        <Image src="/add-to-playlist.png" alt="Add to Playlist" width={18} height={18}/>
                                        <span className={style.buttonText}> Add to Playlist</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}