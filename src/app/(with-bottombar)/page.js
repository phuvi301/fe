'use client'
import style from "../homepage.module.css"
import Image from "next/image";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useBottomBar } from "~/context/BottombarContext";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const { bottomBarRef } = useBottomBar();
  const [recentTracks, setRecentTracks] = useState([]);
  const [mostPlayedTracks, setMostPlayedTracks] = useState([]);

  const listTracks = useRef(null);
  const listTracks1 = useRef(null);
  const listRef = {
    0: listTracks,
    1: listTracks1
  }
  const scrollBtnLeft = useRef(null);
  const scrollBtnRight = useRef(null);

  const handleTrackPlay = async (trackId) => {
    await bottomBarRef.current.playTrack(trackId);
  };

  const scrollTracks = (e, targetList) => {
    const scrollAmount = 700;
    const direction = e.currentTarget.classList.contains(style.left) ? "left" : "right";
    const targetRef = listRef[targetList];
    targetRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  const router = useRouter()

	useEffect(() => {
		if (document.cookie.split('accessToken=')[1]) return;

		const refreshAccessToken = async () => {
			const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {}, {
				withCredentials: true
			})

			if (res.status === 200) document.cookie = `accessToken=${res.data.data.accessToken}; expires=${new Date(res.data.data.accessExpireTime).toUTCString()}; path=/;` ;
			else router.push("/login")
		}

		refreshAccessToken()

	}, [])

  useEffect(() => {
    const homepageDisplay = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/display`);
        setRecentTracks(res.data.recent);
        setMostPlayedTracks(res.data.mostPlayed)
      } catch(err)  {
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
            <h1>Recently Added </h1>
            <p>Check out the newest tracks</p>
            {/* Scroll buttons */}
              {
                listTracks.current ? (
                  <div>
                    <button className={`${style["scroll-btn"]} ${style.left}`} onClick={(e) => scrollTracks(e, 0)} ref={scrollBtnLeft}>
                      <Image src="/chevron-left.png" width={500} height={500} alt="Scroll Left" />
                    </button>
                    <button className={`${style["scroll-btn"]} ${style.right}`} onClick={(e) => scrollTracks(e, 0)} ref={scrollBtnRight}>
                      <Image src="/chevron-right.png" width={500} height={500} alt="Scroll Right" />
                    </button>
                  </div>         
                ) : (
                  <div></div>
                )
              }
            {/* Featured items */}
            <div className={style["featured-container"]} ref={listTracks}>
              {recentTracks.map(track => (
                <a className={style["featured-item"]} key={track._id} onClick={() => handleTrackPlay(track._id)}>
                  <span className={style["track-container"]}>
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
              {/* Scroll buttons */}
                {
                  listTracks1.current ? (
                    <div>
                      <button className={`${style["scroll-btn"]} ${style.left}`} onClick={(e) => scrollTracks(e, 1)} ref={scrollBtnLeft}>
                        <Image src="/chevron-left.png" width={500} height={500} alt="Scroll Left" />
                      </button>
                      <button className={`${style["scroll-btn"]} ${style.right}`} onClick={(e) => scrollTracks(e, 1)} ref={scrollBtnRight}>
                        <Image src="/chevron-right.png" width={500} height={500} alt="Scroll Right" />
                      </button>
                    </div>         
                  ) : (
                    <div></div>
                  )
                }
              {/* Featured items */}
              <div className={style["featured-container"]} ref={listTracks1}>
                {mostPlayedTracks.map(track => (
                  <a className={style["featured-item"]} key={track._id} onClick={() => handleTrackPlay(track._id)}>
                    <span className={style["track-container"]}>
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