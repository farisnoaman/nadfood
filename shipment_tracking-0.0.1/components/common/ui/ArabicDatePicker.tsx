import React, { useState, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { ar } from 'date-fns/locale';

// Import CSS dynamically
const loadDatePickerStyles = () => {
  if (typeof document !== 'undefined') {
    import('react-datepicker/dist/react-datepicker.css');
  }
};

// Enhanced Arabic calendar styles with responsive design
const arabicCalendarStyles = `
  /* Base Arabic calendar styles */
  .arabic-calendar {
    font-family: 'Cairo', 'Tajawal', 'Arial Unicode MS', 'Segoe UI', sans-serif !important;
    direction: rtl !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid #e5e7eb !important;
    overflow: hidden !important;
    background: white !important;
  }

  /* Header styling */
  .arabic-calendar .react-datepicker__header {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
    color: white !important;
    border-bottom: none !important;
    padding: 16px !important;
    border-radius: 12px 12px 0 0 !important;
    position: relative !important; /* Ensure arrows position relative to header */
  }

  .arabic-calendar .react-datepicker__current-month {
    color: white !important;
    font-weight: 700 !important;
    font-size: 18px !important;
    margin-bottom: 8px !important;
  }

  .arabic-calendar .react-datepicker__day-names {
    background: #f8fafc !important;
    padding: 8px 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }

  .arabic-calendar .react-datepicker__day-name {
    color: #64748b !important;
    font-weight: 600 !important;
    font-size: 12px !important;
    width: 32px !important;
    line-height: 32px !important;
  }

  /* Day cells */
  .arabic-calendar .react-datepicker__day {
    color: #374151 !important;
    font-weight: 500 !important;
    width: 32px !important;
    height: 32px !important;
    line-height: 30px !important;
    margin: 1px !important;
    border-radius: 8px !important;
    transition: all 0.2s ease !important;
    position: relative !important;
  }

  /* Current month days - bold font */
  .arabic-calendar .react-datepicker__day--in-selecting-range,
  .arabic-calendar .react-datepicker__day--in-range,
  .arabic-calendar .react-datepicker__month-text--in-range,
  .arabic-calendar .react-datepicker__quarter-text--in-range {
    font-weight: 700 !important;
  }

  /* Make sure current month days are bold */
  .arabic-calendar .react-datepicker__day:not(.react-datepicker__day--outside-month) {
    font-weight: 700 !important;
  }

  .arabic-calendar .react-datepicker__day:hover {
    background-color: #eff6ff !important;
    transform: scale(1.05) !important;
  }

  .arabic-calendar .react-datepicker__day--selected {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
    color: white !important;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
  }

  .arabic-calendar .react-datepicker__day--selected:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
  }

  .arabic-calendar .react-datepicker__day--keyboard-selected {
    background-color: #dbeafe !important;
    color: #1e40af !important;
  }

  .arabic-calendar .react-datepicker__day--today {
    background-color: #fef3c7 !important;
    color: #92400e !important;
    font-weight: 700 !important;
  }

  .arabic-calendar .react-datepicker__day--today.react-datepicker__day--selected {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
    color: white !important;
  }

  /* Navigation arrows - positioned inside circles */
  .arabic-calendar .react-datepicker__navigation {
    border: 2px solid rgba(255, 255, 255, 0.8) !important;
    background: rgba(255, 255, 255, 0.15) !important;
    border-radius: 50% !important;
    width: 32px !important;
    height: 32px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    transition: all 0.2s ease !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    backdrop-filter: blur(4px) !important;
    position: absolute !important;
    z-index: 10 !important;
    cursor: pointer !important;
    box-sizing: border-box !important;
  }

  .arabic-calendar .react-datepicker__navigation:hover {
    background: rgba(255, 255, 255, 0.25) !important;
    border-color: rgba(255, 255, 255, 1) !important;
    transform: scale(1.1) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  }

  .arabic-calendar .react-datepicker__navigation-icon::before {
    border-color: white !important;
    border-width: 2px 2px 0 0 !important;
    content: '' !important;
    display: inline-block !important;
    width: 6px !important;
    height: 6px !important;
    margin: 0 !important;
    position: relative !important;
  }

  /* Previous arrow (left arrow, positioned on the right side in RTL) */
  .arabic-calendar .react-datepicker__navigation--previous {
    right: 16px !important;
    left: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  .arabic-calendar .react-datepicker__navigation--previous .react-datepicker__navigation-icon::before {
    transform: rotate(225deg) !important;
    border-color: white !important;
    border-width: 2px 2px 0 0 !important;
    content: '' !important;
    display: inline-block !important;
    width: 6px !important;
    height: 6px !important;
    position: relative !important;
    top: 0 !important;
    left: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Next arrow (right arrow, positioned on the left side in RTL) */
  .arabic-calendar .react-datepicker__navigation--next {
    left: 16px !important;
    right: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  .arabic-calendar .react-datepicker__navigation--next .react-datepicker__navigation-icon::before {
    transform: rotate(45deg) !important;
    border-color: white !important;
    border-width: 2px 2px 0 0 !important;
    content: '' !important;
    display: inline-block !important;
    width: 6px !important;
    height: 6px !important;
    position: relative !important;
    top: 0 !important;
    left: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Month/Year dropdowns */
  .arabic-calendar .react-datepicker__month-dropdown,
  .arabic-calendar .react-datepicker__year-dropdown {
    background-color: white !important;
    border: 1px solid #d1d5db !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  }

  .arabic-calendar .react-datepicker__month-option,
  .arabic-calendar .react-datepicker__year-option {
    color: #374151 !important;
    padding: 8px 12px !important;
    transition: background-color 0.2s ease !important;
  }

  .arabic-calendar .react-datepicker__month-option:hover,
  .arabic-calendar .react-datepicker__year-option:hover {
    background-color: #f3f4f6 !important;
  }

  .arabic-calendar .react-datepicker__month-option--selected,
  .arabic-calendar .react-datepicker__year-option--selected {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
    color: white !important;
  }

  /* Triangle pointer */
  .arabic-calendar .react-datepicker__triangle {
    display: none !important;
  }

  /* Mobile responsive adjustments */
  @media (max-width: 640px) {
    .arabic-calendar {
      font-size: 14px !important;
      max-width: 320px !important;
      margin: 0 auto !important;
    }

    .arabic-calendar .react-datepicker__day {
      width: 36px !important;
      height: 36px !important;
      line-height: 34px !important;
      font-size: 14px !important;
      font-weight: 700 !important; /* Extra bold on mobile for better visibility */
    }

    .arabic-calendar .react-datepicker__day-name {
      width: 36px !important;
      font-size: 11px !important;
    }

    .arabic-calendar .react-datepicker__header {
      padding: 12px !important;
    }

    .arabic-calendar .react-datepicker__current-month {
      font-size: 16px !important;
    }

    /* Mobile arrow adjustments */
    .arabic-calendar .react-datepicker__navigation {
      width: 28px !important;
      height: 28px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
    }

    .arabic-calendar .react-datepicker__navigation--previous {
      right: 12px !important;
    }

    .arabic-calendar .react-datepicker__navigation--next {
      left: 12px !important;
    }

    .arabic-calendar .react-datepicker__navigation-icon::before {
      width: 5px !important;
      height: 5px !important;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .arabic-calendar {
      background: #1f2937 !important;
      border-color: #374151 !important;
    }

    .arabic-calendar .react-datepicker__day-names {
      background: #111827 !important;
      border-color: #374151 !important;
    }

    .arabic-calendar .react-datepicker__day {
      color: #f3f4f6 !important;
    }

    .arabic-calendar .react-datepicker__day-name {
      color: #9ca3af !important;
    }

    .arabic-calendar .react-datepicker__day:hover {
      background-color: #374151 !important;
    }

    .arabic-calendar .react-datepicker__day--keyboard-selected {
      background-color: #1e3a8a !important;
      color: #dbeafe !important;
    }

    .arabic-calendar .react-datepicker__day--today {
      background-color: #451a03 !important;
      color: #fbbf24 !important;
    }
  }

  /* Animation for calendar appearance */
  .arabic-calendar {
    animation: calendarFadeIn 0.3s ease-out !important;
  }

  @keyframes calendarFadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Custom Calendar Styles */
  .custom-arabic-calendar {
    font-family: 'Cairo', 'Tajawal', 'Segoe UI', sans-serif;
    direction: rtl;
    background: white;
    border-radius: 24px;
    padding: 1rem;
    max-width: 420px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
  }

  .custom-calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    font-size: 1.25rem;
  }

  .month-year {
    font-size: 1em;
    font-weight: 700;
  }

  .nav-arrow {
    cursor: pointer;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.08);
    display: grid;
    place-items: center;
    transition: background 0.35s, transform 0.35s;
    user-select: none;
    border: none;
  }

  .nav-arrow:hover {
    background: rgba(99, 102, 241, 0.18);
  }

  .nav-arrow:active {
    transform: scale(0.92);
  }

  .nav-arrow::after {
    content: "";
    width: 8px;
    height: 8px;
    border-style: solid;
    border-color: #6366f1;
    border-width: 0 2px 2px 0;
    display: inline-block;
    transform: rotate(135deg);
  }

  #prev::after {
    transform: rotate(-45deg);
  }

  .custom-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    animation: slideIn 0.5s forwards;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .day-name {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 600;
    text-align: center;
    margin-bottom: 0.25rem;
    padding: 8px 0;
  }

  .day-number {
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background 0.35s, color 0.35s, transform 0.35s;
    margin: 2px;
    border: none;
    background: transparent;
    font-family: inherit;
  }

  .day-number.current-month {
    font-weight: 700;
    color: #1f2937;
  }

  .day-number.adjacent-month {
    color: #9ca3af;
    font-weight: 400;
  }

  .day-number:hover:not(.inactive):not(.active) {
    background: #a5b4fc;
    color: #fff;
    transform: scale(1.08);
  }

  .day-number.active {
    background: #8b5cf6;
    color: #fff;
    font-weight: 700;
  }

  .day-number.today {
    background: #10b981;
    color: #fff;
    font-weight: 700;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
  }

  .day-number:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (max-width: 480px) {
    .custom-arabic-calendar {
      padding: 1rem;
    }
    .custom-calendar-grid {
      gap: 4px;
    }
    .day-number {
      margin: 1px;
      font-size: 0.8rem;
    }
  }
`;

// Inject enhanced styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = arabicCalendarStyles;
  document.head.appendChild(styleSheet);
}

import { Icons } from '../../Icons';

// Loading component for calendar
const CalendarLoading: React.FC<{ message?: string }> = ({
  message = "جاري تحميل التقويم..."
}) => (
  <div className="flex items-center justify-center p-8 bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700">
    <div className="flex flex-col items-center space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      <p className="text-sm text-secondary-600 dark:text-secondary-400">{message}</p>
    </div>
  </div>
);

// Custom Arabic Calendar Component
const CustomArabicCalendar: React.FC<{
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}> = ({ selectedDate, onDateChange, minDate, maxDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const dayNames = ['جمعة', 'سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس'];

  const buildCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = (firstDay.getDay() + 1) % 7;
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    let cells = [];
    
    // Add day names
    dayNames.forEach(n => cells.push(<div key={`name-${n}`} className="day-name">{n}</div>));

    // Add days from previous month
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
      
      cells.push(
        <button
          key={`prev-${day}`}
          className="day-number adjacent-month"
          onClick={() => !isDisabled && onDateChange(date)}
          disabled={isDisabled}
        >
          {day}
        </button>
      );
    }

    // Add days of the current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const isToday = year === today.getFullYear() &&
                      month === today.getMonth() &&
                      d === today.getDate();
      const isSelected = selectedDate && 
                         year === selectedDate.getFullYear() &&
                         month === selectedDate.getMonth() &&
                         d === selectedDate.getDate();
      const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
      
      let cls = 'day-number current-month';
      if (isToday) cls += ' today';
      if (isSelected) cls += ' active';
      
      cells.push(
        <button
          key={`current-${d}`}
          className={cls}
          onClick={() => !isDisabled && onDateChange(date)}
          disabled={isDisabled}
        >
          {d}
        </button>
      );
    }

    // Add days from next month
    const totalCells = cells.length;
    const remainingCells = 42 - totalCells;
    
    for (let d = 1; d <= remainingCells; d++) {
      const date = new Date(year, month + 1, d);
      const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
      
      cells.push(
        <button
          key={`next-${d}`}
          className="day-number adjacent-month"
          onClick={() => !isDisabled && onDateChange(date)}
          disabled={isDisabled}
        >
          {d}
        </button>
      );
    }

    return cells;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <div className="custom-arabic-calendar">
      <div className="custom-calendar-header">
        <button className="nav-arrow" id="prev" onClick={goToPreviousMonth}></button>
        <span className="month-year">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button className="nav-arrow" id="next" onClick={goToNextMonth}></button>
      </div>
      <div className="custom-calendar-grid">
        {buildCalendar()}
      </div>
    </div>
  );
};

// Fallback HTML5 date picker
const FallbackDatePicker: React.FC<ArabicDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "اختر التاريخ",
  required = false,
  className = "",
  disabled = false,
  minDate,
  maxDate
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
          max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
          className="w-full px-3 py-2 pr-10 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-secondary-200 text-right disabled:bg-secondary-100 dark:disabled:bg-secondary-800 disabled:cursor-not-allowed transition-colors"
        />

        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400">
          <Icons.Calendar className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md border border-amber-200 dark:border-amber-800">
        <Icons.Info className="h-3 w-3 inline ml-1" />
        التقويم العربي غير متاح حالياً. يمكنك إدخال التاريخ يدوياً.
      </div>
    </div>
  );
};

interface ArabicDatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const ArabicDatePicker: React.FC<ArabicDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "اختر التاريخ",
  required = false,
  className = "",
  disabled = false,
  minDate,
  maxDate
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<'loading' | 'ready' | 'fallback' | 'error'>('loading');

  // Load calendar library and styles
  useEffect(() => {
    let isMounted = true;

    const loadCalendar = async () => {
      try {
        // Load styles first
        await loadDatePickerStyles();

        // Test if DatePicker can be loaded
        await import('react-datepicker');

        // Test Arabic locale
        if (!ar || !ar.localize) {
          throw new Error('Arabic locale not available');
        }

        if (isMounted) {
          setCalendarStatus('ready');
        }
      } catch (error) {
        console.warn('Arabic calendar failed to load, using fallback:', error);
        if (isMounted) {
          setCalendarStatus('fallback');
        }
      }
    };

    loadCalendar();

    return () => {
      isMounted = false;
    };
  }, []);

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        const parsed = parse(value, 'yyyy-MM-dd', new Date());
        if (isValid(parsed)) {
          setSelectedDate(parsed);
        }
      } catch (error) {
        console.warn('Failed to parse date value:', value, error);
        setSelectedDate(null);
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      try {
        const formatted = format(date, 'yyyy-MM-dd');
        onChange(formatted);
      } catch (error) {
        console.error('Failed to format date:', error);
        onChange('');
      }
    } else {
      onChange('');
    }
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Try to parse the input
    if (inputValue) {
      try {
        const parsed = parse(inputValue, 'yyyy-MM-dd', new Date());
        if (isValid(parsed)) {
          setSelectedDate(parsed);
        }
      } catch (error) {
        console.warn('Failed to parse input date:', inputValue);
      }
    } else {
      setSelectedDate(null);
    }
  };

  const handleInputFocus = () => {
    if (calendarStatus === 'ready') {
      setIsOpen(true);
    }
  };

  const toggleCalendar = () => {
    if (calendarStatus === 'ready') {
      setIsOpen(!isOpen);
    }
  };

  // Format display value based on calendar status
  const getDisplayValue = () => {
    if (!selectedDate) return '';

    try {
      if (calendarStatus === 'ready') {
        return format(selectedDate, 'dd/MM/yyyy', { locale: ar });
      } else {
        // Fallback to simple format
        return format(selectedDate, 'yyyy-MM-dd');
      }
    } catch (error) {
      console.warn('Failed to format display date:', error);
      return value || '';
    }
  };

  const displayValue = getDisplayValue();

  // Render based on calendar status
  if (calendarStatus === 'loading') {
    return (
      <div className={`relative ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <CalendarLoading message="جاري تحميل التقويم العربي..." />
      </div>
    );
  }

  if (calendarStatus === 'fallback' || calendarStatus === 'error') {
    return (
      <FallbackDatePicker
        label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={className}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
      />
    );
  }

  // Main Arabic calendar component - Using our custom calendar
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full px-3 py-2 pr-10 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-secondary-200 text-right disabled:bg-secondary-100 dark:disabled:bg-secondary-800 disabled:cursor-not-allowed transition-all duration-200 hover:border-secondary-400 dark:hover:border-secondary-500"
          readOnly
        />

        <button
          type="button"
          onClick={toggleCalendar}
          disabled={disabled}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-primary-600 dark:text-secondary-500 dark:hover:text-primary-400 disabled:cursor-not-allowed transition-colors duration-200 p-1 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700"
        >
          <Icons.Calendar className="h-5 w-5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 shadow-xl" dir="rtl">
          <CustomArabicCalendar
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}

      {/* Enhanced click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ArabicDatePicker;