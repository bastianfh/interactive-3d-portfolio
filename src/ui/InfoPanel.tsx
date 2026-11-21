import { motion, type Variants } from 'framer-motion';
import { stationOrder, type StationContent } from '../data/portfolioData';
import { STATION_LAYOUT } from '../scene/layout';

interface Props {
  station: StationContent;
  mobile: boolean;
  onBack: () => void;
}

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function ExternalLink({ href, label, accent }: { href: string; label: string; accent: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11.5px] font-medium text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
    >
      <span className="h-1 w-1 rounded-full" style={{ background: accent }} />
      {label}
      <span className="text-white/40 transition-transform group-hover:-translate-y-px group-hover:translate-x-px">↗</span>
    </a>
  );
}

export function InfoPanel({ station, mobile, onBack }: Props) {
  const { accent } = STATION_LAYOUT[station.id];
  const index = stationOrder.indexOf(station.id) + 1;

  return (
    <motion.aside
      key={station.id}
      initial={mobile ? { y: '105%', opacity: 0.6 } : { x: '110%', opacity: 0.6 }}
      animate={mobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
      exit={mobile ? { y: '105%', opacity: 0 } : { x: '110%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 26, mass: 0.9 }}
      className={
        mobile
          ? 'absolute inset-x-3 bottom-[84px] z-20 flex max-h-[54dvh] flex-col'
          : 'absolute bottom-24 right-4 top-4 z-20 flex w-[min(460px,40vw)] flex-col'
      }
      aria-label={`${station.navLabel} details`}
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/[0.09] to-white/[0.03] shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        {/* accent glow */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-25 blur-3xl"
          style={{ background: accent }}
        />

        {/* header */}
        <div className="relative flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.3em]" style={{ color: accent }}>
              0{index} — {station.navLabel}
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-white">{station.title}</h2>
            <p className="mt-1 text-[13px] text-white/55">{station.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/15 hover:text-white"
            aria-label="Back to overview"
          >
            ✕
          </button>
        </div>

        {/* scrollable body */}
        <motion.div
          variants={list}
          initial="hidden"
          animate="show"
          className="glass-scroll relative min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6"
        >
          <motion.p variants={item} className="text-[13.5px] leading-relaxed text-white/75">
            {station.summary}
          </motion.p>

          <motion.div variants={item} className="grid grid-cols-2 gap-2.5">
            {station.metrics.map((m) => {
              const solo = station.metrics.length === 1;
              return (
                <div
                  key={m.label}
                  className={`rounded-2xl border border-white/[0.07] bg-black/25 px-3.5 py-3 ${solo ? 'col-span-2 py-4' : ''}`}
                >
                  <p className={`${solo ? 'text-[26px]' : 'text-[17px]'} font-semibold tracking-tight text-white`}>{m.value}</p>
                  <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.16em] text-white/45">{m.label}</p>
                </div>
              );
            })}
          </motion.div>

          {station.projects && station.projects.length > 0 && (
            <motion.section variants={item}>
              <h3 className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/45">
                Projects
              </h3>
              <div className="space-y-2.5">
                {station.projects.map((p) => (
                  <div key={p.name} className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
                    <p className="text-[14px] font-semibold text-white">{p.name}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-white/60">{p.description}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10.5px] text-white/55">
                          {t}
                        </span>
                      ))}
                    </div>
                    {p.links && p.links.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.links.map((l) => (
                          <ExternalLink key={l.label} {...l} accent={accent} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {station.sections.map((s) => (
            <motion.section variants={item} key={s.heading}>
              <h3 className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/45">{s.heading}</h3>
              {s.body && <p className={`text-[12.5px] leading-relaxed text-white/50 ${s.items || s.tags ? 'mb-2' : ''}`}>{s.body}</p>}
              {s.items && (
                <ul className="space-y-2">
                  {s.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-[13px] leading-snug text-white/75">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: accent }} />
                      {it}
                    </li>
                  ))}
                </ul>
              )}
              {s.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border px-2.5 py-1 text-[11.5px] text-white/80"
                      style={{ borderColor: `${accent}40`, background: `${accent}12` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </motion.section>
          ))}

          {station.links && station.links.length > 0 && (
            <motion.div variants={item} className="flex flex-wrap gap-2">
              {station.links.map((l) => (
                <ExternalLink key={l.label} {...l} accent={accent} />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* footer */}
        <div className="relative border-t border-white/[0.07] px-6 py-4">
          <button
            type="button"
            onClick={onBack}
            className="flex w-full items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <span>← Back to Overview</span>
            <kbd className="rounded-md border border-white/15 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
              Esc
            </kbd>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
