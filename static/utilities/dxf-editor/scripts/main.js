import {createGeometry} from './geometry.js';
import {createRenderer} from './renderer.js';
import {createInteractions} from './interactions.js';
import {createDxfIo} from './dxf-io.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('cadCanvas');
  const container = document.getElementById('canvasContainer');
  const geometry = createGeometry(canvas);
  const ctx = canvas.getContext('2d');
  const renderer = createRenderer(canvas, ctx, geometry);

  const interactions = createInteractions({
    canvas,
    container,
    renderer,
    geometry,
    coordsEl: document.getElementById('coords'),
    statusEl: document.getElementById('statusText'),
    toolbarEl: document.getElementById('toolbar'),
    angleSnapEl: document.getElementById('angleSnapParams'),
    colorPicker: document.getElementById('colorPicker'),
    deleteBtn: document.getElementById('deleteBtn'),
  });

  createDxfIo({
    canvas,
    geometry,
    renderer,
    fileInput: document.getElementById('fileInput'),
    saveBtn: document.getElementById('saveBtn'),
  });

  renderer.render();
  interactions.updateStatus?.();
});
