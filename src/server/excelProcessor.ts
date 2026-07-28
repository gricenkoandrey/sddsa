import ExcelJS from 'exceljs';
import {
  ShiftConfig,
  RawPassRecord,
  EmployeeInfo,
  DailyAttendanceRecord,
  EmployeeReportGroup,
  ProcessedReportResult,
} from '../types.js';

export const DEFAULT_SHIFT_CONFIG: ShiftConfig = {
  dayStartMins: 8 * 60 + 30, // 08:30 (510)
  dayEndMins: 17 * 60 + 30,  // 17:30 (1050)
  eveningStartMins: 17 * 60, // 17:00 (1020)
  eveningEndMins: 24 * 60,   // 24:00 (1440)
  nightStartMins: 21 * 60,   // 21:00 (1260)
  nightEndMins: 6 * 60 + 24 * 60, // 06:00 next day (1800)
  thresholdEveningMins: 14 * 60, // 14:00 (840)
  thresholdNightMins: 21 * 60,   // 21:00 (1260)
  lunchWindowStartMins: 12 * 60, // 12:00 (720)
  lunchWindowEndMins: 14 * 60,   // 14:00 (840)
  lunchFixedEndMins: 13 * 60 + 30, // 13:30 (810)
};

// Helper to format minutes to HH:MM
export function minsToTimeStr(mins: number): string {
  if (mins === undefined || mins === null || mins === -1 || isNaN(mins)) {
    return '';
  }
  let displayMin = mins;
  if (mins >= 24 * 60) {
    displayMin = mins - 24 * 60;
  }
  const h = Math.floor(displayMin / 60);
  const m = Math.floor(displayMin % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper to format total violation minutes to HH:MM:00
export function minsToDurationStr(totalMins: number | null | undefined): string {
  if (!totalMins || totalMins <= 0 || isNaN(totalMins)) {
    return '';
  }
  const total = Math.floor(totalMins);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

// Format date YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date DD.MM.YYYY
function formatDateRU(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

// Parse string or cell value to DD.MM.YYYY Date
function parseDateStr(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }
  const str = String(val).trim().split(' ')[0];
  if (!str) return null;

  // Try DD.MM.YYYY
  const partsDots = str.split('.');
  if (partsDots.length === 3) {
    const day = parseInt(partsDots[0], 10);
    const month = parseInt(partsDots[1], 10) - 1;
    const year = parseInt(partsDots[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Try YYYY-MM-DD
  const partsDashes = str.split('-');
  if (partsDashes.length === 3) {
    const year = parseInt(partsDashes[0], 10);
    const month = parseInt(partsDashes[1], 10) - 1;
    const day = parseInt(partsDashes[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Helper to calculate shift params
export function getShiftParams(
  firstIn: number,
  lastOut: number,
  config: ShiftConfig = DEFAULT_SHIFT_CONFIG
): { startMins: number; endMins: number; lastOutCorr: number } {
  if (firstIn === -1 || lastOut === -1) {
    return {
      startMins: config.dayStartMins,
      endMins: config.dayEndMins,
      lastOutCorr: lastOut,
    };
  }

  let startMins: number;
  let endMins: number;

  if (firstIn < config.thresholdEveningMins) {
    startMins = config.dayStartMins;
    endMins = config.dayEndMins;
  } else if (firstIn < config.thresholdNightMins) {
    startMins = config.eveningStartMins;
    endMins = config.eveningEndMins;
  } else {
    startMins = config.nightStartMins;
    endMins = config.nightEndMins;
  }

  let lastOutCorr = lastOut;
  if (lastOut < firstIn) {
    lastOutCorr = lastOut + 24 * 60;
  }

  return { startMins, endMins, lastOutCorr };
}

// Helper to calculate late & early minutes
export function calcLateEarly(
  firstIn: number,
  lastOut: number,
  config: ShiftConfig = DEFAULT_SHIFT_CONFIG
): { lateMins: number; earlyMins: number; totalMins: number | null } {
  if (firstIn === -1 || lastOut === -1) {
    return { lateMins: 0, earlyMins: 0, totalMins: null };
  }
  const { startMins, endMins, lastOutCorr } = getShiftParams(firstIn, lastOut, config);
  const lateMins = Math.max(firstIn - startMins, 0);
  const earlyMins = Math.max(endMins - lastOutCorr, 0);
  const totalMins = lateMins + earlyMins;
  return {
    lateMins,
    earlyMins,
    totalMins: totalMins > 0 ? totalMins : null,
  };
}

// Core excel file processor
export async function processExcelBuffer(
  buffer: Buffer,
  config: ShiftConfig = DEFAULT_SHIFT_CONFIG
): Promise<ProcessedReportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Файл не содержит листов.');
  }

  // 1. Extract Period Dates from rows 1..10
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  for (let r = 1; r <= Math.min(12, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= Math.min(10, row.cellCount); c++) {
      const val = row.getCell(c).value;
      const valStr = val ? String(val).trim() : '';

      if (valStr.includes('Начало периода:')) {
        // Look in adjacent cells
        const nextVal = row.getCell(c + 1).value || row.getCell(c + 2).value;
        if (nextVal) startDate = parseDateStr(nextVal);
      }
      if (valStr.includes('Конец периода:')) {
        const nextVal = row.getCell(c + 1).value || row.getCell(c + 2).value;
        if (nextVal) endDate = parseDateStr(nextVal);
      }
    }
  }

  // Fallback if not found in top rows
  if (!startDate || !endDate) {
    // Attempt scan across whole sheet top 15 rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 15) {
        row.eachCell((cell) => {
          const text = String(cell.value || '');
          if (text.includes('Начало периода:')) {
            const match = text.match(/\d{2}\.\d{2}\.\d{4}/) || text.match(/\d{4}-\d{2}-\d{2}/);
            if (match) startDate = parseDateStr(match[0]);
          }
          if (text.includes('Конец периода:')) {
            const match = text.match(/\d{2}\.\d{2}\.\d{4}/) || text.match(/\d{4}-\d{2}-\d{2}/);
            if (match) endDate = parseDateStr(match[0]);
          }
        });
      }
    });
  }

  if (!startDate || !endDate) {
    throw new Error('Не удалось найти даты начала и конца периода в файле.');
  }

  if (startDate > endDate) {
    throw new Error('Начало периода позже конца периода.');
  }

  // 2. Read table rows starting after row 6
  // Columns expected: ['Дата', 'Отдел', 'ФИО', 'Таб_№', 'Должность', 'Время', 'Точка_доступа', 'Направление']
  const rawRecords: RawPassRecord[] = [];
  let lastData: { date: string; dept: string; fio: string; tabNum: string; position: string } = {
    date: '',
    dept: '',
    fio: '',
    tabNum: '',
    position: '',
  };

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= 6) return; // Skip header metadata

    const cellVal = (c: number) => {
      const v = row.getCell(c).value;
      if (v === null || v === undefined) return '';
      if (typeof v === 'object' && 'result' in v) return String(v.result || '');
      if (v instanceof Date) return formatDate(v);
      return String(v).trim();
    };

    let dateVal = cellVal(1);
    let deptVal = cellVal(2);
    let fioVal = cellVal(3);
    let tabNumVal = cellVal(4);
    let posVal = cellVal(5);
    const timeVal = cellVal(6);
    const accessPointVal = cellVal(7);
    const directionVal = cellVal(8);

    // Skip header row if matches column titles
    if (dateVal.toLowerCase() === 'дата' || fioVal.toLowerCase() === 'фио') {
      return;
    }

    // Forward fill metadata columns
    if (dateVal) lastData.date = dateVal;
    else dateVal = lastData.date;

    if (deptVal) lastData.dept = deptVal;
    else deptVal = lastData.dept;

    if (fioVal) lastData.fio = fioVal;
    else fioVal = lastData.fio;

    if (tabNumVal) lastData.tabNum = tabNumVal;
    else tabNumVal = lastData.tabNum;

    if (posVal) lastData.position = posVal;
    else posVal = lastData.position;

    if (!dateVal || !fioVal || !timeVal) {
      return;
    }

    rawRecords.push({
      date: dateVal,
      department: deptVal,
      fio: fioVal,
      tabNum: tabNumVal,
      position: posVal,
      time: timeVal,
      accessPoint: accessPointVal,
      direction: directionVal.toLowerCase(),
    });
  });

  if (rawRecords.length === 0) {
    throw new Error('Не найдено записей с данными проходов в файле.');
  }

  // 3. Separate normal passes vs. lunch passes ('Асхана')
  const normalPasses: Array<{
    fio: string;
    position: string;
    dateKey: string; // YYYY-MM-DD
    timeMins: number;
    direction: string;
  }> = [];

  const lunchPasses: Array<{
    fio: string;
    dateKey: string;
    timeMins: number;
    direction: string;
  }> = [];

  const employeeMap = new Map<string, EmployeeInfo>();

  for (const rec of rawRecords) {
    const dt = parseDateStr(rec.date);
    if (!dt) continue;
    const dateKey = formatDate(dt);

    // Save employee info
    if (!employeeMap.has(rec.fio)) {
      employeeMap.set(rec.fio, {
        fio: rec.fio,
        position: rec.position || '—',
        tabNum: rec.tabNum,
        department: rec.department,
      });
    }

    // Time in minutes
    const timeParts = rec.time.split(':');
    if (timeParts.length < 2) continue;
    const hrs = parseInt(timeParts[0], 10);
    const mins = parseInt(timeParts[1], 10);
    if (isNaN(hrs) || isNaN(mins)) continue;
    const totalTimeMins = hrs * 60 + mins;

    const isCafeteria = rec.accessPoint.toLowerCase().includes('асхана');

    if (isCafeteria) {
      lunchPasses.push({
        fio: rec.fio,
        dateKey,
        timeMins: totalTimeMins,
        direction: rec.direction,
      });
    } else {
      normalPasses.push({
        fio: rec.fio,
        position: rec.position,
        dateKey,
        timeMins: totalTimeMins,
        direction: rec.direction,
      });
    }
  }

  // Group entries & exits for normal passes
  // Key: `${fio}_${dateKey}`
  const dayNormalMap = new Map<
    string,
    { firstIn: number; lastOut: number; position: string }
  >();

  for (const pass of normalPasses) {
    const key = `${pass.fio}_${pass.dateKey}`;
    let item = dayNormalMap.get(key);
    if (!item) {
      item = { firstIn: -1, lastOut: -1, position: pass.position };
      dayNormalMap.set(key, item);
    }

    if (pass.direction.includes('вход')) {
      if (item.firstIn === -1 || pass.timeMins < item.firstIn) {
        item.firstIn = pass.timeMins;
      }
    } else if (pass.direction.includes('выход')) {
      if (item.lastOut === -1 || pass.timeMins > item.lastOut) {
        item.lastOut = pass.timeMins;
      }
    }
  }

  // Group lunch breaks
  // Lunch logic: entry between lunchWindowStartMins (12:00) and lunchWindowEndMins (14:00)
  const dayLunchMap = new Map<string, { startMins: number; endMins: number }>();

  for (const lPass of lunchPasses) {
    if (
      lPass.direction.includes('вход') &&
      lPass.timeMins >= config.lunchWindowStartMins &&
      lPass.timeMins <= config.lunchWindowEndMins
    ) {
      const key = `${lPass.fio}_${lPass.dateKey}`;
      const existing = dayLunchMap.get(key);
      if (!existing || lPass.timeMins < existing.startMins) {
        dayLunchMap.set(key, {
          startMins: lPass.timeMins,
          endMins: config.lunchFixedEndMins,
        });
      }
    }
  }

  // 4. Generate Daily Range & Report Groups
  const dateRange: Date[] = [];
  let curr = new Date(startDate.getTime());
  while (curr <= endDate) {
    dateRange.push(new Date(curr.getTime()));
    curr.setDate(curr.getDate() + 1);
  }

  const employeeGroups: EmployeeReportGroup[] = [];
  let empIdx = 1;

  let globalTotalViolations = 0;
  let globalTotalLateEvents = 0;
  let globalTotalEarlyEvents = 0;
  let globalTotalMissingPunches = 0;
  let globalTotalLunchBreaks = 0;
  let globalTotalViolationMins = 0;

  const dayOfWeekNames = [
    'воскресенье',
    'понедельник',
    'вторник',
    'среда',
    'четверг',
    'пятница',
    'суббота',
  ];

  for (const [fio, empInfo] of employeeMap.entries()) {
    const dailyRecords: DailyAttendanceRecord[] = [];
    let groupViolationsCount = 0;
    let groupViolationMins = 0;
    let groupLateMins = 0;
    let groupEarlyMins = 0;
    let groupMissingPunches = 0;

    for (const d of dateRange) {
      const dateKey = formatDate(d);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let dateStr = dateKey;
      if (isWeekend) {
        dateStr = dayOfWeek === 6 ? 'суббота' : 'воскресенье';
      }

      const passData = dayNormalMap.get(`${fio}_${dateKey}`);
      const lunchData = dayLunchMap.get(`${fio}_${dateKey}`);

      const firstInMins = passData ? passData.firstIn : -1;
      const lastOutMins = passData ? passData.lastOut : -1;

      const firstInStr =
        firstInMins !== -1 ? minsToTimeStr(firstInMins) : 'нет входа';

      let lastOutCorrMins = -1;
      let lastOutStr = 'нет выхода';

      if (lastOutMins !== -1) {
        const shift = getShiftParams(firstInMins, lastOutMins, config);
        lastOutCorrMins = shift.lastOutCorr;
        lastOutStr = minsToTimeStr(lastOutCorrMins % (24 * 60));
      }

      const lunchStartStr = lunchData ? minsToTimeStr(lunchData.startMins) : '';
      const lunchEndStr = lunchData ? minsToTimeStr(lunchData.endMins) : '';

      if (lunchData) {
        globalTotalLunchBreaks++;
      }

      // Violations
      const { lateMins, earlyMins, totalMins } = calcLateEarly(
        firstInMins,
        lastOutMins,
        config
      );

      const shiftParams = getShiftParams(firstInMins, lastOutMins, config);
      const isLate =
        firstInMins !== -1 && firstInMins > shiftParams.startMins;
      const isEarlyExit =
        lastOutMins !== -1 && shiftParams.lastOutCorr < shiftParams.endMins;

      const hasViolation = (totalMins !== null && totalMins > 0) || isLate || isEarlyExit;
      const totalViolationTimeStr = minsToDurationStr(totalMins);

      const missingIn = firstInMins === -1;
      const missingOut = lastOutMins === -1;

      if (missingIn || missingOut) {
        groupMissingPunches++;
        globalTotalMissingPunches++;
      }

      if (isLate) globalTotalLateEvents++;
      if (isEarlyExit) globalTotalEarlyEvents++;

      if (hasViolation) {
        groupViolationsCount++;
        globalTotalViolations++;
        if (totalMins) {
          groupViolationMins += totalMins;
          globalTotalViolationMins += totalMins;
        }
        groupLateMins += lateMins;
        groupEarlyMins += earlyMins;
      }

      dailyRecords.push({
        dateStr,
        rawDate: dateKey,
        isWeekend,
        dayOfWeekStr: dayOfWeekNames[dayOfWeek],
        firstInMins,
        firstInStr,
        lastOutMins,
        lastOutCorrMins,
        lastOutStr,
        lunchStartStr,
        lunchEndStr,
        lateMins,
        earlyMins,
        totalViolationMins: totalMins || 0,
        totalViolationTimeStr,
        isLate,
        isEarlyExit,
        hasViolation,
        missingIn,
        missingOut,
        note: '',
      });
    }

    employeeGroups.push({
      index: empIdx++,
      employee: empInfo,
      dailyRecords,
      totalViolationsCount: groupViolationsCount,
      totalViolationMinutes: groupViolationMins,
      totalLateMinutes: groupLateMins,
      totalEarlyMinutes: groupEarlyMins,
      missingPunchDays: groupMissingPunches,
    });
  }

  const notesText = [
    'Необходимо пояснение/аналитика',
    'За отчетный период зафиксированы следующие отклонения от регламента:',
    'Например, ФИО сотрудника по которому вывялено нарушение, проведена ли разъяснительная работа',
    'Невыход/прогул без уважительной причины по сотруднику, составлен акт, затребована объяснительная записка',
  ];

  const formattedPeriod = `${formatDateRU(startDate)} - ${formatDateRU(endDate)}`;
  const filename = `Информация об учете рабочего времени_${formatDateRU(startDate)}_${formatDateRU(endDate)}.xlsx`;

  return {
    filename,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    formattedPeriod,
    employeeGroups,
    summaryMetrics: {
      totalEmployees: employeeMap.size,
      totalDays: dateRange.length,
      totalViolations: globalTotalViolations,
      totalLateEvents: globalTotalLateEvents,
      totalEarlyEvents: globalTotalEarlyEvents,
      totalMissingPunches: globalTotalMissingPunches,
      totalLunchBreaksLogged: globalTotalLunchBreaks,
      totalViolationMinutes: globalTotalViolationMins,
    },
    shiftConfig: config,
    notesText,
  };
}

// Generate styled Excel workbook matching openpyxl script specification exactly
export async function generateExcelReportBuffer(
  reportData: ProcessedReportResult
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('общий');

  // Page setup & view settings
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 8 }];

  // Column Widths matching Python col_widths:
  // {'A': 8, 'B': 30, 'C': 25, 'D': 15, 'E': 12, 'F': 12, 'G': 15, 'H': 15, 'I': 20, 'J': 20}
  ws.columns = [
    { key: 'A', width: 8 },
    { key: 'B', width: 30 },
    { key: 'C', width: 25 },
    { key: 'D', width: 15 },
    { key: 'E', width: 12 },
    { key: 'F', width: 12 },
    { key: 'G', width: 15 },
    { key: 'H', width: 15 },
    { key: 'I', width: 20 },
    { key: 'J', width: 20 },
  ];

  // 1. Header Metadata block (Rows 1..7)
  ws.mergeCells('A1:J1');
  const r1 = ws.getCell('A1');
  r1.value = 'ИНФОРМАЦИЯ';
  r1.font = { name: 'Calibri', bold: true, size: 14 };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('A2:J2');
  const r2 = ws.getCell('A2');
  r2.value = 'об учете рабочего времени';
  r2.font = { name: 'Calibri', bold: true, size: 12 };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.getRow(3).height = 5;

  ws.mergeCells('A4:J4');
  const r4 = ws.getCell('A4');
  r4.value = `Упрощенный отчет: с ${reportData.formattedPeriod}`;
  r4.font = { name: 'Calibri', bold: true, size: 11 };
  r4.alignment = { horizontal: 'center', vertical: 'middle' };

  // 2. Table Headers at Row 8
  const headers = [
    '№ пп',
    'Сотрудник',
    'Должность',
    'Дата',
    'Начало дня',
    'Конец дня',
    'Обеденный перерыв начало',
    'Обеденный перерыв конец',
    'Итоговое количество опозданий и ранних уходов',
    'Причина неявки',
  ];

  const headerRow = ws.getRow(8);
  headers.forEach((h, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', bold: true, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 30;

  // 3. Populate Data Rows starting row 9
  let currentRow = 9;
  const redFont = { name: 'Calibri', color: { argb: 'FFFF0000' } };
  const regularFont = { name: 'Calibri' };
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };

  for (const group of reportData.employeeGroups) {
    const empSummaryRowIndex = currentRow;
    const dailyStartRowIndex = currentRow + 1;
    const dailyEndRowIndex = currentRow + group.dailyRecords.length;

    // A) Summary Row for Employee
    const empRow = ws.getRow(empSummaryRowIndex);
    empRow.getCell(1).value = group.index;
    empRow.getCell(2).value = group.employee.fio;
    empRow.getCell(3).value = group.employee.position;
    empRow.getCell(4).value = '';
    empRow.getCell(5).value = '';
    empRow.getCell(6).value = '';
    empRow.getCell(7).value = '';
    empRow.getCell(8).value = '';
    // Formula for sum of total violation times of this employee
    empRow.getCell(9).value = {
      formula: `SUM(I${dailyStartRowIndex}:I${dailyEndRowIndex})`,
    };
    empRow.getCell(10).value = '';

    // Style summary row
    for (let c = 1; c <= 10; c++) {
      const cell = empRow.getCell(c);
      cell.font = { name: 'Calibri', bold: true };
      cell.border = thinBorder;
      cell.alignment = c === 2 || c === 3 ? { horizontal: 'left', vertical: 'middle' } : { horizontal: 'center', vertical: 'middle' };
    }

    currentRow++;

    // B) Daily Rows for Employee
    for (const record of group.dailyRecords) {
      const dayRow = ws.getRow(currentRow);
      dayRow.getCell(1).value = '';
      dayRow.getCell(2).value = group.employee.fio;
      dayRow.getCell(3).value = group.employee.position;
      dayRow.getCell(4).value = record.dateStr;
      dayRow.getCell(5).value = record.firstInStr;
      dayRow.getCell(6).value = record.lastOutStr;
      dayRow.getCell(7).value = record.lunchStartStr;
      dayRow.getCell(8).value = record.lunchEndStr;
      dayRow.getCell(9).value = record.totalViolationTimeStr;
      dayRow.getCell(10).value = record.note;

      // Apply cell formatting
      const isEven = currentRow % 2 === 0;
      for (let c = 1; c <= 10; c++) {
        const cell = dayRow.getCell(c);
        cell.border = thinBorder;
        cell.alignment = c === 2 || c === 3 ? { horizontal: 'left', vertical: 'middle' } : { horizontal: 'center', vertical: 'middle' };

        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' },
          };
        }

        // Apply Red Font for violations
        if (c === 5 && record.isLate) {
          cell.font = redFont;
        } else if (c === 6 && record.isEarlyExit) {
          cell.font = redFont;
        } else if (c === 9 && record.totalViolationTimeStr) {
          cell.font = redFont;
        } else {
          cell.font = regularFont;
        }
      }

      currentRow++;
    }
  }

  const lastDataRow = currentRow - 1;

  // Add empty separator row
  currentRow++;

  // 4. Trailing Notes Block
  for (const noteLine of reportData.notesText) {
    const noteRow = ws.getRow(currentRow);
    noteRow.getCell(2).value = noteLine;
    noteRow.getCell(2).font = { name: 'Calibri', italic: true, size: 10 };
    currentRow++;
  }

  // 5. AutoFilter setup
  ws.autoFilter = `A8:J${lastDataRow}`;

  // Return workbook buffer
  const uint8Array = await workbook.xlsx.writeBuffer();
  return Buffer.from(uint8Array);
}

// Generate a realistic sample input file matching 'asdasda_2_2.xlsx' format
export async function createSampleInputExcelBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Sheet1');

  // Metadata block at top
  ws.getCell('C2').value = 'Начало периода:';
  ws.getCell('D2').value = '16.03.2024';

  ws.getCell('C3').value = 'Конец периода:';
  ws.getCell('D3').value = '31.03.2024';

  // Header row at row 7 (skiprows=6)
  const headers = [
    'Дата',
    'Отдел',
    'ФИО',
    'Таб_№',
    'Должность',
    'Время',
    'Точка_доступа',
    'Направление',
    'Unnamed',
  ];
  const headerRow = ws.getRow(7);
  headers.forEach((h, idx) => {
    headerRow.getCell(idx + 1).value = h;
  });

  // Sample employee records
  const sampleData = [
    // Employee 1: Иванов И.И. (Day shift 08:30-17:30, has lateness on 16th and lunch pass)
    { d: '2024-03-16', dept: 'ИТ Отдел', fio: 'Иванов Иван Иванович', tab: '001', pos: 'Инженер', t: '08:45', ap: 'Главный Вход (Турникет 1)', dir: 'вход' },
    { d: '2024-03-16', dept: 'ИТ Отдел', fio: 'Иванов Иван Иванович', tab: '001', pos: 'Инженер', t: '12:15', ap: 'Столовая Асхана', dir: 'вход' },
    { d: '2024-03-16', dept: 'ИТ Отдел', fio: 'Иванов Иван Иванович', tab: '001', pos: 'Инженер', t: '17:30', ap: 'Главный Вход (Турникет 1)', dir: 'выход' },
    
    { d: '2024-03-17', dept: 'ИТ Отдел', fio: 'Иванов Иван Иванович', tab: '001', pos: 'Инженер', t: '08:25', ap: 'Главный Вход (Турникет 1)', dir: 'вход' },
    { d: '2024-03-17', dept: 'ИТ Отдел', fio: 'Иванов Иван Иванович', tab: '001', pos: 'Инженер', t: '17:15', ap: 'Главный Вход (Турникет 1)', dir: 'выход' }, // early departure

    // Employee 2: Петров П.П. (Evening shift 17:00-24:00)
    { d: '2024-03-16', dept: 'Бухгалтерия', fio: 'Петрова Анна Сергеевна', tab: '002', pos: 'Главный Бухгалтер', t: '17:10', ap: 'Центральный Вход', dir: 'вход' },
    { d: '2024-03-16', dept: 'Бухгалтерия', fio: 'Петрова Анна Сергеевна', tab: '002', pos: 'Главный Бухгалтер', t: '23:55', ap: 'Центральный Вход', dir: 'выход' },

    // Employee 3: Смирнов А.В. (On-time)
    { d: '2024-03-16', dept: 'Отдел Продаж', fio: 'Смирнов Алексей Владимирович', tab: '003', pos: 'Менеджер', t: '08:20', ap: 'Главный Вход', dir: 'вход' },
    { d: '2024-03-16', dept: 'Отдел Продаж', fio: 'Смирнов Алексей Владимирович', tab: '003', pos: 'Менеджер', t: '12:30', ap: 'Асхана Буфет', dir: 'вход' },
    { d: '2024-03-16', dept: 'Отдел Продаж', fio: 'Смирнов Алексей Владимирович', tab: '003', pos: 'Менеджер', t: '17:40', ap: 'Главный Вход', dir: 'выход' },
  ];

  let rIdx = 8;
  for (const item of sampleData) {
    const row = ws.getRow(rIdx);
    row.getCell(1).value = item.d;
    row.getCell(2).value = item.dept;
    row.getCell(3).value = item.fio;
    row.getCell(4).value = item.tab;
    row.getCell(5).value = item.pos;
    row.getCell(6).value = item.t;
    row.getCell(7).value = item.ap;
    row.getCell(8).value = item.dir;
    rIdx++;
  }

  const uint8Array = await workbook.xlsx.writeBuffer();
  return Buffer.from(uint8Array);
}
