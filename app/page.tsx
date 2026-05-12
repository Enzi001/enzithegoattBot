import type { CSSProperties } from "react";

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  card: {
    maxWidth: "760px",
    width: "100%",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "2rem 2.5rem",
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "2rem",
    paddingBottom: "1.5rem",
    borderBottom: "1px solid #e4e6eb",
  },
  icon: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #0866ff, #00c6ff)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.6rem",
    flexShrink: 0,
  },
  titleGroup: { flex: 1 },
  title: { margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#1c1e21" },
  subtitle: { margin: 0, fontSize: "0.875rem", color: "#65676b", marginTop: "2px" },
  statusBadge: {
    background: "#e6f4ea",
    color: "#137333",
    padding: "0.3rem 0.9rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  section: { marginBottom: "1.75rem" },
  sectionTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#1c1e21",
    marginBottom: "0.6rem",
    marginTop: 0,
  },
  codeBlock: {
    display: "block",
    background: "#f0f2f5",
    border: "1px solid #e4e6eb",
    padding: "0.85rem 1.1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    wordBreak: "break-all",
    fontFamily: "monospace",
    color: "#1c1e21",
    margin: 0,
  },
  ol: {
    paddingLeft: "1.5rem",
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    fontSize: "0.9rem",
  },
  envGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.5rem",
  },
  envItem: {
    background: "#f7f8fa",
    border: "1px solid #e4e6eb",
    borderRadius: "8px",
    padding: "0.65rem 0.9rem",
    fontSize: "0.85rem",
  },
  envKey: { fontWeight: 700, display: "block", marginBottom: "2px" },
  envDesc: { color: "#65676b", fontSize: "0.8rem" },
  courseGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.5rem",
  },
  courseItem: {
    background: "#f7f8fa",
    border: "1px solid #e4e6eb",
    borderRadius: "8px",
    padding: "0.65rem 0.9rem",
    fontSize: "0.85rem",
  },
  courseName: { fontWeight: 700, display: "block", color: "#0866ff" },
  courseMeta: { color: "#65676b", fontSize: "0.8rem" },
  footer: {
    marginTop: "2rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid #e4e6eb",
    fontSize: "0.8rem",
    color: "#65676b",
    textAlign: "center",
  },
};

export default function Home() {
  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🤖</div>
          <div style={styles.titleGroup}>
            <h1 style={styles.title}>Indra Cyber Institute</h1>
            <p style={styles.subtitle}>Facebook Messenger AI Sales Chatbot</p>
          </div>
          <span style={styles.statusBadge}>● Bot is running</span>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Webhook URL</h2>
          <pre style={styles.codeBlock}>
            https://your-domain.vercel.app/api/webhook
          </pre>
          <p style={{ fontSize: "0.8rem", color: "#65676b", marginTop: "0.5rem", marginBottom: 0 }}>
            Replace <code>your-domain</code> with your actual Vercel deployment URL.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Required Environment Variables</h2>
          <div style={styles.envGrid}>
            <div style={styles.envItem}>
              <span style={styles.envKey}>GEMINI_API_KEY</span>
              <span style={styles.envDesc}>
                From{" "}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  Google AI Studio
                </a>
              </span>
            </div>
            <div style={styles.envItem}>
              <span style={styles.envKey}>PAGE_ACCESS_TOKEN</span>
              <span style={styles.envDesc}>Facebook App → Messenger → Token</span>
            </div>
            <div style={styles.envItem}>
              <span style={styles.envKey}>VERIFY_TOKEN</span>
              <span style={styles.envDesc}>Any string you invent (e.g. my-secret-123)</span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Setup Steps</h2>
          <ol style={styles.ol}>
            <li>
              Get a <strong>Gemini API key</strong> at{" "}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                aistudio.google.com
              </a>{" "}
              (free tier available).
            </li>
            <li>
              Create a <strong>Facebook App</strong> at{" "}
              <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">
                developers.facebook.com
              </a>
              . Add the Messenger product.
            </li>
            <li>
              Create or connect a <strong>Facebook Page</strong>, then generate a{" "}
              <strong>Page Access Token</strong> under Messenger → Settings.
            </li>
            <li>
              Deploy this project to{" "}
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
                Vercel
              </a>{" "}
              and add all three env vars in Project → Settings → Environment Variables.
            </li>
            <li>
              In your Facebook App, go to <strong>Messenger → Webhooks</strong> → Add Callback URL.
              Paste the webhook URL above, enter your <code>VERIFY_TOKEN</code>, and subscribe to the{" "}
              <code>messages</code> field.
            </li>
            <li>
              Send a message to your Facebook Page. The bot will reply in Mongolian and guide
              users through the sales funnel automatically.
            </li>
          </ol>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Available Programs</h2>
          <div style={styles.courseGrid}>
            {[
              { name: "Fullstack Хөгжүүлэлт", meta: "6 сар · 1,200,000₮" },
              { name: "UI/UX Дизайн", meta: "3 сар · 800,000₮" },
              { name: "Дижитал Маркетинг", meta: "3 сар · 750,000₮" },
              { name: "Кибер Аюулгүй Байдал", meta: "4 сар · 1,100,000₮" },
            ].map((course) => (
              <div key={course.name} style={styles.courseItem}>
                <span style={styles.courseName}>{course.name}</span>
                <span style={styles.courseMeta}>{course.meta}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.footer}>
          Indra Cyber Institute · Powered by Google Gemini 1.5 Flash + Facebook Messenger API
        </div>
      </div>
    </main>
  );
}
