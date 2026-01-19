import React, {useCallback, useState} from 'react';
import clsx from 'clsx';
import {Download, Layers} from 'lucide-react';
import {APP_VERSION} from './constants';
import ConfigPanel from './components/ConfigPanel';
import EdgePrepDetail from './components/EdgePrepDetail';
import HeadVisualizer from './components/HeadVisualizer';
import NozzleManager from './components/NozzleManager';
import PrintReport from './components/PrintReport';

export default function VesselHeadCalculator() {
  const [showReport, setShowReport] = useState(false);
  const [showEdgePrep, setShowEdgePrep] = useState(false);

  const handleOpenReport = useCallback(() => {
    setShowReport(true);
  }, []);

  const handleOpenEdgePrep = useCallback(() => {
    setShowEdgePrep(true);
  }, []);

  return (
    <>
      <div
        className={clsx(
          'min-h-full bg-neutral-900 text-neutral-200 font-sans selection:bg-blue-500/30 print:hidden',
          showReport ? 'hidden' : 'block',
        )}
      >
        <header className="bg-neutral-800 border-b border-neutral-700 sticky top-0 z-20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Layers size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-baseline gap-2">
                  <span>
                    VesselHead<span className="text-blue-500">Config</span>
                  </span>
                  <span className="text-xs font-mono text-neutral-500 bg-neutral-900/50 px-1.5 py-0.5 rounded border border-neutral-700/50">
                    v{APP_VERSION}
                  </span>
                </h1>
                <p className="text-xs text-neutral-400">DIN 28011 / 28013 / SS 895 Calculator</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleOpenReport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95"
              >
                <Download size={18} />
                <span>QC Report (PDF)</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <ConfigPanel onOpenEdgePrep={handleOpenEdgePrep} />
            <NozzleManager />
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            <HeadVisualizer />
          </div>
        </main>
      </div>

      <PrintReport isVisible={showReport} onClose={() => setShowReport(false)} />
      <EdgePrepDetail isVisible={showEdgePrep} onClose={() => setShowEdgePrep(false)} />
    </>
  );
}
