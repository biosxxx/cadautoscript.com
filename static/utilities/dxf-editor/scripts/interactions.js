import {state, clearSelection, setTool, setBoxSelection, updateSnapAngle} from './state.js';

export function createInteractions(deps) {
  const {
    canvas,
    container,
    renderer,
    geometry,
    coordsEl,
    statusEl,
    toolbarEl,
    angleSnapEl,
    colorPicker,
    deleteBtn,
  } = deps;

  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    renderer.render();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const zoomIntensity = 0.1;
    const direction = event.deltaY < 0 ? 1 : -1;
    const zoom = Math.exp(direction * zoomIntensity);
    const world = geometry.screenToWorld(event.offsetX, event.offsetY);

    state.scale *= zoom;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    state.offset.x = event.offsetX - world.x * state.scale - cx;
    state.offset.y = event.offsetY + world.y * state.scale - cy;
    renderer.render();
  });

  canvas.addEventListener('mousedown', (event) => {
    const world = geometry.screenToWorld(event.offsetX, event.offsetY);
    const snap = getSnapPoint(world);
    const start = snap || world;

    if (event.button === 2) {
      state.drag.active = true;
      state.drag.last = {x: event.offsetX, y: event.offsetY};
      return;
    }

    if (event.button !== 0) return;

    if (state.tool === 'select') {
      const hit = getEntityAt(world);
      if (hit !== -1) {
        clearSelection();
        state.selection.add(hit);
        renderer.render();
        updateStatus();
      } else {
        clearSelection();
        setBoxSelection({x: event.offsetX, y: event.offsetY});
      }
      return;
    }

    if (state.tool === 'trim') {
      performTrim(world);
      renderer.render();
      return;
    }

    if (['line', 'rect', 'circle', 'measure'].includes(state.tool)) {
      state.drawStart = start;
    }
  });

  canvas.addEventListener('mousemove', (event) => {
    const world = geometry.screenToWorld(event.offsetX, event.offsetY);
    coordsEl.textContent = `X: ${world.x.toFixed(2)} Y: ${world.y.toFixed(2)}`;

    if (state.drag.active) {
      state.offset.x += event.offsetX - state.drag.last.x;
      state.offset.y += event.offsetY - state.drag.last.y;
      state.drag.last = {x: event.offsetX, y: event.offsetY};
      renderer.render();
      return;
    }

    if (state.boxSelect) {
      setBoxSelection(state.boxSelect.start, {x: event.offsetX, y: event.offsetY});
      renderer.render();
      return;
    }

    if (!state.drawStart) return;
    const snap = getSnapPoint(world);
    let end = snap || world;
    if (!snap && ['line', 'rect', 'measure'].includes(state.tool)) {
      const snapped = geometry.applyAngleSnap(state.drawStart, end);
      end = snapped.pos;
    }

    if (state.tool === 'line') {
      state.tempEntity = {type: 'LINE', start: state.drawStart, end};
    } else if (state.tool === 'circle') {
      state.tempEntity = {type: 'CIRCLE', center: state.drawStart, radius: geometry.dist(state.drawStart, end)};
    } else if (state.tool === 'rect') {
      state.tempEntity = {type: 'RECT', start: state.drawStart, end};
    } else if (state.tool === 'measure') {
      state.tempEntity = {type: 'MEASURE', start: state.drawStart, end};
    }
    renderer.render();
  });

  canvas.addEventListener('mouseup', (event) => {
    state.drag.active = false;

    if (state.boxSelect) {
      handleBoxSelection();
      renderer.render();
      return;
    }

    if (!state.drawStart || !state.tempEntity) return;
    if (state.tool === 'measure') {
      state.drawStart = null;
      state.tempEntity = null;
      renderer.render();
      return;
    }

    const color = colorPicker.value || '#ffffff';
    if (state.tool === 'rect') {
      const {start, end} = state.tempEntity;
      state.entities.push({
        type: 'LWPOLYLINE',
        vertices: [
          {x: start.x, y: start.y},
          {x: end.x, y: start.y},
          {x: end.x, y: end.y},
          {x: start.x, y: end.y},
        ],
        closed: true,
        cssColor: color,
      });
    } else {
      const copy = JSON.parse(JSON.stringify(state.tempEntity));
      copy.cssColor = color;
      state.entities.push(copy);
    }

    state.drawStart = null;
    state.tempEntity = null;
    renderer.render();
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  toolbarEl.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    toolbarEl.querySelectorAll('button').forEach((btn) => btn.classList.remove('active'));
    event.target.classList.add('active');
    setTool(event.target.dataset.tool || 'select');
    clearSelection();
    setBoxSelection(null);
    renderer.render();
    updateStatus();
  });

  angleSnapEl.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    angleSnapEl.querySelectorAll('button').forEach((btn) => btn.classList.remove('active'));
    event.target.classList.add('active');
    updateSnapAngle(Number(event.target.dataset.angle) || 0);
  });

  deleteBtn.addEventListener('click', () => {
    if (!state.selection.size) return;
    const toRemove = Array.from(state.selection).sort((a, b) => b - a);
    toRemove.forEach((idx) => state.entities.splice(idx, 1));
    clearSelection();
    renderer.render();
    updateStatus();
  });

  colorPicker.addEventListener('input', (event) => {
    if (!state.selection.size) return;
    state.selection.forEach((idx) => {
      state.entities[idx].cssColor = event.target.value;
    });
    renderer.render();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Delete') {
      deleteBtn.click();
    }
    if (event.key === 'Escape') {
      toolbarEl.querySelectorAll('button').forEach((btn) => btn.classList.remove('active'));
      toolbarEl.querySelector('[data-tool="select"]')?.classList.add('active');
      setTool('select');
      clearSelection();
      setBoxSelection(null);
      state.drawStart = null;
      state.tempEntity = null;
      renderer.render();
      updateStatus();
    }
  });

  function getSnapPoint(world) {
    if (state.tool === 'trim') return null;
    let closest = null;
    let min = Infinity;
    const radius = state.snap.threshold / state.scale;
    state.entities.forEach((ent) => {
      const points = [];
      if (ent.type === 'LINE') {
        points.push(ent.start, ent.end);
      } else if (ent.type === 'CIRCLE') {
        points.push(ent.center);
      } else if (ent.type === 'LWPOLYLINE') {
        points.push(...ent.vertices);
      }
      points.forEach((point) => {
        const d = geometry.dist(world, point);
        if (d < radius && d < min) {
          min = d;
          closest = {x: point.x, y: point.y};
        }
      });
    });
    return closest;
  }

  function getEntityAt(world) {
    const threshold = 5 / state.scale;
    let hit = -1;
    let min = Infinity;
    state.entities.forEach((ent, idx) => {
      let d = Infinity;
      if (ent.type === 'LINE') {
        d = geometry.distanceToSegment(world, ent.start, ent.end);
      } else if (ent.type === 'CIRCLE') {
        d = Math.abs(geometry.dist(world, ent.center) - ent.radius);
      } else if (ent.type === 'LWPOLYLINE') {
        for (let i = 0; i < ent.vertices.length; i += 1) {
          const p1 = ent.vertices[i];
          const p2 = ent.vertices[(i + 1) % ent.vertices.length];
          if (!ent.closed && i === ent.vertices.length - 1) break;
          const seg = geometry.distanceToSegment(world, p1, p2);
          if (seg < d) d = seg;
        }
      }
      if (d < threshold && d < min) {
        min = d;
        hit = idx;
      }
    });
    return hit;
  }

  function handleBoxSelection() {
    const {start, end} = state.boxSelect;
    setBoxSelection(null);
    const startWorld = geometry.screenToWorld(start.x, start.y);
    const endWorld = geometry.screenToWorld(end.x, end.y);
    const box = {
      minX: Math.min(startWorld.x, endWorld.x),
      maxX: Math.max(startWorld.x, endWorld.x),
      minY: Math.min(startWorld.y, endWorld.y),
      maxY: Math.max(startWorld.y, endWorld.y),
    };
    const isCrossing = end.x < start.x;
    const selection = new Set();
    state.entities.forEach((ent, idx) => {
      if (entityInsideBox(ent, box)) {
        selection.add(idx);
      } else if (isCrossing && entityIntersectsBox(ent, box)) {
        selection.add(idx);
      }
    });
    state.selection = selection;
    updateStatus();
  }

  function entityInsideBox(ent, box) {
    if (ent.type === 'LINE') {
      return (
        pointInBox(ent.start, box) &&
        pointInBox(ent.end, box)
      );
    }
    if (ent.type === 'CIRCLE') {
      const {center, radius} = ent;
      return (
        center.x - radius >= box.minX &&
        center.x + radius <= box.maxX &&
        center.y - radius >= box.minY &&
        center.y + radius <= box.maxY
      );
    }
    if (ent.type === 'LWPOLYLINE') {
      return ent.vertices.every((vertex) => pointInBox(vertex, box));
    }
    return false;
  }

  function entityIntersectsBox(ent, box) {
    if (ent.type === 'LINE') {
      return (
        pointInBox(ent.start, box) ||
        pointInBox(ent.end, box) ||
        lineIntersectsBox(ent.start, ent.end, box)
      );
    }
    if (ent.type === 'CIRCLE') {
      const {center, radius} = ent;
      const circleBox = {
        minX: center.x - radius,
        maxX: center.x + radius,
        minY: center.y - radius,
        maxY: center.y + radius,
      };
      const overlapX = Math.max(0, Math.min(box.maxX, circleBox.maxX) - Math.max(box.minX, circleBox.minX));
      const overlapY = Math.max(0, Math.min(box.maxY, circleBox.maxY) - Math.max(box.minY, circleBox.minY));
      return overlapX > 0 && overlapY > 0;
    }
    if (ent.type === 'LWPOLYLINE') {
      return ent.vertices.some((vertex) => pointInBox(vertex, box)) ||
        polylineIntersectsBox(ent, box);
    }
    return false;
  }

  function pointInBox(point, box) {
    return point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY;
  }

  function lineIntersectsBox(p1, p2, box) {
    if (
      Math.max(p1.x, p2.x) < box.minX ||
      Math.min(p1.x, p2.x) > box.maxX ||
      Math.max(p1.y, p2.y) < box.minY ||
      Math.min(p1.y, p2.y) > box.maxY
    ) {
      return false;
    }
    const corners = [
      {x: box.minX, y: box.minY},
      {x: box.maxX, y: box.minY},
      {x: box.maxX, y: box.maxY},
      {x: box.minX, y: box.maxY},
    ];
    for (let i = 0; i < 4; i += 1) {
      const c1 = corners[i];
      const c2 = corners[(i + 1) % 4];
      if (geometry.getLineLineIntersection(p1, p2, c1, c2)) {
        return true;
      }
    }
    return false;
  }

  function polylineIntersectsBox(ent, box) {
    for (let i = 0; i < ent.vertices.length; i += 1) {
      const v1 = ent.vertices[i];
      const v2 = ent.vertices[(i + 1) % ent.vertices.length];
      if (!ent.closed && i === ent.vertices.length - 1) break;
      if (lineIntersectsBox(v1, v2, box)) return true;
    }
    return false;
  }

  function performTrim(world) {
    const threshold = 10 / state.scale;
    let targetIdx = -1;
    let min = Infinity;
    state.entities.forEach((ent, idx) => {
      if (ent.type !== 'LINE') return;
      const d = geometry.distanceToSegment(world, ent.start, ent.end);
      if (d < threshold && d < min) {
        min = d;
        targetIdx = idx;
      }
    });
    if (targetIdx === -1) return;

    const target = state.entities[targetIdx];
    const cuts = [target.start, target.end];

    state.entities.forEach((ent, idx) => {
      if (idx === targetIdx) return;
      if (ent.type === 'LINE') {
        const p = geometry.getLineLineIntersection(target.start, target.end, ent.start, ent.end);
        if (p) cuts.push(p);
      } else if (ent.type === 'CIRCLE') {
        cuts.push(...geometry.getLineCircleIntersect(target.start, target.end, ent));
      } else if (ent.type === 'LWPOLYLINE') {
        for (let i = 0; i < ent.vertices.length; i += 1) {
          const v1 = ent.vertices[i];
          const v2 = ent.vertices[(i + 1) % ent.vertices.length];
          if (!ent.closed && i === ent.vertices.length - 1) break;
          const p = geometry.getLineLineIntersection(target.start, target.end, v1, v2);
          if (p) cuts.push(p);
        }
      }
    });

    cuts.sort((a, b) => geometry.dist(target.start, a) - geometry.dist(target.start, b));
    let segmentIndex = -1;
    let segmentDistance = Infinity;
    for (let i = 0; i < cuts.length - 1; i += 1) {
      const p1 = cuts[i];
      const p2 = cuts[i + 1];
      if (geometry.dist(p1, p2) < 1e-4) continue;
      const mid = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
      const midDist = geometry.dist(world, mid);
      if (midDist < segmentDistance) {
        segmentDistance = midDist;
        segmentIndex = i;
      }
    }

    if (segmentIndex === -1) return;
    const newSegments = [];
    for (let i = 0; i < cuts.length - 1; i += 1) {
      if (i === segmentIndex) continue;
      const p1 = cuts[i];
      const p2 = cuts[i + 1];
      if (geometry.dist(p1, p2) < 1e-4) continue;
      newSegments.push({
        type: 'LINE',
        start: p1,
        end: p2,
        cssColor: target.cssColor,
      });
    }
    state.entities.splice(targetIdx, 1, ...newSegments);
  }

  function updateStatus() {
    if (state.tool === 'select') {
      const count = state.selection.size;
      statusEl.textContent = count ? `${count} Selected` : 'Ready to Select';
    } else {
      statusEl.textContent = `Mode: ${state.tool.toUpperCase()}`;
    }
  }

  updateStatus();

  return {
    getContext: () => ctx,
    render: renderer.render,
    updateStatus,
    resize: resizeCanvas,
  };
}
