import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CheckCircle2, AlertCircle, TriangleAlert } from 'lucide-react';
import Logo from './Logo';
import './CollegeSelection.css'; // Reusing this CSS and extending it
import './Auth.css'; // Reusing these styles for forms

const colleges = [
    { name: "St. Stephen's College, Delhi", id: 1, type: "Academic" },
    { name: "Hindu College, Delhi", id: 2, type: "Cultural" },
    { name: "Miranda House, Delhi", id: 3, type: "Women's College" },
    { name: "Shri Ram College of Commerce (SRCC), Delhi", id: 4, type: "Business" },
    { name: "Lady Shri Ram College for Women (LSR), Delhi", id: 5, type: "Liberal Arts" },
    { name: "Indian Institute of Technology Delhi (IIT Delhi)", id: 6, type: "Tech" },
    { name: "Delhi Technological University (DTU), Delhi", id: 7, type: "Engineering" },
    { name: "Netaji Subhas University of Technology (NSUT), Delhi", id: 8, type: "Tech" },
    { name: "Indraprastha Institute of Information Technology Delhi (IIIT-D)", id: 9, type: "Tech" },
    { name: "Jaypee Institute of Information Technology (JIIT), Noida", id: 10, type: "Engineering" },
    { name: "Amity University, Noida", id: 11, type: "Private" },
    { name: "Sharda University, Greater Noida", id: 12, type: "Global" },
    { name: "Ashoka University, Sonipat (NCR)", id: 13, type: "Liberal Arts" },
    { name: "O.P. Jindal Global University, Sonipat (NCR)", id: 14, type: "Law/Business" },
];

const slides = [
    {
        title: "Discover Your Path",
        description: "Connect with students from top colleges across the country.",
        image: "/images/campus.png"
    },
    {
        title: "Vibrant Communities",
        description: "Join groups, attend events, and make lifelong memories.",
        image: "/images/social.png"
    },
    {
        title: "Academic Excellence",
        description: "Access resources and study groups tailored to your curriculum.",
        image: "/images/library.png"
    },
    {
        title: "Campus Life",
        description: "Stay updated with everything happening on your campus.",
        image: "/images/sports.png"
    }
];

const AuthPage = () => {
    // Shared State
    const [step, setStep] = useState('select-college'); // select-college, email, password, name, otp, username-password
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { login, register, checkEmail, sendOTP, verifyOTP, checkUsername, loading } = useAuth();

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        otp: '',
        username: '',
        college: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [isDeactivatedAccount, setIsDeactivatedAccount] = useState(false);


    // Helper: Debounced username check
    let usernameTimeout;
    const debouncedCheckUsername = (username) => {
        clearTimeout(usernameTimeout);
        usernameTimeout = setTimeout(async () => {
            const result = await checkUsername(username);
            setUsernameAvailable(result.available);
        }, 500);
    };

    // Auto-clear messages after 3 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    // Slideshow logic
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);


    // Search suggestions logic
    useEffect(() => {
        if (step === 'select-college' && searchQuery.trim().length > 0) {
            const filtered = colleges.filter(college =>
                college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                college.type.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    }, [searchQuery, step]);

    // Handlers
    const handleCollegeSelect = (college) => {
        setFormData(prev => ({ ...prev, college: college.name }));
        setStep('email');
        setSearchQuery('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'username') {
            const sanitized = value.toLowerCase().replace(/\s/g, '');
            setFormData(prev => ({ ...prev, username: sanitized }));
            if (sanitized.length > 2) {
                debouncedCheckUsername(sanitized);
            }
        }
    };


    // Handlers
    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email) {
            setError('Please enter your email address');
            return;
        }

        if (!validateEmail(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        setSubmitting(true);
        const result = await checkEmail(formData.email, formData.college);
        if (result.success) {
            if (result.exists && !result.isDeactivated) {
                setFormData(prev => ({ ...prev, username: result.username, name: result.name }));
                setStep('password');
                setSubmitting(false);
            } else {
                // NEW USER or DEACTIVATED - Send OTP immediately
                if (result.isDeactivated) {
                    setIsDeactivatedAccount(true);
                    setFormData(prev => ({ ...prev, username: result.username, name: result.name }));
                    setSuccess('Welcome back! Verify your mail to reactivate.');
                }
                const otpResult = await sendOTP(formData.email);
                if (otpResult.success) {
                    if (!result.isDeactivated) setSuccess('OTP sent to your email');
                    // Skip name step for deactivated accounts
                    setStep(result.isDeactivated ? 'otp' : 'name');
                } else {
                    setError(otpResult.message);
                }
                setSubmitting(false);
            }
        } else {
            setError(result.message);
            setSubmitting(false);
        }
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        setStep('otp');
    };

    const handleResendOTP = async () => {
        setSubmitting(true);
        const result = await sendOTP(formData.email);
        if (result.success) setSuccess('OTP sent to your email');
        else setError(result.message);
        setSubmitting(false);
    };

    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        const result = await verifyOTP(formData.email, formData.otp);
        if (result.success) {
            if (isDeactivatedAccount) {
                setStep('username-password'); // We still need the password, but we'll hide the username field
            } else {
                setStep('username-password');
            }
            setSuccess('');
        } else setError(result.message);
        setSubmitting(false);
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        const result = await register(formData);
        if (result.success) {
            setSuccess('Welcome to Campus Clan!');
            setTimeout(() => navigate('/dashboard'), 1500);
        } else setError(result.message);
        setSubmitting(false);
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        const result = await login(formData.email, formData.password);
        if (result.success) {
            setSuccess(`Welcome back, ${formData.username}!`);
            setTimeout(() => navigate('/dashboard'), 1500);
        } else {
            if (result.isDeactivated) {
                setError('Your account is deactivated. Please sign up to reactivate.');
            } else {
                setError(result.message);
            }
        }
        setSubmitting(false);
    };

    const ErrorMessage = ({ message }) => (
        <div className="error-container">
            <p className="error-text">
                <TriangleAlert size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                {message}
            </p>
        </div>
    );

    const Loader = () => (
        <div className="btn-loader">
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="college-selection">
            {/* Top Left Logo */}
            <div className="top-left-logo">
                <Logo size={40} showText={true} className="sidebar-logo" />
            </div>

            {/* Left Panel - Slideshow (Always Running) */}
            <div className="slideshow-panel">
                {slides.map((slide, index) => (
                    <div 
                        key={index} 
                        className={`slide ${index === currentSlide ? 'active' : ''}`}
                    >
                        <img src={slide.image} alt={slide.title} className="slide-image" />
                        <div className="slide-content">
                            <h2 className="slide-title">{slide.title}</h2>
                            <p className="slide-description">{slide.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Right Panel - Dynamic Auth Content */}
            <div className="search-panel">
                <div className="logo-container">
                    <Logo size={80} />
                    <h1 className="brand-name">Campus Clan</h1>
                    {formData.college && step !== 'select-college' && (
                        <p className="college-tag">{formData.college}</p>
                    )}
                </div>

                <div className="search-wrapper">
                    {step === 'select-college' && (
                        <div className="auth-step" key="select">
                            <div className="search-input-group">
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search your college..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {suggestions.length > 0 && (
                                    <div className="suggestions-list">
                                        {suggestions.map((college) => (
                                            <div
                                                key={college.id}
                                                className="suggestion-item"
                                                onClick={() => handleCollegeSelect(college)}
                                            >
                                                <div className="suggestion-info">
                                                    <span className="suggestion-name">{college.name}</span>
                                                    <span className="suggestion-type">{college.type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'email' && (
                        <div className="auth-step" key="email">
                            <form onSubmit={handleEmailSubmit} className="auth-form" noValidate>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="College Email"
                                    className="auth-input"
                                    required
                                    autoFocus
                                />
                                {error && <ErrorMessage message={error} />}
                                <button type="submit" className="auth-submit" disabled={submitting}>
    {submitting ? <Loader /> : "Next"}
</button>
                                <button type="button" className="auth-back" onClick={() => { setStep('select-college'); setIsDeactivatedAccount(false); }}>Change College</button>
                            </form>
                        </div>
                    )}

                    {step === 'password' && (
                        <div className="auth-step" key="password">
                            <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
                                <h2 className="welcome-greet">Welcome back, {formData.username}</h2>
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Password"
                                        className="auth-input"
                                        required
                                        autoFocus
                                    />
                                    <button 
                                        type="button" 
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                </div>
                                {error && <ErrorMessage message={error} />}
                                <button type="submit" className="auth-submit" disabled={submitting}>
    {submitting ? <Loader /> : "Login"}
</button>
                                <button type="button" className="auth-back" onClick={() => setStep('email')}>Not you?</button>
                            </form>
                        </div>
                    )}

                    {step === 'name' && (
                        <div className="auth-step" key="name">
                            <form onSubmit={handleNameSubmit} className="auth-form" noValidate>
                                <h2 className="welcome-greet">Welcome to Campus Clan!</h2>
                                <p className="auth-subtext">Let's get you started</p>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Your Full Name"
                                    className="auth-input"
                                    required
                                    autoFocus
                                />
                                {error && <ErrorMessage message={error} />}
                                <button type="submit" className="auth-submit" disabled={submitting}>
    {submitting ? <Loader /> : "Continue"}
</button>
                                <button type="button" className="auth-back" onClick={() => { setStep('email'); setIsDeactivatedAccount(false); }}>Back</button>
                            </form>
                        </div>
                    )}

                    {step === 'otp' && (
                        <div className="auth-step" key="otp">
                            <form onSubmit={handleOTPSubmit} className="auth-form" noValidate>
                                <h2 className="welcome-greet">Verify it's you</h2>
                                <p className="auth-subtext">Enter the OTP sent to {formData.email}</p>
                                <input
                                    type="text"
                                    name="otp"
                                    value={formData.otp}
                                    onChange={handleInputChange}
                                    placeholder="6-digit OTP"
                                    className="auth-input otp-input"
                                    maxLength="6"
                                    required
                                    autoFocus
                                />
                                <div className="message-container">
                                    {error && <ErrorMessage message={error} />}
                                    {success && <p className="success-text">{success}</p>}
                                </div>
                                <button type="submit" className="auth-submit" disabled={submitting}>
    {submitting ? <Loader /> : "Verify"}
</button>
                                <button 
                                    type="button" 
                                    className="auth-back" 
                                    onClick={handleResendOTP}
                                    disabled={submitting}
                                >
                                    {submitting ? "Sending..." : "Resend OTP"}
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 'username-password' && (
                        <div className="auth-step" key="final">
                            <form onSubmit={handleFinalSubmit} className="auth-form" noValidate>
                                <h2 className="welcome-greet">{isDeactivatedAccount ? "Reactivate Account" : "Almost there!"}</h2>
                                <p className="auth-subtext">{isDeactivatedAccount ? "Set a new password to continue" : "Choose your unique handle"}</p>
                                
                                {!isDeactivatedAccount && (
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            placeholder="username"
                                            className={`auth-input username-field ${usernameAvailable === true ? 'available' : usernameAvailable === false ? 'taken' : ''}`}
                                            required
                                        />
                                        {usernameAvailable === true && <span className="input-tip"><CheckCircle2 size={12} style={{ marginRight: '4px' }} />Available!</span>}
                                        {usernameAvailable === false && <span className="input-tip taken"><AlertCircle size={12} style={{ marginRight: '4px' }} />Already taken</span>}
                                    </div>
                                )}
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Set Password"
                                        className="auth-input"
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                </div>
                                <div className="message-container">
                                    {error && <ErrorMessage message={error} />}
                                    {success && <p className="success-text">{success}</p>}
                                </div>
                                <button type="submit" className="auth-submit" disabled={submitting || (!isDeactivatedAccount && usernameAvailable === false)}>
                                    {submitting ? <Loader /> : (isDeactivatedAccount ? "Reactivate & Login" : "Create Account")}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                <p className="footer-text">Powered by Campus Clan © 2026</p>
            </div>
        </div>
    );
};

export default AuthPage;
