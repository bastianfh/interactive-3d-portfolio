/**
 * Dev-only turnaround of the character (not part of the site build).
 * Run `npm run dev` and open /tools/character-preview.html
 *   ?view=front|side|back|three-quarter   camera angle
 *   &set=main|experience                  which outfits
 *   &zoom                                 close-up on the heads
 *   &focus                                characters look at the camera
 */
import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { Character, type Outfit, type Pose } from '../src/scene/Character';

const params = new URLSearchParams(location.search);
const view = params.get('view') ?? 'front';
const zoom = params.has('zoom');
const focus = params.has('focus');
const yaw = { front: 0, side: Math.PI / 2, back: Math.PI, 'three-quarter': 0.6 }[view] ?? 0;
const sets: Record<string, [Outfit, Pose][]> = {
  main: [
    ['business', 'standing'],
    ['suit', 'standing'],
    ['hoodie', 'standing'],
  ],
  experience: [
    ['athletics', 'holdBall'],
    ['waiter', 'tray'],
    ['casual', 'wave'],
  ],
};
const chars = sets[params.get('set') ?? 'main'] ?? sets.main;

createRoot(document.getElementById('root')!).render(
  <Canvas
    flat
    dpr={1}
    camera={{ position: zoom ? [0, 0.72, 2.3] : [0, 0, 5.2], fov: 30 }}
    gl={{ antialias: false }}
    onCreated={({ camera }) => camera.lookAt(0, zoom ? 0.62 : 0, 0)}
  >
    <color attach="background" args={['#757575']} />
    <ambientLight intensity={0.9} />
    <directionalLight position={[2, 4, 5]} intensity={1.6} />
    <Suspense fallback={null}>
      {chars.map(([o, p], i) => (
        <Character key={o} outfit={o} pose={p} lookRange={0} focused={focus} phase={i * 0.7} position={[(i - 1) * 0.9, -0.9, 0]} rotation={[0, yaw, 0]} />
      ))}
    </Suspense>
  </Canvas>,
);
