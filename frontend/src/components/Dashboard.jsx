import { useNavigate } from 'react-router-dom';
import Feed from './Feed';
import CampusGames from './CampusGames';
import FloatingActionButton from './FloatingActionButton';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-left">
                <Feed />
            </div>
            <div className="dashboard-right">
                <CampusGames />
            </div>
            <FloatingActionButton />
        </div>
    );
};

export default Dashboard;
