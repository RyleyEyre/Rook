import './LoadingScreen.css';
import RookIcon from '../icons/RookIcon';

function LoadingScreen({ message = 'Loading...' }, type = 'Auth') {
    if (type === 'Auth'){
        return (
            <div className="loading-screen">
                <div className="loading-emblem">
                    <div className="pixel">
                        <RookIcon size={20} color="white" />
                    </div>
                </div>
                <p className="loading-message">{message}</p>
            </div>
        );
    }

}

export default LoadingScreen;