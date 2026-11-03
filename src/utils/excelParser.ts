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
 * Parses any Airtable URL or string to extract Base ID (app...) and Table ID/Name (tbl...)
 * e.g. "https://airtable.com/appM29K38dj/tbl9sKdjw83/viw..." -> { baseId: "appM29K38dj", tableIdOrName: "tbl9sKdjw83" }
 */
export function parseAirtableUrl(input: string): { baseId?: string; tableIdOrName?: string } {
  if (!input) return {};
  const trimmed = input.trim();
  const baseMatch = trimmed.match(/app[a-zA-Z0-9]{10,}/i);
  const tableMatch = trimmed.match(/tbl[a-zA-Z0-9]{10,}/i);
  return {
    baseId: baseMatch ? baseMatch[0] : undefined,
    tableIdOrName: tableMatch ? tableMatch[0] : undefined
  };
}

/**
 * Fetches questions directly from the Airtable REST API using a Personal Access Token
 * Explicitly maps the 8 specified columns:
 * 1. Pergunta (Question text)
 * 2. ID (Unique stable question ID)
 * 3. Tema (Topic / Category)
 * 4. Imagem (Image attachment or URL)
 * 5. nome da Imagem (Image caption / descriptive name)
 * 6. Opção A (Choice A)
 * 7. Opção B (Choice B)
 * 8. Resposta Correta (Correct answer A or B)
 */
export async function fetchQuestionsFromAirtableApi(
  personalAccessToken: string,
  baseId: string,
  tableName: string,
  targetCategory: DriverCategory | 'Todas as Categorias' = 'Todas as Categorias'
): Promise<ExcelParseResult> {
  const cleanToken = personalAccessToken
    .replace(/^Bearer\s+/i, '')
    .replace(/[\r\n\t"']/g, '')
    .trim();
  
  let cleanBase = baseId.replace(/[\r\n\t"']/g, '').trim();
  let cleanTable = tableName.replace(/[\r\n\t"']/g, '').trim();

  // If user pasted a full Airtable URL in baseId or tableName, auto-extract
  const parsedBase = parseAirtableUrl(cleanBase);
  if (parsedBase.baseId) {
    cleanBase = parsedBase.baseId;
    if (!cleanTable && parsedBase.tableIdOrName) {
      cleanTable = parsedBase.tableIdOrName;
    }
  }

  if (cleanTable.startsWith('http')) {
    const parsedTable = parseAirtableUrl(cleanTable);
    if (parsedTable.tableIdOrName) {
      cleanTable = parsedTable.tableIdOrName;
    }
  }

  if (!cleanBase.startsWith('app') && cleanBase.length < 10) {
    throw new Error('Base ID inválido. No Airtable o Base ID começa com "app..." (ex: appUE8v1QiipoQRKy).');
  }

  const encodedTable = encodeURIComponent(cleanTable);
  let allRecords: any[] = [];
  let offset: string | undefined = undefined;

  do {
    const url: string = `https://api.airtable.com/v0/${cleanBase}/${encodedTable}?pageSize=100${offset ? `&offset=${encodeURIComponent(offset)}` : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cleanToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      let airtableMsg = '';
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error?.message) {
          airtableMsg = ` (${parsed.error.message})`;
        } else if (parsed.error?.type) {
          airtableMsg = ` [${parsed.error.type}]`;
        }
      } catch {
        airtableMsg = errorText ? ` (${errorText.slice(0, 100)})` : '';
      }

      if (response.status === 401) {
        if (cleanToken.startsWith('tok')) {
          throw new Error(`Airtable API (401 - Não Autorizado)${airtableMsg}: O código inserido começa por "tok...". Esse é o "Token ID" (o identificador público) e NÃO o segredo. O token de acesso real começa por "pat..." e só aparece uma vez no ecrã logo após clicar em "Create token".`);
        }
        throw new Error(`Airtable API (401 - Não Autorizado)${airtableMsg}: Certifique-se de que: 1) O token começa por "pat..."; 2) No menu "Access" do token selecionou a base "appUE8v1QiipoQRKy" (ou "All current and future bases"); 3) No menu "Scopes" marcou "data.records:read".`);
      } else if (response.status === 403) {
        throw new Error(`Airtable API (403 - Proibido)${airtableMsg}: O token não tem acesso a esta base. Aceda a airtable.com/create/tokens, edite o seu token e adicione a base à lista "Access".`);
      } else if (response.status === 404) {
        throw new Error(`Airtable API (404 - Não Encontrado)${airtableMsg}: Base ID ("${cleanBase}") ou Tabela ("${cleanTable}") não encontrados. Verifique se o nome da tabela corresponde exatamente ao separador.`);
      }
      throw new Error(`Erro na API Airtable (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const records = data.records || [];
    allRecords = allRecords.concat(records);
    offset = data.offset;
  } while (offset && allRecords.length < 2500);

  const questions: Question[] = [];
  const errors: string[] = [];

  allRecords.forEach((record: any, index: number) => {
    const fields = record.fields || {};
    
    // Normalize keys for case-insensitive / accent-insensitive matching
    const normalized: Record<string, any> = {};
    Object.keys(fields).forEach(key => {
      normalized[normalizeColumnKey(key)] = fields[key];
    });

    // 1. Coluna 1: Pergunta
    const questionText = 
      fields['Pergunta'] || 
      fields['pergunta'] || 
      normalized['pergunta'] || 
      normalized['questao'] || 
      normalized['questoes'] || 
      normalized['name'] || 
      normalized['question'] || 
      normalized['enunciado'] || 
      normalized['texto'];

    // 2. Coluna 2: ID
    const customIdRaw = 
      fields['ID'] !== undefined && fields['ID'] !== null ? fields['ID'] :
      fields['Id'] !== undefined && fields['Id'] !== null ? fields['Id'] :
      fields['id'] !== undefined && fields['id'] !== null ? fields['id'] :
      normalized['id'];
    const customId = customIdRaw !== undefined && customIdRaw !== null && String(customIdRaw).trim() !== ''
      ? String(customIdRaw).trim()
      : null;
    const questionId = customId ? `airtable-${customId}` : `airtable-${record.id}`;

    // 3. Coluna 3: Tema
    const rawCategory = 
      fields['Tema'] || 
      fields['tema'] || 
      normalized['tema'] || 
      normalized['categoria'] || 
      normalized['category'] || 
      'Sinais de Trânsito';
    let category: QuestionCategory = String(rawCategory).trim() || 'Sinais de Trânsito';
    const normCat = normalizeColumnKey(String(rawCategory));
    const foundCat = VALID_CATEGORIES.find(c => 
      normalizeColumnKey(c).includes(normCat) || normCat.includes(normalizeColumnKey(c))
    );
    if (foundCat) category = foundCat;

    // 4. Coluna 4: Imagem (attachments or string URL)
    let imageUrl = '';
    const attachments = 
      fields['Imagem'] || 
      fields['imagem'] || 
      normalized['imagem'] || 
      fields['Fotografia'] || 
      fields['Foto'] || 
      fields['Attachments'] || 
      fields['Attachment'] || 
      fields['Image'];

    if (Array.isArray(attachments) && attachments.length > 0) {
      const first = attachments[0];
      imageUrl = first.thumbnails?.large?.url || first.thumbnails?.full?.url || first.url || '';
    } else if (attachments && typeof attachments === 'object' && attachments.url) {
      imageUrl = attachments.thumbnails?.large?.url || attachments.url;
    } else if (typeof attachments === 'string') {
      imageUrl = cleanImageUrl(attachments, index);
    }
    if (!imageUrl) {
      imageUrl = cleanImageUrl(null, index);
    }

    // 5. Coluna 5: nome da Imagem (caption)
    const rawImageName = 
      fields['nome da Imagem'] || 
      fields['Nome da Imagem'] || 
      fields['nome da imagem'] || 
      normalized['nomedaimagem'] || 
      fields['Legenda'] || 
      fields['legenda'] || 
      normalized['legenda'];
    const imageCaption = rawImageName 
      ? String(rawImageName).trim() 
      : 'Cenário oficial da questão rodoviária.';

    // 6. Coluna 6: Opção A
    const optionA = 
      fields['Opção A'] || 
      fields['Opcao A'] || 
      fields['opcao a'] || 
      normalized['opcaoa'] || 
      normalized['optiona'] || 
      normalized['a'] || 
      normalized['respostaa'] || 
      normalized['opcao1'];

    // 7. Coluna 7: Opção B
    const optionB = 
      fields['Opção B'] || 
      fields['Opcao B'] || 
      fields['opcao b'] || 
      normalized['opcaob'] || 
      normalized['optionb'] || 
      normalized['b'] || 
      normalized['respostab'] || 
      normalized['opcao2'];

    // Optional Opção C (if present in table)
    const optionC = 
      fields['Opção C'] || 
      fields['Opcao C'] || 
      normalized['opcaoc'] || 
      normalized['optionc'] || 
      normalized['c'] || 
      normalized['respostac'] || 
      normalized['opcao3'];

    // 8. Coluna 8: Resposta Correta
    const rawCorrect = 
      fields['Resposta Correta'] || 
      fields['resposta correta'] || 
      fields['Resposta Certa'] || 
      fields['resposta certa'] || 
      normalized['respostacorreta'] || 
      normalized['respostacerta'] || 
      normalized['opcaocorreta'] || 
      normalized['correctanswer'] || 
      normalized['certa'] || 
      normalized['correta'] || 
      normalized['gabarito'] || 
      normalized['resposta'];

    if (!questionText || !optionA || !optionB) {
      errors.push(`Registo ${record.id}: Pergunta ou Opções A/B vazias.`);
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

      if (
        clean === 'A' || clean === '1' ||
        clean.startsWith('A)') || clean.startsWith('A -') || clean.startsWith('A.') ||
        clean.startsWith('OPÇÃO A') || clean.startsWith('OPCAO A') ||
        lowerClean === strOptA
      ) {
        correctAnswer = 0;
      } else if (
        clean === 'B' || clean === '2' ||
        clean.startsWith('B)') || clean.startsWith('B -') || clean.startsWith('B.') ||
        clean.startsWith('OPÇÃO B') || clean.startsWith('OPCAO B') ||
        lowerClean === strOptB
      ) {
        correctAnswer = 1;
      } else if (
        clean === 'C' || clean === '3' ||
        clean.startsWith('C)') || clean.startsWith('C -') || clean.startsWith('C.') ||
        clean.startsWith('OPÇÃO C') || clean.startsWith('OPCAO C') ||
        (strOptC && lowerClean === strOptC)
      ) {
        correctAnswer = 2;
      }
    }

    const options = [String(optionA).trim(), String(optionB).trim()];
    if (optionC && String(optionC).trim()) {
      options.push(String(optionC).trim());
    }

    const difficulty = String(normalized['dificuldade'] || 'medium').toLowerCase().includes('dificil') ? 'hard' : 'medium';

    questions.push({
      id: questionId,
      question: String(questionText).trim(),
      imageUrl,
      imageCaption,
      options,
      correctAnswer,
      category,
      targetCategory,
      explanation: String(fields['Explicação'] || normalized['explicacao'] || normalized['explanation'] || 'Consulte o Código da Estrada português e o tema correspondente.').trim(),
      lawArticle: String(fields['Artigo'] || normalized['artigo'] || normalized['article'] || 'Código da Estrada').trim(),
      difficulty,
      failureRate: difficulty === 'hard' ? 52 : 28
    });
  });

  return {
    questions,
    errors,
    totalRows: allRecords.length
  };
}

export const SAMPLE_AIRTABLE_QUESTIONS = [
  {
    'Pergunta': 'A que velocidade máxima pode circular um automóvel ligeiro de passageiros numa autoestrada com boas condições meteorológicas?',
    'ID': 'Q-001',
    'Tema': 'Velocidades e Distâncias',
    'Imagem': 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800',
    'nome da Imagem': 'Autoestrada reta com circulação fluida',
    'Opção A': '120 km/h',
    'Opção B': '100 km/h',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'Numa rotunda de duas vias, quem pretende sair na primeira saída deve ocupar a via:',
    'ID': 'Q-002',
    'Tema': 'Manobras e Vias Especiais',
    'Imagem': 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800',
    'nome da Imagem': 'Praça de sentido giratório devidamente sinalizada',
    'Opção A': 'Mais à direita',
    'Opção B': 'Mais à esquerda',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'Perante um sinal de STOP (B2), a paragem é obrigatória mesmo que não se aproximem outros veículos?',
    'ID': 'Q-003',
    'Tema': 'Sinais de Trânsito',
    'Imagem': 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800',
    'nome da Imagem': 'Sinal octogonal de paragem obrigatória',
    'Opção A': 'Sim, é sempre obrigatório parar completamente',
    'Opção B': 'Não, apenas se aproximar trânsito prioritário',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'Para condutores em regime probatório (menos de 3 anos de carta), qual a taxa máxima de alcoolemia permitida por lei?',
    'ID': 'Q-004',
    'Tema': 'Segurança Rodoviária, Luzes e Álcool',
    'Imagem': 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800',
    'nome da Imagem': 'Operação de fiscalização e controlo rodoviário',
    'Opção A': '0,20 g/l no sangue',
    'Opção B': '0,50 g/l no sangue',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'Num cruzamento sem qualquer sinalização vertical ou luminosa, a prioridade pertence ao veículo que se apresenta:',
    'ID': 'Q-005',
    'Tema': 'Regras de Prioridade e Cruzamentos',
    'Imagem': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
    'nome da Imagem': 'Interseção urbana de nível sem semáforos',
    'Opção A': 'Pela direita',
    'Opção B': 'Pela esquerda',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'Durante a noite e com nevoeiro denso, é permitido o uso de luzes de nevoeiro à frente?',
    'ID': 'Q-006',
    'Tema': 'Segurança Rodoviária, Luzes e Álcool',
    'Imagem': 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
    'nome da Imagem': 'Veículo em circulação noturna sob nevoeiro',
    'Opção A': 'Sim, sempre que as condições meteorológicas o justifiquem',
    'Opção B': 'Não, são proibidas em qualquer circunstância',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'A profundidade mínima legal dos relevos principais dos pneus de um veículo ligeiro de passageiros é de:',
    'ID': 'Q-007',
    'Tema': 'Mecânica Básica e Equipamentos',
    'Imagem': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800',
    'nome da Imagem': 'Pneu e roda de automóvel ligeiro',
    'Opção A': '1,6 milímetros',
    'Opção B': '1,0 milímetro',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'O condutor que realiza uma manobra de inversão do sentido de marcha numa autoestrada comete uma infração:',
    'ID': 'Q-008',
    'Tema': 'Manobras e Vias Especiais',
    'Imagem': 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800',
    'nome da Imagem': 'Traçado de autoestrada com separador central',
    'Opção A': 'Muito grave',
    'Opção B': 'Leve',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'A ultrapassagem de veículos deve, como regra geral, ser efetuada pela:',
    'ID': 'Q-009',
    'Tema': 'Regras de Prioridade e Cruzamentos',
    'Imagem': 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=800',
    'nome da Imagem': 'Faixa de rodagem com duas vias no mesmo sentido',
    'Opção A': 'Esquerda',
    'Opção B': 'Direita',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'A utilização do colete retrorrefletor é obrigatória quando o condutor sai do veículo na berma de uma via rápida?',
    'ID': 'Q-010',
    'Tema': 'Segurança Rodoviária, Luzes e Álcool',
    'Imagem': 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800',
    'nome da Imagem': 'Paragem forçada em berma de estrada',
    'Opção A': 'Sim, antes de sair da viatura',
    'Opção B': 'Não, é apenas recomendado',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'Qual é o limite geral de velocidade dentro das localidades para um automóvel ligeiro de passageiros?',
    'ID': 'Q-011',
    'Tema': 'Velocidades e Distâncias',
    'Imagem': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
    'nome da Imagem': 'Arruamento urbano dentro de localidade',
    'Opção A': '50 km/h',
    'Opção B': '60 km/h',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'É permitido parar ou estacionar a menos de 5 metros antes de uma passagem assinalada para peões (passadeira)?',
    'ID': 'Q-012',
    'Tema': 'Manobras e Vias Especiais',
    'Imagem': 'https://images.unsplash.com/photo-1520694478166-daaaaaec7a0e?w=800',
    'nome da Imagem': 'Passadeira de peões na via pública',
    'Opção A': 'Não, é estritamente proibido',
    'Opção B': 'Sim, desde que com quatro piscas ligados',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'Perante a luz amarela contínua do semáforo, o condutor deve:',
    'ID': 'Q-013',
    'Tema': 'Sinais de Trânsito',
    'Imagem': 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800',
    'nome da Imagem': 'Semáforo regulador de tráfego com luz amarela',
    'Opção A': 'Parar, a menos que não o possa fazer com segurança',
    'Opção B': 'Acelerar sempre para atravessar o cruzamento',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'Em caso de avaria num túnel ou autoestrada, a colocação do sinal de pré-sinalização de perigo (triângulo) deve ser feita a pelo menos:',
    'ID': 'Q-014',
    'Tema': 'Segurança Rodoviária, Luzes e Álcool',
    'Imagem': 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
    'nome da Imagem': 'Sinalização de veículo imobilizado por avaria',
    'Opção A': '30 metros do veículo e visível a 100 metros',
    'Opção B': '10 metros do veículo',
    'Resposta Correta': 'A'
  },
  {
    'Pergunta': 'O nível de óleo do motor deve ser verificado preferencialmente com:',
    'ID': 'Q-015',
    'Tema': 'Mecânica Básica e Equipamentos',
    'Imagem': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800',
    'nome da Imagem': 'Vareta de medição de nível de óleo do motor',
    'Opção A': 'O motor frio e veículo em terreno horizontal',
    'Opção B': 'O motor ligado e quente',
    'Resposta Correta': 'A'
  }
];

/**
 * Downloads ready-to-import CSV or Excel file specifically matched to the user's 8 Airtable columns:
 * Pergunta, ID, Tema, Imagem, nome da Imagem, Opção A, Opção B, Resposta Correta
 */
export function downloadSampleExcelTemplate() {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_AIRTABLE_QUESTIONS);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Perguntas');

  worksheet['!cols'] = [
    { wch: 60 }, // Pergunta
    { wch: 10 }, // ID
    { wch: 30 }, // Tema
    { wch: 55 }, // Imagem
    { wch: 40 }, // nome da Imagem
    { wch: 35 }, // Opção A
    { wch: 35 }, // Opção B
    { wch: 15 }, // Resposta Correta
  ];

  XLSX.writeFile(workbook, 'Perguntas_Airtable_CondutorPRO.xlsx');
}

/**
 * Downloads a CSV version directly formatted for Airtable's CSV Importer
 */
export function downloadAirtableCsv() {
  const headers = ['Pergunta', 'ID', 'Tema', 'Imagem', 'nome da Imagem', 'Opção A', 'Opção B', 'Resposta Correta'];
  const csvRows = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')
  ];

  SAMPLE_AIRTABLE_QUESTIONS.forEach(row => {
    const values = [
      row['Pergunta'],
      row['ID'],
      row['Tema'],
      row['Imagem'],
      row['nome da Imagem'],
      row['Opção A'],
      row['Opção B'],
      row['Resposta Correta']
    ];
    csvRows.push(values.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
  });

  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'perguntas_airtable.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Returns tab-separated values ready to be copied and pasted directly into Airtable with Ctrl+V
 */
export function getAirtableTsvForClipboard(): string {
  const headers = ['Pergunta', 'ID', 'Tema', 'Imagem', 'nome da Imagem', 'Opção A', 'Opção B', 'Resposta Correta'];
  const lines = [headers.join('\t')];
  SAMPLE_AIRTABLE_QUESTIONS.forEach(row => {
    lines.push([
      row['Pergunta'],
      row['ID'],
      row['Tema'],
      row['Imagem'],
      row['nome da Imagem'],
      row['Opção A'],
      row['Opção B'],
      row['Resposta Correta']
    ].join('\t'));
  });
  return lines.join('\n');
}
