import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Fog, PerspectiveCamera, Vector3 } from 'three';
import type { StationId } from '../data/portfolioData';
import { OVERVIEW_SHOT, STATION_LAYOUT } from './layout';
import { PLATFORM_H } from './StationShell';

const UP = new Vector3(0, 1, 0);
export const MOBILE_BREAKPOINT = 768;

interface OrbitLimits {
  enabled: boolean;
  minAzimuth: number;
  maxAzimuth: number;
  minPolar: number;
  maxPolar: number;
  minDistance: number;
  maxDistance: number;
}

const FREE: OrbitLimits = {
  enabled: false,
  minAzimuth: -Infinity,
  maxAzimuth: Infinity,
  minPolar: 0,
  maxPolar: Math.PI,
  minDistance: 0,
  maxDistance: Infinity,
};

/**
 * Computes where the camera should be for the current mode.
 * For stations, the shot is panned so the subject sits in the area not
 * covered by the info panel (right side on desktop, top on mobile).
 */
function computeShot(
  active: StationId | null,
  camera: PerspectiveCamera,
  width: number,
  height: number,
  outPos: Vector3,
  outTarget: Vector3,
) {
  const aspect = width / height;
  const mobile = width < MOBILE_BREAKPOINT;

  if (!active) {
    outTarget.set(...OVERVIEW_SHOT.target);
    outPos.set(...OVERVIEW_SHOT.position).sub(outTarget);
    // pull back on narrow screens so all three stations fit
    outPos.multiplyScalar(Math.min(4.2, Math.max(1, 2.05 / aspect)));
    outPos.add(outTarget);
    return;
  }

  const l = STATION_LAYOUT[active];
  const rot = l.rotation + l.rigRotation;
  const focus = new Vector3(...l.focus.point).setY(l.focus.point[1] + PLATFORM_H).applyAxisAngle(UP, rot);
  focus.add(new Vector3(...l.position));
  const offset = new Vector3(...l.focus.offset).applyAxisAngle(UP, rot);
  if (mobile) offset.multiplyScalar(Math.min(2.2, Math.max(1.15, 1.3 / aspect)));

  const halfH = Math.tan((camera.fov * Math.PI) / 360) * offset.length();
  const halfW = halfH * aspect;
  const forward = offset.clone().negate().normalize();
  const right = new Vector3().crossVectors(forward, UP).normalize();

  outTarget.copy(focus);
  if (mobile) {
    // bottom sheet covers ~60% of the screen → lift subject into the top area
    outTarget.addScaledVector(UP, -0.6 * halfH);
  } else {
    const panelPx = Math.min(460, width * 0.4) + 24;
    const p = panelPx / width;
    outTarget.addScaledVector(right, p * halfW);
  }
  outPos.copy(outTarget).add(offset);
}

export function CameraRig({ active }: { active: StationId | null }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const [limits, setLimits] = useState<OrbitLimits>(FREE);

  const desiredPos = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());
  const settled = useRef(false);

  // Any change of station (or viewport) re-arms the fly-to animation.
  useEffect(() => {
    settled.current = false;
    setLimits(FREE);
  }, [active, size.width, size.height]);

  useFrame((state, delta) => {
    const c = controls.current;
    if (!c) return;
    computeShot(active, camera, size.width, size.height, desiredPos.current, desiredTarget.current);

    if (!active) {
      // overview: gentle mouse parallax
      desiredPos.current.x += state.pointer.x * 0.9;
      desiredPos.current.y += state.pointer.y * 0.45;
    } else if (settled.current) {
      return; // user may now orbit freely within limits
    }

    // keep fog relative to the shot so zoomed-out mobile views stay clear
    if (state.scene.fog instanceof Fog) {
      const d = camera.position.distanceTo(c.target);
      state.scene.fog.near = d + 5;
      state.scene.fog.far = d + 26;
    }

    const k = 1 - Math.exp(-delta * (active ? 2.4 : 2.0));
    camera.position.lerp(desiredPos.current, k);
    c.target.lerp(desiredTarget.current, k);
    c.update();

    if (
      active &&
      camera.position.distanceTo(desiredPos.current) < 0.015 &&
      c.target.distanceTo(desiredTarget.current) < 0.015
    ) {
      settled.current = true;
      const off = camera.position.clone().sub(c.target);
      const dist = off.length();
      const az = Math.atan2(off.x, off.z);
      const polar = Math.acos(off.y / dist);
      setLimits({
        enabled: true,
        minAzimuth: az - 0.5,
        maxAzimuth: az + 0.5,
        minPolar: Math.max(0.35, polar - 0.35),
        maxPolar: Math.min(1.45, polar + 0.25),
        minDistance: dist * 0.75,
        maxDistance: dist * 1.3,
      });
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableRotate={limits.enabled}
      enableZoom={limits.enabled}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.5}
      zoomSpeed={0.6}
      minAzimuthAngle={limits.minAzimuth}
      maxAzimuthAngle={limits.maxAzimuth}
      minPolarAngle={limits.minPolar}
      maxPolarAngle={limits.maxPolar}
      minDistance={limits.minDistance}
      maxDistance={limits.maxDistance}
    />
  );
}
