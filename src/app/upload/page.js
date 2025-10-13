'use client';
import { useState, useRef } from "react";
import layout from "../homepage.module.css"
import style from "./upload.module.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import clsx from "clsx";

export default function Upload() {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imgFile, setImgFile] = useState(null);
    const [imgPreview, setImgPreview] = useState(null);
    const [imgZoom, setImgZoom] = useState(100);
    const imgInputRef = useRef(null);

    const genres = [
        "Pop", "Rock", "Hip-Hop", "R&B", "Jazz", "Classical", 
        "Electronic", "Country", "Folk", "Reggae", "Blues", 
        "Metal", "Punk", "Alternative", "Indie", "Dance", 
        "House", "Techno", "Ambient", "Other"
    ];

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);  
        }
    };

    const handleImgChange = (event) => {
        const file = event.target.files[0];
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

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Music file:", selectedFile);
        console.log("Image file:", imgFile);
        console.log("Image zoom:", imgZoom);
    }

    const handleReset = () => {
        setSelectedFile(null);
        setImgFile(null);
        setImgPreview(null);
        setImgZoom(100);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
        if (imgInputRef.current) {
            imgInputRef.current.value = null;
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
                        <img src="/upload_animated.png" alt="Upload Icon" className={style.uploadIcon} />
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
                                                <div className={style.fileIcon}><img src="/songs.png" alt="Music Icon" /></div>
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
                                            <img
                                                src={imgPreview}
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
                                        <img
                                            src="/image.png"
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
                        </div>
                        <div className={style.metadataBox}>
                            <div className={style.metadataHeader}>
                                <h1>Song Metadata</h1>
                            </div>
                            <form className={style.metadataForm} onSubmit={handleSubmit}>
                                <div className={style.metadataLabel}>
                                    Title:
                                    <div className={style.metainputcontainer}>
                                        <input className={style.metadataInput} type="text" placeholder="Enter song title" />
                                    </div>
                                </div>
                                <div className={style.metadataLabel}>
                                    Artist:
                                    <div className={style.metainputcontainer}>
                                        <input className={style.metadataInput} type="text" placeholder="Enter artist name" />
                                    </div>
                                </div>
                                <div className={style.metadataLabel}>
                                    Album:
                                    <div className={style.metainputcontainer}>
                                        <input className={style.metadataInput} type="text" placeholder="Enter album name" />
                                    </div>
                                </div>
                                <div className={style.metadataLabel}>
                                    Genre:
                                    <div className={style.metainputcontainer}>
                                        <select className={style.metadataInput} name="genre">
                                            <option value="" disabled selected>Select a genre</option>
                                            {genres.map((genre, index) => (
                                                <option key={index} value={genre.toLowerCase()}>
                                                    {genre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={style.metadataLabel}>
                                    Release Date:
                                    <div className={style.metainputcontainer}>
                                        <input className={style.metadataInput} type="date" name="releaseDate" />
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

