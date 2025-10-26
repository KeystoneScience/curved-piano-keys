export type PianoPathPreset = {
  id: string;
  name: string;
  description: string;
  d: string;
};

export const PIANO_PATH_PRESETS: PianoPathPreset[] = [
  {
    id: 's-curve',
    name: 'S Curve',
    description: 'Loose S-shaped Bezier with two smooth inflection points.',
    d: 'M 20 120 C 200 -40 360 280 540 120 S 880 -40 1060 120',
  },
  {
    id: 'arc',
    name: 'Wide Arc',
    description: 'Gentle upward arc, great for sweeping hero treatments.',
    d: 'M 50 300 A 260 260 0 0 1 1010 300',
  },
  {
    id: 'squiggle',
    name: 'Playful Squiggle',
    description: 'Alternating peaks and valleys for more dramatic curvature.',
    d: 'M 20 220 C 180 60 340 380 500 220 C 660 60 820 380 980 220',
  },
  {
    id: 'straight',
    name: 'Straight Line',
    description: 'Simple horizontal baseline; useful for benchmarking spacing.',
    d: 'M 40 240 L 1040 240',
  },
  {
    id: 'wave',
    name: 'Offset Wave',
    description: 'Long wavelength sine-inspired path with asymmetrical peaks.',
    d: 'M 20 260 C 180 160 340 360 500 260 S 820 160 980 260',
  },
  {
    id: 'spiral',
    name: 'Spiral Sweep',
    description: 'Expansive spiral arc for bold hero compositions.',
    d: 'M 520 160 C 320 40 120 200 160 360 C 260 540 620 520 820 360 C 960 240 940 120 760 80',
  },
];
