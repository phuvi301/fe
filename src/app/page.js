'use client'
import { useState, useRef } from "react";
import style from "./homepage.module.css"
import axios from "axios";
import Hls from "hls.js";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
export default function Home() {

	const [trackPlaying, setTrackPlaying] = useState(false);
  const playerRef = useRef(null);

  const handleTrack = async (url) => {
    setTrackPlaying(true);
    const hls = new Hls();

    hls.loadSource(url);
    hls.attachMedia(playerRef.current);
    playerRef.current.play();
  };

	const playTrack = async (songID) => {
		axios
			.get(`http://localhost:8080/api/tracks/${songID}`)
			.then((response) => {
				const url = response.data.data.audioUrl;
				if (!url) throw "Audio URL not found";
				handleTrack(url);
				console.log("Playing track:", response.data.data.title);
				console.log("Audio URL:", url);
			})
			.catch((error) => {
				console.error("Error playing track:", error);
			});
	};

  // Mock data cho notifications
  const notifications = [
    { id: 1, message: "New song added to your playlist", time: "2 minutes ago" },
    { id: 2, message: "Your friend liked your song", time: "1 hour ago" },
    { id: 3, message: "New album from your favorite artist", time: "3 hours ago" },
    { id: 4, message: "Vinh cu qua luoi", time: "1 day ago" },
  ];

  return (
    <div className={style.background}>
      {/* Header */}
      <Header />
      {/* Sidebar */}
      <Sidebar />
      {/* Main content */}
      <main>
        {/* Featured section */}
        <section className={style.featured}>
          {/* Featured container 1 */}
          <article className={style["featured-section"]}>
            <h1>More of what you like</h1>
            <p>Recommended for you</p>
            <div className={style["featured-container"]}>
              {/* Song 1 */}
              <a onClick={() => playTrack("68eaac29ee09d1cc42f4269a")} id="song1">
                <span><img src="song/1.png" alt="Album 1" />Song Title 1</span>
              </a>
              {/* Song 2 */}
              <a onClick={() => playTrack("68ecae3fdde571b891d23137")} id="song2">
                <span><img src="song/2.png" alt="Album 2" />Song Title 2</span>
              </a>
              {/* Song 3 */}
              <a href="#">
                <span><img src="song/3.png" alt="Album 3" />Song Title 3</span>
              </a>
              {/* Song 4 */}
              <a href="#">
                <span><img src="song/4.png" alt="Album 4" />Song Title 4</span>
              </a>
              {/* Song 5 */}
              <a href="#">
                <span><img src="song/9.png" alt="Album 5" />Song Title 5</span>
              </a>
            </div>
          </article>
          {/* Featured container 2 */}
          <article className={style["featured-section"]}>
            <h1>Trending by genre</h1>
            <p>Discover what's popular</p>
            <div className={style["featured-container"]}>
              {/* Song 1 */}
              <a href="#">
                <span><img src="song/5.png" alt="Album 6" />Song Title 6</span>
              </a>
              {/* Song 2 */}
              <a href="#">
                <span><img src="song/6.png" alt="Album 7" />Song Title 7</span>
              </a>
              {/* Song 3 */}
              <a href="#">
                <span><img src="song/7.jpg" alt="Album 8" />Song Title 8</span>
              </a>
              {/* Song 4 */}
              <a href="#">
                <span><img src="song/8.png" alt="Album 9" />Song Title 9</span>
              </a>
              {/* Song 5 */}
              <a href="#">
                <span><img src="song/vicuaanh.png" alt="Album 10" />Vị của anh</span>
              </a>
              {/* Song 6 */}
              <a href="#">
                <span><img src="song/11.jpg" alt="Album 11" />Danh doi</span>
              </a>
            </div>
          </article>
        </section>
        {/* Audio player */}
        {trackPlaying && (
          <div className={style["audio-player"]}>
            <audio controls type="audio/mpeg" ref={playerRef} />
          </div>
        )}
      </main>
    </div>
  );
}