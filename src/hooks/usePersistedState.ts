import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * Custom hook to persist state in localStorage
 * Automatically syncs state with localStorage on changes
 * 
 * @param key - localStorage key to use
 * @param defaultValue - default value if nothing in localStorage
 * @returns [state, setState] tuple like useState
 */
export function usePersistedState<T>(
    key: string,
    defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
    // Initialize state from localStorage or use default
    const [state, setState] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    // Update localStorage whenever state changes
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
}
