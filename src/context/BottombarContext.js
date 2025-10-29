"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

const BottomBarContext = createContext();

export function BottomBarProvider({ children }) {
  const bottomBarRef = useRef(null);
  const [playback, setPlayback] = useState(null);
  const [url, setUrl] = useState(null);
  const track = {
    thumbnailUrl: "https://res.cloudinary.com/dpk0saaw2/image/upload/v1760982112/uploads/uc0lqqhvbqisyixepdyf.jpg",
    artist: "Đặng Vĩnh Thịnh",
    title: "Ngàn Năm Ánh Sáng"
  }

//   const updatePlayerState = (track) => {
//     console.log(track);
//     // nowPlaying.current = track;
//     console.log(nowPlaying);
// };

  const nowPlaying = useRef(null);

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
      try{
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${songID}`)
          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${response.data.data.audioUrl}`;
          if (!url) throw "Audio URL not found";
          
          // Fetch lyrics nếu có
          // await fetchLyrics(songID);
          
          console.log("Playing track:", response.data.data.title);
          console.log("Audio URL:", url);
          console.log("Id song:", response.data.data._id);
          return { url: url, track: response.data.data};
      }
      catch(error) {
          console.error("Error playing track:", error);
          return "error"; 
      }
  };

  // Lấy 
  useEffect(() => {
      const loadPlayback = async () => {
          const pb = await getPlayback();
          setPlayback(pb);
          if (pb && !nowPlaying.current) {
              const trackInfo = await getTrack(pb.trackID);
              await bottomBarRef.current.fetchLyrics(pb.trackID);
              nowPlaying.current = trackInfo.track;
              setUrl(trackInfo.url);
              // playerRef.current.currentTime = parseFloat(progress.playbackTime);
              // if (progress.playlistID) {
              //     try {
              //         const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists/${progress.playlistID}`);
              //         playlistPlayingRef.current = res.data.data;
              //         console.log(playlistPlayingRef.current);
              //     } catch(err) {
              //         console.error("Can't get playing playlist");
              //     }
              // }
          }
      }
      loadPlayback();
  }, [])


  return (
    <BottomBarContext.Provider value={{ bottomBarRef, nowPlaying, playback, url, setUrl, getTrack }}>
      {children}
    </BottomBarContext.Provider>
  );
}

export function useBottomBar() {
  return useContext(BottomBarContext);
}
