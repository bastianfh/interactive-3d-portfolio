import { useEffect, type ComponentType } from 'react';
import { stationOrder, type StationId } from '../data/portfolioData';
import { BACKGROUND } from './layout';
import { CameraRig } from './CameraRig';
import { Lighting, Stage } from './Stage';
import { StationShell } from './StationShell';
import { AcademicsStation } from './stations/AcademicsStation';
import { TradingStation } from './stations/TradingStation';
import { CodingStation } from './stations/CodingStation';
import { ExperienceStation } from './stations/ExperienceStation';

const STATION_COMPONENTS: Record<StationId, ComponentType<{ dimmed: boolean; focused: boolean }>> = {
  academics: AcademicsStation,
  experience: ExperienceStation,
  trading: TradingStation,
  coding: CodingStation,
};

interface Props {
  active: StationId | null;
  hovered: StationId | null;
  onSelect: (id: StationId) => void;
  onHover: (id: StationId, over: boolean) => void;
  /** Called after the scene has mounted (Suspense resolved) */
  onReady?: () => void;
}

export function Experience({ active, hovered, onSelect, onHover, onReady }: Props) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return (
    <>
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 19, 40]} />
      <CameraRig active={active} />
      <Lighting />
      <Stage />
      {stationOrder.map((id) => {
        const Station = STATION_COMPONENTS[id];
        return (
          <StationShell key={id} id={id} active={active} hovered={hovered === id} onSelect={onSelect} onHover={onHover}>
            <Station dimmed={active !== null && active !== id} focused={active === id} />
          </StationShell>
        );
      })}
    </>
  );
}
