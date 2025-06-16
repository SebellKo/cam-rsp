import React, { useState, useEffect } from 'react';

export type Theme = 'default' | 'cartoon' | 'neon' | 'retro';

interface ThemeSwitcherProps {
  onThemeChange: (theme: Theme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ onThemeChange }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('default');

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('rps-theme') as Theme;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      onThemeChange(savedTheme);
    }
  }, [onThemeChange]);

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('rps-theme', theme);
    onThemeChange(theme);
  };

  return (
    <div className="theme-switcher">
      <h3>Theme</h3>
      <div className="theme-options">
        <button 
          className={`theme-button ${currentTheme === 'default' ? 'active' : ''}`}
          onClick={() => handleThemeChange('default')}
        >
          Default
        </button>
        <button 
          className={`theme-button ${currentTheme === 'cartoon' ? 'active' : ''}`}
          onClick={() => handleThemeChange('cartoon')}
        >
          Cartoon
        </button>
        <button 
          className={`theme-button ${currentTheme === 'neon' ? 'active' : ''}`}
          onClick={() => handleThemeChange('neon')}
        >
          Neon
        </button>
        <button 
          className={`theme-button ${currentTheme === 'retro' ? 'active' : ''}`}
          onClick={() => handleThemeChange('retro')}
        >
          Retro
        </button>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
