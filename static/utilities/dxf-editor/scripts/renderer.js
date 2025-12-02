import {state} from './state.js';

export function createRenderer(canvas, ctx, geometry) {
  function clear() {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    let step = 10;
    if (state.scale < 0.5) step = 100;
    if (state.scale > 5) step = 1;

    const topLeft = geometry.screenToWorld(0, 0);
    const bottomRight = geometry.screenToWorld(canvas.width, canvas.height);

    const startX = Math.floor(topLeft.x / step) * step;
    const endX = Math.ceil(bottomRight.x / step) * step;
    const startY = Math.floor(bottomRight.y / step) * step;
    const endY = Math.ceil(topLeft.y / step) * step;

    for (let x = startX; x <= endX; x += step) {
      const p = geometry.worldToScreen(x, 0);
      ctx.moveTo(p.x, 0);
      ctx.lineTo(p.x, canvas.height);
    }

    for (let y = startY; y <= endY; y += step) {
      const p = geometry.worldToScreen(0, y);
      ctx.moveTo(0, p.y);
      ctx.lineTo(canvas.width, p.y);
    }
    ctx.stroke();
    ctx.restore();

    const origin = geometry.worldToScreen(0, 0);
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x + 50, origin.y);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x, origin.y - 50);
    ctx.stroke();
  }

  function drawEntities() {
    state.entities.forEach((ent, idx) => {
      const selected = state.selection.has(idx);
      ctx.strokeStyle = selected ? '#3b82f6' : ent.cssColor || '#ffffff';
      ctx.lineWidth = selected ? 2 : 1;
      ctx.setLineDash(ent.lineDash || []);
      ctx.beginPath();
      if (ent.type === 'LINE') {
        const p1 = geometry.worldToScreen(ent.start.x, ent.start.y);
        const p2 = geometry.worldToScreen(ent.end.x, ent.end.y);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      } else if (ent.type === 'CIRCLE') {
        const c = geometry.worldToScreen(ent.center.x, ent.center.y);
        ctx.arc(c.x, c.y, ent.radius * state.scale, 0, Math.PI * 2);
      } else if (ent.type === 'LWPOLYLINE') {
        if (!ent.vertices.length) return;
        const start = geometry.worldToScreen(ent.vertices[0].x, ent.vertices[0].y);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < ent.vertices.length; i += 1) {
          const point = geometry.worldToScreen(ent.vertices[i].x, ent.vertices[i].y);
          ctx.lineTo(point.x, point.y);
        }
        if (ent.closed) ctx.closePath();
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  function drawTempEntity() {
    const t = state.tempEntity;
    if (!t) return;
    ctx.strokeStyle = '#fbbf24';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();

    if (t.type === 'LINE') {
      const p1 = geometry.worldToScreen(t.start.x, t.start.y);
      const p2 = geometry.worldToScreen(t.end.x, t.end.y);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      const len = geometry.dist(t.start, t.end).toFixed(2);
      drawLabel((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, `L:${len}`);
    } else if (t.type === 'CIRCLE') {
      const c = geometry.worldToScreen(t.center.x, t.center.y);
      ctx.arc(c.x, c.y, t.radius * state.scale, 0, Math.PI * 2);
      drawLabel(c.x + t.radius * state.scale, c.y, `R:${t.radius.toFixed(2)}`);
    } else if (t.type === 'RECT') {
      const p1 = geometry.worldToScreen(t.start.x, t.start.y);
      const p2 = geometry.worldToScreen(t.end.x, t.end.y);
      ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      const w = Math.abs(t.end.x - t.start.x).toFixed(2);
      const h = Math.abs(t.end.y - t.start.y).toFixed(2);
      drawLabel(p1.x, p1.y - 12, `${w}×${h}`);
    } else if (t.type === 'MEASURE') {
      const p1 = geometry.worldToScreen(t.start.x, t.start.y);
      const p2 = geometry.worldToScreen(t.end.x, t.end.y);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.moveTo(p1.x - 4, p1.y - 4);
      ctx.lineTo(p1.x + 4, p1.y + 4);
      ctx.moveTo(p1.x + 4, p1.y - 4);
      ctx.lineTo(p1.x - 4, p1.y + 4);
      ctx.moveTo(p2.x - 4, p2.y - 4);
      ctx.lineTo(p2.x + 4, p2.y + 4);
      ctx.moveTo(p2.x + 4, p2.y - 4);
      ctx.lineTo(p2.x - 4, p2.y + 4);
      const len = geometry.dist(t.start, t.end).toFixed(2);
      drawLabel((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 10, `${len} mm`, '#22c55e');
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSelectionBox() {
    if (!state.boxSelect) return;
    const {start, end} = state.boxSelect;
    const w = end.x - start.x;
    const h = end.y - start.y;
    ctx.beginPath();
    ctx.rect(start.x, start.y, w, h);
    const isCrossing = w < 0;
    ctx.fillStyle = isCrossing ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)';
    ctx.strokeStyle = isCrossing ? '#10b981' : '#3b82f6';
    ctx.setLineDash(isCrossing ? [6, 6] : []);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawLabel(x, y, text, color = '#fbbf24') {
    ctx.save();
    ctx.font = '12px Inter, sans-serif';
    const metrics = ctx.measureText(text);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - metrics.width / 2 - 4, y - 16, metrics.width + 8, 18);
    ctx.fillStyle = color;
    ctx.fillText(text, x - metrics.width / 2, y - 2);
    ctx.restore();
  }

  function render() {
    clear();
    drawGrid();
    drawEntities();
    drawTempEntity();
    drawSelectionBox();
  }

  return {render};
}
