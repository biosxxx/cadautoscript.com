import React from 'react';
import clsx from 'clsx';
import {Scissors, X} from 'lucide-react';
import {useVesselHeadStore} from '../store';
import EdgePrepPreview from './EdgePrepPreview';

type EdgePrepDetailProps = {
  isVisible: boolean;
  onClose: () => void;
};

export default function EdgePrepDetail({isVisible, onClose}: EdgePrepDetailProps) {
  const config = useVesselHeadStore((state) => state.config);
  const isBevel = config.edgePrep === 'V-Bevel';

  const containerClassName = clsx(
    isVisible ? 'fixed inset-0 z-50' : 'hidden',
    'bg-neutral-950/90 text-neutral-100 print:hidden',
  );

  return (
    <div className={containerClassName}>
      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600/20 text-blue-400 p-2 rounded-lg">
                <Scissors size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Weld Edge Prep Detail</h2>
                <p className="text-sm text-neutral-400">Enlarged view of edge machining parameters.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white"
            >
              <X size={18} /> Close
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <EdgePrepPreview
                edgePrep={config.edgePrep}
                edgePrepSide={config.edgePrepSide}
                thickness={config.thickness}
                rootFace={config.rootFace}
                bevelAngle={config.bevelAngle}
                orientation="head"
                variant="detail"
              />
            </div>

            <div className="bg-neutral-900/80 rounded-3xl border border-neutral-700 p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Weld Prep</p>
                <h3 className="text-xl font-semibold text-white">
                  {config.edgePrep === 'None' ? 'Square Cut' : 'V-Bevel (Outside)'}
                </h3>
              </div>
              <div className="space-y-3 text-sm text-neutral-300">
                <div className="flex items-center justify-between">
                  <span>Standard</span>
                  <span className="text-white">{config.standard}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Thickness (s)</span>
                  <span className="text-white">{config.thickness} mm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sides</span>
                  <span className="text-white">
                    {config.edgePrepSide === 'double' ? 'Double side' : 'Single side'}
                  </span>
                </div>
                {isBevel ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Root Face (c)</span>
                      <span className="text-white">{config.rootFace} mm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Bevel Angle (u)</span>
                      <span className="text-white">{config.bevelAngle} deg</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span>Edge Prep</span>
                    <span className="text-white">Square cut</span>
                  </div>
                )}
              </div>
              <div className="rounded-2xl bg-neutral-800/70 border border-neutral-700 p-4 text-xs text-neutral-400">
                <p>
                  Keep root face and bevel angle within standard shop tolerances. Adjustments for welding
                  prep should maintain the minimum straight flange values required by the selected standard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
