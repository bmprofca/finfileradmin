import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [mobile, setMobile] = useState("");
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

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setOtp(next);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!mobile) { toast.error("Please enter your mobile number"); return; }
    try {
      setLoading(true);
      await auth.sendOtp({ mobile });
      toast.success("OTP sent to " + mobile);
      setOtpSent(true);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      await auth.sendOtp({ mobile });
      setOtp(["", "", "", "", "", ""]);
      toast.success("New OTP sent to " + mobile);
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.error("Enter all 6 digits"); return; }
    try {
      setLoading(true);
      await auth.login({ mobile, otp: code });
      setSuccess(true);
      toast.success("Login successful!");
      setTimeout(() => navigate("/"), 1800);
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const step = success ? 3 : otpSent ? 2 : 1;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes float3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        
        .al-input:focus { border-color: #7c3aed !important; background: #fff !important; }
        .al-otp-digit:focus { border-color: #7c3aed !important; background: #fff !important; }
        .al-ghost-btn:hover { background: #f9fafb !important; }
        .al-submit-btn:hover { opacity: 0.92; }
        .al-submit-btn:active { transform: scale(0.99); }
        
        @media (max-width: 768px) {
          .al-otp-digit { width: 40px !important; height: 48px !important; font-size: 18px !important; }
          .al-left-panel { min-height: 350px !important; padding: 30px 24px !important; }
          .al-right-panel { min-height: 450px !important; padding: 30px 24px !important; }
        }
        
        @media (max-width: 640px) {
          .al-left-panel { display: none !important; }
          .al-right-panel { min-height: 100vh !important; padding: 32px 24px !important; flex: 1 1 100% !important; }
          .al-card { border-radius: 16px !important; max-width: 100% !important; }
          .al-otp-digit { width: 38px !important; height: 46px !important; font-size: 17px !important; }
          .al-form-title { font-size: 19px !important; }
        }
        
        @media (max-width: 400px) {
          .al-otp-digit { width: 32px !important; height: 40px !important; font-size: 15px !important; }
          .al-right-panel { padding: 24px 16px !important; }
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50/90 via-indigo-50/80 to-sky-50/90 px-4 py-6 font-sans">
        <div className="al-card flex w-full max-w-[1000px] rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10">
          
          {/* ── Left panel ── */}
          <div className="al-left-panel relative flex-1 overflow-hidden flex flex-col justify-center items-center p-12 min-h-[560px] bg-gradient-to-br from-purple-600 via-indigo-600 to-sky-500">
            {/* Decorative circles */}
            <div className="absolute w-[300px] h-[300px] -top-24 -left-24 rounded-full bg-white/10" />
            <div className="absolute w-[200px] h-[200px] -bottom-16 -right-16 rounded-full bg-white/10" />
            <div className="absolute w-[100px] h-[100px] bottom-32 left-8 rounded-full bg-white/5" />
            <div className="absolute w-[80px] h-[80px] top-32 right-8 rounded-full bg-white/5" />

            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xs">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white mb-4 shadow-lg">
                FF
              </div>
              <h1 className="al-brand-name text-2xl font-bold text-white tracking-tight mb-1.5">
                FinFiler<span className="font-light">Admin</span>
              </h1>
              <p className="al-brand-tagline text-sm text-white/80 mb-10">
                Tax management, reimagined.
              </p>

              {/* Illustration */}
              <div className="relative w-full flex flex-col items-center">
                {/* Main card */}
                <div className="w-full max-w-[240px] bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl p-4 animate-[float2_4s_ease-in-out_infinite]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center shrink-0 text-lg">
                      👤
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-2 rounded-full bg-white/25 w-[85%]" />
                      <div className="h-2 rounded-full bg-white/25 w-[55%]" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/35" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/35" />
                  </div>
                </div>

                {/* Mini cards */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-[240px] mt-3">
                  {[
                    { icon: "📊", label: "Analytics" },
                    { icon: "✅", label: "Compliance" },
                    { icon: "🛡️", label: "Security" },
                    { icon: "📈", label: "Growth" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/12 backdrop-blur-sm border border-white/20 rounded-xl p-3 flex flex-col gap-1.5">
                      <div className="w-7 h-7 rounded-lg bg-white/25 flex items-center justify-center text-sm">
                        {item.icon}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="h-1.5 rounded-full bg-white/20 w-full" />
                        <div className={`h-1.5 rounded-full bg-white/20 ${i % 2 === 0 ? 'w-[60%]' : 'w-[40%]'}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Floating badges */}
                <div className="absolute -top-2 -right-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3.5 py-2 flex items-center gap-2 animate-[float1_3.5s_ease-in-out_infinite] shadow-lg">
                  <span className="text-sm">✓</span>
                  <span className="text-xs text-white font-medium">Compliant</span>
                </div>
                <div className="absolute -bottom-2 -left-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3.5 py-2 flex items-center gap-2 animate-[float3_4s_ease-in-out_infinite_0.5s] shadow-lg">
                  <span className="text-sm">🔒</span>
                  <span className="text-xs text-white font-medium">SSL secured</span>
                </div>
                <div className="absolute top-20 -right-5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3.5 py-2 flex items-center gap-2 animate-[float2_3s_ease-in-out_infinite_1s] shadow-lg">
                  <span className="text-sm">🔔</span>
                  <span className="text-xs text-white font-medium">Live alerts</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="al-right-panel flex-1 bg-white flex flex-col p-12 min-h-[560px]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-purple-500/20">
                🛡️
              </div>
              <h2 className="al-form-title text-2xl font-bold text-gray-900 mb-1.5">
                {success ? "Access granted" : otpSent ? "Two-factor auth" : "Admin sign in"}
              </h2>
              <p className="text-sm text-gray-500">
                {success
                  ? `Welcome back, ${mobile}`
                  : otpSent
                    ? "Enter the code sent to your phone"
                    : "Secure access to your tax dashboard"}
              </p>
            </div>

            {/* Progress pills */}
            <div className="flex gap-2 justify-center mb-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    n <= step ? "bg-gradient-to-r from-purple-600 to-indigo-600 w-12" : "bg-gray-200 w-8"
                  }`}
                />
              ))}
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={sendOtp} className="flex flex-col flex-1">
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">📱</span>
                  <input
                    className="al-input w-full py-3.5 px-4 pl-12 border-2 border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50/80 outline-none transition-all duration-200 focus:bg-white focus:border-purple-500"
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^\d+\-\s()]/g, ""))}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="al-submit-btn w-full py-3.5 rounded-xl border-none cursor-pointer text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Spinner /> : <>📤 Request OTP</>}
                </button>
                
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 whitespace-nowrap">or continue securely</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-1">
                  <span>🔒 SSL secured</span>
                  <span>·</span>
                  <span>👁 Access logged</span>
                </div>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={verifyLogin} className="flex flex-col flex-1">
                <div className="text-center mb-5">
                  <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-1.5 text-sm text-indigo-700 font-medium">
                    📱 {mobile}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Enter the 6-digit code we sent you</p>
                </div>
                
                <div className="flex gap-3 justify-center mb-4">
                  {otp.map((val, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      className="al-otp-digit w-12 h-14 border-2 border-gray-200 rounded-xl text-2xl font-bold text-center bg-gray-50/80 text-gray-900 font-mono outline-none transition-all duration-200 focus:bg-white focus:border-purple-500"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="al-submit-btn w-full py-3.5 rounded-xl border-none cursor-pointer text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Spinner /> : "✓ Verify & Login"}
                </button>
                
                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    className="al-ghost-btn flex-1 py-2.5 border-2 border-gray-200 rounded-xl bg-transparent cursor-pointer text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300"
                    disabled={loading}
                    onClick={resendOtp}
                  >
                    ↺ Resend
                  </button>
                  <button
                    type="button"
                    className="al-ghost-btn flex-1 py-2.5 border-2 border-gray-200 rounded-xl bg-transparent cursor-pointer text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300"
                    onClick={() => { setOtpSent(false); setOtp(["", "", "", "", "", ""]); }}
                  >
                    ← Back
                  </button>
                </div>
              </form>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center flex-1 gap-4 animate-[fadeUp_0.5s_ease]">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
                  <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="17" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                    <path d="M11 18l5 5 9-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Verified!</h3>
                <p className="text-sm text-gray-500 text-center max-w-xs">
                  Redirecting to the dashboard...
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-purple-600 rounded-full animate-[spin_0.7s_linear_infinite]" />
                  Loading workspace
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-5 border-t border-gray-100">
              <p className="text-center text-xs text-gray-400">
                🛡️ Secure admin area · All access is monitored
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs text-gray-400 text-center">
          FinFilerAdmin Portal v2.0 · Secure SSL Encrypted Connection
        </p>
      </div>
    </>
  );
};

/* ── Helper ── */
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-[spin_0.7s_linear_infinite]" />
);

export default AdminLogin;