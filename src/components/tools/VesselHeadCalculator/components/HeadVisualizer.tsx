import React, {useMemo} from 'react';
import clsx from 'clsx';
import {useVesselHeadStore} from '../store';
import {
  calculateGeometry,
  calculateVolumeM3,
  getDimensionFontSize,
  getNozzleDiameter,
} from '../utils';
import type {GeometryResult, HeadConfig} from '../types';
import styles from '../styles.module.css';

type Orientation = 'horizontal' | 'vertical';

type SvgDimensionProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text: string;
  offset?: number;
  color?: string;
  fontSize?: number;
  orientation?: Orientation;
};

type HeadProfileProps = {
  config: HeadConfig;
  calculated: GeometryResult;
  center: number;
  fontSize: number;
  isPrint?: boolean;
};

const SvgDimension = ({
  x1,
  y1,
  x2,
  y2,
  text,
  offset = 10,
  color = 'black',
  fontSize = 14,
  orientation = 'horizontal',
}: SvgDimensionProps) => {
  const arrowSize = fontSize / 2.5;

  let lx1 = x1;
  let ly1 = y1;
  let lx2 = x2;
  let ly2 = y2;
  let tx = (x1 + x2) / 2;
  let ty = (y1 + y2) / 2;

  if (orientation === 'horizontal') {
    ly1 += offset;
    ly2 += offset;
    ty = ly1 - fontSize * 0.3;
  } else {
    lx1 += offset;
    lx2 += offset;
    tx = lx1 + fontSize * 0.3;
    if (offset < 0) tx = lx1 - fontSize * 0.8;
  }

  return (
    <g className="dimension-line">
      <line x1={x1} y1={y1} x2={lx1} y2={ly1} stroke={color} strokeWidth="0.5" opacity="0.5" />
      <line x1={x2} y1={y2} x2={lx2} y2={ly2} stroke={color} strokeWidth="0.5" opacity="0.5" />
      <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={color} strokeWidth="1" />
      {orientation === 'horizontal' ? (
        <>
          <path
            d={`M ${lx1} ${ly1} L ${lx1 + arrowSize} ${ly1 - arrowSize / 2} L ${lx1 + arrowSize} ${ly1 + arrowSize / 2} Z`}
            fill={color}
          />
          <path
            d={`M ${lx2} ${ly2} L ${lx2 - arrowSize} ${ly2 - arrowSize / 2} L ${lx2 - arrowSize} ${ly2 + arrowSize / 2} Z`}
            fill={color}
          />
        </>
      ) : (
        <>
          <path
            d={`M ${lx1} ${ly1} L ${lx1 - arrowSize / 2} ${ly1 + arrowSize} L ${lx1 + arrowSize / 2} ${ly1 + arrowSize} Z`}
            fill={color}
          />
          <path
            d={`M ${lx2} ${ly2} L ${lx2 - arrowSize / 2} ${ly2 - arrowSize} L ${lx2 + arrowSize / 2} ${ly2 - arrowSize} Z`}
            fill={color}
          />
        </>
      )}
      <text
        x={tx}
        y={ty}
        fill={color}
        fontSize={fontSize}
        textAnchor="middle"
        dominantBaseline={orientation === 'horizontal' ? 'auto' : 'middle'}
        fontWeight="bold"
        style={{
          paintOrder: 'stroke',
          stroke: color === 'black' ? 'white' : 'black',
          strokeWidth: '3px',
          strokeLinecap: 'butt',
          strokeLinejoin: 'miter',
          strokeOpacity: 0.3,
        }}
      >
        {text}
      </text>
    </g>
  );
};

export const HeadProfile = ({
  config,
  calculated,
  center,
  fontSize,
  isPrint = false,
}: HeadProfileProps) => {
  const width = config.diameterOuter;
  const height = calculated.totalHeight;
  const sf = config.straightFlange;
  const t = config.thickness;

  const fill = isPrint ? 'none' : 'url(#metalGradient)';
  const stroke = isPrint ? 'black' : '#60a5fa';
  const strokeWidth = isPrint ? Math.max(2, config.diameterOuter / 400) : 2;
  const dimColor = isPrint ? 'black' : '#cbd5e1';

  const bevelW =
    config.edgePrep === 'V-Bevel'
      ? Math.tan((config.bevelAngle * Math.PI) / 180) * (t - config.rootFace)
      : 0;
  const root = config.edgePrep !== 'None' ? config.rootFace : t;

  return (
    <g>
      <path
        d={`
          M ${center - width / 2} ${center + height / 2}
          L ${center - width / 2} ${center + height / 2 - sf}
          C ${center - width / 2} ${center - height / 2} ${center + width / 2} ${center - height / 2} ${center + width / 2} ${center + height / 2 - sf}
          L ${center + width / 2} ${center + height / 2}
          ${
            config.edgePrep === 'V-Bevel'
              ? `
                L ${center + width / 2 - root} ${center + height / 2}
                L ${center + width / 2 - t} ${center + height / 2 - bevelW}
              `
              : `
                L ${center + width / 2 - t} ${center + height / 2}
              `
          }
          L ${center + width / 2 - t} ${center + height / 2 - sf}
          C ${center + width / 2 - t} ${center - height / 2 + t} ${center - width / 2 + t} ${center - height / 2 + t} ${center - width / 2 + t} ${center + height / 2 - sf}
          ${
            config.edgePrep === 'V-Bevel'
              ? `
                L ${center - width / 2 + t} ${center + height / 2 - bevelW}
                L ${center - width / 2 + root} ${center + height / 2}
              `
              : `
                L ${center - width / 2 + t} ${center + height / 2}
              `
          }
          Z
        `}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      <g className="dimensions">
        <line
          x1={center}
          y1={center - height / 2 - fontSize}
          x2={center}
          y2={center + height / 2 + fontSize}
          stroke={dimColor}
          strokeWidth="1"
          strokeDasharray={`${fontSize},${fontSize / 2}`}
          opacity="0.5"
        />

        <SvgDimension
          x1={center - width / 2}
          y1={center + height / 2}
          x2={center + width / 2}
          y2={center + height / 2}
          text={`Da = ${config.diameterOuter}`}
          offset={fontSize * 2.5}
          fontSize={fontSize}
          orientation="horizontal"
          color={dimColor}
        />

        <SvgDimension
          x1={center + width / 2}
          y1={center - height / 2 + t}
          x2={center + width / 2}
          y2={center + height / 2}
          text={`H = ${calculated.totalHeight.toFixed(1)}`}
          offset={fontSize * 3}
          fontSize={fontSize}
          orientation="vertical"
          color={dimColor}
        />

        <SvgDimension
          x1={center - width / 2}
          y1={center + height / 2 - sf}
          x2={center - width / 2}
          y2={center + height / 2}
          text={`h1 = ${config.straightFlange}`}
          offset={-fontSize * 2.5}
          fontSize={fontSize}
          orientation="vertical"
          color={dimColor}
        />

        <g>
          <line
            x1={center + width / 2 - t / 2}
            y1={center + height / 2 - sf / 2}
            x2={center + width / 2 + fontSize * 4}
            y2={center + height / 2 - sf / 2}
            stroke={dimColor}
            strokeWidth="1"
          />
          <text
            x={center + width / 2 + fontSize * 4.5}
            y={center + height / 2 - sf / 2 + fontSize * 0.35}
            fontSize={fontSize}
            fontWeight="bold"
            fill={dimColor}
          >
            s = {config.thickness}
          </text>
          <circle
            cx={center + width / 2 - t / 2}
            cy={center + height / 2 - sf / 2}
            r={fontSize / 5}
            fill={dimColor}
          />
        </g>

        {config.edgePrep !== 'None' ? (
          <g>
            <line
              x1={center + width / 2}
              y1={center + height / 2}
              x2={center + width / 2 + fontSize * 2}
              y2={center + height / 2 + fontSize * 2}
              stroke={dimColor}
              strokeWidth="1"
            />
            <text
              x={center + width / 2 + fontSize * 2.2}
              y={center + height / 2 + fontSize * 2.2}
              fontSize={fontSize * 0.8}
              fontWeight="bold"
              fill={dimColor}
            >
              {config.edgePrep}: {config.bevelAngle}u
            </text>
          </g>
        ) : null}
      </g>
    </g>
  );
};

export default function HeadVisualizer() {
  const config = useVesselHeadStore((state) => state.config);
  const nozzles = useVesselHeadStore((state) => state.nozzles);

  const calculated = useMemo(() => calculateGeometry(config), [config]);
  const volumeM3 = useMemo(
    () => calculateVolumeM3(config, calculated.totalHeight),
    [config, calculated.totalHeight],
  );

  const screenViewBoxSize = config.diameterOuter * 1.5;
  const center = screenViewBoxSize / 2;
  const dimensionFontSize = getDimensionFontSize(config.diameterOuter);

  return (
    <div className="flex-1 bg-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col">
      <div className={clsx('flex-1 flex items-center justify-center p-8', styles.pvdePattern)}>
        <svg viewBox={`0 0 ${screenViewBoxSize} ${screenViewBoxSize}`} className="w-full h-full max-h-[600px]">
          <defs>
            <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="50%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
          </defs>
          <line x1={center} y1="0" x2={center} y2={screenViewBoxSize} stroke="#333" strokeDasharray="10,10" />
          <line x1="0" y1={center} x2={screenViewBoxSize} y2={center} stroke="#333" strokeDasharray="10,10" />
          <HeadProfile
            config={config}
            calculated={calculated}
            center={center}
            fontSize={dimensionFontSize}
          />
          {nozzles.map((nozzle, index) => {
            const nozzleWidth = getNozzleDiameter(nozzle.size);
            const nozzleVisualWidth = Math.max(20, nozzleWidth);
            const nozzleHeight = 60;
            const nozzleX = center + nozzle.offset;
            const nozzleY = center - calculated.totalHeight / 2 + config.thickness + 10;

            return (
              <g key={nozzle.id}>
                <rect
                  x={nozzleX - nozzleVisualWidth / 2}
                  y={nozzleY - nozzleHeight}
                  width={nozzleVisualWidth}
                  height={nozzleHeight}
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth="1"
                />
                <text
                  x={nozzleX}
                  y={nozzleY - nozzleHeight - 10}
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize="20"
                  fontWeight="bold"
                >
                  N{index + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="h-20 bg-neutral-800 border-t border-neutral-700 flex items-center justify-around px-4">
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase">Volume</div>
          <div className="text-xl font-mono text-white">{volumeM3.toFixed(3)} m3</div>
        </div>
        <div className="h-10 w-px bg-neutral-700"></div>
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase">Weight</div>
          <div className="text-xl font-mono text-blue-400">{calculated.weight.toFixed(1)} kg</div>
        </div>
      </div>
    </div>
  );
}
