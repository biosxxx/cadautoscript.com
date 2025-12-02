import {useMemo, useState} from 'react';
import {CirclePreview} from './CirclePreview';
import {generateCircleDxf} from './generateCircleDxf';

const defaultSnippet = `// Update the diameter value and preview refreshes instantly
const diameter = 80; // millimeters
const innerDiameter = 40; // optional inner diameter
export default { diameter, innerDiameter };
`;

function extractValue(code: string, key: string): number {
  const match = code.match(new RegExp(`${key}\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)`, 'i'));
  if (!match) {
    return NaN;
  }
  return parseFloat(match[1]);
}

export function DxfCircleDemo(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [snippet, setSnippet] = useState(defaultSnippet);
  const [error, setError] = useState<string | null>(null);

  const diameter = useMemo(() => {
    const value = extractValue(snippet, 'diameter');
    if (!Number.isFinite(value)) {
      setError('Add or update `const diameter = <value>;` in the snippet.');
      return 80;
    }
    if (value <= 0) {
      setError('Diameter should be greater than zero.');
      return 80;
    }
    setError(null);
    return Math.min(value, 400);
  }, [snippet]);

  const innerDiameter = useMemo(() => {
    const raw = extractValue(snippet, 'innerDiameter');
    if (!Number.isFinite(raw)) {
      return 0;
    }
    return Math.max(0, Math.min(raw, diameter - 1));
  }, [snippet, diameter]);

  const dxfContent = useMemo(() => generateCircleDxf(diameter, innerDiameter), [diameter, innerDiameter]);

  const handleDownload = () => {
    const blob = new Blob([dxfContent], {type: 'application/dxf'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `demo-circle-${Math.round(diameter)}mm.dxf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{margin: '2rem 0'}}>
      <button
        type="button"
        className="button button--primary"
        onClick={() => setIsOpen(true)}
      >
        Simulate DXF Export
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="DXF circle generator"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: '#0b1220',
              borderRadius: 16,
              padding: '1.5rem',
              width: 'min(960px, 100%)',
              color: '#e2e8f0',
              boxShadow: '0 20px 60px rgba(15,23,42,0.6)',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', gap: '1rem'}}>
              <div style={{flex: 1}}>
                <h3 style={{marginTop: 0}}>Edit the generator snippet</h3>
                <p style={{marginBottom: '0.5rem', color: '#94a3b8', fontSize: 14}}>
                  Change the outer diameter or add <code>innerDiameter</code> to create washer-style rings.
                </p>
                <textarea
                  value={snippet}
                  onChange={(event) => setSnippet(event.target.value)}
                  style={{
                    width: '100%',
                    height: 220,
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.4)',
                    background: '#020617',
                    color: '#e2e8f0',
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    fontSize: 14,
                    padding: '1rem',
                    resize: 'vertical',
                  }}
                />
                {error && (
                  <p style={{color: '#f87171', fontSize: 13, marginTop: 8}}>{error}</p>
                )}
                <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleDownload()}
                  >
                    Download DXF
                  </button>
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => setSnippet(defaultSnippet)}
                  >
                    Reset snippet
                  </button>
                </div>
              </div>

              <div
                style={{
                  flexBasis: 320,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <CirclePreview diameter={diameter} innerDiameter={innerDiameter} />
                <p style={{fontSize: 14, color: '#94a3b8'}}>
                  Outer diameter: <strong>{diameter.toFixed(1)} mm</strong>
                </p>
                <p style={{fontSize: 14, color: '#94a3b8'}}>
                  {innerDiameter > 0 ? (
                    <>
                      Inner diameter: <strong>{innerDiameter.toFixed(1)} mm</strong>
                    </>
                  ) : (
                    'Inner diameter disabled'
                  )}
                </p>
              </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1rem'}}>
              <button type="button" className="button button--secondary" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
