import { useMemo } from 'react';
import { AdditiveBlending } from 'three';
import { Character } from '../Character';
import { Chair, GlowLight, Monitor, Plant, StationSpot } from '../Furniture';
import { finishes, mat } from '../materials';
import { Box, Keycaps, Rod } from '../primitives';
import { memoGeo, taperBox } from '../lowpoly';
import { useCanvasTexture } from '../useCanvasTexture';
import { createUltrawide, createVertical, drawLedGlow, ULTRAWIDE_SIZE, VERTICAL_SIZE } from '../textures/coding';

const DESK = mat('#212329', { grain: 'wood' });
const LEG = mat('#2a2c33', { grain: 'metal' });
const PANEL = mat('#101218', { roughness: 0.9, metalness: 0.0 });
const ALU = mat('#3a3d45', finishes.metal);
const LAMP = mat('#1c1d22', finishes.darkMetal);
const LED_TEAL = mat('#22d3ee', { roughness: 0.4, emissive: '#22d3ee', emissiveIntensity: 3 });
const LED_INDIGO = mat('#6366f1', { roughness: 0.4, emissive: '#6366f1', emissiveIntensity: 3 });
const BULB = mat('#fff1cc', { roughness: 0.3, emissive: '#ffe2a8', emissiveIntensity: 4 });

const DESK_TOP = 0.75;

function DeskLamp({ dimmed }: { dimmed: boolean }) {
  // base → shoulder → elbow → head
  const shoulder: [number, number, number] = [0, 0.03, 0];
  const elbow: [number, number, number] = [0.0, 0.4, -0.1];
  const head: [number, number, number] = [-0.05, 0.43, 0.2];
  return (
    <group>
      <mesh material={LAMP} position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.085, 0.095, 0.024, 6]} />
      </mesh>
      <Rod from={shoulder} to={elbow} radius={0.013} material={LAMP} segments={4} />
      <Box args={[0.034, 0.034, 0.034]} material={LAMP} position={elbow} />
      <Rod from={elbow} to={head} radius={0.012} material={LAMP} segments={4} />
      <group position={head} rotation={[-0.5, 0, 0.35]}>
        <mesh material={LAMP} position={[0, -0.03, 0]}>
          <coneGeometry args={[0.075, 0.11, 6, 1, true]} />
        </mesh>
        <mesh material={BULB} position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.03, 6, 3]} />
        </mesh>
      </group>
      <GlowLight position={[head[0] + 0.05, head[1] - 0.12, head[2] + 0.08]} color="#ffd59e" intensity={0.9} distance={1.8} dimmed={dimmed} />
    </group>
  );
}

export function CodingStation({ dimmed, focused }: { dimmed: boolean; focused: boolean }) {
  const ultra = useCanvasTexture(ULTRAWIDE_SIZE.width, ULTRAWIDE_SIZE.height, createUltrawide, 8, !dimmed);
  const vertical = useCanvasTexture(VERTICAL_SIZE.width, VERTICAL_SIZE.height, createVertical, 10, !dimmed);
  const glowTeal = useCanvasTexture(256, 128, () => drawLedGlow('rgba(34,211,238,0.9)'));
  const glowIndigo = useCanvasTexture(256, 128, () => drawLedGlow('rgba(99,102,241,0.9)'));
  const accents = useMemo(() => ({ '0,0': '#4fd6be', '4,13': '#818cf8' }), []);

  return (
    <group>
      {/* back acoustic panel with LED strips */}
      <Box args={[2.3, 1.9, 0.05]} material={PANEL} position={[0, 0.95, -0.98]} />
      {[0.5, 1.2, 1.9].map((y, i) => (
        <Box key={y} args={[2.26, 0.014, 0.06]} material={mat(i % 2 ? '#14161d' : '#0c0e13', finishes.fabric)} position={[0, y - 0.35, -0.95]} />
      ))}
      <mesh material={LED_TEAL} position={[0, DESK_TOP + 0.04, -0.945]}>
        <boxGeometry args={[2.1, 0.014, 0.014]} />
      </mesh>
      <mesh material={LED_INDIGO} position={[0, 1.86, -0.945]}>
        <boxGeometry args={[2.1, 0.012, 0.012]} />
      </mesh>
      <mesh position={[0, DESK_TOP + 0.1, -0.948]} userData={{ noShadow: true }}>
        <planeGeometry args={[2.3, 0.55]} />
        <meshBasicMaterial map={glowTeal} transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.76, -0.948]} userData={{ noShadow: true }}>
        <planeGeometry args={[2.3, 0.45]} />
        <meshBasicMaterial map={glowIndigo} transparent opacity={0.45} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* minimalist desk */}
      <Box args={[2.1, 0.05, 0.78]} material={DESK} position={[0, DESK_TOP - 0.025, -0.36]} />
      {/* square steel legs + side stretchers */}
      {[
        [0.98, -0.03],
        [-0.98, -0.03],
        [0.98, -0.69],
        [-0.98, -0.69],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} args={[0.045, DESK_TOP - 0.05, 0.045]} material={LEG} position={[x, (DESK_TOP - 0.05) / 2, z]} />
      ))}
      {[0.98, -0.98].map((x) => (
        <Box key={x} args={[0.035, 0.035, 0.66]} material={LEG} position={[x, 0.12, -0.36]} />
      ))}

      {/* ultrawide + vertical side monitor */}
      <Monitor size={[1.28, 0.54]} texture={ultra} position={[-0.12, DESK_TOP + 0.007 + 0.13 + 0.27, -0.56]} standHeight={0.13} />
      <Monitor size={[0.36, 0.64]} texture={vertical} position={[0.86, DESK_TOP + 0.007 + 0.1 + 0.32, -0.42]} rotation={-0.55} standHeight={0.1} />

      {/* low-profile keyboard + trackpad */}
      <group position={[-0.05, DESK_TOP, -0.1]}>
        <mesh geometry={memoGeo('codeKb', () => taperBox(0.42, 0.42, 0.014, 0.125, 0.14, 0.06))} material={ALU} position={[0, 0.007, 0]} />
        <group position={[0, 0.014, 0]}>
          <Keycaps cols={15} rows={5} width={0.4} depth={0.115} keyHeight={0.007} baseColor="#1b1d22" accents={accents} />
        </group>
      </group>
      <Box args={[0.13, 0.008, 0.11]} material={ALU} position={[0.27, DESK_TOP + 0.004, -0.1]} />

      <group position={[-0.92, DESK_TOP, -0.5]}>
        <DeskLamp dimmed={dimmed} />
      </group>
      <Plant position={[-0.66, DESK_TOP, -0.16]} />

      {/* developer, seated facing the screens */}
      <group position={[-0.05, 0, 0.42]} rotation={[0, Math.PI, 0]}>
        <Chair color="#262932" />
        <Character outfit="hoodie" pose="typing" phase={3.1} lookRange={0.18} focused={focused} />
      </group>

      {/* moody teal / indigo lighting */}
      <StationSpot position={[1.9, 4.6, 2.6]} target={[0, 0.9, -0.3]} color="#9aa7ff" intensity={26} angle={0.58} dimmed={dimmed} />
      <GlowLight position={[-0.6, 0.95, -0.8]} color="#2dd4bf" intensity={2.2} distance={2.8} dimmed={dimmed} />
      <GlowLight position={[0.6, 1.4, -0.8]} color="#6366f1" intensity={2.4} distance={2.8} dimmed={dimmed} />
      <GlowLight position={[-0.1, 1.15, -0.3]} color="#7dd3fc" intensity={1.0} distance={2.2} dimmed={dimmed} flicker={0.04} />
    </group>
  );
}
