import Link from "next/link";
import layout from "~/app/styles/homepage.module.scss";
import styles from "./about.module.css";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function AboutPage() {
	return (
		<div className={layout.background}>
			<Header />
			<Sidebar />

			<div className={styles.container}>
				{/* Hero */}
				<section className={styles.hero}>
					<h1 className={styles.title}>About This Music Platform</h1>
					<p className={styles.subtitle}>
						Discover, listen, and share the music you love. Follow artists, like
						tracks, and enjoy a seamless listening experience with a persistent
						bottom bar player.
					</p>
					<div className={styles.actions}>
						<Link href="/" className={styles.primaryBtn}>Start Listening</Link>
						<Link href="/upload" className={styles.secondaryBtn}>Upload a Track</Link>
					</div>
				</section>

				{/* Features */}
				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>What You Can Do</h2>
					<div className={styles.featuresGrid}>
						<article className={styles.card}>
							<div className={styles.icon}>🎧</div>
							<h3 className={styles.cardTitle}>Stream Instantly</h3>
							<p className={styles.cardDesc}>
								Play any track with a clean, always-on bottom player. Pause,
								resume, and keep the music going as you browse.
							</p>
						</article>

						<article className={styles.card}>
							<div className={styles.icon}>🔎</div>
							<h3 className={styles.cardTitle}>Discover New Music</h3>
							<p className={styles.cardDesc}>
								Explore trending, most-played, and recently added songs tailored
								for you.
							</p>
						</article>

						<article className={styles.card}>
							<div className={styles.icon}>👍</div>
							<h3 className={styles.cardTitle}>Like & Comment</h3>
							<p className={styles.cardDesc}>
								Show appreciation with likes and join the conversation in the
								comments.
							</p>
						</article>

						<article className={styles.card}>
							<div className={styles.icon}>👩‍🎤</div>
							<h3 className={styles.cardTitle}>Follow Artists</h3>
							<p className={styles.cardDesc}>
								Visit artist profiles to explore their tracks and learn more
								about them.
							</p>
						</article>
					</div>
				</section>

				{/* How it works */}
				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>How It Works</h2>
					<ol className={styles.steps}>
						<li>
							<span className={styles.stepBadge}>1</span>
							Browse or search for tracks you love.
						</li>
						<li>
							<span className={styles.stepBadge}>2</span>
							Click a track to start playing instantly.
						</li>
						<li>
							<span className={styles.stepBadge}>3</span>
							Like, comment, and follow artists to personalize your feed.
						</li>
					</ol>
				</section>

				{/* Call to action */}
				<section className={styles.cta}>
					<h2 className={styles.ctaTitle}>Ready to dive in?</h2>
					<p className={styles.ctaSubtitle}>Start listening now or share your first track.</p>
					<div className={styles.actions}>
						<Link href="/" className={styles.primaryBtn}>Explore Music</Link>
						<Link href="/upload" className={styles.secondaryBtn}>Share a Track</Link>
					</div>
				</section>
			</div>
		</div>
	);
}

