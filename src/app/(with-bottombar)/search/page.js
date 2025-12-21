'use client';
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBottomBar } from "~/context/BottombarContext";
import Image from "next/image";
import Link from "next/link";
import layout from "~/app/homepage.module.scss"
import style from "./search.module.css";
import Header from "~/app/components/Header";
import Sidebar from "~/app/components/Sidebar";
import axios from "axios";
import clsx from "clsx";

export default function Search() {
    const searchParams = useSearchParams();
    const q = searchParams.get("q") || "";
    const { bottomBarRef } = useBottomBar();
    const [searchResults, setSearchResults] = useState([]);

    const getOwnerId = (track) => {
        if (!track?.owner) return null;
        // Nếu owner là object (đã populate), lấy _id. Nếu là chuỗi, lấy chính nó.
        return typeof track.owner === 'object' ? track.owner._id : track.owner;
    };

    const toggleTrack = async (trackId) => {
        await bottomBarRef.current.play(trackId);
    };
    const handleDownload = async (trackId) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/download/${trackId}`, {
                responseType: 'blob', // Quan trọng để nhận dữ liệu dưới dạng blob
            });
            // Tạo URL tạm thời cho blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `track_${trackId}.mp3`); // Tên file khi tải về
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error downloading the track:", error);
        }
    };

    useEffect(() => {
        const query = searchParams.get("q");
        if (query) {
            // Call API to fetch search results
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/search`, { params: { q: query } })
                .then(response => {
                    setSearchResults(response.data.data);
                })
                .catch(error => {
                    console.error("Error fetching search results:", error);
                });
        }
    }, [searchParams]);

    return (
        <div className={clsx(layout.background)}>
            <Header />
            <Sidebar />
            
            <main className={clsx(layout.main)}>
                <div>
                    <h1>Search results for: “{q}”</h1>
                    <div className={style.resultsContainer}>
                        {searchResults.map((song) => (
                            <div className={style.resultItem} key={song._id}>
                                <Image
                                    src={song.thumbnailUrl || "/default_thumbnail.jpg"}
                                    alt={song.title}
                                    width={150}
                                    height={150}
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
                                                /* Logic: Nếu có owner ID thì link tới đó, không thì link # */
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
                                            <Image src="/like.png" alt="Like" width={15} height={15}/>
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
                </div>
            </main>
        </div>
    );
}



