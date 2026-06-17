import React from 'react';

/**
 * Renders text with basic markdown support (bold, headers, lists).
 * Safely parses markdown elements into React elements without dangerouslySetInnerHTML.
 */
export default function FormattedText({ text }) {
  if (!text) return null;

  // Split the text into lines
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-[14px] text-black/90 leading-relaxed font-normal">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Handle empty lines
        if (trimmed === '') {
          return <div key={idx} className="h-1.5" />;
        }

        // Check for headers (e.g. # Header, ## Header, ### Header)
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const content = headerMatch[2];
          const headerClasses = level === 1 
            ? 'text-lg font-bold text-black mt-4 mb-2' 
            : level === 2 
            ? 'text-[16px] font-bold text-black mt-3.5 mb-1.5' 
            : 'text-[15px] font-semibold text-black mt-3 mb-1';
          
          return (
            <div key={idx} className={headerClasses}>
              {parseBoldText(content)}
            </div>
          );
        }

        // Check if a line is just bold text (e.g. "**Section Title**" or "**🛡️ Titre**")
        const isHeadingLine = trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4 && !trimmed.slice(2, -2).includes('**');
        if (isHeadingLine) {
          const content = trimmed.slice(2, -2);
          return (
            <div key={idx} className="text-[15px] font-bold text-black mt-3.5 mb-1.5 block">
              {parseBoldText(content)}
            </div>
          );
        }

        // Check if it's a list item (starts with * or - or •)
        const listMatch = trimmed.match(/^[*•-]\s+(.*)$/);
        if (listMatch) {
          const content = listMatch[1];
          return (
            <div key={idx} className="flex items-start pl-4 space-x-2 my-1">
              <span className="text-indigo-600 mt-2 text-[6px] select-none">•</span>
              <div className="flex-1 text-[14px] text-black/85">
                {parseBoldText(content)}
              </div>
            </div>
          );
        }

        // Default paragraph line
        return (
          <p key={idx} className="text-black/85 break-words">
            {parseBoldText(line)}
          </p>
        );
      })}
    </div>
  );
}

// Helper to parse **bold** into JSX elements
function parseBoldText(text) {
  if (!text) return '';
  // Split on bold boundaries
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-black">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
