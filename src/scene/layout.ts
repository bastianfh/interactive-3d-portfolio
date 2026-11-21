import type { StationId } from '../data/portfolioData';

export type Vec3 = [number, number, number];

export interface StationLayout {
  /** World position of the station platform centre */
  position: Vec3;
  /** Rotation of the whole station around Y (forms the arc) */
  rotation: number;
  /** Extra rotation of the furniture rig inside the station */
  rigRotation: number;
  /** Accent colour used for ring, label, UI */
  accent: string;
  /** Height of the floating label */
  labelHeight: number;
  /**
   * Camera framing in rig-local space.
   * point  = what the shot is about (character + props centroid)
   * offset = camera position relative to that point
   */
  focus: { point: Vec3; offset: Vec3 };
}

export const BACKGROUND = '#0a0c10';

export const OVERVIEW_SHOT = {
  position: [0, 7.4, 17.2] as Vec3,
  target: [0, 0.9, 0.4] as Vec3,
};

export const INTRO_CAMERA: Vec3 = [0, 11, 24];

export const STATION_LAYOUT: Record<StationId, StationLayout> = {
  academics: {
    position: [-6.6, 0, 1.8],
    rotation: 0.42,
    rigRotation: 0,
    accent: '#f5b971',
    labelHeight: 2.75,
    focus: { point: [-0.1, 1.2, -0.1], offset: [0.35, 0.95, 4.6] },
  },
  experience: {
    position: [-2.2, 0, -0.5],
    rotation: 0.13,
    rigRotation: 0,
    accent: '#fb7185',
    labelHeight: 2.95,
    focus: { point: [0, 1.05, -0.2], offset: [0, 0.95, 4.9] },
  },
  trading: {
    position: [2.2, 0, -0.5],
    rotation: -0.13,
    rigRotation: 0.3,
    accent: '#34d399',
    labelHeight: 2.35,
    focus: { point: [-0.15, 1.0, -0.25], offset: [-1.13, 1.08, 3.24] },
  },
  coding: {
    position: [6.6, 0, 1.8],
    rotation: -0.42,
    rigRotation: 0.25,
    accent: '#818cf8',
    labelHeight: 2.6,
    focus: { point: [0.0, 1.02, -0.2], offset: [1.05, 1.0, 3.05] },
  },
};
