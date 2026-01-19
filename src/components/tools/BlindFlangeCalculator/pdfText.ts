const REPLACEMENTS: Array<[RegExp, string]> = [
  [/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' '], // strip control chars except \t \n \r
  [/\u2013/g, '-'], // en dash
  [/\u2014/g, '-'], // em dash
  [/\u2022/g, '-'], // bullet
  [/\u03c0/g, 'pi'], // π
  [/\u2265/g, '>='], // ≥
  [/\u2264/g, '<='], // ≤
  [/\u00b7/g, '*'], // ·
  [/\u00d7/g, 'x'], // ×
  [/\u00b2/g, '^2'], // ²
  [/\u00b3/g, '^3'], // ³
  [/\u0394/g, 'd'], // Δ
];

export function sanitizePdfText(value: string): string {
  let next = value ?? '';
  for (const [pattern, replacement] of REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }
  // jsPDF default fonts are WinAnsi (8-bit). Replace any remaining > 255 code points.
  next = next.replace(/[^\x00-\xff]/g, '?');
  return next;
}

