import React, { createContext, useState, useContext, useEffect } from 'react';

// Tema renkleri
const themes = {
    light: {
        name: 'light',
        colors: {
            background: '#f9f9f9',
            foreground: '#333',
            primary: '#e74c3c',
            secondary: '#3498db',
            accent: '#2ecc71',
            panel: '#ffffff',
            border: '#eeeeee',
        }
    },
    dark: {
        name: 'dark',
        colors: {
            background: '#2c3e50',
            foreground: '#ecf0f1',
            primary: '#e74c3c',
            secondary: '#3498db',
            accent: '#2ecc71',
            panel: '#34495e',
            border: '#476481',
        }
    },
    blue: {
        name: 'blue',
        colors: {
            background: '#e0f7fa',
            foreground: '#263238',
            primary: '#00796b',
            secondary: '#0277bd',
            accent: '#ffa000',
            panel: '#ffffff',
            border: '#b2ebf2',
        }
    }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // localStorage'dan temayı al veya varsayılan olarak 'light' kullan
    const [currentTheme, setCurrentTheme] = useState(() => {
        const savedTheme = localStorage.getItem('pomodoroTheme');
        return savedTheme ? savedTheme : 'light';
    });

    // Tema değiştiğinde localStorage'a kaydet
    useEffect(() => {
        localStorage.setItem('pomodoroTheme', currentTheme);
        applyTheme(themes[currentTheme]);
    }, [currentTheme]);

    // CSS değişkenlerini uygula
    const applyTheme = (theme) => {
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
    };

    const toggleTheme = (themeName) => {
        if (themes[themeName]) {
            setCurrentTheme(themeName);
        }
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, toggleTheme, themes }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);