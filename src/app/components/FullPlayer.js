import React from 'react';
import '../styles/FullPlayer.module.scss';

const FullPlayer = ({ 
    isOpen,         // Trạng thái mở/đóng (true/false)
    onClose,        // Hàm để đóng player
    currentSong,    // Thông tin bài hát (cover, name, artist...)
    isPlaying,      // Trạng thái đang phát hay dừng
    onPlayPause,    // Hàm xử lý play/pause
    onNext,         // Hàm next bài
    onPrev,         // Hàm prev bài
    currentTime,    // Thời gian hiện tại (số giây)
    duration,       // Tổng thời gian (số giây)
    onSeek,         // Hàm tua (khi kéo thanh slider)
    // Các props phụ nếu cần (shuffle, repeat, like...)
}) => {

    // Helper: Format giây sang phút:giây (VD: 90s -> 1:30)
    const formatTime = (time) => {
        if (!time || isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Nếu không có bài hát thì không render gì cả (hoặc render loading)
    if (!currentSong) return null;

    return (
        <div className={`full-player-overlay ${isOpen ? 'open' : ''}`}>
            
            {/* 1. Header & Close Button */}
            <div className="fp-header">
                <button className="fp-close-btn" onClick={onClose}>
                    {/* Dùng icon mũi tên xuống hoặc icon đóng */}
                    <img src="/icons/down-arrow.svg" alt="Close" style={{ filter: 'invert(1)' }} />
                </button>
                <div className="fp-header-title-container">
                    <span className="fp-header-title">ĐANG PHÁT</span>
                </div>
                <div style={{ width: 44 }}></div> {/* Placeholder để cân giữa */}
            </div>

            {/* 2. Artwork */}
            <div className="fp-artwork-container">
                <img 
                    src={currentSong.coverUrl || "/default-cover.png"} 
                    alt={currentSong.name} 
                    className="fp-artwork"
                />
            </div>

            {/* 3. Song Info */}
            <div className="fp-song-info">
                <div className="fp-text-info">
                    <h2 className="fp-title">{currentSong.name}</h2>
                    <p className="fp-artist">{currentSong.artist}</p>
                </div>
                <button className="fp-like-btn">
                     <img src="unlike.png" alt="Like" style={{ filter: 'invert(1)' }}/>
                </button>
            </div>

            {/* 4. Progress Bar */}
            <div className="fp-progress-container">
                <input 
                    type="range" 
                    className="fp-progress-bar"
                    min="0"
                    max={duration || 0}
                    value={currentTime || 0}
                    onChange={(e) => onSeek(e.target.value)}
                />
                <div className="fp-time-info">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* 5. Controls */}
            <div className="fp-controls">
                {/* Các nút Shuffle, Repeat bạn có thể thêm vào đây */}
                <button className="fp-btn shuffle"><img src="shuffle.png" alt="shuffle" /></button>
                
                <button className="fp-btn prev" onClick={onPrev}>
                    <img src="previous.png" alt="prev" />
                </button>
                
                <button className="fp-btn play-large" onClick={onPlayPause}>
                    <img 
                        src={isPlaying ? "pause.png" : "play.png"} 
                        alt="Play/Pause" 
                    />
                </button>
                
                <button className="fp-btn next" onClick={onNext}>
                    <img src="next.png" alt="next" />
                </button>

                <button className="fp-btn repeat"><img src="repeat.png" alt="repeat" /></button>
            </div>
        </div>
    );
};

export default FullPlayer;