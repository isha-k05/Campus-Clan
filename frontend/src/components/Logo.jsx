import { useState, useEffect, useRef } from 'react';
import './Logo.css';

const Logo = ({ 
    size = 80, 
    movable = true, 
    showText = false, 
    text = "Campus Clan",
    className = "",
    hoverScale = true
}) => {
    const [isBlinking, setIsBlinking] = useState(false);
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const logoRef = useRef(null);

    // Blink logic
    useEffect(() => {
        let blinkTimeout;
        const triggerBlink = () => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
            const nextBlink = Math.random() * 4000 + 2000;
            blinkTimeout = setTimeout(triggerBlink, nextBlink);
        };
        blinkTimeout = setTimeout(triggerBlink, 3000);
        return () => clearTimeout(blinkTimeout);
    }, []);

    // Eye following logic
    useEffect(() => {
        if (!movable) return;

        const handleMouseMove = (e) => {
            if (!logoRef.current) return;
            const rect = logoRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // maxMove is proportional to size (6px for 80px size)
            const maxMove = (size / 80) * 6; 
            
            const moveX = distance > 0 ? (dx / distance) * Math.min(distance / 50, maxMove) : 0;
            const moveY = distance > 0 ? (dy / distance) * Math.min(distance / 50, maxMove) : 0;
            
            setEyeOffset({ x: moveX, y: moveY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [movable, size]);

    return (
        <div 
            className={`cc-logo-container ${hoverScale ? 'hover-scale' : ''} ${className}`} 
            ref={logoRef}
        >
            <div className="cc-logo-svg">
                <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g style={{ 
                        transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                        transition: 'transform 0.1s ease-out'
                    }}>
                        <path 
                            className={`eye-path ${isBlinking ? 'blinking' : ''}`}
                            d="M40 30C35 30 30 35 30 40V60C30 65 35 70 40 70H45V60H40V40H45V30H40Z" 
                            fill="currentColor"
                        />
                        <path 
                            className={`eye-path ${isBlinking ? 'blinking' : ''}`}
                            d="M70 30C65 30 60 35 60 40V60C60 65 65 70 70 70H75V60H70V40H75V30H70Z" 
                            fill="currentColor"
                        />
                    </g>
                    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="4"/>
                </svg>
            </div>
            {showText && <span className="cc-logo-text">{text}</span>}
        </div>
    );
};

export default Logo;
