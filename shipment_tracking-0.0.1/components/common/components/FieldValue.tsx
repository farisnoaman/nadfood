import React from 'react';

/**
 * A reusable component for rendering a labeled field value, often used in summaries.
 * It handles consistent styling for labels and values, including optional currency formatting.
 */
const FieldValue: React.FC<{ label: string; value: string | number | undefined; currency?: string; className?: string }> = ({ label, value, currency = "ر.ي", className }) => (
  <div className={`flex justify-between py-1 text-sm ${className}`}>
    <span className="font-semibold text-secondary-600 dark:text-secondary-400">{label}:</span>
    <span className="text-secondary-800 dark:text-secondary-200">{value !== undefined && value !== '' ? `${Number(value).toLocaleString('en-US')} ${currency}` : '-'}</span>
  </div>
);

export default FieldValue;
