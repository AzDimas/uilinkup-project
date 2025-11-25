import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

// Import gambar
import logo from '../../assets/logo.jpg';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Generate floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 15; i++) {
      particles.push(
        <div
          key={i}
          className="particle"
          style={{
            width: `${Math.random() * 20 + 5}px`,
            height: `${Math.random() * 20 + 5}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            background: i % 2 === 0 
              ? `rgba(255, 193, 7, ${Math.random() * 0.2 + 0.1})`
              : `rgba(33, 150, 243, ${Math.random() * 0.2 + 0.1})`
          }}
        />
      );
    }
    return particles;
  };

  return (
    <div className="login-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500 rounded-full opacity-20 floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-blue-500 rounded-full opacity-20 floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-blue-400 rounded-full opacity-20 floating-element"></div>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Branding & Features */}
          <div className={`space-y-8 transform transition-all duration-1000 ${isMounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            {/* Logo & Brand */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="logo-container">
                  <div className="logo-glow"></div>
                  <img 
                    src={logo} 
                    alt="UILinkUp" 
                    className="h-20 w-20 object-contain relative z-10 rounded-2xl shadow-2xl neon-glow-yellow"
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold gradient-text-blue-yellow">
                    UILinkUp
                  </h1>
                  <p className="text-gray-300 mt-2 text-lg">
                    Platform Eksklusif UI
                  </p>
                </div>
              </div>
              
              <div className="typewriter">
                <h2 className="text-3xl font-semibold text-white leading-tight">
                  Connect. Grow. Succeed Together.
                </h2>
              </div>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                Bergabunglah dengan komunitas mahasiswa dan alumni Universitas Indonesia 
                untuk membangun jaringan profesional dan mengembangkan karir Anda.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 feature-grid">
              {[
                { icon: '🚀', title: 'Karir Cepat', desc: 'Akses lowongan eksklusif', color: 'blue' },
                { icon: '🤝', title: 'Networking', desc: 'Terhubung dengan alumni', color: 'yellow' },
                { icon: '📚', title: 'Learning', desc: 'Workshop & Webinar', color: 'blue' },
                { icon: '💼', title: 'Mentorship', desc: 'Bimbingan profesional', color: 'yellow' }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="feature-card dark rounded-2xl p-4 text-center group cursor-pointer border border-gray-700 hover:border-blue-500 transition-all duration-300"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className={`text-2xl mb-2 transform group-hover:scale-110 transition-transform duration-300 ${
                    feature.color === 'yellow' ? 'text-yellow-400' : 'text-blue-400'
                  }`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className={`transform transition-all duration-1000 delay-300 ${isMounted ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
            <div className="glass-card dark p-10 max-w-md mx-auto w-full neon-glow-blue">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-400">
                  Sign in to continue your journey
                </p>
              </div>

              {/* Login Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="error-message">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white flex items-center space-x-2">
                    <span className="text-yellow-400">📧</span>
                    <span>Email UI</span>
                  </label>
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      required
                      className="glass-input dark w-full px-4 py-4 rounded-2xl focus:outline-none transition-all duration-300 placeholder-gray-500 text-white"
                      placeholder="your.email@ui.ac.id"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-white flex items-center space-x-2">
                      <span className="text-yellow-400">🔒</span>
                      <span>Password</span>
                    </label>
                    <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      name="password"
                      type="password"
                      required
                      className="glass-input dark w-full px-4 py-4 rounded-2xl focus:outline-none transition-all duration-300 placeholder-gray-500 text-white"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="remember"
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-400">
                    Remember me for 30 days
                  </label>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="gradient-btn yellow w-full text-black py-4 px-4 rounded-2xl font-semibold focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <span>🚀</span>
                      <span>Sign In to UILinkUp</span>
                    </span>
                  )}
                </button>

                {/* Register Link */}
                <div className="text-center pt-4">
                  <p className="text-gray-400">
                    Don't have an account?{' '}
                    <Link 
                      to="/register" 
                      className="font-semibold text-yellow-400 hover:text-yellow-300 transition-colors duration-200 inline-flex items-center space-x-1 group"
                    >
                      <span>Join now</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            {/* Security Badge */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
                <span className="text-green-400">🔒</span>
                <span>Secure & Encrypted Login</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;