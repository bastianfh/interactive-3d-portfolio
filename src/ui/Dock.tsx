import { motion } from 'framer-motion';
import { stationOrder, stations, type StationId } from '../data/portfolioData';
import { STATION_LAYOUT } from '../scene/layout';

interface Props {
  active: StationId | null;
  hovered: StationId | null;
  onSelect: (id: StationId | null) => void;
}

export function Dock({ active, hovered, onSelect }: Props) {
  const items: { id: StationId | null; label: string; accent: string }[] = [
    { id: null, label: 'Overview', accent: '#e5e7eb' },
    ...stationOrder.map((id) => ({ id, label: stations[id].navLabel, accent: STATION_LAYOUT[id].accent })),
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 md:bottom-6"
      aria-label="Sections"
    >
      <div className="flex items-center gap-0 rounded-full border border-white/10 bg-black/40 p-1 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:gap-1 sm:p-1.5">
        {items.map((item) => {
          const isActive = item.id === active;
          const isHovered = item.id !== null && item.id === hovered;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`relative whitespace-nowrap rounded-full px-2.5 py-2 text-[11.5px] font-medium tracking-wide transition-colors sm:px-4 sm:text-[12px] ${
                isActive ? 'text-white' : isHovered ? 'text-white/90' : 'text-white/55 hover:text-white/90'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="dock-pill"
                  className="absolute inset-0 rounded-full border border-white/10 bg-white/10"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative flex items-center gap-0 sm:gap-2">
                <span
                  className="hidden h-1.5 w-1.5 rounded-full transition-opacity sm:inline-block"
                  style={{
                    background: item.accent,
                    boxShadow: isActive ? `0 0 10px ${item.accent}` : 'none',
                    opacity: isActive || isHovered ? 1 : 0.45,
                  }}
                />
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
