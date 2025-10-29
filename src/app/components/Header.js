'use client'
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import style from "../homepage.module.css";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Header() {
	const [searchInput, setSearchInput] = useState("");
	const [showNotifications, setShowNotifications] = useState(false);
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const [loginStatus, setLoginStatus] = useState(false);
	const [userInfo, setUserInfo] = useState(null);
	const searchInputRef = useRef(null);
	const router = useRouter();

	const clearInput = () => {
		setSearchInput("");
		searchInputRef.current.focus();
	};

	const toggleNotifications = () => {
		setShowNotifications(!showNotifications);
		if (showProfileMenu) toggleProfileMenu();
	};

	const toggleProfileMenu = () => {
		setShowProfileMenu(!showProfileMenu);
		if (showNotifications) toggleNotifications();
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

	// Mock data cho notifications
	const notifications = [
		{ id: 1, message: "New song added to your playlist", time: "2 minutes ago" },
		{ id: 2, message: "Your friend liked your song", time: "1 hour ago" },
		{ id: 3, message: "New album from your favorite artist", time: "3 hours ago" },
		// { id: 4, message: "Vinh cu qua luoi", time: "1 day ago" },
	];
	
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
		}
	}, []);

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
						<span className={style["micro-button"]} title="Music recognition">
							<img src="/microphone.png" alt="Recognition" />
						</span>
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
								{notifications.length > 0 && (
									<span className={style["notification-badge"]}>{notifications.length}</span>
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
												<div key={notification.id} className={style["notification-item"]}>
													<p className={style["notification-message"]}>{notification.message}</p>
													<span className={style["notification-time"]}>{notification.time}</span>
												</div>
											))
										) : (
											<div className={style["no-notifications"]}>
												<p>No new notifications</p>
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Profile */}
						<div className={style["profile-container"]}>
							<button id={style["profile-button"]} title="Profile" onClick={toggleProfileMenu}>
								<img src="/hcmut.png" alt="Profile" />
							</button>
							{showProfileMenu && (
								<div className={style["profile-dropdown"]}>
									<div className={style["profile-header"]}>
										<div className={style["profile-info"]}>
											<img src="/hcmut.png" alt="Profile" className={style["profile-avatar"]} />
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