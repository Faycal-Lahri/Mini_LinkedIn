import React from 'react';

const ReactionIcon = ({ type, className = "w-5 h-5" }) => {
  const emojiMap = {
    'LIKE': '👍',
    'LOVE': '❤️',
    'CLAP': '👏',
    'INSIGHTFUL': '💡',
    'DISLIKE': '👎'
  };

  const emoji = emojiMap[type] || '👍';

  return (
    <span 
      className={`inline-flex items-center justify-center select-none ${className}`} 
      style={{ 
        fontSize: '1.25em', 
        lineHeight: 1,
        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif'
      }}
    >
      {emoji}
    </span>
  );
};

export default ReactionIcon;
