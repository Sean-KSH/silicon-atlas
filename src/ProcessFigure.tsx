import React, { useRef, useState, useEffect } from 'react';
import { useSvgDrag } from './useSvgDrag';
const names = [
  'Silica feedstock',
  'Submerged-arc reduction',
  'Chlorosilane purification',
  'Polysilicon deposition',
  'Czochralski crystal growth',
  'Wafer preparation',
];
function Callout({
  x,
  y,
  toX,
  toY,
  label,
  sub,
}: {
  x: number;
  y: number;
  toX: number;
  toY: number;
  label: string;
  sub?: string;
}) {
  return (
    <g>
      <path
        d={`M${toX} ${toY}H${x - 16}V${y - 5}H${x - 5}`}
        fill="none"
        stroke="var(--c-74899e)"
        strokeWidth="1"
      />
      <circle cx={toX} cy={toY} r="2.5" fill="var(--c-aec6d8)" />
      <text x={x} y={y} className="figure-label">
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 17} className="figure-sub">
          {sub}
        </text>
      )}
    </g>
  );
}
export default function ProcessFigure({ stage }: { stage: number }) {
  const [angle, setAngle] = useState(0);
  const startAngle = useRef(0);
  const waferDrag = useSvgDrag(
    (dx) => setAngle(Math.max(-75, Math.min(75, startAngle.current + dx * 0.5))),
    () => {
      startAngle.current = angle;
    },
  );
  useEffect(() => setAngle(0), [stage]);
  return (
    <figure className="equipment-figure">
      <div className="figure-topline">
        <span>FIG. 0{stage + 1}</span>
        <span>Sectional view / Schematic</span>
      </div>
      <svg
        viewBox="0 0 860 410"
        role="group"
        aria-label={`${names[stage]} — annotated conceptual cross-section, not to scale`}
      >
        <defs>
          <linearGradient id="steel">
            <stop stopColor="var(--c-263340)" />
            <stop offset=".22" stopColor="var(--c-8e9ba7)" />
            <stop offset=".42" stopColor="var(--c-d1dae0)" />
            <stop offset=".58" stopColor="var(--c-677886)" />
            <stop offset="1" stopColor="var(--c-202d39)" />
          </linearGradient>
          <linearGradient id="silicon">
            <stop stopColor="var(--c-172737)" />
            <stop offset=".25" stopColor="var(--c-556a80)" />
            <stop offset=".42" stopColor="var(--c-a5b4c3)" />
            <stop offset=".48" stopColor="var(--c-778da5)" />
            <stop offset=".7" stopColor="var(--c-273b52)" />
            <stop offset="1" stopColor="var(--c-132233)" />
          </linearGradient>
          <linearGradient id="heat" x2="0" y2="1">
            <stop stopColor="var(--c-f5cd8c)" />
            <stop offset=".3" stopColor="var(--c-ce894a)" />
            <stop offset="1" stopColor="var(--c-70422b)" />
          </linearGradient>
          <radialGradient id="wafer">
            <stop stopColor="var(--c-23394d)" />
            <stop offset=".5" stopColor="var(--c-526a84)" />
            <stop offset=".8" stopColor="var(--c-203650)" />
            <stop offset="1" stopColor="var(--c-a3b6cb)" />
          </radialGradient>
          <pattern
            id="hatch"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(40)"
          >
            <path d="M0 0V7" stroke="var(--c-667b8e)" strokeWidth="1" />
          </pattern>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M24 0H0V24"
              fill="none"
              stroke="var(--c-294054)"
              strokeWidth=".6"
              opacity=".45"
            />
          </pattern>
          <pattern id="grain" width="56" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M0 0L24 13L56 0M24 13L19 48M24 13L56 37"
              fill="none"
              stroke="var(--c-b0bdc8)"
              opacity=".4"
            />
          </pattern>
        </defs>
        <rect x="15" y="15" width="830" height="365" fill="url(#grid)" />
        <path d="M30 355H827" stroke="var(--c-405063)" strokeWidth="1" />
        <text x="31" y="378" className="figure-sub">
          {names[stage]}
        </text>
        <text x="827" y="378" textAnchor="end" className="figure-sub">
          Illustration · not to scale
        </text>
        {stage === 4 ? (
          <>
            <path
              d="M230 340V124Q230 88 267 88H523Q560 88 560 124V340"
              fill="var(--c-101b26)"
              stroke="var(--c-64788c)"
              strokeWidth="2"
            />
            <path
              d="M242 340V126Q242 100 270 100H520Q548 100 548 126V340"
              fill="url(#hatch)"
              opacity=".3"
            />
            <path
              d="M275 180V278Q275 321 318 321H472Q515 321 515 278V180"
              fill="var(--c-303e49)"
              stroke="var(--c-96a7b4)"
              strokeWidth="2"
            />
            <path
              d="M288 184V278Q288 307 318 307H472Q502 307 502 278V184"
              fill="var(--c-162331)"
              stroke="var(--c-c2ced4)"
              strokeWidth="3"
            />
            <path d="M291 236H499V277Q499 304 472 304H318Q291 304 291 277Z" fill="url(#heat)" />
            <ellipse
              cx="395"
              cy="236"
              rx="104"
              ry="12"
              fill="var(--c-edb772)"
              stroke="var(--c-f5d097)"
            />
            <path
              d="M342 236Q352 232 355 220Q395 233 435 220Q440 232 448 236Z"
              fill="var(--c-edb772)"
              stroke="var(--c-f5d097)"
            />
            <path
              d="M355 220V136Q355 119 375 103L386 94H404L415 103Q435 119 435 136V220Q435 231 395 231Q355 231 355 220Z"
              fill="url(#silicon)"
              stroke="var(--c-afc2d0)"
              strokeWidth="1.2"
            />
            <ellipse
              cx="395"
              cy="220"
              rx="40"
              ry="9"
              fill="var(--c-27394b)"
              stroke="var(--c-bed5df)"
            />
            <path d="M375 128V213" stroke="var(--c-d5e6f0)" opacity=".25" />
            <rect
              x="387"
              y="64"
              width="16"
              height="32"
              fill="url(#steel)"
              stroke="var(--c-a6b8c5)"
            />
            <rect x="390" y="20" width="10" height="44" fill="url(#steel)" />
            <path d="M340 80V34M335 42L340 34L345 42" fill="none" stroke="var(--c-9ebdcf)" />
            <text x="275" y="51" className="figure-sub">
              PULL
            </text>
            {[258, 525].map((x) => (
              <g key={x}>
                {[190, 211, 232, 253, 274].map((y) => (
                  <rect
                    key={y}
                    x={x}
                    y={y}
                    width="14"
                    height="12"
                    rx="2"
                    fill="var(--c-8f6549)"
                    stroke="var(--c-b8875a)"
                  />
                ))}
              </g>
            ))}
            <rect x="365" y="323" width="60" height="17" fill="url(#steel)" />
            <Callout
              x={620}
              y={63}
              toX={403}
              toY={76}
              label="01  Seed crystal"
              sub="Defines lattice orientation"
            />
            <Callout
              x={620}
              y={133}
              toX={435}
              toY={152}
              label="02  Growing single crystal"
              sub="Solid silicon boule"
            />
            <Callout
              x={620}
              y={225}
              toX={464}
              toY={242}
              label="03  Silicon melt"
              sub="Solid–liquid interface above"
            />
            <Callout
              x={620}
              y={296}
              toX={506}
              toY={292}
              label="04  Crucible"
              sub="Contains the molten charge"
            />
            <text x="45" y="190" className="figure-label">
              CZ growth
            </text>
            <text x="45" y="211" className="figure-sub">
              Seeded solidification
            </text>
            <text x="45" y="230" className="figure-sub">
              Heat & flow not simulated
            </text>
          </>
        ) : stage === 2 ? (
          <>
            <path
              d="M130 283V153Q130 125 160 125H205Q235 125 235 153V283Z"
              fill="url(#steel)"
              stroke="var(--c-a5b6c3)"
            />
            <ellipse
              cx="182"
              cy="283"
              rx="52"
              ry="13"
              fill="var(--c-273849)"
              stroke="var(--c-a5b6c3)"
            />
            <path
              d="M235 162H312V241H350M435 112H517V202H585"
              fill="none"
              stroke="var(--c-85aabb)"
              strokeWidth="5"
            />
            <rect
              x="350"
              y="67"
              width="85"
              height="246"
              rx="25"
              fill="url(#steel)"
              stroke="var(--c-c1cdd5)"
            />
            <rect x="362" y="100" width="61" height="179" fill="var(--c-182a39)" />
            {[115, 145, 175, 205, 235, 265].map((y) => (
              <g key={y}>
                <path d={`M363 ${y}H415`} stroke="var(--c-92b7cb)" strokeWidth="2" />
                <path d={`M369 ${y - 8}V${y}`} stroke="var(--c-b6d5df)" />
              </g>
            ))}
            <path
              d="M585 290V207Q585 180 620 180H670Q705 180 705 207V290Z"
              fill="url(#steel)"
              stroke="var(--c-acbfce)"
            />
            <path
              d="M375 314V340M411 314V340M151 294V340M214 294V340M605 291V340M686 291V340"
              stroke="var(--c-74899a)"
              strokeWidth="7"
            />
            <text x="130" y="100" className="figure-label">
              Conversion reactor
            </text>
            <text x="360" y="48" className="figure-label">
              Distillation
            </text>
            <text x="584" y="160" className="figure-label">
              Purified precursor
            </text>
            <text x="62" y="323" className="figure-sub">
              MG-Si + HCl
            </text>
            <text x="490" y="99" className="figure-sub">
              Chlorosilane stream
            </text>
            <path d="M494 105V112" stroke="var(--c-a5b8c9)" />
          </>
        ) : stage === 3 ? (
          <>
            <path
              d="M235 335V125Q235 53 395 53Q555 53 555 125V335Z"
              fill="var(--c-162332)"
              stroke="var(--c-889bad)"
              strokeWidth="3"
            />
            <path
              d="M250 333V129Q250 70 395 70Q540 70 540 129V333"
              fill="url(#hatch)"
              opacity=".25"
            />
            {[305, 420].map((x) => (
              <g key={x}>
                <path
                  d={`M${x} 318V145Q${x} 120 ${x + 25} 120Q${x + 50} 120 ${x + 50} 145V318`}
                  stroke="url(#silicon)"
                  strokeWidth="28"
                  fill="none"
                />
                <path
                  d={`M${x} 318V145Q${x} 120 ${x + 25} 120Q${x + 50} 120 ${x + 50} 145V318`}
                  stroke="url(#grain)"
                  strokeWidth="25"
                  fill="none"
                />
              </g>
            ))}
            <rect x="216" y="321" width="360" height="19" fill="url(#steel)" />
            <path d="M170 292H260M530 292H605" stroke="var(--c-80a3bd)" strokeWidth="6" />
            <Callout x={620} y={98} toX={545} toY={120} label="Deposition chamber" />
            <Callout
              x={620}
              y={183}
              toX={470}
              toY={199}
              label="Polysilicon rods"
              sub="Multiple crystalline grains"
            />
            <text x="60" y="269" className="figure-label">
              Purified precursor
            </text>
            <text x="60" y="289" className="figure-sub">
              Schematic gas inlet
            </text>
          </>
        ) : stage === 5 ? (
          <>
            <rect
              x="100"
              y="155"
              width="245"
              height="110"
              fill="url(#silicon)"
              stroke="var(--c-95a9bd)"
            />
            <ellipse
              cx="100"
              cy="210"
              rx="25"
              ry="55"
              fill="var(--c-293d51)"
              stroke="var(--c-93a8bd)"
            />
            <ellipse
              cx="345"
              cy="210"
              rx="25"
              ry="55"
              fill="url(#wafer)"
              stroke="var(--c-bbcad7)"
            />
            {[242, 262, 282, 302, 322].map((x) => (
              <path key={x} d={`M${x} 133V284`} stroke="var(--c-b8cbda)" strokeWidth="1.5" />
            ))}
            <path d="M405 210H463M453 203L463 210L453 217" stroke="var(--c-9eb7cc)" fill="none" />
            <g
              className={`wafer-drag ${waferDrag.dragging ? 'is-dragging' : ''}`}
              role="slider"
              tabIndex={0}
              aria-label="Rotate polished wafer"
              aria-valuemin={-75}
              aria-valuemax={75}
              aria-valuenow={Math.round(angle)}
              aria-valuetext={`${Math.round(angle)} degrees illustrative tilt`}
              {...waferDrag.handlers}
              onKeyDown={(e) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(e.key)) return;
                e.preventDefault();
                setAngle((a) =>
                  e.key === 'Home'
                    ? 0
                    : Math.max(-75, Math.min(75, a + (e.key === 'ArrowRight' ? 5 : -5))),
                );
              }}
            >
              <rect x="496" y="104" width="208" height="230" fill="transparent" rx="8" />
              <g
                transform={`translate(600 218) scale(${Math.cos((angle * Math.PI) / 180)} 1) translate(-600 -218)`}
              >
                <ellipse
                  cx="600"
                  cy="218"
                  rx="94"
                  ry="112"
                  fill="url(#wafer)"
                  stroke="var(--c-c4d5e4)"
                  strokeWidth="2"
                />
                <path
                  d="M526 275Q600 230 673 156"
                  stroke="var(--c-c9e5f9)"
                  strokeWidth="9"
                  opacity=".12"
                />
                <path
                  d="M591 329L600 321L609 329"
                  fill="var(--c-101a25)"
                  stroke="var(--c-9ab3ca)"
                />
              </g>
            </g>
            <text x="104" y="111" className="figure-label">
              Wire-sawn ingot
            </text>
            <text x="520" y="80" className="figure-label">
              Polished wafer
            </text>
            <text x="520" y="100" className="figure-sub">
              Face view with orientation notch
            </text>
            <path d="M710 180H758V250H710" stroke="var(--c-96aec1)" fill="none" />
            <path d="M738 181V249" stroke="var(--c-c4d5e4)" strokeWidth="3" />
            <text x="711" y="275" className="figure-sub">
              Edge section
            </text>
          </>
        ) : stage === 1 ? (
          <>
            <path
              d="M205 155H585L555 318H235Z"
              fill="var(--c-28394a)"
              stroke="var(--c-91a2b3)"
              strokeWidth="2"
            />
            <path d="M223 170H567L542 301H248Z" fill="url(#hatch)" />
            <path d="M242 240H548L538 292H252Z" fill="url(#heat)" />
            {[300, 386, 472].map((x) => (
              <g key={x}>
                <rect
                  x={x}
                  y="52"
                  width="28"
                  height="167"
                  fill="url(#steel)"
                  stroke="var(--c-8ea0b0)"
                />
                <path
                  d={`M${x + 8} 222l8 17-13 4 14 12`}
                  fill="none"
                  stroke="var(--c-f3d399)"
                  strokeWidth="3"
                />
              </g>
            ))}
            <path d="M550 275H625L650 310" stroke="var(--c-e7b278)" strokeWidth="9" fill="none" />
            <Callout
              x={625}
              y={80}
              toX={500}
              toY={105}
              label="Electrodes"
              sub="Submerged-arc furnace"
            />
            <Callout x={625} y={190} toX={550} toY={202} label="Silica + carbon charge" />
            <text x="255" y="342" className="figure-sub">
              Molten metallurgical-grade silicon
            </text>
          </>
        ) : (
          <>
            <path
              d="M155 295L131 209L196 144L246 167L280 92L358 71L430 154L496 125L560 203L612 245L580 298Z"
              fill="var(--c-90999e)"
              stroke="var(--c-c2cbd0)"
            />
            <path d="M155 295L196 144L246 167L235 288Z" fill="var(--c-5e6e7a)" />
            <path d="M246 167L280 92L358 71L337 227L235 288Z" fill="var(--c-c1cbd0)" />
            <path d="M358 71L430 154L337 227Z" fill="var(--c-8194a3)" />
            <path d="M337 227L430 154L496 125L477 272Z" fill="var(--c-acbbc5)" />
            <path d="M496 125L560 203L612 245L477 272Z" fill="var(--c-657e91)" />
            <path d="M235 288L337 227L477 272L580 298Z" fill="var(--c-3d5468)" />
            <Callout
              x={638}
              y={125}
              toX={430}
              toY={154}
              label="Silica feedstock"
              sub="SiO₂ · silicon bound to oxygen"
            />
            <text x="74" y="335" className="figure-sub">
              Faceted mineral illustration; not an atomistic model
            </text>
          </>
        )}
      </svg>
      {stage === 5 && (
        <div className="wafer-interaction">
          <div>
            <b>↔ Drag the wafer to inspect its face</b>
            <p>
              Illustrative tilt: {Math.round(angle)}° · Use ← / → keys in 5° steps. Orientation
              only; no material properties change.
            </p>
          </div>
          <button onClick={() => setAngle(0)}>Reset view</button>
        </div>
      )}
      <figcaption>
        Equipment and material appearance are illustrative. Dimensions, temperature, and crystal
        quality are not inferred from this drawing.
      </figcaption>
    </figure>
  );
}
