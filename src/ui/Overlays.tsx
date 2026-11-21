import { AnimatePresence, motion } from 'framer-motion';
import { profile } from '../data/portfolioData';

export function Loader({ visible }: { visible: boolean }) {
  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0c10]"
        >
          <div className="flex flex-col items-center gap-5">
            <motion.div
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/5"
            >
              <span className="font-mono text-sm font-semibold text-white/80">{initials}</span>
            </motion.div>
            <div className="h-px w-40 overflow-hidden bg-white/10">
              <motion.div
                className="h-full w-1/3 bg-linear-to-r from-transparent via-emerald-400 to-transparent"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Building scene</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OverviewHint({ visible, mobile }: { visible: boolean; mobile: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          key="hint"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pointer-events-none absolute bottom-[78px] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-[11px] tracking-wide text-white/40 md:bottom-[88px]"
        >
          {mobile ? 'Tap a station to explore' : 'Click a station to explore  ·  ← → to navigate  ·  Esc to return'}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function Vignette() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_50%_45%,transparent_55%,rgba(0,0,0,0.6)_100%)]" />
  );
}
