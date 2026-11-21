import { Character } from '../Character';
import { Book, Mug, StationSpot } from '../Furniture';
import { finishes, mat } from '../materials';
import { Box, Rod } from '../primitives';
import { useCanvasTexture } from '../useCanvasTexture';
import { drawWhiteboard, WHITEBOARD_SIZE } from '../textures/whiteboard';

const ALU = mat('#b9bec7', finishes.metal);
const DARK = mat('#22252c', finishes.darkMetal);
const WALNUT = mat('#5a3a28', finishes.wood);
const BOARD_BACK = mat('#e9ebee', { roughness: 0.4, metalness: 0.05 });

function Whiteboard() {
  const tex = useCanvasTexture(WHITEBOARD_SIZE.width, WHITEBOARD_SIZE.height, () => drawWhiteboard);
  const W = 1.82;
  const H = 1.04;
  const cy = 1.45;
  return (
    <group>
      {/* board + printed canvas surface */}
      <Box args={[W + 0.04, H + 0.04, 0.035]} material={BOARD_BACK} position={[0, cy, 0]} />
      <mesh position={[0, cy, 0.0185]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial
          map={tex}
          emissiveMap={tex}
          emissive="#ffffff"
          emissiveIntensity={0.32}
          roughness={0.35}
          metalness={0}
        />
      </mesh>
      {/* aluminium frame */}
      <Box args={[W + 0.1, 0.035, 0.055]} material={ALU} position={[0, cy + H / 2 + 0.03, 0]} />
      <Box args={[W + 0.1, 0.035, 0.055]} material={ALU} position={[0, cy - H / 2 - 0.03, 0]} />
      {[1, -1].map((s) => (
        <Box key={s} args={[0.035, H + 0.1, 0.055]} material={ALU} position={[s * (W / 2 + 0.03), cy, 0]} />
      ))}
      {/* marker tray */}
      <Box args={[1.1, 0.025, 0.1]} material={ALU} position={[0, cy - H / 2 - 0.06, 0.05]} />
      {[
        ['#1d4ed8', -0.25],
        ['#c2410c', -0.1],
        ['#15803d', 0.05],
        ['#1f2430', 0.2],
      ].map(([c, x]) => (
        <mesh
          key={c as string}
          material={mat(c as string, finishes.vinyl)}
          position={[x as number, cy - H / 2 - 0.038, 0.06]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.011, 0.011, 0.12, 6]} />
        </mesh>
      ))}
      {/* easel stand */}
      {[1, -1].map((s) => (
        <group key={`leg${s}`}>
          <Rod from={[s * 0.85, 0.03, -0.02]} to={[s * 0.85, 2.05, -0.02]} radius={0.024} material={ALU} segments={4} />
          <Box args={[0.07, 0.04, 0.62]} material={DARK} position={[s * 0.85, 0.03, 0]} />
          {[0.27, -0.27].map((z) => (
            <mesh key={z} material={DARK} position={[s * 0.85, 0.018, z]}>
              <boxGeometry args={[0.04, 0.032, 0.04]} />
            </mesh>
          ))}
        </group>
      ))}
      <Rod from={[-0.85, 0.35, -0.02]} to={[0.85, 0.35, -0.02]} radius={0.018} material={ALU} segments={4} />
    </group>
  );
}

function SideTable() {
  return (
    <group>
      <Box args={[0.6, 0.04, 0.45]} material={WALNUT} position={[0, 0.74, 0]} />
      {[
        [0.26, 0.19],
        [-0.26, 0.19],
        [0.26, -0.19],
        [-0.26, -0.19],
      ].map(([x, z]) => (
        <Rod key={`${x}${z}`} from={[x, 0, z]} to={[x * 0.92, 0.72, z * 0.92]} radius={0.018} material={DARK} segments={4} />
      ))}
      {/* stack of finance textbooks */}
      <Book size={[0.34, 0.06, 0.25]} color="#1f3a5f" position={[-0.04, 0.79, 0.0]} rotation={0.05} />
      <Book size={[0.3, 0.05, 0.22]} color="#6b1e2a" position={[-0.03, 0.845, 0.0]} rotation={-0.12} />
      <Book size={[0.32, 0.045, 0.23]} color="#1f4d3a" position={[-0.05, 0.893, 0.01]} rotation={0.18} />
      <Book size={[0.27, 0.04, 0.2]} color="#b08a2e" position={[-0.035, 0.935, 0.0]} rotation={-0.04} />
      <Mug position={[0.2, 0.76, 0.1]} color="#1f3a5f" />
    </group>
  );
}

export function AcademicsStation({ dimmed, focused }: { dimmed: boolean; focused: boolean }) {
  return (
    <group>
      <group position={[-0.72, 0, -0.5]} rotation={[0, 0.3, 0]}>
        <Whiteboard />
      </group>
      <Character outfit="business" pose="presenting" phase={0.4} lookRange={0.3} focused={focused} position={[0.55, 0, 0.2]} rotation={[0, -0.18, 0]} />
      <group position={[1.35, 0, -0.45]} rotation={[0, -0.35, 0]}>
        <SideTable />
      </group>
      {/* Books on the floor leaning by the table */}
      <Book size={[0.05, 0.3, 0.22]} color="#3b3f8f" position={[1.52, 0.15, 0.05]} rotation={-0.6} />
      <Book size={[0.05, 0.28, 0.2]} color="#7a5230" position={[1.58, 0.14, 0.0]} rotation={-0.5} />

      <StationSpot position={[1.8, 4.8, 3.0]} target={[-0.1, 1.0, -0.2]} color="#ffd2a0" intensity={38} angle={0.6} dimmed={dimmed} />
      <StationSpot position={[-2.2, 3.6, 1.4]} target={[-0.6, 1.4, -0.4]} color="#ffe6c7" intensity={14} angle={0.5} dimmed={dimmed} />
    </group>
  );
}
