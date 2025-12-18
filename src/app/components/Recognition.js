import { useState, useRef, useEffect } from 'react';
import styles from '../styles/recognition.module.css';
import Image from 'next/image';

const MusicRecognitionModal = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [foundSongs, setFoundSongs] = useState([]);
  
  const intervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(0);

  // --- Logic API (Giữ nguyên) ---
  const callRecognitionAPI = async () => {
    // console.log("Gửi file âm thanh lên server...");
    // Giả lập logic tìm thấy
    const isFound = Math.random() > 0.5; 
    if (isFound) {
      const newSong = {
        id: Date.now(),
        title: `Bài hát tìm thấy #${foundSongs.length + 1}`,
        artist: "Ca sĩ ẩn danh",
        image: "https://via.placeholder.com/150"
      };
      setFoundSongs(prev => [newSong, ...prev]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      
      setIsRecording(true);
      timerRef.current = 0;
      setFoundSongs([]); 

      intervalRef.current = setInterval(() => {
        const newTime = timerRef.current + 1;
        timerRef.current = newTime;
        console.log("Recording time:", newTime);
        if (newTime % 10 === 0) callRecognitionAPI();
        if (newTime >= 30) {
          stopRecording();
          return 30; // Giữ ở số 30
        }
      }, 1000);

    } catch (err) {
      alert("Không thể truy cập Micro.");
      stopRecording();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Cleanup: Dừng thu âm nếu người dùng tắt modal đột ngột
  useEffect(() => {
    return () => stopRecording();
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* stopPropagation để click vào modal không bị đóng */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Nút đóng */}
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>

        <div className={styles.statusText}>
          {isRecording ? `Listening...` : 'Tap to recognize'}
        </div>

        <button 
          className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          <div className={styles.logoIcon}>
            {/* Thay icon của bạn vào đây */}
             {isRecording ? '||' : <Image src="/logo.png" alt="Mic" width={384} height={216}/>}
          </div>
        </button>

        <div className={styles.resultSection}>
          <div className={styles.resultHeader}>Results</div>
          
          <div className={styles.songList}>
            {foundSongs.length === 0 ? (
              <p style={{textAlign: 'center', color: '#666', fontSize: '0.9rem', marginTop: '20px'}}>
                {isRecording ? 'Analyzing...' : 'No results yet'}
              </p>
            ) : (
              foundSongs.map((song) => (
                <div key={song.id} className={styles.songItem}>
                  <img src={song.image} alt="Art" className={styles.songImg} />
                  <div className={styles.songInfo}>
                    <span className={styles.songTitle}>{song.title}</span>
                    <span className={styles.songArtist}>{song.artist}</span>
                  </div>
                  <div className={styles.playIcon}>▶</div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MusicRecognitionModal;