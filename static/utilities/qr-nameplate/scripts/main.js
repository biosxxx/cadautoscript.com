import {SceneManager} from './scene-manager.js';
import {UiController} from './ui-controller.js';
import {EngravingMapGenerator} from './engraving-map.js';

function bootstrap() {
  const ui = new UiController();
  ui.setLanguage('ru');

  const plaqueCanvas = ui.refs.plaqueCanvas;
  const engravingCanvas = ui.refs.engravingCanvas;
  if (!plaqueCanvas || !engravingCanvas) return;

  const sceneManager = new SceneManager(plaqueCanvas);
  const engravingGenerator = new EngravingMapGenerator(engravingCanvas);

  const generatePreview = async () => {
    try {
      ui.setButtonState(true);
      const state = ui.getFormState();
      sceneManager.updateGeometry(state.size);
      const engravingMap = await engravingGenerator.createMap({
        ...state.engraving,
        lang: state.lang,
      });
      await sceneManager.applyMaterial({
        materialType: state.material,
        engravingCanvas: engravingMap,
      });
    } finally {
      ui.setButtonState(false);
    }
  };

  ui.onGenerate(generatePreview);
  ui.onLanguageChange(() => {
    ui.setButtonState(ui.refs.generateBtn?.disabled ?? false);
  });

  ui.handleResize(() => {
    sceneManager.resize();
  });

  sceneManager.loadEnvironment().then(() => {
    generatePreview();
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
