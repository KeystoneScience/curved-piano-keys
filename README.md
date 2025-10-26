<p align="center">
  <a href="https://keystonescience.com" target="_blank" rel="noopener noreferrer">
    <img
      src="https://img.shields.io/badge/made%20with%20%E2%9D%A4%EF%B8%8F-by%20Nate%20Stone-6366f1?style=for-the-badge&labelColor=111827"
      alt="Made with ❤️ by Nate Stone"
    />
  </a>
</p>

<p align="center">
  Made with ❤️ by <a href="https://keystonescience.com" target="_blank" rel="noopener noreferrer"><strong>Nate Stone</strong></a>
</p>

# Piano Keys React Component

`curved-piano-keys` renders a full piano keyboard that hugs any SVG path. It started as a portfolio experiment and is now packaged for anyone to drop into their own projects.

## Features

- Map 88-key style keyboards (or any length) onto arbitrary SVG path data.
- Fine-grained control over ribbon thickness, black key geometry, and starting note.
- Optional viewBox fitting so the SVG crops itself to the rendered keys.
- Ships Bezier path presets to help you prototype layouts quickly.

## Installation

```bash
npm install curved-piano-keys
```

> The package expects `react@^18` as a peer dependency.

## Usage

```tsx
import { CurvedPianoKeys, PIANO_PATH_PRESETS } from "curved-piano-keys";

export function Hero() {
  return (
    <CurvedPianoKeys
      d={PIANO_PATH_PRESETS[0].d}
      numWhiteKeys={52}
      thickness={84}
      startOn="A"
      showPath
    />
  );
}
```

Key props:

- `d` *(required)* – SVG path data string.
- `numWhiteKeys` *(default 52)* – total white keys rendered along the path.
- `thickness` *(default 80)* – ribbon thickness in px.
- `startOn` *(default "A")* – choose `"A"` or `"C"` to align the black key cadence.
- `blackWidthRatio` & `blackDepth` – tweak black key footprint relative to white keys.
- `orientation` *(default `1`)* – set to `-1` to flip the keyboard beneath the guide path.
- `fitViewBox` *(default `true`)* – disable if you want to provide your own `viewBox`.

All props are optional except `d`. Full doc comments live in `src/CurvedPianoKeys.tsx`.

> The geometry is calculated with DOM APIs, so the component must render in a browser environment (e.g. a Next.js Client Component).

### Path presets

```ts
import { PIANO_PATH_PRESETS } from "curved-piano-keys/path-presets";
```

Each preset includes `id`, `name`, `description`, and the `d` attribute for quick demos.

## Interactive Playground

The repo ships with a Vite-powered playground that mirrors the props live in the browser. Run it locally:

```bash
npm install
npm install --prefix examples/playground
npm run demo:dev
```

When deployed to GitHub Pages via the included workflow, it will be available at:

```
https://keystonescience.github.io/curved-piano-keys/
```

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
