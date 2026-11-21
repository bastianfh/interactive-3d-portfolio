import { motion } from 'framer-motion';
import { profile } from '../data/portfolioData';

/** Discreet contact row: plain text links, no box. */
export function ContactBar() {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.8 }}
      className="absolute left-4 top-4 z-30 flex flex-wrap items-center gap-x-3.5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40 md:left-6 md:top-5 md:text-[10.5px]"
      aria-label="Contact"
    >
      {profile.links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          {...(l.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noreferrer' })}
          className="transition-colors hover:text-white/85"
        >
          {l.label}
        </a>
      ))}
      <span className="text-white/15" aria-hidden>
        ·
      </span>
      <a href="#text" className="transition-colors hover:text-white/85">
        Text view
      </a>
    </motion.nav>
  );
}
