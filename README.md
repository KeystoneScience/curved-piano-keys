<p align="center">
  <a href="https://keystonescience.com" target="_blank" rel="noopener noreferrer">
    <img
      src="https://img.shields.io/badge/made%20with%20%E2%9D%A4%EF%B8%8F-by%20Nate%20Stone-6366f1?style=for-the-badge&labelColor=111827"
      alt="Made with ❤️ by Nate Stone"
    />
  </a>
</p>

<p align="center">
  <img src="./assets/curved-keys-hero.png" alt="Curved piano keyboard hero" width="1000" />
</p>

# Piano Keys React Component

`curved-piano-keys` renders a full piano keyboard that hugs any SVG path for a fun love of music

## Features

- Map 88-key style keyboards (or any length) onto arbitrary SVG path data.
- Fine-grained control over ribbon thickness, black key geometry, and starting note.
- Optional viewBox fitting so the SVG crops itself to the rendered keys.
- Ships Bézier path presets to help you prototype layouts quickly.
- Interactive playground with a pen-style path builder, live prop controls, and a one-click copyable component snippet.
- Responsive density presets that tile the path with consistent key widths from phones to ultrawide displays.

## Installation

```bash
npm install curved-piano-keys
```

> The package expects `react@^18` as a peer dependency.

## Usage

```tsx
import { CurvedPianoKeys } from "curved-piano-keys";

export function Hero() {
  return (
    <CurvedPianoKeys
      pathPreset="wave"
      thickness={84}
      whiteKeyDensity="md"
      showPath
    />
  );
}
```

### Key props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `d` | `string` | **required** | SVG path data to follow (e.g. `"M 40 240 C ..."`). |
| `numWhiteKeys` | `number` | `52` | Total white keys rendered along the path. Ignored when `whiteKeyDensity` is set. |
| `whiteKeyDensity` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Responsive presets that use fixed target spans (~10/12.5/15/18/21.5px) to tile the path end-to-end (ignored when `numWhiteKeys` / `whiteKeySpan` is supplied). |
| `pathPreset` | see below | `undefined` | Use a built-in curve by id instead of supplying `d` manually. |
| `thickness` | `number` | `80` | Ribbon thickness in px measured normal to the path. |
| `whiteKeySpan` | `number` | `undefined` | Override the calculated span if you need fixed key widths. |
| `startOn` | `'A' \\| 'C'` | `'A'` | Controls the black-key cadence, matching a real keyboard (`'A'`) or visually centred (`'C'`). |
| `blackWidthRatio` | `number` | `0.62` | Black-key width as a fraction of white-key span. |
| `blackDepth` | `number` | `0.64` | Black-key depth as a fraction of thickness. |
| `orientation` | `1 \| -1` | `1` | Flip to `-1` to draw the keyboard “below” the guide path. |
| `showPath` | `boolean` | `false` | Renders the source path dashed for quick debugging. |
| `fitViewBox` | `boolean` | `true` | Auto-fit the generated geometry inside the SVG viewBox. |
| `className` | `string` | `undefined` | Pass through a class for sizing or theming the `<svg>`. |

All props are optional except `d`. Full JSDoc lives in [`src/CurvedPianoKeys.tsx`](src/CurvedPianoKeys.tsx).

> **Tip:** Supply `numWhiteKeys` for an exact key count, or lean on the density presets (`whiteKeyDensity="xs"` → `"xl"`) for responsive spans.

> The geometry is calculated with DOM APIs, so the component must render in a browser environment (e.g. a Next.js Client Component).

### Custom curve example

```tsx
export function HeroBanner() {
  return (
    <CurvedPianoKeys
      pathPreset="squiggle"
      thickness={96}
      whiteKeyDensity="lg"
      startOn="C"
      orientation={-1}
      blackWidthRatio={0.58}
      blackDepth={0.66}
      showPath
      className="w-full max-w-5xl"
    />
  );
}
```

### Built-in path presets

| id | name | description |
| --- | --- | --- |
| `s-curve` | S Curve | Loose S-shaped Bezier with two smooth inflection points. |
| `arc` | Wide Arc | Gentle upward arc, great for sweeping hero treatments. |
| `squiggle` | Playful Squiggle | Alternating peaks and valleys for dramatic curvature. |
| `straight` | Straight Line | Simple horizontal baseline for benchmarking spacing. |
| `wave` | Offset Wave | Long wavelength sine-inspired path with asymmetrical peaks. |
| `spiral` | Spiral Sweep | Expansive spiral arc for bold hero compositions. |

Import the metadata if you’d like to list them in your UI:

```ts
import { PIANO_PATH_PRESETS } from "curved-piano-keys/path-presets";
```

## Interactive Playground

The repo ships with a Vite-powered playground featuring live prop controls, a smooth pen-style path builder, responsive key-density presets, and a ready-to-copy component snippet. Run it locally:

```bash
npm install
npm install --prefix examples/playground
npm run demo:dev
```


Live playground: https://keystonescience.github.io/curved-piano-keys/

## Development

```bash
npm install
npm run build          # build the library
npm run demo:build     # builds the playground into examples/playground/dist
npm run build
```

The build uses `tsup` to output both CJS and ESM bundles in `dist/`.

## License

MIT © Nate Stone
