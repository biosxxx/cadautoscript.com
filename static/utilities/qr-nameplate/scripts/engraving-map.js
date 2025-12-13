const TEXTURE_RESOLUTION = 1024;

export class EngravingMapGenerator {
  constructor(canvas) {
    this.canvas = canvas;
    this.resolution = TEXTURE_RESOLUTION;
    this.qrInstance = null;
  }

  async createMap({ text, url, border }) {
    if (!this.canvas) return null;
    const canvas = this.canvas;
    canvas.width = this.resolution;
    canvas.height = this.resolution;

    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    // Black background = "not engraved"
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // White content = "engraved"
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 15;

    if (border) {
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, canvas.width - ctx.lineWidth * 2, canvas.height - ctx.lineWidth * 2);
    }

    const engravingText = (text || "CAD AutoScript").trim() || "CAD AutoScript";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Auto-fit
    let fontSize = 160;
    ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
    let metrics = ctx.measureText(engravingText);
    while (metrics.width > this.resolution * 0.86 && fontSize > 12) {
      fontSize -= 6;
      ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
      metrics = ctx.measureText(engravingText);
    }
    ctx.fillText(engravingText, canvas.width / 2, canvas.height * 0.2);

    const qrUrl = (url && url.trim()) || "https://cadautoscript.com";
    await this.drawQrCode(ctx, qrUrl);
    return canvas;
  }

  /**
   * Draw QR into the engraving map (white on black).
   */
  drawQrCode(ctx, text) {
    const qrSize = this.resolution * 0.52;
    const tempContainer = document.createElement("div");
    tempContainer.style.width = `${qrSize}px`;
    tempContainer.style.height = `${qrSize}px`;
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
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
      colorDark: "white",
      colorLight: "black",
      correctLevel: QRCodeLib.CorrectLevel.M,
    });

    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 60;

      const tryDraw = () => {
        attempts += 1;
        const qrCanvas = tempContainer.querySelector("canvas");
        const qrImg = tempContainer.querySelector("img");

        const drawAndResolve = (image) => {
          ctx.drawImage(image, (this.resolution - qrSize) / 2, this.resolution * 0.35, qrSize, qrSize);
          document.body.removeChild(tempContainer);
          resolve();
        };

        if (qrCanvas) return drawAndResolve(qrCanvas);
        if (qrImg && qrImg.complete) return drawAndResolve(qrImg);

        if (attempts < maxAttempts) setTimeout(tryDraw, 50);
        else {
          document.body.removeChild(tempContainer);
          resolve();
        }
      };

      tryDraw();
    });
  }

  /**
   * Convenience for PDF: generate QR PNG data URL.
   */
  async getQrPngDataUrl(text, sizePx = 256) {
    const QRCodeLib = window.QRCode;
    if (!QRCodeLib) return "";

    const tempContainer = document.createElement("div");
    tempContainer.style.width = `${sizePx}px`;
    tempContainer.style.height = `${sizePx}px`;
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    document.body.appendChild(tempContainer);

    const qr = new QRCodeLib(tempContainer, {
      text,
      width: sizePx,
      height: sizePx,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCodeLib.CorrectLevel.M,
    });

    const dataUrl = await new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 60;
      const tryRead = () => {
        attempts += 1;
        const canvas = tempContainer.querySelector("canvas");
        const img = tempContainer.querySelector("img");
        if (canvas) return resolve(canvas.toDataURL("image/png"));
        if (img && img.complete) return resolve(img.src || "");
        if (attempts < maxAttempts) setTimeout(tryRead, 50);
        else resolve("");
      };
      tryRead();
    });

    qr.clear();
    document.body.removeChild(tempContainer);
    return dataUrl;
  }
}
