import React, { useEffect, useState } from 'react';

const CustomCursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        const moveCursor = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseOver = (e) => {
            const target = e.target;
            const isClickable = target.closest('button, a, .clickable, input[type="submit"], input[type="button"]');
            setIsHovering(!!isClickable);
        };

        const handleMouseLeave = () => setIsHidden(true);
        const handleMouseEnter = () => setIsHidden(false);

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, []);

    if (isHidden) return null;

    return (
        <div className={`hidden lg:block pointer-events-none fixed inset-0 z-[99999] ${isHovering ? 'cursor-hover' : ''}`}>
            {/* Outer Ring */}
            <div 
                className="cursor-ring"
                style={{ 
                    transform: `translate3d(${position.x - (isHovering ? 24 : 16)}px, ${position.y - (isHovering ? 24 : 16)}px, 0)` 
                }}
            />
            {/* Center Dot */}
            <div 
                className="cursor-dot"
                style={{ 
                    transform: `translate3d(${position.x - 3}px, ${position.y - 3}px, 0)` 
                }}
            />
        </div>
    );
};

export default CustomCursor;
