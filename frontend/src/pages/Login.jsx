import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading, error } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (result.success) {
            navigate('/feed');
        }
    };

    return (
        <div className="h-screen overflow-hidden flex bg-white sm:bg-[#f5f5f7]">
            {/* Left - Hero Visual Apple */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1d1d1f] via-[#2d2d2f] to-[#1a1a2e] flex-col justify-between p-16 relative overflow-hidden text-white h-full select-none">
                {/* Background Unsplash Cover with error fallback */}
                <img 
                    src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=1200" 
                    className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none transition-opacity duration-300" 
                    alt="" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />

                {/* Spheres and Geometric Ambient Pattern */}
                <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#0071e3]/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#af52de]/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-2">
                        <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="9" fill="#0071e3"/>
                            <path d="M20 10l12 6.5-12 6.5-12-6.5L20 10z" fill="white" fillOpacity="0.92"/>
                            <path d="M10 20v7l10 5.5L30 27v-7" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="30" cy="16.5" r="1.4" fill="white"/>
                            <line x1="30" y1="17.9" x2="30" y2="23" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                        </svg>
                        <span className="text-[20px] font-bold tracking-[-0.025em] text-white">
                            Schol<span className="text-[#0071e3]">ar</span>
                        </span>
                    </div>
                </div>

                {/* Hero Headline */}
                <div className="relative z-10 max-w-lg space-y-6">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 backdrop-blur-md">
                        <span className="material-symbols-outlined text-[16px] text-[#0071e3]">
                            school
                        </span>
                        <span className="text-[10px] font-bold text-[#e8f0fe] uppercase tracking-widest">
                            Réseau Académique IGA
                        </span>
                    </div>
                    
                    <h2 className="text-[42px] font-bold leading-[1.1] tracking-[-0.03em] animate-fadeInUp">
                        Votre réseau académique. <br />
                        <span className="bg-gradient-to-r from-[#0071e3] to-[#af52de] bg-clip-text text-transparent">
                            Commence ici.
                        </span>
                    </h2>
                    
                    <p className="text-[15px] text-white/70 leading-relaxed font-medium">
                        Connectez-vous avec des chercheurs, enseignants et étudiants. Collaborez sur des projets académiques d'exception.
                    </p>
                </div>

                {/* Features list */}
                <div className="relative z-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                    {[
                        ['🎓', 'Réseau Académique', '500+ membres'],
                        ['🔬', 'Recherche active', 'Projets d\'exception'],
                        ['📚', 'Publications', 'Partagez vos travaux']
                    ].map(([emoji, title, desc], i) => (
                        <div key={title} className="space-y-1 animate-fadeInUp" style={{ animationDelay: `${i * 100}ms` }}>
                            <span className="text-xl">{emoji}</span>
                            <h4 className="text-[12px] font-bold text-white">{title}</h4>
                            <p className="text-[10px] text-white/60 font-medium">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right - Form Column */}
            <div className="flex-1 h-full overflow-y-auto flex flex-col items-center p-6 sm:p-12 bg-white sm:bg-[#f5f5f7]">
                <div className="w-full max-w-[420px] my-auto py-8 space-y-6 animate-fadeIn">
                    
                    {/* Mobile logo header */}
                    <div className="lg:hidden flex flex-col items-center gap-1.5 text-center">
                        <div className="flex items-center gap-2">
                            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
                                <rect width="40" height="40" rx="9" fill="#0071e3"/>
                                <path d="M20 10l12 6.5-12 6.5-12-6.5L20 10z" fill="white" fillOpacity="0.92"/>
                                <path d="M10 20v7l10 5.5L30 27v-7" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="30" cy="16.5" r="1.4" fill="white"/>
                                <line x1="30" y1="17.9" x2="30" y2="23" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                            </svg>
                            <span className="text-[22px] font-bold tracking-[-0.025em] text-[#1d1d1f]">
                                Schol<span className="text-[#0071e3]">ar</span>
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Espace Académique IGA</p>
                    </div>

                    {/* Card container */}
                    <div className="bg-white sm:border sm:border-black/5 rounded-[24px] sm:shadow-apple-lg p-6 sm:p-10 space-y-6">
                        
                        {/* Title */}
                        <div className="space-y-1">
                            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#1d1d1f]">Bon retour.</h1>
                            <p className="text-[14px] text-[#6e6e73]">Connectez-vous à votre espace académique.</p>
                        </div>

                        {/* Error Card */}
                        {error && (
                            <div className="p-3.5 bg-[#ffeeed] border border-[#ff3b30]/20 rounded-[12px] text-[#d63029] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                                <span className="material-symbols-outlined text-[18px]">
                                    error
                                </span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Standard Inputs Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Floating Label Input */}
                            <div className="space-y-1.5 text-left">
                                <label htmlFor="email" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                    Email académique
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="nom.prenom@iga.ac.ma"
                                    className="w-full h-[46px] px-4 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Password Floating Label Input */}
                            <div className="space-y-1.5 text-left">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="password" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                        Mot de passe
                                    </label>
                                    <a href="#" className="text-[12px] font-semibold text-[#0071e3] hover:underline">
                                        Mot de passe oublié ?
                                    </a>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Saisissez votre mot de passe"
                                        className="w-full h-[46px] pl-4 pr-11 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    
                                    {/* Visibility toggle */}
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200/50 rounded-full transition-all press-effect text-gray-400 hover:text-gray-600 flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Primary Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-[46px] rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[15px] font-semibold shadow-apple-blue flex items-center justify-center gap-1.5 transition-all press-effect disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Se connecter
                                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative flex items-center justify-center my-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-black/5" />
                            </div>
                            <span className="relative px-3 bg-white text-xs text-[#86868b] font-medium">ou</span>
                        </div>

                        {/* Social Buttons */}
                        <div>
                            {/* Google Button */}
                            <button
                                type="button"
                                className="w-full h-[46px] rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2.5 text-[14px] font-semibold text-[#1d1d1f] transition-all press-effect bg-white"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.93 1 12 1 7.37 1 3.41 3.66 1.48 7.55l3.77 2.92C6.14 7.51 8.84 5.04 12 5.04z" />
                                    <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.6-.21-2.27H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.16-1.99 3.41-4.92 3.41-8.7z" />
                                    <path fill="#FBBC05" d="M5.25 14.53c-.24-.72-.37-1.49-.37-2.28s.13-1.56.37-2.28L1.48 7.05C.54 8.94 0 11.07 0 13.33s.54 4.39 1.48 6.28l3.77-2.92c-.24-.72-.37-1.49-.37-2.28z" />
                                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.71-2.88c-1.03.69-2.35 1.1-3.96 1.1-3.16 0-5.86-2.47-6.81-5.51l-3.77 2.92C3.41 20.34 7.37 23 12 23z" />
                                </svg>
                                Continuer avec Google
                            </button>
                        </div>
                    </div>

                    {/* Footer link */}
                    <div className="text-center">
                        <p className="text-[14px] text-[#6e6e73]">
                            Pas encore membre ?{' '}
                            <Link to="/register" className="text-[#0071e3] font-bold hover:underline">
                                Créer un compte
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
