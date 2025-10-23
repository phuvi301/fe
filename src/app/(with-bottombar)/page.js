'use client'
import style from "../homepage.module.css"
import Image from "next/image";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useBottomBar } from "~/context/BottombarContext";
import axios from "axios";
import { useEffect, useState } from "react";
export default function Home() {
    const { bottomBarRef } = useBottomBar();
    const [recentTracks, setRecentTracks] = useState([]);
    const [mostPlayedTracks, setMostPlayedTracks] = useState([]);

    const handleTrackPlay = async (trackId) => {
        await bottomBarRef.current.playTrack(trackId);
    };

    useEffect (() => {
        const homepageDisplay = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/display`);
                setRecentTracks(res.data.recent);
                setMostPlayedTracks(res.data.mostPlayed)
            } catch(err) {
                console.error('Error getting recent tracks', err);
            }
        };
        homepageDisplay();
        const interval = setInterval(homepageDisplay, 30000);
        return () => clearInterval(interval);
    }, [])

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
              {/* <h1>More of what you like</h1>
              <p>Recommended for you</p> */}
              <h1>Recently added </h1>
              <p>Check out the newest tracks</p>
              <div className={style["featured-container"]}>
                {recentTracks.map(track => (
                  <a key={track._id} onClick={() => handleTrackPlay(track._id)}>
                    <span>
                      <Image src={track.thumbnailUrl} width={500} height={500} alt={track.title} priority={true} />
                      {track.title}
                    </span>
                  </a>
                ))}
              </div>
            </article>
            {/* Featured container 2 */}
            <article className={style["featured-section"]}>
              {/* <h1>Trending by genre</h1>
              <p>Discover what's popular</p> */}
              <h1>Most Played Tracks</h1>
              <p>See which songs top the play charts this week.</p>
              <div className={style["featured-container"]}>
                {mostPlayedTracks.map(track => (
                  <a key={track._id} onClick={() => handleTrackPlay(track._id)}>
                    <span>
                      <Image src={track.thumbnailUrl} width={500} height={500} alt={track.title} priority={true} />
                      {track.title}
                    </span>
                  </a>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>
  );
}