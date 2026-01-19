import React, {useMemo, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {buildTubeSheetDxf} from './services/dxf-exporter';
import GeneratorForm from './ui/GeneratorForm';
import PreviewCanvas from './ui/PreviewCanvas';
import useGeneratorState from './hooks/useGeneratorState';
import {createPointKey} from './core/geometry-utils';
import {SPACER_SCALE} from './constants';
import type {ModifiedHole, Point} from './types';

const TubeSheetGeneratorContent = () => {
  const [isGeneratingStep, setIsGeneratingStep] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [modifiedHoles, setModifiedHoles] = useState<Map<string, ModifiedHole>>(new Map());
  const {params, tubeCoords, handleChange, generateStep} = useGeneratorState();
  const modifiedCount = useMemo(() => {
    let count = 0;
    modifiedHoles.forEach((value) => {
      if (value.hidden || value.diameter !== undefined) {
        count += 1;
      }
    });
    return count;
  }, [modifiedHoles]);
  const effectiveCount = Math.max(0, tubeCoords.length - modifiedCount);

  const handleDownloadDXF = () => {
    const dxf = buildTubeSheetDxf(params, tubeCoords, modifiedHoles);
    const blob = new Blob([dxf], {type: 'application/dxf'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tubesheet_${params.boardDiameter}mm.dxf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSTEP = async () => {
    setIsGeneratingStep(true);
    setGenerationStatus('Starting CAD worker...');

    try {
      const stepArrayBuffer = await generateStep({
        modifiedHoles,
        onProgress: (message) => {
          if (message.stage === 'init') {
            setGenerationStatus('Loading CAD kernel...');
            return;
          }
          if (message.stage === 'export') {
            setGenerationStatus('Exporting STEP...');
            return;
          }
          const percent = message.total > 0 ? Math.round((message.done / message.total) * 100) : 0;
          setGenerationStatus(`Cutting holes... ${percent}% (${message.done}/${message.total})`);
        },
      });

      const blob = new Blob([stepArrayBuffer], {type: 'application/step'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tubesheet_${params.boardDiameter}mm.step`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('STEP generation failed:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`STEP generation failed: ${msg}. Check console for details.`);
    } finally {
      setIsGeneratingStep(false);
      setGenerationStatus('');
    }
  };

  const toggleHoleState = (point: Point) => {
    const key = createPointKey(point);
    setModifiedHoles((prev) => {
      const next = new Map(prev);
      const current = next.get(key);

      if (!current) {
        next.set(key, {hidden: true});
        return next;
      }

      if (current.hidden) {
        next.set(key, {diameter: params.tubeDiameter * SPACER_SCALE});
        return next;
      }

      next.delete(key);
      return next;
    });
  };

  return (
    <div className="container margin-vert--lg">
      <div className="row">
        <div className="col col--4">
          <GeneratorForm params={params} onChange={handleChange} />

          <div className="card margin-top--md">
            <div className="card__body">
              <div className="alert alert--info margin-bottom--md">
                <strong>Holes count:</strong> {tubeCoords.length} ({effectiveCount})
              </div>

              <div className="button-group block">
                <button
                  onClick={handleDownloadDXF}
                  className="button button--secondary button--block margin-bottom--sm"
                >
                  Download .DXF (2D)
                </button>

                <button
                  onClick={handleDownloadSTEP}
                  disabled={isGeneratingStep}
                  className={`button button--primary button--block ${isGeneratingStep ? 'button--loading' : ''}`}
                >
                  {isGeneratingStep ? 'Generating 3D...' : 'Download .STEP (3D)'}
                </button>
              </div>

              {isGeneratingStep ? (
                <small className="display-block margin-top--sm text--center text--muted">
                  {generationStatus || 'Processing geometry in the browser...'}
                </small>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col col--8">
          <div
            className="card shadow--md"
            style={{
              height: '600px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
            }}
          >
            <PreviewCanvas
              points={tubeCoords}
              params={params}
              modifiedHoles={modifiedHoles}
              onToggleHole={toggleHoleState}
              style={{width: '100%', height: '100%', maxHeight: '580px'}}
            />
          </div>
          <div className="margin-top--md text--center">
            <p>Preview updates instantly. Download a STEP file to get the 3D model.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TubeSheetGenerator() {
  return (
    <BrowserOnly fallback={<div className="padding--md">Loading tube sheet generator...</div>}>
      {() => <TubeSheetGeneratorContent />}
    </BrowserOnly>
  );
}
