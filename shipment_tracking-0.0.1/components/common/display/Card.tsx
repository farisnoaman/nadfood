
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className, title }) => {
   return (
     <div className={`bg-white dark:bg-secondary-800 shadow-md rounded-lg ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold leading-6 text-secondary-900 dark:text-secondary-100">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
