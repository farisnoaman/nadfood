
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{label}</label>}
      <select
        id={id}
        className="block w-full rounded-md border-secondary-300 dark:border-secondary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;
