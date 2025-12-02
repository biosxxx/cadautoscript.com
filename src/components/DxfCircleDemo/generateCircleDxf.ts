export function generateCircleDxf(diameter: number): string {
  const safeDiameter = Number.isFinite(diameter) ? Math.max(1, Math.min(diameter, 1000)) : 1;
  const radius = (safeDiameter / 2).toFixed(3);

  return [
    '0',
    'SECTION',
    '2',
    'HEADER',
    '9',
    '$INSUNITS',
    '70',
    '4', // millimeters
    '0',
    'ENDSEC',
    '0',
    'SECTION',
    '2',
    'ENTITIES',
    '0',
    'CIRCLE',
    '8',
    'Demo',
    '10',
    '0.0',
    '20',
    '0.0',
    '30',
    '0.0',
    '40',
    radius,
    '0',
    'ENDSEC',
    '0',
    'EOF',
  ].join('\n');
}
