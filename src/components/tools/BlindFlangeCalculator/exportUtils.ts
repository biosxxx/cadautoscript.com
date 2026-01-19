import {getFastenerCatalogEntry} from './data';
import type {CalculationInput, CalculationResult} from './bfTypes';
import type {CustomSizingDebug} from './custom';
import type {ManualCheckResult} from './manualCheckTypes';
import {exportManualPdfReport} from './manualPdfReport';
import {sanitizePdfText} from './pdfText';
import {downloadBlob} from './download';

const toFixed = (value: number, digits = 2) => Number.parseFloat(value.toFixed(digits));

export async function exportPdfReport(params: {
  input: CalculationInput;
  result?: CalculationResult | null;
  targetPN: number;
  debug?: CustomSizingDebug | null;
  manualCheck?: ManualCheckResult;
}) {
  const {input, result, targetPN, debug, manualCheck} = params;
  if (manualCheck) {
    await exportManualPdfReport({input, targetPN, manualCheck});
    return;
  }
  if (!result) return;

  const {jsPDF} = await import('jspdf');
  const doc = new jsPDF();
  
  // -- Setup & Constants --
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // -- Helper: Draw Section Header --
  const drawSectionHeader = (title: string, y: number) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(sanitizePdfText(title.toUpperCase()), margin + 2, y + 5);
    return y + 9; // return next Y
  };

  // -- Helper: Draw Field --
  const drawField = (label: string, value: string, x: number, y: number, width: number) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(sanitizePdfText(label), x, y);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    // Right align value within the column
    doc.text(sanitizePdfText(value), x + width, y, {align: 'right'});
  };

  const drawBar = (label: string, utilization: number, x: number, y: number, width: number) => {
    const pct = Math.max(0, Math.min(utilization * 100, 300));
    const barWidth = Math.min(Math.max(utilization, 0), 1) * width;
    const color =
      pct < 90 ? [60, 179, 113] : pct < 110 ? [255, 193, 7] : [244, 67, 54];
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(sanitizePdfText(label), x, y + 4);
    doc.setDrawColor(60);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, y + 6, width, 5);
    doc.rect(x, y + 6, barWidth, 5, 'F');
    doc.setTextColor(0);
    doc.text(sanitizePdfText(`${pct.toFixed(0)}%`), x + width, y + 4, {align: 'right'});
  };

  // -- 1. Header --
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizePdfText('BLIND FLANGE CALCULATION REPORT'), pageWidth / 2, cursorY + 5, {align: 'center'});
  cursorY += 15;

  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 5;

  // General Info row
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString();
  doc.text(sanitizePdfText(`Date: ${dateStr}`), margin, cursorY);
  doc.text(sanitizePdfText(`Reference: DN${input.dn} / PN${targetPN}`), pageWidth - margin, cursorY, {align: 'right'});
  cursorY += 8;

  if (!result && manualCheck) {
    cursorY = drawSectionHeader('Design Inputs', cursorY);
    const fastenerInputLabel = input.fastenerGradeId
      ? getFastenerCatalogEntry(input.fastenerGradeId).label
      : input.boltGrade ?? 'n/a';
    const inputs = [
      ['Nominal Size (DN)', `DN ${input.dn}`],
      ['Design Pressure', `${input.pressureOp} bar`],
      ['Test Pressure', `${input.pressureTest} bar`],
      ['Temperature', `${input.temperature} C`],
      ['Material', input.material],
      ['Gasket', `${input.gasketFacing} / ${input.gasketMaterial} / ${input.gasketThickness} mm`],
      ['Fastener', fastenerInputLabel],
    ];
    inputs.forEach(([k, v], idx) => {
      drawField(k, v, margin + 2, cursorY + 4 + idx * 6, contentWidth - 4);
      doc.setDrawColor(230);
      doc.line(margin, cursorY + 6 + idx * 6, margin + contentWidth, cursorY + 6 + idx * 6);
    });
    cursorY += inputs.length * 6 + 8;

    cursorY = drawSectionHeader('Manual check', cursorY);
    const m = manualCheck.manualInput;
    const boltSummary = manualCheck.boltSummary;
    const thicknessSummary = manualCheck.thicknessSummary;
    const gasketSummary = manualCheck.gasketSummary;
    const manualRows = [
      ['Pass/Fail', manualCheck.pass ? 'PASS' : 'FAIL'],
      ['Bolt circle / OD', m ? `${m.boltCircle} / ${m.outerDiameter} mm` : 'n/a'],
      ['Bolts', m ? `${m.boltCount} × ${m.boltSize}` : 'n/a'],
      [
        'Fastener',
        boltSummary?.fastenerLabel
          ? `${boltSummary.fastenerLabel}${boltSummary.fastenerIsPlaceholder ? ' (placeholder)' : ''}`
          : 'n/a',
      ],
      [
        'Bolt areas',
        boltSummary
          ? `A_req seat/op/hydro ${boltSummary.areas.requiredAreaSeating.toFixed(0)}/${boltSummary.areas.requiredAreaOper.toFixed(0)}/${boltSummary.areas.requiredAreaHydro.toFixed(0)} mm² · A_prov ${boltSummary.areas.provided.toFixed(0)}`
          : 'n/a',
      ],
      [
        'Torque',
        boltSummary?.torque
          ? `${boltSummary.torque.torqueMinNm?.toFixed(0) ?? boltSummary.torque.torqueNm.toFixed(0)}-${boltSummary.torque.torqueMaxNm?.toFixed(0) ?? boltSummary.torque.torqueNm.toFixed(0)} N·m (${boltSummary.torque.governingCaseUsed})`
          : 'n/a',
      ],
      [
        'Thickness utilization',
        thicknessSummary
          ? `${(thicknessSummary.utilization * 100).toFixed(0)}% (req+CA ${thicknessSummary.requiredWithCA.toFixed(
              2,
            )} / provided ${thicknessSummary.provided.toFixed(2)} mm)`
          : 'n/a',
      ],
      [
        'Gasket loads',
        gasketSummary
          ? `G_eff ${gasketSummary.gasketMeanDiameter.toFixed(1)} mm · Wm1/Wm2 ${gasketSummary.Wm1.toFixed(0)}/${gasketSummary.Wm2_op.toFixed(0)}/${gasketSummary.Wm2_hydro.toFixed(0)} N`
          : 'n/a',
      ],
    ];
    manualRows.forEach(([k, v], idx) => {
      drawField(k, v, margin + 2, cursorY + 4 + idx * 6, contentWidth - 4);
      doc.setDrawColor(230);
      doc.line(margin, cursorY + 6 + idx * 6, margin + contentWidth, cursorY + 6 + idx * 6);
    });
    cursorY += manualRows.length * 6 + 10;

    // Page 2: Sketch
    doc.addPage();
    cursorY = margin;
    const dims =
      m && m.boltCircle && m.outerDiameter
        ? {D: m.outerDiameter, k: m.boltCircle, bolts: m.boltCount, size: m.boltSize, d2: m.boltHoleDiameter}
        : null;
    if (dims) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const plotPad = 15;
      const plotWidth = pageWidth - plotPad * 2;
      const plotHeight = pageHeight - plotPad * 2 - 25;
      const centerX = plotPad + plotWidth * 0.35;
      const centerY = plotPad + plotHeight / 2;
      const od = dims.D;
      const rOD = od / 2;
      const rBolt = dims.k / 2;
      const rHole = dims.d2 / 2;
      const gasketDia = gasketSummary?.gasketMeanDiameter ?? rBolt * 1.1;
      const scale = Math.min((plotHeight - 40) / od, (plotWidth * 0.6) / od);
      const drawCircle = (x: number, y: number, r: number, dashed = false) => {
        if (dashed) doc.setLineDashPattern([2, 2], 0);
        doc.circle(x, y, r * scale, 'S');
        if (dashed) doc.setLineDashPattern([], 0);
      };
      // Front view
      drawCircle(centerX, centerY, rOD);
      drawCircle(centerX, centerY, rBolt, true);
      drawCircle(centerX, centerY, gasketDia / 2, true);
      for (let i = 0; i < dims.bolts; i++) {
        const a = (2 * Math.PI * i) / dims.bolts;
        const hx = centerX + (rBolt * scale) * Math.cos(a);
        const hy = centerY + (rBolt * scale) * Math.sin(a);
        doc.circle(hx, hy, rHole * scale, 'S');
      }
      // Side view
      const sideX = plotPad + plotWidth * 0.7;
      const t = (m?.thickness ?? 0) * scale;
      doc.rect(sideX, centerY - rOD * scale, t, rOD * 2 * scale, 'S');
      doc.text(sanitizePdfText('FRONT VIEW'), centerX, centerY + rOD * scale + 12, {align: 'center'});
      doc.text(sanitizePdfText('SECTION'), sideX + t / 2, centerY + rOD * scale + 12, {align: 'center'});
    }

    // Page 3: Charts
    doc.addPage();
    cursorY = margin;
    cursorY = drawSectionHeader('Utilization charts', cursorY);
    if (boltSummary) {
      drawBar('Bolts seating', boltSummary.areas.utilizationSeating, margin + 2, cursorY + 4, contentWidth - 4);
      drawBar('Bolts operating', boltSummary.areas.utilizationOper, margin + 2, cursorY + 14, contentWidth - 4);
      drawBar('Bolts hydro', boltSummary.areas.utilizationHydro, margin + 2, cursorY + 24, contentWidth - 4);
      cursorY += 34;
    }
    if (thicknessSummary) {
      drawBar(
        'Thickness ASME op',
        thicknessSummary.requiredAsmeOp / Math.max(thicknessSummary.provided, 1),
        margin + 2,
        cursorY + 4,
        contentWidth - 4,
      );
      drawBar(
        'Thickness ASME hydro',
        thicknessSummary.requiredAsmeTest / Math.max(thicknessSummary.provided, 1),
        margin + 2,
        cursorY + 14,
        contentWidth - 4,
      );
      drawBar(
        'Thickness EN op',
        thicknessSummary.requiredEnOp / Math.max(thicknessSummary.provided, 1),
        margin + 2,
        cursorY + 24,
        contentWidth - 4,
      );
      drawBar(
        'Thickness EN hydro',
        thicknessSummary.requiredEnTest / Math.max(thicknessSummary.provided, 1),
        margin + 2,
        cursorY + 34,
        contentWidth - 4,
      );
      drawBar('Thickness combined', thicknessSummary.utilization, margin + 2, cursorY + 44, contentWidth - 4);
    }

    const pdfBlob = doc.output('blob') as Blob;
    downloadBlob(pdfBlob, `blind-flange-manual-DN${input.dn}-PN${targetPN}.pdf`);
    return;
  }

  // -- 2. Data Tables (Inputs & Results) --
  if (!result) return;
  // Layout: Inputs on Left, Results on Right
  const colGap = 10;
  const colWidth = (contentWidth - colGap) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + colGap;
  
  const startTableY = cursorY;
  
  // Left Column: Inputs
  let leftY = startTableY;
  leftY = drawSectionHeader('Design Inputs', leftY);
  
  const fastenerInputLabel = input.fastenerGradeId
    ? getFastenerCatalogEntry(input.fastenerGradeId).label
    : input.boltGrade ?? 'n/a';

  const inputData = [
    ['Sizing Method', result.source === 'en1092' ? 'EN 1092-1' : 'Custom'],
    ['Nominal Size (DN)', `DN ${input.dn}`],
    ['Target PN', `PN ${targetPN}`],
    ['Design Pressure', `${input.pressureOp} bar`],
    ['Test Pressure', `${input.pressureTest} bar`],
    ['Temperature', `${input.temperature} C`],
    ['Material', input.material],
    ['Corrosion Allow.', `${input.corrosionAllowance} mm`],
    ['Gasket Facing', input.gasketFacing],
    ['Gasket Material', input.gasketMaterial],
    ['Gasket Thickness', `${input.gasketThickness} mm`],
    ['Fastener Standard', input.fastenerStandard ?? 'EN'],
    ['Fastener Type', input.fastenerType ?? 'BOLT'],
    ['Fastener Grade', fastenerInputLabel],
  ];

  inputData.forEach(([k, v]) => {
    drawField(k, v, leftColX + 2, leftY + 4, colWidth - 4);
    doc.setDrawColor(230);
    doc.line(leftColX, leftY + 6, leftColX + colWidth, leftY + 6);
    leftY += 7;
  });

  // Right Column: Results
  let rightY = startTableY;
  rightY = drawSectionHeader('Calculation Results', rightY);

    const gasketId = result.gasketId ?? null;
  const gasketOd = result.gasketOd ?? null;
  const gasketIdOdValue =
    gasketId !== null && gasketOd !== null
      ? `${toFixed(gasketId, 1)} / ${toFixed(gasketOd, 1)} mm`
      : '- / - (G_eff only)';

  const boltCircleNote =
    debug?.boltCircleClamped && debug?.boltCircleMinStandard
      ? ` (k clamped to EN1092 max-PN baseline: ${toFixed(debug.boltCircleMinStandard, 0)} mm)`
      : '';

  const pTestAuto = debug?.pressureTestAuto ?? result.pressureTestAuto ?? null;
  const pTestBasis = debug?.pressureTestBasis ?? result.pressureTestBasis ?? null;
  const pTestRatio = debug?.pressureTestRatio ?? result.pressureTestRatio ?? null;
  const pTestClamped = debug?.pressureTestClamped ?? result.pressureTestClamped ?? null;
  const pTestUsed = result.pressureTestUsed ?? input.pressureTest;

const resultData = [
    ['Selected PN', `PN ${result.selectedPN}`],
    ['Flange OD (D)', `${result.dims.D} mm`],
    ['Bolt Circle (K)', `${result.dims.k} mm${boltCircleNote}`],
    ['Bolting', `${result.dims.bolts} x ${result.dims.size}`],
    [
      'Fastener',
      result.boltingSummary
        ? `${result.boltingSummary.fastenerStandard} / ${result.boltingSummary.fastenerType} / ${result.boltingSummary.fastenerLabel ?? result.boltingSummary.fastenerGradeId}${
            result.boltingSummary.fastenerIsPlaceholder ? ' (placeholder)' : ''
          }`
        : 'n/a',
    ],
    [
      'Proof / Yield',
      result.boltingSummary?.fastenerIsPlaceholder
        ? 'n/a'
        : result.boltingSummary?.proofStressMPa
          ? `${toFixed(result.boltingSummary.proofStressMPa, 0)} / ${toFixed(result.boltingSummary.yieldStressMPa ?? 0, 0)} MPa`
          : 'n/a',
    ],
    ['Hole Diameter (d2)', `${result.dims.d2} mm`],
    ['Gasket Mean Dia', `${toFixed(result.gasketMeanDiameter, 1)} mm`],
    ['Gasket ID / OD', gasketIdOdValue],
    ['Req. Thickness', `${toFixed(result.finalThickness, 2)} mm`],
    ['Final Thickness (b)', `${result.recommendedThickness} mm`],
    ['Est. Weight', `${toFixed(result.weight, 1)} kg`],
    ['P test used', `${toFixed(pTestUsed, 1)} bar`],
    ['P test auto', pTestAuto !== null ? `${toFixed(pTestAuto, 1)} bar` : 'n/a'],
    ['P test basis', pTestBasis ?? 'n/a'],
    ['P test ratio', pTestRatio !== null ? `${toFixed(pTestRatio, 3)}` : 'n/a'],
    ['P test clamped', pTestClamped === null ? 'n/a' : pTestClamped ? 'Yes' : 'No'],
  ];

  resultData.forEach(([k, v]) => {
    drawField(k, v, rightColX + 2, rightY + 4, colWidth - 4);
    doc.setDrawColor(230);
    doc.line(rightColX, rightY + 6, rightColX + colWidth, rightY + 6);
    rightY += 7;
  });

  cursorY = Math.max(leftY, rightY) + 5;

  // Notes / Checks
  const bolting = debug?.boltTorque
    ? {
        torque: debug.boltTorque,
        requiredAreaSeating: debug.requiredAreaSeating,
        requiredAreaOper: debug.requiredAreaOper,
        requiredAreaHydro: debug.requiredAreaHydro,
        provided: debug.providedBoltArea,
        governingCase: debug.governingCase,
      }
    : result.boltingSummary
      ? {
          torque: result.boltingSummary.boltTorque,
          requiredAreaSeating: result.boltingSummary.areas.requiredAreaSeating,
          requiredAreaOper: result.boltingSummary.areas.requiredAreaOper,
          requiredAreaHydro: result.boltingSummary.areas.requiredAreaHydro,
          provided: result.boltingSummary.areas.provided,
          governingCase: result.boltingSummary.governingCase,
        }
      : null;

  if (debug) {
    cursorY = drawSectionHeader('Stress Analysis & Checks', cursorY);
    const checks = [
        `Flange Stress (Op): ${toFixed(result.allowableStressOp, 1)} MPa`,
        `Flange Stress (Test): ${toFixed(result.allowableStressTest, 1)} MPa`,
        `Min Thickness (No Corr): ${toFixed(result.minThickness, 2)} mm`,
        `Bolt Allowable Stress: ${toFixed(debug.boltAllowableStress, 1)} MPa`,
        `Bolt Area (Prov/Req): ${toFixed(debug.providedBoltArea, 0)} / ${toFixed(debug.requiredBoltArea, 0)} mm²`,
        `Code governs: ${debug.governingCode}`,
        `Bolt case governs: ${debug.governingCase}`,
    ];
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    checks.forEach((note, i) => {
        const x = margin + 2 + (i % 2) * (colWidth + colGap);
        const y = cursorY + 4 + Math.floor(i / 2) * 5;
        doc.text(sanitizePdfText(`- ${note}`), x, y);
    });
    cursorY += Math.ceil(checks.length / 2) * 5 + 8;
  } else {
    // Simpler notes if no debug
    cursorY = drawSectionHeader('Design Checks', cursorY);
    doc.setFontSize(8);
    doc.text(
      sanitizePdfText(
        `- Allowable Stress Op/Test: ${toFixed(result.allowableStressOp, 1)} / ${toFixed(result.allowableStressTest, 1)} MPa`,
      ),
      margin + 2,
      cursorY + 4,
    );
    doc.text(
      sanitizePdfText(`- Min Thickness (uncorroded): ${toFixed(result.minThickness, 2)} mm`),
      margin + 2 + colWidth,
      cursorY + 4,
    );
    cursorY += 10;
  }

  if (debug || bolting) {
    const reqSeat = bolting?.requiredAreaSeating ?? debug?.requiredAreaSeating ?? 0;
    const reqOper = bolting?.requiredAreaOper ?? debug?.requiredAreaOper ?? 0;
    const reqHydro = bolting?.requiredAreaHydro ?? debug?.requiredAreaHydro ?? 0;
    const provided = bolting?.provided ?? debug?.providedBoltArea ?? 0;
    const failFlag = provided < Math.max(reqSeat, reqOper, reqHydro);
    cursorY = drawSectionHeader('Bolting Checks', cursorY);
    const rows = [
      ['A_req seating', `${toFixed(reqSeat, 0)} mm²`],
      ['A_req operating', `${toFixed(reqOper, 0)} mm²`],
      ['A_req hydro', `${toFixed(reqHydro, 0)} mm²`],
      ['A_provided', `${toFixed(provided, 0)} mm²`],
      ['Governing case', `${bolting?.governingCase ?? debug?.governingCase ?? 'n/a'}${failFlag ? ' (FAIL)' : ''}`],
      (bolting?.torque ?? debug?.boltTorque)
        ? [
            'Torque (min/nom/max)',
            `${toFixed(
              (bolting?.torque?.torqueMinNm ?? bolting?.torque?.torqueNm ?? debug?.boltTorque?.torqueMinNm ?? debug?.boltTorque?.torqueNm) ?? 0,
              0,
            )} / ${toFixed(bolting?.torque?.torqueNm ?? debug?.boltTorque?.torqueNm ?? 0, 0)} / ${toFixed(
              (bolting?.torque?.torqueMaxNm ?? bolting?.torque?.torqueNm ?? debug?.boltTorque?.torqueMaxNm ?? debug?.boltTorque?.torqueNm) ?? 0,
              0,
            )} N·m`,
          ]
        : null,
      (bolting?.torque ?? debug?.boltTorque)
        ? [
            'Preload / Util.',
            `${toFixed(
              (bolting?.torque?.preloadPerBoltN ?? debug?.boltTorque?.preloadPerBoltN ?? 0) / 1000,
              2,
            )} kN · ${toFixed(
              ((bolting?.torque?.preloadUtilization ?? debug?.boltTorque?.preloadUtilization) ?? 0) * 100,
              0,
            )}%${(bolting?.torque?.cappedByProof ?? debug?.boltTorque?.cappedByProof) ? ' (capped)' : ''}`,
          ]
        : null,
    ];
    let rowIdx = 0;
    rows.forEach((row) => {
      if (!row) return;
      const [k, v] = row;
      drawField(k, v, margin + 2, cursorY + 4 + rowIdx * 6, contentWidth - 4);
      doc.setDrawColor(230);
      doc.line(margin, cursorY + 6 + rowIdx * 6, margin + contentWidth, cursorY + 6 + rowIdx * 6);
      rowIdx += 1;
    });
    cursorY += rowIdx * 6 + 6;
  }

  // -- 3. Professional Drawing Sheet --
  const footerHeight = 15;
  const availableH = pageHeight - cursorY - footerHeight - 10;
  
  // If not enough space, add page. Usually 80-100mm is good for a small drawing, but for professional view we want more.
  // If availableH is < 35% of page, move to next page.
  if (availableH < pageHeight * 0.35) {
    doc.addPage();
    cursorY = margin;
  }

  const drawBoxY = cursorY;
  const drawBoxH = pageHeight - cursorY - footerHeight; // Use remaining space
  
  // Draw outer border for drawing area
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, drawBoxY, contentWidth, drawBoxH);

  // Title Block (Bottom Right of Drawing)
  const tbHeight = 22;
  const tbWidth = 80;
  const tbX = pageWidth - margin - tbWidth;
  const tbY = drawBoxY + drawBoxH - tbHeight;
  
  doc.setLineWidth(0.3);
  doc.line(margin, tbY, pageWidth - margin, tbY); // Top line of title block
  doc.line(tbX, tbY, tbX, drawBoxY + drawBoxH);   // Vertical separator

  // Title Block Content
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text(sanitizePdfText('TITLE'), margin + 2, tbY + 3);
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizePdfText(`BLIND FLANGE TYPE 05 - DN${input.dn}`), margin + 2, tbY + 12);
  doc.setFontSize(9);
  doc.text(sanitizePdfText(`PN${targetPN} / ${input.material}`), margin + 2, tbY + 18);

  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text(sanitizePdfText('SCALE'), tbX + 2, tbY + 3);
  doc.text(sanitizePdfText('UNIT'), tbX + 40, tbY + 3);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText('NTS'), tbX + 2, tbY + 8); // Not To Scale physically on paper, but proportionally correct
  doc.text(sanitizePdfText('mm'), tbX + 40, tbY + 8);
  
  doc.text(sanitizePdfText('DRW. DATE'), tbX + 2, tbY + 14);
  doc.text(sanitizePdfText(dateStr), tbX + 2, tbY + 19);

  // --- DYNAMIC SCALING LOGIC ---
  const plotW = contentWidth;
  const plotH = drawBoxH - tbHeight;
  const centerX = margin + plotW * 0.35; // Front view center (35% from left)
  const centerY = drawBoxY + plotH / 2;
  
  const realOD = result.dims.D;
  const realThick = result.recommendedThickness;
  
  // We need to fit:
  // Height: OD + margins
  // Width: OD (Front) + Gap + Thickness (Side) + margins
  
  // Safety margins inside the drawing box
  const pad = 15; 
  const availablePlotH = plotH - pad * 2;
  // Estimate width usage: FrontView (OD) + Gap (OD*0.2) + SideView (Thick)
  const estimatedPlotW_Needed = realOD * 1.5; 
  
  const scaleH = availablePlotH / realOD;
  const scaleW = (plotW - pad * 2) / estimatedPlotW_Needed;
  const scale = Math.min(scaleH, scaleW); // Apply correct scale

  // Scaled dimensions
  const rOD = (realOD / 2) * scale;
  const rBolt = (result.dims.k / 2) * scale;
  const rHole = (result.dims.d2 / 2) * scale;
  const rGasket = (result.gasketDiameter ? result.gasketDiameter / 2 : rBolt * 0.85) * scale;
  const sThick = Math.max(realThick * scale, 3); // Minimal visual thickness 3px

  const sideViewX = centerX + rOD + 25; // Gap between views

  // --- DRAWING RENDER ---
  
  // 1. Front View (Left)
  // Center Lines
  doc.setDrawColor(150);
  doc.setLineDashPattern([4, 2], 0);
  doc.line(centerX, centerY - rOD - 5, centerX, centerY + rOD + 5); // Vert
  doc.line(centerX - rOD - 5, centerY, centerX + rOD + 5, centerY); // Horz
  doc.setLineDashPattern([], 0);

  // Main Circles
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.circle(centerX, centerY, rOD, 'S'); // OD
  
  // Bolt Circle (Centerline style)
  doc.setDrawColor(100);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([3, 2], 0);
  doc.circle(centerX, centerY, rBolt, 'S');
  doc.setLineDashPattern([], 0);
  
  // Gasket Surface
  doc.setDrawColor(80);
  doc.setLineDashPattern([1, 1], 0);
  doc.circle(centerX, centerY, rGasket, 'S');
  doc.setLineDashPattern([], 0);

  // Bolt Holes
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  for (let i = 0; i < result.dims.bolts; i++) {
    const angle = (2 * Math.PI * i) / result.dims.bolts;
    const hx = centerX + rBolt * Math.cos(angle);
    const hy = centerY + rBolt * Math.sin(angle);
    doc.circle(hx, hy, rHole, 'S'); // Just outline for holes
    // Small crosshair in hole
    doc.setDrawColor(150);
    doc.line(hx - rHole, hy, hx + rHole, hy);
    doc.line(hx, hy - rHole, hx, hy + rHole);
  }

  // 2. Side View (Right)
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.setFillColor(245, 245, 245); // Solid fill
  doc.rect(sideViewX, centerY - rOD, sThick, rOD * 2, 'FD');
  
  // Section lines (Hatching simulation - just a few diagonal lines)
  doc.setDrawColor(200);
  doc.setLineWidth(0.1);
  const hatchStep = 4;
  for (let h = -rOD; h < rOD; h += hatchStep * 2) {
      // Simple clipping is hard in basic jsPDF, so we just draw lines inside rect visually
      // For professional look without clipping, solid grey fill (done above) is cleaner standard for generated reports
  }

  // Center line through thickness
  doc.setDrawColor(150);
  doc.setLineDashPattern([4, 2], 0);
  doc.line(sideViewX - 5, centerY, sideViewX + sThick + 5, centerY);
  doc.setLineDashPattern([], 0);


  // --- DIMENSIONS ---
  doc.setFontSize(8);
  doc.setTextColor(0);

  const drawDimLine = (x1: number, y1: number, x2: number, y2: number, text: string, offsetText = -2) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    doc.line(x1, y1, x2, y2);
    // Arrows
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = 2.5;
    doc.line(x1, y1, x1 + head * Math.cos(angle + 0.5), y1 + head * Math.sin(angle + 0.5));
    doc.line(x1, y1, x1 + head * Math.cos(angle - 0.5), y1 + head * Math.sin(angle - 0.5));
    doc.line(x2, y2, x2 - head * Math.cos(angle + 0.5), y2 - head * Math.sin(angle + 0.5));
    doc.line(x2, y2, x2 - head * Math.cos(angle - 0.5), y2 - head * Math.sin(angle - 0.5));
    
    // Text
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    // Check if vertical or horizontal
    if (Math.abs(x2 - x1) < 1) {
        // Vertical
        doc.text(sanitizePdfText(text), mx - 2, my, {angle: 90, align: 'center'});
    } else {
        doc.text(sanitizePdfText(text), mx, my + offsetText, {align: 'center'});
    }
  };

  // Dim: OD
  const dimY_OD = centerY - rOD - 8;
  doc.setDrawColor(180);
  doc.line(centerX, centerY - rOD, centerX, dimY_OD); // extension
  doc.line(sideViewX + sThick, centerY - rOD, sideViewX + sThick, dimY_OD); // extension from side view top
  
  // We dimension OD on the Front View usually
  drawDimLine(centerX - rOD, dimY_OD, centerX + rOD, dimY_OD, `ØD ${result.dims.D}`);
  
  // Dim: Bolt Circle
  // Draw diagonal leader
  const leadAngle = -Math.PI / 4;
  const lx1 = centerX + rBolt * Math.cos(leadAngle);
  const ly1 = centerY + rBolt * Math.sin(leadAngle);
  const lx2 = centerX + rOD + 10;
  const ly2 = ly1 - 10;
  doc.setDrawColor(0);
  doc.line(lx1, ly1, lx2, ly2);
  doc.line(lx2, ly2, lx2 + 2, ly2);
  doc.text(sanitizePdfText(`K = ${result.dims.k}`), lx2 + 2, ly2 + 1);

  // Dim: Thickness
  drawDimLine(sideViewX, centerY + rOD + 10, sideViewX + sThick, centerY + rOD + 10, `b=${result.recommendedThickness}`, -2);
  doc.setDrawColor(180);
  doc.line(sideViewX, centerY + rOD, sideViewX, centerY + rOD + 12);
  doc.line(sideViewX + sThick, centerY + rOD, sideViewX + sThick, centerY + rOD + 12);

  // View Labels
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizePdfText('FRONT VIEW'), centerX, centerY + rOD + 20, {align: 'center'});
  doc.text(sanitizePdfText('SECTION A-A'), sideViewX + sThick/2, centerY + rOD + 20, {align: 'center'});

    const pdfBlob = doc.output('blob') as Blob;
    downloadBlob(pdfBlob, `blind-flange-report-DN${input.dn}-PN${targetPN}.pdf`);
}

export function buildDxf(result: CalculationResult): string {
  const outerRadius = result.dims.D / 2;
  const boltCircleRadius = result.dims.k / 2;
  const holeRadius = result.dims.d2 / 2;

  const header = `0
SECTION
2
HEADER
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  const circle = (x: number, y: number, r: number, layer = 'FLANGE') => `0
CIRCLE
8
${layer}
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
0
40
${r.toFixed(3)}
`;

  let body = '';
  body += circle(0, 0, outerRadius, 'OUTER');
  body += circle(0, 0, boltCircleRadius - 10, 'GASKET');

  for (let i = 0; i < result.dims.bolts; i++) {
    const angle = (2 * Math.PI * i) / result.dims.bolts;
    const x = boltCircleRadius * Math.cos(angle);
    const y = boltCircleRadius * Math.sin(angle);
    body += circle(x, y, holeRadius, 'BOLT');
  }

  const footer = `0
ENDSEC
0
EOF
`;

  return header + body + footer;
}

export function buildDxfFromManual(manualCheck: ManualCheckResult): string | null {
  const manual = manualCheck.manualInput;
  if (!manual) return null;

  const outerRadius = manual.outerDiameter / 2;
  const boltCircleRadius = manual.boltCircle / 2;
  const holeRadius = manual.boltHoleDiameter / 2;
  if (!outerRadius || !boltCircleRadius || !holeRadius) return null;

  const gasketMean = manualCheck.gasketSummary?.gasketMeanDiameter ?? 0;
  const gasketRadius = gasketMean > 0 ? gasketMean / 2 : Math.max(boltCircleRadius - 10, 0);

  const header = `0
SECTION
2
HEADER
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  const circle = (x: number, y: number, r: number, layer = 'FLANGE') => `0
CIRCLE
8
${layer}
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
0
40
${r.toFixed(3)}
`;

  let body = '';
  body += circle(0, 0, outerRadius, 'OUTER');
  if (gasketRadius > 0) {
    body += circle(0, 0, gasketRadius, 'GASKET');
  }

  for (let i = 0; i < manual.boltCount; i++) {
    const angle = (2 * Math.PI * i) / manual.boltCount;
    const x = boltCircleRadius * Math.cos(angle);
    const y = boltCircleRadius * Math.sin(angle);
    body += circle(x, y, holeRadius, 'BOLT');
  }

  const footer = `0
ENDSEC
0
EOF
`;

  return header + body + footer;
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], {type: 'application/octet-stream'});
  downloadBlob(blob, filename);
}

