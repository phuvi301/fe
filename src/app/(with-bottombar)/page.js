'use client'
import { useState, useRef, useEffect } from "react";
import style from "../homepage.module.css"
import Image from "next/image";
import "dotenv/config";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { usePlayer } from "~/context/PlayerContext";
export default function Home() {
  const { bottomBarRef } = usePlayer();

	const searchInputRef = useRef(null);
	const clearInput = () => {
		setSearchInput("");
		searchInputRef.current.focus();
	};

	const toggleNotifications = () => {
		setShowNotifications(!showNotifications);
	};

	const toggleProfileMenu = () => {
		setShowProfileMenu(!showProfileMenu);
	};

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
              <a onClick={async () => bottomBarRef.current.playTrack("68eaac29ee09d1cc42f4269a")} id="song1">
                <span><Image src="/song/1.png" width={500} height={500} alt="Album 1" priority={true} />Song Title 1</span>
              </a>
              {/* Song 2 */}
              <a onClick={async () => bottomBarRef.current.playTrack("68ecae3fdde571b891d23137")} id="song2">
                <span><Image src="/albumcover.jpg" width={500} height={500} alt="Album 2" priority={true} />beside you</span>
              </a>
              {/* Song 3 */}
              <a href="#">
                <span><Image src="/song/3.png" width={500} height={500} alt="Album 3" priority={true} />Song Title 3</span>
              </a>
              {/* Song 4 */}
              <a href="#">
                <span><Image src="/song/4.png" width={500} height={500} alt="Album 4" priority={true}/>Song Title 4</span>
              </a>
              {/* Song 5 */}
              <a href="#">
                <span><Image src="/song/9.png" width={500} height={500} alt="Album 5" priority={true} />Song Title 5</span>
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
                <span><Image src="/song/5.png" width={500} height={500} alt="Album 6" />Song Title 6</span>
              </a>
              {/* Song 2 */}
              <a href="#">
                <span><Image src="/song/6.png" width={500} height={500} alt="Album 7" />Song Title 7</span>
              </a>
              {/* Song 3 */}
              <a href="#">
                <span><Image src="/song/7.jpg" width={500} height={500} alt="Album 8" />Song Title 8</span>
              </a>
              {/* Song 4 */}
              <a href="#">
                <span><Image src="/song/8.png" width={500} height={500} alt="Album 9" />Song Title 9</span>
              </a>
              {/* Song 5 */}
              <a href="#">
                <span><Image src="/song/vicuaanh.png" width={500} height={500} alt="Album 10" unoptimized />Vị của anh</span>
              </a>
              {/* Song 6 */}
              <a href="#">
                <span><Image src="/song/11.jpg" width={500} height={500} alt="Album 11" />Danh doi</span>
              </a>
            </div>
          </article>
        </section>
        
      </main>
    </div>
  );
}