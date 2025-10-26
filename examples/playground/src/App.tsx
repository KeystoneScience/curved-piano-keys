import {
  FormEvent,
  PointerEvent,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CurvedPianoKeys, PIANO_PATH_PRESETS } from 'curved-piano-keys';

type PathPresetId = (typeof PIANO_PATH_PRESETS)[number]['id'];

const WHITE_KEY_MIN = 12;
const WHITE_KEY_INCREMENT = 12;

export function App() {
  const [presetId, setPresetId] = useState<PathPresetId>(PIANO_PATH_PRESETS[0].id);
  const [thickness, setThickness] = useState(84);
  const [numWhiteKeys, setNumWhiteKeys] = useState(52);
  const [whiteKeySliderMax, setWhiteKeySliderMax] = useState(52);
  const [blackWidthRatio, setBlackWidthRatio] = useState(0.6);
  const [blackDepth, setBlackDepth] = useState(0.62);
  const [startOn, setStartOn] = useState<'A' | 'C'>('A');
  const [showPath, setShowPath] = useState(false);
  const [orientation, setOrientation] = useState<1 | -1>(1);
  const [pathSource, setPathSource] = useState<'preset' | 'custom'>('preset');
  const [customPath, setCustomPath] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);

  const selectedPreset = useMemo(
    () => PIANO_PATH_PRESETS.find((preset) => preset.id === presetId) ?? PIANO_PATH_PRESETS[0],
    [presetId],
  );

  const currentPath = pathSource === 'custom' && customPath.trim() ? customPath : selectedPreset.d;

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  const handleCustomPathSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = customPath.trim();
    if (!value) {
      setCustomError('Please paste SVG path commands (e.g. starting with M).');
      return;
    }
    if (!/^[a-zA-Z]/.test(value)) {
      setCustomError('Path data should begin with a command letter such as M, C, or L.');
      return;
    }
    setCustomError(null);
    setPathSource('custom');
  };

  const resetToPreset = () => {
    setPathSource('preset');
    setCustomError(null);
  };

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Curved Piano Keys</p>
          <h1>Playground</h1>
          <p className="lede">
            Explore the <code>curved-piano-keys</code> React component. Tweak the controls to watch the
            keyboard hug any SVG path. Everything you see here maps directly to the component props.
          </p>
        </div>
        <a
          className="cta"
          href="https://github.com/KeystoneScience/curved-piano-keys"
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub
        </a>
      </header>

      <main className="layout">
        <section className="preview">
          <div className="preview-header">
            <div>
              <h2>{selectedPreset.name}</h2>
              <p>{selectedPreset.description}</p>
            </div>
            <span className="badge">{numWhiteKeys} white keys</span>
          </div>

          <div className="preview-canvas">
            <CurvedPianoKeys
              d={currentPath}
              thickness={thickness}
              numWhiteKeys={numWhiteKeys}
              startOn={startOn}
              blackWidthRatio={blackWidthRatio}
              blackDepth={blackDepth}
              showPath={showPath}
              orientation={orientation}
              className="piano"
            />
          </div>
        </section>

        <aside className="controls" aria-labelledby="controls-heading">
          <div className="controls-header">
            <h2 id="controls-heading">Controls</h2>
            <p>Adjust the geometry and styling. All inputs update the component instantly.</p>
          </div>

          <label className="control" htmlFor="preset">
            <span>Path preset</span>
            <select
              id="preset"
              value={presetId}
              onChange={(event) => {
                setPresetId(event.target.value as PathPresetId);
                setPathSource('preset');
                setCustomError(null);
              }}
            >
              {PIANO_PATH_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>

          <label className="control" htmlFor="thickness">
            <span>Ribbon thickness ({thickness}px)</span>
            <input
              id="thickness"
              type="range"
              min={48}
              max={128}
              step={1}
              value={thickness}
              onChange={(event) => setThickness(Number(event.target.value))}
            />
          </label>

          <label className="control" htmlFor="white-keys">
            <span>White keys ({numWhiteKeys})</span>
            <input
              id="white-keys"
              type="range"
              min={WHITE_KEY_MIN}
              max={whiteKeySliderMax}
              step={1}
              value={numWhiteKeys}
              onChange={(event) => {
                const next = Number(event.target.value);
                setNumWhiteKeys(next);
                setWhiteKeySliderMax((previous) => (next >= previous ? previous + WHITE_KEY_INCREMENT : previous));
              }}
            />
          </label>

          <label className="control" htmlFor="black-width">
            <span>Black width ({formatPercent(blackWidthRatio)})</span>
            <input
              id="black-width"
              type="range"
              min={0.4}
              max={0.8}
              step={0.01}
              value={blackWidthRatio}
              onChange={(event) => setBlackWidthRatio(Number(event.target.value))}
            />
          </label>

          <label className="control" htmlFor="black-depth">
            <span>Black depth ({formatPercent(blackDepth)})</span>
            <input
              id="black-depth"
              type="range"
              min={0.4}
              max={0.8}
              step={0.01}
              value={blackDepth}
              onChange={(event) => setBlackDepth(Number(event.target.value))}
            />
          </label>

          <fieldset className="control-group">
            <legend>Starting note</legend>
            <div className="radio-row">
              {(['A', 'C'] as const).map((note) => (
                <label key={note} className="radio-option">
                  <input
                    type="radio"
                    name="starting-note"
                    value={note}
                    checked={startOn === note}
                    onChange={() => setStartOn(note)}
                  />
                  <span>{note}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="control-group">
            <legend>Orientation</legend>
            <div className="radio-row">
              {[{ label: 'Above path', value: 1 }, { label: 'Below path', value: -1 }].map((option) => (
                <label key={option.value} className="radio-option">
                  <input
                    type="radio"
                    name="orientation"
                    value={option.value}
                    checked={orientation === option.value}
                    onChange={() => setOrientation(option.value as 1 | -1)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="checkbox">
            <input type="checkbox" checked={showPath} onChange={(event) => setShowPath(event.target.checked)} />
            <span>Show guide path</span>
          </label>
        </aside>
      </main>

      <footer className="footer">
        <section className="workshop" aria-labelledby="workshop-heading">
          <div className="workshop-copy">
            <p className="eyebrow">Path Workshop</p>
            <h2 id="workshop-heading">Sketch a new curve or paste your own</h2>
            <p>
              Need a fresh ribbon? Plot control points in a visual editor like{' '}
              <a href="https://armadore.com/svg-path-editor/" target="_blank" rel="noreferrer">
                SVG Path Editor
              </a>{' '}
              for quick drag-and-drop handles or try the{' '}
              <a href="https://easycodetools.com/tool/svg-path-builder" target="_blank" rel="noreferrer">
                SVG Path Builder
              </a>{' '}
              for guided step-by-step curves. Both tools show live coordinates so you can learn how{' '}
              <code>M</code>, <code>L</code>, and <code>C</code> commands shape a path. Paste the generated{' '}
              <code>d</code> attribute below to see these keys flow along your custom geometry instantly.
            </p>
            <p>
              Curious what those command letters do? The{' '}
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths"
                target="_blank"
                rel="noreferrer"
              >
                SVG path primer
              </a>{' '}
              breaks down move, line, and Bézier syntax with simple diagrams so you can tweak curves with confidence.
            </p>
          </div>

          <PathBuilder
            onApply={(value, meta) => {
              setCustomPath(value);
              setPathSource('custom');
              setCustomError(null);
              if (meta === 'builder') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />

          <form className="custom-path-form" onSubmit={handleCustomPathSubmit}>
            <label htmlFor="custom-path" className="custom-path-label">
              Paste SVG path data
            </label>
            <textarea
              id="custom-path"
              name="custom-path"
              value={customPath}
              placeholder="Example: M 20 240 C 240 120 420 360 640 220..."
              onChange={(event) => setCustomPath(event.target.value)}
              rows={4}
            />
            {customError ? <p className="error">{customError}</p> : null}
            <div className="custom-path-actions">
              <button type="submit" className="cta secondary">
                Use this path
              </button>
              <button type="button" className="ghost-button" onClick={resetToPreset} disabled={pathSource !== 'custom'}>
                Return to preset
              </button>
            </div>
          </form>
        </section>
        <p className="footnote">
          Built with <code>curved-piano-keys</code>. Resize the browser to watch the SVG stay crisp thanks to{' '}
          <code>vector-effect="non-scaling-stroke"</code>.
        </p>
      </footer>
    </div>
  );
}

type PathBuilderProps = {
  onApply: (path: string, meta: 'builder' | 'form') => void;
};

type BuilderPoint = {
  id: number;
  x: number;
  y: number;
};

const VIEWBOX_WIDTH = 1200;
const VIEWBOX_HEIGHT = 400;

function PathBuilder({ onApply }: PathBuilderProps) {
  const [points, setPoints] = useState<BuilderPoint[]>([
    { id: 1, x: 40, y: 240 },
    { id: 2, x: 600, y: 160 },
    { id: 3, x: 1100, y: 260 },
  ]);
  const [dragging, setDragging] = useState<{
    id: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const svgRef = useRef<SVGSVGElement | null>(null);

  const pathD = useMemo(() => {
    if (points.length === 0) {
      return '';
    }
    const [first, ...rest] = points;
    return rest.reduce(
      (acc, point) => `${acc} L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
      `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`,
    );
  }, [points]);

  const handleSvgClick = (event: PointerEvent<SVGSVGElement>) => {
    if (dragging) {
      return;
    }
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;
    const nextPoint: BuilderPoint = {
      id: Date.now(),
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
    };
    setPoints((previous) => [...previous, nextPoint]);
  };

  const handlePointerDown = (point: BuilderPoint, event: PointerEvent<SVGCircleElement>) => {
    event.stopPropagation();
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const rect = svg.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    const pointerY = ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;
    setDragging({
      id: point.id,
      offsetX: point.x - pointerX,
      offsetY: point.y - pointerY,
    });
    svg.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragging) {
      return;
    }
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const rect = svg.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    const pointerY = ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;
    const nextX = Math.max(0, Math.min(VIEWBOX_WIDTH, pointerX + dragging.offsetX));
    const nextY = Math.max(0, Math.min(VIEWBOX_HEIGHT, pointerY + dragging.offsetY));
    setPoints((previous) =>
      previous.map((point) => (point.id === dragging.id ? { ...point, x: Number(nextX.toFixed(1)), y: Number(nextY.toFixed(1)) } : point)),
    );
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (dragging) {
      const svg = svgRef.current;
      if (svg) {
        svg.releasePointerCapture(event.pointerId);
      }
    }
    setDragging(null);
  };

  const handleUndo = () => {
    setPoints((previous) => previous.slice(0, Math.max(0, previous.length - 1)));
  };

  const handleClear = () => {
    setPoints([]);
  };

  const handleApply = () => {
    if (!pathD) {
      return;
    }
    onApply(pathD, 'builder');
  };

  const handleCopy = async () => {
    if (!pathD) {
      return;
    }
    try {
      await navigator.clipboard.writeText(pathD);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2500);
    } catch (error) {
      console.warn('Clipboard copy failed', error);
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  return (
    <div className="builder">
      <div>
        <h3 className="builder-heading">Quick path builder</h3>
        <p className="builder-blurb">
          Tap anywhere on the canvas to drop points. Drag them to reshape the ribbon. We’ll translate it into{' '}
          <code>M</code> and <code>L</code> commands automatically.
        </p>
      </div>

      <div className="builder-canvas">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          width="100%"
          height="100%"
          onPointerDown={handleSvgClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          aria-label="Interactive SVG path builder canvas"
        >
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#grid)" />
          {pathD ? (
            <path
              d={pathD}
              fill="none"
              stroke="rgba(56,189,248,0.85)"
              strokeWidth={4}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {points.map((point) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={12}
                fill="rgba(30, 64, 175, 0.55)"
                stroke="rgba(56, 189, 248, 0.8)"
                strokeWidth={2}
                onPointerDown={(event) => handlePointerDown(point, event)}
                role="presentation"
              />
              <text
                x={point.x + 16}
                y={point.y - 16}
                fill="rgba(226, 232, 240, 0.85)"
                fontSize="20"
                fontFamily="JetBrains Mono, ui-monospace"
              >
                ({point.x.toFixed(0)}, {point.y.toFixed(0)})
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="builder-path">
        <div className="builder-path-header">
          <span className="builder-path-title">Generated path</span>
          <div className="builder-path-actions">
            <button type="button" className="ghost-button" onClick={handleUndo} disabled={points.length === 0}>
              Undo point
            </button>
            <button type="button" className="ghost-button" onClick={handleClear} disabled={points.length === 0}>
              Clear all
            </button>
          </div>
        </div>

        <pre className="builder-path-output">{pathD || 'Add a point to get started.'}</pre>

        <div className="builder-buttons">
          <button type="button" className="cta secondary" onClick={handleApply} disabled={!pathD}>
            Apply to piano
          </button>
          <button type="button" className="ghost-button" onClick={handleCopy} disabled={!pathD}>
            {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Copy failed' : 'Copy path'}
          </button>
        </div>
      </div>
    </div>
  );
}
