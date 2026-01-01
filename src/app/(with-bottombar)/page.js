import { cookies } from "next/headers";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import TrackSection from "../components/TrackSection";
import style from "../styles/homepage.module.scss";

// 1. Hàm fetch data chạy trên Server
async function getHomepageData() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  try {
    // Gọi API Backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/display`, {
      method: "GET",
      headers: {
        // Truyền token từ cookie lên backend
        token: accessToken ? `Bearer ${accessToken}` : "",
        "Content-Type": "application/json",
      },
      // Revalidate: Cache dữ liệu trong 60 giây rồi mới fetch lại (Thay thế cho setInterval)
      next: { revalidate: 60 }, 
    });

    if (!res.ok) {
      console.error("Failed to fetch tracks", res.status);
      return { recent: [], mostPlayed: [], listened: [] };
    }

    const data = await res.json();
    // Giả sử API trả về cấu trúc như cũ
    return {
        recent: data.recent || [],
        mostPlayed: data.mostPlayed || [],
        listened: data.listened || []
    };

  } catch (error) {
    console.error("Error loading homepage:", error);
    return { recent: [], mostPlayed: [], listened: [] };
  }
}

// 2. Main Page Component (Async)
export default async function Home() {
  // Fetch dữ liệu trước khi render HTML
  const { recent, mostPlayed, listened } = await getHomepageData();

  return (
    <div className={style.background}>
      <Header />
      <Sidebar />
      
      <main className={style.mainContent}>
        <section className={style.featured}>
          
          {/* Section 1: Recently Added */}
          <TrackSection 
            title="Recently Added" 
            subtitle="Check out the newest tracks"
            tracks={recent}
            priority={true} // Ưu tiên load ảnh section này
          />

          {/* Section 2: Most Played */}
          <TrackSection 
            title="Most Played Tracks" 
            subtitle="See which songs top the play charts this week."
            tracks={mostPlayed}
          />

          {/* Section 3: Recently Listened (Chỉ hiện nếu có dữ liệu) */}
          {listened.length > 0 && (
            <TrackSection 
              title="Recently Listened Tracks" 
              subtitle="These are the tracks you've listened to recently."
              tracks={listened}
            />
          )}

        </section>
      </main>
    </div>
  );
}