"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import layout from "../homepage.module.css";
import styles from "./playlists.module.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

// --- Constants ---

const DEFAULT_PLAYLIST_COVER = "/playlist-default.png";

// --- Helper Functions ---

function nextUnnamedName(list) {
  for (let i = 1; ; i++) {
    const candidate = `Unnamed Playlist #${i}`;
    const taken = list.some(
      (p) => (p.name || "").trim().toLowerCase() === candidate.toLowerCase()
    );
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

function mockTrack(id, title, artist, duration, coverUrl = "/song/1.png") {
  return { id, title, artist, duration, coverUrl };
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
  const [searchTerm, setSearchTerm] = useState("");
  const [pickerResults, setPickerResults] = useState([]);

  const current = useMemo(
    () => playlists.find((p) => p.id === selectedId) || null,
    [playlists, selectedId]
  );

  // --- Mock API Definition ---
  const playlistApi = {
    async list() {
      await delay(300);
      return [
        {
          id: "p1",
          name: "Playlist 1",
          coverUrl: "/song/1.png",
          createdAt: Date.now() - 86400000,
          tracks: [
            mockTrack("t1", "Song Title 1", "Artist 1", 213, "/song/2.png"),
            mockTrack("t2", "Song Title 2", "Artist 2", 201, "/song/3.png"),
          ],
        },
        {
          id: "p2",
          name: "Playlist 2",
          coverUrl: "/song/6.png",
          createdAt: Date.now() - 172800000,
          tracks: [
            mockTrack("t3", "Song Title 1", "Artist 1", 189, "/song/4.png"),
            mockTrack("t4", "Song Title 2", "Artist 2", 242, "/song/5.png"),
            mockTrack("t5", "Song Title 3", "Artist 3", 156, "/song/7.jpg"),
          ],
        },
      ];
    },
    async create(name) {
      await delay(200);
      if (
        playlists.some(
          (p) => (p.name || "").toLowerCase() === (name || "").toLowerCase()
        )
      ) {
        const err = new Error("Playlist đã tồn tại");
        err.code = "DUPLICATE";
        throw err;
      }
      const id = `p_${Math.random().toString(36).slice(2, 9)}`;
      return {
        id,
        name,
        coverUrl: DEFAULT_PLAYLIST_COVER,
        createdAt: Date.now(),
        tracks: [],
      };
    },
    async removePlaylist() {
      await delay(150);
      return true;
    },
    async addTrack(_, track) {
      await delay(120);
      return track;
    },
    async removeTrack() {
      await delay(120);
      return true;
    },
    async searchSongs(keyword) {
      await delay(250);
      if (!keyword) return [];
      return [
        mockTrack("s1", `${keyword} (Acoustic)`, "Artist 1", 202, "/song/8.png"),
        mockTrack("s2", `${keyword} Remix`, "Artist 2", 176, "/song/5.png"),
        mockTrack("s3", `${keyword} Original`, "Artist 3", 221, "/song/6.png"),
      ];
    },
  };

  // --- Effects ---
  useEffect(() => {
    (async () => {
      try {
        const data = await playlistApi.list();
        setPlaylists(data);
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
    (async () => {
      const results = await playlistApi.searchSongs(searchTerm);
      if (active) {
        setPickerResults(results);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // --- Event Handlers ---
  const handleCreate = async (nameRaw) => {
    const name = nameRaw?.trim();
    const finalName = name || nextUnnamedName(playlists);
    try {
      const newPl = await playlistApi.create(finalName);
      setPlaylists((prev) => [newPl, ...prev]);
      setSelectedId(newPl.id);
      setToast({ type: "success", message: "Tạo playlist mới thành công" });
    } catch (e) {
      setToast({
        type: "error",
        message:
          e?.code === "DUPLICATE"
            ? "Tên playlist đã tồn tại"
            : "Không thể tạo playlist mới",
      });
    }
  };

  const handleDeletePlaylist = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa playlist này?")) return;
    try {
      await playlistApi.removePlaylist(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
      setToast({ type: "success", message: "Đã xóa playlist" });
    } catch {
      setToast({ type: "error", message: "Xóa playlist thất bại" });
    }
  };

  const handleAddSong = async (track) => {
    if (!current) return;
    if (current.tracks.some((t) => t.id === track.id)) {
      setToast({ type: "info", message: "Bài hát đã tồn tại trong playlist" });
      return;
    }
    try {
      await playlistApi.addTrack(current.id, track);
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === current.id ? { ...p, tracks: [track, ...p.tracks] } : p
        )
      );
      setToast({ type: "success", message: "Đã thêm bài hát" });
    } catch {
      setToast({ type: "error", message: "Thêm bài hát thất bại" });
    }
  };

  const handleRemoveSong = async (trackId) => {
    if (!current) return;
    if (!confirm("Bạn có chắc muốn xoá bài hát này khỏi playlist?")) return;
    try {
      await playlistApi.removeTrack(current.id, trackId);
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === current.id
            ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
            : p
        )
      );
      setToast({ type: "success", message: "Đã xoá bài hát khỏi playlist" });
    } catch {
      setToast({ type: "error", message: "Xoá bài hát khỏi playlist thất bại" });
    }
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
                <section
                  className={styles.leftCol}
                  aria-labelledby="my-playlists-heading"
                >
                  <div className={styles.sectionHeader}>
                    <div>
                      <h1 id="my-playlists-heading">Danh sách nhạc của tôi</h1>
                    </div>
                    <button
                      className={styles.primary}
                      onClick={() => setIsCreateOpen(true)}
                    >
                      + Tạo playlist mới
                    </button>
                  </div>

                  <ul className={styles.playlistGrid}>
                    {playlists.map((pl) => (
                      <li key={pl.id} className={styles.plItem}>
                        <button
                          className={clsx(
                            styles.playlistCard,
                            pl.id === selectedId && styles.active
                          )}
                          onClick={() => setSelectedId(pl.id)}
                          aria-pressed={pl.id === selectedId}
                        >
                          <img
                            src={pl.coverUrl || DEFAULT_PLAYLIST_COVER}
                            alt="Cover"
                            className={styles.cover}
                          />
                          <span className={styles.plName}>{pl.name}</span>
                          <span className={styles.plMeta}>
                            {pl.tracks.length} bài hát
                          </span>
                        </button>

                        <button
                          className={styles.hoverDelete}
                          title="Xóa playlist"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlaylist(pl.id);
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
                  <button
                    className={styles.backBtn}
                    onClick={() => setSelectedId(null)}
                  >
                    ← Quay lại
                  </button>
                </div>

                <div className={styles.sectionHeader}>
                  <div className={styles.detailHeader}>
                    <img
                      src={current.coverUrl || "/song/9.png"}
                      alt=""
                      className={styles.detailCover}
                    />
                    <div className={styles.detailText}>
                      <h1
                        id="playlist-detail-heading"
                        className={styles.detailTitle}
                      >
                        {current.name}
                      </h1>
                      <p className={styles.detailMeta}>
                        {current.tracks.length} bài hát
                      </p>
                    </div>
                  </div>

                  <div className={styles.rowGap}>
                    <button
                      className={styles.secondary}
                      onClick={() => setIsAddOpen(true)}
                    >
                      Thêm bài hát
                    </button>
                    <button
                      className={styles.ghost}
                      onClick={() => alert("Play - TODO")}
                    >
                      Play
                    </button>
                    <button
                      className={styles.ghost}
                      onClick={() =>
                        navigator.clipboard.writeText(location.href)
                      }
                    >
                      Share
                    </button>
                    <button
                      className={styles.danger}
                      onClick={() => handleDeletePlaylist(current.id)}
                    >
                      Xóa playlist
                    </button>
                  </div>
                </div>

                {current.tracks.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Chưa có bài hát nào trong playlist này.</p>
                    <button
                      className={styles.primary}
                      onClick={() => setIsAddOpen(true)}
                    >
                      + Thêm bài hát
                    </button>
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Bài hát</th>
                        <th>Nghệ sĩ</th>
                        <th>Thời lượng</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {current.tracks.map((t, idx) => (
                        <tr key={t.id}>
                          <td>{idx + 1}</td>
                          <td className={styles.songCell}>
                            <img src={t.coverUrl} alt="" />
                            <span>{t.title}</span>
                          </td>
                          <td>{t.artist}</td>
                          <td>{formatDuration(t.duration)}</td>
                          <td className={styles.rowActions}>
                            <button
                              className={styles.iconBtn}
                              title="Play"
                              onClick={() => alert("Play - TODO")}
                            >
                              ▶
                            </button>
                            <button
                              className={styles.iconBtn}
                              title="Remove"
                              onClick={() => handleRemoveSong(t.id)}
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
          existingNames={playlists.map((p) => p.name.toLowerCase())}
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
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Tạo playlist mới"
    >
      <div className={styles.modal}>
        <h2>Tạo playlist mới</h2>
        <p className={styles.muted}>
          Có thể bỏ trống, hệ thống sẽ đặt “Unnamed Playlist”.
        </p>
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
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Thêm bài hát"
    >
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
            <li key={t.id}>
              <button className={styles.resultRow} onClick={() => onPick(t)}>
                <img src={t.coverUrl} alt="" />
                <div>
                  <div className={styles.songTitle}>{t.title}</div>
                  <div className={styles.songArtist}>{t.artist}</div>
                </div>
                <span className={styles.duration}>
                  {formatDuration(t.duration)}
                </span>
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
    <div
      className={clsx(styles.toast, styles[toast.type])}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
}