import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Register = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'STUDENT',
        institution: '',
        filiere: '',
        nv: '',
        department: '',
        laboratory: '',
        exp_title: '',
        exp_org: '',
        exp_type: 'INTERNSHIP',
        exp_duration: '',
        cert_title: '',
        cert_org: ''
    });

    const [success, setSuccess] = useState(false);
    const [diploma, setDiploma] = useState(null);
    const [certification, setCertification] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1);
    const [localError, setLocalError] = useState('');
    const [isExpTypeOpen, setIsExpTypeOpen] = useState(false);

    const { register, loading, error } = useAuthStore();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateStep = () => {
        setLocalError('');
        if (step === 1) {
            if (!formData.first_name.trim()) {
                setLocalError('Le prénom est requis.');
                return false;
            }
            if (!formData.last_name.trim()) {
                setLocalError('Le nom est requis.');
                return false;
            }
            if (!formData.email.trim()) {
                setLocalError("L'adresse email est requise.");
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setLocalError('Veuillez entrer une adresse email valide.');
                return false;
            }
        } else if (step === 2) {
            if (formData.password.length < 6) {
                setLocalError('Le mot de passe doit contenir au moins 6 caractères.');
                return false;
            }
            if (formData.password !== formData.password_confirmation) {
                setLocalError('Les mots de passe ne correspondent pas.');
                return false;
            }
        } else if (step === 3) {
            if (!formData.institution.trim()) {
                setLocalError("L'institution / université est requise.");
                return false;
            }
            if (formData.role === 'STUDENT') {
                if (!formData.filiere.trim()) {
                    setLocalError('La filière est requise.');
                    return false;
                }
                if (!formData.nv.trim()) {
                    setLocalError('Le niveau est requis.');
                    return false;
                }
            } else {
                if (!formData.department.trim()) {
                    setLocalError('Le département est requis.');
                    return false;
                }
                if (!formData.laboratory.trim()) {
                    setLocalError('Le laboratoire est requis.');
                    return false;
                }
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setLocalError('');
        setStep(prev => Math.max(1, prev - 1));
    };

    const totalSteps = formData.role === 'STUDENT' ? 3 : 4;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let submitData;
        if (formData.role !== 'STUDENT') {
            submitData = new FormData();
            Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
            if (diploma) submitData.append('diploma', diploma);
            if (certification) submitData.append('certification', certification);
        } else {
            submitData = formData;
        }

        const result = await register(submitData);
        if (result.success) {
            if (formData.role === 'STUDENT') {
                navigate('/feed');
            } else {
                setSuccess(true);
            }
        }
    };

    // Calculate password strength indicator segments (1 to 4)
    const getPasswordStrength = () => {
        const len = formData.password.length;
        if (len === 0) return 0;
        if (len < 4) return 1; // Weak
        if (len < 6) return 2; // Medium
        if (len < 8) return 3; // Good
        return 4; // Strong
    };

    const strength = getPasswordStrength();
    const match = formData.password.length > 0 && formData.password === formData.password_confirmation;

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-4">
                <div className="max-w-[420px] w-full bg-white border border-black/5 rounded-[20px] p-8 text-center shadow-apple-lg animate-fadeInUp">
                    <div className="h-14 w-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#34c759]">
                        <span className="material-symbols-outlined text-[36px] font-bold">
                            check_circle
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">Inscription envoyée !</h2>
                    <p className="text-xs text-[#6e6e73] mb-8 leading-relaxed">
                        Votre compte <span className="font-bold text-[#0071e3]">{formData.role}</span> est en cours de validation par un administrateur. Vous recevrez un courriel de confirmation dès que l'accès sera activé.
                    </p>
                    <Link to="/login" className="w-full h-[44px] rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[15px] font-semibold flex items-center justify-center gap-1.5 transition-all press-effect shadow-apple-blue">
                        Retour à la connexion
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden flex bg-white sm:bg-[#f5f5f7]">
            {/* Left - Hero Panel Apple */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1d1d1f] via-[#2d2d2f] to-[#1a1a2e] flex-col justify-between p-16 relative overflow-hidden text-white h-full select-none">
                <img 
                    src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200" 
                    className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none transition-opacity duration-300" 
                    alt="" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />

                <div className="absolute top-[-20%] right-[-20%] w-[450px] h-[450px] bg-[#0071e3]/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#af52de]/10 blur-[100px] rounded-full pointer-events-none" />
                
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

                <div className="relative z-10 space-y-6 animate-fadeInUp">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 backdrop-blur-md">
                        <span className="material-symbols-outlined text-[16px] text-[#0071e3]">
                            school
                        </span>
                        <span className="text-[10px] font-bold text-[#e8f0fe] uppercase tracking-widest">
                            IGA Casablanca
                        </span>
                    </div>
                    <h2 className="text-[42px] font-bold leading-[1.1] tracking-[-0.03em]">
                        Rejoignez la <br />
                        <span className="bg-gradient-to-r from-[#0071e3] to-[#af52de] bg-clip-text text-transparent">communauté</span> académique.
                    </h2>
                    <p className="text-[15px] text-white/70 leading-relaxed font-medium">
                        Partagez vos recherches, collaborez sur des projets, et développez votre réseau académique IGA.
                    </p>

                    <div className="mt-8 space-y-4 pt-6 border-t border-white/10">
                        {[
                            'Accès aux publications scientifiques exclusives',
                            'Collaboration de pointe sur des projets de recherche',
                            'Réseau professionnel de chercheurs & d\'enseignants'
                        ].map(item => (
                            <div key={item} className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#34c759] text-[18px]">
                                    check_circle
                                </span>
                                <span className="text-xs text-white/80 font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider relative z-10">
                    © 2026 Scholar Académique
                </p>
            </div>

            {/* Right - Form Onboarding */}
            <div className="flex-1 h-full overflow-y-auto flex flex-col items-center p-6 sm:p-12 bg-white sm:bg-[#f5f5f7]">
                <div className="w-full max-w-lg my-auto py-8 space-y-6">
                    {/* Mobile Logo */}
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
                    </div>

                    <div className="bg-white sm:border sm:border-black/5 rounded-[24px] sm:shadow-apple-lg p-6 sm:p-10 space-y-6">
                        <div className="space-y-1">
                            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#1d1d1f]">Créer votre compte.</h1>
                            <p className="text-[14px] text-[#6e6e73]">Rejoignez la communauté académique de l'IGA.</p>
                        </div>

                        {/* Stepper progress indicator */}
                        <div className="flex items-center justify-between px-1 pb-4 border-b border-black/5 select-none">
                            {[
                                { label: 'Profil', icon: 'person' },
                                { label: 'Sécurité', icon: 'lock' },
                                { label: 'Académique', icon: 'school' },
                                ...(formData.role !== 'STUDENT' ? [{ label: 'Justificatifs', icon: 'workspace_premium' }] : [])
                            ].map((header, index) => {
                                const stepNum = index + 1;
                                const isActive = step === stepNum;
                                const isCompleted = step > stepNum;
                                return (
                                    <React.Fragment key={header.label}>
                                        {index > 0 && (
                                            <div className="flex-1 h-[2px] mx-2 bg-[#e5e5ea] relative rounded-full overflow-hidden">
                                                <div 
                                                    className="absolute inset-0 bg-[#0071e3] transition-all duration-300" 
                                                    style={{ width: step >= stepNum ? '100%' : '0%' }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center gap-1 relative">
                                            <div 
                                                className={`h-8 w-8 rounded-full flex items-center justify-center border text-[16px] transition-all duration-300 ${
                                                    isActive 
                                                    ? 'border-[#0071e3] bg-[#0071e3] text-white shadow-apple-xs' 
                                                    : isCompleted
                                                    ? 'border-[#34c759] bg-[#34c759] text-white'
                                                    : 'border-[#c1c6d4] bg-white text-[#86868b]'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[16px] font-semibold">
                                                    {isCompleted ? 'check' : header.icon}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-bold tracking-tight uppercase ${
                                                isActive ? 'text-[#0071e3]' : isCompleted ? 'text-[#34c759]' : 'text-[#86868b]'
                                            }`}>
                                                {header.label}
                                            </span>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Error Displays (both database errors and local validation errors) */}
                        {(error || localError) && (
                            <div className="p-3.5 bg-[#ffeeed] border border-[#ff3b30]/20 rounded-[12px] text-[#d63029] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                                <span className="material-symbols-outlined text-[18px]">
                                    error
                                </span>
                                <span>{localError || error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            {/* STEP 1: Profil Details */}
                            {step === 1 && (
                                <div className="space-y-4 animate-fadeIn">
                                    {/* Name Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* First name */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="first_name" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                                Prénom
                                            </label>
                                            <input
                                                id="first_name"
                                                name="first_name"
                                                type="text"
                                                placeholder="Jean"
                                                className="w-full h-[46px] px-4 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                                                value={formData.first_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        {/* Last name */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="last_name" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                                Nom
                                            </label>
                                            <input
                                                id="last_name"
                                                name="last_name"
                                                type="text"
                                                placeholder="Dupont"
                                                className="w-full h-[46px] px-4 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                                                value={formData.last_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="email" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                            Email institutionnel
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="jean.dupont@iga.ac.ma"
                                            className="w-full h-[46px] px-4 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Role selection Buttons */}
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                                            Je suis un(e)
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'STUDENT', label: 'Étudiant', icon: 'school' },
                                                { id: 'TEACHER', label: 'Enseignant', icon: 'person' },
                                                { id: 'RESEARCHER', label: 'Chercheur', icon: 'science' }
                                            ].map(role => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, role: role.id})}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-[12px] border transition-all press-effect ${
                                                        formData.role === role.id
                                                        ? 'border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3] font-bold shadow-apple-xs'
                                                        : 'border-[#c1c6d4] hover:bg-gray-50 text-[#6e6e73] bg-white'
                                                    }`}
                                                >
                                                    <span className={`material-symbols-outlined text-[24px] ${formData.role === role.id ? 'text-[#0071e3]' : 'text-gray-400'}`}>
                                                        {role.icon}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">{role.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {formData.role !== 'STUDENT' && (
                                            <p className="text-[10px] text-[#ff9500] font-semibold flex items-center gap-1.5 bg-[#fff4e6] border border-[#ff9500]/20 rounded-[8px] px-3 py-2.5 animate-fadeIn">
                                                <span className="material-symbols-outlined text-[16px]">info</span>
                                                Ce rôle nécessite une validation manuelle de l'administration.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Password and Security */}
                            {step === 2 && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Password */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="password" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                                Mot de passe
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="Saisissez le mot de passe"
                                                    className="w-full h-[46px] pl-4 pr-10 bg-[#f5f5f7] hover:bg-[#e8e8ed] focus:bg-white border border-transparent focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-200"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200/50 rounded-full transition-all press-effect text-gray-400"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        {showPassword ? 'visibility_off' : 'visibility'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Password confirmation */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="password_confirmation" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                                {match ? '✓ Confirmé' : 'Confirmation'}
                                            </label>
                                            <input
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Confirmez le mot de passe"
                                                className={`w-full h-[46px] px-4 bg-[#f5f5f7] border rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-200 ${
                                                    match ? 'border-[#34c759] bg-[#e8faf0] focus:ring-[#34c759]/15' : 'border-transparent hover:bg-[#e8e8ed] focus:bg-white focus:border-[#0071e3] focus:ring-[#0071e3]/15'
                                                }`}
                                                value={formData.password_confirmation}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password strength segmented bar */}
                                    {formData.password.length > 0 && (
                                        <div className="space-y-1.5 mt-1 animate-fadeIn">
                                            <div className="flex gap-1 h-[4px]">
                                                {[1, 2, 3, 4].map(idx => {
                                                    let bg = 'bg-[#e5e5ea]';
                                                    if (strength >= idx) {
                                                        if (strength === 1) bg = 'bg-[#ff3b30]'; // Red
                                                        else if (strength === 2) bg = 'bg-[#ff9500]'; // Orange
                                                        else if (strength === 3) bg = 'bg-[#ffcc00]'; // Yellow
                                                        else bg = 'bg-[#34c759]'; // Green
                                                    }
                                                    return <div key={idx} className={`flex-1 h-full rounded-full transition-all duration-300 ${bg}`} />;
                                                })}
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-right">
                                                {strength === 1 && 'Très Faible'}
                                                {strength === 2 && 'Moyen'}
                                                {strength === 3 && 'Sécurisé'}
                                                {strength === 4 && 'Excellent'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 3: Academic Details */}
                            {step === 3 && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="bg-[#f5f5f7]/60 rounded-[14px] border border-black/5 p-4 space-y-4 shadow-apple-xs">
                                        <div className="space-y-1.5">
                                            <label htmlFor="institution" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                                Institution / Université
                                            </label>
                                            <input
                                                id="institution"
                                                name="institution"
                                                type="text"
                                                placeholder="Ex: IGA Casablanca"
                                                className="w-full h-[46px] px-4 bg-white hover:bg-[#f5f5f7] focus:bg-white border border-black/[0.08] hover:border-black/[0.15] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                                value={formData.institution}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            {formData.role === 'STUDENT' ? (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label htmlFor="filiere" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                                            Filière
                                                        </label>
                                                        <input
                                                            id="filiere"
                                                            name="filiere"
                                                            type="text"
                                                            placeholder="Ex: Génie Logiciel"
                                                            className="w-full h-[46px] px-4 bg-white hover:bg-[#f5f5f7] focus:bg-white border border-black/[0.08] hover:border-black/[0.15] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                                            value={formData.filiere}
                                                            onChange={handleChange}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label htmlFor="nv" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                                            Niveau
                                                        </label>
                                                        <input
                                                            id="nv"
                                                            name="nv"
                                                            type="text"
                                                            placeholder="Ex: 5ème année"
                                                            className="w-full h-[46px] px-4 bg-white hover:bg-[#f5f5f7] focus:bg-white border border-black/[0.08] hover:border-black/[0.15] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                                            value={formData.nv}
                                                            onChange={handleChange}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label htmlFor="department" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                                            Département
                                                        </label>
                                                        <input
                                                            id="department"
                                                            name="department"
                                                            type="text"
                                                            placeholder="Ex: Informatique"
                                                            className="w-full h-[46px] px-4 bg-white hover:bg-[#f5f5f7] focus:bg-white border border-black/[0.08] hover:border-black/[0.15] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                                            value={formData.department}
                                                            onChange={handleChange}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label htmlFor="laboratory" className="block text-[13px] font-semibold text-[#1d1d1f]">
                                                            Laboratoire
                                                        </label>
                                                        <input
                                                            id="laboratory"
                                                            name="laboratory"
                                                            type="text"
                                                            placeholder="Ex: Labo IA"
                                                            className="w-full h-[46px] px-4 bg-white hover:bg-[#f5f5f7] focus:bg-white border border-black/[0.08] hover:border-black/[0.15] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[12px] outline-none text-[14px] text-[#1d1d1f] font-medium transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                                            value={formData.laboratory}
                                                            onChange={handleChange}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Credentials and Experience (Teachers/Researchers only) */}
                            {step === 4 && formData.role !== 'STUDENT' && (
                                <div className="space-y-3.5 animate-fadeIn max-h-[300px] overflow-y-auto px-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Diploma upload */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5">
                                                Diplôme (PDF/JPG)
                                            </label>
                                            <div className="relative">
                                                <div className={`w-full h-[40px] rounded-[10px] flex items-center gap-3 cursor-pointer overflow-hidden px-3 border transition-all ${diploma ? 'border-[#34c759] bg-[#e8faf0]' : 'border-transparent bg-[#f5f5f7] hover:bg-[#ebebeb]'}`}>
                                                    <input 
                                                        type="file" 
                                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                                        onChange={(e) => setDiploma(e.target.files[0])} 
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />
                                                    <span className={`material-symbols-outlined text-[18px] ${diploma ? 'text-[#1a9a47]' : 'text-gray-400'}`}>
                                                        document_scanner
                                                    </span>
                                                    <span className={`text-[11px] font-semibold truncate ${diploma ? 'text-[#1a9a47]' : 'text-[#86868b]'}`}>
                                                        {diploma ? diploma.name : 'Importer un diplôme'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Certif upload */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5">
                                                Certification (PDF/JPG)
                                            </label>
                                            <div className="relative">
                                                <div className={`w-full h-[40px] rounded-[10px] flex items-center gap-3 cursor-pointer overflow-hidden px-3 border transition-all ${certification ? 'border-[#34c759] bg-[#e8faf0]' : 'border-transparent bg-[#f5f5f7] hover:bg-[#ebebeb]'}`}>
                                                    <input 
                                                        type="file" 
                                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                                        onChange={(e) => setCertification(e.target.files[0])} 
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />
                                                    <span className={`material-symbols-outlined text-[18px] ${certification ? 'text-[#1a9a47]' : 'text-gray-400'}`}>
                                                        workspace_premium
                                                    </span>
                                                    <span className={`text-[11px] font-semibold truncate ${certification ? 'text-[#1a9a47]' : 'text-[#86868b]'}`}>
                                                        {certification ? certification.name : 'Importer un certificat'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Experience sub-panel */}
                                    <div className="bg-[#f5f5f7]/60 rounded-[14px] border border-black/5 p-3.5 space-y-2.5 shadow-apple-xs">
                                        <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px] text-[#0071e3]">work</span>
                                            Dernière expérience académique
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                            <input name="exp_title" type="text" className="w-full h-[36px] bg-white hover:bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:bg-white focus:border-[#0071e3] rounded-[8px] px-3 text-xs outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all shadow-sm" placeholder="Dernier poste" value={formData.exp_title} onChange={handleChange} />
                                            <input name="exp_org" type="text" className="w-full h-[36px] bg-white hover:bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:bg-white focus:border-[#0071e3] rounded-[8px] px-3 text-xs outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all shadow-sm" placeholder="Entreprise / Université" value={formData.exp_org} onChange={handleChange} />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {/* Beautiful Custom Dropdown Selector */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsExpTypeOpen(!isExpTypeOpen)}
                                                    className="w-full h-[36px] px-3 bg-white hover:bg-[#f5f5f7] border border-[#d2d2d7] hover:border-[#86868b] focus:border-[#0071e3] rounded-[8px] text-xs outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all cursor-pointer shadow-sm font-semibold flex items-center justify-between text-[#1d1d1f]"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[15px] text-[#86868b]">
                                                            {formData.exp_type === 'INTERNSHIP' && 'explore'}
                                                            {formData.exp_type === 'TEACHING' && 'menu_book'}
                                                            {formData.exp_type === 'RESEARCH' && 'science'}
                                                            {formData.exp_type === 'OTHER' && 'more_horiz'}
                                                        </span>
                                                        {formData.exp_type === 'INTERNSHIP' && 'STAGE'}
                                                        {formData.exp_type === 'TEACHING' && 'ENSEIGNEMENT'}
                                                        {formData.exp_type === 'RESEARCH' && 'RECHERCHE'}
                                                        {formData.exp_type === 'OTHER' && 'AUTRE'}
                                                    </span>
                                                    <span className="material-symbols-outlined text-[15px] text-gray-400 transition-transform duration-200" style={{ transform: isExpTypeOpen ? 'rotate(180deg)' : 'none' }}>
                                                        expand_more
                                                    </span>
                                                </button>

                                                {isExpTypeOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setIsExpTypeOpen(false)} />
                                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-black/5 rounded-[10px] shadow-apple-md py-1 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-[11px]">
                                                            {[
                                                                { value: 'INTERNSHIP', label: 'STAGE', icon: 'explore' },
                                                                { value: 'TEACHING', label: 'ENSEIGNEMENT', icon: 'menu_book' },
                                                                { value: 'RESEARCH', label: 'RECHERCHE', icon: 'science' },
                                                                { value: 'OTHER', label: 'AUTRE', icon: 'more_horiz' }
                                                            ].map((opt) => (
                                                                <button
                                                                    key={opt.value}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, exp_type: opt.value });
                                                                        setIsExpTypeOpen(false);
                                                                    }}
                                                                    className={`w-full px-3 py-2 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between ${
                                                                        formData.exp_type === opt.value ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                                                    }`}
                                                                >
                                                                    <span className="flex items-center gap-1.5">
                                                                        <span className="material-symbols-outlined text-[15px]">
                                                                            {opt.icon}
                                                                        </span>
                                                                        {opt.label}
                                                                    </span>
                                                                    {formData.exp_type === opt.value && (
                                                                        <span className="material-symbols-outlined text-[15px] text-[#0071e3] font-bold">
                                                                            check
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <input name="exp_duration" type="text" className="w-full h-[36px] bg-white hover:bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:bg-white focus:border-[#0071e3] rounded-[8px] px-3 text-xs outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all shadow-sm" placeholder="Durée (ex: 6 mois)" value={formData.exp_duration} onChange={handleChange} />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                            <input name="cert_title" type="text" className="w-full h-[36px] bg-white hover:bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:bg-white focus:border-[#0071e3] rounded-[8px] px-3 text-xs outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all shadow-sm" placeholder="Dernier certificat" value={formData.cert_title} onChange={handleChange} />
                                            <input name="cert_org" type="text" className="w-full h-[36px] bg-white hover:bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:bg-white focus:border-[#0071e3] rounded-[8px] px-3 text-xs outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all shadow-sm" placeholder="Organisme certificateur" value={formData.cert_org} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stepper Navigation Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 h-[46px] rounded-full border border-gray-200 hover:bg-gray-50 text-[#6e6e73] text-[15px] font-semibold flex items-center justify-center gap-1.5 transition-all press-effect bg-white"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                                        Précédent
                                    </button>
                                )}
                                
                                {step < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex-1 h-[46px] rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[15px] font-semibold shadow-apple-blue flex items-center justify-center gap-1.5 transition-all press-effect"
                                    >
                                        Suivant
                                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 h-[46px] rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[15px] font-semibold shadow-apple-blue flex items-center justify-center gap-1.5 transition-all press-effect disabled:opacity-40"
                                    >
                                        {loading ? (
                                            <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Créer mon compte
                                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-[14px] text-[#6e6e73]">
                                Déjà inscrit ?{' '}
                                <Link to="/login" className="text-[#0071e3] font-bold hover:underline">
                                    Se connecter
                                </Link>
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Register;
