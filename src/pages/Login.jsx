import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
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
    if (!mobile || mobile.length !== 10) { toast.error("Please enter a valid 10-digit mobile number"); return; }
    try {
      setLoading(true);
      await auth.sendOtp({ mobile });
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
      setTimeout(() => navigate("/"), 1800);
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const step = success ? 3 : otpSent ? 2 : 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50/90 via-indigo-50/80 to-sky-50/90 dark:from-gray-900 dark:via-indigo-950/20 dark:to-sky-950/20 px-4 py-6 font-sans">
      <div className="flex flex-col md:flex-row w-full max-w-[900px] rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 dark:shadow-black/40">

        {/* ── Left panel — hidden on mobile ── */}
        <div className="hidden md:flex relative flex-1 flex-col justify-center items-center p-12 min-h-[560px] bg-gradient-to-br from-purple-600 via-indigo-600 to-sky-500 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute w-[300px] h-[300px] -top-24 -left-24 rounded-full bg-white/10" />
          <div className="absolute w-[200px] h-[200px] -bottom-16 -right-16 rounded-full bg-white/10" />
          <div className="absolute w-[100px] h-[100px] bottom-32 left-8 rounded-full bg-white/5" />
          <div className="absolute w-[80px] h-[80px] top-32 right-8 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xs">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white mb-4 shadow-lg">
              FF
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5">
              FinFiler<span className="font-light">Admin</span>
            </h1>
            <p className="text-sm text-white/80 mb-10">Tax management, reimagined.</p>

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
                  <div key={i} className="bg-white/12 backdrop-blur-sm border border-white/20 rounded-lg p-3 flex flex-col gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-white/25 flex items-center justify-center text-sm">
                      {item.icon}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="h-1.5 rounded-full bg-white/20 w-full" />
                      <div className={`h-1.5 rounded-full bg-white/20 ${i % 2 === 0 ? "w-[60%]" : "w-[40%]"}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating badges */}
              <div className="absolute -top-2 -right-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3.5 py-2 flex items-center gap-2 animate-[float1_3.5s_ease-in-out_infinite] shadow-lg">
                <span className="text-sm">✓</span>
                <span className="text-xs text-white font-medium">Compliant</span>
              </div>
              <div className="absolute -bottom-2 -left-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3.5 py-2 flex items-center gap-2 animate-[float3_4s_ease-in-out_infinite_0.5s] shadow-lg">
                <span className="text-sm">🔒</span>
                <span className="text-xs text-white font-medium">SSL secured</span>
              </div>
              <div className="absolute top-20 -right-5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3.5 py-2 flex items-center gap-2 animate-[float2_3s_ease-in-out_infinite_1s] shadow-lg">
                <span className="text-sm">🔔</span>
                <span className="text-xs text-white font-medium">Live alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 text-center">
          <div className="w-full max-w-sm flex flex-col flex-1">
            <div className="mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-3 text-xl sm:text-2xl shadow-lg shadow-purple-500/20">
                🛡️
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {success ? "Access granted" : otpSent ? "Two-factor auth" : "Admin sign in"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {success
                  ? `Welcome back, ${mobile}`
                  : otpSent
                    ? "Enter the code sent to your phone"
                    : "Secure access to your tax dashboard"}
              </p>
            </div>

            {/* Progress pills */}
            <div className="flex gap-2 justify-center mb-12">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 rounded-full transition-all duration-500 ${n <= step
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 w-10"
                    : "bg-gray-200 dark:bg-gray-700 w-7"
                    }`}
                />
              ))}
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={sendOtp} className="flex flex-col flex-1 mt-4 mb-12">
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">📱</span>
                  <input
                    className="w-full py-3 px-4 pl-11 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-gray-50/80 dark:bg-gray-900/50 outline-none transition-all duration-200 focus:bg-white dark:focus:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-500"
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={mobile}
                    maxLength={10}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg border-none cursor-pointer text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Spinner /> : <>📤 Request OTP</>}
                </button>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">or continue securely</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                  <span>🔒 SSL secured</span>
                  <span>·</span>
                  <span>👁 Access logged</span>
                </div>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={verifyLogin} className="flex flex-col flex-1">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-full px-4 py-1.5 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                    📱 {mobile}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter the 6-digit code we sent you</p>
                </div>

                <div className="flex gap-1.5 xs:gap-2 sm:gap-3 justify-center mb-4">
                  {otp.map((val, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      className="w-9 h-11 xs:w-10 xs:h-12 sm:w-12 sm:h-14 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-lg sm:text-2xl font-bold text-center bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-mono outline-none transition-all duration-200 focus:bg-white dark:focus:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-500"
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
                  className="w-full py-3 rounded-lg border-none cursor-pointer text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Spinner /> : "✓ Verify & Login"}
                </button>

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    className="flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-transparent cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    disabled={loading}
                    onClick={resendOtp}
                  >
                    ↺ Resend
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-transparent cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="17" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                    <path d="M11 18l5 5 9-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verified!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                  Redirecting to the dashboard...
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mt-2">
                  <div className="w-4 h-4 border-2 border-gray-200 dark:border-gray-700 border-t-purple-600 dark:border-t-purple-500 rounded-full animate-[spin_0.7s_linear_infinite]" />
                  Loading workspace
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 w-full">
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                🛡️ Secure admin area · All access is monitored
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
        FinFilerAdmin Portal v2.0 · Secure SSL Encrypted Connection
      </p>
    </div>
  );
};

/* ── Helper ── */
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-[spin_0.7s_linear_infinite]" />
);

export default AdminLogin;
