import { notFound } from "next/navigation";
import TrackDetail from "./TrackDetail";

// 1. Hàm fetch data trên server
async function getTrackData(id) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${id}`, {
      cache: "no-store", 
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Fetch track error:", error);
    return null;
  }
}

// 2. Main Page Component (Server Side)
export default async function TrackPage({ params }) {
  // SỬA LỖI: Await params trước khi dùng
  const resolvedParams = await params;
  const trackData = await getTrackData(resolvedParams.id);

  if (!trackData) {
    return notFound();
  }

  return (
    <>
      {/* Truyền ID đã resolve xuống Client Component */}
      <TrackDetail initialTrackData={trackData} id={resolvedParams.id} />
    </>
  );
}