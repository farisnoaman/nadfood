import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';
import { ar } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

// Custom Arabic calendar styles
const arabicCalendarStyles = `
  .arabic-calendar {
    font-family: 'Cairo', 'Arial Unicode MS', sans-serif !important;
    direction: rtl !important;
  }

  .arabic-calendar .react-datepicker__header {
    background-color: #3b82f6 !important;
    color: white !important;
    border-bottom: none !important;
  }

  .arabic-calendar .react-datepicker__current-month {
    color: white !important;
    font-weight: 600 !important;
  }

  .arabic-calendar .react-datepicker__day-name {
    color: #374151 !important;
    font-weight: 600 !important;
  }

  .arabic-calendar .react-datepicker__day {
    color: #374151 !important;
  }

  .arabic-calendar .react-datepicker__day:hover {
    background-color: #eff6ff !important;
  }

  .arabic-calendar .react-datepicker__day--selected {
    background-color: #3b82f6 !important;
    color: white !important;
  }

  .arabic-calendar .react-datepicker__day--keyboard-selected {
    background-color: #dbeafe !important;
  }

  .arabic-calendar .react-datepicker__navigation {
    border-color: #3b82f6 !important;
  }

  .arabic-calendar .react-datepicker__navigation:hover {
    background-color: #3b82f6 !important;
    border-color: #2563eb !important;
  }

  .arabic-calendar .react-datepicker__month-dropdown,
  .arabic-calendar .react-datepicker__year-dropdown {
    background-color: white !important;
    border: 1px solid #d1d5db !important;
  }

  .arabic-calendar .react-datepicker__month-option,
  .arabic-calendar .react-datepicker__year-option {
    color: #374151 !important;
  }

  .arabic-calendar .react-datepicker__month-option:hover,
  .arabic-calendar .react-datepicker__year-option:hover {
    background-color: #f3f4f6 !important;
  }

  .arabic-calendar .react-datepicker__month-option--selected,
  .arabic-calendar .react-datepicker__year-option--selected {
    background-color: #3b82f6 !important;
    color: white !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = arabicCalendarStyles;
  document.head.appendChild(styleSheet);
}
import { Icons } from '../../Icons';

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
  const datePickerRef = useRef<DatePicker>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const parsed = parse(value, 'yyyy-MM-dd', new Date());
      if (isValid(parsed)) {
        setSelectedDate(parsed);
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd');
      onChange(formatted);
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
      const parsed = parse(inputValue, 'yyyy-MM-dd', new Date());
      if (isValid(parsed)) {
        setSelectedDate(parsed);
      }
    } else {
      setSelectedDate(null);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const displayValue = selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ar }) : '';

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
          className="w-full px-3 py-2 pr-10 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-secondary-200 text-right disabled:bg-secondary-100 dark:disabled:bg-secondary-800 disabled:cursor-not-allowed"
          readOnly
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-secondary-300 disabled:cursor-not-allowed"
        >
          <Icons.Calendar className="h-5 w-5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1" dir="rtl">
          <DatePicker
            ref={datePickerRef}
            selected={selectedDate}
            onChange={handleDateChange}
            locale={ar}
            dateFormat="dd/MM/yyyy"
            minDate={minDate}
            maxDate={maxDate}
            inline
            calendarClassName="arabic-calendar"
            className="hidden"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearDropdownItemNumber={10}
          />
        </div>
      )}

      {/* Click outside to close */}
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