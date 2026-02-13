import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Get initial theme before component renders
const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

// Set initial theme class immediately
const initialTheme = getInitialTheme();
document.documentElement.classList.remove('light', 'dark');
document.documentElement.classList.add(initialTheme);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(initialTheme);

    useEffect(() => {
        // Update document class and save to localStorage
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme);

        console.log('Theme changed to:', theme);
        console.log('HTML classes:', document.documentElement.className);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
