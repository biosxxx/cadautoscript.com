import {getFastenerCatalogEntry, getFastenerEffectiveProps} from './data';
import {
  EDGE_CLEARANCE_MIN_MM,
  FASTENER_GAP_MIN_MM,
  getFastenerFeatureOD,
  getFastenerGeometry,
} from './bolting';
import type {CalculationInput} from './bfTypes';
import type {ManualCheckResult} from './manualCheckTypes';
import {sanitizePdfText} from './pdfText';
import {downloadBlob} from './download';

const toFixed = (value: number, digits = 2) => Number.parseFloat(value.toFixed(digits));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const fmt = {
  mm: (v: number, digits = 1) => `${toFixed(v, digits)} mm`,
  bar: (v: number, digits = 1) => `${toFixed(v, digits)} bar`,
  mm2: (v: number, digits = 0) => `${toFixed(v, digits)} mm^2`,
  n: (v: number, digits = 0) => `${toFixed(v, digits)} N`,
  kn: (v: number, digits = 1) => `${toFixed(v / 1000, digits)} kN`,
  nm: (v: number, digits = 0) => `${toFixed(v, digits)} N*m`,
  pct: (u: number, digits = 0) => `${toFixed(u * 100, digits)}%`,
};

export async function exportManualPdfReport(params: {
  input: CalculationInput;
  targetPN: number;
  manualCheck: ManualCheckResult;
}) {
  const {jsPDF} = await import('jspdf');
  const doc = new jsPDF();

  const {input, targetPN, manualCheck} = params;
  const manual = manualCheck.manualInput;
  const boltSummary = manualCheck.boltSummary;
  const gasketSummary = manualCheck.gasketSummary;
  const thicknessSummary = manualCheck.thicknessSummary;

  // -- Setup & Constants --
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const drawSectionHeader = (title: string, y: number) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(sanitizePdfText(title.toUpperCase()), margin + 2, y + 5);
    return y + 9;
  };

  const drawField = (label: string, value: string, x: number, y: number, width: number) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(sanitizePdfText(label), x, y);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitizePdfText(value), x + width, y, {align: 'right'});
  };

  const drawWrapped = (text: string, x: number, y: number, width: number, fontSize = 9) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const safeText = sanitizePdfText(text);
    const lines = doc.splitTextToSize(safeText, width) as string[];
    doc.text(lines, x, y);
    return y + lines.length * (fontSize * 0.35 + 1.5);
  };

  const drawBar = (label: string, utilization: number, x: number, y: number, width: number) => {
    const pct = clamp(utilization * 100, 0, 300);
    const fillWidth = clamp(utilization, 0, 1) * width;
    const color = pct < 90 ? [60, 179, 113] : pct < 110 ? [255, 193, 7] : [244, 67, 54];
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(sanitizePdfText(label), x, y + 4);
    doc.setDrawColor(60);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, y + 6, width, 5);
    doc.rect(x, y + 6, fillWidth, 5, 'F');
    doc.setTextColor(0);
    doc.text(sanitizePdfText(`${pct.toFixed(0)}%`), x + width, y + 4, {align: 'right'});
  };

  const dateStr = new Date().toLocaleDateString();

  // ---------------- Page 1: Summary ----------------
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(sanitizePdfText('BLIND FLANGE - MANUAL CHECK REPORT'), pageWidth / 2, cursorY + 5, {align: 'center'});
  cursorY += 15;

  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(sanitizePdfText(`Date: ${dateStr}`), margin, cursorY);
  doc.text(sanitizePdfText(`Reference: DN${input.dn} / PN${targetPN}`), pageWidth - margin, cursorY, {align: 'right'});
  cursorY += 8;

  cursorY = drawSectionHeader('Design inputs', cursorY);
  const gasketLabel = `${input.gasketFacing} / ${input.gasketMaterial} / ${input.gasketThickness} mm`;
  const pTestAuto = manualCheck.pressureTestAuto ?? 0;
  const pTestUsed = manualCheck.pressureTestUsed ?? input.pressureTest;
  const inputs = [
    ['Nominal size', `DN ${input.dn}`],
    ['Operating pressure (P_op)', fmt.bar(input.pressureOp)],
    ['Test pressure used (P_test)', fmt.bar(pTestUsed)],
    ['Test pressure auto', pTestAuto > 0 ? fmt.bar(pTestAuto) : 'n/a'],
    ['Temperature', `${input.temperature} C`],
    ['Material', input.material],
    ['Gasket', gasketLabel],
  ];
  inputs.forEach(([k, v], idx) => {
    drawField(k, v, margin + 2, cursorY + 4 + idx * 6, contentWidth - 4);
    doc.setDrawColor(230);
    doc.line(margin, cursorY + 6 + idx * 6, margin + contentWidth, cursorY + 6 + idx * 6);
  });
  cursorY += inputs.length * 6 + 6;

  cursorY = drawSectionHeader('Manual inputs', cursorY);
  const manualRows: Array<[string, string]> = [];
  if (manual) {
    const entry = getFastenerCatalogEntry(manual.fastenerGradeId);
    const boltDia = Number(manual.boltSize.replace('M', ''));
    const effective = getFastenerEffectiveProps(manual.fastenerGradeId, boltDia);
    const proofYield =
      effective.proof > 1 && effective.yield > 1 ? `${effective.proof}/${effective.yield} MPa` : 'n/a';
    manualRows.push(
      ['Bolt circle (k)', fmt.mm(manual.boltCircle)],
      ['Outer diameter (D)', fmt.mm(manual.outerDiameter)],
      ['Thickness (t, incl. CA)', fmt.mm(manual.thickness)],
      ['Corrosion allowance (CA)', fmt.mm(manual.corrosionAllowance ?? input.corrosionAllowance ?? 0, 1)],
      ['Bolt count (n)', `${manual.boltCount}`],
      ['Bolt size', manual.boltSize],
      ['Bolt hole diameter (d2)', fmt.mm(manual.boltHoleDiameter)],
      ['Fastener', `${manual.fastenerStandard} ${manual.fastenerType} - ${entry.label}`],
      ['Tightening condition', manual.frictionPreset],
      ['Torque method', manual.tighteningMethod ?? 'k_factor'],
      ['Proof/Yield', proofYield],
    );
  } else {
    manualRows.push(['Manual input', 'n/a']);
  }
  manualRows.forEach(([k, v], idx) => {
    drawField(k, v, margin + 2, cursorY + 4 + idx * 6, contentWidth - 4);
    doc.setDrawColor(230);
    doc.line(margin, cursorY + 6 + idx * 6, margin + contentWidth, cursorY + 6 + idx * 6);
  });
  cursorY += manualRows.length * 6 + 6;

  cursorY = drawSectionHeader('Status and key results', cursorY);
  const passLabel = manualCheck.pass ? 'PASS' : 'FAIL';
  const governingCase = manualCheck.governingCase ?? 'n/a';
  const governingCode = manualCheck.governingCode ?? 'n/a';
  const keyRows: Array<[string, string]> = [
    ['Overall result', passLabel],
    ['Governing case', governingCase],
    ['Governing code', governingCode],
  ];
  if (boltSummary) {
    keyRows.push(
      [
        'Bolt areas (A_prov / A_req seat/op/hydro)',
        `${fmt.mm2(boltSummary.areas.provided)} / ${fmt.mm2(boltSummary.areas.requiredAreaSeating)} / ${fmt.mm2(
          boltSummary.areas.requiredAreaOper,
        )} / ${fmt.mm2(boltSummary.areas.requiredAreaHydro)}`,
      ],
      ['Bolt check', boltSummary.pass ? 'PASS' : 'FAIL'],
    );
    if (boltSummary.torque) {
      const tMin = boltSummary.torque.torqueMinNm ?? boltSummary.torque.torqueNm;
      const tNom = boltSummary.torque.torqueNm;
      const tMax = boltSummary.torque.torqueMaxNm ?? boltSummary.torque.torqueNm;
      keyRows.push(
        ['Torque per bolt (min/nom/max)', `${fmt.nm(tMin)} / ${fmt.nm(tNom)} / ${fmt.nm(tMax)}`],
        ['Preload per bolt', fmt.kn(boltSummary.torque.preloadPerBoltN)],
        ['Proof cap applied', boltSummary.torque.cappedByProof ? 'YES' : 'NO'],
      );
    }
  }
  if (thicknessSummary) {
    keyRows.push(
      [
        'Thickness (required+CA / provided)',
        `${fmt.mm(thicknessSummary.requiredWithCA, 2)} / ${fmt.mm(thicknessSummary.provided, 2)}`,
      ],
      ['Thickness utilization', fmt.pct(thicknessSummary.utilization)],
      ['Thickness check', thicknessSummary.pass ? 'PASS' : 'FAIL'],
    );
  }
  if (gasketSummary) {
    keyRows.push(
      ['Gasket mean dia (G_eff)', fmt.mm(gasketSummary.gasketMeanDiameter, 1)],
      ['Gasket effective width (b_eff)', fmt.mm(gasketSummary.gasketWidth, 1)],
      ['Gasket ID / OD', `${gasketSummary.gasketId ?? 'n/a'} / ${gasketSummary.gasketOd ?? 'n/a'} mm`],
      ['Gasket loads (Wm1 / Wm2_op / Wm2_hydro)', `${fmt.n(gasketSummary.Wm1)} / ${fmt.n(
        gasketSummary.Wm2_op,
      )} / ${fmt.n(gasketSummary.Wm2_hydro)}`],
    );
  }
  keyRows.forEach(([k, v], idx) => {
    drawField(k, v, margin + 2, cursorY + 4 + idx * 6, contentWidth - 4);
    doc.setDrawColor(230);
    doc.line(margin, cursorY + 6 + idx * 6, margin + contentWidth, cursorY + 6 + idx * 6);
  });
  cursorY += keyRows.length * 6 + 4;

  if (manualCheck.errors.length > 0) {
    cursorY = drawSectionHeader('Issues', cursorY);
    const issuesText = manualCheck.errors.map((e) => `- ${e}`).join('\n');
    cursorY = drawWrapped(issuesText, margin + 2, cursorY + 2, contentWidth - 4, 8) + 2;
  }

  // ---------------- Page 2: Sketch ----------------
  doc.addPage();
  cursorY = margin;
  cursorY = drawSectionHeader('Sketch (not to scale)', cursorY);

  if (manual) {
    const dims = {
      D: manual.outerDiameter,
      k: manual.boltCircle,
      bolts: manual.boltCount,
      d2: manual.boltHoleDiameter,
      t: manual.thickness,
    };

    const plotPad = 15;
    const plotWidth = pageWidth - plotPad * 2;
    const plotHeight = pageHeight - plotPad * 2 - 25;

    const centerX = plotPad + plotWidth * 0.35;
    const centerY = plotPad + plotHeight / 2;

    const rOD = dims.D / 2;
    const rBolt = dims.k / 2;
    const rHole = dims.d2 / 2;
    const rGasket = (gasketSummary?.gasketMeanDiameter ?? dims.k * 0.9) / 2;
    const scale = Math.min((plotHeight - 40) / dims.D, (plotWidth * 0.6) / dims.D);

    const drawCircle = (x: number, y: number, r: number, dashed = false) => {
      if (dashed) doc.setLineDashPattern([2, 2], 0);
      doc.circle(x, y, r * scale, 'S');
      if (dashed) doc.setLineDashPattern([], 0);
    };

    // Front view
    drawCircle(centerX, centerY, rOD);
    drawCircle(centerX, centerY, rBolt, true);
    drawCircle(centerX, centerY, rGasket, true);
    for (let i = 0; i < dims.bolts; i++) {
      const a = (2 * Math.PI * i) / dims.bolts;
      const hx = centerX + rBolt * scale * Math.cos(a);
      const hy = centerY + rBolt * scale * Math.sin(a);
      doc.circle(hx, hy, rHole * scale, 'S');
    }

    // Labels
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitizePdfText('FRONT VIEW'), centerX, centerY + rOD * scale + 12, {align: 'center'});
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizePdfText(`D = ${fmt.mm(dims.D)}`), centerX, centerY + rOD * scale + 18, {align: 'center'});
    doc.text(sanitizePdfText(`k (BCD) = ${fmt.mm(dims.k)}`), centerX, centerY + rOD * scale + 23, {align: 'center'});
    doc.text(sanitizePdfText(`d2 = ${fmt.mm(dims.d2)}`), centerX, centerY + rOD * scale + 28, {align: 'center'});
    doc.text(sanitizePdfText(`G_eff = ${fmt.mm(rGasket * 2)}`), centerX, centerY + rOD * scale + 33, {align: 'center'});

    // Section (side view)
    const sideX = plotPad + plotWidth * 0.7;
    const tScaled = dims.t * scale;
    doc.rect(sideX, centerY - rOD * scale, tScaled, rOD * 2 * scale, 'S');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitizePdfText('SECTION'), sideX + tScaled / 2, centerY + rOD * scale + 12, {align: 'center'});
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizePdfText(`t = ${fmt.mm(dims.t)}`), sideX + tScaled / 2, centerY + rOD * scale + 18, {align: 'center'});
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizePdfText('No manual input available for sketch.'), margin + 2, cursorY + 10);
  }

  // ---------------- Page 3: Charts + Calculations ----------------
  doc.addPage();
  cursorY = margin;
  cursorY = drawSectionHeader('Charts and calculations', cursorY);

  // Charts
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(sanitizePdfText('Utilization charts (100% = limit)'), margin + 2, cursorY + 4);
  cursorY += 8;

  if (boltSummary) {
    drawBar('Bolts - seating', boltSummary.areas.utilizationSeating, margin + 2, cursorY, contentWidth - 4);
    drawBar('Bolts - operating', boltSummary.areas.utilizationOper, margin + 2, cursorY + 10, contentWidth - 4);
    drawBar('Bolts - hydrotest', boltSummary.areas.utilizationHydro, margin + 2, cursorY + 20, contentWidth - 4);
    cursorY += 32;
  } else {
    doc.setFontSize(9);
    doc.text(sanitizePdfText('Bolting utilization: n/a'), margin + 2, cursorY + 4);
    cursorY += 10;
  }

  if (thicknessSummary) {
    drawBar('Thickness - required+CA / provided', thicknessSummary.utilization, margin + 2, cursorY, contentWidth - 4);
    cursorY += 12;
  } else {
    doc.setFontSize(9);
    doc.text(sanitizePdfText('Thickness utilization: n/a'), margin + 2, cursorY + 4);
    cursorY += 10;
  }

  // Detailed calculations (tables)
  cursorY = drawSectionHeader('Detailed values', cursorY + 2);

  const colW = (contentWidth - 4) / 2;
  let leftY = cursorY + 2;
  let rightY = cursorY + 2;

  // Left column: pressures + gasket loads
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizePdfText('Pressures'), margin + 2, leftY);
  leftY += 5;
  doc.setFont('helvetica', 'normal');
  const pressureRows: Array<[string, string]> = [
    ['P_op', fmt.bar(input.pressureOp)],
    ['P_test_auto', manualCheck.pressureTestAuto ? fmt.bar(manualCheck.pressureTestAuto) : 'n/a'],
    ['P_test_used', manualCheck.pressureTestUsed ? fmt.bar(manualCheck.pressureTestUsed) : fmt.bar(input.pressureTest)],
    ['Basis', manualCheck.pressureTestBasis ?? 'n/a'],
    ['Stress ratio', manualCheck.pressureTestRatio ? toFixed(manualCheck.pressureTestRatio, 3).toString() : 'n/a'],
    ['Clamped to P_op', manualCheck.pressureTestClamped ? 'YES' : 'NO'],
  ];
  pressureRows.forEach(([k, v]) => {
    drawField(k, v, margin + 2, leftY, colW - 2);
    leftY += 6;
  });
  leftY += 2;

  doc.setFont('helvetica', 'bold');
  doc.text(sanitizePdfText('Gasket geometry & loads'), margin + 2, leftY);
  leftY += 5;
  doc.setFont('helvetica', 'normal');
  if (gasketSummary) {
    const gasketRows: Array<[string, string]> = [
      ['G_eff', fmt.mm(gasketSummary.gasketMeanDiameter, 1)],
      ['b_eff', fmt.mm(gasketSummary.gasketWidth, 1)],
      ['ID', gasketSummary.gasketId ? fmt.mm(gasketSummary.gasketId, 1) : 'n/a'],
      ['OD', gasketSummary.gasketOd ? fmt.mm(gasketSummary.gasketOd, 1) : 'n/a'],
      ['m / y', `${toFixed(gasketSummary.m, 2)} / ${toFixed(gasketSummary.y, 0)} MPa`],
      ['Wm1', fmt.n(gasketSummary.Wm1)],
      ['Wm2_op', fmt.n(gasketSummary.Wm2_op)],
      ['Wm2_hydro', fmt.n(gasketSummary.Wm2_hydro)],
    ];
    gasketRows.forEach(([k, v]) => {
      drawField(k, v, margin + 2, leftY, colW - 2);
      leftY += 6;
    });
  } else {
    leftY = drawWrapped('n/a', margin + 2, leftY, colW - 2, 9);
  }

  // Right column: geometry checks + bolting + thickness
  const rightX = margin + 2 + colW;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(sanitizePdfText('Geometry checks'), rightX, rightY);
  rightY += 5;
  doc.setFont('helvetica', 'normal');

  if (manual) {
    const feature = getFastenerFeatureOD(manual.fastenerStandard, manual.boltSize);
    const edgeNeed = manual.boltCircle / 2 + feature.featureOD / 2 + EDGE_CLEARANCE_MIN_MM;
    const edgeAvail = manual.outerDiameter / 2;
    const pitch = (Math.PI * manual.boltCircle) / Math.max(1, manual.boltCount);
    const pitchNeed = feature.featureOD + FASTENER_GAP_MIN_MM;

    const geoRows: Array<[string, string]> = [
      ['Feature OD', `${fmt.mm(feature.featureOD, 1)} (${feature.sourceLabel}${feature.approximated ? ', approx' : ''})`],
      [
        'Edge check',
        `${fmt.mm(edgeNeed, 1)} <= ${fmt.mm(edgeAvail, 1)} (${manualCheck.geometry.edgeOk ? 'PASS' : 'FAIL'})`,
      ],
      [
        'Spacing check',
        `${fmt.mm(pitch, 1)} >= ${fmt.mm(pitchNeed, 1)} (${manualCheck.geometry.spacingOk ? 'PASS' : 'FAIL'})`,
      ],
      ['Edge clearance min', fmt.mm(EDGE_CLEARANCE_MIN_MM, 1)],
      ['Gap min', fmt.mm(FASTENER_GAP_MIN_MM, 1)],
    ];
    geoRows.forEach(([k, v]) => {
      drawField(k, v, rightX, rightY, colW - 4);
      rightY += 6;
    });
  } else {
    rightY = drawWrapped('n/a', rightX, rightY, colW - 4, 9);
  }

  rightY += 2;
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizePdfText('Bolting checks'), rightX, rightY);
  rightY += 5;
  doc.setFont('helvetica', 'normal');
  if (manual && boltSummary) {
    const boltGeom = getFastenerGeometry(manual.boltSize, manual.fastenerStandard, manual.fastenerType);
    const entry = getFastenerCatalogEntry(manual.fastenerGradeId);
    const effective = getFastenerEffectiveProps(manual.fastenerGradeId, boltGeom.d);
    const torque = boltSummary.torque;
    const boltRows: Array<[string, string]> = [
      ['Fastener', `${manual.fastenerStandard} ${manual.fastenerType} - ${entry.label}`],
      ['Thread', `${manual.boltSize} (d=${toFixed(boltGeom.d, 1)} mm, As=${toFixed(boltGeom.As, 0)} mm^2)`],
      ['n bolts', `${manual.boltCount}`],
      ['A_provided', fmt.mm2(boltSummary.areas.provided)],
      ['A_req seating', fmt.mm2(boltSummary.areas.requiredAreaSeating)],
      ['A_req operating', fmt.mm2(boltSummary.areas.requiredAreaOper)],
      ['A_req hydrotest', fmt.mm2(boltSummary.areas.requiredAreaHydro)],
      [
        'Governing case',
        `${boltSummary.governingCase} (${boltSummary.pass ? 'PASS' : 'FAIL'})`,
      ],
      ['Proof/Yield', effective.proof > 1 ? `${effective.proof}/${effective.yield} MPa` : 'n/a'],
    ];
    boltRows.forEach(([k, v]) => {
      drawField(k, v, rightX, rightY, colW - 4);
      rightY += 6;
    });
    if (torque) {
      const tMin = torque.torqueMinNm ?? torque.torqueNm;
      const tNom = torque.torqueNm;
      const tMax = torque.torqueMaxNm ?? torque.torqueNm;
      const torqueRows: Array<[string, string]> = [
        ['Torque min/nom/max', `${fmt.nm(tMin)} / ${fmt.nm(tNom)} / ${fmt.nm(tMax)}`],
        ['Preload per bolt', fmt.kn(torque.preloadPerBoltN)],
        ['Utilization (proof)', fmt.pct(torque.preloadUtilization)],
        ['Capped by proof', torque.cappedByProof ? 'YES' : 'NO'],
        ['Case used', torque.governingCaseUsed],
      ];
      torqueRows.forEach(([k, v]) => {
        drawField(k, v, rightX, rightY, colW - 4);
        rightY += 6;
      });
    }
  } else {
    rightY = drawWrapped('n/a', rightX, rightY, colW - 4, 9);
  }

  rightY += 2;
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizePdfText('Thickness checks'), rightX, rightY);
  rightY += 5;
  doc.setFont('helvetica', 'normal');
  if (thicknessSummary) {
    const thRows: Array<[string, string]> = [
      ['ASME t_op', fmt.mm(thicknessSummary.requiredAsmeOp, 2)],
      ['ASME t_test', fmt.mm(thicknessSummary.requiredAsmeTest, 2)],
      ['EN t_op', fmt.mm(thicknessSummary.requiredEnOp, 2)],
      ['EN t_test', fmt.mm(thicknessSummary.requiredEnTest, 2)],
      ['Governing code', thicknessSummary.governingCode],
      ['Required + CA', fmt.mm(thicknessSummary.requiredWithCA, 2)],
      ['Provided', fmt.mm(thicknessSummary.provided, 2)],
      ['Utilization', fmt.pct(thicknessSummary.utilization)],
      ['Result', thicknessSummary.pass ? 'PASS' : 'FAIL'],
    ];
    thRows.forEach(([k, v]) => {
      drawField(k, v, rightX, rightY, colW - 4);
      rightY += 6;
    });
  } else {
    rightY = drawWrapped('n/a', rightX, rightY, colW - 4, 9);
  }

  const fileSuffix = input.dn ? `DN${input.dn}` : 'DN';
  const pdfBlob = doc.output('blob') as Blob;
  downloadBlob(pdfBlob, `blind-flange-manual-check-${fileSuffix}-PN${targetPN}.pdf`);
}
