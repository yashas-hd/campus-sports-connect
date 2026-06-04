import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', college: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/api/auth/register`, formData);
      toast.success("OTP Sent successfully!");
      // Redirect to OTP verification
      navigate('/verify-otp', { state: { userId: data.userId, email: formData.email } });
    } catch (err) {
      console.error("Signup failed:", err);
      toast.error(err.response?.data?.message || 'Registration failed');
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
          <div className="flex justify-center text-3xl mb-4">🎖️🏆⚽</div>
          <h2 className="text-center text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink font-extrabold">Account</span>
          </h2>
          <p className="mt-2 text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Draft Into Campus Sports Connect
          </p>
        </div>
        
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-4 py-3.5 bg-dark-900/60 border border-dark-700/80 rounded-xl placeholder-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-neon-blue focus:border-neon-blue transition-all duration-300 text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">College Email Address</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-3.5 bg-dark-900/60 border border-dark-700/80 rounded-xl placeholder-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-neon-blue focus:border-neon-blue transition-all duration-300 text-sm"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">College Name</label>
              <input
                name="college"
                type="text"
                required
                className="w-full px-4 py-3.5 bg-dark-900/60 border border-dark-700/80 rounded-xl placeholder-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-neon-blue focus:border-neon-blue transition-all duration-300 text-sm"
                placeholder="e.g. Stanford University"
                value={formData.college}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength="6"
                className="w-full px-4 py-3.5 bg-dark-900/60 border border-dark-700/80 rounded-xl placeholder-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-neon-blue focus:border-neon-blue transition-all duration-300 text-sm"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 text-xs font-bold rounded-xl text-dark-900 bg-gradient-to-r from-neon-pink via-neon-green to-neon-blue hover:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest cursor-pointer"
            >
              {loading ? 'Transmitting OTP...' : 'Join Now'}
            </button>
          </div>
        </form>

        <div className="border-t border-dark-700/60 pt-6 text-center">
          <p className="text-xs md:text-sm text-gray-400">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-neon-pink hover:text-neon-blue transition-colors duration-300">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
