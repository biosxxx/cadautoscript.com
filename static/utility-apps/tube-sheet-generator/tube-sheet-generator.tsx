import React, { useState, useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

// ------------------------------------------------------------------
// Типы и Вспомогательные функции
// ------------------------------------------------------------------

type Point = { x: number; y: number };

interface Params {
  boardDiameter: number;
  thickness: number; // Новое поле для 3D
  tubeDiameter: number;
  tubeLayout: 'triangular' | 'square';
  tubePitch: number;
  edgeMargin: number;
  passCount: number;
  partitionWidth: number;
  partitionOrientation: 'horizontal' | 'vertical';
}

// ------------------------------------------------------------------
// Основной Компонент (Обернутый для BrowserOnly)
// ------------------------------------------------------------------

const GeneratorContent = () => {
  // --- Состояние ---
  const [params, setParams] = useState<Params>({
    boardDiameter: 500,
    thickness: 50, // Толщина плиты по умолчанию
    tubeDiameter: 25,
    tubeLayout: 'triangular',
    tubePitch: 32,
    edgeMargin: 15,
    passCount: 2,
    partitionWidth: 10,
    partitionOrientation: 'horizontal',
  });

  const [tubeCoords, setTubeCoords] = useState<Point[]>([]);
  const [isGeneratingStep, setIsGeneratingStep] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Логика Расчета (из вашего исходного файла) ---
  
  const calculateTubePositions = () => {
    const coords: Point[] = [];
    const boardRadius = params.boardDiameter / 2;
    const safeRadius = boardRadius - params.edgeMargin - (params.tubeDiameter / 2);

    if (safeRadius <= 0) {
      setTubeCoords([]);
      return;
    }

    const endX = boardRadius;
    const endY = boardRadius;

    // Функция добавления с симметрией
    const addSymmetric = (x: number, y: number) => {
       if (Math.sqrt(x * x + y * y) <= safeRadius) {
          coords.push({ x, y });
          if (x !== 0) coords.push({ x: -x, y });
          if (y !== 0) coords.push({ x, y: -y });
          if (x !== 0 && y !== 0) coords.push({ x: -x, y: -y });
       }
    };

    if (params.tubeLayout === 'square') {
      for (let y = 0; y < endY; y += params.tubePitch) {
        for (let x = 0; x < endX; x += params.tubePitch) {
          if (x === 0 && y === 0) continue;
          addSymmetric(x, y);
        }
      }
      if (0 <= safeRadius) coords.push({ x: 0, y: 0 });
    } else {
      // Triangular
      const dy = params.tubePitch * Math.sqrt(3) / 2;
      for (let y = 0, row = 0; y < endY; y += dy, row++) {
        const xOffset = (row % 2 === 1) ? params.tubePitch / 2 : 0;
        for (let x = xOffset; x < endX; x += params.tubePitch) {
          if (x === 0 && y === 0) continue;
          addSymmetric(x, y);
        }
      }
      if (0 <= safeRadius) coords.push({ x: 0, y: 0 });
    }

    // Удаление дубликатов
    const uniqueCoords = coords.filter((v, i, a) => a.findIndex(t => (t.x === v.x && t.y === v.y)) === i);
    setTubeCoords(uniqueCoords);
  };

  // Пересчет при изменении параметров
  useEffect(() => {
    calculateTubePositions();
  }, [params]);

  // Отрисовка Canvas (2D Preview)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Настраиваем размер с учетом DPI
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const scale = Math.min(rect.width, rect.height) / (params.boardDiameter * 1.1);
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    // 1. Плита
    ctx.beginPath();
    ctx.arc(0, 0, (params.boardDiameter / 2) * scale, 0, 2 * Math.PI);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Трубы
    ctx.fillStyle = '#a78bfa';
    tubeCoords.forEach(coord => {
      ctx.beginPath();
      ctx.arc(coord.x * scale, -coord.y * scale, (params.tubeDiameter / 2) * scale, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 3. Перегородки (визуализация линий)
    if (params.passCount > 1) {
       const boardRadius = params.boardDiameter / 2;
       const halfPartition = params.partitionWidth / 2;
       const numPartitions = params.passCount - 1;
       
       ctx.strokeStyle = '#ef4444'; // Красный для перегородок
       ctx.lineWidth = 1.5;

       if (params.partitionOrientation === 'horizontal') {
           const totalHeight = boardRadius * 2;
           const sectionHeight = totalHeight / params.passCount;
           for (let i = 1; i <= numPartitions; i++) {
               const yPos = boardRadius - (i * sectionHeight);
               const halfWidth = Math.sqrt(Math.abs(boardRadius * boardRadius - yPos * yPos));
               
               // Верхняя линия перегородки
               ctx.beginPath();
               ctx.moveTo(-halfWidth * scale, -(yPos - halfPartition) * scale);
               ctx.lineTo(halfWidth * scale, -(yPos - halfPartition) * scale);
               ctx.stroke();

               // Нижняя линия перегородки
               ctx.beginPath();
               ctx.moveTo(-halfWidth * scale, -(yPos + halfPartition) * scale);
               ctx.lineTo(halfWidth * scale, -(yPos + halfPartition) * scale);
               ctx.stroke();
           }
       } else { // Vertical
           const totalWidth = boardRadius * 2;
           const sectionWidth = totalWidth / params.passCount;
           for (let i = 1; i <= numPartitions; i++) {
               const xPos = boardRadius - (i * sectionWidth);
               const halfHeight = Math.sqrt(Math.abs(boardRadius * boardRadius - xPos * xPos));

               ctx.beginPath();
               ctx.moveTo((xPos - halfPartition) * scale, -halfHeight * scale);
               ctx.lineTo((xPos - halfPartition) * scale, halfHeight * scale);
               ctx.stroke();
               
               ctx.beginPath();
               ctx.moveTo((xPos + halfPartition) * scale, -halfHeight * scale);
               ctx.lineTo((xPos + halfPartition) * scale, halfHeight * scale);
               ctx.stroke();
           }
       }
    }

    ctx.restore();
  }, [tubeCoords, params]); // Зависимости для перерисовки

  // --- Генерация DXF (Legacy) ---
  const handleDownloadDXF = () => {
    const boardRadius = params.boardDiameter / 2;
    const tubeRadius = params.tubeDiameter / 2;
    
    let dxf = `0\nSECTION\n2\nENTITIES\n`;
    
    // Board
    dxf += `0\nCIRCLE\n8\n0\n10\n0.0\n20\n0.0\n30\n0.0\n40\n${boardRadius}\n`;
    
    // Tubes
    tubeCoords.forEach(c => {
      dxf += `0\nCIRCLE\n8\n0\n10\n${c.x.toFixed(4)}\n20\n${c.y.toFixed(4)}\n30\n0.0\n40\n${tubeRadius}\n`;
    });

    dxf += `0\nENDSEC\n0\nEOF\n`;

    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tubesheet_${params.boardDiameter}mm.dxf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- Генерация STEP (Replicad) ---
  const handleDownloadSTEP = async () => {
    setIsGeneratingStep(true);
    
    // Даем UI обновиться перед тяжелой операцией
    setTimeout(async () => {
      try {
        // Динамический импорт Replicad
        const replicad = await import('replicad');
        const { drawCircle } = replicad;

        // 1. Создаем базовый эскиз (круг плиты)
        const boardRadius = params.boardDiameter / 2;
        const holeRadius = params.tubeDiameter / 2;

        let mainSketch = drawCircle(boardRadius);

        // 2. Вычитаем отверстия на уровне 2D эскиза (быстрее, чем 3D булевы операции)
        // Для каждого отверстия создаем круг и помечаем как "hole" (вырез) внутри эскиза
        // Внимание: Replicad/OCCT требует, чтобы отверстия полностью находились внутри
        
        // Создаем массив фигур отверстий
        // Оптимизация: Replicad позволяет рисовать сразу сложный профиль,
        // но самый надежный способ - это Boolean Cut в 2D.
        
        /* ВАЖНО: При большом количестве отверстий (1000+) браузер может подвиснуть.
           Мы используем подход "Эскиз с отверстиями" -> Extrude.
        */

        // Вариант с Replicad API:
        // Рисуем базу, затем рисуем круги отверстий, затем Extrude.
        // Replicad (v0.x) обычно определяет вложенные контуры как отверстия автоматически.
        
        // ПРИМЕЧАНИЕ: Если отверстий очень много, можно делать батчами.
        tubeCoords.forEach(c => {
             // Добавляем круг в общий чертеж
             const hole = drawCircle(holeRadius).translate(c.x, c.y);
             // "Вырезаем" этот круг из основного эскиза
             // В Replicad API: sketch.cut(otherSketch) работает для 2D
             mainSketch = mainSketch.cut(hole);
        });

        // 3. Выдавливаем (Extrude) в 3D
        const model3d = mainSketch.sketchOnPlane().extrude(params.thickness);

        // 4. Экспорт
        const blob = model3d.blobSTEP();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tubesheet_${params.boardDiameter}mm.step`;
        link.click();
        URL.revokeObjectURL(url);

      } catch (error) {
        console.error("STEP Generation failed:", error);
        alert("Ошибка генерации STEP. Проверьте консоль.");
      } finally {
        setIsGeneratingStep(false);
      }
    }, 100);
  };

  // --- Inputs Handler ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  return (
    <div className="container margin-vert--lg">
      <div className="row">
        {/* Панель настроек */}
        <div className="col col--4">
          <div className="card">
            <div className="card__header">
              <h3>Parameters</h3>
            </div>
            <div className="card__body">
              {/* Sheet Settings */}
              <div className="margin-bottom--md">
                <h4>Sheet</h4>
                <label className="display-block">Diameter (mm)</label>
                <input className="button--block padding--sm border-radius--sm border--solid" 
                       type="number" name="boardDiameter" value={params.boardDiameter} onChange={handleChange} />
                
                <label className="display-block margin-top--sm">Thickness (mm)</label>
                <input className="button--block padding--sm border-radius--sm border--solid" 
                       type="number" name="thickness" value={params.thickness} onChange={handleChange} />
              </div>

              {/* Tube Settings */}
              <div className="margin-bottom--md">
                <h4>Tubes</h4>
                <label className="display-block">Diameter (mm)</label>
                <input className="button--block padding--sm border-radius--sm border--solid" 
                       type="number" name="tubeDiameter" value={params.tubeDiameter} onChange={handleChange} />
                
                <label className="display-block margin-top--sm">Layout</label>
                <select className="button--block padding--sm border-radius--sm border--solid" 
                        name="tubeLayout" value={params.tubeLayout} onChange={handleChange}>
                   <option value="triangular">Triangular (60°)</option>
                   <option value="square">Square (90°)</option>
                </select>

                <label className="display-block margin-top--sm">Pitch (mm)</label>
                <input className="button--block padding--sm border-radius--sm border--solid" 
                       type="number" name="tubePitch" value={params.tubePitch} onChange={handleChange} />

                <label className="display-block margin-top--sm">Margin (mm)</label>
                <input className="button--block padding--sm border-radius--sm border--solid" 
                       type="number" name="edgeMargin" value={params.edgeMargin} onChange={handleChange} />
              </div>

               {/* Partitions */}
               <div className="margin-bottom--md">
                <h4>Partitions (Visual)</h4>
                <label className="display-block">Passes</label>
                <input className="button--block padding--sm border-radius--sm border--solid" 
                       type="number" name="passCount" value={params.passCount} onChange={handleChange} />
                
                <label className="display-block margin-top--sm">Partition Width</label>
                <input className="button--block padding--sm border-radius--sm border--solid" 
                       type="number" name="partitionWidth" value={params.partitionWidth} onChange={handleChange} />
              </div>

              <div className="alert alert--info margin-bottom--md">
                <strong>Holes count:</strong> {tubeCoords.length}
              </div>

              <div className="button-group block">
                <button 
                  onClick={handleDownloadDXF}
                  className="button button--secondary button--block margin-bottom--sm">
                  Download .DXF (2D)
                </button>
                
                <button 
                  onClick={handleDownloadSTEP}
                  disabled={isGeneratingStep}
                  className={`button button--primary button--block ${isGeneratingStep ? 'button--loading' : ''}`}>
                  {isGeneratingStep ? 'Generating 3D...' : 'Download .STEP (3D)'}
                </button>
              </div>
              
              {isGeneratingStep && (
                <small className="display-block margin-top--sm text--center text--muted">
                  Processing geometry in browser...
                </small>
              )}

            </div>
          </div>
        </div>

        {/* Превью */}
        <div className="col col--8">
          <div className="card shadow--md" style={{height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff'}}>
             <canvas ref={canvasRef} style={{width: '100%', height: '100%', maxHeight: '580px'}} />
          </div>
          <div className="margin-top--md text--center">
             <p>Превью обновляется автоматически. Нажмите "Download .STEP" для получения 3D модели.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TubeSheetGenerator() {
  return (
    <Layout
      title="Tube Sheet Generator"
      description="Generate parametric tube sheets in DXF and STEP formats">
      <BrowserOnly fallback={<div>Loading 3D Kernel...</div>}>
        {() => <GeneratorContent />}
      </BrowserOnly>
    </Layout>
  );
}
