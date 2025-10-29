"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import layout from "~/app/homepage.module.css";
import styles from "./playlists.module.css";
import Header from "~/app/components/Header";
import Sidebar from "~/app/components/Sidebar";
import axios from "axios";
import { useBottomBar } from "~/context/BottombarContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis, faL, faPencil, faXmark } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

// --- Constants ---

const DEFAULT_PLAYLIST_COVER = "/playlist-default.png";

// --- Helper Functions ---

function nextUnnamedName(list) {
    for (let i = 1; ; i++) {
        const candidate = `Unnamed Playlist #${i}`;
        const taken = list.some((p) => (p.name || "").trim().toLowerCase() === candidate.toLowerCase());
        if (!taken) return candidate;
    }
}

function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

function formatDuration(s) {
    const m = Math.floor(s / 60);
    const ss = `${s % 60}`.padStart(2, "0");
    return `${m}:${ss}`;
}

// --- Main Page Component ---

export default function PlaylistsPage() {
    // --- State Management ---
    const [playlists, setPlaylists] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditPlaylistOpen, setIsEditPlaylistOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [pickerResults, setPickerResults] = useState([]);
    const { bottomBarRef } = useBottomBar();

    const current = useMemo(() => playlists.find((p) => p._id === selectedId) || null, [playlists, selectedId]);

    // --- Effects ---
    useEffect(() => {
        (async () => {
            try {
                const userData = JSON.parse(localStorage.getItem("userInfo"));
                const dataFetch = [];
                for (const playlistId of userData.playlists) {
                    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists/${playlistId}`);
                    dataFetch.push(res.data.data);
                }
                console.log(dataFetch);
                setPlaylists(dataFetch);
            } catch {
                setError("Không thể tải danh sách playlist");
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let active = true;
        const fetchApi = async () => {
            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/search`);
            url.searchParams.set("q", searchTerm);
            const results = await axios.get(url.href, {
                headers: {
                    token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                },
            });
            if (active) {
                setPickerResults(results.data.data);
            }
        };

        if (searchTerm) fetchApi();
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    useEffect(() => {
        localStorage.setItem(
            "userInfo",
            JSON.stringify({
                ...JSON.parse(localStorage.getItem("userInfo")),
                playlists: playlists.map((pl) => pl._id),
            })
        );
    }, [playlists]);

    // --- Event Handlers ---
    const handleEditPlaylist = () => setIsEditPlaylistOpen(prev => !prev)

    const handleCreate = async (nameRaw) => {
        const name = nameRaw?.trim();
        const finalName = name || nextUnnamedName(playlists);
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/playlists`,
                {
                    title: finalName,
                    userId: JSON.parse(localStorage.getItem("userInfo"))._id,
                },
                {
                    headers: {
                        token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                    },
                }
            );
            setPlaylists((prev) => [res.data.data, ...prev]);
            setSelectedId(res.data.data._id);
            setToast({ type: "success", message: "Tạo playlist mới thành công" });
        } catch (e) {
            setToast({
                type: "error",
                message: e?.code === "DUPLICATE" ? "Tên playlist đã tồn tại" : "Không thể tạo playlist mới",
            });
        }
    };

    const handleDeletePlaylist = async (id) => {
        if (!confirm("Bạn có chắc muốn xóa playlist này?")) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists/${id}`, {
                headers: {
                    token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                },
            });
            setPlaylists((prev) => prev.filter((p) => p._id !== id));
            setSelectedId((cur) => (cur === id ? null : cur));
            setToast({ type: "success", message: "Đã xóa playlist" });
        } catch {
            setToast({ type: "error", message: "Xóa playlist thất bại" });
        }
    };

    const handleAddSong = async (track) => {
        if (!current) return;
        if (current.tracks.some((t) => t._id === track._id)) {
            setToast({ type: "info", message: "Bài hát đã tồn tại trong playlist" });
            return;
        }
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/playlists/${current._id}/add`,
                {
                    trackId: track._id,
                },
                {
                    headers: {
                        token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                    },
                }
            );
            console.log(res.data);
            setPlaylists((prev) => {
                console.log(prev);
                return [res.data.data, ...prev.filter((pl) => pl._id !== current._id)];
            });
            setToast({ type: "success", message: "Đã thêm bài hát" });
        } catch {
            setToast({ type: "error", message: "Thêm bài hát thất bại" });
        }
    };

    const handleRemoveSong = async (trackId) => {
        if (!current) return;
        if (!confirm("Bạn có chắc muốn xoá bài hát này khỏi playlist?")) return;
        try {
            const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists/${current._id}/remove`, {
                data: {
                    trackId,
                },
                headers: {
                    token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                },
            });
            setPlaylists((prev) => [res.data.data, ...prev.filter((pl) => pl._id !== current._id)]);
            setToast({ type: "success", message: "Đã xoá bài hát khỏi playlist" });
        } catch {
            setToast({ type: "error", message: "Xoá bài hát khỏi playlist thất bại" });
        }
    };

    const handlePlaySong = async (songId) => {
        console.log(current.tracks.map((song) => song._id));
        bottomBarRef.current.playlistPlayingRef.current = current.tracks;
        console.log({ a: bottomBarRef.current });
        await bottomBarRef.current.playTrack(songId);
    };

    // --- Render ---
    return (
        <div className={layout.background}>
            {/* Header */}
            <Header />
            {/* Sidebar */}
            <Sidebar />

            <main className={clsx(styles.main)}>
                {loading ? (
                    <div className={styles.centerMsg}>Đang tải...</div>
                ) : error ? (
                    <div className={styles.errorBox}>{error}</div>
                ) : (
                    <>
                        {!current ? (
                            <div className={clsx(styles.grid, styles.gridSingle)}>
                                <section className={styles.leftCol} aria-labelledby="my-playlists-heading">
                                    <div className={styles.sectionHeader}>
                                        <div>
                                            <h1 id="my-playlists-heading">Danh sách nhạc của tôi</h1>
                                        </div>
                                        <button className={styles.primary} onClick={() => setIsCreateOpen(true)}>
                                            + Tạo playlist mới
                                        </button>
                                    </div>

                                    <ul className={styles.playlistGrid}>
                                        {playlists.map((pl) => (
                                            <li key={pl._id} className={styles.plItem}>
                                                <button
                                                    className={clsx(
                                                        styles.playlistCard,
                                                        pl._id === selectedId && styles.active
                                                    )}
                                                    onClick={() => setSelectedId(pl._id)}
                                                    aria-pressed={pl._id === selectedId}
                                                >
                                                    <img
                                                        src={pl?.thumbnailUrl || DEFAULT_PLAYLIST_COVER}
                                                        alt="Cover"
                                                        className={styles.cover}
                                                    />
                                                    <span className={styles.plName}>{pl.title}</span>
                                                    <span className={styles.plMeta}>{pl.tracks.length} bài hát</span>
                                                </button>

                                                <button
                                                    className={styles.hoverDelete}
                                                    title="Xóa playlist"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePlaylist(pl._id);
                                                    }}
                                                >
                                                    Xóa
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            </div>
                        ) : (
                            <section
                                className={clsx(styles.rightCol, styles.detailFull)}
                                aria-labelledby="playlist-detail-heading"
                            >
                                <div className={styles.detailTopBar}>
                                    <button className={styles.backBtn} onClick={() => setSelectedId(null)}>
                                        &#8592; Return
                                    </button>
                                </div>

                                <div className={styles.sectionHeader}>
                                    <div className={styles.detailHeader}>
                                        <img
                                            src={current.thumbnailUrl || DEFAULT_PLAYLIST_COVER}
                                            alt=""
                                            className={styles.detailCover}
                                            onClick={handleEditPlaylist}
                                        />
                                        <div className={styles.detailText}>
                                            <h1 id="playlist-detail-heading" className={styles.detailTitle} onClick={handleEditPlaylist}>
                                                {current.title}
                                            </h1>
                                            <p className={styles.detailMeta}>{current.tracks.length} tracks</p>
                                        </div>
                                    </div>

                                    <div className={styles.rowGap}>
                                        <button className={styles.secondary} onClick={() => setIsAddOpen(true)}>
                                            Add track
                                        </button>
                                        <button className={styles.ghost} onClick={() => alert("Play - TODO")}>
                                            Play
                                        </button>
                                        <button
                                            className={styles.ghost}
                                            onClick={() => navigator.clipboard.writeText(location.href)}
                                        >
                                            Share
                                        </button>
                                        <button
                                            className={styles.danger}
                                            onClick={() => handleDeletePlaylist(current._id)}
                                        >
                                            Delete playlist
                                        </button>
                                    </div>
                                </div>

                                {current.tracks.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>No tracks found in this playlist.</p>
                                        <button className={styles.primary} onClick={() => setIsAddOpen(true)}>
                                            + Add track
                                        </button>
                                    </div>
                                ) : (
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Track</th>
                                                <th>Artist</th>
                                                <th>Duration</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {current.tracks.map((t, idx) => (
                                                <tr key={t._id}>
                                                    <td>{idx + 1}</td>
                                                    <td className={styles.songCell}>
                                                        <img src={t.thumbnailUrl} alt="" />
                                                        <span>{t.title}</span>
                                                    </td>
                                                    <td>{t.artist}</td>
                                                    <td>{formatDuration(t.duration)}</td>
                                                    <td className={styles.rowActions}>
                                                        <button
                                                            className={styles.iconBtn}
                                                            title="Play"
                                                            onClick={() => handlePlaySong(t._id)}
                                                        >
                                                            ▶
                                                        </button>
                                                        <button
                                                            className={styles.iconBtn}
                                                            title="Remove"
                                                            onClick={() => handleRemoveSong(t._id)}
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </section>
                        )}
                    </>
                )}
            </main>

            {isCreateOpen && (
                <CreatePlaylistModal
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={(name) => {
                        setIsCreateOpen(false);
                        handleCreate(name);
                    }}
                    existingNames={playlists.map((p) => p.title.toLowerCase())}
                />
            )}

            {isAddOpen && (
                <AddSongModal
                    onClose={() => setIsAddOpen(false)}
                    onPick={(track) => {
                        setIsAddOpen(false);
                        handleAddSong(track);
                    }}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    results={pickerResults}
                />
            )}

            {isEditPlaylistOpen && <EditPlaylistInfoPopup closeAction={handleEditPlaylist}/>}

            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
}

// --- Subcomponents ---

function CreatePlaylistModal({ onClose, onSubmit, existingNames }) {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleConfirm = () => {
        const trimmed = name.trim();
        if (trimmed && existingNames.includes(trimmed.toLowerCase())) {
            setError("Tên playlist đã tồn tại");
            return;
        }
        onSubmit(trimmed);
    };

    return (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Tạo playlist mới">
            <div className={styles.modal}>
                <h2>Tạo playlist mới</h2>
                <p className={styles.muted}>Có thể bỏ trống, hệ thống sẽ đặt “Unnamed Playlist”.</p>
                <input
                    ref={inputRef}
                    className={styles.input}
                    placeholder="Nhập tên playlist"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                />
                {error && <div className={styles.inlineError}>{error}</div>}
                <div className={styles.modalActions}>
                    <button className={styles.secondary} onClick={onClose}>
                        Hủy
                    </button>
                    <button className={styles.primary} onClick={handleConfirm}>
                        Tạo
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddSongModal({ onClose, onPick, searchTerm, setSearchTerm, results }) {
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Thêm bài hát">
            <div className={styles.modal}>
                <h2>Thêm bài hát</h2>
                <input
                    ref={inputRef}
                    className={styles.input}
                    placeholder="Tìm bài hát theo tên, nghệ sĩ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ul className={styles.searchList}>
                    {results.map((t) => (
                        <li key={t._id}>
                            <button className={styles.resultRow} onClick={() => onPick(t)}>
                                <img src={t.thumbnailUrl} alt="" />
                                <div>
                                    <div className={styles.songTitle}>{t.title}</div>
                                    <div className={styles.songArtist}>{t.artist}</div>
                                </div>
                                {/* <span className={styles.duration}>{formatDuration(t.duration)}</span> */}
                            </button>
                        </li>
                    ))}
                </ul>
                <div className={styles.modalActions}>
                    <button className={styles.secondary} onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

function Toast({ toast, onDismiss }) {
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(onDismiss, 2400);
        return () => clearTimeout(t);
    }, [toast, onDismiss]);

    if (!toast) return null;

    return (
        <div className={clsx(styles.toast, styles[toast.type])} role="status" aria-live="polite">
            {toast.message}
        </div>
    );
}

function EditPlaylistInfoPopup({ closeAction = () => {}}) {
    return (
        <div className={clsx(styles["edit-popup"])} onClick={closeAction}>
            <div className={clsx(styles["edit-wrapper"])} onClick={(e) => e.stopPropagation()}>
                <div className={clsx(styles["edit-header-wrapper"])}>
                    <h2 className={clsx(styles["edit-header-title"])}>Edit playlist details</h2>
                    <button className={clsx(styles["edit-header-close"])} onClick={closeAction}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
                <div className={clsx(styles["edit-main-wrapper"])}>
                    <div className={clsx(styles["edit-image-wrapper"])}>
                        <Image
                            className={clsx(styles["edit-image"])}
                            src={"/albumcover.jpg"}
                            width={100}
                            height={100}
                            alt=""
                        />
                        <div className={clsx(styles["edit-image-placeholder"])}>
                            <input type="file" className={clsx(styles["edit-image-placeholder-input"])}/>
                            <FontAwesomeIcon icon={faPencil} className={clsx(styles["edit-image-placeholder-icon"])} />
                            <span className={clsx(styles["edit-image-placeholder-text"])}>Choosing image</span>
                            <button className={clsx(styles["edit-image-options"])}>
                                <FontAwesomeIcon icon={faEllipsis} />
                            </button>
                        </div>
                    </div>
                    <div className={clsx(styles["edit-info-wrapper"])}>
                        <div className={clsx(styles["edit-title-group"])}>
                            <input className={clsx(styles["edit-title-input"])} placeholder="Name" />
                            <label className={clsx(styles["edit-title"])}>Title</label>
                        </div>
                        <div className={clsx(styles["edit-desc-group"])}>
                            <textarea
                                className={clsx(styles["edit-desc-input"])}
                                placeholder="Description (optional)"
                            />
                            <label className={clsx(styles["edit-desc"])}>Description</label>
                        </div>
                    </div>
                </div>
                <button className={clsx(styles["edit-action-button"])}>
                    <span>Save</span>
                </button>
                <strong className={clsx(styles["edit-details"])}>
                    By continuing, you agree to allow MusicHub to access the images you have selected to upload. Please ensure you have permission to upload the images.
                </strong>
            </div>
        </div>
    );
}
