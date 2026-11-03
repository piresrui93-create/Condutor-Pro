import * as XLSX from 'xlsx';
import { Question, QuestionCategory, QuestionDifficulty, DriverCategory, ALL_DRIVER_CATEGORIES } from '../types';

export interface ColumnMapping {
  questionCol: string;
  optionACol: string;
  optionBCol: string;
  optionCCol?: string;
  correctCol: string;
  imageCol?: string;
  categoryCol?: string;
  explanationCol?: string;
  articleCol?: string;
  difficultyCol?: string;
  targetCategoryCol?: string;
}

export interface ExcelInspectResult {
  headers: string[];
  rawRows: Record<string, any>[];
  detectedMapping: Partial<ColumnMapping>;
  totalRows: number;
  fileName: string;
  detectedDelimiter?: string;
}

export interface ExcelParseResult {
  questions: Question[];
  errors: string[];
  totalRows: number;
}

const VALID_CATEGORIES: QuestionCategory[] = [
  'Sinais de Trânsito',
  'Regras de Prioridade e Cruzamentos',
  'Velocidades e Distâncias',
  'Manobras e Vias Especiais',
  'Segurança Rodoviária, Luzes e Álcool',
  'Mecânica Básica e Equipamentos'
];

export const FALLBACK_SCENE_IMAGES = [
  '/src/assets/images/hero_driving_simulator_1793442879807.jpg',
  '/src/assets/images/traffic_roundabout_junction_1793442880154.jpg',
  '/src/assets/images/highway_speed_limit_1793442881776.jpg',
  '/src/assets/images/crossroad_priority_1793442881747.jpg',
  '/src/assets/images/night_fog_lighting_1793442881655.jpg',
];

/**
 * Strips accents, lowers case, and removes non-alphanumeric chars
 * e.g. "Opção A" -> "opcaoa", "Questão" -> "questao", "Explicação" -> "explicacao"
 */
export function normalizeColumnKey(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Extracts a clean image URL even if exported from Airtable attachment format:
 * e.g. "image_01.jpg (https://v5.airtableusercontent.com/...)" or plain URL
 */
export function cleanImageUrl(raw: any, index = 0): string {
  const fallback = FALLBACK_SCENE_IMAGES[index % FALLBACK_SCENE_IMAGES.length];
  if (!raw) return fallback;
  const str = String(raw).trim();
  if (!str) return fallback;

  // Handle Airtable JSON attachment format: [{"url": "https://..."}]
  if (str.startsWith('[{') && str.includes('url')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed) && parsed[0]?.url) {
        return parsed[0].url;
      }
    } catch {
      // not JSON, continue below
    }
  }

  // Extract URL inside parentheses if from Airtable CSV (e.g. "photo.jpg (https://v5.airtableusercontent.com/...)")
  const match = str.match(/\((https?:\/\/[^\s)]+)\)/i);
  if (match && match[1]) {
    return match[1];
  }

  // Look for any standard http/https URL in the string
  const urlMatch = str.match(/(https?:\/\/[^\s"'<>]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Local assets or base64 data URLs
  if (str.startsWith('/') || str.startsWith('data:image/')) {
    return str;
  }

  return fallback;
}

/**
 * Robust CSV/TSV/DSV parser supporting:
 * - RFC 4180 quotes ("...")
 * - Escaped double quotes ("" inside quotes)
 * - Multiline rows inside quotes
 * - Auto delimiter detection (semicolon ;, comma ,, tab \t, pipe |)
 * - Strips UTF-8 BOM
 */
export function parseDelimitedText(
  rawText: string,
  forcedDelimiter?: string
): { headers: string[]; rows: Record<string, any>[]; detectedDelimiter: string } {
  const text = rawText.replace(/^\uFEFF/, '').trim();
  if (!text) return { headers: [], rows: [], detectedDelimiter: ',' };

  // Detect delimiter if not forced
  let delimiter = forcedDelimiter;
  if (!delimiter) {
    const firstLines = text.split(/\r?\n/).slice(0, 10).join('\n');
    let inQuotes = false;
    const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0, '|': 0 };

    for (let i = 0; i < firstLines.length; i++) {
      const c = firstLines[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (counts[c] !== undefined) counts[c]++;
      }
    }

    let maxCount = -1;
    let bestDelim = ',';
    for (const [delim, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        bestDelim = delim;
      }
    }
    delimiter = maxCount > 0 ? bestDelim : ',';
  }

  // Tokenize cells respecting quotes & newlines
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote "" -> "
        currentCell += '"';
        i++;
      } else {
        // Toggle quotes
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  // Push final cell and row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return { headers: [], rows: [], detectedDelimiter: delimiter };

  // Headers are in the first row
  const headers = rows[0].map((h, i) => {
    const cleanHeader = h.replace(/^["']|["']$/g, '').trim();
    return cleanHeader || `Coluna_${i + 1}`;
  });

  const dataRows: Record<string, any>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const rowCells = rows[r];
    // Skip totally empty rows
    if (rowCells.length === 0 || (rowCells.length === 1 && !rowCells[0])) continue;

    const rowObj: Record<string, any> = {};
    headers.forEach((header, colIndex) => {
      rowObj[header] = rowCells[colIndex] !== undefined ? rowCells[colIndex] : '';
    });
    dataRows.push(rowObj);
  }

  return { headers, rows: dataRows, detectedDelimiter: delimiter };
}

/**
 * Auto-detects the best column matches from a list of headers
 */
export function autoDetectMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};

  headers.forEach(header => {
    const norm = normalizeColumnKey(header);

    // Question column
    if (!mapping.questionCol) {
      if (
        ['pergunta', 'perguntas', 'questao', 'questoes', 'enunciado', 'name', 'question', 'questions', 'titulo', 'title', 'item', 'texto'].some(k => norm.includes(k))
      ) {
        mapping.questionCol = header;
      }
    }

    // Correct Answer (match specific correct answer keys first before generic options)
    if (!mapping.correctCol) {
      if (
        ['respostacerta', 'respostacorreta', 'opcaocorreta', 'opcaocerta', 'correta', 'certa', 'correctanswer', 'correct', 'solucao', 'gabarito', 'chave', 'resposta'].some(k => norm.includes(k))
      ) {
        mapping.correctCol = header;
      }
    }

    // Option A
    if (!mapping.optionACol) {
      if (
        ['opcaoa', 'optiona', 'respostaa', 'hipotesea', 'alt1', 'opcao1', 'option1', 'resposta1'].some(k => norm.includes(k)) ||
        norm === 'a' ||
        norm === '1'
      ) {
        mapping.optionACol = header;
      }
    }

    // Option B
    if (!mapping.optionBCol) {
      if (
        ['opcaob', 'optionb', 'respostab', 'hipoteseb', 'alt2', 'opcao2', 'option2', 'resposta2'].some(k => norm.includes(k)) ||
        norm === 'b' ||
        norm === '2'
      ) {
        mapping.optionBCol = header;
      }
    }

    // Option C
    if (!mapping.optionCCol) {
      if (
        ['opcaoc', 'optionc', 'respostac', 'hipotesec', 'alt3', 'opcao3', 'option3', 'resposta3'].some(k => norm.includes(k)) ||
        norm === 'c' ||
        norm === '3'
      ) {
        mapping.optionCCol = header;
      }
    }

    // Image / Photo / Attachments
    if (!mapping.imageCol) {
      if (
        ['imagem', 'fotografia', 'foto', 'attachments', 'attachment', 'photo', 'image', 'anexos', 'anexo', 'imageurl', 'fotourl', 'cenario', 'figura'].some(k => norm.includes(k))
      ) {
        mapping.imageCol = header;
      }
    }

    // Category / Theme
    if (!mapping.categoryCol) {
      if (['tema', 'categoria', 'category', 'modulo', 'capitulo', 'assunto'].some(k => norm.includes(k))) {
        mapping.categoryCol = header;
      }
    }

    // Explanation
    if (!mapping.explanationCol) {
      if (['explicacao', 'explanation', 'justificacao', 'comentario', 'descricao', 'fundamentacao', 'porque'].some(k => norm.includes(k))) {
        mapping.explanationCol = header;
      }
    }

    // Law article
    if (!mapping.articleCol) {
      if (['artigo', 'artigolegal', 'lei', 'law', 'article', 'codigodaestrada', 'ce'].some(k => norm.includes(k))) {
        mapping.articleCol = header;
      }
    }

    // Difficulty
    if (!mapping.difficultyCol) {
      if (['dificuldade', 'difficulty', 'nivel', 'level'].some(k => norm.includes(k))) {
        mapping.difficultyCol = header;
      }
    }

    // Target Driver Category / Course
    if (!mapping.targetCategoryCol) {
      if (['cursocategoria', 'categoriaveiculo', 'habilitacao', 'tipoexame', 'categoriaalvo', 'cursotvde', 'curso', 'licenca'].some(k => norm.includes(k))) {
        mapping.targetCategoryCol = header;
      }
    }
  });

  return mapping;
}

/**
 * Inspects a file (CSV with any delimiter: comma, semicolon, tab; or Excel .xlsx/.xls)
 * and returns headers, raw rows, and detected mapping.
 */
export async function inspectFile(file: File): Promise<ExcelInspectResult> {
  const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');

  if (isCsv) {
    const rawText = await file.text();
    const { headers, rows, detectedDelimiter } = parseDelimitedText(rawText);

    return {
      headers,
      rawRows: rows,
      detectedMapping: autoDetectMapping(headers),
      totalRows: rows.length,
      fileName: file.name,
      detectedDelimiter
    };
  }

  // Excel binary (.xlsx, .xls)
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  if (workbook.SheetNames.length === 0) {
    throw new Error('O ficheiro Excel não contém folhas de cálculo.');
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

  return {
    headers,
    rawRows,
    detectedMapping: autoDetectMapping(headers),
    totalRows: rawRows.length,
    fileName: file.name
  };
}

/**
 * Inspects raw pasted text from clipboard (Airtable table copied with Ctrl+C)
 */
export function inspectPastedText(text: string): ExcelInspectResult {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) {
    throw new Error('O texto colado está vazio.');
  }

  // Direct parse supporting tabs, commas, or semicolons
  const { headers, rows, detectedDelimiter } = parseDelimitedText(cleanText);

  return {
    headers,
    rawRows: rows,
    detectedMapping: autoDetectMapping(headers),
    totalRows: rows.length,
    fileName: 'Dados Colados do Airtable',
    detectedDelimiter
  };
}

/**
 * Converts inspected rows into valid Question models using the confirmed mapping
 */
export function convertRowsToQuestions(
  rawRows: Record<string, any>[],
  mapping: ColumnMapping,
  defaultTargetCategory: DriverCategory | 'Todas as Categorias' = 'Todas as Categorias'
): ExcelParseResult {
  const questions: Question[] = [];
  const errors: string[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;

    const questionText = row[mapping.questionCol];
    const optionA = row[mapping.optionACol];
    const optionB = row[mapping.optionBCol];
    const optionC = mapping.optionCCol ? row[mapping.optionCCol] : undefined;
    const rawCorrect = row[mapping.correctCol];
    const rawImage = mapping.imageCol ? row[mapping.imageCol] : undefined;
    const rawCat = mapping.categoryCol ? row[mapping.categoryCol] : undefined;
    const explanation = mapping.explanationCol ? row[mapping.explanationCol] : undefined;
    const lawArticle = mapping.articleCol ? row[mapping.articleCol] : undefined;
    const rawDiff = mapping.difficultyCol ? row[mapping.difficultyCol] : undefined;

    if (!questionText || String(questionText).trim() === '') {
      errors.push(`Linha ${rowNum}: Enunciado da pergunta vazio (linha ignorada).`);
      return;
    }

    if (!optionA || !optionB) {
      errors.push(`Linha ${rowNum}: Requer no mínimo Opção A e Opção B preenchidas.`);
      return;
    }

    // Determine correct answer (0, 1, 2)
    let correctAnswer = 0;
    const strOptA = String(optionA).trim().toLowerCase();
    const strOptB = String(optionB).trim().toLowerCase();
    const strOptC = optionC ? String(optionC).trim().toLowerCase() : '';

    if (typeof rawCorrect === 'number') {
      if (rawCorrect >= 1 && rawCorrect <= 3) {
        correctAnswer = rawCorrect - 1;
      } else if (rawCorrect >= 0 && rawCorrect <= 2) {
        correctAnswer = rawCorrect;
      }
    } else if (rawCorrect !== undefined && rawCorrect !== null) {
      const clean = String(rawCorrect).trim().toUpperCase();
      const lowerClean = clean.toLowerCase();

      // Check if value is or starts with A, B, C or 1, 2, 3
      if (clean === 'A' || clean === '1' || clean.startsWith('A)') || clean.startsWith('A -') || clean.startsWith('OPÇÃO A') || clean.startsWith('OPCAO A')) {
        correctAnswer = 0;
      } else if (clean === 'B' || clean === '2' || clean.startsWith('B)') || clean.startsWith('B -') || clean.startsWith('OPÇÃO B') || clean.startsWith('OPCAO B')) {
        correctAnswer = 1;
      } else if (clean === 'C' || clean === '3' || clean.startsWith('C)') || clean.startsWith('C -') || clean.startsWith('OPÇÃO C') || clean.startsWith('OPCAO C')) {
        correctAnswer = 2;
      } else if (lowerClean === strOptA) {
        correctAnswer = 0;
      } else if (lowerClean === strOptB) {
        correctAnswer = 1;
      } else if (strOptC && lowerClean === strOptC) {
        correctAnswer = 2;
      } else {
        // Fallback default
        correctAnswer = 0;
      }
    }

    const options = [String(optionA).trim(), String(optionB).trim()];
    if (optionC && String(optionC).trim()) {
      options.push(String(optionC).trim());
    }

    // Category resolution
    let category: QuestionCategory = 'Sinais de Trânsito';
    if (rawCat) {
      const normCat = normalizeColumnKey(String(rawCat));
      const match = VALID_CATEGORIES.find(c =>
        normalizeColumnKey(c).includes(normCat) || normCat.includes(normalizeColumnKey(c))
      );
      if (match) category = match;
    }

    // Target Driver Category / Course resolution
    let targetCategory: DriverCategory | 'Todas as Categorias' = defaultTargetCategory;
    if (mapping.targetCategoryCol && row[mapping.targetCategoryCol]) {
      const rawTarget = String(row[mapping.targetCategoryCol]).trim();
      const normTarget = normalizeColumnKey(rawTarget);
      const matchTarget = ALL_DRIVER_CATEGORIES.find(c =>
        normalizeColumnKey(c).includes(normTarget) || normTarget.includes(normalizeColumnKey(c))
      );
      if (matchTarget) targetCategory = matchTarget;
    }

    const imageUrl = cleanImageUrl(rawImage, index);

    // Difficulty resolution
    let difficulty: QuestionDifficulty = 'medium';
    if (rawDiff) {
      const normDiff = normalizeColumnKey(String(rawDiff));
      if (normDiff.includes('facil') || normDiff.includes('easy')) difficulty = 'easy';
      else if (normDiff.includes('dificil') || normDiff.includes('hard')) difficulty = 'hard';
    }

    questions.push({
      id: `imported-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      question: String(questionText).trim(),
      imageUrl,
      imageCaption: 'Cenário oficial importado.',
      options,
      correctAnswer,
      category,
      targetCategory,
      explanation: explanation ? String(explanation).trim() : 'Consulte as normas e disposições do Código da Estrada.',
      lawArticle: lawArticle ? String(lawArticle).trim() : 'Código da Estrada',
      difficulty,
      failureRate: difficulty === 'hard' ? 52 : difficulty === 'easy' ? 18 : 34
    });
  });

  return {
    questions,
    errors,
    totalRows: rawRows.length
  };
}

/**
 * Fetches questions directly from the Airtable REST API using a Personal Access Token
 */
export async function fetchQuestionsFromAirtableApi(
  personalAccessToken: string,
  baseId: string,
  tableName: string,
  targetCategory: DriverCategory | 'Todas as Categorias' = 'Todas as Categorias'
): Promise<ExcelParseResult> {
  const cleanToken = personalAccessToken.trim();
  const cleanBase = baseId.trim();
  const cleanTable = encodeURIComponent(tableName.trim());

  let allRecords: any[] = [];
  let offset: string | undefined = undefined;

  do {
    const url: string = `https://api.airtable.com/v0/${cleanBase}/${cleanTable}?pageSize=100${offset ? `&offset=${encodeURIComponent(offset)}` : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cleanToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Airtable (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const records = data.records || [];
    allRecords = allRecords.concat(records);
    offset = data.offset;
  } while (offset && allRecords.length < 2000);

  const questions: Question[] = [];
  const errors: string[] = [];

  allRecords.forEach((record: any, index: number) => {
    const fields = record.fields || {};
    
    // Normalize keys
    const normalized: Record<string, any> = {};
    Object.keys(fields).forEach(key => {
      normalized[normalizeColumnKey(key)] = fields[key];
    });

    const questionText = normalized['pergunta'] || normalized['questao'] || normalized['questoes'] || normalized['name'] || normalized['question'] || normalized['enunciado'] || normalized['texto'];
    const optionA = normalized['opcaoa'] || normalized['optiona'] || normalized['a'] || normalized['respostaa'] || normalized['opcao1'];
    const optionB = normalized['opcaob'] || normalized['optionb'] || normalized['b'] || normalized['respostab'] || normalized['opcao2'];
    const optionC = normalized['opcaoc'] || normalized['optionc'] || normalized['c'] || normalized['respostac'] || normalized['opcao3'];
    const rawCorrect = normalized['respostacerta'] || normalized['correctanswer'] || normalized['certa'] || normalized['correct'] || normalized['gabarito'] || normalized['resposta'];

    let imageUrl = cleanImageUrl(null, index);
    const attachments = fields['Attachments'] || fields['Attachment'] || fields['Fotografia'] || fields['Imagem'] || fields['Foto'] || fields['Image'];
    if (Array.isArray(attachments) && attachments.length > 0 && attachments[0].url) {
      imageUrl = attachments[0].url;
    } else if (typeof attachments === 'string') {
      imageUrl = cleanImageUrl(attachments, index);
    }

    if (!questionText || !optionA || !optionB) {
      errors.push(`Registo ${record.id}: campos obrigatórios em falta (pergunta e opções A/B).`);
      return;
    }

    let correctAnswer = 0;
    const strOptA = String(optionA).trim().toLowerCase();
    const strOptB = String(optionB).trim().toLowerCase();
    const strOptC = optionC ? String(optionC).trim().toLowerCase() : '';

    if (typeof rawCorrect === 'number') {
      if (rawCorrect >= 1 && rawCorrect <= 3) {
        correctAnswer = rawCorrect - 1;
      } else if (rawCorrect >= 0 && rawCorrect <= 2) {
        correctAnswer = rawCorrect;
      }
    } else if (rawCorrect !== undefined && rawCorrect !== null) {
      const clean = String(rawCorrect).trim().toUpperCase();
      const lowerClean = clean.toLowerCase();

      if (clean === 'A' || clean === '1' || clean.startsWith('A)') || clean.startsWith('A -') || clean.startsWith('OPÇÃO A') || clean.startsWith('OPCAO A')) {
        correctAnswer = 0;
      } else if (clean === 'B' || clean === '2' || clean.startsWith('B)') || clean.startsWith('B -') || clean.startsWith('OPÇÃO B') || clean.startsWith('OPCAO B')) {
        correctAnswer = 1;
      } else if (clean === 'C' || clean === '3' || clean.startsWith('C)') || clean.startsWith('C -') || clean.startsWith('OPÇÃO C') || clean.startsWith('OPCAO C')) {
        correctAnswer = 2;
      } else if (lowerClean === strOptA) {
        correctAnswer = 0;
      } else if (lowerClean === strOptB) {
        correctAnswer = 1;
      } else if (strOptC && lowerClean === strOptC) {
        correctAnswer = 2;
      }
    }

    const options = [String(optionA).trim(), String(optionB).trim()];
    if (optionC && String(optionC).trim()) options.push(String(optionC).trim());

    const rawCategory = normalized['tema'] || normalized['categoria'] || normalized['category'] || 'Sinais de Trânsito';
    let category: QuestionCategory = 'Sinais de Trânsito';
    const normCat = normalizeColumnKey(String(rawCategory));
    const foundCat = VALID_CATEGORIES.find(c => normalizeColumnKey(c).includes(normCat) || normCat.includes(normalizeColumnKey(c)));
    if (foundCat) category = foundCat;

    const difficulty = String(normalized['dificuldade'] || 'medium').toLowerCase().includes('dificil') ? 'hard' : 'medium';

    questions.push({
      id: `airtable-${record.id || index}-${Date.now()}`,
      question: String(questionText).trim(),
      imageUrl,
      imageCaption: 'Cenário sincronizado do Airtable.',
      options,
      correctAnswer,
      category,
      targetCategory,
      explanation: String(normalized['explicacao'] || normalized['explanation'] || 'Consulte o Código da Estrada português.').trim(),
      lawArticle: String(normalized['artigo'] || normalized['article'] || 'Código da Estrada').trim(),
      difficulty,
      failureRate: difficulty === 'hard' ? 55 : 30
    });
  });

  return {
    questions,
    errors,
    totalRows: allRecords.length
  };
}

/**
 * Generates and downloads a clean, ready-to-fill Excel template for driving questions
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'Pergunta': 'A que velocidade máxima pode transitar um automóvel ligeiro de passageiros numa autoestrada?',
      'Opção A': '100 km/h',
      'Opção B': '120 km/h',
      'Opção C': '90 km/h',
      'Resposta Certa': 'B',
      'Fotografia': '/src/assets/images/highway_speed_limit_1793442881776.jpg',
      'Tema': 'Velocidades e Distâncias',
      'Artigo': 'Artigo 27.º do Código da Estrada',
      'Explicação': 'O limite máximo para ligeiros de passageiros em autoestrada é de 120 km/h.',
      'Dificuldade': 'Fácil'
    },
    {
      'Pergunta': 'Numa rotunda de duas vias, quem pretende sair na primeira saída deve ocupar:',
      'Opção A': 'A via da esquerda',
      'Opção B': 'A via mais à direita',
      'Opção C': 'Qualquer via',
      'Resposta Certa': 'B',
      'Fotografia': '/src/assets/images/traffic_roundabout_junction_1793442880154.jpg',
      'Tema': 'Manobras e Vias Especiais',
      'Artigo': 'Artigo 14.º-A do Código da Estrada',
      'Explicação': 'Para sair na primeira saída, o condutor deve circular na via mais à direita.',
      'Dificuldade': 'Difícil'
    },
    {
      'Pergunta': 'A taxa limite de álcool no sangue para um condutor recém-encartado (regime probatório) é:',
      'Opção A': '0,50 g/l',
      'Opção B': '0,20 g/l',
      'Opção C': '0,00 g/l',
      'Resposta Certa': 'B',
      'Fotografia': '/src/assets/images/crossroad_priority_1793442881747.jpg',
      'Tema': 'Segurança Rodoviária, Luzes e Álcool',
      'Artigo': 'Artigo 81.º do Código da Estrada',
      'Explicação': 'No regime probatório a taxa de alcoolemia tolerada é até 0,20 g/l.',
      'Dificuldade': 'Difícil'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Perguntas_Exame');

  worksheet['!cols'] = [
    { wch: 60 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 45 },
    { wch: 30 },
    { wch: 30 },
    { wch: 50 },
    { wch: 15 },
  ];

  XLSX.writeFile(workbook, 'Modelo_Perguntas_CondutorPRO.xlsx');
}
