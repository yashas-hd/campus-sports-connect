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
      {/* Animated Background Blobs */}
      <div className="absolute top-10 -left-10 w-96 h-96 bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-0 -right-10 w-96 h-96 bg-neon-pink/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-neon-green/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '4s' }}></div>

      <div className="relative max-w-md w-full space-y-8 bg-dark-800/35 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-dark-700/80 z-10 animate-fade-in-up">
        <div>
          <div className="flex justify-center text-3xl mb-4">🔐🔑📨</div>
          <h2 className="text-center text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Verify <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink font-extrabold">Identity</span>
          </h2>
          <p className="mt-2 text-center text-xs text-gray-400">
            We sent a 6-digit code to <span className="font-bold text-neon-blue">{email || 'your email'}</span>
          </p>
          <div className="mt-4 flex justify-center">
            <span className="font-mono text-xs font-semibold text-neon-pink bg-dark-900/60 px-3.5 py-1.5 rounded-xl border border-dark-700/65 shadow-inner">
              ⚡ Expiration: {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3.5 text-center">Enter Verification Code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength="6"
                className="w-full px-3 py-4 bg-dark-900/60 border border-dark-700/80 rounded-xl placeholder-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-neon-green focus:border-neon-green text-center text-3xl tracking-[0.8em] pl-6 font-mono transition-all disabled:opacity-50"
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
              className="w-full py-3.5 px-4 text-xs font-bold rounded-xl text-dark-900 bg-gradient-to-r from-neon-green to-neon-blue hover:shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest cursor-pointer"
            >
              {loading ? (
                 <span className="flex items-center justify-center">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-900 mr-2"></div>
                   Transmitting...
                 </span>
              ) : 'Verify Code'}
            </button>
          </div>
          
          <div className="text-center mt-6 flex flex-col gap-3 border-t border-dark-700/60 pt-5">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="text-xs font-bold text-neon-pink hover:text-neon-blue transition-colors disabled:text-gray-600 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
            >
              {resendLoading ? 'Requesting...' : resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
            </button>
            <Link to="/login" className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
