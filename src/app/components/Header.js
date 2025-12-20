'use client'
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import style from "../homepage.module.scss";
import axios from "axios";
import MusicRecognitionModal from '../(with-bottombar)/recognition/Recognition';

export default function Header() {
	const [searchInput, setSearchInput] = useState("");
	const [showNotifications, setShowNotifications] = useState(false);
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const [loginStatus, setLoginStatus] = useState(false);
	const [userInfo, setUserInfo] = useState(null);
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [showRecognition, setShowRecognition] = useState(false);

	const searchInputRef = useRef(null);

	const router = useRouter();

	const clearInput = () => {
		setSearchInput("");
		searchInputRef.current.focus();
	};

	const toggleNotifications = () => {
		setShowNotifications(!showNotifications);
	};

	const toggleProfileMenu = () => {
		setShowProfileMenu(!showProfileMenu);
	};

	const handleLogout = async () => {
		try {
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signout`, {}, {
				headers: {
					token: `Bearer ${document.cookie.split('accessToken=')[1]}`,
				},
				withCredentials: true
			});
			document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
		} catch (error) {
			console.error("Error logging out:", error);
		}
	};

	// API functions for notifications
	const getAccessToken = () => {
		const token = document.cookie.split('accessToken=')[1];
		return token ? token.split(';')[0] : null;
	};

	const fetchNotifications = async () => {
		try {
			const token = getAccessToken();
			if (!token) return;

			const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
				headers: {
					token: `Bearer ${token}`,
				},
				params: {
					page: 1,
					limit: 10
				},
				withCredentials: true
			});

			if (response.data.data) {
				setNotifications(response.data.data.notifications);
				setUnreadCount(response.data.data.unreadCount);
			}
		} catch (error) {
			console.error("Error fetching notifications:", error);
		}
	};

	const markNotificationAsRead = async (notificationId) => {
		try {
			const token = getAccessToken();
			if (!token) return;

			await axios.patch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`,
				{}, 
				{
					headers: {
						token: `Bearer ${token}`,
					},
					withCredentials: true
				}
			);

			// Update local state
			setNotifications(prev => 
				prev.map(notif => 
					notif._id === notificationId 
						? { ...notif, isRead: true }
						: notif
				)
			);
			setUnreadCount(prev => Math.max(0, prev - 1));
		} catch (error) {
			console.error("Error marking notification as read:", error);
		}
	};

	const formatTimeAgo = (dateString) => {
		const now = new Date();
		const notificationDate = new Date(dateString);
		const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
		
		if (diffInMinutes < 1) return "Vừa xong";
		if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
		return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
	};
	
	// Xử lý sự kiện khi người dùng nhập vào ô tìm kiếm
	const handleSearchInput = () => {
		if (searchInput.trim() !== "") {
			router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
		}
	};

	useEffect(() => {
		const accessToken = document.cookie.split('accessToken=')[1];
		setLoginStatus(!!accessToken)

		if (!!accessToken) {
			setUserInfo(JSON.parse(localStorage.getItem("userInfo"))); // Lấy thông tin user từ localStorage
			fetchNotifications(); // Fetch notifications when user is logged in
		}
	}, []);

	// Fetch notifications periodically
	useEffect(() => {
		if (loginStatus) {
			const interval = setInterval(fetchNotifications, 30000); // Fetch every 30 seconds
			return () => clearInterval(interval);
		}
	}, [loginStatus]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (!event.target.closest(`.${style["notification-container"]}`)) {
				setShowNotifications(false);
			}
			if (!event.target.closest(`.${style["profile-container"]}`)) {
				setShowProfileMenu(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showNotifications, showProfileMenu]);

	return (
		<>
			<header>
				{/* Logo */}
				<Link href="/"><img id={style.logo} src="/logo&text.png" alt="Logo" /></Link>
				{/* Search bar */}
				<div className={style["search-container"]}>
					<div className={style["search-bar"]}>
						<span className={style["search-btn"]} onClick={handleSearchInput} title="Search">
							<img src="/search-button.png" alt="Search" />
						</span>
						<input
							type="text"
							placeholder="What do you wanna listen today?"
							id={style["search-input"]}
							spellCheck="false"
							autoCorrect="off"
							autoCapitalize="off"
							ref={searchInputRef}
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleSearchInput();
								}
							}}
						/>
						{searchInput && (
							<span className={style["clear-btn"]} onClick={clearInput} title="Clear">
								<img src="/cancel-icon.png" alt="Cancel" />
							</span>
						)}
						<button className={style["micro-button"]} title="Music recognition" onClick={() => setShowRecognition(true)}>
							<img src="/microphone.png" alt="Recognition" />
						</button>
						{showRecognition && <MusicRecognitionModal onClose={() => setShowRecognition(false)} />}
					</div>
				</div>
				{!loginStatus ? (
					<a href="/login" className={style["login-container"]}>
						<div>Login</div>
					</a>
				) : (
					<div className={style["header-actions"]}>
						{/* Notification button */}
						<div className={style["notification-container"]}>
							<button
								className={style["notification-button"]}
								onClick={toggleNotifications}
								title="Notifications"
							>
								<img src="/notification.png" alt="Notifications" />
								{unreadCount > 0 && (
									<span className={style["notification-badge"]}>{unreadCount}</span>
								)}
							</button>

							{/* Notification dropdown */}
							{showNotifications && (
								<div className={style["notification-dropdown"]}>
									<div className={style["notification-header"]}>
										<h3>Notifications</h3>
									</div>
									<div className={style["notification-list"]}>
										{notifications.length > 0 ? (
											notifications.map((notification) => (
												<div 
													key={notification._id} 
													className={`${style["notification-item"]} ${!notification.isRead ? style["unread"] : ""}`}
													onClick={() => {
														if (!notification.isRead) {
															markNotificationAsRead(notification._id);
														}
													}}
													style={{ cursor: notification.isRead ? 'default' : 'pointer' }}
												>
													<div className={style["notification-content"]}>
														<h4 className={style["notification-title"]}>{notification.title}</h4>
														<p className={style["notification-message"]}>{notification.message}</p>
														<span className={style["notification-time"]}>
															{formatTimeAgo(notification.createdAt)}
														</span>
													</div>
													{!notification.isRead && (
														<div className={style["notification-dot"]}></div>
													)}
												</div>
											))
										) : (
											<div className={style["no-notifications"]}>
												<p>Empty</p>
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Profile */}
						<div className={style["profile-container"]}>
							<button id={style["profile-button"]} title="Profile" onClick={toggleProfileMenu}>
								<Image src={userInfo?.thumbnailUrl || "/background.jpg"} alt="Profile" width={600} height={600} />
							</button>
							{showProfileMenu && (
								<div className={style["profile-dropdown"]}>
									<div className={style["profile-header"]}>
										<div className={style["profile-info"]}>
											<Image src={userInfo?.thumbnailUrl || "/background.jpg"} alt="Profile" width={600} height={600} className={style["profile-avatar"]} />
											<div className={style["profile-details"]}>
												<h4>{userInfo?.nickname || userInfo?.username || ""}</h4>
												<p>{userInfo?.email || ""}</p>
											</div>
										</div>
									</div>
									<div className={style["profile-menu"]}>
										<Link href="/account" className={style["profile-menu-item"]} >
											<img src="/account.png" alt="Account" />
											<span>Account</span>
										</Link>
										<Link href="/settings" className={style["profile-menu-item"]} >
											<img src="/setting.png" alt="Settings" />
											<span>Settings</span>
										</Link>
										<a onClick={handleLogout} href="/login" className={style["profile-menu-item"]} >
											<img src="/logout.png" alt="Logout" />
											<span>Log out</span>
										</a>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</header >

			{/* Overlay để đóng notification khi click bên ngoài */}
			{
				showNotifications && (
					<div
						className={style["notification-overlay"]}
						onClick={() => setShowNotifications(false)}
					/>
				)
			}
			{
				showProfileMenu && (
					<div
						className={style["profile-overlay"]}
						onClick={() => setShowProfileMenu(false)}
					/>
				)
			}
		</>
	);
}