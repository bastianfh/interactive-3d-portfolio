import { useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Color, Group, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { stations, stationOrder, type StationId } from '../data/portfolioData';
import { STATION_LAYOUT } from './layout';
import { labelLayer } from './labelLayer';

export const PLATFORM_H = 0.08;
const RADIUS = 2.05;

interface Props {
  id: StationId;
  active: StationId | null;
  hovered: boolean;
  onSelect: (id: StationId) => void;
  onHover: (id: StationId, over: boolean) => void;
  children: ReactNode;
}

export function StationShell({ id, active, hovered, onSelect, onHover, children }: Props) {
  const layout = STATION_LAYOUT[id];
  const content = stations[id];
  const isActive = active === id;
  const showLabel = active === null;
  const index = stationOrder.indexOf(id) + 1;
  // labels are scaled by camera distance; mobile overview sits further back
  const labelScale = useThree((s) => (s.size.width < 768 ? 24 : 10));

  const contentRef = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const gem = useRef<Mesh>(null);

  const ringMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(layout.accent),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [layout.accent],
  );
  const trimMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#1b1f27',
        emissive: new Color(layout.accent),
        emissiveIntensity: 0.25,
        roughness: 0.4,
        metalness: 0.6,
      }),
    [layout.accent],
  );
  const gemMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(layout.accent),
        emissive: new Color(layout.accent),
        emissiveIntensity: 1.4,
        roughness: 0.25,
        metalness: 0.3,
        flatShading: true,
        transparent: true,
      }),
    [layout.accent],
  );

  // every mesh inside the diorama casts + receives soft shadows
  useLayoutEffect(() => {
    contentRef.current?.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && !m.userData.noShadow) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  });

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const ringTarget = hovered && !isActive ? 0.9 : isActive ? 0.4 : 0.12;
    ringMat.opacity = MathUtils.damp(ringMat.opacity, ringTarget, 6, dt);
    if (ring.current) ring.current.scale.setScalar(1 + (hovered && !isActive ? Math.sin(t * 3) * 0.012 : 0));
    trimMat.emissiveIntensity = MathUtils.damp(trimMat.emissiveIntensity, hovered || isActive ? 1.2 : 0.25, 6, dt);
    if (gem.current) {
      gem.current.rotation.y = t * 0.8 + index;
      gem.current.position.y = layout.labelHeight + 0.5 + Math.sin(t * 1.6 + index) * 0.05;
      gemMat.opacity = MathUtils.damp(gemMat.opacity, showLabel ? 1 : 0, 5, dt);
      gem.current.visible = gemMat.opacity > 0.02;
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(id, true);
  };
  const out = () => onHover(id, false);
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(id);
  };

  return (
    <group position={layout.position} rotation={[0, layout.rotation, 0]}>
      {/* platform */}
      <mesh position={[0, PLATFORM_H / 2, 0]} receiveShadow>
        <cylinderGeometry args={[RADIUS, RADIUS + 0.04, PLATFORM_H, 72]} />
        <meshStandardMaterial color="#181b22" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0, PLATFORM_H, 0]} rotation={[Math.PI / 2, 0, 0]} material={trimMat}>
        <torusGeometry args={[RADIUS - 0.01, 0.012, 8, 96]} />
      </mesh>
      {/* hover ring on the floor */}
      <mesh ref={ring} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ringMat}>
        <ringGeometry args={[RADIUS + 0.12, RADIUS + 0.2, 96]} />
      </mesh>

      <group ref={contentRef} position={[0, PLATFORM_H, 0]} rotation={[0, layout.rigRotation, 0]}>
        {children}
      </group>

      {/* invisible hit volume for hover / click */}
      <mesh position={[0, 1.3, 0]} onPointerOver={over} onPointerOut={out} onClick={click}>
        <cylinderGeometry args={[RADIUS, RADIUS, 2.6, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* floating label */}
      <mesh ref={gem} position={[0, layout.labelHeight + 0.5, 0]} material={gemMat}>
        <octahedronGeometry args={[0.11, 0]} />
      </mesh>
      <Html
        position={[0, layout.labelHeight, 0]}
        center
        distanceFactor={labelScale}
        zIndexRange={[20, 0]}
        portal={labelLayer as RefObject<HTMLElement>}
      >
        <button
          type="button"
          onClick={() => onSelect(id)}
          onPointerEnter={() => onHover(id, true)}
          onPointerLeave={() => onHover(id, false)}
          className={`flex flex-col items-center gap-1.5 whitespace-nowrap transition-all duration-500 select-none ${
            showLabel ? 'pointer-events-auto opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'
          }`}
          tabIndex={showLabel ? 0 : -1}
          aria-label={`Open ${content.navLabel}`}
        >
          <span
            className="flex items-center gap-2 rounded-full border bg-black/45 px-4 py-1.5 backdrop-blur-md transition-all duration-300"
            style={{
              borderColor: hovered ? layout.accent : 'rgba(255,255,255,0.12)',
              boxShadow: hovered ? `0 0 24px ${layout.accent}55` : 'none',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: layout.accent, boxShadow: `0 0 10px ${layout.accent}` }} />
            <span className="font-mono text-[10px] text-white/45">0{index}</span>
            <span className="text-[12px] font-semibold tracking-[0.22em] text-white">{content.navLabel.toUpperCase()}</span>
          </span>
          <span className="text-[10px] tracking-wider text-white/45">{content.tagline}</span>
        </button>
      </Html>
    </group>
  );
}
