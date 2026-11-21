import { Character } from '../Character';
import { StationSpot } from '../Furniture';
import { finishes, mat } from '../materials';
import { Box, Rod } from '../primitives';

/*
 * Work experience: the same character three times, one per job.
 * Left: CSUSM Department of Athletics (tee + basketball, hoop behind).
 * Centre: Rigoletto Bar & Grill, Tokyo (black waiter uniform + tray, café table).
 * Right: Rodtvet Kindergarten, Oslo (sweater + jeans, toy blocks + small chair).
 */

const POLE = mat('#1f2228', finishes.darkMetal);
const BOARD = mat('#d9dde2', { roughness: 0.7 });
const BOARD_LINE = mat('#c4472d');
const RIM = mat('#d9581f', finishes.vinyl);
const NET = mat('#e8e8e4', finishes.fabric);
const TABLE_TOP = mat('#2a1d16', { grain: 'wood' });
const TABLE_METAL = mat('#16181d', finishes.darkMetal);
const BOTTLE = mat('#0f2a1a', finishes.gloss);
const LABEL = mat('#e9dfc6');
const CANDLE = mat('#f2e7cf', { emissive: '#ffcf8a', emissiveIntensity: 0.6 });
const KID_CHAIR = mat('#2f6fb3', finishes.vinyl);
const BLOCKS = ['#d9473a', '#f2b632', '#3d9b5a', '#2f6fb3', '#e07a2f', '#8a4fb5'].map((c) => mat(c, finishes.vinyl));

const SCALE = 0.86;

function Hoop() {
  return (
    <group>
      <Box args={[0.36, 0.06, 0.5]} material={POLE} position={[0, 0.03, 0]} />
      <Box args={[0.07, 2.3, 0.07]} material={POLE} position={[0, 1.15, 0]} />
      <Box args={[0.06, 0.06, 0.42]} material={POLE} position={[0, 2.25, 0.2]} />
      {/* backboard with the shooter's square */}
      <Box args={[0.9, 0.56, 0.03]} material={BOARD} position={[0, 2.3, 0.42]} />
      <Box args={[0.3, 0.02, 0.005]} material={BOARD_LINE} position={[0, 2.32, 0.437]} />
      <Box args={[0.3, 0.02, 0.005]} material={BOARD_LINE} position={[0, 2.12, 0.437]} />
      <Box args={[0.02, 0.2, 0.005]} material={BOARD_LINE} position={[-0.14, 2.22, 0.437]} />
      <Box args={[0.02, 0.2, 0.005]} material={BOARD_LINE} position={[0.14, 2.22, 0.437]} />
      <mesh material={RIM} position={[0, 2.08, 0.63]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.012, 4, 10]} />
      </mesh>
      {/* faceted net */}
      <mesh material={NET} position={[0, 1.96, 0.63]}>
        <cylinderGeometry args={[0.2, 0.13, 0.24, 10, 1, true]} />
      </mesh>
    </group>
  );
}

function CafeTable() {
  return (
    <group>
      <mesh material={TABLE_TOP} position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.035, 10]} />
      </mesh>
      <mesh material={TABLE_METAL} position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.72, 6]} />
      </mesh>
      <mesh material={TABLE_METAL} position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.024, 8]} />
      </mesh>
      {/* wine bottle + candle */}
      <group position={[-0.1, 0.76, 0.04]}>
        <mesh material={BOTTLE} position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 8]} />
        </mesh>
        <mesh material={BOTTLE} position={[0, 0.29, 0]}>
          <cylinderGeometry args={[0.014, 0.034, 0.1, 8]} />
        </mesh>
        <mesh material={LABEL} position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.041, 0.041, 0.08, 8, 1, true]} />
        </mesh>
      </group>
      <mesh material={CANDLE} position={[0.13, 0.81, -0.05]}>
        <cylinderGeometry args={[0.022, 0.022, 0.1, 6]} />
      </mesh>
    </group>
  );
}

function ToyCorner() {
  const stack: [number, number, number, number][] = [
    [0, 0.06, 0, 0],
    [0.13, 0.06, 0.02, 1],
    [0.06, 0.18, 0.01, 2],
    [-0.12, 0.06, 0.08, 3],
    [0.24, 0.06, -0.1, 4],
    [0.17, 0.18, -0.03, 5],
  ];
  return (
    <group>
      {stack.map(([x, y, z, c], i) => (
        <Box key={i} args={[0.12, 0.12, 0.12]} material={BLOCKS[c]} position={[x, y, z]} rotation={[0, i * 0.35, 0]} />
      ))}
      {/* small kid's chair */}
      <group position={[0.05, 0, -0.45]} rotation={[0, 0.4, 0]}>
        <Box args={[0.3, 0.035, 0.28]} material={KID_CHAIR} position={[0, 0.3, 0]} />
        <Box args={[0.3, 0.26, 0.03]} material={KID_CHAIR} position={[0, 0.45, -0.13]} />
        {[
          [0.13, 0.12],
          [-0.13, 0.12],
          [0.13, -0.12],
          [-0.13, -0.12],
        ].map(([x, z]) => (
          <Rod key={`${x}${z}`} from={[x, 0, z]} to={[x, 0.29, z]} radius={0.014} material={KID_CHAIR} segments={4} />
        ))}
      </group>
    </group>
  );
}

export function ExperienceStation({ dimmed, focused }: { dimmed: boolean; focused: boolean }) {
  return (
    <group>
      {/* CSUSM Department of Athletics */}
      <group position={[-1.3, 0, -1.05]} rotation={[0, 0.3, 0]}>
        <Hoop />
      </group>
      <Character outfit="athletics" pose="holdBall" phase={0.9} lookRange={0.25} focused={focused} scale={SCALE} position={[-0.95, 0, 0.1]} rotation={[0, 0.28, 0]} />

      {/* Rigoletto Bar & Grill, Tokyo */}
      <group position={[0.25, 0, -1.0]}>
        <CafeTable />
      </group>
      <Character outfit="waiter" pose="tray" phase={2.3} lookRange={0.2} focused={focused} scale={SCALE} position={[0, 0, -0.3]} rotation={[0, 0, 0]} />

      {/* Rodtvet Kindergarten, Oslo */}
      <group position={[1.25, 0, -0.55]}>
        <ToyCorner />
      </group>
      <Character outfit="casual" pose="wave" phase={4.1} lookRange={0.25} focused={focused} scale={SCALE} position={[0.95, 0, 0.1]} rotation={[0, -0.28, 0]} />

      <StationSpot position={[0, 4.8, 3.0]} target={[0, 1.0, -0.2]} color="#ffd7b0" intensity={34} angle={0.62} dimmed={dimmed} />
      <StationSpot position={[-2.0, 3.4, 1.2]} target={[-0.9, 1.2, -0.6]} color="#ffe6c7" intensity={10} angle={0.5} dimmed={dimmed} />
    </group>
  );
}
