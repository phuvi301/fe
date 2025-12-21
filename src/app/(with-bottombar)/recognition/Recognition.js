import { useState, useRef, useEffect } from 'react';
import styles from './recognition.module.css';
import Image from 'next/image';
import axios from 'axios';
import { useBottomBar } from '~/context/BottombarContext';
import { Key } from 'lucide-react';

const MusicRecognitionModal = ({ onClose }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [foundSongs, setFoundSongs] = useState([]);
    const tracks = useRef([]);
    const { bottomBarRef } = useBottomBar();
    
    const intervalRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(0);

    // --- Logic API (Giữ nguyên) ---
    const callRecognitionAPI = async (blob) => {
        if (!blob || blob.size === 0) {
            return "Failed";
        }

        try {
            const form = new FormData();
            form.append("file", blob, "audio.webm");

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/recognize`, form, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            const title = res.data.title;
            if (!title) {
                return "Failed";
            }

            const res1 = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/search`, { params: { q: title } })
            const track = res1.data.data[0];

            const existingTrack = tracks.current.find(t => t.id === track._id);
            if (existingTrack) return "OK";

            const newSong = {
                id: track._id,
                title: track.title,
                artist: track.artist,
                image: track.thumbnailUrl
            };

            tracks.current = [newSong, ...tracks.current];

            if (track.artist !== res.data.artist) {
                return "Failed";
            }
            else return "OK";
        } catch(err) {
            console.error(err);
        }
    };

    let chunks = [];

    const startRecording = async () => {
        if (!bottomBarRef.current.playerRef.current.paused) {
            bottomBarRef.current.togglePlay();
        }
        bottomBarRef.current.playerRef.current.isRecording = true;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data);
            mediaRecorderRef.current.start(1000);
            
            setIsRecording(true);
            timerRef.current = 0;
            setFoundSongs([]); 
            tracks.current = [];

            intervalRef.current = setInterval(async () => {
                const newTime = timerRef.current + 1;
                timerRef.current = newTime;
                if (newTime % 10 === 0) {
                    const blob = new Blob(chunks, { type: "audio/webm" });

                    const res = await callRecognitionAPI(blob);
                    if (res === "OK") {
                        setFoundSongs(prev => [...tracks.current, ...prev])  
                        stopRecording();
                    }
                }
                if (newTime >= 30) {
                    setFoundSongs(prev => [...tracks.current, ...prev]) 
                    stopRecording();
                    return 30; // Giữ ở số 30
                }
            }, 1000);

        } catch (err) {
            console.er("Không thể truy cập Micro.", err);
            stopRecording();
        }
    };

    const stopRecording = () => {
        bottomBarRef.current.playerRef.current.isRecording = false;
        setIsRecording(false);
        timerRef.current = 0;
        chunks = [];
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const toggleTrack = async (_id) => {
        await bottomBarRef.current.play(_id);
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
                    <div key={song.id} className={styles.songItem} onClick={() => toggleTrack(song.id)}>
                        <img src={song.image} alt="Art" className={styles.songImg} />
                        <div className={styles.songInfo}>
                            <span className={styles.songTitle}>{song.title}</span>
                            <span className={styles.songArtist}>{song.artist}</span>
                        </div>
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