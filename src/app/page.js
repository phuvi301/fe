import "./homepage.css"

export default function Home() {
  return (
    <div className="background">
      <header>
        <img id="logo" src="/logo.png" alt="Music App Logo" />
        <div className="search-bar">
          <input type="text" id="search-input" placeholder="Search" />
          <button id="search-button"><img src="/search-button.png" /></button>
        </div>
        <a href="/profile">Profile</a>
      </header>
      <aside>
        <ul>
          <li><a href="/home"><img src="/home.png"></img>Home</a></li>
          <li><a href="/browse"><img src="/browse.png"></img>Browse</a></li>
          <li><a href="/likes"><img src="/likes.png"></img>Likes</a></li>
          <li><a href="/playlists"><img src="/playlists.png"></img>Playlists</a></li>
          <li><a href="/songs"><img src="/songs.png"></img>Songs</a></li>
          <li><a href="/about"><img src="/about.png"></img>About</a></li>
        </ul>
      </aside>
      <main>
        <section className="featured">
          <article className="featured-article">
            <img src="/featured1.jpg" alt="Featured 1" />
            <h2>Featured Album 1</h2>
          </article>
        </section>
      </main>
    </div>
  );
}