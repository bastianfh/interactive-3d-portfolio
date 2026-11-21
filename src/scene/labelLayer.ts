import { createRef } from 'react';

/**
 * Stable DOM container for drei <Html> station labels.
 *
 * Without an explicit portal, <Html> mounts into `events.connected ||
 * gl.domElement.parentNode`. The first label mounts before R3F connects its
 * event layer, so its target changes one commit later; drei then unmounts and
 * re-creates the label's React root mid-render, and the deferred unmount wipes
 * the new content (the first station's label silently disappears). Pointing
 * every label at this fixed element keeps the target constant.
 */
export const labelLayer = createRef<HTMLDivElement>();
