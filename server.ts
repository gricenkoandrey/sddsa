import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  processExcelBuffer,
  generateExcelReportBuffer,
  createSampleInputExcelBuffer,
  DEFAULT_SHIFT_CONFIG,
} from './src/server/excelProcessor.js';
import { ShiftConfig, ProcessedReportResult } from './src/types.js';

// In-memory cache for generated report files
const reportCache = new Map<string, { buffer: Buffer; filename: string; report: ProcessedReportResult }>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Multer setup for memory storage (max 20MB Excel files)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Download Sample Input Excel File
  app.get('/api/sample-excel', async (_req, res) => {
    try {
      const sampleBuffer = await createSampleInputExcelBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="asdasda_2_2.xlsx"');
      res.send(sampleBuffer);
    } catch (err: any) {
      console.error('Error generating sample excel:', err);
      res.status(500).json({ error: 'Failed to generate sample Excel file' });
    }
  });

  // 3. Process Sample File directly (Instant Demo)
  app.post('/api/process-sample', async (req, res) => {
    try {
      const customConfig: ShiftConfig = {
        ...DEFAULT_SHIFT_CONFIG,
        ...(req.body.shiftConfig || {}),
      };
      const sampleBuffer = await createSampleInputExcelBuffer();
      const reportResult = await processExcelBuffer(sampleBuffer, customConfig);

      const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const excelBuffer = await generateExcelReportBuffer(reportResult);

      reportCache.set(reportId, {
        buffer: excelBuffer,
        filename: reportResult.filename,
        report: reportResult,
      });

      res.json({
        success: true,
        reportId,
        report: reportResult,
      });
    } catch (err: any) {
      console.error('Error processing sample:', err);
      res.status(500).json({ error: err.message || 'Error processing sample Excel file' });
    }
  });

  // 4. Process Uploaded Excel File
  app.post('/api/process-excel', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Пожалуйста, выберите и загрузите Excel-файл (.xlsx)' });
        return;
      }

      let customConfig: ShiftConfig = DEFAULT_SHIFT_CONFIG;
      if (req.body.shiftConfig) {
        try {
          const parsed = typeof req.body.shiftConfig === 'string'
            ? JSON.parse(req.body.shiftConfig)
            : req.body.shiftConfig;
          customConfig = { ...DEFAULT_SHIFT_CONFIG, ...parsed };
        } catch (e) {
          console.warn('Could not parse shiftConfig, using defaults');
        }
      }

      const reportResult = await processExcelBuffer(req.file.buffer, customConfig);
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const excelBuffer = await generateExcelReportBuffer(reportResult);

      reportCache.set(reportId, {
        buffer: excelBuffer,
        filename: reportResult.filename,
        report: reportResult,
      });

      res.json({
        success: true,
        reportId,
        report: reportResult,
      });
    } catch (err: any) {
      console.error('Error processing excel upload:', err);
      res.status(400).json({ error: err.message || 'Ошибка обработки файла. Убедитесь в корректности формата СКУД.' });
    }
  });

  // 5. Download Processed Excel File by reportId or on-the-fly regeneration
  app.get('/api/download-excel/:reportId', async (req, res) => {
    try {
      const { reportId } = req.params;
      const cached = reportCache.get(reportId);

      if (!cached) {
        res.status(404).send('Запрошенный отчет не найден или срок его действия истек.');
        return;
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(cached.filename)}`);
      res.send(cached.buffer);
    } catch (err: any) {
      console.error('Error serving report download:', err);
      res.status(500).send('Ошибка при загрузке отчета');
    }
  });

  // 6. Direct Excel Generation from JSON payload
  app.post('/api/generate-excel', async (req, res) => {
    try {
      const reportResult: ProcessedReportResult = req.body.report;
      if (!reportResult) {
        res.status(400).json({ error: 'Данные отчета отсутствуют' });
        return;
      }

      const excelBuffer = await generateExcelReportBuffer(reportResult);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(reportResult.filename)}`);
      res.send(excelBuffer);
    } catch (err: any) {
      console.error('Error generating excel from JSON:', err);
      res.status(500).json({ error: 'Ошибка генерации файла' });
    }
  });

  // Vite or Static Assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
