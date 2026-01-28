
import React from 'react';
import { StudioMode } from '../types';

interface SidebarProps {
  currentMode: StudioMode;
  setMode: (mode: StudioMode) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, 
  setMode, 
  isCollapsed, 
  toggleSidebar,
  theme,
  toggleTheme
}) => {
  const menuItems = [
    { mode: StudioMode.ANALYZE, label: 'Consultoria', icon: '🧐' },
    { mode: StudioMode.EDIT, label: 'Retoque', icon: '✨' },
    { mode: StudioMode.GENERATE, label: 'Criação', icon: '🎨' },
    { mode: StudioMode.VIDEO, label: 'Cinema', icon: '🎥' },
  ];

  return (
    <aside 
      className={`${
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      } w-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex lg:flex-col items-center justify-between lg:justify-start p-4 lg:py-6 z-20 sticky top-0 lg:static shadow-sm transition-all duration-300 ease-in-out`}
    >
      <div className={`lg:mb-10 px-0 lg:px-2 text-center ${isCollapsed ? 'lg:text-center' : 'lg:text-left'} w-full transition-all duration-300`}>
        {isCollapsed ? (
           <div className="hidden lg:block text-3xl cursor-pointer" onClick={toggleSidebar} title="Expandir">🏛️</div>
        ) : (
           <div className="hidden lg:block">
              <h1 className="text-3xl font-serif text-amber-600 dark:text-amber-500 font-bold tracking-wider whitespace-nowrap overflow-hidden">LuxStudio</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-serif italic mt-1 whitespace-nowrap">by Tata Gonçalves</p>
           </div>
        )}
        <div className="lg:hidden text-2xl">🏛️</div>
      </div>
      
      <nav className="flex-1 lg:w-full">
        <ul className="flex lg:flex-col space-x-4 lg:space-x-0 lg:space-y-2 justify-center">
          {menuItems.map((item) => (
            <li key={item.mode} className="w-full">
              <button
                onClick={() => setMode(item.mode)}
                title={item.label}
                className={`w-full flex items-center justify-center ${isCollapsed ? '' : 'lg:justify-start'} px-2 lg:px-4 py-2 lg:py-4 transition-all duration-300 lg:border-l-4 rounded lg:rounded-none group ${
                  currentMode === item.mode
                    ? 'lg:border-amber-600 bg-amber-50 dark:bg-gray-800 text-amber-700 dark:text-amber-500'
                    : 'lg:border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-2xl lg:text-xl relative">
                  {item.icon}
                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <span className="hidden group-hover:block absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                    </span>
                  )}
                </span>
                
                {!isCollapsed && (
                  <span className="hidden lg:inline ml-3 text-sm font-medium tracking-wide whitespace-nowrap opacity-100 transition-opacity duration-300">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto hidden lg:flex flex-col gap-4 w-full px-2">
         {/* System Controls */}
         <div className={`flex ${isCollapsed ? 'flex-col items-center gap-4' : 'flex-row justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-lg'} transition-all duration-300`}>
            
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Alternar Tema"
            >
              {theme === 'light' ? '🌙' : '🌞'}
            </button>

            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
            >
              {isCollapsed ? '➡' : '⬅'}
            </button>
         </div>

         {!isCollapsed && (
            <div className="text-[10px] text-gray-400 dark:text-gray-600 text-center">
              Powered by Gemini 3.0 & Veo
            </div>
         )}
      </div>
    </aside>
  );
};
