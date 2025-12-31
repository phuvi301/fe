"use client";

import { useRef } from "react";
import Image from "next/image";
import style from "../homepage.module.scss"; // Đảm bảo đường dẫn đúng
import { useBottomBar } from "~/context/BottombarContext";

export default function TrackSection({ title, subtitle, tracks, priority = false }) {
    const listRef = useRef(null);
    const { bottomBarRef } = useBottomBar();

    // Logic play nhạc
    const toggleTrack = async (trackId) => {
        if (bottomBarRef.current) {
            await bottomBarRef.current.play(trackId);
        }
    };

    // Logic scroll ngang (Đã được đơn giản hóa)
    const scrollTracks = (direction) => {
        if (listRef.current) {
            const scrollAmount = 700;
            listRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    if (!tracks || tracks.length === 0) return null;

    return (
        <article className={style["featured-section"]}>
            <div className={style["section-header"]}>
                <div>
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>
                {/* Chỉ hiện nút scroll nếu có danh sách */}
                <div className={style["scroll-buttons"]}>
                    <button
                        className={`${style["scroll-btn"]} ${style.left}`}
                        onClick={() => scrollTracks("left")}
                        aria-label="Scroll Left"
                    >
                        <Image src="/chevron-left.png" width={24} height={24} alt="Left" />
                    </button>
                    <button
                        className={`${style["scroll-btn"]} ${style.right}`}
                        onClick={() => scrollTracks("right")}
                        aria-label="Scroll Right"
                    >
                        <Image src="/chevron-right.png" width={24} height={24} alt="Right" />
                    </button>
                </div>
            </div>

            <div className={style["featured-container"]} ref={listRef}>
                {tracks.map((track, index) => (
                    <div
                        className={style["featured-item"]}
                        key={track._id}
                        onClick={() => toggleTrack(track._id)}
                    >
                        <div className={style["track-container"]}>
                            <Image
                                src={track.thumbnailUrl || "/default-thumb.png"}
                                width={200} // Giảm size ảnh xuống mức cần thiết để load nhanh hơn
                                height={200}
                                alt={track.title}
                                // Chỉ ưu tiên load ảnh cho 6 hình đầu tiên của section đầu tiên
                                priority={priority && index < 6}
                                className={style["track-image"]}
                            />
                            <span className={style["track-title"]}>{track.title}</span>
                        </div>
                    </div>
                ))}
            </div>
        </article>
    );
}