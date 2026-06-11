import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      // Replace with your actual API call:
      // await apiCall("/auth/admin/login/send-otp", "POST", { email, password });
      await new Promise((r) => setTimeout(r, 1300));
      toast.success("Code sent to " + email.split("@")[0] + "@...");
      setOtpSent(true);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Enter all 6 digits");
      return;
    }
    try {
      setLoading(true);
      // Replace with your actual API call:
      // await apiCall("/auth/admin/login", "POST", { email, password, otp: code });
      await new Promise((r) => setTimeout(r, 1400));
      localStorage.setItem("token", "sample-token-12345");
      localStorage.setItem("adminEmail", email);
      localStorage.setItem("adminName", email.split("@")[0]);
      setSuccess(true);
      setTimeout(() => navigate("/admin/dashboard"), 1800);
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const step = success ? 3 : otpSent ? 2 : 1;

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ── Left panel ── */}
        <div style={styles.left}>
          <div style={styles.orb1} />
          <div style={styles.orb2} />
          <div style={styles.orb3} />

          {/* Brand */}
          <div style={styles.brand}>
            <div style={styles.logoBadge}>
              <div style={styles.logoHex}>FF</div>
              <span style={styles.logoText}>FinFilerAdmin</span>
            </div>
            <h1 style={styles.brandH1}>Tax management,<br />reimagined.</h1>
            <p style={styles.brandP}>
              A secure control center for compliance, analytics, and financial oversight.
            </p>
          </div>

          {/* Stats */}
          <div style={styles.statsGrid}>
            {[
              { icon: "$", val: "$42.8K", lbl: "Tax collected" },
              { icon: "👥", val: "2,847",  lbl: "Active users" },
              { icon: "📈", val: "98.4%",  lbl: "Compliance rate" },
              { icon: "📄", val: "12.3K",  lbl: "Filings processed" },
            ].map((s) => (
              <div key={s.lbl} style={styles.statCard}>
                <div style={styles.statIcon}>{s.icon}</div>
                <div style={styles.statVal}>{s.val}</div>
                <div style={styles.statLbl}>{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={styles.features}>
            {[
              { color: "#7c3aed", text: "Government-grade security & encryption" },
              { color: "#06b6d4", text: "Real-time tax analytics dashboard" },
              { color: "#ec4899", text: "Automated compliance reporting" },
            ].map((f) => (
              <div key={f.text} style={styles.featRow}>
                <div style={{ ...styles.featDot, background: f.color }} />
                <span style={styles.featText}>{f.text}</span>
              </div>
            ))}
            <div style={styles.trustRow}>
              <div style={styles.avatarStack}>
                {[
                  { bg: "#ddd6fe", color: "#5b21b6", initials: "AK" },
                  { bg: "#fce7f3", color: "#9d174d", initials: "RS" },
                  { bg: "#cffafe", color: "#0e7490", initials: "MT" },
                ].map((a, i) => (
                  <div
                    key={a.initials}
                    style={{ ...styles.avatar, background: a.bg, color: a.color, marginLeft: i === 0 ? 0 : -6 }}
                  >
                    {a.initials}
                  </div>
                ))}
              </div>
              <span style={styles.trustText}>Trusted by 500+ tax professionals</span>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={styles.right}>
          {/* Header */}
          <div style={styles.formHeader}>
            <div style={styles.iconRing}>🛡️</div>
            <h2 style={styles.formTitle}>
              {success ? "Access granted" : otpSent ? "Two-factor auth" : "Admin sign in"}
            </h2>
            <p style={styles.formSub}>
              {success
                ? `Welcome back, ${email.split("@")[0]}`
                : otpSent
                ? "Enter the code from your email"
                : "Secure access to your tax dashboard"}
            </p>
          </div>

          {/* Step pills */}
          <div style={styles.pillRow}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  ...styles.pill,
                  ...(n <= step ? styles.pillActive : {}),
                }}
              />
            ))}
          </div>

          {/* Step 1 — credentials */}
          {step === 1 && (
            <form onSubmit={sendOtp} style={styles.form}>
              <Field icon="✉️" label="Admin email address">
                <input
                  type="email"
                  placeholder="Admin email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </Field>
              <Field icon="🔒" label="Password">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                />
              </Field>
              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? <Spinner /> : <>Continue →</>}
              </button>
              <div style={styles.helperRow}>
                <button
                  type="button"
                  style={styles.helperLink}
                  onClick={() => toast.info("Contact your system administrator")}
                >
                  Forgot password?
                </button>
              </div>
              <Divider />
              <p style={styles.secureNote}>🔒 SSL secured · 👁 Access logged</p>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === 2 && (
            <form onSubmit={verifyLogin} style={styles.form}>
              <div style={styles.emailChipWrap}>
                <div style={styles.emailChip}>✉️ {email}</div>
                <p style={styles.otpHint}>Enter the 6-digit code we sent you</p>
              </div>
              <div style={styles.otpRow}>
                {otp.map((val, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                    style={styles.otpDigit}
                  />
                ))}
              </div>
              <button type="submit" disabled={loading} style={{ ...styles.submitBtn, marginTop: 12 }}>
                {loading ? <Spinner /> : "Verify & access dashboard"}
              </button>
              <div style={styles.backRow}>
                <button
                  type="button"
                  style={styles.ghostBtn}
                  onClick={() => {
                    setOtp(["", "", "", "", "", ""]);
                    toast.success("New code sent");
                  }}
                >
                  ↺ Resend code
                </button>
                <button
                  type="button"
                  style={styles.ghostBtn}
                  onClick={() => { setOtpSent(false); setOtp(["", "", "", "", "", ""]); }}
                >
                  ← Back
                </button>
              </div>
            </form>
          )}

          {/* Step 3 — success */}
          {step === 3 && (
            <div style={styles.successPanel}>
              <div style={styles.checkCircle}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="17" stroke="#d1c9f0" strokeWidth="1" />
                  <path
                    d="M11 18l5 5 9-10"
                    stroke="#7c3aed"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 style={styles.successTitle}>Verified!</h3>
              <p style={styles.successSub}>Redirecting to the dashboard...</p>
              <div style={styles.loadingRow}>
                <div style={styles.spinnerPurple} /> Loading workspace
              </div>
            </div>
          )}

          <div style={styles.securityNote}>
            🛡️ Secure admin area · All access is monitored
          </div>
        </div>
      </div>

      <p style={styles.footer}>FinFilerAdmin Portal v2.0 · Secure SSL Encrypted Connection</p>
    </div>
  );
};

/* ── Small helpers ── */
const Field = ({ icon, label, children }) => (
  <div style={{ position: "relative", marginBottom: 13 }}>
    <span style={fieldIconStyle}>{icon}</span>
    {children}
  </div>
);

const Divider = () => (
  <div style={dividerStyle}>
    <div style={dividerLine} />
    <span style={dividerText}>or continue securely</span>
    <div style={dividerLine} />
  </div>
);

const Spinner = () => <div style={spinnerStyle} />;

/* ── Styles ── */
const fieldIconStyle = {
  position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
  fontSize: 15, pointerEvents: "none",
};
const dividerStyle = { display: "flex", alignItems: "center", gap: 10, margin: "15px 0" };
const dividerLine  = { flex: 1, height: "0.5px", background: "#e5e7eb" };
const dividerText  = { fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" };
const spinnerStyle = {
  width: 16, height: 16,
  border: "2px solid rgba(255,255,255,0.35)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
};

const orbBase = {
  position: "absolute", borderRadius: "50%", opacity: 0.38, pointerEvents: "none",
};

const styles = {
  page: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#f5f3ff", padding: "24px 16px",
  },
  card: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    maxWidth: 900, width: "100%",
    borderRadius: 20, overflow: "hidden",
    border: "0.5px solid #d1c9f0",
  },

  /* Left */
  left: {
    position: "relative", overflow: "hidden",
    background: "#f3f0fe",
    display: "flex", flexDirection: "column", justifyContent: "space-between",
    padding: "40px 36px", minHeight: 590,
  },
  orb1: { ...orbBase, width: 220, height: 220, background: "#a78bfa", top: -60, left: -60 },
  orb2: { ...orbBase, width: 180, height: 180, background: "#67e8f9", bottom: 40, right: -50 },
  orb3: { ...orbBase, width: 130, height: 130, background: "#f9a8d4", bottom: 180, left: 60 },
  brand: { position: "relative", zIndex: 2 },
  logoBadge: {
    display: "inline-flex", alignItems: "center", gap: 10,
    background: "#fff", border: "0.5px solid #d1c9f0",
    borderRadius: 14, padding: "8px 14px", marginBottom: 22,
  },
  logoHex: {
    width: 32, height: 32, background: "#7c3aed", borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 500, fontSize: 13, color: "#fff",
  },
  logoText:  { fontSize: 15, fontWeight: 500, color: "#26215c" },
  brandH1:   { fontSize: 26, fontWeight: 500, color: "#26215c", lineHeight: 1.35, marginBottom: 10 },
  brandP:    { fontSize: 13, color: "#534ab7", lineHeight: 1.6, maxWidth: 240 },
  statsGrid: { position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  statCard:  { background: "#fff", border: "0.5px solid #d1c9f0", borderRadius: 14, padding: "14px 16px" },
  statIcon:  { fontSize: 16, marginBottom: 8 },
  statVal:   { fontSize: 21, fontWeight: 500, color: "#26215c", marginBottom: 2 },
  statLbl:   { fontSize: 11, color: "#534ab7" },
  features:  { position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 10 },
  featRow:   { display: "flex", alignItems: "center", gap: 10 },
  featDot:   { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  featText:  { fontSize: 12, color: "#534ab7" },
  trustRow:  { display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "0.5px solid #e5e7eb" },
  avatarStack: { display: "flex" },
  avatar: {
    width: 22, height: 22, borderRadius: "50%",
    border: "1.5px solid #f3f0fe",
    fontSize: 9, fontWeight: 500,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  trustText: { fontSize: 11, color: "#534ab7" },

  /* Right */
  right: {
    background: "#fff", display: "flex", flexDirection: "column",
    padding: "44px 40px", minHeight: 590,
  },
  formHeader: { textAlign: "center", marginBottom: 24 },
  iconRing: {
    width: 54, height: 54, borderRadius: 16,
    background: "#f3f0fe", border: "0.5px solid #d1c9f0",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 14px", fontSize: 22,
  },
  formTitle: { fontSize: 20, fontWeight: 500, color: "#1a1523", marginBottom: 4 },
  formSub:   { fontSize: 12, color: "#6b7280", margin: 0 },
  pillRow:   { display: "flex", gap: 6, justifyContent: "center", marginBottom: 22 },
  pill:      { height: 4, width: 28, borderRadius: 99, background: "#e5e7eb", transition: "all .35s" },
  pillActive:{ background: "#7c3aed", width: 44 },
  form:      { display: "flex", flexDirection: "column", flex: 1 },
  input: {
    width: "100%", padding: "11px 13px 11px 38px",
    border: "0.5px solid #e5e7eb", borderRadius: 12,
    fontSize: 14, color: "#1a1523", background: "#f9fafb",
    outline: "none", fontFamily: "inherit",
  },
  submitBtn: {
    width: "100%", padding: 12, borderRadius: 12,
    border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 500, fontFamily: "inherit",
    background: "#7c3aed", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "all .2s",
  },
  helperRow:  { display: "flex", justifyContent: "flex-end", marginTop: 8 },
  helperLink: {
    fontSize: 11, color: "#7c3aed", cursor: "pointer",
    background: "none", border: "none", fontFamily: "inherit",
  },
  secureNote: { fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 4 },
  emailChipWrap: { textAlign: "center", marginBottom: 18 },
  emailChip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#f3f0fe", border: "0.5px solid #d1c9f0",
    borderRadius: 99, padding: "4px 10px",
    fontSize: 11, color: "#534ab7",
  },
  otpHint: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  otpRow:  { display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 },
  otpDigit: {
    width: 44, height: 52, border: "0.5px solid #e5e7eb",
    borderRadius: 12, fontSize: 20, fontWeight: 500,
    textAlign: "center", background: "#f9fafb", color: "#1a1523",
    fontFamily: "monospace", outline: "none",
  },
  backRow:   { display: "flex", gap: 8, marginTop: 10 },
  ghostBtn:  {
    flex: 1, padding: 10, border: "0.5px solid #e5e7eb",
    borderRadius: 10, background: "none", cursor: "pointer",
    fontSize: 12, color: "#6b7280", fontFamily: "inherit",
  },
  successPanel: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    flex: 1, gap: 14, padding: "20px 0",
  },
  checkCircle: {
    width: 72, height: 72, borderRadius: "50%",
    background: "#f3f0fe", border: "0.5px solid #d1c9f0",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontSize: 18, fontWeight: 500, color: "#1a1523" },
  successSub:   { fontSize: 12, color: "#6b7280", textAlign: "center", maxWidth: 190, lineHeight: 1.6 },
  loadingRow:   { display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#9ca3af" },
  spinnerPurple: {
    width: 16, height: 16,
    border: "2px solid #e5e7eb", borderTopColor: "#7c3aed",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
  securityNote: {
    marginTop: "auto", paddingTop: 18,
    borderTop: "0.5px solid #f3f4f6",
    textAlign: "center", fontSize: 11, color: "#9ca3af",
  },
  footer: { marginTop: 20, fontSize: 11, color: "#9ca3af", textAlign: "center" },
};

export default AdminLogin;