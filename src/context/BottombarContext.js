"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

const BottomBarContext = createContext();

export function BottomBarProvider({ children }) {
    const bottomBarRef = useRef(null);
    const nowPlaying = useRef(null);
    const playlistIDRef = useRef(null);
    const shuffleRef = useRef(null);

    const [playlistPlaying, setPlaylistPlaying] = useState(null);
    const [playback, setPlayback] = useState(null);
    const [url, setUrl] = useState(null);
    const [currTrack, setCurrTrack] = useState(null);
    const [shufflePlaylist, setShufflePlaylist] = useState(null);
    const [repeatMode, setRepeatMode] = useState("off");
    const [volume, setVolume] = useState(0.5);
    const [showQueue, setShowQueue] = useState(false);

    useEffect(() => {
        if (!playlistPlaying) return;

        if (playlistIDRef.current && shuffleRef.current) {
            bottomBarRef.current.shuffleTracks();
        }
        else if (!playlistIDRef.current && shuffleRef.current) {
            shuffleRef.current.length !== 1 ? setShufflePlaylist(shuffleRef.current) : bottomBarRef.current.shuffleTracks();
        }
        else {
            setShufflePlaylist(null);
        }
        playlistIDRef.current = playlistPlaying._id;
    }, [playlistPlaying]);

    const getPlayback = async () => {
        const {_id} = JSON.parse(localStorage.getItem("userInfo")); 
        if (!_id) return; // Mỗi user mỗi tiến trình

        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/progress/${_id}`);
            return res.data.prog;
        } catch(err) {
            console.error("Error while saving progress", err);
        }
    }

    // Đề xuất playlist dựa trên bài hát hiện tại
    const recommendPlaylist = async (songID, refresh = true) => {
        try {
            const raw = localStorage.getItem("userInfo");
            if (!raw) return [];
            const parsed = JSON.parse(raw); 
            const accessToken = parsed?.accessToken || null;

            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/recommend/${songID}?refresh=${refresh}`, {
                headers: {
                    token: `Bearer ${accessToken}`
                },
                withCredentials: true,
            });
            return res.data.data || [];
        } catch (err) {
            console.error("Can't get recommended playlist", err);
            return [];
        }
    };

    const getTrack = async (songID) => {
        if (songID) {
            try{
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${songID}`)
                const url = `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${response.data.data.audioUrl}`;
                if (!url) throw "Audio URL not found";
                            
                console.log("Playing track:", response.data.data.title);
                console.log("Audio URL:", url);
                console.log("Id song:", response.data.data._id);
                return { url: url, track: response.data.data};
            }
            catch(error) {
                console.error("Error playing track:", error);
                return "error"; 
            }
        }
    };

    const getPlaylist = async (playlistID) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists/${playlistID}`);
            setPlaylistPlaying(res.data.data);
        } catch(err) {
            console.error("Can't get playing playlist", err);
        }
    }

    const getArtistTracks = async (artistID) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${artistID}/artist-profile`);
            return res.data.tracks;
        } catch(err) {
            console.error("Can't get playing playlist", err);
        }
    }

    const handlePlaylist = async (playlistID, index, shuffle, tracks = null) => {
        shuffleRef.current = shuffle    

        if (!playlistID) {
            setPlaylistPlaying(null);
            setShufflePlaylist(shuffle ? [nowPlaying.current] : null);
            playlistIDRef.current = null;
            return;
        }

        if (playlistIDRef?.current !== playlistID) {
            if (playlistID.startsWith("artist-")) {
                if (!tracks) {
                    tracks = await getArtistTracks(playlistID.split("-")[1]);                
                } 
                setPlaylistPlaying({
                    _id: playlistID,
                    name: "Artist tracks",
                    tracks: tracks
                });                
            }
            else if (playlistID.startsWith("recommend-")) {
                // Playlist đề xuất ảo
                if (!tracks) {
                    tracks = await recommendPlaylist(nowPlaying.current._id, false); // Lấy danh sách đề xuất đã lưu
                }
                setPlaylistPlaying({
                    _id: playlistID,
                    name: "Recommended tracks",
                    tracks: tracks
                });
            }
            else await getPlaylist(playlistID);
        }

        nowPlaying.current.index = index;
    }

    useEffect(() => {
        const loadPlayback = async () => {
            const pb = await getPlayback();
            setPlayback(pb);
            if (Object.keys(pb).length !== 0 && !nowPlaying.current) {
                setRepeatMode(pb.repeat);
                setVolume(pb.volume)
                const trackInfo = await getTrack(pb.trackID);
                await bottomBarRef.current.fetchLyrics(pb.trackID);
                nowPlaying.current = trackInfo.track;
                setUrl(trackInfo.url);
                handlePlaylist(pb.playlistID, pb.index, JSON.parse(pb.shuffle));
            }
        }
        loadPlayback();
    }, [])


    return (
        <BottomBarContext.Provider value={{ bottomBarRef, nowPlaying, playback, url, setUrl, recommendPlaylist, getTrack, playlistPlaying, setCurrTrack, handlePlaylist, shufflePlaylist, setShufflePlaylist, volume, setVolume, repeatMode, setRepeatMode, showQueue, setShowQueue }}>
        {children}
        </BottomBarContext.Provider>
    );
}

export function useBottomBar() {
    return useContext(BottomBarContext);
}
