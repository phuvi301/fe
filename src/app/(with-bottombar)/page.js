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

    const handleTrackPlay = async (trackId) => {
        await bottomBarRef.current.playTrack(trackId);
    };

    useEffect (() => {
        const recentlyAdded = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/recent`);
                setRecentTracks(res.data.data);
            } catch (err){
                console.error('Error getting recent tracks', err);
            }
        };
        recentlyAdded();
        const interval = setInterval(recentlyAdded, 30000);
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
              <h1>Recently Added </h1>
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
              <h1>Trending by genre</h1>
              <p>Discover what's popular</p>
              <div className={style["featured-container"]}>
                {/* Song 1 */}
                <a onClick={() => handleTrackPlay("68f670d2bb66a13123769868")}>
                  <span><Image src="/song/5.png" width={500} height={500} alt="Album 6" />Treasure</span>
                </a>
                {/* Song 2 */}
                <a onClick={() => handleTrackPlay("68f6766cbb66a13123769875")}>
                  <span><Image src="/song/6.png" width={500} height={500} alt="Album 7" />Thế Hệ Tan Vỡ</span>
                </a>
                {/* Song 3 */}
                <a onClick={() => handleTrackPlay("68f67a43bb66a13123769884")}>
                  <span><Image src="/song/7.jpg" width={500} height={500} alt="Album 8" />Quên Dần Quên</span>
                </a>
                {/* Song 4 */}
                <a onClick={() => handleTrackPlay("68f67df6bb66a13123769896")}>
                  <span><Image src="/song/8.png" width={500} height={500} alt="Album 9" />điều vô tri nhất</span>
                </a>
                {/* Song 5 */}
                <a onClick={() => handleTrackPlay("68f4f53d1c604adcc9499fba")}>
                  <span><Image src="/song/vicuaanh.png" width={500} height={500} alt="Album 10" unoptimized />Vị của anh</span>
                </a>
                {/* Song 6 */}
                <a onClick={() => handleTrackPlay("68f4fda44e15aeb1eb62f821")}>
                  <span><Image src="/song/11.jpg" width={500} height={500} alt="Album 11" />Nhạc báo thức brainrot</span>
                </a>
              </div>
            </article>
          </section>
        </main>
      </div>
  );
}