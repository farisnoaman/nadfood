import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../Icons';

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number | '';
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, label, id, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    if (disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      setSearchTerm(e.target.value);
      if(!isOpen) setIsOpen(true);
  }
  
  const displayValue = isOpen ? searchTerm : selectedOption?.label || '';
  
  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full" ref={wrapperRef}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{label}</label>}
      <div className="relative">
        <input
          id={id}
          type="text"
          className="block w-full rounded-lg border-2 text-base py-2.5 transition-colors duration-200 focus:outline-none focus:ring-2 border-secondary-300 bg-secondary-50 text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-primary-500/30 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 dark:placeholder-secondary-500 ps-4 pe-10 disabled:bg-secondary-200 dark:disabled:bg-secondary-800 disabled:cursor-not-allowed"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (disabled) return;
            setSearchTerm('');
            setIsOpen(true);
          }}
          onClick={toggleOpen}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          disabled={disabled}
        />
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
            <Icons.ChevronDown className={`h-5 w-5 text-secondary-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </div>
        {isOpen && !disabled && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-secondary-700 shadow-lg border dark:border-secondary-600 max-h-60 overflow-auto">
            <ul className="py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <li
                    key={option.value}
                    className="cursor-pointer select-none relative py-2 ps-10 pe-4 text-secondary-900 dark:text-secondary-100 hover:bg-primary-100 dark:hover:bg-primary-900"
                    onClick={() => handleSelect(option)}
                  >
                    <span className={`block truncate ${selectedOption?.value === option.value ? 'font-semibold' : 'font-normal'}`}>
                      {option.label}
                    </span>
                    {selectedOption?.value === option.value && (
                      <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-primary-600">
                        <Icons.Check className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </li>
                ))
              ) : (
                <li className="cursor-default select-none relative py-2 px-4 text-secondary-500">
                  لا توجد نتائج
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
