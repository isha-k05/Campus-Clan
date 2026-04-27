import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    ArrowLeft, 
    Egg, 
    Users, 
    Link, 
    Globe, 
    Mail,
    FileText,
    User,
    GraduationCap,
    Trophy,
    Target,
    Zap,
    ExternalLink,
    Download,
    Award,
    Briefcase,
    Calendar,
    MapPin,
    Edit2
} from 'lucide-react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import PortfolioSetup from './PortfolioSetup';
import PortfolioBanner from './PortfolioBanner';
import './Achievements.css';

const Achievements = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [view, setView] = useState('student'); // 'student' or 'teacher'
    const [showSetup, setShowSetup] = useState(false);
    const [portfolio, setPortfolio] = useState(() => {
        const saved = localStorage.getItem('userPortfolio');
        return saved ? JSON.parse(saved) : null;
    });

    const [achievements] = useState([
        { id: 1, title: "Early Bird", desc: "Joined the platform", icon: <Egg size={32} />, unlocked: true },
        { id: 2, title: "Social Butterfly", desc: "Connected with 5 students", icon: <Users size={32} />, unlocked: true },
        { id: 3, title: "Study Master", desc: "Joined 3 study groups", icon: <FileText size={32} />, unlocked: false },
        { id: 4, title: "Event Goer", desc: "Registered for an event", icon: <Globe size={32} />, unlocked: false },
        { id: 5, title: "Top Contributor", desc: "Posted 10 helpful resources", icon: <Award size={32} />, unlocked: false },
        { id: 6, title: "Chatterbox", desc: "Sent 100 messages", icon: <Mail size={32} />, unlocked: true },
    ]);

    useEffect(() => {
        const isComplete = localStorage.getItem('portfolioComplete') === 'true';
        if (!isComplete && !localStorage.getItem('portfolioSkipped')) {
            setShowSetup(true);
        }
    }, []);

    const calculateProgress = () => {
        if (!portfolio) return 0;
        let totalFields = 10; // Simplified count of key fields
        let filledFields = 0;
        if (portfolio.profile.year) filledFields++;
        if (portfolio.profile.branch) filledFields++;
        if (portfolio.academics.cgpa) filledFields++;
        if (portfolio.skills.technical > 3) filledFields++;
        if (portfolio.activities.internship.has) filledFields++;
        if (portfolio.competitions.length > 0) filledFields++;
        if (portfolio.goals.careerGoal) filledFields++;
        if (portfolio.goals.linkedin) filledFields++;
        if (portfolio.profile.bio) filledFields++;
        if (portfolio.academics.courses.length > 0) filledFields++;

        return Math.min(Math.round((filledFields / totalFields) * 100), 100);
    };

    const handleSetupComplete = (data) => {
        setPortfolio(data);
        setShowSetup(false);
        localStorage.setItem('portfolioComplete', 'true');
        
        // Smooth scroll to top after completion
        setTimeout(() => {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100);
    };

    const handleSkip = () => {
        setShowSetup(false);
        localStorage.setItem('portfolioSkipped', 'true');
        
        // Smooth scroll to top even if skipped
        setTimeout(() => {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100);
    };

    const handleExport = () => {
        window.print();
    };

    const skillData = portfolio ? [
        { subject: 'Comm.', A: portfolio.skills.communication, fullMark: 5 },
        { subject: 'Prob. Solv.', A: portfolio.skills.problemSolving, fullMark: 5 },
        { subject: 'Teamwork', A: portfolio.skills.teamwork, fullMark: 5 },
        { subject: 'Tech', A: portfolio.skills.technical, fullMark: 5 },
        { subject: 'Lead.', A: portfolio.skills.leadership, fullMark: 5 },
        { subject: 'Time Mgmt.', A: portfolio.skills.timeManagement, fullMark: 5 },
    ] : [];

    const renderStudentView = () => (
        <div className="student-view-content">
            <div className="main-grid">
                <div className="left-col">
                    <div className="profile-summary">
                        <button className="edit-portfolio-btn" title="Edit Portfolio" onClick={() => setShowSetup(true)}>
                            <Edit2 size={16} />
                        </button>
                        <div className="profile-avatar">
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt={user.name} className="avatar-img" />
                            ) : (
                                user?.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <h2>{user?.name}</h2>
                        <p>Level 3 Scholar</p>
                        <div className="xp-bar-container">
                            <div className="xp-bar" style={{ width: '65%' }}></div>
                            <span className="xp-text">3250 / 5000 XP</span>
                        </div>
                    </div>

                    <div className="achievements-section">
                        <h3 className="section-title"><Award size={20} /> Badges Unlocked</h3>
                        <div className="achievements-grid">
                            {achievements.map((achievement, index) => (
                                <div
                                    key={achievement.id}
                                    className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                                >
                                    <div className="achievement-icon">{achievement.icon}</div>
                                    <h3>{achievement.title}</h3>
                                    <p>{achievement.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="right-col">
                    {portfolio ? (
                        <div className="portfolio-summary-grid">
                            <div className="summary-card academic-card">
                                <h3><GraduationCap size={20} /> Academics</h3>
                                <div className="stats-row">
                                    <div className="stat-item">
                                        <span className="stat-label">CGPA</span>
                                        <span className="stat-value">{portfolio.academics.cgpa || 'N/A'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">SGPA</span>
                                        <span className="stat-value">{portfolio.academics.lastSGPA || 'N/A'}</span>
                                    </div>
                                </div>
                                {portfolio.academics.scholarship.has && (
                                    <div className="scholarship-badge">
                                        <Zap size={14} /> {portfolio.academics.scholarship.name}
                                    </div>
                                )}
                                <div className="cert-count">
                                    {portfolio.academics.courses.length} Certifications
                                </div>
                            </div>

                            <div className="summary-card skills-card">
                                <h3><Zap size={20} /> Skills Analysis</h3>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                                            <Radar
                                                name="Skills"
                                                dataKey="A"
                                                stroke="#E8521A"
                                                fill="#E8521A"
                                                fillOpacity={0.6}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="summary-card activities-card">
                                <h3><Briefcase size={20} /> Activities</h3>
                                <div className="chips-container">
                                    {portfolio.activities.club.has && (
                                        <span className="chip club-chip">{portfolio.activities.club.name} ({portfolio.activities.club.role})</span>
                                    )}
                                    {portfolio.activities.internship.has && (
                                        <span className="chip intern-chip">Intern @ {portfolio.activities.internship.company}</span>
                                    )}
                                    {portfolio.activities.workshops.map((ws, i) => (
                                        <span key={i} className="chip workshop-chip">{ws.name}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="summary-card competitions-card">
                                <h3><Trophy size={20} /> Competitions</h3>
                                <div className="timeline">
                                    {portfolio.competitions.length > 0 ? portfolio.competitions.flatMap(c => c.events).map((ev, i) => (
                                        <div key={i} className="timeline-item">
                                            <div className="timeline-marker"></div>
                                            <div className="timeline-content">
                                                <h4>{ev.name}</h4>
                                                <span className={`result-badge ${ev.result.toLowerCase()}`}>{ev.result}</span>
                                            </div>
                                        </div>
                                    )) : <p className="empty-text">No competitions added yet.</p>}
                                </div>
                            </div>

                            <div className="summary-card goals-card">
                                <h3><Target size={20} /> Career Goals</h3>
                                <p className="goal-text">{portfolio.goals.careerGoal || 'Set your goals to stay focused!'}</p>
                                <div className="social-links">
                                    {portfolio.goals.linkedin && (
                                        <a href={portfolio.goals.linkedin} target="_blank" rel="noreferrer" className="social-link">
                                            <Link size={20} />
                                        </a>
                                    )}
                                    {portfolio.goals.github && (
                                        <a href={portfolio.goals.github} target="_blank" rel="noreferrer" className="social-link">
                                            <Link size={20} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-portfolio-placeholder">
                            <GraduationCap size={48} />
                            <h3>No Portfolio Data</h3>
                            <p>Complete your setup to see your detailed analysis here.</p>
                            <button className="primary-btn" onClick={() => setShowSetup(true)}>Start Setup</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderTeacherView = () => (
        <div className="teacher-view-content">
            <div className="resume-paper">
                <header className="resume-header">
                    <div className="header-main">
                        <div className="header-name-pic">
                            <div className="resume-picture">
                                {portfolio?.profile.picture ? (
                                    <img src={portfolio.profile.picture} alt="Profile" />
                                ) : (
                                    <div className="resume-pic-placeholder">
                                        {user?.name?.[0]}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1>{user?.name}</h1>
                                <p className="branch-info">{portfolio?.profile.branch} | {portfolio?.profile.year} Year | Sem {portfolio?.profile.semester}</p>
                            </div>
                        </div>
                        <div className="header-meta">
                            <span><Mail size={14} /> {user?.email}</span>
                            {portfolio?.goals.linkedin && (
                                <a href={portfolio.goals.linkedin} target="_blank" rel="noreferrer" className="resume-link">
                                    <Link size={14} /> linkedin.com/in/{portfolio.goals.linkedin.split('/').pop()}
                                </a>
                            )}
                            {portfolio?.goals.github && (
                                <a href={portfolio.goals.github} target="_blank" rel="noreferrer" className="resume-link">
                                    <Link size={14} /> github.com/{portfolio.goals.github.split('/').pop()}
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat">
                            <span className="label">CGPA</span>
                            <span className="value">{portfolio?.academics.cgpa || '0.0'}</span>
                        </div>
                        <div className="stat">
                            <span className="label">Mentor</span>
                            <span className="value">{portfolio?.profile.mentor || 'Not Assigned'}</span>
                        </div>
                    </div>
                </header>

                <section className="resume-section">
                    <h3>Academic Record</h3>
                    <div className="academic-grid">
                        <div className="academic-item">
                            <span className="label">Branch</span>
                            <span className="value">{portfolio?.profile.branch}</span>
                        </div>
                        <div className="academic-item">
                            <span className="label">Roll No</span>
                            <span className="value">{portfolio?.profile.rollNo}</span>
                        </div>
                        {portfolio?.academics.scholarship.has && (
                            <div className="academic-item full">
                                <span className="label">Scholarship</span>
                                <span className="value">{portfolio.academics.scholarship.name} ({portfolio.academics.scholarship.amount})</span>
                            </div>
                        )}
                    </div>
                </section>

                <section className="resume-section">
                    <h3>Skills & Competencies</h3>
                    <div className="skills-tags">
                        {portfolio && Object.entries(portfolio.skills).map(([skill, val]) => (
                            <div key={skill} className="skill-tag">
                                {skill.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: {val}/5
                            </div>
                        ))}
                    </div>
                </section>

                <div className="resume-two-col">
                    <section className="resume-section">
                        <h3>Certifications</h3>
                        <div className="cert-list">
                            {portfolio?.academics.courses.map((c, i) => (
                                <div key={i} className="list-item">
                                    <div className="item-main">
                                        <strong>{c.name}</strong>
                                        <span>{c.platform}</span>
                                    </div>
                                    {c.certificate && (
                                        <a href={c.certificate} target="_blank" rel="noreferrer" className="cert-link">
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="resume-section">
                        <h3>Internships & Training</h3>
                        <div className="intern-list">
                            {portfolio?.activities.internship.has && (
                                <div className="list-item">
                                    <div className="item-main">
                                        <strong>{portfolio.activities.internship.role}</strong>
                                        <span>{portfolio.activities.internship.company} | {portfolio.activities.internship.duration}</span>
                                    </div>
                                    {portfolio.activities.internship.certificate && (
                                        <a href={portfolio.activities.internship.certificate} target="_blank" rel="noreferrer" className="cert-link">
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                            )}
                            {portfolio?.activities.workshops.map((ws, i) => (
                                <div key={i} className="list-item">
                                    <div className="item-main">
                                        <strong>{ws.name}</strong>
                                        <span>{ws.duration} Workshop</span>
                                    </div>
                                    {ws.certificate && (
                                        <a href={ws.certificate} target="_blank" rel="noreferrer" className="cert-link">
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                            ))}
                            {!portfolio?.activities.internship.has && portfolio?.activities.workshops.length === 0 && <span>No records found.</span>}
                        </div>
                    </section>
                </div>

                <section className="resume-section">
                    <h3>Competitions & Achievements</h3>
                    <div className="competition-list">
                        {portfolio?.competitions.flatMap(c => c.events).map((ev, i) => (
                            <div key={i} className="comp-item">
                                <div className="comp-header">
                                    <div className="comp-title">
                                        <strong>{ev.name}</strong>
                                        <span className="date">{ev.date}</span>
                                    </div>
                                    {ev.photo && (
                                        <a href={ev.photo} target="_blank" rel="noreferrer" className="cert-link">
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                                <p>{ev.organizer} | <span className="result">{ev.result}</span></p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );

    return (
        <div className="achievements-page">
            <div className="achievements-container">
                <div className="achievements-top-bar">
                    <button className="back-btn" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    
                    {!showSetup && (
                        <div className="view-toggle">
                            <button 
                                className={view === 'student' ? 'active' : ''} 
                                onClick={() => setView('student')}
                            >
                                Student View
                            </button>
                            <button 
                                className={view === 'teacher' ? 'active' : ''} 
                                onClick={() => setView('teacher')}
                            >
                                Teacher View
                            </button>
                        </div>
                    )}

                    {view === 'teacher' && !showSetup && (
                        <button className="export-btn" onClick={handleExport}>
                            <Download size={18} /> Export as PDF
                        </button>
                    )}
                </div>

                {showSetup ? (
                    <PortfolioSetup 
                        onComplete={handleSetupComplete} 
                        onSkip={handleSkip} 
                    />
                ) : (
                    <>
                        {calculateProgress() < 100 && view === 'student' && (
                            <PortfolioBanner 
                                progress={calculateProgress()} 
                                onCompleteNow={() => setShowSetup(true)} 
                            />
                        )}

                        <div className="view-container">
                            {view === 'student' ? renderStudentView() : renderTeacherView()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Achievements;
