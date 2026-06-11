import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  Mail, 
  Lock, 
  Shield, 
  TrendingUp, 
  FileText, 
  Users,
  DollarSign,
  ArrowRight,
} from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      // Simulate API call - replace with your actual API endpoint
      // const response = await apiCall("/auth/admin/login/send-otp", "POST", {
      //   email,
      //   password,
      // });

      // Simulate successful response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("OTP sent successfully to your registered email");
      setOtpSent(true);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      // Simulate API call - replace with your actual API endpoint
      // const response = await apiCall("/auth/admin/login", "POST", {
      //   email,
      //   password,
      //   otp,
      // });

      // Simulate successful response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store in localStorage
      localStorage.setItem("token", "sample-token-12345");
      localStorage.setItem("adminEmail", email);
      localStorage.setItem("adminName", email.split('@')[0]);

      toast.success("Login successful! Redirecting to dashboard...");
      
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-5xl w-full mx-4">
        <div className="grid md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Left Section - Tax Management Branding */}
          <div className="hidden md:flex bg-gradient-to-br from-blue-700 to-indigo-800 p-8 md:p-12 text-white min-h-[650px] flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold">FF</span>
                </div>
                <span className="text-2xl font-bold tracking-tight">FinFilerAdmin</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                Admin Portal
              </h1>

              <p className="text-blue-100 text-base md:text-lg mb-6 leading-relaxed">
                Complete control over tax management, user filings, and financial compliance.
              </p>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <DollarSign className="w-5 h-5 mb-2 text-green-300" />
                <p className="text-2xl font-bold">$42.8K</p>
                <p className="text-xs text-blue-200">Tax Collected</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <Users className="w-5 h-5 mb-2 text-blue-300" />
                <p className="text-2xl font-bold">2,847</p>
                <p className="text-xs text-blue-200">Active Users</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-blue-100">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Government-grade security</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Real-time tax analytics</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Automated compliance reports</span>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-white/20">
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-blue-700"></div>
                  <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-blue-700"></div>
                  <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-blue-700"></div>
                </div>
                <span>Trusted by 500+ tax professionals</span>
              </div>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="p-8 md:p-12 min-h-[650px] flex flex-col">
            {/* Icon at the top of form */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Sign In
              </h2>
              <p className="text-gray-500 text-sm">
                Secure access to tax management dashboard
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={sendOtp} className="flex-1">
                <div className="mb-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Admin email address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending OTP...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                    onClick={() => toast.info("Contact system administrator")}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={verifyLogin} className="flex-1">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Enter the 6-digit code sent to <strong>{email}</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    "Verify & Access Dashboard"
                  )}
                </button>

                <div className="flex items-center justify-between mt-4 gap-3">
                  <button
                    type="button"
                    className="flex-1 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    onClick={sendOtp}
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    className="flex-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                This is a secure admin area. All access is logged and monitored.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-xs text-gray-400">
          <p>FinFilerAdmin Portal v2.0 | Secure SSL Encrypted Connection</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;