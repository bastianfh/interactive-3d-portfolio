import { Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence } from 'framer-motion';
import { stationOrder, stations, type StationId } from './data/portfolioData';
import { Experience } from './scene/Experience';
import { BACKGROUND, INTRO_CAMERA } from './scene/layout';
import { labelLayer } from './scene/labelLayer';
import { MOBILE_BREAKPOINT } from './scene/CameraRig';
import { useMediaQuery } from './hooks/useMediaQuery';
import { Dock } from './ui/Dock';
import { InfoPanel } from './ui/InfoPanel';
import { Loader, OverviewHint, Vignette } from './ui/Overlays';
import { ContactBar } from './ui/ContactBar';
import { TextResume } from './ui/TextResume';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
const WEBGL = hasWebGL();
const isTextHash = () => window.location.hash === '#text';

export default function App() {
  const [textView, setTextView] = useState(isTextHash);
  useEffect(() => {
    const onHash = () => setTextView(isTextHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!WEBGL) return <TextResume noWebGL />;
  if (textView) return <TextResume />;
  return <Scene3D />;
}

function Scene3D() {
  const [active, setActive] = useState<StationId | null>(null);
  const [hovered, setHovered] = useState<StationId | null>(null);
  const [ready, setReady] = useState(false);
  const mobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

  const select = useCallback((id: StationId | null) => setActive(id), []);
  // fires once the scene (incl. character textures) has mounted; wait two frames so it's on screen
  const onSceneReady = useCallback(() => requestAnimationFrame(() => requestAnimationFrame(() => setReady(true))), []);
  const hover = useCallback(
    (id: StationId, over: boolean) => setHovered((cur) => (over ? id : cur === id ? null : cur)),
    [],
  );

  // Keyboard: Esc → overview, ←/→ → cycle stations
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        setActive((cur) => {
          if (cur === null) return dir === 1 ? stationOrder[0] : stationOrder[stationOrder.length - 1];
          const i = stationOrder.indexOf(cur) + dir;
          return i < 0 || i >= stationOrder.length ? null : stationOrder[i];
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.cursor = hovered && hovered !== active ? 'pointer' : '';
  }, [hovered, active]);

  return (
    <div className="relative h-dvh w-full overflow-hidden" style={{ background: BACKGROUND }}>
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        camera={{ position: INTRO_CAMERA, fov: 38, near: 0.1, far: 120 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Experience active={active} hovered={hovered} onSelect={select} onHover={hover} onReady={onSceneReady} />
        </Suspense>
      </Canvas>
      {/* station labels portal here; no z-index so each label's own z-index still stacks against the UI */}
      <div ref={labelLayer} className="pointer-events-none absolute inset-0" />

      <Vignette />
      <ContactBar />

      <AnimatePresence mode="wait">
        {active && <InfoPanel key={active} station={stations[active]} mobile={mobile} onBack={() => setActive(null)} />}
      </AnimatePresence>

      <OverviewHint visible={ready && active === null} mobile={mobile} />
      <Dock active={active} hovered={hovered} onSelect={select} />
      <Loader visible={!ready} />
    </div>
  );
}
