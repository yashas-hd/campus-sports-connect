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
      {/* Background Glow */}
      <div className="absolute top-10 -left-10 w-96 h-96 bg-blue-900/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      <div className="relative max-w-md w-full space-y-6 bg-slate-900/40 p-8 rounded-2xl border border-slate-800 z-10 shadow-sm animate-fade-in-up">
        <div>
          <div className="flex justify-center text-2xl mb-3">🏆⚽</div>
          <h2 className="text-center text-2xl font-extrabold text-white tracking-tight leading-tight">
            Create <span className="text-blue-500">Account</span>
          </h2>
          <p className="mt-1.5 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Draft Into Campus Sports Connect
          </p>
        </div>
        
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm shadow-inner"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">College Email Address</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm shadow-inner"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">College Name</label>
              <input
                name="college"
                type="text"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm shadow-inner"
                placeholder="e.g. Stanford University"
                value={formData.college}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength="6"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm shadow-inner"
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
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
            >
              {loading ? 'Sending OTP...' : 'Join Now'}
            </button>
          </div>
        </form>

        <div className="border-t border-slate-800/60 pt-5 text-center">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-blue-500 hover:text-blue-400 transition-colors duration-200">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
