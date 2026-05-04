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
      toast("Demo OTP: " + res.data.otp, { icon: '🔑', duration: 8000 });
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
      <div className="absolute top-10 -left-10 w-96 h-96 bg-neon-blue rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-10 w-96 h-96 bg-neon-pink rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-neon-green rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>

      <div className="relative max-w-md w-full space-y-8 bg-dark-800/60 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-dark-700 z-10 animate-fade-in-up">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-white tracking-tight">
            Verify Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            We sent a 6-digit code to <span className="font-medium text-neon-blue">{email || 'your email'}</span>
          </p>
          <p className="mt-1 text-center text-xs font-semibold text-gray-500">
            Expires in {formatTime(timeLeft)}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="sr-only">OTP Code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength="6"
                className="appearance-none rounded-lg relative block w-full px-3 py-4 bg-dark-900/50 border border-dark-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-neon-green text-center text-3xl tracking-[1em] font-mono transition-all disabled:opacity-50"
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-dark-900 bg-gradient-to-r from-neon-green to-neon-blue hover:from-neon-blue hover:to-neon-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-neon-green transition-all duration-500 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                 <span className="flex items-center">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-900 mr-2"></div>
                   Verifying...
                 </span>
              ) : 'Verify Code'}
            </button>
          </div>
          
          <div className="text-center mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="text-sm font-medium text-neon-pink hover:text-neon-blue transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
            </button>
            <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-white transition-colors">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
