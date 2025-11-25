import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

// Import gambar
import logo from '../../assets/logo.jpg';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    fakultas: '',
    angkatan: new Date().getFullYear()
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { register } = useAuth();
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
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    if (!formData.email.endsWith('@ui.ac.id')) {
      setError('Harus menggunakan email UI (@ui.ac.id)');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  const fakultasOptions = [
    'Ilmu Komputer',
    'Ekonomi', 
    'Hukum',
    'Kedokteran',
    'Teknik',
    'Psikologi',
    'Ilmu Sosial & Ilmu Politik',
    'Kesehatan Masyarakat',
    'Farmasi',
    'Matematika & Ilmu Pengetahuan Alam',
    'Ilmu Pengetahuan Budaya',
    'Ilmu Keperawatan'
  ];

  const generateAngkatanOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1950; year--) {
      years.push(year);
    }
    return years;
  };

  // Generate floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 15; i++) {
      particles.push(
        <div
          key={i}
          className="register-particle"
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

  const features = [
    { icon: '🚀', title: 'Karir Cepat', desc: 'Akses lowongan eksklusif', color: 'blue' },
    { icon: '🤝', title: 'Networking', desc: 'Terhubung dengan alumni', color: 'yellow' },
    { icon: '📚', title: 'Learning', desc: 'Workshop & Webinar', color: 'blue' },
    { icon: '💼', title: 'Mentorship', desc: 'Bimbingan profesional', color: 'yellow' }
  ];

  return (
    <div className="register-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500 rounded-full opacity-20 register-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-blue-500 rounded-full opacity-20 register-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-blue-400 rounded-full opacity-20 register-floating-element"></div>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center register-grid-container">
          
          {/* Left Side - Branding & Features */}
          <div className={`space-y-8 transform transition-all duration-1000 ${isMounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'} register-features-section`}>
            {/* Logo & Brand */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="register-logo-container">
                  <div className="register-logo-glow"></div>
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
              
              <div className="register-typewriter">
                <h2 className="text-3xl font-semibold text-white leading-tight">
                  Start Your Journey.
                </h2>
              </div>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                Bergabunglah dengan komunitas mahasiswa dan alumni Universitas Indonesia 
                untuk membangun jaringan profesional dan mengembangkan karir Anda.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 feature-grid">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="register-feature-card dark rounded-2xl p-4 text-center group cursor-pointer border border-gray-700 hover:border-blue-500 transition-all duration-300"
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

          {/* Right Side - Register Form */}
          <div className={`transform transition-all duration-1000 delay-300 ${isMounted ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
            <div className="register-glass-card dark p-8 max-w-md mx-auto w-full neon-glow-blue">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Join UILinkUp
                </h2>
                <p className="text-gray-400">
                  Create your account to get started
                </p>
              </div>

              {/* Register Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="register-error-message dark">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white flex items-center space-x-2">
                    <span className="text-yellow-400">👤</span>
                    <span>Nama Lengkap</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="register-glass-input dark w-full px-4 py-3 rounded-2xl focus:outline-none transition-all duration-300 placeholder-gray-500 text-white"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white flex items-center space-x-2">
                    <span className="text-yellow-400">📧</span>
                    <span>Email UI</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="register-glass-input dark w-full px-4 py-3 rounded-2xl focus:outline-none transition-all duration-300 placeholder-gray-500 text-white"
                    placeholder="email@ui.ac.id"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Harus menggunakan email UI (@ui.ac.id)</p>
                </div>

                {/* Role and Angkatan */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white flex items-center space-x-2">
                      <span className="text-yellow-400">🎓</span>
                      <span>Status</span>
                    </label>
                    <select
                      name="role"
                      required
                      className="register-select dark w-full px-4 py-3 rounded-2xl focus:outline-none transition-all duration-300 text-white"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="student" className="bg-gray-800 text-white">Mahasiswa Aktif</option>
                      <option value="alumni" className="bg-gray-800 text-white">Alumni</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white flex items-center space-x-2">
                      <span className="text-yellow-400">📅</span>
                      <span>Angkatan</span>
                    </label>
                    <select
                      name="angkatan"
                      required
                      className="register-select dark w-full px-4 py-3 rounded-2xl focus:outline-none transition-all duration-300 text-white"
                      value={formData.angkatan}
                      onChange={handleChange}
                    >
                      {generateAngkatanOptions().map(year => (
                        <option key={year} value={year} className="bg-gray-800 text-white">{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fakultas */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white flex items-center space-x-2">
                    <span className="text-yellow-400">🏛️</span>
                    <span>Fakultas</span>
                  </label>
                  <select
                    name="fakultas"
                    required
                    className="register-select dark w-full px-4 py-3 rounded-2xl focus:outline-none transition-all duration-300 text-white"
                    value={formData.fakultas}
                    onChange={handleChange}
                  >
                    <option value="" className="bg-gray-800 text-white">Pilih Fakultas</option>
                    {fakultasOptions.map(fakultas => (
                      <option key={fakultas} value={fakultas} className="bg-gray-800 text-white">{fakultas}</option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white flex items-center space-x-2">
                    <span className="text-yellow-400">🔒</span>
                    <span>Password</span>
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    className="register-glass-input dark w-full px-4 py-3 rounded-2xl focus:outline-none transition-all duration-300 placeholder-gray-500 text-white"
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white flex items-center space-x-2">
                    <span className="text-yellow-400">🔒</span>
                    <span>Konfirmasi Password</span>
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    className="register-glass-input dark w-full px-4 py-3 rounded-2xl focus:outline-none transition-all duration-300 placeholder-gray-500 text-white"
                    placeholder="Ulangi password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="register-gradient-btn yellow w-full text-black py-4 px-4 rounded-2xl font-semibold focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-4"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Mendaftarkan...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <span>🎉</span>
                      <span>Daftar Sekarang</span>
                    </span>
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-4 border-t border-gray-700">
                  <p className="text-gray-400">
                    Sudah punya akun?{' '}
                    <Link 
                      to="/login" 
                      className="font-semibold text-yellow-400 hover:text-yellow-300 transition-colors duration-200 inline-flex items-center space-x-1 group"
                    >
                      <span>Login di sini</span>
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
                <span>Secure & Encrypted Registration</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;