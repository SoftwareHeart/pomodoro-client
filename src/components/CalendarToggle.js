// src/components/CalendarToggle.js
import React, { useState, useRef, useEffect } from 'react';
import CalendarView from './CalendarView';

function CalendarToggle() {
    const [isOpen, setIsOpen] = useState(false);
    const calendarRef = useRef(null);

    // Dışarı tıklandığında takvimi kapat
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen]);

    // Escape tuşu ile takvimi kapat
    const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const toggleCalendar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="calendar-toggle-container" ref={calendarRef}>
            <button
                className="calendar-toggle-btn"
                onClick={toggleCalendar}
                aria-label={isOpen ? "Takvimi Kapat" : "Takvimi Aç"}
                title="Pomodoro Takvimi"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                    <path d="m9 16 2 2 4-4"></path>
                </svg>
            </button>

            {isOpen && (
                <div className="calendar-modal-overlay">
                    <div className="calendar-modal">
                        <div className="calendar-modal-header">
                            <h2>Pomodoro Takvimi</h2>
                            <button
                                className="calendar-close-btn"
                                onClick={() => setIsOpen(false)}
                                aria-label="Takvimi Kapat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="calendar-modal-content">
                            <CalendarView />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CalendarToggle;