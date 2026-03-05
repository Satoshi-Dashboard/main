import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { MODULES } from '../../config/modules';

export default function SideNav() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`fixed left-0 top-20 bottom-0 bg-gradient-to-b from-gray-950 to-gray-900 border-r border-gray-700/30 transition-all duration-300 z-30 ${isOpen ? 'w-56' : 'w-16'} overflow-hidden`}
    >
      <div className="h-full flex flex-col">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-4 text-gray-400 hover:text-yellow-400 transition"
        >
          <ChevronDown className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} size={20} />
        </button>

        <div className="flex-1 overflow-y-auto space-y-1 px-2 pb-4">
          {MODULES.map((module, index) => (
            <NavLink
              key={module.code}
              to={`/module/${module.slug}`}
              className={({ isActive }) =>
                `block w-full text-left px-3 py-2 rounded text-xs font-mono transition ${
                  isActive
                    ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-500'
                    : 'text-gray-400 hover:text-yellow-400 hover:bg-gray-800/50'
                }`
              }
            >
              {isOpen ? (
                <>
                  <div className="font-semibold">{module.code}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{module.title}</div>
                </>
              ) : (
                <div title={module.title} className="font-semibold">
                  {String(index + 1).padStart(2, '0')}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
