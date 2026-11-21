import { useLayoutEffect, useRef } from 'react';
import { Grid } from '@react-three/drei';
import { BackSide, DirectionalLight, DoubleSide } from 'three';

/** Dark slate floor, ambient grid, curved backdrop and global lights. */
export function Stage() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[34, 64]} />
        <meshStandardMaterial color="#111419" roughness={0.88} metalness={0.12} />
      </mesh>
      <Grid
        position={[0, 0.003, 0]}
        args={[80, 80]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1a202b"
        sectionSize={2.5}
        sectionThickness={0.9}
        sectionColor="#253045"
        fadeDistance={30}
        fadeStrength={1.4}
        infiniteGrid
        followCamera={false}
      />
      {/* curved architectural backdrop */}
      <mesh position={[0, 9, 4]}>
        <cylinderGeometry args={[18, 18, 18, 64, 1, true, Math.PI - 1.25, 2.5]} />
        <meshStandardMaterial color="#0d1015" roughness={0.95} metalness={0} side={BackSide} />
      </mesh>
      {/* thin light line along the base of the backdrop */}
      <mesh position={[0, 0.04, 4]}>
        <cylinderGeometry args={[17.9, 17.9, 0.025, 128, 1, true, Math.PI - 1.25, 2.5]} />
        <meshBasicMaterial color="#3b4b6b" side={DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Lighting() {
  const key = useRef<DirectionalLight>(null);
  useLayoutEffect(() => {
    const l = key.current;
    if (!l) return;
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    const cam = l.shadow.camera;
    cam.left = -10;
    cam.right = 10;
    cam.top = 7;
    cam.bottom = -7;
    cam.near = 1;
    cam.far = 40;
    cam.updateProjectionMatrix();
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.025;
    l.target.position.set(0, 0, 0.5);
    l.target.updateMatrixWorld();
  }, []);

  return (
    <>
      <ambientLight intensity={0.32} color="#b7c3dc" />
      <hemisphereLight args={['#93a7c9', '#0b0d12', 0.45]} />
      <directionalLight ref={key} position={[-6, 11, 9]} intensity={1.05} color="#e8eefc" />
      {/* faint cool rim from behind to separate silhouettes from the backdrop */}
      <directionalLight position={[4, 6, -10]} intensity={0.35} color="#8aa2d6" />
    </>
  );
}
