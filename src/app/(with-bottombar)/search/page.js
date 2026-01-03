import layout from "~/app/styles/homepage.module.scss";
import clsx from "clsx";
import Header from "~/app/components/Header";
import Sidebar from "~/app/components/Sidebar";
import SearchResults from "./SearchResults";

// 1. Hàm fetch data trên Server
async function getSearchResults(query) {
    if (!query) return [];
    
    try {
        // Dùng fetch thay vì axios để dễ config cache
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${query}`, {
            cache: "no-store", // Search luôn cần data mới, không cache
        });
        
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (error) {
        console.error("Search fetch error:", error);
        return [];
    }
}

// 2. SEO Metadata động theo từ khóa tìm kiếm
export async function generateMetadata({ searchParams }) {
    const { q } = await searchParams;
    const query = q || "";

    return {
        title: query ? `Search results for "${query}" | MusicHUB` : "Search | MusicHUB",
        description: `Listen to music related to ${query} on MusicHUB.`,
        robots: {
            index: false, // Thường các trang kết quả tìm kiếm không nên để Google index để tránh spam link
            follow: true,
        },
    };
}

// 3. Component chính
export default async function SearchPage({ searchParams }) {
    const { q } = await searchParams;
    const query = q || "";
    
    // Fetch dữ liệu ngay trên server
    const searchResults = await getSearchResults(query);

    return (
        <div className={clsx(layout.background)}>
            <Header />
            <Sidebar />
            
            <main className={layout.mainContent}>
                {/* Truyền dữ liệu đã fetch xuống Client Component */}
                <SearchResults results={searchResults} query={query} />
            </main>
        </div>
    );
}