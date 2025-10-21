'use client'
import style from "../homepage.module.css"
import Image from "next/image";
import "dotenv/config";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { usePlayer } from "~/context/PlayerContext";

export default function Home() {
  const { bottomBarRef } = usePlayer();

  const handleTrackPlay = async (trackId) => {
    await bottomBarRef.current.playTrack(trackId);
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
              <a onClick={() => handleTrackPlay("68eaac29ee09d1cc42f4269a")}>
                <span><Image src="/song/1.png" width={500} height={500} alt="Album 1" priority={true} />Somebody's Pleasure</span>
              </a>
              {/* Song 2 */}
              <a onClick={() => handleTrackPlay("68ecae3fdde571b891d23137")}>
                <span><Image src="/albumcover.jpg" width={500} height={500} alt="Album 2" priority={true} />beside you</span>
              </a>
              {/* Song 3 */}
              <a onClick={() => handleTrackPlay("68f67467bb66a13123769870")}>
                <span><Image src="/song/3.png" width={500} height={500} alt="Album 3" priority={true} />Ngàn Năm Ánh Sáng</span>
              </a>
              {/* Song 4 */}
              <a onClick={() => handleTrackPlay("68f508114fbd605305644a59")}>
                <span><Image src="/song/4.png" width={500} height={500} alt="Album 4" priority={true}/>Đánh Đổi</span>
              </a>
              {/* Song 5 */}
              <a onClick={() => handleTrackPlay("68f5fc46cae338e5734651d1")}>
                <span><Image src="/song/9.png" width={500} height={500} alt="Album 5" priority={true} />thap trap tu do (remix)</span>
              </a>
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