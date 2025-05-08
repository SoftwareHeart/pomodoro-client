import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';

function NotificationSettings() {
    const { settings, updateSettings, checkNotificationPermission } = useNotification();
    const [isOpen, setIsOpen] = useState(false);

    const handleBrowserNotificationsChange = async (e) => {
        const isChecked = e.target.checked;

        if (isChecked) {
            const granted = await checkNotificationPermission();
            updateSettings({ browserEnabled: granted });
        } else {
            updateSettings({ browserEnabled: false });
        }
    };

    return (
        <div className="notification-settings">
            <button
                className="settings-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Bildirimleri Kapat" : "Bildirim Ayarları"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
            </button>

            {isOpen && (
                <div className="settings-panel">
                    <h3>Bildirim Ayarları</h3>

                    <div className="setting-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.soundEnabled}
                                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                            />
                            Ses Bildirimleri
                        </label>

                        {settings.soundEnabled && (
                            <div className="volume-control">
                                <span>Ses Seviyesi:</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={settings.soundVolume}
                                    onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="setting-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.visualEnabled}
                                onChange={(e) => updateSettings({ visualEnabled: e.target.checked })}
                            />
                            Görsel Bildirimler
                        </label>
                    </div>

                    <div className="setting-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.browserEnabled}
                                onChange={handleBrowserNotificationsChange}
                            />
                            Tarayıcı Bildirimleri
                        </label>
                        <p className="setting-description">
                            Uygulama açık değilken bile bildirim alın.
                        </p>
                    </div>

                    <button
                        className="close-settings"
                        onClick={() => setIsOpen(false)}
                    >
                        Kapat
                    </button>
                </div>
            )}
        </div>
    );
}

export default NotificationSettings;