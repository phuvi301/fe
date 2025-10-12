'use client'
import { useState, useRef } from "react";
import style from "./homepage.module.css"
import Link from "next/link";
import axios from "axios";

export default function Home() {

	const [trackPlaying, setTrackPlaying] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [showNotifications, setShowNotifications] = useState(false);
	const [showProfileMenu, setShowProfileMenu] = useState(false);
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

	const playTrack = async (track) => {
		console.log(track);
		axios
			.post("http://localhost:8080/api/tracks/getTrack", { title: track })
			.then((response) => {
				console.log("Response data:", response.data);
				const url = response.data.data.audioUrl;
				if (!url) throw "Audio URL not found";
				setTrackPlaying(url);
				console.log("Playing track:", track);
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
      <header>
        {/* Logo */}
        <Link href="/">
          <img id={style.logo} src="/logo&text.png"/>
        </Link>
        {/* Search bar */}
        <div className={style["search-container"]}>
          <div className={style["search-bar"]}>
            <span className={style["search-btn"]} title="Search">
              <img src="/search-button.png" alt="Search" />
            </span>
            <input type="text" placeholder="What do you wanna listen today?" id={style["search-input"]} spellCheck="false" autoCorrect="off" autoCapitalize="off" 
              ref={searchInputRef}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <span className={style["clear-btn"]} onClick={clearInput} title="Clear">
                <img src="/cancel-icon.png" alt="Cancel" />
              </span>
            )}
            <span className={style["micro-button"]} title="Music recognition">
              <img src="/microphone.png" alt="Recognition" />
            </span>
          </div>
        </div>
        {/* Notification and Profile */}
        <div className={style["header-actions"]}>
          {/* Notification button */}
          <div className={style["notification-container"]}>
            <button 
              className={style["notification-button"]} 
              onClick={toggleNotifications}
              title="Notifications"
            >
              <img src="/notification.png" alt="Notifications" />
              {notifications.length > 0 && (
                <span className={style["notification-badge"]}>{notifications.length}</span>
              )}
            </button>
            
            {/* Notification dropdown */}
            {showNotifications && (
              <div className={style["notification-dropdown"]}>
                <div className={style["notification-header"]}>
                  <h3>Notifications</h3>
                </div>
                <div className={style["notification-list"]}>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className={style["notification-item"]}>
                        <p className={style["notification-message"]}>{notification.message}</p>
                        <span className={style["notification-time"]}>{notification.time}</span>
                      </div>
                    ))
                  ) : (
                    <div className={style["no-notifications"]}>
                      <p>No new notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Profile */}
          <div className={style["profile-container"]}>
            <button id={style["profile-button"]} title="Profile" onClick={toggleProfileMenu}>
              <img src="/hcmut.png" />
            </button>
            {showProfileMenu && (
              <div className={style["profile-dropdown"]}>
                <div className={style["profile-header"]}>
                  <div className={style["profile-info"]}>
                    <img src="/hcmut.png" alt="Profile" className={style["profile-avatar"]} />
                    <div className={style["profile-details"]}>
                      <h4>User Name</h4>
                      <p>user@example.com</p>
                    </div>
                  </div>
                </div>
                <div className={style["profile-menu"]}>
                  <Link href="/account" className={style["profile-menu-item"]} >
                    <img src="/account.png" alt="Account" />
                    <span>Account</span>
                  </Link>
                  <Link href="/settings" className={style["profile-menu-item"]} >
                    <img src="/setting.png" alt="Settings" />
                    <span>Settings</span>
                  </Link>
                  <Link href="/login" className={style["profile-menu-item"]} >
                    <img src="/logout.png" alt="Logout" />
                    <span>Log out</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Overlay để đóng notification khi click bên ngoài */}
      {showNotifications && (
        <div 
          className={style["notification-overlay"]} 
          onClick={() => setShowNotifications(false)}
        />
      )}
      {showProfileMenu && (
        <div 
          className={style["profile-overlay"]} 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
      {/* Sidebar */}
      <aside>
        <ul className={style.sidebar}>
          <li><a href="/like"><img src="/unlike.png"></img>Likes</a></li>
          <li><a href="/upload"><img src="/upload.png"></img>Upload</a></li>
          <li><a href="/playlists"><img src="/playlists.png"></img>Playlists</a></li>
          <li><a href="/about"><img src="/about.png"></img>About</a></li>
        </ul>
      </aside>
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
              <a onClick={() => playTrack("keshi - LIMBO (Visualizer)")}>
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
            <audio controls type="audio/mpeg" />
          </div>
        )}
      </main>
    </div>
  );
}