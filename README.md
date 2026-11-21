# Finance & Quant Portfolio (3D)

An interactive 3D portfolio built with Vite, React, TypeScript, Tailwind CSS v4, Three.js, React Three Fiber, drei and framer-motion. All characters, furniture and screens are procedural: there are no `.glb`, `.gltf` or image texture files.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build (runs a TypeScript check first):

```bash
npm run build
npm run preview
```

Requires Node 18+ (Node 20 or 22 recommended).

## Edit your content

Everything you see in the UI lives in **`src/data/portfolioData.ts`**: name, badge, links, degree, GPA, coursework, strategy, instruments, metrics, tech stack and projects. Search for `[PLACEHOLDER]` to find what still needs your details.

The animated monitor contents (code, terminal output, tickers) are decorative. To change them, edit the drawer files in `src/scene/textures/`.

## Controls

- Click a station, its floating label, or a dock button to fly in.
- `Esc` or **Back to Overview** returns to the wide shot.
- `←` / `→` cycle through the stations.
- Once the camera settles on a station you can drag to orbit and scroll to zoom, within limits.

## Project map

```
src/
  data/portfolioData.ts      ← all text, metrics, links
  scene/
    Experience.tsx           scene root (lights, stage, stations)
    CameraRig.tsx            damped camera + OrbitControls target lerp, panel-aware framing
    StationShell.tsx         platform, hover ring, hit area, floating label
    Character.tsx            procedural blonde character (3 outfits, 3 poses, idle animation)
    Furniture.tsx            chair, monitor, mug, books, lights
    stations/                Academics / Trading / Coding dioramas
    textures/                HTML5-canvas drawers for whiteboard + screens
    layout.ts                station positions, accents, camera shots
  ui/                        header, dock, glass info panel, loader
```

## Tuning

- **Camera framing:** `STATION_LAYOUT[...].focus` in `src/scene/layout.ts` (`point` = what to look at, `offset` = where the camera sits relative to it).
- **Station placement / accent colours:** same file.
- **Performance:** screens redraw at 7–10 fps and pause when another station is focused. Only the key light casts shadows. Pixel ratio is capped with `dpr={[1, 2]}`.
