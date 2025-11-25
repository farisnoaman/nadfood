
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  Icon?: React.ElementType;
}

const Input: React.FC<InputProps> = ({ label, id, Icon, className, ...props }) => {
  // Base classes for structure, transitions, and focus state
  const baseClasses = 'block w-full rounded-lg border-2 text-base py-2.5 transition-colors duration-200 focus:outline-none focus:ring-2';
  
  // Color classes for light and dark modes
  const colorClasses = 'border-secondary-300 bg-secondary-50 text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-primary-500/30 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 dark:placeholder-secondary-500';
  
  // Use logical properties for padding to support RTL. pe = padding-end (left in RTL), ps = padding-start (right in RTL)
  const paddingClasses = Icon ? 'pe-10 ps-4' : 'px-4';

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{label}</label>}
      <div className="relative">
        {Icon && (
          // Use logical properties for positioning to support RTL. end-0 = left:0 in RTL.
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
            <Icon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
          </div>
        )}
        <input
          id={id}
          className={`${baseClasses} ${colorClasses} ${paddingClasses} ${className || ''}`}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;