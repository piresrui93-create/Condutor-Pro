import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Question, BillingInvoice, QuestionCategory, DriverCategory, CategoryExamConfig, ALL_DRIVER_CATEGORIES } from '../types';
import { 
  inspectFile, 
  inspectPastedText, 
  convertRowsToQuestions, 
  downloadSampleExcelTemplate, 
  downloadAirtableCsv,
  getAirtableTsvForClipboard,
  fetchQuestionsFromAirtableApi, 
  parseAirtableUrl,
  ExcelInspectResult, 
  ColumnMapping,
  cleanImageUrl
} from '../utils/excelParser';
import { 
  DollarSign, 
  Users, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Printer, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  X,
  FileText,
  Database,
  ArrowRight,
  ClipboardPaste,
  Eye,
  Settings2,
  Sliders,
  RotateCcw,
  UploadCloud,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Link2,
  Copy,
  Check
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    invoices, 
    users, 
    questions, 
    categoryConfigs,
    categoryAirtableConfigs,
    airtableToken,
    setAirtableToken,
    isSyncingAirtable,
    lastAutoSyncTime,
    autoSyncStatus,
    updateCategoryConfig,
    resetCategoryConfigs,
    updateCategoryAirtableConfig,
    syncCategoryFromAirtable,
    syncAllCategoriesFromAirtable,
    importQuestions, 
    addQuestion, 
    deleteQuestion, 
    clearAllQuestions,
    resetToZero,
    refundInvoice,
    updateUserSubscription 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'questions' | 'airtable_categories' | 'categories' | 'billing'>('questions');
  const [syncingCategoryKey, setSyncingCategoryKey] = useState<DriverCategory | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Excel and Airtable import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showAirtableModal, setShowAirtableModal] = useState(false);
  const [airtableBaseId, setAirtableBaseId] = useState(() => localStorage.getItem('condutorpro_airtable_base_id') || 'appUE8v1QiipoQRKy');
  const [airtableTable, setAirtableTable] = useState(() => localStorage.getItem('condutorpro_airtable_table') || 'tblI3NbgzjCKlruXc');
  const [airtableUrlInput, setAirtableUrlInput] = useState('https://airtable.com/appUE8v1QiipoQRKy/tblI3NbgzjCKlruXc');
  const [airtableLoading, setAirtableLoading] = useState(false);
  const [copyAirtableSuccess, setCopyAirtableSuccess] = useState(false);
  const [importTargetCategory, setImportTargetCategory] = useState<DriverCategory | 'Todas as Categorias'>('Todas as Categorias');
  const [lastSyncInfo, setLastSyncInfo] = useState<{ timestamp: string; count: number } | null>(() => {
    const saved = localStorage.getItem('condutorpro_airtable_last_sync');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const cleanToken = airtableToken.replace(/^Bearer\s+/i, '').replace(/[\r\n\t"']/g, '').trim();
      const cleanBase = airtableBaseId.replace(/[\r\n\t"']/g, '').trim();
      const cleanTable = airtableTable.replace(/[\r\n\t"']/g, '').trim();

      if (!cleanToken) {
        setTestResult({ success: false, message: 'Insira o token para testar.' });
        return;
      }

      const res = await fetch(`https://api.airtable.com/v0/${cleanBase}/${encodeURIComponent(cleanTable)}?maxRecords=1`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: `Conexão 100% aprovada! O Airtable respondeu com sucesso (${data.records?.length || 0} registo(s) detetados na base). Pode sincronizar agora!`
        });
      } else {
        const errText = await res.text();
        let parsedMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          parsedMsg = parsed.error?.message || parsed.error?.type || errText;
        } catch {}

        let guidance = '';
        if (cleanToken.startsWith('tok')) {
          guidance = ' (Atenção: inseriu o Token ID "tok...". O token real começa por "pat...").';
        } else if (cleanToken === 'condutorpro') {
          guidance = ' (Atenção: inseriu o NOME do token "condutorpro", mas precisa do código secreto que começa por "pat...").';
        }

        setTestResult({
          success: false,
          message: `Airtable devolveu erro ${res.status}: "${parsedMsg}"${guidance}`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Falha de rede ao contactar a API do Airtable.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyAirtableData = () => {
    const tsv = getAirtableTsvForClipboard();
    navigator.clipboard.writeText(tsv);
    setCopyAirtableSuccess(true);
    setTimeout(() => setCopyAirtableSuccess(false), 3500);
  };

  const handleSyncSingleCategory = async (cat: DriverCategory) => {
    setSyncingCategoryKey(cat);
    setImportStatus(null);
    try {
      const res = await syncCategoryFromAirtable(cat);
      if (res.success) {
        setImportStatus({
          type: 'success',
          message: res.message
        });
      } else {
        setImportStatus({
          type: 'error',
          message: res.message
        });
      }
    } finally {
      setSyncingCategoryKey(null);
    }
  };

  const handleSyncAllCategories = async () => {
    setImportStatus(null);
    const res = await syncAllCategoriesFromAirtable();
    if (res.success) {
      setImportStatus({
        type: 'success',
        message: res.message
      });
    } else {
      setImportStatus({
        type: 'error',
        message: res.message
      });
    }
  };

  const handleConfirmReset = () => {
    setIsResetting(true);
    resetToZero();
    setTimeout(() => {
      setIsResetting(false);
      setShowResetConfirmModal(false);
      setImportStatus({
        type: 'success',
        message: 'A aplicação foi limpa com sucesso! 0 perguntas de exemplo, 0 alunos de exemplo e 0 faturas. Está completamente do zero.'
      });
    }, 400);
  };

  // Column Mapping & Clipboard Paste Modal state
  const [inspectResult, setInspectResult] = useState<ExcelInspectResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    questionCol: '',
    optionACol: '',
    optionBCol: '',
    optionCCol: '',
    correctCol: '',
    imageCol: '',
    categoryCol: '',
    explanationCol: '',
    articleCol: '',
    targetCategoryCol: ''
  });
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [mappingModalError, setMappingModalError] = useState<string | null>(null);

  // Category Configuration Feedback State
  const [categorySaveSuccess, setCategorySaveSuccess] = useState<string | null>(null);
  const [editingCategoryKey, setEditingCategoryKey] = useState<DriverCategory | null>(null);

  // Question bank filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedDriverCategoryFilter, setSelectedDriverCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<BillingInvoice | null>(null);

  // New question form state
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newOptionC, setNewOptionC] = useState('');
  const [newCorrect, setNewCorrect] = useState<number>(0);
  const [newCategory, setNewCategory] = useState<QuestionCategory>('Sinais de Trânsito');
  const [newTargetCategory, setNewTargetCategory] = useState<DriverCategory | 'Todas as Categorias'>('Todas as Categorias');
  const [newImageUrl, setNewImageUrl] = useState('/src/assets/images/hero_driving_simulator_1793442879807.jpg');
  const [newExplanation, setNewExplanation] = useState('');
  const [newLawArticle, setNewLawArticle] = useState('Código da Estrada');
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Billing calculation
  const totalSubscribers = users.filter(u => u.subscriptionStatus === 'active_pro').length;
  const mrr = totalSubscribers * 5; // 5€ per month
  const totalRevenue = invoices.filter(i => i.status === 'pago').reduce((acc, curr) => acc + curr.amount, 0);

  // Filtered questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'all' || q.category === selectedCategoryFilter;
    const matchesDriverCat = selectedDriverCategoryFilter === 'all' ||
      (selectedDriverCategoryFilter === 'Todas as Categorias'
        ? (!q.targetCategory || q.targetCategory === 'Todas as Categorias')
        : q.targetCategory === selectedDriverCategoryFilter);
    return matchesSearch && matchesCat && matchesDriverCat;
  });

  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const inspected = await inspectFile(file);
      if (inspected.rawRows.length === 0) {
        setImportStatus({
          type: 'error',
          message: 'O ficheiro não contém linhas de dados ou está vazio.'
        });
        return;
      }

      setInspectResult(inspected);
      setMapping({
        questionCol: inspected.detectedMapping.questionCol || inspected.headers[0] || '',
        optionACol: inspected.detectedMapping.optionACol || inspected.headers[1] || '',
        optionBCol: inspected.detectedMapping.optionBCol || inspected.headers[2] || '',
        optionCCol: inspected.detectedMapping.optionCCol || '',
        correctCol: inspected.detectedMapping.correctCol || inspected.headers[3] || '',
        imageCol: inspected.detectedMapping.imageCol || '',
        categoryCol: inspected.detectedMapping.categoryCol || '',
        explanationCol: inspected.detectedMapping.explanationCol || '',
        articleCol: inspected.detectedMapping.articleCol || '',
        targetCategoryCol: inspected.detectedMapping.targetCategoryCol || ''
      });
      setShowMappingModal(true);
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: 'Erro ao analisar ficheiro: ' + (err?.message || 'formato inválido.')
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    try {
      const inspected = inspectPastedText(pastedText);
      if (inspected.rawRows.length === 0) {
        setImportStatus({
          type: 'error',
          message: 'Nenhum dado válido detetado no texto colado.'
        });
        return;
      }

      setInspectResult(inspected);
      setMapping({
        questionCol: inspected.detectedMapping.questionCol || inspected.headers[0] || '',
        optionACol: inspected.detectedMapping.optionACol || inspected.headers[1] || '',
        optionBCol: inspected.detectedMapping.optionBCol || inspected.headers[2] || '',
        optionCCol: inspected.detectedMapping.optionCCol || '',
        correctCol: inspected.detectedMapping.correctCol || inspected.headers[3] || '',
        imageCol: inspected.detectedMapping.imageCol || '',
        categoryCol: inspected.detectedMapping.categoryCol || '',
        explanationCol: inspected.detectedMapping.explanationCol || '',
        articleCol: inspected.detectedMapping.articleCol || '',
        targetCategoryCol: inspected.detectedMapping.targetCategoryCol || ''
      });
      setShowPasteModal(false);
      setShowMappingModal(true);
      setPastedText('');
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: 'Erro ao processar dados colados: ' + (err?.message || 'formato inválido.')
      });
    }
  };

  const handleInsertPasteSample = () => {
    const sampleTsv = `Pergunta\tOpção A\tOpção B\tOpção C\tResposta Certa\tTema\tFotografia\nQual a velocidade máxima permitida para um automóvel ligeiro numa autoestrada?\t100 km/h\t120 km/h\t90 km/h\tB\tVelocidades e Distâncias\thttps://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800\nNuma rotunda, o condutor que pretende sair na primeira saída deve ocupar:\tA via mais à direita\tA via da esquerda\tQualquer via indiferentemente\tA\tRegras de Prioridade e Cruzamentos\thttps://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800\nPerante um sinal de STOP (B2), a paragem é obrigatória:\tApenas se aproximarem veículos com prioridade\tSempre, junto ao limite da faixa de rodagem\tApenas durante a noite\tB\tSinais de Trânsito\thttps://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800`;
    setPastedText(sampleTsv);
  };

  const handleLoadDemoQuestions = () => {
    const demoQuestions: Question[] = [
      {
        id: `demo-sample-${Date.now()}-1`,
        question: 'A que velocidade máxima pode transitar um automóvel ligeiro de passageiros sem reboque numa autoestrada?',
        imageUrl: '/src/assets/images/highway_speed_limit_1793442881776.jpg',
        imageCaption: 'Troço de autoestrada com condições normais de circulação.',
        options: ['100 km/h', '120 km/h', '140 km/h'],
        correctAnswer: 1,
        category: 'Velocidades e Distâncias',
        targetCategory: importTargetCategory,
        explanation: 'O Código da Estrada estabelece no Artigo 27.º que o limite máximo de velocidade para ligeiros de passageiros em autoestrada é de 120 km/h.',
        lawArticle: 'Artigo 27.º do Código da Estrada',
        difficulty: 'medium',
        failureRate: 20
      },
      {
        id: `demo-sample-${Date.now()}-2`,
        question: 'Numa rotunda de duas ou mais vias de trânsito, o condutor que pretende sair na primeira saída deve:',
        imageUrl: '/src/assets/images/traffic_roundabout_junction_1793442880154.jpg',
        imageCaption: 'Praça de sentido giratório (rotunda) devidamente sinalizada com sinal D4.',
        options: [
          'Ocupar a via de trânsito mais à direita antes da entrada',
          'Ocupar a via de trânsito da esquerda e mudar bruscamente',
          'Circular sempre junto ao ilhéu central'
        ],
        correctAnswer: 0,
        category: 'Regras de Prioridade e Cruzamentos',
        targetCategory: importTargetCategory,
        explanation: 'Segundo o Artigo 14.º-A do Código da Estrada, quem pretenda sair na primeira saída deve entrar e manter-se na via da direita.',
        lawArticle: 'Artigo 14.º-A do Código da Estrada',
        difficulty: 'hard',
        failureRate: 60
      },
      {
        id: `demo-sample-${Date.now()}-3`,
        question: 'Qual é a taxa máxima de alcoolemia permitida no sangue para condutores em regime probatório ou profissionais?',
        imageUrl: '/src/assets/images/night_fog_lighting_1793442881655.jpg',
        imageCaption: 'Fiscalização rodoviária de alcoolemia e segurança.',
        options: ['0,50 g/l', '0,20 g/l', '0,80 g/l'],
        correctAnswer: 1,
        category: 'Segurança Rodoviária, Luzes e Álcool',
        targetCategory: importTargetCategory,
        explanation: 'Para condutores em regime probatório, condutores de veículos de socorro, transporte coletivo e TVDE, o limite é de 0,20 g/l (Art. 81.º do C.E.).',
        lawArticle: 'Artigo 81.º do Código da Estrada',
        difficulty: 'hard',
        failureRate: 48
      }
    ];

    const added = importQuestions(demoQuestions);
    setImportStatus({
      type: 'success',
      message: `Sucesso! Foram adicionadas ${added} perguntas oficiais de demonstração com fotografias para a categoria [${importTargetCategory}].`
    });
  };

  const handleExecuteImport = () => {
    if (!inspectResult) return;
    setMappingModalError(null);
    const result = convertRowsToQuestions(inspectResult.rawRows, mapping, importTargetCategory);
    if (result.questions.length > 0) {
      const added = importQuestions(result.questions);
      const skippedNote = result.errors.length > 0 ? ` (${result.errors.length} linhas vazias/incompletas foram ignoradas)` : '';
      setImportStatus({
        type: 'success',
        message: `Sucesso! Foram importadas ${added} perguntas para [${importTargetCategory}] a partir de ${inspectResult.fileName}${skippedNote}.`
      });
      setShowMappingModal(false);
      setInspectResult(null);
      setMappingModalError(null);
    } else {
      const msg = result.errors[0] || 'Não foi possível extrair perguntas com o mapeamento selecionado. Verifique se as colunas selecionadas contêm dados.';
      setMappingModalError(msg);
      setImportStatus({
        type: 'error',
        message: msg
      });
    }
  };


  const handleAirtableUrlPaste = (val: string) => {
    setAirtableUrlInput(val);
    const parsed = parseAirtableUrl(val);
    if (parsed.baseId) {
      setAirtableBaseId(parsed.baseId);
    }
    if (parsed.tableIdOrName) {
      setAirtableTable(parsed.tableIdOrName);
    }
  };

  const handleAirtableSync = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!airtableToken.trim() || !airtableBaseId.trim() || !airtableTable.trim()) {
      setShowAirtableModal(true);
      return;
    }

    setAirtableLoading(true);
    setImportStatus(null);

    try {
      const result = await fetchQuestionsFromAirtableApi(airtableToken, airtableBaseId, airtableTable, importTargetCategory);
      if (result.questions.length > 0) {
        const affected = importQuestions(result.questions);
        
        // Save to localStorage for instant 1-click sync
        localStorage.setItem('condutorpro_airtable_token', airtableToken.trim());
        localStorage.setItem('condutorpro_airtable_base_id', airtableBaseId.trim());
        localStorage.setItem('condutorpro_airtable_table', airtableTable.trim());

        const syncData = {
          timestamp: new Date().toISOString(),
          count: affected
        };
        localStorage.setItem('condutorpro_airtable_last_sync', JSON.stringify(syncData));
        setLastSyncInfo(syncData);

        setImportStatus({
          type: 'success',
          message: `Sincronização Airtable concluída com sucesso! Foram atualizadas e carregadas ${affected} perguntas (de ${result.totalRows} registos na tabela) para [${importTargetCategory}].`
        });
        setShowAirtableModal(false);
      } else {
        setImportStatus({
          type: 'error',
          message: result.errors[0] || 'Nenhuma pergunta válida encontrada na tabela do Airtable. Verifique se as colunas Pergunta, Opção A e Opção B estão preenchidas.'
        });
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err?.message || 'Erro ao comunicar com a API do Airtable. Verifique o Token e Base ID.'
      });
    } finally {
      setAirtableLoading(false);
    }
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText || !newOptionA || !newOptionB) return;

    const options = [newOptionA, newOptionB];
    if (newOptionC) options.push(newOptionC);

    addQuestion({
      question: newQuestionText,
      options,
      correctAnswer: newCorrect,
      category: newCategory,
      targetCategory: newTargetCategory,
      imageUrl: newImageUrl,
      imageCaption: 'Cenário adicionado pelo administrador.',
      explanation: newExplanation || 'Consulte o Código da Estrada português.',
      lawArticle: newLawArticle,
      difficulty: newDifficulty
    });

    setShowAddModal(false);
    // Reset form
    setNewQuestionText('');
    setNewOptionA('');
    setNewOptionB('');
    setNewOptionC('');
    setNewExplanation('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Consola de Administração CondutorPRO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Gestão de Faturação & Perguntas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Autenticado como: <strong>{currentUser?.email}</strong>
          </p>
        </div>

        {/* Tab switch & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'questions'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Banco de Perguntas ({questions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('airtable_categories')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'airtable_categories'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-4 h-4 text-blue-500" />
              <span>Bases Airtable por Categoria</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings2 className="w-4 h-4 text-emerald-600" />
              <span>Condições de Aprovação</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'billing'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Faturação (Stripe)</span>
            </button>
          </div>

          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="px-3 py-2 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1.5"
            title="Limpar todos os dados de teste e começar completamente do zero"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repor a Zero</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Billing & Subscriptions Management */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">MRR (Receita Recorrente)</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {mrr.toFixed(2)} €
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                {totalSubscribers} alunos ativos a 5,00 €/mês
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Receita Total Faturada</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {totalRevenue.toFixed(2)} €
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Via Stripe, MB WAY e Multibanco
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Subscritores PRO</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {totalSubscribers}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {users.length - totalSubscribers} utilizadores em teste gratuito
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Faturas Emitidas</span>
                <FileText className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {invoices.length}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Com NIF e certificação AT
              </span>
            </div>

          </div>

          {/* Invoices Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Histórico de Transações & Faturação
                </h2>
                <p className="text-xs text-slate-500">
                  Transações processadas via Stripe e métodos locais portugueses.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Fatura N.º</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">NIF</th>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Método</th>
                    <th className="py-3 px-3">Montante</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((inv) => {
                    const dateStr = new Date(inv.date).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{inv.userName}</div>
                          <div className="text-[11px] text-slate-400">{inv.userEmail}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {inv.userNif || 'Consumidor Final'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {dateStr}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {inv.paymentMethod}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {inv.amount.toFixed(2)} €
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            inv.status === 'pago'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {inv.status === 'pago' ? 'Pago' : 'Reembolsado'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedInvoiceForPrint(inv)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Ver / Imprimir Fatura"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {inv.status === 'pago' && (
                            <button
                              onClick={() => refundInvoice(inv.id)}
                              className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-900"
                              title="Reembolsar valor"
                            >
                              Reembolsar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Accounts Management */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Gestão de Alunos & Planos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Aluno</th>
                    <th className="py-3 px-3">E-mail</th>
                    <th className="py-3 px-3">Plano Atual</th>
                    <th className="py-3 px-3">Teste Grátis Usado?</th>
                    <th className="py-3 px-3">Perguntas Vistas</th>
                    <th className="py-3 px-3 text-right">Alterar Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.filter(u => u.role === 'student').map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {student.email}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          student.subscriptionStatus === 'active_pro'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {student.subscriptionStatus === 'active_pro' ? 'PRO (5€/mês)' : 'Teste Gratuito'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {student.freeTestCompleted ? 'Sim (1 realizado)' : 'Não'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {student.seenQuestionIds?.length || 0}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {student.subscriptionStatus === 'active_pro' ? (
                          <button
                            onClick={() => updateUserSubscription(student.id, 'canceled')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded border border-rose-200"
                          >
                            Suspender PRO
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUserSubscription(student.id, 'active_pro')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200"
                          >
                            Ativar PRO Grátis
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Question Bank & Excel Importer */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          
          {/* Airtable & Excel Import Central Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6 border border-slate-800">
            
            {/* Header with Category selector */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <Database className="w-4 h-4" />
                  <span>Central de Importação Airtable & Ficheiros</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  Como carregar as perguntas do seu Airtable
                </h3>
                <p className="text-xs text-slate-300">
                  Não precisa de tokens complicados nem de programar. Escolha a forma mais confortável para si:
                </p>
              </div>

              {/* Target Category for imported questions */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 shrink-0">
                <span className="text-xs text-slate-300 font-medium pl-1">Inserir em:</span>
                <select
                  value={importTargetCategory}
                  onChange={(e) => setImportTargetCategory(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-emerald-300 font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Todas as Categorias">Todas as Categorias (Geral / Comum)</option>
                  {ALL_DRIVER_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Airtable API Live Sync Status Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-700/60 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white text-sm">
                        Sincronização em Tempo Real via Airtable API
                      </h4>
                      {airtableToken && airtableBaseId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          API Conectada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Pronto a Conectar
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {airtableToken && airtableBaseId ? (
                        <>
                          Base: <code className="text-blue-300 font-mono text-[11px] bg-slate-950/60 px-1.5 py-0.5 rounded border border-blue-900">{airtableBaseId}</code> · Tabela: <strong className="text-white">{airtableTable}</strong>
                          {lastSyncInfo && (
                            <span className="text-emerald-400 font-semibold ml-2">
                              · Última sincronização: {new Date(lastSyncInfo.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} ({lastSyncInfo.count} perguntas)
                            </span>
                          )}
                        </>
                      ) : (
                        'Mantenha as suas 8 colunas (Pergunta, ID, Tema, Imagem, nome da Imagem, Opção A, Opção B, Resposta Correta) sempre atualizadas automaticamente.'
                      )}
                    </p>
                  </div>
                </div>

                {/* API Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAirtableSync()}
                    disabled={airtableLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${airtableLoading ? 'animate-spin' : ''}`} />
                    <span>{airtableLoading ? 'A sincronizar...' : 'Sincronizar Agora (API)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAirtableModal(true)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>{airtableToken && airtableBaseId ? 'Definições API' : 'Ligar Airtable API'}</span>
                  </button>
                </div>
              </div>

              {/* Supported Columns Badge List */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300 mr-1">8 Colunas da sua base:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">1. Pergunta</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">2. ID</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">3. Tema</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">4. Imagem</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">5. nome da Imagem</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">6. Opção A</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">7. Opção B</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">8. Resposta Correta</span>
                </div>

                {/* Pre-fill Helpers */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAirtableData}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copyAirtableSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">15 Perguntas Copiadas (Cole com Ctrl+V)!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar 15 Perguntas p/ Colar no Airtable</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={downloadAirtableCsv}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descarregar CSV p/ Airtable</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Main Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-950/40 scale-[1.01]'
                  : 'border-slate-700 hover:border-emerald-500/70 bg-slate-800/40 hover:bg-slate-800/70'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <UploadCloud className="w-7 h-7" />
              </div>
              
              <div>
                <div className="text-base sm:text-lg font-bold text-white">
                  {isImporting ? 'A processar o seu ficheiro...' : 'Arraste o ficheiro CSV descarregado do Airtable para aqui'}
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-lg mx-auto">
                  Ou clique aqui para procurar no seu computador. Deteta automaticamente as perguntas, opções, respostas certas e imagens dos anexos do Airtable.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] pt-1">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 font-semibold border border-slate-700/80">
                  ✓ Ficheiro CSV exportado do Airtable
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 font-semibold border border-slate-700/80">
                  ✓ Links de Fotos nos Anexos
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 font-semibold border border-slate-700/80">
                  ✓ Ficheiros Excel (.xlsx, .xls)
                </span>
              </div>
            </div>

            {/* 3 Alternative Methods Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              
              {/* Card 1: 10-Second Airtable CSV Guide */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center text-[11px] font-mono border border-emerald-800">
                      1
                    </span>
                    <span>Método Recomendado (5 Segundos)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    No seu Airtable, abra a sua tabela, clique no menu superior <strong>...</strong> (ou na seta da vista) e escolha <strong>"Download CSV"</strong>. Depois arraste o ficheiro para o retângulo acima!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Escolher Ficheiro CSV</span>
                </button>
              </div>

              {/* Card 2: Direct Clipboard Paste (Ctrl+C / Ctrl+V) */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="font-bold text-blue-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 flex items-center justify-center text-[11px] font-mono border border-blue-800">
                      2
                    </span>
                    <span>Copiar e Colar (Sem Ficheiros)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Selecione as linhas na sua grelha do Airtable, prima <strong>Ctrl+C</strong> (Copiar) e cole diretamente no simulador com <strong>Ctrl+V</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasteModal(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-600"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Abrir Caixa de Colar (Ctrl+V)</span>
                </button>
              </div>

              {/* Card 3: Instant Demo Test / Template / API */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-400 flex items-center justify-center text-[11px] font-mono border border-amber-800">
                      3
                    </span>
                    <span>Testar Demonstração ou Modelo</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Carregue perguntas oficiais de exemplo para ver a plataforma a funcionar já, ou descarregue a folha modelo.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={handleLoadDemoQuestions}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-amber-500/30"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Carregar 3 Perguntas Exemplo</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                    <button
                      type="button"
                      onClick={downloadSampleExcelTemplate}
                      className="text-slate-400 hover:text-white underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Modelo Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAirtableModal(true)}
                      className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                    >
                      <Database className="w-3 h-3" />
                      <span>API Airtable</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Status alerts */}
            {importStatus && (
              <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 border ${
                importStatus.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/90 border-rose-500 text-rose-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  {importStatus.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span className="font-medium">{importStatus.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImportStatus(null)}
                  className="text-slate-400 hover:text-white text-xs underline shrink-0"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>


          {/* Question Filter & Add Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar pergunta..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              >
                <option value="all">Todos os Temas</option>
                <option value="Sinais de Trânsito">Sinais de Trânsito</option>
                <option value="Regras de Prioridade e Cruzamentos">Prioridade e Cruzamentos</option>
                <option value="Velocidades e Distâncias">Velocidades e Distâncias</option>
                <option value="Manobras e Vias Especiais">Manobras e Vias Especiais</option>
                <option value="Segurança Rodoviária, Luzes e Álcool">Segurança e Luzes</option>
                <option value="Mecânica Básica e Equipamentos">Mecânica Básica</option>
              </select>

              <select
                value={selectedDriverCategoryFilter}
                onChange={(e) => setSelectedDriverCategoryFilter(e.target.value)}
                className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-semibold text-emerald-700 dark:text-emerald-400"
              >
                <option value="all">Todas as Categorias/Cursos</option>
                <option value="Todas as Categorias">Geral (Sem Categoria Fixa)</option>
                {ALL_DRIVER_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Pergunta Manual</span>
            </button>
          </div>

          {/* Questions Grid/Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q, idx) => (
              <div
                key={`${q.id}_${idx}`}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex gap-4">
                  {/* Photo thumbnail */}
                  <div className="w-24 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                    <img
                      src={q.imageUrl}
                      alt="Miniatura"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                        {q.category}
                      </span>
                      <span className="capitalize text-[10px]">{q.difficulty}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                        {q.targetCategory || 'Todas as Categorias'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                      {q.question}
                    </h4>

                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      Certa: <strong className="text-emerald-600">{q.options[q.correctAnswer]}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <span>{q.lawArticle || 'Código da Estrada'}</span>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                    title="Eliminar questão"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 3: Category Exam Conditions & Approval Rules */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Sliders className="w-4 h-4" />
                  <span>Critérios & Parâmetros Oficiais de Aprovação</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  Condições de Aprovação por Categoria & Curso
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Configure o número de perguntas no exame, o tempo limite e o mínimo de respostas certas exigidas para cada categoria. Os exames dos alunos utilizam estas configurações em tempo real.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetCategoryConfigs();
                  setCategorySaveSuccess('Todas as condições foram repostas para os padrões oficiais IMT com sucesso.');
                  setTimeout(() => setCategorySaveSuccess(null), 4000);
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-2 shrink-0 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrões IMT</span>
              </button>
            </div>

            {categorySaveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{categorySaveSuccess}</span>
              </div>
            )}
          </div>

          {/* Cards for each of the 6 categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ALL_DRIVER_CATEGORIES.map((catKey) => {
              const cfg = categoryConfigs[catKey];
              const inBank = questions.filter(q => !q.targetCategory || q.targetCategory === 'Todas as Categorias' || q.targetCategory === catKey).length;
              const maxErrors = Math.max(0, cfg.totalQuestions - cfg.minCorrectToPass);
              const passPct = Math.round((cfg.minCorrectToPass / cfg.totalQuestions) * 100);

              const categoryIcons: Record<string, string> = {
                'Categoria B': '🚗',
                'Categoria A1': '🛵',
                'Categoria A': '🏍️',
                'Curso Instrutores de Condução Automóvel': '🎓',
                'Curso de Diretor de Escola de Condução': '📋',
                'Curso TVDE': '🚕'
              };

              return (
                <div
                  key={catKey}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
                          {categoryIcons[catKey] || '🚗'}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {catKey}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {cfg.name}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                        {inBank} perguntas no banco
                      </span>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                          Total Perguntas
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="100"
                          value={cfg.totalQuestions}
                          onChange={(e) => updateCategoryConfig({
                            ...cfg,
                            totalQuestions: Math.max(5, parseInt(e.target.value) || 5)
                          })}
                          className="w-full px-3 py-2 text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                          Duração (min)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="180"
                          value={cfg.durationMinutes}
                          onChange={(e) => updateCategoryConfig({
                            ...cfg,
                            durationMinutes: Math.max(5, parseInt(e.target.value) || 5)
                          })}
                          className="w-full px-3 py-2 text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                          Mín. p/ Aprovar
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={cfg.totalQuestions}
                          value={cfg.minCorrectToPass}
                          onChange={(e) => updateCategoryConfig({
                            ...cfg,
                            minCorrectToPass: Math.min(cfg.totalQuestions, Math.max(1, parseInt(e.target.value) || 1))
                          })}
                          className="w-full px-3 py-2 text-center font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Calculated Indicators */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-500 block">Tolerância Máxima de Erros:</span>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Até {maxErrors} respostas erradas
                        </span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-[11px] text-slate-500 block">Exigência Mínima:</span>
                        <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                          {passPct}% de aprovação
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                        Descrição e Enquadramento Oficial
                      </label>
                      <textarea
                        rows={2}
                        value={cfg.description}
                        onChange={(e) => updateCategoryConfig({
                          ...cfg,
                          description: e.target.value
                        })}
                        className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Alterações em vigor imediatamente no exame
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCategorySaveSuccess(`Condições para "${catKey}" guardadas com sucesso!`);
                        setTimeout(() => setCategorySaveSuccess(null), 3500);
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB: Airtable Bases per Category */}
      {activeTab === 'airtable_categories' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Database className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Integração Airtable Multi-Categoria
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">
                Bases de Perguntas Airtable por Categoria
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Cada categoria oficial (Cat. B, Cat. A, Instrutores, TVDE, etc.) possui a sua própria tabela no Airtable.
                As questões atualizadas no Airtable são sincronizadas <strong>automaticamente a cada 3 minutos</strong> sem necessidade de recarregar a página.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Auto-Sync Ativo (3 min)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Última sincronização: <strong>{lastAutoSyncTime || 'Acabou de iniciar'}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncAllCategories}
                disabled={isSyncingAirtable || !airtableToken}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingAirtable ? 'animate-spin' : ''}`} />
                <span>{isSyncingAirtable ? 'A Sincronizar Tudo...' : 'Sincronizar Todas as Categorias'}</span>
              </button>
            </div>
          </div>

          {/* Token Card with guidance on user's screenshot */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>1. Chave Secreta de API (Personal Access Token)</span>
                  {airtableToken ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Token Definido
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Token Não Inserido
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta chave privada autentica o simulador com a sua conta Airtable para ler as perguntas e opções em tempo real.
                </p>
              </div>

              <a
                href="https://airtable.com/create/tokens"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>Abrir Gestor de Tokens Airtable</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Crucial Diagnostic Callout on user's image */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Instrução fundamental sobre o ecrã do Airtable (Evitar o Erro 401):</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Na janela onde atribuiu o nome <strong>"condutorpro"</strong> e a permissão <strong>data.records:read</strong> (exatamente como na imagem que enviou), <strong>tem de rolar até ao fundo da página e clicar no botão azul "Create token"</strong>.
              </p>
              <p className="text-[11px] leading-relaxed">
                Assim que clica nesse botão azul, o Airtable abre uma nova janela com a sua <strong>chave secreta que começa por "pat..."</strong> (ex: <code className="bg-amber-100 dark:bg-amber-900/80 px-1.5 py-0.5 rounded font-mono font-bold">patXXXXXXXXXX.YYYYYYYYYYYY</code>). É essa chave que deve colar no campo abaixo!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-9 space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Personal Access Token (começa por pat...)
                </label>
                <input
                  type="text"
                  value={airtableToken}
                  onChange={(e) => setAirtableToken(e.target.value)}
                  placeholder="pat..."
                  className="w-full px-3.5 py-2.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="lg:col-span-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !airtableToken}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'A Testar Chave...' : 'Testar Chave (Diagnóstico)'}</span>
                </button>
              </div>
            </div>

            {/* Test result output */}
            {testResult && (
              <div className={`p-3.5 rounded-xl text-xs border font-medium ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}>
                {testResult.message}
              </div>
            )}
          </div>

          {/* 6 Category Configuration Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  2. Tabelas do Airtable Associadas a Cada Categoria
                </h3>
                <p className="text-xs text-slate-500">
                  Configure o Base ID e a Tabela para cada uma das 6 categorias oficiais do IMT / cursos profissionais.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ALL_DRIVER_CATEGORIES.map(catKey => {
                const cfg = categoryAirtableConfigs[catKey] || {
                  category: catKey,
                  baseId: 'appUE8v1QiipoQRKy',
                  tableIdOrName: 'tblI3NbgzjCKlruXc',
                  autoSync: true
                };
                const catExamCfg = categoryConfigs[catKey];
                const catQuestions = questions.filter(q => q.targetCategory === catKey);
                const isCatSyncing = syncingCategoryKey === catKey;

                return (
                  <div
                    key={catKey}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      
                      {/* Header with Title & Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                            {catExamCfg?.shortName || catKey}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                            {catKey}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {catQuestions.length} perguntas
                        </span>
                      </div>

                      {/* Inputs: Base ID & Table */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                            Base ID (ex: app...)
                          </label>
                          <input
                            type="text"
                            value={cfg.baseId}
                            onChange={(e) => updateCategoryAirtableConfig(catKey, { baseId: e.target.value.trim() })}
                            placeholder="appUE8v1QiipoQRKy"
                            className="w-full px-3 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                            Nome ou ID da Tabela (ex: tbl... ou Perguntas)
                          </label>
                          <input
                            type="text"
                            value={cfg.tableIdOrName}
                            onChange={(e) => updateCategoryAirtableConfig(catKey, { tableIdOrName: e.target.value.trim() })}
                            placeholder="tblI3NbgzjCKlruXc"
                            className="w-full px-3 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        {/* Auto-sync checkbox */}
                        <label className="flex items-center gap-2 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cfg.autoSync}
                            onChange={(e) => updateCategoryAirtableConfig(catKey, { autoSync: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">
                            Auto-Sync em segundo plano
                          </span>
                        </label>
                      </div>

                      {/* Meta sync info */}
                      <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
                        <span>Último sync:</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {cfg.lastSyncedAt ? new Date(cfg.lastSyncedAt).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                        </span>
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSyncSingleCategory(catKey)}
                        disabled={isCatSyncing || !airtableToken}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCatSyncing ? 'animate-spin' : ''}`} />
                        <span>{isCatSyncing ? 'A Sincronizar...' : 'Sincronizar Agora'}</span>
                      </button>

                      {cfg.baseId && cfg.tableIdOrName && (
                        <a
                          href={`https://airtable.com/${cfg.baseId}/${cfg.tableIdOrName}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir tabela no Airtable"
                          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Modal: Add Question Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Adicionar Nova Pergunta de Exame
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enunciado da Questão
                </label>
                <textarea
                  rows={2}
                  required
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="ex. Perante esta sinalização luminosa, devo:"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL ou Caminho da Fotografia
                </label>
                <input
                  type="text"
                  required
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="/src/assets/images/... ou URL HTTPS"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria / Curso Alvo
                  </label>
                  <select
                    value={newTargetCategory}
                    onChange={(e) => setNewTargetCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Todas as Categorias">Todas as Categorias</option>
                    {ALL_DRIVER_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tema do Código
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as QuestionCategory)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Sinais de Trânsito">Sinais de Trânsito</option>
                    <option value="Regras de Prioridade e Cruzamentos">Prioridade e Cruzamentos</option>
                    <option value="Velocidades e Distâncias">Velocidades e Distâncias</option>
                    <option value="Manobras e Vias Especiais">Manobras e Vias Especiais</option>
                    <option value="Segurança Rodoviária, Luzes e Álcool">Segurança e Luzes</option>
                    <option value="Mecânica Básica e Equipamentos">Mecânica Básica</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dificuldade
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Média</option>
                    <option value="hard">Difícil (Armadilha)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Opções de Resposta & Seleção da Correta
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={newCorrect === 0}
                    onChange={() => setNewCorrect(0)}
                  />
                  <input
                    type="text"
                    required
                    value={newOptionA}
                    onChange={(e) => setNewOptionA(e.target.value)}
                    placeholder="Opção A"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={newCorrect === 1}
                    onChange={() => setNewCorrect(1)}
                  />
                  <input
                    type="text"
                    required
                    value={newOptionB}
                    onChange={(e) => setNewOptionB(e.target.value)}
                    placeholder="Opção B"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={newCorrect === 2}
                    onChange={() => setNewCorrect(2)}
                  />
                  <input
                    type="text"
                    value={newOptionC}
                    onChange={(e) => setNewOptionC(e.target.value)}
                    placeholder="Opção C (opcional)"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Artigo Legal do Código da Estrada
                </label>
                <input
                  type="text"
                  value={newLawArticle}
                  onChange={(e) => setNewLawArticle(e.target.value)}
                  placeholder="ex. Artigo 31.º do Código da Estrada"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Explicação Pedagógica
                </label>
                <textarea
                  rows={2}
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Justificação da resposta oficial..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs"
                >
                  Guardar Pergunta
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Print / View Invoice Receipt */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-2xl shadow-2xl p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="text-xl font-extrabold tracking-tight">CondutorPRO Lda</div>
                <div className="text-xs text-slate-500">NIF: 512 890 341 · Lisboa, Portugal</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase font-bold text-emerald-600">Fatura Simplificada</div>
                <div className="text-sm font-mono font-bold">{selectedInvoiceForPrint.invoiceNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Adquirente:</span>
                <span className="font-bold text-slate-800 block">{selectedInvoiceForPrint.userName}</span>
                <span className="text-slate-500 block">{selectedInvoiceForPrint.userEmail}</span>
                <span className="text-slate-500 block font-mono">NIF: {selectedInvoiceForPrint.userNif || 'Consumidor Final'}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Data de Emissão:</span>
                <span className="font-mono text-slate-700 block">
                  {new Date(selectedInvoiceForPrint.date).toLocaleDateString('pt-PT')}
                </span>
                <span className="text-slate-400 block mt-1">Método:</span>
                <span className="font-medium text-slate-700 block">{selectedInvoiceForPrint.paymentMethod}</span>
              </div>
            </div>

            <div className="border rounded-xl p-4 bg-slate-50 text-xs space-y-2">
              <div className="flex justify-between font-semibold border-b pb-2">
                <span>Descrição</span>
                <span>Total</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Subscrição Mensal CondutorPRO (1 Mês - Acesso Total)</span>
                <span className="font-mono">4,07 €</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                <span>IVA (23% incluído)</span>
                <span className="font-mono">0,93 €</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-black text-sm text-slate-900">
                <span>Total Pago:</span>
                <span className="font-mono text-emerald-600">{selectedInvoiceForPrint.amount.toFixed(2)} €</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                onClick={() => setSelectedInvoiceForPrint(null)}
                className="px-4 py-2 border rounded-xl hover:bg-slate-100 font-medium"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Direct Airtable API Sync */}
      {showAirtableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Configurar Conexão Airtable API
                </h3>
              </div>
              <button
                onClick={() => setShowAirtableModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 3-Step Guide */}
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-200">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Como gerar o seu Token Airtable e evitar o erro 401:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] pl-1 leading-relaxed">
                <li>
                  Aceda a{' '}
                  <a
                    href="https://airtable.com/create/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-blue-600 dark:text-blue-400 hover:text-blue-800 inline-flex items-center gap-0.5"
                  >
                    <span>airtable.com/create/tokens</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  e clique em <strong>"Create token"</strong>.
                </li>
                <li>Dê um nome (ex: <em>CondutorPRO</em>) e em <strong>Scopes</strong> adicione <strong>data.records:read</strong>.</li>
                <li className="font-semibold text-blue-950 dark:text-blue-100">
                  ⚠️ Ponto Crítico (causa do erro 401): Em <strong>"Access"</strong>, clique em <strong>"+ Add a base"</strong> e selecione a sua base (ou escolha <em>"All current and future bases in this workspace"</em>). Se não selecionar a base, o Airtable rejeita o acesso com 401!
                </li>
                <li>Clique em <strong>"Create token"</strong> e copie a chave secreta que começa por <strong>pat...</strong> (só aparece uma vez).</li>
              </ol>
            </div>

            <form onSubmit={handleAirtableSync} className="space-y-4 text-xs">
              
              {/* Token Input */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  1. Personal Access Token (PAT) *
                </label>
                <input
                  type="text"
                  required
                  value={airtableToken}
                  onChange={(e) => setAirtableToken(e.target.value.trim().replace(/["']/g, ''))}
                  placeholder="pat..."
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                {/* Validation Warnings */}
                {airtableToken && airtableToken.startsWith('tok') && (
                  <div className="p-2.5 mt-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-200 font-medium">
                    ⚠️ <strong>Atenção:</strong> O código inserido começa por <code>tok...</code>. Esse é apenas o Token ID público e NÃO o token de acesso! O token de acesso do Airtable começa sempre por <code>pat...</code>. Aceda novamente a <a href="https://airtable.com/create/tokens" target="_blank" rel="noreferrer" className="underline font-bold">airtable.com/create/tokens</a> e crie um novo token copiando a chave <code>pat...</code>.
                  </div>
                )}

                {airtableToken && !airtableToken.startsWith('pat') && !airtableToken.startsWith('tok') && (
                  <div className="p-2.5 mt-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                    ⚠️ <strong>Aviso:</strong> O token não começa por <code>pat...</code>. Os tokens de acesso pessoal do Airtable têm o formato <code>patXXXXXXXX.YYYYYYYY</code>. Certifique-se de que não colou outro valor.
                  </div>
                )}

                <span className="text-[10px] text-slate-500 mt-1 block">
                  O seu token é guardado com segurança localmente no seu navegador para sincronizações com 1 clique.
                </span>
              </div>

              {/* Paste full Airtable browser link (smart auto-detect) */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                  <span>2. Link da sua Tabela ou Base ID *</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                    Deteta Base ID e Tabela automaticamente
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={airtableUrlInput}
                    onChange={(e) => handleAirtableUrlPaste(e.target.value)}
                    placeholder="Cole aqui o link do Airtable: https://airtable.com/app.../tbl... ou o Base ID"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Base ID and Table Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Base ID (ex: app...) *
                  </label>
                  <input
                    type="text"
                    required
                    value={airtableBaseId}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val.includes('airtable.com')) {
                        handleAirtableUrlPaste(val);
                      } else {
                        setAirtableBaseId(val);
                      }
                    }}
                    placeholder="appXXXXXXXXXXXXXX"
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome ou ID da Tabela *
                  </label>
                  <input
                    type="text"
                    required
                    value={airtableTable}
                    onChange={(e) => setAirtableTable(e.target.value)}
                    placeholder="ex. Perguntas ou tbl..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Verified Column Mapping Matrix */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
                  <span>Estrutura de 8 Colunas reconhecida:</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">100% Compatível</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px]">COLUNA 1</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">Pergunta</strong>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px]">COLUNA 2</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">ID</strong>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px]">COLUNA 3</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">Tema</strong>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px]">COLUNA 4</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">Imagem</strong>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px]">COLUNA 5</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">nome da Imagem</strong>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px]">COLUNA 6</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">Opção A</strong>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px]">COLUNA 7</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">Opção B</strong>
                  </div>
                  <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                    <span className="text-emerald-600 block text-[9px]">COLUNA 8</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 font-mono">Resposta Correta</strong>
                  </div>
                </div>
              </div>

              {/* Target Category Selector */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-1">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Atribuir estas perguntas a que Categoria / Curso?
                </label>
                <select
                  value={importTargetCategory}
                  onChange={(e) => setImportTargetCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Todas as Categorias">Todas as Categorias (Geral / Comum)</option>
                  {ALL_DRIVER_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Os alunos inscritos nesta categoria verão estas perguntas nos seus exames e treinos.
                </span>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div>{testResult.message}</div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !airtableToken.trim()}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                      <span>A testar token...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>Testar Chave (Diagnóstico Imediato)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAirtableModal(false)}
                    className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={airtableLoading || !airtableToken.trim() || !airtableBaseId.trim() || !airtableTable.trim()}
                    className="px-5 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {airtableLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>A sincronizar via API...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Sincronizar e Guardar Conexão</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Interactive Column Mapping & Preview */}
      {showMappingModal && inspectResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  <span>Mapear Colunas do Ficheiro</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectResult.fileName} · <strong>{inspectResult.totalRows} perguntas</strong> detetadas
                </p>
              </div>
              <button
                onClick={() => { setShowMappingModal(false); setInspectResult(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              O CondutorPRO detetou as colunas do seu ficheiro. Verifique abaixo se as correspondências estão corretas ou selecione o nome exato da sua coluna se necessário:
            </div>

            {mappingModalError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <div className="font-bold">Atenção ao mapeamento:</div>
                  <div>{mappingModalError}</div>
                </div>
              </div>
            )}

            {/* Target Category Selector for this batch */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block font-bold text-xs text-emerald-900 dark:text-emerald-200">
                  Atribuir estas perguntas a que Categoria / Curso?
                </label>
                <select
                  value={importTargetCategory}
                  onChange={(e) => setImportTargetCategory(e.target.value as any)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Todas as Categorias">Todas as Categorias (Geral / Comum)</option>
                  {ALL_DRIVER_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Todas as perguntas importadas serão atribuídas a esta categoria (ou pode mapear uma coluna específica de categoria abaixo).
              </p>
            </div>

            {/* Column Selectors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Enunciado da Pergunta *
                </label>
                <select
                  value={mapping.questionCol}
                  onChange={(e) => setMapping(prev => ({ ...prev, questionCol: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Selecione a coluna --</option>
                  {inspectResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Resposta Certa (A, B, C ou 1, 2, 3) *
                </label>
                <select
                  value={mapping.correctCol}
                  onChange={(e) => setMapping(prev => ({ ...prev, correctCol: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Selecione a coluna --</option>
                  {inspectResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Opção A *
                </label>
                <select
                  value={mapping.optionACol}
                  onChange={(e) => setMapping(prev => ({ ...prev, optionACol: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Selecione a coluna --</option>
                  {inspectResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Opção B *
                </label>
                <select
                  value={mapping.optionBCol}
                  onChange={(e) => setMapping(prev => ({ ...prev, optionBCol: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Selecione a coluna --</option>
                  {inspectResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Opção C (opcional)
                </label>
                <select
                  value={mapping.optionCCol || ''}
                  onChange={(e) => setMapping(prev => ({ ...prev, optionCCol: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Nenhuma / Apenas 2 opções --</option>
                  {inspectResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Fotografia / Imagem / Anexo Airtable
                </label>
                <select
                  value={mapping.imageCol || ''}
                  onChange={(e) => setMapping(prev => ({ ...prev, imageCol: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Nenhuma (usar fotografia padrão) --</option>
                  {inspectResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Tema / Categoria
                </label>
                <select
                  value={mapping.categoryCol || ''}
                  onChange={(e) => setMapping(prev => ({ ...prev, categoryCol: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Padrão: Sinais de Trânsito --</option>
                  {inspectResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Explicação Pedagógica (opcional)
                </label>
                <select
                  value={mapping.explanationCol || ''}
                  onChange={(e) => setMapping(prev => ({ ...prev, explanationCol: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Nenhuma --</option>
                  {inspectResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Coluna de Categoria / Curso Alvo (opcional)
                </label>
                <select
                  value={mapping.targetCategoryCol || ''}
                  onChange={(e) => setMapping(prev => ({ ...prev, targetCategoryCol: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Usar a categoria selecionada acima --</option>
                  {inspectResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Live Preview of 1st question */}
            {inspectResult.rawRows[0] && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Pré-visualização da 1.ª Pergunta do seu Ficheiro:
                </span>

                <div className="flex gap-3">
                  {mapping.imageCol && inspectResult.rawRows[0][mapping.imageCol] && (
                    <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border">
                      <img
                        src={cleanImageUrl(inspectResult.rawRows[0][mapping.imageCol])}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="space-y-1 text-xs flex-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {inspectResult.rawRows[0][mapping.questionCol] || '(Selecione a coluna da pergunta acima)'}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                      A: {inspectResult.rawRows[0][mapping.optionACol] || '—'}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                      B: {inspectResult.rawRows[0][mapping.optionBCol] || '—'}
                    </div>
                    {mapping.optionCCol && inspectResult.rawRows[0][mapping.optionCCol] && (
                      <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                        C: {inspectResult.rawRows[0][mapping.optionCCol]}
                      </div>
                    )}
                    <div className="text-emerald-600 font-semibold text-[11px] pt-1">
                      Valor da Resposta Certa: {String(inspectResult.rawRows[0][mapping.correctCol] ?? '—')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setShowMappingModal(false); setInspectResult(null); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!mapping.questionCol || !mapping.optionACol || !mapping.optionBCol || !mapping.correctCol}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md disabled:opacity-40 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar e Importar {inspectResult.totalRows} Perguntas</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Direct Clipboard Paste from Airtable */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Colar Diretamente do Airtable (Copiar/Colar)
                </h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <strong>Instruções simples de 3 passos:</strong>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] pl-1">
                <li>No seu Airtable, selecione os cabeçalhos e as linhas que quer importar.</li>
                <li>Prima <strong>Ctrl + C</strong> (ou Cmd + C).</li>
                <li>Cole aqui em baixo (<strong>Ctrl + V</strong>) e clique em "Processar Dados".</li>
              </ol>
            </div>

            <div>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Cole aqui os dados copiados do Airtable..."
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleInsertPasteSample}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preencher com Dados de Exemplo (para testar)</span>
              </button>
              
              <div className="text-[11px] text-slate-400">
                Suporta tabulações, vírgulas e ponto-e-vírgula
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pastedText.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Processar Dados Colados</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Confirm Reset to Zero */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Limpar Todos os Dados e Começar do Zero?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Esta ação irá apagar todas as perguntas em cache/memória, remover registos de alunos de teste e faturas de exemplo, mantendo apenas a sua conta de Administrador.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                A aplicação ficará com <strong>0 perguntas</strong>, pronta para receber exclusivamente os seus dados reais através da sincronização com o Airtable.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isResetting ? 'A Limpar...' : 'Sim, Começar do Zero'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

