"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./Account.module.css";
import clsx from "clsx";
import { useEffect, useState, useMemo } from "react";
import { faPencil, faXmark } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useRouter } from "next/navigation";

// Helper lấy token an toàn
const getAccessToken = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
    return match ? match[2] : null;
};

function User() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    
    // State khởi tạo rỗng để tránh Hydration Error
    const [initialInfo, setInitialInfo] = useState({
        nickname: "", email: "", bio: "", thumbnailUrl: "", username: "", _id: ""
    });
    const [information, setInformation] = useState({
        nickname: "", email: "", bio: "", thumbnailUrl: "", file: null
    });

    // Load data từ LocalStorage khi component mount
    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem("userInfo") || "{}");
            const data = {
                _id: stored._id || "",
                username: stored.username || "",
                nickname: stored.nickname || "",
                email: stored.email || "",
                bio: stored.bio || "",
                thumbnailUrl: stored.thumbnailUrl || "",
            };
            setInitialInfo(data);
            setInformation({ ...data, file: null });
        } catch (e) {
            console.error("Error loading user info", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cleanup object URL khi unmount hoặc đổi ảnh
    useEffect(() => {
        return () => {
            if (information.file && information.thumbnailUrl) {
                URL.revokeObjectURL(information.thumbnailUrl);
            }
        };
    }, [information.file]); // Chỉ cleanup khi file thay đổi

    // So sánh xem dữ liệu có thay đổi không
    const hasChanged = useMemo(() => {
        if (loading) return false;
        return (
            information.nickname !== initialInfo.nickname ||
            information.bio !== initialInfo.bio ||
            information.file !== null // Có file mới nghĩa là đã đổi
        );
    }, [information, initialInfo, loading]);

    const handleInputChange = (key) => (e) => 
        setInformation((prev) => ({ ...prev, [key]: e.target.value }));

    const handleUploadThumbnail = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setInformation((prev) => ({
                ...prev,
                thumbnailUrl: URL.createObjectURL(file),
                file: file,
            }));
        }
    };

    const handleResetThumbnail = () => {
        setInformation(prev => ({
            ...prev,
            thumbnailUrl: initialInfo.thumbnailUrl,
            file: null
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hasChanged) return;

        const token = getAccessToken();
        const headers = { token: `Bearer ${token}` };
        const userId = initialInfo._id;

        try {
            let updatedData = {};

            // 1. Update Text Info
            if (information.nickname !== initialInfo.nickname || information.bio !== initialInfo.bio) {
                const res = await axios.put(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
                    { nickname: information.nickname, bio: information.bio },
                    { headers }
                );
                updatedData = { ...updatedData, ...res.data.data };
            }

            // 2. Update Thumbnail
            if (information.file) {
                const formData = new FormData();
                formData.append("thumbnail", information.file);
                const res = await axios.put(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/thumbnail`,
                    formData,
                    { headers }
                );
                updatedData = { ...updatedData, ...res.data.data };
            }

            // Sync lại LocalStorage & State
            const newLocalStorage = { ...JSON.parse(localStorage.getItem("userInfo") || "{}"), ...updatedData };
            localStorage.setItem("userInfo", JSON.stringify(newLocalStorage));
            
            // Cập nhật lại state gốc để nút Save disable lại
            setInitialInfo(prev => ({ ...prev, ...updatedData }));
            setInformation(prev => ({ ...prev, file: null, ...updatedData }));
            
            alert("Information updated successfully!");
            // router.push("/"); // Có thể giữ lại trang này thay vì đẩy về Home để user thấy thay đổi
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update information.");
        }
    };

    if (loading) return <div>Loading info...</div>;

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
                            value={initialInfo.username}
                            id="username"
                            readOnly
                        />
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="email">Email</label>
                        <input
                            className={clsx(styles["user-form-input"], styles["deactivate"])} // Email thường không cho sửa trực tiếp
                            id="email"
                            type="email"
                            value={information.email}
                            readOnly // Tạm thời để readOnly nếu API không hỗ trợ đổi email
                        />
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="nickname">Nickname</label>
                        <input
                            className={clsx(styles["user-form-input"])}
                            id="nickname"
                            value={information.nickname}
                            onChange={handleInputChange("nickname")}
                        />
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="bio">Bio</label>
                        <div className={clsx(styles["user-form-text"])}>
                            <textarea
                                value={information.bio}
                                onChange={handleInputChange("bio")}
                                id="bio"
                                className={clsx(styles["user-form-textarea"])}
                                placeholder="Tell the world a little bit about yourself."
                            ></textarea>
                        </div>
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <button
                            className={clsx(styles["user-form-submit"], { [styles["changed"]]: hasChanged })}
                            disabled={!hasChanged}
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
                        alt="Avatar"
                        className={clsx(styles["user-image"])}
                        style={{ objectFit: "cover" }}
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
                        {information.file && (
                            <button className={clsx(styles["user-image-options"])} onClick={(e) => { e.preventDefault(); handleResetThumbnail(); }}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default User;