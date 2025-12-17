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

    useEffect(() => {
        if (!playlistPlaying) return;

        if (playlistIDRef.current && shuffleRef) {
            bottomBarRef.current.shuffleTracks();
        }
        else if (!playlistIDRef.current && shuffleRef) {
            shuffleRef.current.length !== 1 ? setShufflePlaylist(shuffleRef.current) : bottomBarRef.current.shuffleTracks();
        }
        else setShufflePlaylist(null);

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
        if (!playlistID) {
            setPlaylistPlaying(null);
            return;
        }

        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists/${playlistID}`);
            setPlaylistPlaying(res.data.data);
        } catch(err) {
            console.error("Can't get playing playlist", err);
        }
    }

    const handlePlaylist = async (playlistID, index, shuffle) => {
        shuffleRef.current = shuffle        

        if (!playlistID) {
            setPlaylistPlaying(null);
            setShufflePlaylist(shuffle ? [nowPlaying.current] : null);
            playlistIDRef.current = null;
            return;
        }

        // Support virtual playlists (e.g., artist page) without hitting playlist API
        if (playlistID.startsWith("artist-")) {
            const sourceTracks = tracks || playlistPlaying?.tracks;
            if (sourceTracks) {
                setPlaylistPlaying({
                    _id: playlistID,
                    name: "Artist tracks",
                    tracks: sourceTracks
                });
                nowPlaying.current.index = index;
                return;
            }
        }

        console.log(playlistIDRef?.current)

        if (playlistIDRef?.current !== playlistID) {
            await getPlaylist(playlistID);
        }

        nowPlaying.current.index = index;
    }

    useEffect(() => {
        const loadPlayback = async () => {
            const pb = await getPlayback();
            setPlayback(pb);
            if (pb && Object.keys(pb).length !== 0 && !nowPlaying.current) {
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
        <BottomBarContext.Provider value={{ bottomBarRef, nowPlaying, playback, url, setUrl, getTrack, playlistPlaying, setCurrTrack, handlePlaylist, shufflePlaylist, setShufflePlaylist, volume, setVolume, repeatMode, setRepeatMode }}>
        {children}
        </BottomBarContext.Provider>
    );
}

export function useBottomBar() {
    return useContext(BottomBarContext);
}
