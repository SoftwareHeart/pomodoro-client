// src/components/ThemeSelector.js
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

function ThemeSelector() {
    const { currentTheme, toggleTheme, themes } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Dışarı tıklandığında menüyü kapatma
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Tema renk önizlemelerini almak için yardımcı fonksiyon
    const getThemePreviewColor = (themeName) => {
        switch (themeName) {
            case 'light': return '#e74c3c';  // Light tema birincil rengi
            case 'dark': return '#2c3e50';   // Dark tema birincil rengi
            case 'blue': return '#00796b';   // Blue tema birincil rengi
            default: return '#e74c3c';
        }
    };

    return (
        <div className="theme-selector-container" ref={menuRef}>
            <button
                className="theme-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Tema Seç"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"></path>
                </svg>
            </button>

            {isOpen && (
                <div className="theme-dropdown">
                    <div className="theme-dropdown-header">
                        <h3>Tema Seç</h3>
                        <button
                            className="theme-close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Kapat"
                        >
                            &times;
                        </button>
                    </div>
                    <div className="theme-options">
                        {Object.keys(themes).map((themeName) => (
                            <button
                                key={themeName}
                                className={`theme-option ${currentTheme === themeName ? 'active' : ''}`}
                                onClick={() => {
                                    toggleTheme(themeName);
                                    setIsOpen(false);
                                }}
                            >
                                <span
                                    className="theme-color-preview"
                                    style={{ backgroundColor: getThemePreviewColor(themeName) }}
                                ></span>
                                <span className="theme-name">
                                    {themes[themeName].displayName}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ThemeSelector;