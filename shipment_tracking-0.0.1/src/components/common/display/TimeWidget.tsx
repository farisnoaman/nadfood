import React, { useState, useEffect } from 'react';

const TimeWidget: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Format various date/time parts using the Intl API for proper localization (ar-SA).
  const dayOfWeek = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(currentDate);
  const time = new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }).format(currentDate);
  
  // '-u-ca-islamic' extension is used to specify the Islamic (Hijri) calendar system.
  const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(currentDate);

  // Format Gregorian date to use the full month name in Arabic, e.g., "14 نوفمبر 2025"
  const gregorianDate = new Intl.DateTimeFormat('ar-SA', {
    calendar: 'gregory', // Explicitly specify the Gregorian calendar
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(currentDate);


  return (
    <div className="hidden md:block bg-secondary-200 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 py-2 px-4 text-center text-sm shadow-inner">
      <span>{dayOfWeek}</span>
      <span className="mx-2">-</span>
      <span>{time}</span>
      <span className="mx-2">-</span>
      <span>{hijriDate}</span>
      <span className="mx-2">الموافق</span>
      <span>"{gregorianDate}"</span>
    </div>
  );
};

export default TimeWidget;
