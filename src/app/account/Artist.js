"use client";
import styles from "./Account.module.scss";
import clsx from "clsx";
import { faPlay, faShare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";

function Artist() {
    

    return (
        <>
            <div className={clsx(styles["personal-info-wrapper"])}>
                <Image
                    src={"/background.jpg"}
                    alt=""
                    width={100}
                    height={100}
                    className={clsx(styles["personal-info-image"])}
                />
                <div className={clsx(styles["personal-name-group"])}>
                    <h4 className={clsx(styles["personal-name"])}>@LMKgaming</h4>
                    <p className={clsx(styles["personal-follower"])}>Follower: 2.500</p>
                </div>
                <button className={clsx(styles["personal-share-btn"])}>
                    <FontAwesomeIcon icon={faShare} className={clsx(styles["button-icon"])} />
                    <span className={clsx(styles["button-info"])}>Share</span>
                </button>
            </div>
            <div className={clsx(styles["personal-upload-wrapper"])}>
                <p className={clsx(styles["personal-upload-title"])}>Bài hát của bạn</p>
                <div className={clsx(styles["personal-upload-list"])}>
                    <div className={clsx(styles["personal-upload-item"])}>
                        <Image
                            src={"/background.jpg"}
                            width={100}
                            height={100}
                            alt=""
                            className={clsx(styles["personal-upload-item-image"])}
                        />
                        <span className={clsx(styles["personal-upload-item-name"])}>Audio name</span>
                        <button className={clsx(styles["personal-upload-item-play-btn"])}>
                            <FontAwesomeIcon icon={faPlay} />
                        </button>
                    </div>
                    <div className={clsx(styles["personal-upload-item"])}>
                        <Image
                            src={"/background.jpg"}
                            width={100}
                            height={100}
                            alt=""
                            className={clsx(styles["personal-upload-item-image"])}
                        />
                        <span className={clsx(styles["personal-upload-item-name"])}>Audio name</span>
                        <button className={clsx(styles["personal-upload-item-play-btn"])}>
                            <FontAwesomeIcon icon={faPlay} />
                        </button>
                    </div>
                </div>
            </div>
            <div className={clsx(styles["personal-playlist-wrapper"])}>
                <p className={clsx(styles["personal-playlist-title"])}>Danh sách phát đã tạo</p>
                <div className={clsx(styles["personal-playlist-list"])}>
                    <div className={clsx(styles["personal-playlist-item"])}>
                        <Image
                            src={"/background.jpg"}
                            width={100}
                            height={100}
                            alt=""
                            className={clsx(styles["personal-playlist-item-image"])}
                        />
                        <div className={clsx(styles["personal-playlist-item-content"])}>
                            <button className={clsx(styles["personal-playlist-item-play-btn"])}>
                                <FontAwesomeIcon icon={faPlay} />
                            </button>
                            <div className={clsx(styles["personal-playlist-item-info"])}>
                                <span className={clsx(styles["personal-playlist-item-owner"])}>playlist owner</span>
                                <span className={clsx(styles["personal-playlist-item-name"])}>playlist name</span>
                            </div>
                            {/* <div className={clsx(styles["personal-playlist-item-soundtrack"])}></div> */}
                            <div className={clsx(styles["playlist-item-wrapper"])}>
                                <div className={clsx(styles["playlist-item"])}>
                                    <Image
                                        src={"/background.jpg"}
                                        width={100}
                                        height={100}
                                        alt=""
                                        className={clsx(styles["playlist-item-image"])}
                                    />
                                    <button className={clsx(styles["playlist-item-play-btn"])}>
                                        <FontAwesomeIcon icon={faPlay} />
                                    </button>
                                    <span className={clsx(styles["playlist-item-name"])}>item name</span>
                                </div>
                                <div className={clsx(styles["playlist-item"])}>
                                    <Image
                                        src={"/background.jpg"}
                                        width={100}
                                        height={100}
                                        alt=""
                                        className={clsx(styles["playlist-item-image"])}
                                    />
                                    <button className={clsx(styles["playlist-item-play-btn"])}>
                                        <FontAwesomeIcon icon={faPlay} />
                                    </button>
                                    <span className={clsx(styles["playlist-item-name"])}>item name</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Artist;
