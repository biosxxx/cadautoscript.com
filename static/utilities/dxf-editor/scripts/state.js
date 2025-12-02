export const state = {
  entities: [],
  selection: new Set(),
  tool: 'select',
  scale: 1,
  offset: {x: 0, y: 0},
  drag: {active: false, last: {x: 0, y: 0}},
  boxSelect: null,
  drawStart: null,
  tempEntity: null,
  snap: {threshold: 10, angle: 0},
};

export const dxfColors = {
  0: '#ffffff',
  1: '#ff0000',
  2: '#ffff00',
  3: '#00ff00',
  4: '#00ffff',
  5: '#0000ff',
  6: '#ff00ff',
  7: '#ffffff',
};

export function setTool(tool) {
  state.tool = tool;
  state.drawStart = null;
  state.tempEntity = null;
}

export function clearSelection() {
  state.selection.clear();
}

export function setBoxSelection(start, end) {
  state.boxSelect = start ? {start, end: end || start} : null;
}

export function updateSnapAngle(angle) {
  state.snap.angle = angle;
}
