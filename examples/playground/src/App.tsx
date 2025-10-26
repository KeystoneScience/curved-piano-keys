import {
  FormEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CurvedPianoKeys, PIANO_PATH_PRESETS } from 'curved-piano-keys';

type PathPresetId = (typeof PIANO_PATH_PRESETS)[number]['id'];

const WHITE_KEY_MIN = 12;
const WHITE_KEY_INCREMENT = 12;

type ResponsiveDensity = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type DensitySetting = ResponsiveDensity | 'auto';

const WHITE_KEY_DENSITY_VALUES: Record<ResponsiveDensity, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 52,
  xl: 60,
};

const DENSITY_BREAKPOINTS: Array<{ maxWidth: number; density: ResponsiveDensity }> = [
  { maxWidth: 520, density: 'xs' },
  { maxWidth: 768, density: 'sm' },
  { maxWidth: 1024, density: 'md' },
  { maxWidth: 1366, density: 'lg' },
  { maxWidth: Number.POSITIVE_INFINITY, density: 'xl' },
];

const DENSITY_LABELS: Record<DensitySetting, string> = {
  auto: 'Responsive',
  xs: 'XS',
  sm: 'SM',
  md: 'MD',
  lg: 'LG',
  xl: 'XL',
};

const DEFAULT_PREVIEW_WIDTH = 1024;

function densityForWidth(width: number): ResponsiveDensity {
  const resolvedWidth = Number.isFinite(width) && width > 0 ? width : DEFAULT_PREVIEW_WIDTH;
  const match = DENSITY_BREAKPOINTS.find((entry) => resolvedWidth <= entry.maxWidth);
  return match?.density ?? 'xl';
}

export function App() {
  const [presetId, setPresetId] = useState<PathPresetId>(PIANO_PATH_PRESETS[0].id);
  const [thickness, setThickness] = useState(84);
  const [numWhiteKeys, setNumWhiteKeys] = useState(52);
  const [whiteKeySliderMax, setWhiteKeySliderMax] = useState(60);
  const [blackWidthRatio, setBlackWidthRatio] = useState(0.6);
  const [blackDepth, setBlackDepth] = useState(0.62);
  const [startOn, setStartOn] = useState<'A' | 'C'>('A');
  const [showPath, setShowPath] = useState(false);
  const [orientation, setOrientation] = useState<1 | -1>(1);
  const [useManualKeys, setUseManualKeys] = useState(false);
  const [densitySetting, setDensitySetting] = useState<DensitySetting>('auto');
  const [autoWhiteKeys, setAutoWhiteKeys] = useState(() => WHITE_KEY_DENSITY_VALUES['md']);
  const densityRef = useRef<ResponsiveDensity>('md');
  const [activeDensity, setActiveDensity] = useState<ResponsiveDensity>('md');
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [pathSource, setPathSource] = useState<'preset' | 'custom'>('preset');
  const [customPath, setCustomPath] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [copySnippetState, setCopySnippetState] = useState<'idle' | 'copied' | 'error'>('idle');

  const densityOptions: DensitySetting[] = ['auto', 'xs', 'sm', 'md', 'lg', 'xl'];

  const effectiveWhiteKeys = useManualKeys ? numWhiteKeys : autoWhiteKeys;
  const computedSliderMax = useManualKeys ? whiteKeySliderMax : Math.max(whiteKeySliderMax, effectiveWhiteKeys);
  const whiteKeySliderValue = useManualKeys ? numWhiteKeys : effectiveWhiteKeys;

  const selectedPreset = useMemo(
    () => PIANO_PATH_PRESETS.find((preset) => preset.id === presetId) ?? PIANO_PATH_PRESETS[0],
    [presetId],
  );

  const currentPath = pathSource === 'custom' && customPath.trim() ? customPath : selectedPreset.d;

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  useEffect(() => {
    if (useManualKeys) {
      return;
    }

    if (densitySetting !== 'auto') {
      densityRef.current = densitySetting;
      setActiveDensity(densitySetting);
      setAutoWhiteKeys(WHITE_KEY_DENSITY_VALUES[densitySetting]);
      return;
    }

    const updateFromWidth = (width?: number) => {
      const measuredWidth =
        width ??
        previewRef.current?.getBoundingClientRect().width ??
        window.innerWidth ??
        DEFAULT_PREVIEW_WIDTH;
      const density = densityForWidth(measuredWidth);
      densityRef.current = density;
      setActiveDensity(density);
      const nextKeys = WHITE_KEY_DENSITY_VALUES[density];
      setAutoWhiteKeys((previous) => (previous === nextKeys ? previous : nextKeys));
    };

    updateFromWidth();

    const handleResize = () => updateFromWidth();
    window.addEventListener('resize', handleResize, { passive: true });

    let observer: ResizeObserver | null = null;
    if (previewRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect?.width ?? entry.target.getBoundingClientRect().width;
          if (Number.isFinite(width)) {
            updateFromWidth(width);
          }
        }
      });
      observer.observe(previewRef.current);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [useManualKeys, densitySetting]);

  useEffect(() => {
    if (!useManualKeys) {
      setWhiteKeySliderMax((previous) => (autoWhiteKeys > previous ? autoWhiteKeys : previous));
    }
  }, [autoWhiteKeys, useManualKeys]);

  const componentSnippet = useMemo(() => {
    const escapeDoubleQuotes = (value: string) => value.replace(/"/g, '\\"');
    const lines: string[] = [
      `import { CurvedPianoKeys } from "curved-piano-keys";`,
      '',
      '<CurvedPianoKeys',
      `  d="${escapeDoubleQuotes(currentPath)}"`,
      `  thickness={${thickness}}`,
    ];

    if (useManualKeys) {
      lines.push(`  numWhiteKeys={${numWhiteKeys}}`);
    } else {
      lines.push(`  whiteKeyDensity="${densitySetting}"`);
    }

    lines.push(
      `  startOn="${startOn}"`,
      `  blackWidthRatio={${blackWidthRatio}}`,
      `  blackDepth={${blackDepth}}`,
      `  orientation={${orientation}}`,
    );

    if (showPath) {
      lines.push('  showPath');
    }

    lines.push('  className="piano"', '/>');

    return lines.join('\n');
  }, [
    currentPath,
    thickness,
    numWhiteKeys,
    densitySetting,
    useManualKeys,
    startOn,
    blackWidthRatio,
    blackDepth,
    orientation,
    showPath,
  ]);

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

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(componentSnippet);
      setCopySnippetState('copied');
      setTimeout(() => setCopySnippetState('idle'), 2200);
    } catch (error) {
      console.warn('Failed to copy snippet', error);
      setCopySnippetState('error');
      setTimeout(() => setCopySnippetState('idle'), 2200);
    }
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
            <span className="badge">{effectiveWhiteKeys} white keys</span>
          </div>

          <div className="preview-canvas" ref={previewRef}>
            <CurvedPianoKeys
              d={currentPath}
              thickness={thickness}
              {...(useManualKeys ? { numWhiteKeys } : { whiteKeyDensity: densitySetting })}
              startOn={startOn}
              blackWidthRatio={blackWidthRatio}
              blackDepth={blackDepth}
              showPath={showPath}
              orientation={orientation}
              className="piano"
            />
          </div>

          <div className="code-preview">
            <div className="code-preview-header">
              <h3>Copy the component</h3>
              <button type="button" className="ghost-button" onClick={handleCopySnippet}>
                {copySnippetState === 'copied' ? 'Copied!' : copySnippetState === 'error' ? 'Copy failed' : 'Copy'}
              </button>
            </div>
            <pre>
              <code>{componentSnippet}</code>
            </pre>
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

          <fieldset className="control-group">
            <legend>Key fill</legend>
            <div className="segmented">
              <button
                type="button"
                className={useManualKeys ? 'segment-button' : 'segment-button active'}
                onClick={() => setUseManualKeys(false)}
              >
                Auto
              </button>
              <button
                type="button"
                className={useManualKeys ? 'segment-button active' : 'segment-button'}
                onClick={() => {
                  setUseManualKeys(true);
                  setNumWhiteKeys(autoWhiteKeys);
                  setWhiteKeySliderMax((previous) =>
                    autoWhiteKeys > previous ? autoWhiteKeys : previous,
                  );
                }}
              >
                Manual
              </button>
            </div>

            {!useManualKeys ? (
              <>
                <div className="density-row" role="radiogroup" aria-label="Key density">
                  {densityOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={
                        option === densitySetting ? 'density-chip active' : 'density-chip'
                      }
                      onClick={() => setDensitySetting(option)}
                    >
                      {DENSITY_LABELS[option]}
                    </button>
                  ))}
                </div>
                <p className="control-hint">
                  {densitySetting === 'auto'
                    ? `Responsive: ${activeDensity.toUpperCase()} density (${autoWhiteKeys} white keys)`
                    : `${DENSITY_LABELS[densitySetting]} density (${autoWhiteKeys} white keys)`}
                </p>
              </>
            ) : (
              <p className="control-hint">Use the slider below to dial in an exact key count.</p>
            )}
          </fieldset>

          <label className="control" htmlFor="white-keys">
            <span>White keys ({effectiveWhiteKeys})</span>
            <input
              id="white-keys"
              type="range"
              min={WHITE_KEY_MIN}
              max={computedSliderMax}
              step={1}
              value={whiteKeySliderValue}
              onChange={(event) => {
                if (!useManualKeys) {
                  return;
                }
                const next = Number(event.target.value);
                setNumWhiteKeys(next);
                setWhiteKeySliderMax((previous) => (next >= previous ? previous + WHITE_KEY_INCREMENT : previous));
              }}
              disabled={!useManualKeys}
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
  const [tension, setTension] = useState<number>(0.85);
  const [dragging, setDragging] = useState<{
    id: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const svgRef = useRef<SVGSVGElement | null>(null);

  const pathD = useMemo(() => buildSmoothPath(points, tension), [points, tension]);

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
          Tap anywhere on the canvas to drop points. Drag them to reshape the ribbon. We translate them into a smooth
          chain of <code>M</code> and <code>C</code> commands automatically, just like the Pen tool.
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

      <div className="builder-tension">
        <label htmlFor="tension">
          Curve tension <span>{Math.round(tension * 100)}%</span>
        </label>
        <input
          id="tension"
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={tension}
          onChange={(event) => setTension(Number(event.target.value))}
        />
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

function buildSmoothPath(points: BuilderPoint[], tension: number) {
  if (points.length === 0) {
    return '';
  }
  if (points.length === 1) {
    const [first] = points;
    return `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
  }
  if (points.length === 2) {
    const [first, second] = points;
    return `M ${first.x.toFixed(1)} ${first.y.toFixed(1)} L ${second.x.toFixed(1)} ${second.y.toFixed(1)}`;
  }

  const segments: string[] = [];
  const clampIndex = (index: number) => Math.max(0, Math.min(points.length - 1, index));

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[clampIndex(index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[clampIndex(index + 2)];

    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6;

    segments.push(
      `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    );
  }

  const start = points[0];
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} ${segments.join(' ')}`;
}
