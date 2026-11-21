import { profile, stationOrder, stations } from '../data/portfolioData';

/**
 * Plain, fast, accessible version of the resume: no 3D, no animation.
 * Reached from the "Text view" link, and shown automatically when the
 * browser can't run WebGL (e.g. locked-down work laptops).
 */
export function TextResume({ noWebGL = false }: { noWebGL?: boolean }) {
  return (
    <div className="h-dvh overflow-y-auto bg-[#0a0c10] text-white/80">
      <main className="mx-auto max-w-2xl px-6 py-12 md:py-16">
        <header className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{profile.name}</h1>
          <p className="mt-1 text-[14px] text-white/60">{profile.oneLiner}</p>
          <p className="mt-0.5 text-[13px] text-white/45">{profile.location}</p>
          <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            {profile.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                {...(l.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noreferrer' })}
                className="text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            {!noWebGL && (
              <a href="#" className="text-white/45 underline decoration-white/15 underline-offset-4 hover:text-white">
                3D version
              </a>
            )}
          </nav>
          {noWebGL && <p className="mt-3 text-[12px] text-white/40">The interactive 3D version needs WebGL, which this browser doesn’t have turned on.</p>}
        </header>

        {stationOrder.map((id) => {
          const s = stations[id];
          return (
            <section key={id} className="mb-10 border-t border-white/10 pt-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">{s.navLabel}</h2>
              <h3 className="mt-2 text-lg font-semibold text-white">{s.title}</h3>
              <p className="text-[13px] text-white/50">{s.subtitle}</p>
              <p className="mt-3 text-[14px] leading-relaxed">{s.summary}</p>
              <p className="mt-3 text-[13px] text-white/65">{s.metrics.map((m) => `${m.label}: ${m.value}`).join('  ·  ')}</p>

              {s.projects?.map((p) => (
                <div key={p.name} className="mt-5">
                  <h4 className="text-[14px] font-semibold text-white">{p.name}</h4>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-white/75">{p.description}</p>
                  <p className="mt-1 text-[12px] text-white/45">{p.tags.join(' · ')}</p>
                  {p.links && (
                    <p className="mt-1 flex gap-4 text-[13px]">
                      {p.links.map((l) => (
                        <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="underline decoration-white/20 underline-offset-4 hover:text-white">
                          {l.label}
                        </a>
                      ))}
                    </p>
                  )}
                </div>
              ))}

              {s.sections.map((sec) => (
                <div key={sec.heading} className="mt-5">
                  <h4 className="text-[14px] font-semibold text-white">{sec.heading}</h4>
                  {sec.body && <p className="text-[12.5px] text-white/50">{sec.body}</p>}
                  {sec.items && (
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13.5px] leading-relaxed marker:text-white/30">
                      {sec.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  )}
                  {sec.tags && <p className="mt-1 text-[13.5px] text-white/70">{sec.tags.join(' · ')}</p>}
                </div>
              ))}
            </section>
          );
        })}
      </main>
    </div>
  );
}
