import {state, dxfColors} from './state.js';

export function createDxfIo(deps) {
  const {canvas, geometry, renderer, fileInput, saveBtn} = deps;

  fileInput.addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parser = new window.DxfParser();
      try {
        const data = parser.parseSync(e.target.result);
        loadEntities(data.entities || []);
        fitToScreen();
        renderer.render();
      } catch (err) {
        window.alert(`DXF error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  });

  saveBtn.addEventListener('click', () => {
    const content = serializeEntities();
    const blob = new Blob([content], {type: 'application/dxf'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webdxf-output.dxf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  function loadEntities(entities) {
    state.entities = [];
    entities.forEach((entity) => {
      const color = entity.color ? dxfColors[entity.color] || '#ffffff' : '#ffffff';
      if (entity.type === 'LINE') {
        state.entities.push({
          type: 'LINE',
          start: {x: entity.vertices[0].x, y: entity.vertices[0].y},
          end: {x: entity.vertices[1].x, y: entity.vertices[1].y},
          cssColor: color,
        });
      } else if (entity.type === 'CIRCLE') {
        state.entities.push({
          type: 'CIRCLE',
          center: {x: entity.center.x, y: entity.center.y},
          radius: entity.radius,
          cssColor: color,
        });
      } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
        const vertices = entity.vertices.map((v) => ({x: v.x, y: v.y}));
        state.entities.push({
          type: 'LWPOLYLINE',
          vertices,
          closed: Boolean(entity.shape),
          cssColor: color,
        });
      }
    });
  }

  function fitToScreen() {
    if (!state.entities.length) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const consider = (x, y) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };

    state.entities.forEach((ent) => {
      if (ent.type === 'LINE') {
        consider(ent.start.x, ent.start.y);
        consider(ent.end.x, ent.end.y);
      } else if (ent.type === 'CIRCLE') {
        consider(ent.center.x - ent.radius, ent.center.y - ent.radius);
        consider(ent.center.x + ent.radius, ent.center.y + ent.radius);
      } else if (ent.type === 'LWPOLYLINE') {
        ent.vertices.forEach((v) => consider(v.x, v.y));
      }
    });

    const width = maxX - minX;
    const height = maxY - minY;
    if (!width || !height) return;
    const padding = 50;
    const scaleX = (canvas.width - padding * 2) / width;
    const scaleY = (canvas.height - padding * 2) / height;
    state.scale = Math.min(scaleX, scaleY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    state.offset.x = -centerX * state.scale;
    state.offset.y = centerY * state.scale;
  }

  function serializeEntities() {
    let content = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
    state.entities.forEach((ent) => {
      if (ent.type === 'LINE') {
        content += `0\nLINE\n8\n0\n62\n7\n10\n${ent.start.x}\n20\n${ent.start.y}\n11\n${ent.end.x}\n21\n${ent.end.y}\n`;
      } else if (ent.type === 'CIRCLE') {
        content += `0\nCIRCLE\n8\n0\n62\n7\n10\n${ent.center.x}\n20\n${ent.center.y}\n40\n${ent.radius}\n`;
      } else if (ent.type === 'LWPOLYLINE') {
        content += `0\nLWPOLYLINE\n8\n0\n62\n7\n90\n${ent.vertices.length}\n70\n${ent.closed ? 1 : 0}\n`;
        ent.vertices.forEach((v) => {
          content += `10\n${v.x}\n20\n${v.y}\n`;
        });
      }
    });
    content += `0\nENDSEC\n0\nEOF\n`;
    return content;
  }

  return {loadEntities, fitToScreen};
}
