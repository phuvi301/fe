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

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);  
        }
    };
    const handleSubmit = (event) => {
        event.preventDefault();
        // logic to handle here
        console.log("ABC", selectedFile);
    }
    const handleReset = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
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
                    <div className={style.metadataBox}>
                        <div className={style.resetButtonContainer}>
                        <button 
                            className={style.resetButton} 
                            onClick={handleReset}
                            type="button"
                        >
                            Change File
                        </button>
                        </div>
                        <h3>Song Metadata</h3>
                        <form className={style.metadataForm}>
                            <label>
                                Title:
                                <input type="text" name="title" placeholder="Enter song title" />
                            </label>
                            <label>
                                Artist:
                                <input type="text" name="artist" placeholder="Enter artist name" />
                            </label>
                            <label>
                                Album:
                                <input type="text" name="album" placeholder="Enter album name" />
                            </label>
                            <label>
                                Genre:
                                <input type="text" name="genre" placeholder="Enter genre" />
                            </label>
                            <label>
                                Release Date:
                                <input type="date" name="releaseDate" />
                            </label>
                            <button type="submit" className={style.uploadButton}>Upload Song</button>
                        </form>
                    </div>
                    )}
                </div>
            </main>
        </div>
    );
}

