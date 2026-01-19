import React, {useEffect, useMemo, useState} from 'react';
import clsx from 'clsx';
import {ExternalLink, Ruler, Scissors, Settings} from 'lucide-react';
import {EDGE_PREP_OPTIONS, EDGE_PREP_SIDES, MATERIALS, STANDARDS} from '../constants';
import {useVesselHeadStore} from '../store';
import type {EdgePrep, EdgePrepSide, HeadStandard} from '../types';
import {getMinimumStraightFlange} from '../utils';
import styles from '../styles.module.css';

type ConfigPanelProps = {
  onOpenEdgePrep?: () => void;
};

export default function ConfigPanel({onOpenEdgePrep}: ConfigPanelProps) {
  const config = useVesselHeadStore((state) => state.config);
  const setConfig = useVesselHeadStore((state) => state.setConfig);
  const setStandard = useVesselHeadStore((state) => state.setStandard);
  const [hasCustomH1, setHasCustomH1] = useState(false);

  const minimumStraightFlange = useMemo(
    () => getMinimumStraightFlange(config.standard, config.diameterOuter, config.thickness),
    [config.standard, config.diameterOuter, config.thickness],
  );
  const isBelowMinimum = config.straightFlange < minimumStraightFlange;
  const showMinimumWarning = hasCustomH1 && isBelowMinimum;

  useEffect(() => {
    if (hasCustomH1) {
      return;
    }

    if (config.straightFlange !== minimumStraightFlange) {
      setConfig({straightFlange: minimumStraightFlange});
    }
  }, [config.straightFlange, hasCustomH1, minimumStraightFlange, setConfig]);

  return (
    <>
      <section className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Ruler size={20} className="text-blue-500" /> Standard
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {STANDARDS.map((std) => (
            <button
              key={std}
              type="button"
              onClick={() => setStandard(std as HeadStandard)}
              className={clsx(
                'py-2 px-3 text-xs md:text-sm rounded-lg border font-medium transition-all',
                config.standard === std
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-500',
              )}
            >
              {std}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings size={20} className="text-blue-500" /> Geometry &amp; Material
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-xs text-neutral-400 mb-1 ml-1">Diameter (Da)</label>
              <input
                type="number"
                value={config.diameterOuter}
                onChange={(event) => setConfig({diameterOuter: Number(event.target.value)})}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="group">
              <label className="block text-xs text-neutral-400 mb-1 ml-1">Thickness (s)</label>
              <input
                type="number"
                value={config.thickness}
                onChange={(event) => setConfig({thickness: Number(event.target.value)})}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs text-neutral-400 mb-1 ml-1">
              Straight Flange (h1): {config.straightFlange} mm
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={minimumStraightFlange}
                step="0.1"
                value={config.straightFlange}
                onChange={(event) => {
                  setHasCustomH1(true);
                  setConfig({straightFlange: Number(event.target.value)});
                }}
                className={clsx(
                  'w-full bg-neutral-900 border rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-600 outline-none',
                  showMinimumWarning ? 'border-amber-500/70' : 'border-neutral-700',
                )}
              />
              <span className="text-xs text-neutral-500">mm</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">
              Minimum by standard: {minimumStraightFlange} mm
            </p>
            {showMinimumWarning ? (
              <p className="text-xs text-amber-400 mt-2">
                h1 must be at least {minimumStraightFlange} mm for the selected standard.
              </p>
            ) : null}
          </div>

          <div className="group">
            <label className="block text-xs text-neutral-400 mb-1 ml-1">Material</label>
            <select
              value={config.material}
              onChange={(event) => setConfig({material: event.target.value})}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
            >
              {MATERIALS.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Scissors size={20} className="text-blue-500" /> Weld Edge Prep
        </h2>
        <div className="space-y-4">
          <div className="group">
            <label className="block text-xs text-neutral-400 mb-1 ml-1">Type</label>
            <select
              value={config.edgePrep}
              onChange={(event) => setConfig({edgePrep: event.target.value as EdgePrep})}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
            >
              {EDGE_PREP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {config.edgePrep !== 'None' ? (
            <div className={clsx('grid grid-cols-1 sm:grid-cols-3 gap-4', styles.animateFadeIn)}>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Angle (u)</label>
                <input
                  type="number"
                  value={config.bevelAngle}
                  onChange={(event) => setConfig({bevelAngle: Number(event.target.value)})}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Root Face (mm)</label>
                <input
                  type="number"
                  value={config.rootFace}
                  onChange={(event) => setConfig({rootFace: Number(event.target.value)})}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Sides</label>
                <select
                  value={config.edgePrepSide}
                  onChange={(event) => setConfig({edgePrepSide: event.target.value as EdgePrepSide})}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-white"
                >
                  {EDGE_PREP_SIDES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onOpenEdgePrep}
            className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink size={14} /> View edge prep detail
          </button>
        </div>
      </section>
    </>
  );
}
