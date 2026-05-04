import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
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
      toast("Demo OTP: " + res.data.otp, { icon: '🔑', duration: 8000 });
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
      {/* Animated Background Blobs */}
      <div className="absolute top-10 -left-10 w-96 h-96 bg-neon-blue rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-10 w-96 h-96 bg-neon-pink rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-neon-green rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>

      <div className="relative max-w-md w-full space-y-8 bg-dark-800/60 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-dark-700 z-10 animate-fade-in-up">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            New here?{' '}
            <Link to="/register" className="font-medium text-neon-blue hover:text-neon-pink transition-colors duration-300">
              Create an account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-dark-900/50 border border-dark-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue focus:bg-dark-900 transition-all sm:text-sm"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-dark-900/50 border border-dark-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue focus:bg-dark-900 transition-all sm:text-sm"
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-dark-900 bg-gradient-to-r from-neon-blue to-neon-pink hover:from-neon-pink hover:to-neon-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-neon-blue transition-all duration-500 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
