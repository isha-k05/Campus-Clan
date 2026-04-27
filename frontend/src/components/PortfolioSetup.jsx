import { useState, useEffect } from 'react';
import { 
    X, 
    ArrowRight, 
    ArrowLeft, 
    Check, 
    Plus, 
    Trash2, 
    Upload, 
    GraduationCap, 
    BookOpen, 
    Zap, 
    Trophy, 
    Target,
    Link,
    Globe,
    Mail,
    Minus,
    Award,
    Briefcase,
    User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import './PortfolioSetup.css';

const PortfolioSetup = ({ onComplete, onSkip }) => {
    const [step, setStep] = useState(() => {
        const hasSeenWelcome = localStorage.getItem('hasSeenPortfolioWelcome');
        return hasSeenWelcome ? 1 : 0;
    });
    const [errors, setErrors] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [portfolio, setPortfolio] = useState(() => {
        const saved = localStorage.getItem('userPortfolio');
        return saved ? JSON.parse(saved) : {
            profile: { year: '', semester: '1', branch: '', rollNo: '', mentor: '', bio: '', picture: '' },
            academics: { 
                lastSGPA: '', 
                cgpa: '', 
                scholarship: { has: false, name: '', amount: '', year: '' }, 
                awards: { has: false, name: '' }, 
                courses: [], 
                research: { has: false, title: '', status: 'Published' } 
            },
            skills: { communication: 3, problemSolving: 3, teamwork: 3, technical: 3, leadership: 3, timeManagement: 3 },
            activities: { 
                club: { has: false, name: '', role: 'Member' }, 
                workshops: [], 
                internship: { has: false, company: '', role: '', duration: '', status: 'Completed' } 
            },
            competitions: [],
            goals: { careerGoal: '', openToMentorship: false, linkedin: '', github: '', leadership: { has: false, name: '', org: '' }, volunteering: { has: false, desc: '' } }
        };
    });

    useEffect(() => {
        localStorage.setItem('userPortfolio', JSON.stringify(portfolio));
    }, [portfolio]);

    const handleStepChange = (newStep) => {
        if (newStep > step) {
            if (!validateStep(step)) return;
        }
        setStep(newStep);
        setErrors({});
        
        // Scroll the main content container to top
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const validateStep = (currentStep) => {
        let newErrors = {};
        if (currentStep === 1) {
            if (!portfolio.profile.year) newErrors.year = true;
            if (!portfolio.profile.branch) newErrors.branch = true;
            if (!portfolio.profile.rollNo) newErrors.rollNo = true;
            if (!portfolio.profile.mentor) newErrors.mentor = true;
            if (!portfolio.profile.bio) newErrors.bio = true;
        } else if (currentStep === 2) {
            if (!portfolio.academics.lastSGPA) newErrors.lastSGPA = true;
            if (!portfolio.academics.cgpa) newErrors.cgpa = true;
        } else if (currentStep === 5) {
            if (!portfolio.goals.careerGoal) newErrors.careerGoal = true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadToCloudinary = async (file) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'campus_clan'); // User must create this unsigned preset

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/dn06c87ie/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setIsUploading(false);
            return data.secure_url;
        } catch (err) {
            console.error('Cloudinary upload error:', err);
            setIsUploading(false);
            alert('Upload failed. Check your internet or Cloudinary preset.');
            return null;
        }
    };

    const updatePortfolio = (section, data) => {
        setPortfolio(prev => {
            // Fix: If section is an array, replace it directly. 
            // If it's an object, merge it.
            const newValue = Array.isArray(data) ? data : { ...prev[section], ...data };
            return {
                ...prev,
                [section]: newValue
            };
        });
        
        // Clear errors for fields being updated
        if (Object.keys(errors).length > 0 && !Array.isArray(data)) {
            setErrors(prev => {
                const newErrors = { ...prev };
                Object.keys(data).forEach(key => delete newErrors[key]);
                return newErrors;
            });
        }
    };

    const handleComplete = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#E8521A', '#FAF8F5', '#FFD700']
        });
        localStorage.setItem('portfolioComplete', 'true');
        onComplete(portfolio);
    };

    const renderWelcome = () => (
        <div className="setup-welcome">
            <div className="welcome-icon"><GraduationCap size={48} /></div>
            <h1>Build Your Professional Portfolio</h1>
            <p>Answer a few questions to showcase your full story to teachers and peers. Professional and concise.</p>
            <button className="primary-btn large" onClick={() => {
                localStorage.setItem('hasSeenPortfolioWelcome', 'true');
                handleStepChange(1);
            }}>Get Started</button>
            <button className="skip-link" onClick={onSkip}>Skip for now</button>
        </div>
    );

    const renderProgressBar = () => (
        <div className="setup-progress">
            <div className="progress-text">Step {step} of 5</div>
            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
            </div>
        </div>
    );

    const renderTab1 = () => (
        <div className="setup-tab">
            <h2><User className="tab-icon" /> My Profile</h2>
            <div className="profile-upload-section">
                <div className="picture-preview-large">
                    {portfolio.profile.picture ? (
                        <img src={portfolio.profile.picture} alt="Profile" />
                    ) : (
                        <div className="placeholder-icon"><User size={40} /></div>
                    )}
                    <label className="change-pic-btn">
                        {isUploading ? <div className="loader-small" /> : <Plus size={20} />}
                        <input type="file" hidden accept="image/*" onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const url = await uploadToCloudinary(file);
                                if (url) updatePortfolio('profile', { picture: url });
                            }
                        }} />
                    </label>
                </div>
                <div className="upload-info">
                    <h3>Profile Picture</h3>
                    <p>Add a professional photo for your portfolio</p>
                </div>
            </div>
            <div className="form-grid">
                <div className={`form-group ${errors.year ? 'has-error' : ''}`}>
                    <label>Year of Study</label>
                    <div className="radio-group">
                        {['1st', '2nd', '3rd', '4th'].map(year => (
                            <label key={year} className={`radio-label ${portfolio.profile.year === year ? 'active' : ''}`}>
                                <input 
                                    type="radio" 
                                    name="year" 
                                    value={year} 
                                    checked={portfolio.profile.year === year}
                                    onChange={(e) => updatePortfolio('profile', { year: e.target.value })}
                                />
                                {year} Year
                            </label>
                        ))}
                    </div>
                    {errors.year && <span className="error-msg">Fill it first</span>}
                </div>
                <div className="form-group">
                    <label>Semester</label>
                    <select 
                        value={portfolio.profile.semester}
                        onChange={(e) => updatePortfolio('profile', { semester: e.target.value })}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                </div>
                <div className={`form-group ${errors.branch ? 'has-error' : ''}`}>
                    <label>Branch / Department</label>
                    <select 
                        value={portfolio.profile.branch}
                        onChange={(e) => updatePortfolio('profile', { branch: e.target.value })}
                    >
                        <option value="">Select Branch</option>
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                        <option value="Data Science & AI">Data Science & AI</option>
                        <option value="Chemical Engineering">Chemical Engineering</option>
                    </select>
                    {errors.branch && <span className="error-msg">Fill it first</span>}
                </div>
                <div className={`form-group ${errors.rollNo ? 'has-error' : ''}`}>
                    <label>Roll Number / Enrollment No</label>
                    <input 
                        type="text" 
                        placeholder="e.g. 2021CS101" 
                        value={portfolio.profile.rollNo}
                        onChange={(e) => updatePortfolio('profile', { rollNo: e.target.value })}
                    />
                    {errors.rollNo && <span className="error-msg">Fill it first</span>}
                </div>
                <div className={`form-group ${errors.mentor ? 'has-error' : ''}`}>
                    <label>Mentor / Advisor Name</label>
                    <select 
                        value={portfolio.profile.mentor}
                        onChange={(e) => updatePortfolio('profile', { mentor: e.target.value })}
                    >
                        <option value="">Select Mentor</option>
                        <option value="Prof. Rajesh Sharma">Prof. Rajesh Sharma</option>
                        <option value="Dr. Ananya Iyer">Dr. Ananya Iyer</option>
                        <option value="Prof. Vikram Malhotra">Prof. Vikram Malhotra</option>
                        <option value="Dr. Sunita Deshmukh">Dr. Sunita Deshmukh</option>
                        <option value="Prof. Amit Trivedi">Prof. Amit Trivedi</option>
                        <option value="Dr. Meera Reddy">Dr. Meera Reddy</option>
                        <option value="Prof. Sandeep Gupta">Prof. Sandeep Gupta</option>
                        <option value="Dr. Kavita Nair">Dr. Kavita Nair</option>
                    </select>
                    {errors.mentor && <span className="error-msg">Fill it first</span>}
                </div>
                <div className={`form-group full-width ${errors.bio ? 'has-error' : ''}`}>
                    <label>One-line Bio (max 100 chars)</label>
                    <textarea 
                        maxLength={100}
                        placeholder="Tech enthusiast, aspiring software engineer..."
                        value={portfolio.profile.bio}
                        onChange={(e) => updatePortfolio('profile', { bio: e.target.value })}
                    />
                    <div className="bio-footer">
                        <small>{portfolio.profile.bio.length}/100</small>
                        {errors.bio && <span className="error-msg">Fill it first</span>}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTab2 = () => (
        <div className="setup-tab">
            <h2><BookOpen className="tab-icon" /> Academics</h2>
            <div className="form-grid">
                <div className={`form-group ${errors.lastSGPA ? 'has-error' : ''}`}>
                    <label>Last Semester SGPA</label>
                    <input 
                        type="number" 
                        min="0" max="10" step="0.01"
                        value={portfolio.academics.lastSGPA}
                        onChange={(e) => updatePortfolio('academics', { lastSGPA: e.target.value })}
                    />
                    {errors.lastSGPA && <span className="error-msg">Fill it first</span>}
                </div>
                <div className={`form-group ${errors.cgpa ? 'has-error' : ''}`}>
                    <label>Current CGPA</label>
                    <input 
                        type="number" 
                        min="0" max="10" step="0.01"
                        value={portfolio.academics.cgpa}
                        onChange={(e) => updatePortfolio('academics', { cgpa: e.target.value })}
                    />
                    {errors.cgpa && <span className="error-msg">Fill it first</span>}
                </div>
                
                <div className="form-group full-width toggle-section">
                    <div className="toggle-header">
                        <label>Scholarship received?</label>
                        <div className="pill-selector">
                            <button 
                                className={!portfolio.academics.scholarship.has ? 'active' : ''}
                                onClick={() => updatePortfolio('academics', { scholarship: { ...portfolio.academics.scholarship, has: false } })}
                            >
                                No
                            </button>
                            <button 
                                className={portfolio.academics.scholarship.has ? 'active' : ''}
                                onClick={() => updatePortfolio('academics', { scholarship: { ...portfolio.academics.scholarship, has: true } })}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                    {portfolio.academics.scholarship.has && (
                        <div className="sub-form">
                            <input placeholder="Scholarship Name" value={portfolio.academics.scholarship.name} onChange={(e) => updatePortfolio('academics', { scholarship: { ...portfolio.academics.scholarship, name: e.target.value } })} />
                            <input placeholder="Amount" value={portfolio.academics.scholarship.amount} onChange={(e) => updatePortfolio('academics', { scholarship: { ...portfolio.academics.scholarship, amount: e.target.value } })} />
                            <input placeholder="Year" value={portfolio.academics.scholarship.year} onChange={(e) => updatePortfolio('academics', { scholarship: { ...portfolio.academics.scholarship, year: e.target.value } })} />
                        </div>
                    )}
                </div>

                <div className="form-group full-width toggle-section">
                    <div className="toggle-header">
                        <label>Academic awards/honors?</label>
                        <div className="pill-selector">
                            <button 
                                className={!portfolio.academics.awards.has ? 'active' : ''}
                                onClick={() => updatePortfolio('academics', { awards: { ...portfolio.academics.awards, has: false } })}
                            >
                                No
                            </button>
                            <button 
                                className={portfolio.academics.awards.has ? 'active' : ''}
                                onClick={() => updatePortfolio('academics', { awards: { ...portfolio.academics.awards, has: true } })}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                    {portfolio.academics.awards.has && (
                        <div className="sub-form">
                            <input placeholder="Award Name (e.g. Dean's List)" value={portfolio.academics.awards.name} onChange={(e) => updatePortfolio('academics', { awards: { ...portfolio.academics.awards, name: e.target.value } })} />
                        </div>
                    )}
                </div>

                <div className="form-group full-width">
                    <label>Online courses/certifications</label>
                    {portfolio.academics.courses.map((course, idx) => (
                        <div key={idx} className="repeatable-item">
                            <input placeholder="Course Name" value={course.name} onChange={(e) => {
                                const newCourses = [...portfolio.academics.courses];
                                newCourses[idx].name = e.target.value;
                                updatePortfolio('academics', { courses: newCourses });
                            }} />
                            <select value={course.platform} onChange={(e) => {
                                const newCourses = [...portfolio.academics.courses];
                                newCourses[idx].platform = e.target.value;
                                updatePortfolio('academics', { courses: newCourses });
                            }}>
                                <option value="Coursera">Coursera</option>
                                <option value="NPTEL">NPTEL</option>
                                <option value="Udemy">Udemy</option>
                                <option value="Other">Other</option>
                            </select>
                            <div className="file-upload">
                                <label className="upload-label">
                                    {isUploading ? '...' : <Upload size={14} />} {course.certificate ? 'Change Cert' : 'Upload Cert'}
                                    <input type="file" hidden onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const url = await uploadToCloudinary(file);
                                            if (url) {
                                                const newCourses = [...portfolio.academics.courses];
                                                newCourses[idx].certificate = url;
                                                updatePortfolio('academics', { courses: newCourses });
                                            }
                                        }
                                    }} />
                                </label>
                                {course.certificate && <div className="preview-mini"><img src={course.certificate} alt="Cert" /></div>}
                            </div>
                            <button className="delete-btn" onClick={() => {
                                const newCourses = portfolio.academics.courses.filter((_, i) => i !== idx);
                                updatePortfolio('academics', { courses: newCourses });
                            }}><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button className="add-btn" onClick={() => updatePortfolio('academics', { courses: [...portfolio.academics.courses, { name: '', platform: 'Coursera', certificate: '' }] })}>
                        <Plus size={16} /> Add Course
                    </button>
                </div>

                <div className="form-group full-width toggle-section">
                    <div className="toggle-header">
                        <label>Research paper?</label>
                        <div className="pill-selector">
                            <button 
                                className={!portfolio.academics.research.has ? 'active' : ''}
                                onClick={() => updatePortfolio('academics', { research: { ...portfolio.academics.research, has: false } })}
                            >
                                No
                            </button>
                            <button 
                                className={portfolio.academics.research.has ? 'active' : ''}
                                onClick={() => updatePortfolio('academics', { research: { ...portfolio.academics.research, has: true } })}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                    {portfolio.academics.research.has && (
                        <div className="sub-form">
                            <input placeholder="Paper Title" value={portfolio.academics.research.title} onChange={(e) => updatePortfolio('academics', { research: { ...portfolio.academics.research, title: e.target.value } })} />
                            <select value={portfolio.academics.research.status} onChange={(e) => updatePortfolio('academics', { research: { ...portfolio.academics.research, status: e.target.value } })}>
                                <option value="Published">Published</option>
                                <option value="Under Review">Under Review</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderTab3 = () => (
        <div className="setup-tab">
            <h2><Zap className="tab-icon" /> Skills & Activities</h2>
            <div className="skills-grid">
                {Object.keys(portfolio.skills).map(skill => (
                    <div key={skill} className="skill-slider">
                        <label>{skill.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                        <div className="slider-container">
                            <input 
                                type="range" min="1" max="5" 
                                value={portfolio.skills[skill]}
                                onChange={(e) => updatePortfolio('skills', { [skill]: parseInt(e.target.value) })}
                            />
                            <span className="slider-val">{portfolio.skills[skill]}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="form-grid" style={{ marginTop: '2rem' }}>
                <div className="form-group full-width toggle-section">
                    <div className="toggle-header">
                        <label>Part of any college club/society?</label>
                        <div className="pill-selector">
                            <button 
                                className={!portfolio.activities.club.has ? 'active' : ''}
                                onClick={() => updatePortfolio('activities', { club: { ...portfolio.activities.club, has: false } })}
                            >
                                No
                            </button>
                            <button 
                                className={portfolio.activities.club.has ? 'active' : ''}
                                onClick={() => updatePortfolio('activities', { club: { ...portfolio.activities.club, has: true } })}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                    {portfolio.activities.club.has && (
                        <div className="sub-form">
                            <input placeholder="Club Name" value={portfolio.activities.club.name} onChange={(e) => updatePortfolio('activities', { club: { ...portfolio.activities.club, name: e.target.value } })} />
                            <select value={portfolio.activities.club.role} onChange={(e) => updatePortfolio('activities', { club: { ...portfolio.activities.club, role: e.target.value } })}>
                                <option value="Member">Member</option>
                                <option value="Secretary">Secretary</option>
                                <option value="President">President</option>
                                <option value="Lead">Lead</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="form-group full-width">
                    <label>Workshops/Trainings attended</label>
                    {portfolio.activities.workshops.map((ws, idx) => (
                        <div key={idx} className="repeatable-item">
                            <input placeholder="Workshop Name" value={ws.name} onChange={(e) => {
                                const newWS = [...portfolio.activities.workshops];
                                newWS[idx].name = e.target.value;
                                updatePortfolio('activities', { workshops: newWS });
                            }} />
                            <input placeholder="Duration (e.g. 2 Days)" value={ws.duration} onChange={(e) => {
                                const newWS = [...portfolio.activities.workshops];
                                newWS[idx].duration = e.target.value;
                                updatePortfolio('activities', { workshops: newWS });
                            }} />
                            <div className="file-upload">
                                <label className="upload-label">
                                    {isUploading ? '...' : <Upload size={14} />} Cert
                                    <input type="file" hidden onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const url = await uploadToCloudinary(file);
                                            if (url) {
                                                const newWS = [...portfolio.activities.workshops];
                                                newWS[idx].certificate = url;
                                                updatePortfolio('activities', { workshops: newWS });
                                            }
                                        }
                                    }} />
                                </label>
                                {ws.certificate && <div className="preview-mini"><img src={ws.certificate} alt="Cert" /></div>}
                            </div>
                            <button className="delete-btn" onClick={() => {
                                const newWS = portfolio.activities.workshops.filter((_, i) => i !== idx);
                                updatePortfolio('activities', { workshops: newWS });
                            }}><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button className="add-btn" onClick={() => updatePortfolio('activities', { workshops: [...portfolio.activities.workshops, { name: '', duration: '', certificate: '' }] })}>
                        <Plus size={16} /> Add Workshop
                    </button>
                </div>

                <div className="form-group full-width toggle-section">
                    <div className="toggle-header">
                        <label>Internship?</label>
                        <div className="pill-selector">
                            <button 
                                className={!portfolio.activities.internship.has ? 'active' : ''}
                                onClick={() => updatePortfolio('activities', { internship: { ...portfolio.activities.internship, has: false } })}
                            >
                                No
                            </button>
                            <button 
                                className={portfolio.activities.internship.has ? 'active' : ''}
                                onClick={() => updatePortfolio('activities', { internship: { ...portfolio.activities.internship, has: true } })}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                    {portfolio.activities.internship.has && (
                        <div className="sub-form">
                            <input placeholder="Company Name" value={portfolio.activities.internship.company} onChange={(e) => updatePortfolio('activities', { internship: { ...portfolio.activities.internship, company: e.target.value } })} />
                            <input placeholder="Role/Position" value={portfolio.activities.internship.role} onChange={(e) => updatePortfolio('activities', { internship: { ...portfolio.activities.internship, role: e.target.value } })} />
                            <input placeholder="Duration" value={portfolio.activities.internship.duration} onChange={(e) => updatePortfolio('activities', { internship: { ...portfolio.activities.internship, duration: e.target.value } })} />
                            <div className="file-upload">
                                <label className="upload-label">
                                    {isUploading ? '...' : <Upload size={14} />} Offer/Cert
                                    <input type="file" hidden onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const url = await uploadToCloudinary(file);
                                            if (url) updatePortfolio('activities', { internship: { ...portfolio.activities.internship, certificate: url } });
                                        }
                                    }} />
                                </label>
                                {portfolio.activities.internship.certificate && <div className="preview-mini"><img src={portfolio.activities.internship.certificate} alt="Cert" /></div>}
                            </div>
                            <select value={portfolio.activities.internship.status} onChange={(e) => updatePortfolio('activities', { internship: { ...portfolio.activities.internship, status: e.target.value } })}>
                                <option value="Completed">Completed</option>
                                <option value="Ongoing">Ongoing</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const categories = [
        "Hackathon", "Debate/MUN", "Cultural Events", "Sports", 
        "Business/Case Study", "Science Exhibition", "Drama/Dance/Music", 
        "Quiz", "Robotics/Tech Fest", "Other"
    ];

    const renderTab4 = () => (
        <div className="setup-tab">
            <h2><Trophy className="tab-icon" /> Competitions & Sports</h2>
            <p className="tab-desc">Tap categories you've participated in:</p>
            <div className="category-grid">
                {categories.map(cat => {
                    const isSelected = portfolio.competitions.some(c => c.category === cat);
                    return (
                        <button 
                            key={cat} 
                            className={`cat-tile ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                                if (isSelected) {
                                    updatePortfolio('competitions', portfolio.competitions.filter(c => c.category !== cat));
                                } else {
                                    updatePortfolio('competitions', [...portfolio.competitions, { category: cat, events: [] }]);
                                }
                            }}
                        >
                            {cat}
                        </button>
                    );
                })}
            </div>

            <div className="competition-forms">
                {portfolio.competitions.map((comp, idx) => (
                    <div key={comp.category} className="comp-section">
                        <div className="comp-header">
                            <h3>{comp.category}</h3>
                            <button 
                                className="remove-category-btn" 
                                title="Remove category"
                                onClick={() => updatePortfolio('competitions', portfolio.competitions.filter(c => c.category !== comp.category))}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        {comp.events.map((ev, evIdx) => (
                            <div key={evIdx} className="repeatable-item full">
                                <input placeholder="Event Name" value={ev.name} onChange={(e) => {
                                    const newComps = [...portfolio.competitions];
                                    newComps[idx].events[evIdx].name = e.target.value;
                                    updatePortfolio('competitions', newComps);
                                }} />
                                <input placeholder="Organizer/College" value={ev.organizer} onChange={(e) => {
                                    const newComps = [...portfolio.competitions];
                                    newComps[idx].events[evIdx].organizer = e.target.value;
                                    updatePortfolio('competitions', newComps);
                                }} />
                                <select value={ev.result} onChange={(e) => {
                                    const newComps = [...portfolio.competitions];
                                    newComps[idx].events[evIdx].result = e.target.value;
                                    updatePortfolio('competitions', newComps);
                                }}>
                                    <option value="">Select Result</option>
                                    <option value="Winner">Winner</option>
                                    <option value="Runner-up">Runner-up</option>
                                    <option value="Participant">Participant</option>
                                </select>
                                <input type="date" value={ev.date} onChange={(e) => {
                                    const newComps = [...portfolio.competitions];
                                    newComps[idx].events[evIdx].date = e.target.value;
                                    updatePortfolio('competitions', newComps);
                                }} />
                                <div className="file-upload">
                                    <label className="upload-label">
                                        {isUploading ? '...' : <Upload size={14} />} Photo/Cert
                                        <input type="file" hidden onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const url = await uploadToCloudinary(file);
                                                if (url) {
                                                    const newComps = [...portfolio.competitions];
                                                    newComps[idx].events[evIdx].photo = url;
                                                    updatePortfolio('competitions', newComps);
                                                }
                                            }
                                        }} />
                                    </label>
                                    {ev.photo && <div className="preview-mini"><img src={ev.photo} alt="Event" /></div>}
                                </div>
                                <button className="delete-btn" onClick={() => {
                                    const newComps = [...portfolio.competitions];
                                    newComps[idx].events = newComps[idx].events.filter((_, i) => i !== evIdx);
                                    updatePortfolio('competitions', newComps);
                                }}><Trash2 size={16} /></button>
                            </div>
                        ))}
                        <button className="add-btn small" onClick={() => {
                            const newComps = [...portfolio.competitions];
                            newComps[idx].events.push({ name: '', organizer: '', result: '', date: '', photo: '' });
                            updatePortfolio('competitions', newComps);
                        }}>
                            <Plus size={14} /> Add {comp.category} Achievement
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderTab5 = () => (
        <div className="setup-tab">
            <h2><Target className="tab-icon" /> Goals & Social</h2>
            <div className="form-grid">
                <div className={`form-group full-width ${errors.careerGoal ? 'has-error' : ''}`}>
                    <label>Career Goal</label>
                    <textarea 
                        placeholder="What do you want to achieve after college?"
                        value={portfolio.goals.careerGoal}
                        onChange={(e) => updatePortfolio('goals', { careerGoal: e.target.value })}
                    />
                    {errors.careerGoal && <span className="error-msg">Fill it first</span>}
                </div>
                <div className="form-group toggle-section">
                    <div className="toggle-header">
                        <label>Open to mentorship?</label>
                        <div className="pill-selector">
                            <button 
                                className={!portfolio.goals.openToMentorship ? 'active' : ''}
                                onClick={() => updatePortfolio('goals', { openToMentorship: false })}
                            >
                                No
                            </button>
                            <button 
                                className={portfolio.goals.openToMentorship ? 'active' : ''}
                                onClick={() => updatePortfolio('goals', { openToMentorship: true })}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
                <div className="form-group full-width">
                    <label><Link size={16} /> LinkedIn Profile</label>
                    <input 
                        type="url" 
                        placeholder="https://linkedin.com/in/..."
                        value={portfolio.goals.linkedin}
                        onChange={(e) => updatePortfolio('goals', { linkedin: e.target.value })}
                    />
                </div>
                <div className="form-group full-width">
                    <label><Link size={16} /> GitHub Portfolio</label>
                    <input 
                        type="url" 
                        placeholder="https://github.com/..."
                        value={portfolio.goals.github}
                        onChange={(e) => updatePortfolio('goals', { github: e.target.value })}
                    />
                </div>
                <div className="form-group full-width toggle-section">
                    <div className="toggle-header">
                        <label>Leadership position in college?</label>
                        <div className="pill-selector">
                            <button 
                                className={!portfolio.goals.leadership.has ? 'active' : ''}
                                onClick={() => updatePortfolio('goals', { leadership: { ...portfolio.goals.leadership, has: false } })}
                            >
                                No
                            </button>
                            <button 
                                className={portfolio.goals.leadership.has ? 'active' : ''}
                                onClick={() => updatePortfolio('goals', { leadership: { ...portfolio.goals.leadership, has: true } })}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                    {portfolio.goals.leadership.has && (
                        <div className="sub-form">
                            <input placeholder="Position Name" value={portfolio.goals.leadership.name} onChange={(e) => updatePortfolio('goals', { leadership: { ...portfolio.goals.leadership, name: e.target.value } })} />
                            <input placeholder="Organization" value={portfolio.goals.leadership.org} onChange={(e) => updatePortfolio('goals', { leadership: { ...portfolio.goals.leadership, org: e.target.value } })} />
                        </div>
                    )}
                </div>
                <div className="form-group full-width toggle-section">
                    <div className="toggle-header">
                        <label>Volunteering experience?</label>
                        <div className="pill-selector">
                            <button 
                                className={!portfolio.goals.volunteering.has ? 'active' : ''}
                                onClick={() => updatePortfolio('goals', { volunteering: { ...portfolio.goals.volunteering, has: false } })}
                            >
                                No
                            </button>
                            <button 
                                className={portfolio.goals.volunteering.has ? 'active' : ''}
                                onClick={() => updatePortfolio('goals', { volunteering: { ...portfolio.goals.volunteering, has: true } })}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                    {portfolio.goals.volunteering.has && (
                        <div className="sub-form">
                            <textarea placeholder="Brief description of your volunteering work" value={portfolio.goals.volunteering.desc} onChange={(e) => updatePortfolio('goals', { volunteering: { ...portfolio.goals.volunteering, desc: e.target.value } })} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        if (step === 0) return renderWelcome();
        return (
            <div className="setup-modal">
                <div className="modal-header">
                    <button className="close-btn" onClick={onSkip}><X /></button>
                    {renderProgressBar()}
                </div>
                <div className="modal-body">
                    {step === 1 && renderTab1()}
                    {step === 2 && renderTab2()}
                    {step === 3 && renderTab3()}
                    {step === 4 && renderTab4()}
                    {step === 5 && renderTab5()}
                </div>
                <div className="modal-footer">
                    <button 
                        className="secondary-btn" 
                        disabled={step === 1}
                        onClick={() => handleStepChange(step - 1)}
                    >
                        <ArrowLeft size={18} /> Previous
                    </button>
                    {step < 5 ? (
                        <button className="primary-btn" onClick={() => handleStepChange(step + 1)}>
                            Next <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button className="primary-btn complete-btn" onClick={() => {
                            if (validateStep(5)) {
                                handleComplete();
                            }
                        }}>
                            Finalize Portfolio <Check size={18} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="setup-overlay">
            {renderContent()}
        </div>
    );
};

export default PortfolioSetup;
