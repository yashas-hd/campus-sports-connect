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
      toast("Demo OTP: " + data.otp, { icon: '🔑', duration: 8000 });
      // Redirect to OTP verification
      navigate('/verify-otp', { state: { userId: data.userId, email: formData.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-neon-pink hover:text-neon-blue transition-colors duration-300">
              Sign in here
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input
                name="name"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-dark-900/50 border border-dark-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue focus:bg-dark-900 transition-all sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-dark-900/50 border border-dark-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue focus:bg-dark-900 transition-all sm:text-sm"
                placeholder="College Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                name="college"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-dark-900/50 border border-dark-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue focus:bg-dark-900 transition-all sm:text-sm"
                placeholder="College Name"
                value={formData.college}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                minLength="6"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-dark-900/50 border border-dark-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue focus:bg-dark-900 transition-all sm:text-sm"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-dark-900 bg-gradient-to-r from-neon-pink to-neon-blue hover:from-neon-blue hover:to-neon-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-neon-pink transition-all duration-500 hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Join Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
