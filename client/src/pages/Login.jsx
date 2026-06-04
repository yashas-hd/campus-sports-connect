import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/auth/login`, formData);
      toast.success("OTP Sent successfully!");
      navigate('/verify-otp', { state: { userId: res.data.userId, email: formData.email } });
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.userId) {
        // Redirect to OTP verification if not verified
        toast.error("Account not verified. Please enter OTP.");
        navigate('/verify-otp', { state: { userId: err.response.data.userId, email: formData.email } });
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Glow */}
      <div className="absolute top-10 -left-10 w-96 h-96 bg-blue-900/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      <div className="relative max-w-md w-full space-y-6 bg-dark-800/20 p-8 rounded-2xl border border-dark-700 z-10 shadow-sm animate-fade-in-up">
        <div>
          <div className="flex justify-center text-2xl mb-3">🏆⚽</div>
          <h2 className="text-center text-2xl font-extrabold text-white tracking-tight leading-tight">
            Campus <span className="text-blue-500">Connect</span>
          </h2>
          <p className="mt-1.5 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Sports Operations Portal
          </p>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg placeholder-slate-650 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg placeholder-slate-650 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
            >
              {loading ? 'Sending OTP...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="border-t border-dark-700/60 pt-5 text-center">
          <p className="text-xs text-slate-400">
            New to the League?{' '}
            <Link to="/register" className="font-semibold text-blue-500 hover:text-blue-400 transition-colors duration-200">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
