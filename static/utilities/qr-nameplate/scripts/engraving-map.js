import {getLocale} from './translations.js';

const TEXTURE_RESOLUTION = 1024;

export class EngravingMapGenerator {
  constructor(canvas) {
    this.canvas = canvas;
    this.resolution = TEXTURE_RESOLUTION;
    this.qrInstance = null;
  }

  async createMap({text, url, border, lang}) {
    if (!this.canvas) return null;
    const locale = getLocale(lang);
    const canvas = this.canvas;
    canvas.width = this.resolution;
    canvas.height = this.resolution;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 15;

    if (border) {
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, canvas.width - ctx.lineWidth * 2, canvas.height - ctx.lineWidth * 2);
    }

    const engravingText = text || locale.plaqueTextValue;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let fontSize = 150;
    ctx.font = `bold ${fontSize}px sans-serif`;
    let metrics = ctx.measureText(engravingText);
    while (metrics.width > this.resolution * 0.8 && fontSize > 10) {
      fontSize -= 5;
      ctx.font = `bold ${fontSize}px sans-serif`;
      metrics = ctx.measureText(engravingText);
    }
    ctx.fillText(engravingText, canvas.width / 2, canvas.height * 0.2);

    const qrUrl = (url && url.trim()) || locale.qrUrlPlaceholder;
    await this.drawQrCode(ctx, qrUrl);
    return canvas;
  }

  drawQrCode(ctx, text) {
    const qrSize = this.resolution * 0.5;
    const tempContainer = document.createElement('div');
    tempContainer.style.width = `${qrSize}px`;
    tempContainer.style.height = `${qrSize}px`;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    const QRCodeLib = window.QRCode;
    if (!QRCodeLib) {
      document.body.removeChild(tempContainer);
      return Promise.resolve();
    }

    if (this.qrInstance) {
      this.qrInstance.clear();
      this.qrInstance = null;
    }

    this.qrInstance = new QRCodeLib(tempContainer, {
      text,
      width: qrSize,
      height: qrSize,
      colorDark: 'white',
      colorLight: 'black',
      correctLevel: QRCodeLib.CorrectLevel.M,
    });

    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 60;
      const tryDraw = () => {
        attempts += 1;
        const qrCanvas = tempContainer.querySelector('canvas');
        const qrImg = tempContainer.querySelector('img');
        const drawAndResolve = (image) => {
          ctx.drawImage(image, (this.resolution - qrSize) / 2, this.resolution * 0.35, qrSize, qrSize);
          document.body.removeChild(tempContainer);
          resolve();
        };

        if (qrCanvas) {
          drawAndResolve(qrCanvas);
          return;
        }

        if (qrImg && qrImg.complete) {
          drawAndResolve(qrImg);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(tryDraw, 50);
        } else {
          document.body.removeChild(tempContainer);
          resolve();
        }
      };
      tryDraw();
    });
  }
}
