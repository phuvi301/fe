"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./Account.module.css";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { faPencil, faXmark } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useRouter } from "next/navigation";

function User() {
    const initState = useMemo(
        () => ({
            nickname: JSON.parse(localStorage.getItem("userInfo")).nickname || "",
            email: JSON.parse(localStorage.getItem("userInfo")).email || "",
            bio: JSON.parse(localStorage.getItem("userInfo")).bio || "",
            thumbnailUrl: JSON.parse(localStorage.getItem("userInfo")).thumbnailUrl || "",
            file: null,
        }),
        []
    );
    const [information, setInformation] = useState(initState);
    const router = useRouter();

    function compare(obj1, obj2) {
        const currentKeys = Object.keys(obj1);
        return (
            currentKeys.length === Object.keys(obj2).length &&
            currentKeys.every((key) => obj2.hasOwnProperty(key) && obj1[key] === obj2[key])
        );
    }

    const handleInputChange = (key) => (e) => setInformation((prev) => ({ ...prev, [key]: e.target.value }));

    const handleUploadThumbnail = (e) =>
        setInformation((prev) => ({
            ...prev,
            thumbnailUrl: e.target.files.length ? URL.createObjectURL(e.target.files[0]) : "",
            file: e.target.files.length ? e.target.files[0] : null,
        }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (compare(information, initState)) return;

        const updateInfo = async () => {
            try {
                if (compare({nickname: information.nickname, bio: information.bio}, {nickname: initState.nickname, bio: initState.bio})) return null;
                const res = await axios.put(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${JSON.parse(localStorage.getItem("userInfo"))._id}`,
                    {
                        nickname: information.nickname,
                        bio: information.bio,
                    },
                    {
                        headers: {
                            token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                        },
                    }
                );
                return res.data.data;
            } catch (error) {
                console.log(error);
            }
        };

        const updateThumbnail = async () => {
            try {
                if (compare({thumbnailUrl: information.thumbnailUrl, file: information.file}, {thumbnailUrl: initState.thumbnailUrl, file: initState.file})) return null;
                const formData = new FormData();
                if (information.thumbnailUrl) formData.append("thumbnail", information.file);
                const res = await axios.put(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${
                        JSON.parse(localStorage.getItem("userInfo"))._id
                    }/thumbnail`,
                    formData,
                    {
                        headers: {
                            token: `Bearer ${document.cookie.split("accessToken=")[1]}`,
                        },
                    }
                );
                return res.data.data;
            } catch (error) {
                console.log(error);
            }
        };

        const oldInfo = JSON.parse(localStorage.getItem("userInfo"));

        const updatedInfo = await updateInfo();
        const updatedThumb = await updateThumbnail();

        const newInfo = {
            ...oldInfo,
            ...(updatedInfo || {}),
            ...(updatedThumb || {}),
        };

        localStorage.setItem("userInfo", JSON.stringify(newInfo));
        router.push("/");
    };

    useEffect(() => {
        return () => {
            if (information.thumbnailUrl) URL.revokeObjectURL(information.thumbnailUrl);
        };
    }, [information.thumbnailUrl]);

    return (
        <>
            <h2 className={clsx(styles["user-title"])}>Information</h2>
            <div className={clsx(styles["user-wrapper"])}>
                <form className={clsx(styles["user-form-wrapper"])} onSubmit={handleSubmit}>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="username">
                            Display name <span>*</span>
                        </label>
                        <input
                            className={clsx(styles["user-form-input"], styles["deactivate"])}
                            value={JSON.parse(localStorage.getItem("userInfo")).username}
                            id="username"
                            readOnly
                        />
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="email">
                            Email
                        </label>
                        <input
                            className={clsx(styles["user-form-input"])}
                            id="email"
                            type="email"
                            value={information.email}
                            onChange={handleInputChange("email")}
                        />
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="nickname">
                            Nickname
                        </label>
                        <input
                            className={clsx(styles["user-form-input"])}
                            id="nickname"
                            value={information.nickname}
                            onChange={handleInputChange("nickname")}
                        />
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="bio">
                            Bio
                        </label>
                        <div className={clsx(styles["user-form-text"])}>
                            <textarea
                                value={information.bio}
                                onChange={handleInputChange("bio")}
                                id="bio"
                                className={clsx(styles["user-form-textarea"])}
                                placeholder="Tell the world a little bit about yourself. The shorter the better."
                            ></textarea>
                        </div>
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <button
                            className={clsx(styles["user-form-submit"], {
                                [styles["changed"]]: !compare(information, initState),
                            })}
                        >
                            Save changes
                        </button>
                    </div>
                </form>
                <div className={clsx(styles["user-image-wrapper"])}>
                    <img
                        src={information.thumbnailUrl || "/avatar-default.svg"}
                        width={100}
                        height={100}
                        alt=""
                        className={clsx(styles["user-image"])}
                    />
                    <div className={clsx(styles["user-image-placeholder"])}>
                        <input
                            type="file"
                            className={clsx(styles["user-image-placeholder-input"])}
                            name="thumbnail"
                            onChange={handleUploadThumbnail}
                            accept="image/*"
                        />
                        <FontAwesomeIcon icon={faPencil} className={clsx(styles["user-image-placeholder-icon"])} />
                        <span className={clsx(styles["user-image-placeholder-text"])}>Choosing image</span>
                        <button className={clsx(styles["user-image-options"])}>
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default User;
