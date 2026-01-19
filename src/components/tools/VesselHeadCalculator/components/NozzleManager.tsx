import React from 'react';
import {Cpu, Plus, Trash2} from 'lucide-react';
import {NOZZLE_SIZES} from '../constants';
import {useVesselHeadStore} from '../store';
import type {NozzleSize} from '../types';
import styles from '../styles.module.css';

export default function NozzleManager() {
  const nozzles = useVesselHeadStore((state) => state.nozzles);
  const addNozzle = useVesselHeadStore((state) => state.addNozzle);
  const removeNozzle = useVesselHeadStore((state) => state.removeNozzle);
  const updateNozzle = useVesselHeadStore((state) => state.updateNozzle);

  return (
    <section className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Cpu size={20} className="text-blue-500" /> Nozzles
        </h2>
        <button
          type="button"
          onClick={addNozzle}
          className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
          aria-label="Add nozzle"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className={`space-y-3 max-h-40 overflow-y-auto pr-1 ${styles.customScrollbar}`}>
        {nozzles.map((nozzle) => (
          <div
            key={nozzle.id}
            className="bg-neutral-900 p-3 rounded-lg border border-neutral-700 flex gap-2 items-end"
          >
            <div className="flex-1">
              <select
                value={nozzle.size}
                onChange={(event) =>
                  updateNozzle(nozzle.id, {size: event.target.value as NozzleSize})
                }
                className="w-full bg-neutral-800 border border-neutral-700 text-xs rounded p-1.5"
              >
                {NOZZLE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <input
                type="number"
                value={nozzle.offset}
                onChange={(event) => updateNozzle(nozzle.id, {offset: Number(event.target.value)})}
                className="w-full bg-neutral-800 border border-neutral-700 text-xs rounded p-1.5"
              />
            </div>
            <button
              type="button"
              onClick={() => removeNozzle(nozzle.id)}
              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"
              aria-label="Remove nozzle"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
