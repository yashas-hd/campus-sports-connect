import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(30);

  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const userId = location.state?.userId;
  const email = location.state?.email;

  useEffect(() => {
    if (!userId || !email) {
      navigate('/login');
    }
  }, [userId, email, navigate]);

  // Timers
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/resend-otp`, { email });
      toast.success('OTP resent successfully');
      setTimeLeft(300); // Reset 5 min timer
      setResendCooldown(30); // Reset 30s cooldown
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/api/auth/verify-otp`, {
        userId,
        otp
      });
      localStorage.setItem("token", data.token);
      login(data);
      toast.success("Verification successful!");
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Glow */}
      <div className="absolute top-10 -left-10 w-96 h-96 bg-blue-900/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      <div className="relative max-w-md w-full space-y-6 bg-slate-900/40 p-8 rounded-2xl border border-slate-800 z-10 shadow-sm animate-fade-in-up">
        <div>
          <div className="flex justify-center text-2xl mb-3">🔑📨</div>
          <h2 className="text-center text-2xl font-extrabold text-white tracking-tight leading-tight">
            Verify <span className="text-blue-500">Identity</span>
          </h2>
          <p className="mt-1.5 text-center text-xs text-slate-400">
            We sent a 6-digit code to <span className="font-semibold text-blue-400">{email || 'your email'}</span>
          </p>
          <div className="mt-4 flex justify-center">
            <span className="font-mono text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 shadow-inner">
              ⚡ Expiration: {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">Enter Verification Code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength="6"
                className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-lg placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-[0.6em] pl-5 font-mono transition-all disabled:opacity-50 shadow-inner"
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={timeLeft === 0}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6 || timeLeft === 0}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
            >
              {loading ? (
                 <span className="flex items-center justify-center">
                   <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                   Verifying...
                 </span>
              ) : 'Verify Code'}
            </button>
          </div>
          
          <div className="text-center mt-5 flex flex-col gap-2.5 border-t border-slate-800/60 pt-5">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors disabled:text-slate-600 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
            >
              {resendLoading ? 'Requesting...' : resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
            </button>
            <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-white transition-colors uppercase tracking-wider">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
