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

// 2. SEO Metadata (Dynamic)
// Lưu ý: params ở đây cũng là Promise
export async function generateMetadata({ params }) {
  // SỬA LỖI: Await params trước khi dùng
  const resolvedParams = await params; 
  const track = await getTrackData(resolvedParams.id);

  if (!track) {
    return { title: "Track not found | MusicHUB" };
  }

  return {
    title: `${track.title} - ${track.owner?.nickname || "Artist"} | MusicHUB`,
    description: `Listen to ${track.title} by ${track.owner?.nickname} on MusicHUB.`,
    openGraph: {
      title: track.title,
      description: `Listen to ${track.title} on MusicHUB`,
      images: [track.thumbnailUrl || "/og-default.jpg"],
      type: "music.song",
    },
  };
}

// 3. Main Page Component (Server Side)
export default async function TrackPage({ params }) {
  // SỬA LỖI: Await params trước khi dùng
  const resolvedParams = await params;
  const trackData = await getTrackData(resolvedParams.id);

  if (!trackData) {
    return notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": trackData.title,
    "url": `https://musichub.com/track/${trackData._id}`,
    "image": trackData.thumbnailUrl,
    "duration": `PT${Math.floor(trackData.duration)}S`,
    "byArtist": {
      "@type": "MusicGroup",
      "name": trackData.owner?.nickname || "Unknown Artist"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Truyền ID đã resolve xuống Client Component */}
      <TrackDetail initialTrackData={trackData} id={resolvedParams.id} />
    </>
  );
}