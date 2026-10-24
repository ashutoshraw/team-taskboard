import { useEffect, useRef } from "react";
import { useTheme } from "../hooks/useTheme";
import Button from "../components/Button";
import styles from "./LandingPage.module.css";
import HeroBackground from "../components/HeroBackground";

const BOARD_DATA = [
  {
    title: "To Do",
    cards: [
      { id: 1, text: "Design system setup", tag: "Design", tagClass: styles.tagPurple, avatar: "AS", color: "#6c63ff" },
      { id: 2, text: "API rate limiting", tag: "Backend", tagClass: styles.tagOrange, avatar: "RK", color: "#f59e0b" },
    ],
  },
  {
    title: "In Progress",
    cards: [
      { id: 3, text: "Real-time sync", tag: "Feature", tagClass: styles.tagGreen, avatar: "AS", color: "#6c63ff" },
      { id: 4, text: "Auth middleware", tag: "Backend", tagClass: styles.tagOrange, avatar: "MJ", color: "#4caf82" },
    ],
  },
  {
    title: "Done",
    cards: [
      { id: 5, text: "Database schema", tag: "Backend", tagClass: styles.tagOrange, avatar: "RK", color: "#f59e0b" },
      { id: 6, text: "Project setup", tag: "DevOps", tagClass: styles.tagPurple, avatar: "AS", color: "#6c63ff" },
    ],
  },
];

const FEATURES = [
  { icon: "⚡", title: "Real-time sync", desc: "Changes appear instantly for every team member. No refresh needed, no conflicts." },
  { icon: "🎯", title: "Drag and drop", desc: "Move cards between columns with smooth animations. Your board stays organized." },
  { icon: "🔔", title: "Smart notifications", desc: "Get notified when a card is assigned to you or moved to your column." },
  { icon: "📋", title: "Activity log", desc: "Every card keeps a full history of who did what and when." },
  { icon: "👥", title: "Workspaces", desc: "Organize teams into workspaces with admin and member roles." },
  { icon: "🤖", title: "AI board generator", desc: "Type a project name and AI builds your whole board with columns and cards." },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  // Board cards staggered animation
  useEffect(() => {
    const allCards = cardRefs.current.filter(Boolean);
    allCards.forEach((card, i) => {
      if (!card) return;
      card.style.opacity = "0";
      card.style.transform = "translateY(16px)";
      setTimeout(() => {
        card.style.transition = "opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, 900 + i * 180);
    });
  }, []);

  // Scroll reveal for feature cards and CTA
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    featureRefs.current.filter(Boolean).forEach((el, i) => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = "translateY(32px)";
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.style.transition = "opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)";
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, i * 100);
            obs.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    if (ctaRef.current) {
      const el = ctaRef.current;
      el.style.opacity = "0";
      el.style.transform = "translateY(32px)";
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.style.transition = "opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)";
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            obs.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  let cardIndex = 0;

  return (
    <div>
      <nav className={styles.nav}>
        <div className={styles.navLogo}>TaskBoard</div>
        <div className={styles.navActions}>
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <Button variant="ghost" to="/login">Sign in</Button>
          <Button to="/register">Get started</Button>
        </div>
      </nav>

     <section className={styles.hero} style={{ position: "relative", overflow: "hidden" }}>
  <HeroBackground />
  <div className={styles.heroInner}>
    <div className={styles.badge}>
      <span className={styles.badgeDot} />
      Real-time collaboration for teams
    </div>

    <h1 className={styles.heroTitle}>
      Your team's work,<br />
      <span className={styles.gradientText}>always in sync</span>
    </h1>

    <p className={styles.heroSubtitle}>
      A Kanban board where changes appear instantly for everyone.
      Move a card, and your whole team sees it in under a second.
    </p>

    <div className={styles.heroActions}>
      <Button to="/register" size="lg">Start for free</Button>
      <Button variant="ghost" to="/login" size="lg">Sign in</Button>
    </div>

    <div className={styles.boardPreview}>
      <div className={styles.boardPreviewHeader}>
        <div className={styles.dot} style={{ background: "#ff5c5c" }} />
        <div className={styles.dot} style={{ background: "#f59e0b" }} />
        <div className={styles.dot} style={{ background: "#4caf82" }} />
        <span className={styles.boardName}>Sprint 3 — Team Board</span>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          3 members online
        </div>
      </div>

      <div className={styles.columns}>
        {BOARD_DATA.map((col) => (
          <div key={col.title} className={styles.column}>
            <div className={styles.columnTitle}>{col.title}</div>
            {col.cards.map((card) => {
              const idx = cardIndex++;
              return (
                <div
                  key={card.id}
                  className={styles.card}
                  ref={(el) => { cardRefs.current[idx] = el; }}
                >
                  <div className={`${styles.cardTag} ${card.tagClass}`}>{card.tag}</div>
                  <div className={styles.cardText}>{card.text}</div>
                  <div className={styles.cardFooter}>
                    <div className={styles.avatar} style={{ background: card.color }}>
                      {card.avatar}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>Built for teams</div>
          <h2 className={styles.sectionTitle}>Everything your team needs</h2>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={styles.featureCard}
              ref={(el) => { featureRefs.current[i] = el; }}
            >
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaInner} ref={ctaRef}>
          <h2>Ready to build together?</h2>
          <p>Set up your workspace in under a minute. No credit card needed.</p>
          <Button to="/register" size="lg">Get started for free</Button>
        </div>
      </section>
    </div>
  );
}