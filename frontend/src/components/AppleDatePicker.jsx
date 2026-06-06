import React, { useState, useEffect, useRef } from 'react';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

export default function AppleDatePicker({ value, onChange, placeholder = 'Sélectionner une date', required = false, align = 'left' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date or default to today
  const getInitialDate = () => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const initialDate = getInitialDate();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-11
  
  // Keep track of internal month/year view when date value changes from parent
  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentYear(parsed.getFullYear());
        setCurrentMonth(parsed.getMonth());
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for text display (e.g., "1 Juin 2026")
  const getFormattedDisplay = () => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return `${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Generate days in calendar grid
  const generateDays = () => {
    const days = [];
    // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    // We want Monday (1) to be index 0, Sunday (0) to be index 6
    const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthTotalDays - i,
        month: currentMonth === 0 ? 11 : currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isPadding: true
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isPadding: false
      });
    }

    // Next month padding days to complete grid (multiples of 7)
    const remaining = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: currentMonth === 11 ? 0 : currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear,
        isPadding: true
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (item) => {
    // Format to YYYY-MM-DD for laravel validation standard compatibility
    const m = String(item.month + 1).padStart(2, '0');
    const d = String(item.day).padStart(2, '0');
    const formatted = `${item.year}-${m}-${d}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const formatted = `${today.getFullYear()}-${m}-${d}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const selectedDate = value ? new Date(value) : null;
  const isSelected = (item) => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return false;
    return selectedDate.getDate() === item.day && 
           selectedDate.getMonth() === item.month && 
           selectedDate.getFullYear() === item.year;
  };

  const isToday = (item) => {
    const today = new Date();
    return today.getDate() === item.day && 
           today.getMonth() === item.month && 
           today.getFullYear() === item.year;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input button mimicing beautiful Apple textfield */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border ${
          isOpen ? 'border-[#0071e3] ring-4 ring-[#0071e3]/12' : 'border-black/[0.03] hover:border-black/[0.08]'
        } rounded-[10px] outline-none text-xs font-semibold flex items-center justify-between text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer select-none`}
      >
        <span className={value ? 'text-[#1d1d1f]' : 'text-gray-400'}>
          {getFormattedDisplay() || placeholder}
        </span>
        <span className="material-symbols-outlined text-[17px] text-[#86868b]">
          calendar_month
        </span>
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-1.5 w-[280px] bg-white/95 backdrop-blur-md border border-black/5 rounded-[16px] shadow-apple-lg p-3.5 z-[100] animate-fadeIn text-[#1d1d1f] select-none`}>
          {/* Header Month Navigation */}
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-[#1d1d1f] tracking-tight">
              {MONTHS_FR[currentMonth]} {currentYear}
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-[26px] h-[26px] rounded-full hover:bg-black/5 flex items-center justify-center text-gray-500 hover:text-black transition-all press-effect"
              >
                <span className="material-symbols-outlined text-[16px] font-bold">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-[26px] h-[26px] rounded-full hover:bg-black/5 flex items-center justify-center text-gray-500 hover:text-black transition-all press-effect"
              >
                <span className="material-symbols-outlined text-[16px] font-bold">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Days Week Headers */}
          <div className="grid grid-cols-7 gap-y-1 text-center mb-1">
            {DAYS_FR.map(d => (
              <span key={d} className="text-[9px] font-bold text-[#86868b] uppercase tracking-wider">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold">
            {generateDays().map((item, idx) => {
              const selected = isSelected(item);
              const today = isToday(item);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(item)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all press-effect cursor-pointer mx-auto ${
                    item.isPadding ? 'text-gray-300 font-normal' : 'text-[#1d1d1f] hover:bg-black/5'
                  } ${
                    selected ? 'bg-[#0071e3] text-white font-bold hover:bg-[#0071e3] shadow-apple-xs' : ''
                  } ${
                    today && !selected ? 'border border-[#0071e3]/50 text-[#0071e3] font-bold' : ''
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="border-t border-black/[0.04] pt-2.5 mt-2.5 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={handleToday}
              className="text-[#0071e3] hover:underline"
            >
              Aujourd'hui
            </button>
            {!required && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#ff3b30] hover:underline"
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
