export function generateCircleDxf(diameter: number, innerDiameter = 0): string {
  const safeDiameter = Number.isFinite(diameter) ? Math.max(1, Math.min(diameter, 1000)) : 1;
  const radius = (safeDiameter / 2).toFixed(3);
  const safeInnerDiameter = Math.min(innerDiameter, safeDiameter - 0.1);
  const innerRadius = safeInnerDiameter > 0 ? (safeInnerDiameter / 2).toFixed(3) : null;

  const base = [
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
  ];

  if (innerRadius) {
    base.push(
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
      innerRadius,
      '0',
    );
  }

  base.push(
    'ENDSEC',
    '0',
    'EOF',
  );

  return base.join('\n');
}
