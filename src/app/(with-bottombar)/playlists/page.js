"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faXmark } from "@fortawesome/free-solid-svg-icons";

import layout from "~/app/styles/homepage.module.scss";
import styles from "./playlists.module.css";
import Header from "~/app/components/Header";
import Sidebar from "~/app/components/Sidebar";
import ConfirmModal from "~/app/components/ConfirmModal";
import { useBottomBar } from "~/context/BottombarContext";

const DEFAULT_PLAYLIST_COVER = "/playlist-default.png";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Helpers ---
function getAccessToken() {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )accessToken=([^;]+)"));
    return match ? match[2] : null;
}

function getAuthHeader() {
    const token = getAccessToken();
    return token ? { headers: { token: `Bearer ${token}` } } : {};
}

function nextUnnamedName(list) {
    for (let i = 1; ; i++) {
        const candidate = `Unnamed Playlist #${i}`;
        const taken = list.some((p) => (p.title || "").trim().toLowerCase() === candidate.toLowerCase());
        if (!taken) return candidate;
    }
}

function formatDuration(s) {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${ss < 10 ? "0" + ss : ss}`;
}

function getOwnerId(track) {
    if (!track?.owner) return null;
    return typeof track.owner === "object" ? track.owner._id : track.owner;
}

// --- Main Component ---
export default function PlaylistsPage() {
    const [playlists, setPlaylists] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditPlaylistOpen, setIsEditPlaylistOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [playlistToDelete, setPlaylistToDelete] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [pickerResults, setPickerResults] = useState([]);

    const { bottomBarRef, shufflePlaylist } = useBottomBar();
    const current = useMemo(() => playlists.find((p) => p._id === selectedId) || null, [playlists, selectedId]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const storedInfo = localStorage.getItem("userInfo");
                if (!storedInfo) throw new Error("User info not found");
                const userData = JSON.parse(storedInfo);
                
                if (!userData.playlists || userData.playlists.length === 0) {
                    setPlaylists([]);
                    setLoading(false);
                    return;
                }

                const promises = userData.playlists.map((id) => 
                    axios.get(`${API_URL}/api/playlists/${id}`).catch(() => null)
                );
                const responses = await Promise.all(promises);
                
                if (active) {
                    const validPlaylists = responses
                        .filter(res => res && res.data && res.data.data)
                        .map(res => res.data.data);
                    setPlaylists(validPlaylists);
                }
            } catch (err) {
                console.error(err);
                if (active) setError("Unable to load playlists");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!searchTerm) { setPickerResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await axios.get(`${API_URL}/api/search`, { params: { q: searchTerm }, ...getAuthHeader() });
                setPickerResults(res.data.data);
            } catch (error) { console.error("Search error", error); }
        }, 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (!loading && !error) {
            try {
                const oldInfo = JSON.parse(localStorage.getItem("userInfo")) || {};
                const newInfo = { ...oldInfo, playlists: playlists.map((pl) => pl._id) };
                localStorage.setItem("userInfo", JSON.stringify(newInfo));
            } catch (e) { console.error("Failed to sync localStorage", e); }
        }
    }, [playlists, loading, error]);

    const handleCreate = async (nameRaw) => {
        const title = (nameRaw || "").trim() || nextUnnamedName(playlists);
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        try {
            const res = await axios.post(`${API_URL}/api/playlists`, { title, userId: userInfo._id }, getAuthHeader());
            const newPlaylist = res.data.data;
            setPlaylists((prev) => [newPlaylist, ...prev]);
            setSelectedId(newPlaylist._id);
            setToast({ type: "success", message: "Playlist created successfully" });
        } catch (e) {
            setToast({ type: "error", message: e?.response?.data?.code === "DUPLICATE" ? "Playlist name already exists" : "Unable to create playlist" });
        }
    };

    const handleDeletePlaylist = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/playlists/${id}`, getAuthHeader());
            setPlaylists((prev) => prev.filter((p) => p._id !== id));
            if (selectedId === id) setSelectedId(null);
            setToast({ type: "success", message: "Playlist deleted" });
        } catch { setToast({ type: "error", message: "Failed to delete playlist" }); }
        finally { setPlaylistToDelete(null); setIsConfirmOpen(false); }
    };

    const handleAddSong = async (track) => {
        if (!current) return;
        if (current.tracks.some((t) => t._id === track._id)) {
            setToast({ type: "info", message: "Song already exists" });
            return;
        }
        try {
            const res = await axios.post(`${API_URL}/api/playlists/${current._id}/add`, { trackId: track._id }, getAuthHeader());
            setPlaylists((prev) => prev.map(pl => pl._id === current._id ? res.data.data : pl));
            setToast({ type: "success", message: "Song added" });
        } catch { setToast({ type: "error", message: "Failed to add song" }); }
    };

    const handleRemoveSong = async (trackId) => {
        if (!current || !confirm("Remove this song?")) return;
        try {
            const res = await axios.delete(`${API_URL}/api/playlists/${current._id}/remove`, { data: { trackId }, ...getAuthHeader() });
            setPlaylists((prev) => prev.map(pl => pl._id === current._id ? res.data.data : pl));
            setToast({ type: "success", message: "Song removed" });
        } catch { setToast({ type: "error", message: "Failed to remove song" }); }
    };

    const handleSubmitUpdatePlaylist = async ({ title, description, thumbnailFile }) => {
        if (!current) return;
        try {
            let updatedData = null;
            if (title !== undefined || description !== undefined) {
                const res = await axios.put(`${API_URL}/api/playlists/${current._id}`, { title, description }, getAuthHeader());
                updatedData = res.data.data;
            }
            if (thumbnailFile) {
                const formData = new FormData();
                formData.append("thumbnail", thumbnailFile);
                const res = await axios.put(`${API_URL}/api/playlists/${current._id}/thumbnail`, formData, getAuthHeader());
                updatedData = res.data.data;
            }
            if (updatedData) {
                setPlaylists((prev) => prev.map(pl => pl._id === current._id ? updatedData : pl));
                setToast({ type: "success", message: "Playlist updated" });
            }
            setIsEditPlaylistOpen(false);
        } catch (error) { setToast({ type: "error", message: "Update failed" }); }
    };

    const playPlaylist = async () => {
        if (!current?.tracks?.length) return;
        const idx = shufflePlaylist ? Math.floor(Math.random() * current.tracks.length) : 0;
        await bottomBarRef.current.play(current.tracks[idx]._id, current._id, idx);
    };

    return (
        <div className={layout.background}>
            <Header />
            <Sidebar />
            <main className={layout.mainContent}>
                {loading ? <div className={styles.centerMsg}><div className={styles.loader}></div> Loading...</div> : error ? (
                    <div className={styles.errorBox}><p>{error}</p><button className={styles.secondary} onClick={() => window.location.reload()}>Retry</button></div>
                ) : (
                    <>
                        {!current ? (
                            <PlaylistListView playlists={playlists} selectedId={selectedId} onSelect={setSelectedId} onCreate={() => setIsCreateOpen(true)} onDeleteRequest={(id) => { setPlaylistToDelete(id); setIsConfirmOpen(true); }} />
                        ) : (
                            <PlaylistDetailView current={current} onBack={() => setSelectedId(null)} onEdit={() => setIsEditPlaylistOpen(true)} onAdd={() => setIsAddOpen(true)} onPlay={playPlaylist} onDeleteRequest={() => { setPlaylistToDelete(current._id); setIsConfirmOpen(true); }} onToggleTrack={async (tid) => { const idx = current.tracks.findIndex(t => t._id === tid); await bottomBarRef.current.play(tid, current._id, idx); }} onRemoveSong={handleRemoveSong} />
                        )}
                        <ConfirmModal isOpen={isConfirmOpen && !!playlistToDelete} onClose={() => { setPlaylistToDelete(null); setIsConfirmOpen(false); }} onConfirm={() => handleDeletePlaylist(playlistToDelete)} title="Delete Playlist" message="Are you sure to delete this playlist? This action cannot be undone" />
                    </>
                )}
            </main>
            {isCreateOpen && <CreatePlaylistModal onClose={() => setIsCreateOpen(false)} onSubmit={handleCreate} existingNames={playlists.map((p) => p.title.toLowerCase())} />}
            {isAddOpen && <AddSongModal onClose={() => setIsAddOpen(false)} onPick={handleAddSong} searchTerm={searchTerm} setSearchTerm={setSearchTerm} results={pickerResults} />}
            {isEditPlaylistOpen && <EditPlaylistInfoPopup playlistTitle={current?.title} playlistDesc={current?.description} playlistThumbnail={current?.thumbnailUrl} closeAction={() => setIsEditPlaylistOpen(false)} submitAction={handleSubmitUpdatePlaylist} />}
            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
}

// --- Sub Components ---

function PlaylistListView({ playlists, selectedId, onSelect, onCreate, onDeleteRequest }) {
    return (
        <div className={clsx(styles.grid, styles.gridSingle)}>
            <section className={styles.leftCol}>
                <div className={styles.sectionHeader}>
                    <h1>My Playlists</h1>
                    <button className={styles.primary} onClick={onCreate}>+ Create new</button>
                </div>
                <ul className={styles.playlistGrid}>
                    {playlists.map((pl) => (
                        <li key={pl._id} className={styles.plItem}>
                            <div className={clsx(styles.playlistCard, pl._id === selectedId && styles.active)} onClick={() => onSelect(pl._id)}>
                                <img src={pl?.thumbnailUrl || DEFAULT_PLAYLIST_COVER} alt={pl.title} className={styles.cover} loading="lazy" />
                                <span className={styles.plName}>{pl.title}</span>
                                <span className={styles.plMeta}>{pl.tracks?.length || 0} songs</span>
                            </div>
                            <button className={styles.hoverDelete} onClick={(e) => { e.stopPropagation(); onDeleteRequest(pl._id); }}>Delete</button>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

function PlaylistDetailView({ current, onBack, onEdit, onAdd, onPlay, onDeleteRequest, onToggleTrack, onRemoveSong }) {
    return (
        <section className={clsx(styles.rightCol, styles.detailFull)}>
            <div className={styles.detailTopBar}>
                <button className={styles.backBtn} onClick={onBack}>&#8592; Return</button>
            </div>
            <div className={styles.sectionHeader}>
                <div className={styles.detailHeader}>
                    <div className={styles.detailCover} onClick={onEdit}>
                        <img src={current.thumbnailUrl || DEFAULT_PLAYLIST_COVER} alt={current.title} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'12px'}} />
                        <FontAwesomeIcon icon={faPencil} className={styles.detailIcon} />
                    </div>
                    <div className={styles.detailText}>
                        <h1 className={styles.detailTitle} onClick={onEdit}>{current.title}</h1>
                        {current.description && <p className={styles.detailDesc}>{current.description}</p>}
                        <p className={styles.detailMeta}>{current.tracks.length} tracks</p>
                    </div>
                </div>
                <div className={styles.rowGap}>
                    <button className={styles.primary} onClick={onPlay}>Play</button>
                    <button className={styles.secondary} onClick={onAdd}>Add track</button>
                    <button className={styles.ghost} onClick={() => navigator.clipboard.writeText(location.href)}>Share</button>
                    <button className={styles.danger} onClick={onDeleteRequest}>Delete</button>
                </div>
            </div>

            {current.tracks.length === 0 ? (
                <div className={styles.emptyState}><p>No tracks found.</p><button className={styles.primary} onClick={onAdd}>+ Add track</button></div>
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
                                <td>
                                    {/* Song Cell: Flex container */}
                                    <div className={styles.songCell}>
                                        <img src={t.thumbnailUrl} alt="" loading="lazy" />
                                        <span>{t.title}</span>
                                    </div>
                                </td>
                                <td><Link href={getOwnerId(t) ? `/artist/${getOwnerId(t)}` : "#"} className={styles.Artist} onClick={(e) => !getOwnerId(t) && e.preventDefault()}>{t.artist}</Link></td>
                                <td>{formatDuration(t.duration)}</td>
                                <td>
                                    {/* Actions Cell: Flex container */}
                                    <div className={styles.rowActions}>
                                        <button className={styles.iconBtn} onClick={() => onToggleTrack(t._id)} title="Play">▶</button>
                                        <button className={styles.iconBtn} onClick={() => onRemoveSong(t._id)} title="Remove">✕</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}

function CreatePlaylistModal({ onClose, onSubmit, existingNames }) {
    const [name, setName] = useState("");
    const [err, setErr] = useState("");
    const inputRef = useRef(null);
    useEffect(() => inputRef.current?.focus(), []);
    const handleConfirm = () => {
        const trimmed = name.trim();
        if (trimmed && existingNames.includes(trimmed.toLowerCase())) { setErr("Name exists"); return; }
        onSubmit(trimmed); onClose();
    };
    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
                <h2>Create Playlist</h2>
                <input ref={inputRef} className={styles.input} placeholder="Name" value={name} onChange={(e) => {setName(e.target.value); setErr("")}} onKeyDown={(e)=>e.key==="Enter"&&handleConfirm()} />
                {err && <div className={styles.inlineError}>{err}</div>}
                <div className={styles.modalActions}><button className={styles.secondary} onClick={onClose}>Cancel</button><button className={styles.primary} onClick={handleConfirm}>Create</button></div>
            </div>
        </div>
    );
}

function AddSongModal({ onClose, onPick, searchTerm, setSearchTerm, results }) {
    const inputRef = useRef(null);
    useEffect(() => inputRef.current?.focus(), []);
    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
                <h2>Add Song</h2>
                <input ref={inputRef} className={styles.input} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <ul className={styles.searchList}>
                    {results.map((t) => (
                        <li key={t._id}><button className={styles.resultRow} onClick={() => onPick(t)}><img src={t.thumbnailUrl} alt="" /><div><div className={styles.songTitle}>{t.title}</div><div className={styles.songArtist}>{t.artist}</div></div></button></li>
                    ))}
                </ul>
                <div className={styles.modalActions}><button className={styles.secondary} onClick={onClose}>Close</button></div>
            </div>
        </div>
    );
}

function EditPlaylistInfoPopup({ playlistTitle, playlistDesc, playlistThumbnail, closeAction, submitAction }) {
    const [title, setTitle] = useState(playlistTitle || "");
    const [description, setDescription] = useState(playlistDesc || "");
    const [thumbnailPreview, setThumbnailPreview] = useState(playlistThumbnail || DEFAULT_PLAYLIST_COVER);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const handleUpload = (e) => { if (e.target.files?.[0]) { setThumbnailFile(e.target.files[0]); setThumbnailPreview(URL.createObjectURL(e.target.files[0])); } };
    return (
        <div className={styles["edit-popup"]} onClick={closeAction}>
            <div className={styles["edit-wrapper"]} onClick={(e) => e.stopPropagation()}>
                <div className={styles["edit-header-wrapper"]}><h2 style={{margin:0}}>Edit details</h2><button className={styles["edit-header-close"]} onClick={closeAction}><FontAwesomeIcon icon={faXmark} /></button></div>
                <div className={styles["edit-main-wrapper"]}>
                    <div className={styles["edit-image-wrapper"]}>
                        <img className={styles["edit-image"]} src={thumbnailPreview} alt="Preview" />
                        <div className={styles["edit-image-placeholder"]}><input type="file" className={styles["edit-image-placeholder-input"]} onChange={handleUpload} accept="image/*" /><FontAwesomeIcon icon={faPencil} style={{fontSize:32,marginBottom:8}} /><span>Choose image</span></div>
                    </div>
                    <div className={styles["edit-info-wrapper"]}>
                        <input className={styles["edit-title-input"]} placeholder="Name" value={title} onChange={(e) => setTitle(e.target.value)} />
                        <textarea className={styles["edit-desc-input"]} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{flex:1, resize:'none'}} />
                    </div>
                </div>
                <button className={styles["edit-action-button"]} onClick={() => submitAction({ title, description, thumbnailFile })}>Save</button>
            </div>
        </div>
    );
}

function Toast({ toast, onDismiss }) {
    useEffect(() => { if (!toast) return; const t = setTimeout(onDismiss, 2500); return () => clearTimeout(t); }, [toast, onDismiss]);
    if (!toast) return null;
    return <div className={clsx(styles.toast, styles[toast.type])}>{toast.message}</div>;
}