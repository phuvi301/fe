'use client'

import { useState, useRef } from "react";
import "./homepage.css"

export default function Home() {

  const [searchInput, setSearchInput] = useState("");
  const searchInputRef = useRef(null);
  const clearInput = () => {
    setSearchInput("");
    searchInputRef.current.focus();
  };

  return (
    <div className="background">
      {/* Header */}
      <header>
        {/* Logo */}
        <a href="/"><img id="logo" src="/logo.png"/></a>
        {/* Search bar */}
        <div className="search-container">
          <div className="search-bar">
            <span className="search-btn" title="Search">
              <img src="/search-button.png" alt="Search" />
            </span>
            <input type="text" placeholder="What do you wanna listen today?" id="search-input" spellCheck="false" autoCorrect="off" autoCapitalize="off" 
              ref={searchInputRef}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <span className="clear-btn" onClick={clearInput} title="Clear">
                <img src="/cancel-icon.png" alt="Cancel" />
              </span>
            )}
            <span className="micro-button" title="Music recognition">
              <img src="/microphone.png" alt="Recognition" />
            </span>
          </div>
        </div>
        {/* Profile */}
        <button id="profile-button" title="Profile"><img src="/hcmut.png" /></button>
      </header>
      {/* Sidebar */}
      <aside>
        <ul className="sidebar">
          <li><a href="/likes"><img src="/unlike.png"></img>Likes</a></li>
          <li><a href="/songs"><img src="/songs.png"></img>Songs</a></li>
          <li><a href="/playlists"><img src="/playlists.png"></img>Playlists</a></li>
          <li><a href="/about"><img src="/about.png"></img>About</a></li>
        </ul>
      </aside>
      {/* Main content */}
      <main>
        {/* Featured section */}
        <section className="featured">
          {/* Featured container 1 */}
          <article className="featured-section">
            <h1>More of what you like</h1>
            <p>Recommended for you</p>
            <div className="featured-container">
              {/* Song 1 */}
              <a href="#">
                <span><img src="song/1.png" alt="Album 1" />Song Title 1</span>
              </a>
              {/* Song 2 */}
              <a href="#">
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
          <article className="featured-section">
            <h1>Trending by genre</h1>
            <p>Discover what's popular</p>
            <div className="featured-container">
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
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}