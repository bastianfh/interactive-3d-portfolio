import { useMemo } from 'react';
import { Character } from '../Character';
import { Chair, GlowLight, Monitor, Mug, StationSpot } from '../Furniture';
import { finishes, mat } from '../materials';
import { Box, Keycaps } from '../primitives';
import { memoGeo, taperBox } from '../lowpoly';
import { useCanvasTexture } from '../useCanvasTexture';
import { createCandleChart, createOrderBook, TRADING_SCREEN_SIZE } from '../textures/trading';

const DESK = mat('#1c1f26', { grain: 'wood' });
const DRAWER_LINE = mat('#07080a', finishes.vinyl);
const DESK_EDGE = mat('#353b47', { grain: 'metal' });
const SLAB = mat('#14171c');
const KEYBOARD = mat('#191b20', finishes.darkMetal);

const DESK_TOP = 0.76;

export function TradingStation({ dimmed, focused }: { dimmed: boolean; focused: boolean }) {
  const { width, height } = TRADING_SCREEN_SIZE;
  const chart = useCanvasTexture(width, height, createCandleChart, 9, !dimmed);
  const book = useCanvasTexture(width, height, createOrderBook, 7, !dimmed);
  // Bloomberg-style accent keys: amber function row, red/green action keys
  const accents = useMemo(() => {
    const a: Record<string, string> = {};
    for (let c = 1; c < 12; c++) a[`0,${c}`] = '#d99a00';
    a['0,0'] = '#c0392b';
    a['4,13'] = '#1f9d55';
    a['4,14'] = '#1f9d55';
    a['3,14'] = '#c0392b';
    return a;
  }, []);

  const screenY = DESK_TOP + 0.007 + 0.14 + 0.22;

  return (
    <group>
      {/* executive desk: thick slab top, metal front lip, chunky panel legs, drawer pedestal */}
      <Box args={[1.9, 0.06, 0.82]} material={DESK} position={[0, DESK_TOP - 0.03, -0.35]} />
      <Box args={[1.9, 0.024, 0.02]} material={DESK_EDGE} position={[0, DESK_TOP - 0.034, 0.068]} />
      {[1, -1].map((s) => (
        <mesh
          key={s}
          geometry={memoGeo('tradeLeg', () => taperBox(0.06, 0.08, DESK_TOP - 0.06, 0.74, 0.78, 0.1))}
          material={SLAB}
          position={[s * 0.9, (DESK_TOP - 0.06) / 2, -0.35]}
        />
      ))}
      <Box args={[1.76, 0.42, 0.035]} material={SLAB} position={[0, 0.48, -0.7]} />
      <group position={[-0.6, 0, -0.38]}>
        <Box args={[0.42, DESK_TOP - 0.06, 0.62]} material={SLAB} position={[0, (DESK_TOP - 0.06) / 2, 0]} />
        {[0.2, 0.42, 0.6].map((y) => (
          <Box key={y} args={[0.38, 0.008, 0.004]} material={DRAWER_LINE} position={[0, y, 0.312]} />
        ))}
        {[0.31, 0.51].map((y) => (
          <Box key={y} args={[0.1, 0.016, 0.02]} material={DESK_EDGE} position={[0, y, 0.32]} />
        ))}
      </group>

      {/* dual Bloomberg-style terminal */}
      <Monitor size={[0.78, 0.44]} texture={chart} position={[-0.415, screenY, -0.6]} rotation={0.17} standHeight={0.14} />
      <Monitor size={[0.78, 0.44]} texture={book} position={[0.415, screenY, -0.6]} rotation={-0.17} standHeight={0.14} />

      {/* mechanical keyboard */}
      <group position={[0.06, DESK_TOP, -0.1]}>
        <mesh geometry={memoGeo('tradeKb', () => taperBox(0.46, 0.46, 0.028, 0.145, 0.16, 0.06))} material={KEYBOARD} position={[0, 0.014, 0]} />
        <group position={[0, 0.028, 0]}>
          <Keycaps cols={15} rows={5} width={0.43} depth={0.13} keyHeight={0.014} baseColor="#2a2d34" accents={accents} />
        </group>
      </group>
      {/* mouse + pad */}
      <group position={[0.43, DESK_TOP, -0.08]}>
        <Box args={[0.26, 0.004, 0.22]} material={mat('#0b0c0f', finishes.fabric)} position={[0, 0.002, 0]} />
        <mesh geometry={memoGeo('mouse', () => taperBox(0.044, 0.062, 0.03, 0.07, 0.1, 0.3))} material={KEYBOARD} position={[-0.02, 0.019, 0.02]} />
      </group>
      <Mug position={[-0.7, DESK_TOP, -0.18]} />
      {/* desk notepad + pen */}
      <group position={[-0.46, DESK_TOP, -0.05]} rotation={[0, 0.3, 0]}>
        <Box args={[0.15, 0.008, 0.21]} material={mat('#f2efe6', finishes.fabric)} position={[0, 0.004, 0]} />
        <mesh material={mat('#c9a85a', finishes.metal)} position={[0.03, 0.012, 0]} rotation={[Math.PI / 2, 0, 0.2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.14, 4]} />
        </mesh>
      </group>

      {/* trader, seated facing the screens */}
      <group position={[0.1, 0, 0.42]} rotation={[0, Math.PI, 0]}>
        <Chair executive color="#17181c" />
        <Character outfit="suit" pose="mouse" phase={1.7} lookRange={0.32} focused={focused} />
      </group>

      {/* lighting: cool institutional key + amber/emerald screen spill */}
      <StationSpot position={[-1.8, 4.9, 2.8]} target={[0, 0.9, -0.2]} color="#bcd4ff" intensity={36} angle={0.58} dimmed={dimmed} />
      <GlowLight position={[-0.45, 1.15, -0.25]} color="#ffb347" intensity={1.6} distance={2.6} dimmed={dimmed} flicker={0.06} />
      <GlowLight position={[0.45, 1.15, -0.25]} color="#34d399" intensity={1.4} distance={2.6} dimmed={dimmed} flicker={0.05} />
      <StationSpot position={[0, 2.6, -2.2]} target={[0.1, 1.1, 0.4]} color="#7dd3fc" intensity={10} angle={0.5} dimmed={dimmed} />
    </group>
  );
}
