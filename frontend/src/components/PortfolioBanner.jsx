import { ChevronRight } from 'lucide-react';
import './PortfolioBanner.css';

const PortfolioBanner = ({ progress, onCompleteNow }) => {
    return (
        <div className="portfolio-banner">
            <div className="banner-content">
                <div className="banner-text">
                    <h3>Your portfolio is {progress}% complete</h3>
                    <p>Complete it so teachers and recruiters can see your full profile.</p>
                </div>
                <div className="banner-progress-container">
                    <div className="banner-progress-bar">
                        <div className="banner-progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-percent">{progress}%</span>
                </div>
            </div>
            <button className="complete-now-btn" onClick={onCompleteNow}>
                Complete Now <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default PortfolioBanner;
