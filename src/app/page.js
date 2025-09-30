import "./homepage.css"

export default function Home() {
  return (
    <div className="background">
      {/* Header */}
      <header>
        {/* Logo */}
        <img id="logo" src="/logo.png" alt="Music App Logo" />
        {/* Search bar */}
        <div className="search-bar">
          <input type="text" id="search-input" placeholder="Search" />
          <button id="search-button"><img src="/search-button.png" /></button>
        </div>
        {/* Profile */}
        <button id="profile-button"><img src="/profile.png" /></button>
      </header>
      {/* Sidebar */}
      <aside>
        <ul className="sidebar">
          <li><a href="/home"><img src="/home.png"></img>Home</a></li>
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
            <subtitle>Recommended for you</subtitle>
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
            </div>
          </article>
          {/* Featured container 2 */}
          <article className="featured-section">
            <h1>Trending by genre</h1>
            <subtitle>Discover what's popular</subtitle>
            <div className="featured-container">
              {/* Song 1 */}
              <a href="#">
                <span><img src="song/5.png" alt="Album 5" />Song Title 5</span>
              </a>
              {/* Song 2 */}
              <a href="#">
                <span><img src="song/6.png" alt="Album 6" />Song Title 6</span>
              </a>
              {/* Song 3 */}
              <a href="#">
                <span><img src="song/7.jpg" alt="Album 7" />Song Title 7</span>
              </a>
              {/* Song 4 */}
              <a href="#">
                <span><img src="song/8.png" alt="Album 8" />Song Title 8</span>
              </a>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}