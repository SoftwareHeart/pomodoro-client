// src/contexts/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // localStorage'dan temayı al veya varsayılan olarak 'light' kullan
    const [currentTheme, setCurrentTheme] = useState(() => {
        const savedTheme = localStorage.getItem('pomodoroTheme');
        return savedTheme ? savedTheme : 'light';
    });

    // Tema değiştiğinde localStorage'a kaydet ve HTML etiketine data-theme özelliği ekle
    useEffect(() => {
        localStorage.setItem('pomodoroTheme', currentTheme);
        document.documentElement.setAttribute('data-theme', currentTheme);
    }, [currentTheme]);

    const toggleTheme = (themeName) => {
        if (themeName === 'light' || themeName === 'dark' || themeName === 'blue') {
            setCurrentTheme(themeName);
        }
    };

    // Kullanılabilir temalar
    const themes = {
        light: {
            name: 'light',
            displayName: 'Açık Tema'
        },
        dark: {
            name: 'dark',
            displayName: 'Koyu Tema'
        },
        blue: {
            name: 'blue',
            displayName: 'Mavi Tema'
        }
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, toggleTheme, themes }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);