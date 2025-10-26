import { useMemo, useState } from 'react';

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

  const selectedPreset = useMemo(
    () => PIANO_PATH_PRESETS.find((preset) => preset.id === presetId) ?? PIANO_PATH_PRESETS[0],
    [presetId],
  );

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

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
              d={selectedPreset.d}
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
              onChange={(event) => setPresetId(event.target.value as PathPresetId)}
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
        <p>
          Built with <code>curved-piano-keys</code>. Resize the browser to watch the SVG stay crisp thanks to{' '}
          <code>vector-effect="non-scaling-stroke"</code>.
        </p>
      </footer>
    </div>
  );
}
