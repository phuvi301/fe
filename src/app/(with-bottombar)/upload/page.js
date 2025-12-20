'use client';
import { useState, useRef } from "react";
import Select from 'react-select';
import Image from "next/image";
import layout from "~/app/homepage.module.scss"
import style from "./upload.module.css";
import Header from "~/app/components/Header";
import Sidebar from "~/app/components/Sidebar";
import axios from "axios";
import clsx from "clsx";

export default function Upload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [imgFile, setImgFile] = useState(null);
    const [imgPreview, setImgPreview] = useState(null);
    const [imgZoom, setImgZoom] = useState(100);
    const [selectedGenre, setSelectedGenre] = useState([]);

    const fileInputRef = useRef(null);
    const imgInputRef = useRef(null);
    const titleRef = useRef(null);
    const artistRef = useRef(null);

    const resetRef = useRef(null);

    const genres = [
        { value: "pop", label: "Pop" }, { value: "rock", label: "Rock" }, { value: "hiphop", label: "Hip-Hop" }, { value: "rnb", label: "R&B" }, { value: "jazz", label: "Jazz" }, { value: "classical", label: "Classical" },
        { value: "electronic", label: "Electronic" }, { value: "country", label: "Country" }, { value: "folk", label: "Folk" }, { value: "reggae", label: "Reggae" }, { value: "blues", label: "Blues" },
        { value: "metal", label: "Metal" }, { value: "punk", label: "Punk" }, { value: "alternative", label: "Alternative" }, { value: "indie", label: "Indie" }, { value: "dance", label: "Dance" },
        { value: "house", label: "House" }, { value: "deephouse", label: "Deep House" }, { value: "techno", label: "Techno" }, { value: "ambient", label: "Ambient" }, { value: "other", label: "Other" }
    ];

    const handleGenreChange = (value) => {
        setSelectedGenre(value);
    }
    const [lyricFile, setLyricFile] = useState(null);
    const lyricInputRef = useRef(null);
    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    // Chọn file để upload
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("audio/")) return;
        setSelectedFile(file);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            });

            resetRef.current.style.display = 'block';
            console.log('File converted successfully:', res.data);
        } catch (error) {
            console.error('Error converting file:', error);
        }
    };

    const handleImgChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            setImgFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImgPreview(e.target.result);
                setImgZoom(100); // Reset zoom khi đổi ảnh
            };
            reader.readAsDataURL(file);
        }
    };

    // Chọn file lời bài hát
    const handleLyricSelect = () => {
        lyricInputRef.current?.click();
    };

    const handleLyricChange = (e) => {
        const file = e.target.files[0];
        // Kiểm tra đuôi file có phải .lrc hoặc .txt không
        if (file && (file.name.endsWith('.lrc') || file.name.endsWith('.txt'))) {
            setLyricFile(file);
        } else {
            alert("Please upload a valid .lrc file");
        }
    };
    
    // Lấy accessToken từ localStorage (được lưu sau khi đăng nhập)
    const getAccessToken = () => {
        try {
            const raw = localStorage.getItem("userInfo");
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed?.accessToken || null;
        } catch (e) {
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... validate title, artist giữ nguyên

        const metaData = new FormData();
        metaData.append('title', titleRef.current.value);
        metaData.append('artist', artistRef.current.value);
        metaData.append('genre', selectedGenre.map(g => g.value).join(','));
        metaData.append('originalName', selectedFile.name);
        metaData.append('thumbnail', imgFile);
        
        // 3. Append Lyric file vào FormData
        if (lyricFile) {
            metaData.append('lyrics', lyricFile);
        }

        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                alert('You need to login.');
                return;
            }
            // ⚠️ QUAN TRỌNG: Phải thêm "/upload" vào cuối đường dẫn
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/upload`, // Sửa dòng này
                metaData, 
                {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        // Backend yêu cầu header 'token' dạng 'Bearer <accessToken>'
                        token: `Bearer ${accessToken}`
                    },
                    withCredentials: true,
                }
            );
            setSelectedFile(null);
            setImgFile(null);
            setImgPreview(null);
            setImgZoom(100);
            setSelectedGenre([]);

            if (fileInputRef.current) fileInputRef.current.value = null;
            if (imgInputRef.current) imgInputRef.current.value = null;
            
            // ... xử lý thành công ...
            console.log("Upload success:", res.data);
        } catch (error) {
            // In lỗi chi tiết ra để debug
            console.error("Upload error:", error.response ? error.response.data : error.message);
        }
    }
    // Đặt lại trạng thái và xóa file trên server
    const handleReset = async () => {
        // Xóa file trên server
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/reset`, { name: selectedFile.name });
            const name = selectedFile.name;

            // Đặt lại trạng thái
            setSelectedFile(null);
            setImgFile(null);
            setImgPreview(null);
            setImgZoom(100);
            setSelectedGenre([]);
            setLyricFile(null);

            if (lyricInputRef.current) lyricInputRef.current.value = null;
            if (fileInputRef.current) fileInputRef.current.value = null;
            if (imgInputRef.current) imgInputRef.current.value = null;

            console.log('File deleted successfully:', name);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleImgSelect = () => {
        imgInputRef.current?.click();
    };

    const handleZoomChange = (event) => {
        setImgZoom(event.target.value);
    };

    return (
        <div className={clsx(layout.background)}>
            <Header />
            <Sidebar />

            <main className={clsx(layout.main)}>
                <div className={style.uploadContainer}>
                    {!selectedFile ? (
                        <div className={style.uploadBox}>
                            <Image src="/upload_animated.png" width={1024} height={1024} alt="Upload Icon" className={style.uploadIcon} />
                            <h1>Upload Your Music</h1>
                            <span className="upload-subtitle">
                                Choose a file to upload
                            </span>
                            <button
                                className={style.uploadButton}
                                onClick={handleFileSelect}
                                type="button"
                            >
                                Select File
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                className={style.fileInput}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                    ) : (
                        <div className={style.formBox}>
                            {/* File Info Popup - di chuyển vào đây */}
                            <div className={style.leftformBox}>
                                {selectedFile && (
                                    <div className={style.fileInfoPopup}>
                                        <div className={style.popupContent}>
                                            <div className={style.fileInfo}>
                                                <div className={style.fileIcon}><Image src="/songs.png" width={1024} height={1024} alt="Music Icon" /></div>
                                                <div className={style.fileDetails}>
                                                    <div className={style.fileName}>{selectedFile.name}</div>
                                                    <div className={style.fileSize}>
                                                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className={style.changeFileButton}
                                                onClick={handleReset}
                                                type="button"
                                                title="Change File"
                                                ref={resetRef}
                                                style={{ display: 'none' }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className={style.uploadImgContainer}>
                                    <div className={style.imgUploadBox}>

                                        {imgPreview ? (
                                            <div className={style.imagePreviewContainer}>
                                                <div className={style.fixedImageFrame}>
                                                    <Image
                                                        src={imgPreview}
                                                        width={1024}
                                                        height={1024}
                                                        alt="Preview"
                                                        className={style.previewImage}
                                                        style={{
                                                            transform: `scale(${imgZoom / 100})`
                                                        }}
                                                    />
                                                </div>
                                                <div className={style.zoomControls}>
                                                    <label className={style.zoomLabel}>Zoom: {imgZoom}%</label>
                                                    <input
                                                        type="range"
                                                        min="50"
                                                        max="200"
                                                        value={imgZoom}
                                                        onChange={handleZoomChange}
                                                        className={style.zoomSlider}
                                                    />
                                                </div>
                                                <div className={style.imageControls}>
                                                    <button
                                                        className={style.changeImageButton}
                                                        onClick={handleImgSelect}
                                                        type="button"
                                                    >
                                                        Change Image
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Image
                                                    src="/image.png"
                                                    width={1024}
                                                    height={1024}
                                                    alt="Upload Icon"
                                                    className={style.uploadedImage}
                                                />
                                                <h1>Add Your Image</h1>
                                                <span className="upload-subtitle">
                                                    Choose a file to upload
                                                </span>
                                                <button
                                                    className={style.uploadButton}
                                                    onClick={handleImgSelect}
                                                    type="button"
                                                >
                                                    Select File
                                                </button>
                                            </>
                                        )}
                                        <input
                                            ref={imgInputRef}
                                            type="file"
                                            accept="image/*"
                                            className={style.fileInput}
                                            onChange={handleImgChange}
                                            style={{ display: 'none' }}
                                        /> 
                            </div>
                        </div>
                        <div className={style.lyricUploadContainer}>
                    <div className={style.lyricUploadBox}>
                        {lyricFile ? (
                            <div className={style.lyricFileInfo}>
                                <Image src="/lyrics.png" width={40} height={40} alt="Lrc Icon" />
                                <div className={style.lyricDetails}>
                                    <span className={style.lyricName}>{lyricFile.name}</span>
                                    <button 
                                        className={style.changeLyricButton}
                                        onClick={handleLyricSelect}
                                        type="button"
                                    >
                                        Change .LRC
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Image
                                    src="/lyrics.png" // Đảm bảo bạn có icon này hoặc dùng icon khác
                                    width={50}
                                    height={50}
                                    alt="Lyric Icon"
                                    className={style.lyricIcon}
                                />
                                <h3>Add Lyrics</h3>
                                <span className="upload-subtitle" style={{fontSize: '12px', color: '#ccc'}}>
                                    (.lrc file)
                                </span>
                                <button 
                                    className={style.uploadMiniButton}
                                    onClick={handleLyricSelect}
                                    type="button"
                                >
                                    Select File
                                </button>
                            </>
                        )}
                        <input 
                            ref={lyricInputRef}
                            type="file" 
                            accept=".lrc,.txt" 
                            className={style.fileInput}
                            onChange={handleLyricChange}
                        />
                            </div>
                        </div>
                            </div>
                            <div className={style.metadataBox}>
                                <div className={style.metadataHeader}>
                                    <h1>Song Metadata</h1>
                                </div>
                                <form className={style.metadataForm} onSubmit={handleSubmit}>
                                    <div className={style.metadataLabel}>
                                        Title:
                                        <div className={style.metainputcontainer}>
                                            <input className={style.metadataInput} ref={titleRef} type="text" placeholder="Enter song title"
                                                defaultValue={selectedFile.name.replace(".mp3", "")} />
                                        </div>
                                    </div>
                                    <div className={style.metadataLabel}>
                                        Artist:
                                        <div className={style.metainputcontainer}>
                                            <input className={style.metadataInput} ref={artistRef} type="text" placeholder="Enter artist name" />
                                        </div>
                                    </div>
                                    <div className={style.metadataLabel}>
                                        Genre:
                                        <div className={style.metainputcontainer}>
                                            <Select
                                                isMulti
                                                classNamePrefix="genreselect"
                                                options={genres}
                                                onChange={handleGenreChange}
                                                placeholder="Select genre(s)"
                                                value={selectedGenre}
                                                name="genre"
                                                isClearable
                                            />
                                        </div>
                                    </div>
                                    <div className={style.uploadbuttonContainer}>
                                        <button type="submit" className={style.uploadButton}>Upload Song</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

