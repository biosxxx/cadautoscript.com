import type {
  BoltGrade,
  En1092Database,
  FastenerCatalogEntry,
  FastenerGradeId,
  FastenerStandard,
  FastenerType,
  MaterialCatalog,
} from './bfTypes';

export const MATERIALS: MaterialCatalog = {
  // --- EN 10028-2: Нелегированные и легированные стали для высоких температур ---
  P265GH: {
    name: 'P265GH (1.0425) - Carbon Steel',
    yieldByTemp: {20: 265, 100: 243, 150: 228, 200: 215, 250: 204, 300: 194, 350: 184, 400: 173},
    density: 7.85,
  },
  P355GH: {
    name: 'P355GH (1.0473) - Carbon Steel High Press',
    yieldByTemp: {20: 355, 100: 329, 150: 312, 200: 298, 250: 285, 300: 271, 350: 258, 400: 247},
    density: 7.85,
  },
  '16Mo3': {
    name: '16Mo3 (1.5415) - Heat Resistant',
    yieldByTemp: {20: 275, 100: 261, 150: 253, 200: 233, 250: 216, 300: 200, 350: 186, 400: 170, 450: 158, 500: 145},
    density: 7.85,
  },
  '13CrMo4-5': {
    name: '13CrMo4-5 (1.7335) - Heat Resistant',
    yieldByTemp: {20: 300, 100: 273, 150: 264, 200: 255, 250: 245, 300: 233, 350: 218, 400: 204, 450: 192, 500: 181},
    density: 7.85,
  },

  // --- EN 10028-7: Нержавеющие стали (Food, Chemical, Pharma) ---
  '1.4301': { // 304
    name: '1.4301 (304) - Standard Food Grade',
    yieldByTemp: {20: 210, 100: 175, 150: 155, 200: 145, 250: 135, 300: 127, 350: 120, 400: 115},
    density: 7.9,
  },
  '1.4307': { // 304L
    name: '1.4307 (304L) - Low Carbon Food Grade',
    yieldByTemp: {20: 200, 100: 147, 150: 132, 200: 118, 250: 108, 300: 100, 350: 94, 400: 90},
    density: 7.9,
  },
  '1.4404': { // 316L
    name: '1.4404 (316L) - Marine/Chemical',
    yieldByTemp: {20: 220, 100: 166, 150: 152, 200: 137, 250: 127, 300: 118, 350: 113, 400: 108},
    density: 7.98,
  },
  '1.4571': { // 316Ti
    name: '1.4571 (316Ti) - Chemical Stabilized',
    yieldByTemp: {20: 220, 100: 198, 150: 188, 200: 178, 250: 169, 300: 161, 350: 155, 400: 149, 450: 144, 500: 139},
    density: 8.0,
  },
  '1.4541': { // 321
    name: '1.4541 (321) - Heat/Corrosion Stabilized',
    yieldByTemp: {20: 200, 100: 179, 150: 168, 200: 159, 250: 150, 300: 141, 350: 134, 400: 128, 450: 124, 500: 119},
    density: 7.9,
  },

  // --- Duplex & Special Alloys (Pulp & Paper, Desalination, Aggressive Chemical) ---
  '1.4462': { // Duplex 2205
    name: '1.4462 (Duplex 2205) - High Strength/Corrosion',
    yieldByTemp: {20: 460, 100: 360, 150: 335, 200: 315, 250: 300}, // Limit usually 250-280C for Duplex
    density: 7.8,
  },
  '1.4539': { // 904L
    name: '1.4539 (904L) - Sulfuric Acid Service',
    yieldByTemp: {20: 220, 100: 185, 150: 170, 200: 160, 250: 150, 300: 145, 350: 140, 400: 135},
    density: 8.0,
  },
  '1.4547': { // 254 SMO
    name: '1.4547 (254 SMO) - Pulp/Bleaching/Seawater',
    yieldByTemp: {20: 300, 100: 240, 150: 220, 200: 205, 250: 195, 300: 185, 350: 175, 400: 170},
    density: 8.0,
  },

  // --- ASME Materials (American Standards) ---
  'SA516-70': {
    name: 'ASME SA-516 Gr.70 - PVQ Carbon Steel',
    yieldByTemp: {20: 260, 40: 260, 65: 247, 100: 236, 150: 225, 200: 214, 250: 205, 300: 197, 350: 188, 400: 178},
    density: 7.85,
  },
  'SA240-304L': {
    name: 'ASME SA-240 304L - Stainless',
    yieldByTemp: {20: 170, 40: 167, 65: 154, 100: 143, 150: 132, 200: 123, 250: 117, 300: 112, 350: 108, 400: 105},
    density: 7.9,
  },
  'SA240-316L': {
    name: 'ASME SA-240 316L - Stainless',
    yieldByTemp: {20: 170, 40: 168, 65: 158, 100: 147, 150: 135, 200: 126, 250: 120, 300: 115, 350: 112, 400: 108},
    density: 7.98,
  },
};

export const DEFAULT_FASTENER_ID: FastenerGradeId = 'EN_8.8';

export const LEGACY_BOLT_GRADE_MAP: Record<BoltGrade, FastenerGradeId> = {
  '8.8': 'EN_8.8',
  '10.9': 'EN_10.9',
  'A2-70': 'EN_A2-70',
};

export const FASTENER_CATALOG: FastenerCatalogEntry[] = [
  {
    id: 'EN_5.6',
    label: '5.6 (carbon steel)',
    standard: 'EN',
    type: 'BOLT',
    proofStressMPa: 280,
    yieldStressMPa: 300,
    allowableOp: 280 / 1.5, // ~187
    allowableTest: 280 / 1.1, // ~254
    notes: 'ISO 898-1 class 5.6: Rm 500, ReL 300, Sp 280. Allowables derived as Sp/1.5 op, Sp/1.1 test.',
    source: 'ISO 898-1',
  },
  {
    id: 'EN_8.8',
    label: '8.8 (carbon steel)',
    standard: 'EN',
    type: 'BOLT',
    proofStressMPa: 580,
    yieldStressMPa: 640,
    allowableOp: 387,
    allowableTest: 527,
    source: 'Existing dataset',
  },
  {
    id: 'EN_10.9',
    label: '10.9 (high-strength)',
    standard: 'EN',
    type: 'BOLT',
    proofStressMPa: 830,
    yieldStressMPa: 940,
    allowableOp: 553,
    allowableTest: 755,
    source: 'Existing dataset',
  },
  {
    id: 'EN_A2-70',
    label: 'A2-70 (stainless)',
    standard: 'EN',
    type: 'BOLT',
    proofStressMPa: 450,
    yieldStressMPa: 450,
    allowableOp: 300,
    allowableTest: 409,
    source: 'Existing dataset',
  },
  {
    id: 'EN_A4-70',
    label: 'A4-70 (stainless)',
    standard: 'EN',
    type: 'BOLT',
    proofStressMPa: 450,
    yieldStressMPa: 450,
    allowableOp: 450 / 1.5, // 300
    allowableTest: 450 / 1.1, // 409
    notes: 'ISO 3506-1 A4-70: Rm 700, Rp0.2 450 (used as proof).',
    source: 'ISO 3506-1',
  },
  {
    id: 'EN_42CrMo4',
    label: '42CrMo4 (+QT, diameter-dependent)',
    standard: 'EN',
    type: 'BOLT',
    // Fallback uses the lowest (largest diameter) range. See FASTENER_SIZE_TABLE for overrides.
    proofStressMPa: 495,
    yieldStressMPa: 550,
    allowableOp: 495 / 1.5,
    allowableTest: 495 / 1.1,
    notes:
      'Assumes 42CrMo4 in Q+T condition. Properties depend on diameter; table used when bolt diameter is known.',
    source: 'User-provided Q+T minima (diameter-dependent)',
  },
  {
    id: 'EN_25CrMo4',
    label: '25CrMo4 (material-based)',
    standard: 'EN',
    type: 'BOLT',
    proofStressMPa: 1,
    yieldStressMPa: 1,
    allowableOp: 1,
    allowableTest: 1,
    notes: 'Material only. Define property class or provide proof/yield.',
    source: 'TODO',
    isPlaceholder: true,
  },
  {
    id: 'ASME_SA193_B8_CL1',
    label: 'SA193 Gr.B8 Cl1',
    standard: 'ASME',
    type: 'STUD',
    proofStressMPa: 207, // using yield as proof per provided minima
    yieldStressMPa: 207,
    allowableOp: 207 / 1.5, // ~138
    allowableTest: 207 / 1.1, // ~188
    notes: 'ASME SA193 B8 Class 1: Tensile 517 MPa, Yield 207 MPa.',
    source: 'ASME SA193',
  },
  {
    id: 'ASME_SA193_B8_CL2',
    label: 'SA193 Gr.B8 Cl2',
    standard: 'ASME',
    type: 'STUD',
    proofStressMPa: 345, // default fallback (largest diameter range)
    yieldStressMPa: 345,
    allowableOp: 345 / 1.5,
    allowableTest: 345 / 1.1,
    notes: 'ASME SA193 B8 Class 2: size-dependent yield. Fallback uses largest diameter range; see size table.',
    source: 'ASME SA193',
  },
];

export const FASTENER_CATALOG_BY_ID: Record<string, FastenerCatalogEntry> = FASTENER_CATALOG.reduce(
  (acc, entry) => {
    acc[entry.id] = entry;
    return acc;
  },
  {} as Record<string, FastenerCatalogEntry>,
);

export const getFastenerCatalogEntry = (id: FastenerGradeId | undefined): FastenerCatalogEntry => {
  if (!id) return FASTENER_CATALOG_BY_ID[DEFAULT_FASTENER_ID];
  return FASTENER_CATALOG_BY_ID[id] ?? FASTENER_CATALOG_BY_ID[DEFAULT_FASTENER_ID];
};

export const isFastenerPlaceholder = (entry: FastenerCatalogEntry): boolean => {
  if (entry.isPlaceholder) return true;
  const proofMissing = !entry.proofStressMPa || entry.proofStressMPa <= 1;
  const yieldMissing = !entry.yieldStressMPa || entry.yieldStressMPa <= 1;
  const allowableMissing = !entry.allowableOp || entry.allowableOp <= 1 || !entry.allowableTest || entry.allowableTest <= 1;
  return proofMissing || yieldMissing || allowableMissing;
};

type SizeDependentProps = {maxDiaMm: number; proof: number; yield: number};

const FASTENER_SIZE_TABLE: Record<string, SizeDependentProps[]> = {
  ASME_SA193_B8_CL2: [
    {maxDiaMm: 19.05, proof: 690, yield: 690}, // <= 3/4"
    {maxDiaMm: 25.4, proof: 552, yield: 552}, // 7/8"–1"
    {maxDiaMm: 31.75, proof: 448, yield: 448}, // 1-1/8"–1-1/4"
    {maxDiaMm: 38.1, proof: 345, yield: 345}, // 1-3/8"–1-1/2"
  ],
  EN_42CrMo4: [
    {maxDiaMm: 40, proof: 675, yield: 750}, // < 40 mm: Rp0.2 750, proof ~0.9*Rp0.2
    {maxDiaMm: 95, proof: 585, yield: 650}, // 40–95 mm: Rp0.2 650
    {maxDiaMm: 1e9, proof: 495, yield: 550}, // > 95 mm: Rp0.2 550
  ],
};

export const getFastenerEffectiveProps = (
  gradeId: FastenerGradeId,
  boltDiameterMm?: number,
): {proof: number; yield: number; allowableOp: number; allowableTest: number; notes?: string; isPlaceholder?: boolean} => {
  const entry = getFastenerCatalogEntry(gradeId);
  const sizeTable = FASTENER_SIZE_TABLE[gradeId];
  if (sizeTable && boltDiameterMm && boltDiameterMm > 0) {
    const match = sizeTable.find((row) => boltDiameterMm <= row.maxDiaMm) ?? sizeTable.at(-1);
    if (match) {
      return {
        proof: match.proof,
        yield: match.yield,
        allowableOp: match.proof / 1.5,
        allowableTest: match.proof / 1.1,
        notes: entry.notes,
        isPlaceholder: false,
      };
    }
  }

  const proof = entry.proofStressMPa;
  const yld = entry.yieldStressMPa;
  const allowableOp =
    entry.allowableOp && entry.allowableOp > 1 ? entry.allowableOp : proof > 0 ? proof / 1.5 : entry.allowableOp;
  const allowableTest =
    entry.allowableTest && entry.allowableTest > 1 ? entry.allowableTest : proof > 0 ? proof / 1.1 : entry.allowableTest;

  return {
    proof,
    yield: yld,
    allowableOp,
    allowableTest,
    notes: entry.notes,
    isPlaceholder: isFastenerPlaceholder(entry),
  };
};

export const getFastenerOptions = (standard: FastenerStandard): FastenerCatalogEntry[] =>
  FASTENER_CATALOG.filter((entry) => entry.standard === standard);

export const getFastenerOptionsFor = (
  standard: FastenerStandard,
  type?: FastenerType,
): FastenerCatalogEntry[] => {
  const options = getFastenerOptions(standard);
  if (!type) return options;
  const filtered = options.filter((entry) => entry.type === type);
  return filtered.length > 0 ? filtered : options;
};

export const getFastenerLabel = (id: FastenerGradeId | undefined): string =>
  getFastenerCatalogEntry(id).label;

export const resolveFastenerSelection = (input: {
  fastenerStandard?: FastenerStandard;
  fastenerType?: FastenerType;
  fastenerGradeId?: FastenerGradeId;
  boltGrade?: BoltGrade;
}) => {
  const legacyId = input.boltGrade ? LEGACY_BOLT_GRADE_MAP[input.boltGrade] : undefined;
  const gradeId = input.fastenerGradeId ?? legacyId ?? DEFAULT_FASTENER_ID;
  const entry = getFastenerCatalogEntry(gradeId);
  const standard = input.fastenerStandard ?? entry.standard ?? 'EN';
  const type = input.fastenerType ?? entry.type ?? 'BOLT';
  return {standard, type, gradeId, entry};
};

/**
 * EN 1092-1 Flange Dimensions
 * D: Outer diameter (mm)
 * k: Bolt circle diameter (mm)
 * bolts: Number of bolts
 * size: Thread size
 * d2: Bolt hole diameter (mm) - typically Thread + 2mm (<=M24), +3mm (>M24), +4mm (>M48)
 */
export const EN1092_DB: En1092Database = {
  15: {
    16: {D: 95, k: 65, bolts: 4, size: 'M12', d2: 14},
    40: {D: 95, k: 65, bolts: 4, size: 'M12', d2: 14},
    63: {D: 105, k: 75, bolts: 4, size: 'M12', d2: 14},
    100: {D: 105, k: 75, bolts: 4, size: 'M12', d2: 14},
    160: {D: 105, k: 75, bolts: 4, size: 'M12', d2: 14},
    250: {D: 130, k: 90, bolts: 4, size: 'M16', d2: 18},
    320: {D: 130, k: 90, bolts: 4, size: 'M16', d2: 18},
    400: {D: 145, k: 100, bolts: 4, size: 'M20', d2: 22},
  },
  20: {
    16: {D: 105, k: 75, bolts: 4, size: 'M12', d2: 14},
    40: {D: 105, k: 75, bolts: 4, size: 'M12', d2: 14},
    63: {D: 130, k: 90, bolts: 4, size: 'M16', d2: 18},
    100: {D: 130, k: 90, bolts: 4, size: 'M16', d2: 18},
    160: {D: 130, k: 90, bolts: 4, size: 'M16', d2: 18},
    250: {D: 150, k: 105, bolts: 4, size: 'M20', d2: 22},
    320: {D: 150, k: 105, bolts: 4, size: 'M20', d2: 22},
    400: {D: 170, k: 125, bolts: 4, size: 'M24', d2: 26},
  },
  25: {
    16: {D: 115, k: 85, bolts: 4, size: 'M12', d2: 14},
    40: {D: 115, k: 85, bolts: 4, size: 'M12', d2: 14},
    63: {D: 140, k: 100, bolts: 4, size: 'M16', d2: 18},
    100: {D: 140, k: 100, bolts: 4, size: 'M16', d2: 18},
    160: {D: 140, k: 100, bolts: 4, size: 'M16', d2: 18},
    250: {D: 150, k: 105, bolts: 4, size: 'M20', d2: 22},
    320: {D: 160, k: 115, bolts: 4, size: 'M20', d2: 22},
    400: {D: 180, k: 130, bolts: 4, size: 'M24', d2: 26},
  },
  32: {
    16: {D: 140, k: 100, bolts: 4, size: 'M16', d2: 18},
    40: {D: 140, k: 100, bolts: 4, size: 'M16', d2: 18},
    63: {D: 155, k: 110, bolts: 4, size: 'M20', d2: 22},
    100: {D: 155, k: 110, bolts: 4, size: 'M20', d2: 22},
    160: {D: 155, k: 110, bolts: 4, size: 'M20', d2: 22},
    250: {D: 170, k: 120, bolts: 4, size: 'M24', d2: 26},
    320: {D: 180, k: 130, bolts: 4, size: 'M24', d2: 26},
    400: {D: 195, k: 145, bolts: 4, size: 'M27', d2: 30},
  },
  50: {
    16: {D: 165, k: 125, bolts: 4, size: 'M16', d2: 18},
    40: {D: 165, k: 125, bolts: 4, size: 'M16', d2: 18},
    63: {D: 180, k: 135, bolts: 4, size: 'M20', d2: 22},
    100: {D: 195, k: 145, bolts: 4, size: 'M24', d2: 26},
    160: {D: 195, k: 145, bolts: 4, size: 'M24', d2: 26},
    250: {D: 200, k: 150, bolts: 8, size: 'M24', d2: 26},
    320: {D: 210, k: 160, bolts: 8, size: 'M24', d2: 26},
    400: {D: 235, k: 180, bolts: 8, size: 'M27', d2: 30},
  },
  65: {
    16: {D: 185, k: 145, bolts: 4, size: 'M16', d2: 18}, // Often 8 bolts in some specs, EN1092 PN16 is 4, PN40 is 8
    40: {D: 185, k: 145, bolts: 8, size: 'M16', d2: 18},
    63: {D: 205, k: 160, bolts: 8, size: 'M20', d2: 22},
    100: {D: 220, k: 170, bolts: 8, size: 'M24', d2: 26},
    160: {D: 220, k: 170, bolts: 8, size: 'M24', d2: 26},
    250: {D: 230, k: 180, bolts: 8, size: 'M27', d2: 30},
    320: {D: 245, k: 190, bolts: 8, size: 'M30', d2: 33},
    400: {D: 270, k: 210, bolts: 8, size: 'M33', d2: 36},
  },
  80: {
    16: {D: 200, k: 160, bolts: 8, size: 'M16', d2: 18},
    40: {D: 200, k: 160, bolts: 8, size: 'M16', d2: 18},
    63: {D: 215, k: 170, bolts: 8, size: 'M20', d2: 22},
    100: {D: 230, k: 180, bolts: 8, size: 'M24', d2: 26},
    160: {D: 230, k: 180, bolts: 8, size: 'M24', d2: 26},
    250: {D: 255, k: 200, bolts: 8, size: 'M27', d2: 30},
    320: {D: 275, k: 220, bolts: 8, size: 'M27', d2: 30},
    400: {D: 305, k: 240, bolts: 8, size: 'M30', d2: 33},
  },
  100: {
    16: {D: 220, k: 180, bolts: 8, size: 'M16', d2: 18},
    40: {D: 235, k: 190, bolts: 8, size: 'M20', d2: 22},
    63: {D: 250, k: 200, bolts: 8, size: 'M24', d2: 26},
    100: {D: 265, k: 210, bolts: 8, size: 'M27', d2: 30},
    160: {D: 265, k: 210, bolts: 8, size: 'M27', d2: 30},
    250: {D: 300, k: 235, bolts: 8, size: 'M30', d2: 33},
    320: {D: 335, k: 265, bolts: 8, size: 'M33', d2: 36},
    400: {D: 370, k: 295, bolts: 8, size: 'M36', d2: 39},
  },
  125: {
    16: {D: 250, k: 210, bolts: 8, size: 'M16', d2: 18},
    40: {D: 270, k: 220, bolts: 8, size: 'M24', d2: 26},
    63: {D: 295, k: 240, bolts: 8, size: 'M27', d2: 30},
    100: {D: 315, k: 250, bolts: 8, size: 'M30', d2: 33},
    160: {D: 315, k: 250, bolts: 8, size: 'M30', d2: 33},
    250: {D: 345, k: 275, bolts: 12, size: 'M33', d2: 36},
    320: {D: 375, k: 300, bolts: 12, size: 'M33', d2: 36},
    400: {D: 415, k: 340, bolts: 12, size: 'M36', d2: 39},
  },
  150: {
    16: {D: 285, k: 240, bolts: 8, size: 'M20', d2: 22},
    40: {D: 300, k: 250, bolts: 8, size: 'M24', d2: 26},
    63: {D: 345, k: 280, bolts: 8, size: 'M30', d2: 33},
    100: {D: 355, k: 290, bolts: 12, size: 'M30', d2: 33},
    160: {D: 355, k: 290, bolts: 12, size: 'M30', d2: 33},
    250: {D: 390, k: 320, bolts: 12, size: 'M33', d2: 36},
    320: {D: 425, k: 350, bolts: 12, size: 'M36', d2: 39},
    400: {D: 475, k: 390, bolts: 12, size: 'M39', d2: 42},
  },
  200: {
    10: {D: 340, k: 295, bolts: 8, size: 'M20', d2: 22},
    16: {D: 340, k: 295, bolts: 12, size: 'M20', d2: 22},
    25: {D: 360, k: 310, bolts: 12, size: 'M24', d2: 26},
    40: {D: 375, k: 320, bolts: 12, size: 'M30', d2: 33},
    63: {D: 415, k: 345, bolts: 12, size: 'M36', d2: 39},
    100: {D: 430, k: 360, bolts: 12, size: 'M36', d2: 39},
    160: {D: 430, k: 360, bolts: 12, size: 'M36', d2: 39},
    250: {D: 485, k: 400, bolts: 12, size: 'M42', d2: 45}, // Standard update: M42 for PN250
    320: {D: 525, k: 440, bolts: 16, size: 'M48', d2: 52},
    400: {D: 585, k: 490, bolts: 16, size: 'M52', d2: 56},
  },
  250: {
    10: {D: 395, k: 350, bolts: 12, size: 'M20', d2: 22},
    16: {D: 405, k: 355, bolts: 12, size: 'M24', d2: 26},
    25: {D: 425, k: 370, bolts: 12, size: 'M27', d2: 30},
    40: {D: 450, k: 385, bolts: 12, size: 'M33', d2: 36},
    63: {D: 470, k: 400, bolts: 12, size: 'M36', d2: 39},
    100: {D: 505, k: 430, bolts: 12, size: 'M39', d2: 42},
    160: {D: 515, k: 430, bolts: 12, size: 'M42', d2: 45},
  },
  300: {
    10: {D: 445, k: 400, bolts: 12, size: 'M20', d2: 22},
    16: {D: 460, k: 410, bolts: 12, size: 'M24', d2: 26},
    25: {D: 485, k: 430, bolts: 16, size: 'M27', d2: 30},
    40: {D: 515, k: 450, bolts: 16, size: 'M33', d2: 36},
    63: {D: 530, k: 460, bolts: 16, size: 'M36', d2: 39},
    100: {D: 585, k: 500, bolts: 16, size: 'M42', d2: 45},
    160: {D: 585, k: 500, bolts: 16, size: 'M42', d2: 45},
  },
  400: {
    10: {D: 565, k: 515, bolts: 16, size: 'M24', d2: 26},
    16: {D: 580, k: 525, bolts: 16, size: 'M27', d2: 30},
    25: {D: 620, k: 550, bolts: 16, size: 'M36', d2: 39},
    40: {D: 660, k: 585, bolts: 16, size: 'M39', d2: 42},
    63: {D: 670, k: 585, bolts: 16, size: 'M45', d2: 48},
    100: {D: 715, k: 610, bolts: 16, size: 'M48', d2: 52},
  },
  500: {
    10: {D: 670, k: 620, bolts: 20, size: 'M24', d2: 26},
    16: {D: 715, k: 650, bolts: 20, size: 'M30', d2: 33},
    25: {D: 730, k: 660, bolts: 20, size: 'M36', d2: 39},
    40: {D: 755, k: 670, bolts: 20, size: 'M45', d2: 48},
    63: {D: 800, k: 705, bolts: 20, size: 'M48', d2: 52},
    100: {D: 870, k: 760, bolts: 20, size: 'M52', d2: 56},
  },
  600: {
    10: {D: 780, k: 725, bolts: 20, size: 'M27', d2: 30},
    16: {D: 840, k: 770, bolts: 20, size: 'M33', d2: 36},
    25: {D: 845, k: 770, bolts: 20, size: 'M36', d2: 39},
    40: {D: 890, k: 795, bolts: 20, size: 'M48', d2: 52},
    63: {D: 930, k: 820, bolts: 20, size: 'M52', d2: 56},
    100: {D: 990, k: 875, bolts: 24, size: 'M56', d2: 62},
  },
  700: {
    10: {D: 895, k: 840, bolts: 24, size: 'M27', d2: 30},
    16: {D: 910, k: 840, bolts: 24, size: 'M33', d2: 36},
    25: {D: 960, k: 875, bolts: 24, size: 'M42', d2: 45},
    40: {D: 995, k: 900, bolts: 24, size: 'M48', d2: 52},
  },
  800: {
    10: {D: 1015, k: 950, bolts: 24, size: 'M30', d2: 33},
    16: {D: 1025, k: 950, bolts: 24, size: 'M36', d2: 39},
    25: {D: 1085, k: 990, bolts: 24, size: 'M48', d2: 52},
    40: {D: 1140, k: 1030, bolts: 24, size: 'M52', d2: 56},
  },
  900: {
    10: {D: 1115, k: 1050, bolts: 28, size: 'M30', d2: 33},
    16: {D: 1125, k: 1050, bolts: 28, size: 'M36', d2: 39},
    25: {D: 1185, k: 1090, bolts: 28, size: 'M48', d2: 52},
    40: {D: 1250, k: 1140, bolts: 28, size: 'M52', d2: 56},
  },
  1000: {
    10: {D: 1230, k: 1160, bolts: 28, size: 'M33', d2: 36},
    16: {D: 1255, k: 1170, bolts: 28, size: 'M39', d2: 42},
    25: {D: 1320, k: 1210, bolts: 28, size: 'M52', d2: 56},
    40: {D: 1360, k: 1250, bolts: 28, size: 'M56', d2: 62},
  },
  1200: {
    10: {D: 1455, k: 1380, bolts: 32, size: 'M36', d2: 39},
    16: {D: 1485, k: 1390, bolts: 32, size: 'M45', d2: 48},
    25: {D: 1530, k: 1420, bolts: 32, size: 'M52', d2: 56},
    40: {D: 1575, k: 1460, bolts: 32, size: 'M64', d2: 70},
  },
};

export const getMinStandardBoltCircle = (dn: number): number | null => {
  const rows = EN1092_DB[dn];
  if (!rows) return null;
  const pn400 = rows[400];
  if (pn400?.k) return pn400.k;
  const maxK = Object.values(rows).reduce((max, dims) => (dims.k > max ? dims.k : max), 0);
  return maxK > 0 ? maxK : null;
};

export const AVAILABLE_DNS = Object.keys(EN1092_DB)
  .map((dn) => Number(dn))
  .sort((a, b) => a - b);

export const STANDARD_THICKNESSES = [
  6, 8, 10, 12, 14, 15, 16, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120, 130,
  140, 150,
];

export const GASKET_OPTIONS = {
  materials: {
    graphite: {label: 'Graphite', m: 3.0, y: 40},
    tesnitBA50: {label: 'Tesnit BA-50', m: 2.5, y: 35},
    ptfe: {label: 'PTFE', m: 3.5, y: 50},
  },
  thicknesses: [2, 3],
  facings: [
    {value: 'RF', label: 'Raised face (RF)'},
    {value: 'FF', label: 'Flat face (FF)'},
    {value: 'IBC', label: 'Integral bore contact (IBC)'},
  ],
} as const;
