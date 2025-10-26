'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { SVGAttributes, SVGProps } from 'react';

export type CurvedPianoKeysProps = {
  /** SVG path data (e.g. "M 20 120 C 200 -40 360 280 540 120"). */
  d: string;

  /** Number of white keys to render. Overrides `whiteKeyDensity` when provided. */
  numWhiteKeys?: number;

  /**
   * Responsive density preset for automatically choosing the white-key count.
   * Ignored when `numWhiteKeys` is provided.
   */
  whiteKeyDensity?: WhiteKeyDensitySetting;

  /** Starting white note name determines the black-key cadence. */
  startOn?: 'A' | 'C';

  /** Ribbon thickness in px, measured normal to the path. */
  thickness?: number;

  /**
   * Explicit span for a single white key along the path. When omitted the span
   * is derived at runtime from the path length divided by `numWhiteKeys`.
   */
  whiteKeySpan?: number;

  /** Black key width as a fraction of the white key span. */
  blackWidthRatio?: number;

  /** Black key depth as a fraction of `thickness`. */
  blackDepth?: number;

  /** Styling hooks for the generated polygons. */
  whiteFill?: string;
  whiteStroke?: string;
  blackFill?: string;
  blackStroke?: string;
  strokeWidth?: number;

  /** Toggle drawing of the underlying guide path. */
  showPath?: boolean;

  /** Optional className applied to the `<svg>`. */
  className?: string;

  /**
   * Flip the direction black keys extrude relative to the white-key ribbon.
   * Use `-1` to flip the keyboard underneath the path.
   */
  orientation?: 1 | -1;

  /**
   * If `true` (default) the component computes a tight viewBox around the keys.
   * Supply a custom `viewBox` (via `svgProps`) or set this to `false` to fully
   * control the coordinate space.
   */
  fitViewBox?: boolean;

  /** Additional padding (px) applied when fitting the viewBox. */
  viewBoxPadding?: number;

  /** Forwarded props for the outer `<svg>`. */
  svgProps?: SVGAttributes<SVGSVGElement>;

  /** Forwarded props for the hidden `<path>` measurement element. */
  pathProps?: SVGProps<SVGPathElement>;
};

type Quad = [number, number, number, number, number, number, number, number];

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const DEFAULTS = {
  numWhiteKeys: 52,
  whiteKeyDensity: 'auto' as const,
  startOn: 'A' as const,
  thickness: 80,
  blackWidthRatio: 0.62,
  blackDepth: 0.64,
  whiteFill: '#ffffff',
  whiteStroke: 'rgba(0,0,0,0.16)',
  blackFill: '#1a1a1a',
  blackStroke: 'rgba(0,0,0,0.35)',
  strokeWidth: 1,
  orientation: 1 as const,
  fitViewBox: true,
  initialViewBox: '0 0 1200 400',
} satisfies Required<
  Pick<
    CurvedPianoKeysProps,
    | 'numWhiteKeys'
    | 'whiteKeyDensity'
    | 'startOn'
    | 'thickness'
    | 'blackWidthRatio'
    | 'blackDepth'
    | 'whiteFill'
    | 'whiteStroke'
    | 'blackFill'
    | 'blackStroke'
    | 'strokeWidth'
    | 'orientation'
    | 'fitViewBox'
  >
> & { initialViewBox: string };

const NOTE_ORDER_A = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
const NOTE_ORDER_C = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

/** Fractional offsets (0-1) for black keys following each white key. */
const BLACK_FRACTIONS: Record<string, number | null> = {
  A: 0.6,
  B: null,
  C: 0.6,
  D: 0.4,
  E: null,
  F: 0.6,
  G: 0.5,
};

type WhiteKeyDensity = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type WhiteKeyDensitySetting = WhiteKeyDensity | 'auto';

const WHITE_KEY_DENSITY_VALUES: Record<WhiteKeyDensity, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 52,
  xl: 60,
};

const DENSITY_BREAKPOINTS: Array<{ maxWidth: number; density: WhiteKeyDensity }> = [
  { maxWidth: 520, density: 'xs' },
  { maxWidth: 768, density: 'sm' },
  { maxWidth: 1024, density: 'md' },
  { maxWidth: 1366, density: 'lg' },
  { maxWidth: Number.POSITIVE_INFINITY, density: 'xl' },
];

const DEFAULT_VIEWPORT_WIDTH = 1024;

function chooseDensity(width: number, setting: WhiteKeyDensitySetting): WhiteKeyDensity {
  if (setting !== 'auto') {
    return setting;
  }
  const resolvedWidth = Number.isFinite(width) && width > 0 ? width : DEFAULT_VIEWPORT_WIDTH;
  const match = DENSITY_BREAKPOINTS.find((entry) => resolvedWidth <= entry.maxWidth);
  return match?.density ?? 'xl';
}

function geoAt(path: SVGPathElement, s: number) {
  const total = path.getTotalLength();
  const clamp = (value: number) => Math.max(0, Math.min(total, value));
  const delta = 0.5;
  const position = path.getPointAtLength(clamp(s));
  const next = path.getPointAtLength(clamp(s + delta));
  const previous = path.getPointAtLength(clamp(s - delta));
  const tangentX = next.x - previous.x;
  const tangentY = next.y - previous.y;
  const tangentLength = Math.hypot(tangentX, tangentY) || 1e-6;
  const unitX = tangentX / tangentLength;
  const unitY = tangentY / tangentLength;
  return {
    p: position,
    t: { x: unitX, y: unitY },
    n: { x: -unitY, y: unitX },
  };
}

function makeQuadCentered(path: SVGPathElement, s0: number, s1: number, halfDepth: number): Quad {
  const start = geoAt(path, s0);
  const end = geoAt(path, s1);
  const a1x = start.p.x + start.n.x * halfDepth;
  const a1y = start.p.y + start.n.y * halfDepth;
  const b1x = end.p.x + end.n.x * halfDepth;
  const b1y = end.p.y + end.n.y * halfDepth;
  const b2x = end.p.x - end.n.x * halfDepth;
  const b2y = end.p.y - end.n.y * halfDepth;
  const a2x = start.p.x - start.n.x * halfDepth;
  const a2y = start.p.y - start.n.y * halfDepth;
  return [a1x, a1y, b1x, b1y, b2x, b2y, a2x, a2y];
}

function makeQuadFromEdge(
  path: SVGPathElement,
  s0: number,
  s1: number,
  anchorOffset: number,
  depth: number,
  orientation: 1 | -1,
): Quad {
  const start = geoAt(path, s0);
  const end = geoAt(path, s1);
  const startAnchorX = start.p.x + start.n.x * anchorOffset;
  const startAnchorY = start.p.y + start.n.y * anchorOffset;
  const endAnchorX = end.p.x + end.n.x * anchorOffset;
  const endAnchorY = end.p.y + end.n.y * anchorOffset;
  const startInnerX = startAnchorX + start.n.x * depth * orientation;
  const startInnerY = startAnchorY + start.n.y * depth * orientation;
  const endInnerX = endAnchorX + end.n.x * depth * orientation;
  const endInnerY = endAnchorY + end.n.y * depth * orientation;
  return [startAnchorX, startAnchorY, endAnchorX, endAnchorY, endInnerX, endInnerY, startInnerX, startInnerY];
}

export function CurvedPianoKeys(props: CurvedPianoKeysProps) {
  const {
    d,
    numWhiteKeys,
    whiteKeyDensity = DEFAULTS.whiteKeyDensity,
    startOn = DEFAULTS.startOn,
    thickness = DEFAULTS.thickness,
    whiteKeySpan,
    blackWidthRatio = DEFAULTS.blackWidthRatio,
    blackDepth = DEFAULTS.blackDepth,
    whiteFill = DEFAULTS.whiteFill,
    whiteStroke = DEFAULTS.whiteStroke,
    blackFill = DEFAULTS.blackFill,
    blackStroke = DEFAULTS.blackStroke,
    strokeWidth = DEFAULTS.strokeWidth,
    showPath = false,
    className,
    orientation = DEFAULTS.orientation,
    fitViewBox = DEFAULTS.fitViewBox,
    viewBoxPadding,
    svgProps,
    pathProps,
  } = props;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  const densityRef = useRef<WhiteKeyDensity>(chooseDensity(DEFAULT_VIEWPORT_WIDTH, whiteKeyDensity));
  const [autoWhiteKeys, setAutoWhiteKeys] = useState<number>(() => WHITE_KEY_DENSITY_VALUES[densityRef.current]);
  const [whiteQuads, setWhiteQuads] = useState<Quad[]>([]);
  const [blackQuads, setBlackQuads] = useState<Quad[]>([]);
  const [viewBox, setViewBox] = useState<string>(DEFAULTS.initialViewBox);

  const { className: svgClassName, viewBox: svgViewBox, ...restSvgProps } = svgProps ?? {};
  const effectiveWhiteKeys = numWhiteKeys ?? autoWhiteKeys;

  useEffect(() => {
    if (svgViewBox) {
      setViewBox(svgViewBox);
    }
  }, [svgViewBox]);

  useEffect(() => {
    if (numWhiteKeys != null) {
      return;
    }

    if (whiteKeyDensity !== 'auto') {
      densityRef.current = whiteKeyDensity;
      const nextKeys = WHITE_KEY_DENSITY_VALUES[whiteKeyDensity];
      setAutoWhiteKeys((previous) => (previous === nextKeys ? previous : nextKeys));
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const svg = svgRef.current;

    const updateFromWidth = (width: number) => {
      const nextDensity = chooseDensity(width, 'auto');
      if (densityRef.current === nextDensity) {
        return;
      }
      densityRef.current = nextDensity;
      const nextKeys = WHITE_KEY_DENSITY_VALUES[nextDensity];
      setAutoWhiteKeys((previous) => (previous === nextKeys ? previous : nextKeys));
    };

    const measure = () => {
      const width = svg?.getBoundingClientRect().width ?? window.innerWidth ?? DEFAULT_VIEWPORT_WIDTH;
      updateFromWidth(width);
    };

    measure();

    let resizeObserver: ResizeObserver | null = null;
    if (svg && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect?.width ?? entry.target.getBoundingClientRect().width;
          if (Number.isFinite(width)) {
            updateFromWidth(width);
          }
        }
      });
      resizeObserver.observe(svg);
    }

    window.addEventListener('resize', measure, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [whiteKeyDensity, numWhiteKeys]);

  useIsomorphicLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) {
      return;
    }

    const whiteCount = Math.max(1, Math.floor(effectiveWhiteKeys));
    const totalLength = path.getTotalLength();
    const span = whiteKeySpan && whiteKeySpan > 0 ? whiteKeySpan : totalLength / whiteCount;

    const boundaries: number[] = [];
    for (let index = 0; index <= whiteCount; index += 1) {
      boundaries.push(Math.min(index * span, totalLength));
    }

    const halfWhite = thickness / 2;
    const whites: Quad[] = [];
    for (let index = 0; index < whiteCount; index += 1) {
      whites.push(makeQuadCentered(path, boundaries[index], boundaries[index + 1], halfWhite));
    }

    const order = startOn === 'A' ? NOTE_ORDER_A : NOTE_ORDER_C;
    const blacks: Quad[] = [];
    const blackWidth = span * blackWidthRatio;
    const blackDepthPx = thickness * blackDepth;
    const anchorOffset = orientation === 1 ? -halfWhite : halfWhite;

    for (let index = 0; index < whiteCount - 1; index += 1) {
      const note = order[index % 7];
      const fraction = BLACK_FRACTIONS[note];
      if (fraction == null) {
        continue;
      }

      const minBoundary = boundaries[index] + 0.001;
      const maxBoundary = boundaries[Math.min(index + 2, boundaries.length - 1)] - 0.001;
      const seam = boundaries[index + 1];
      const halfWidth = blackWidth / 2;
      let startOffset = seam - halfWidth;
      let endOffset = seam + halfWidth;

      if (startOffset < minBoundary) {
        const shift = minBoundary - startOffset;
        startOffset += shift;
        endOffset += shift;
      }

      if (endOffset > maxBoundary) {
        const shift = endOffset - maxBoundary;
        startOffset -= shift;
        endOffset -= shift;
      }

      const s0 = Math.max(minBoundary, startOffset);
      const s1 = Math.min(maxBoundary, endOffset);

      if (s1 > s0) {
        blacks.push(makeQuadFromEdge(path, s0, s1, anchorOffset, blackDepthPx, orientation));
      }
    }

    if (fitViewBox) {
      const polygons = [...whites, ...blacks];
      if (polygons.length > 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const quad of polygons) {
          for (let i = 0; i < 8; i += 2) {
            const x = quad[i];
            const y = quad[i + 1];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }

        if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
          const pad = viewBoxPadding ?? Math.max(8, strokeWidth * 4);
          const width = maxX - minX + pad * 2;
          const height = maxY - minY + pad * 2;
          setViewBox(`${minX - pad} ${minY - pad} ${width} ${height}`);
        }
      }
    }

    setWhiteQuads(whites);
    setBlackQuads(blacks);
  }, [
    d,
    effectiveWhiteKeys,
    startOn,
    thickness,
    whiteKeySpan,
    blackWidthRatio,
    blackDepth,
    strokeWidth,
    fitViewBox,
    viewBoxPadding,
    orientation,
  ]);

  const whitePolygons = useMemo(
    () =>
      whiteQuads.map((points, index) => (
        <polygon
          key={`white-${index}`}
          points={`${points[0]},${points[1]} ${points[2]},${points[3]} ${points[4]},${points[5]} ${points[6]},${points[7]}`}
          fill={whiteFill}
          stroke={whiteStroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
          shapeRendering="geometricPrecision"
        />
      )),
    [whiteQuads, whiteFill, whiteStroke, strokeWidth],
  );

  const blackPolygons = useMemo(
    () =>
      blackQuads.map((points, index) => (
        <polygon
          key={`black-${index}`}
          points={`${points[0]},${points[1]} ${points[2]},${points[3]} ${points[4]},${points[5]} ${points[6]},${points[7]}`}
          fill={blackFill}
          stroke={blackStroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
          shapeRendering="geometricPrecision"
        />
      )),
    [blackQuads, blackFill, blackStroke, strokeWidth],
  );

  const mergedSvgClassName = [className, svgClassName].filter(Boolean).join(' ') || undefined;

  const { d: _ignoredPathD, ...restPathProps } = pathProps ?? {};
  const resolvedPathProps: SVGProps<SVGPathElement> = {
    fill: 'none',
    ...restPathProps,
  };

  if (showPath) {
    resolvedPathProps.stroke = resolvedPathProps.stroke ?? 'rgba(0,0,0,0.15)';
    resolvedPathProps.strokeDasharray = resolvedPathProps.strokeDasharray ?? '6 6';
  } else if (resolvedPathProps.stroke === undefined) {
    resolvedPathProps.stroke = 'none';
  }

  return (
    <svg
      ref={svgRef}
      className={mergedSvgClassName}
      viewBox={viewBox}
      width="100%"
      height="auto"
      aria-label="Curved piano keyboard"
      {...restSvgProps}
    >
      <path ref={pathRef} d={d} {...resolvedPathProps} />
      <g>{whitePolygons}</g>
      <g>{blackPolygons}</g>
    </svg>
  );
}

export const PianoDefaults = DEFAULTS;
