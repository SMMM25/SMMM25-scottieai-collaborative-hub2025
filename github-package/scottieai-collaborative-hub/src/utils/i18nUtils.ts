
/**
 * Internationalization utilities for multi-language support
 */
import { useState, useEffect } from 'react';

// Supported languages
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Language display names
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語'
};

// Interface for translation entries
export interface TranslationDict {
  [key: string]: string;
}

// Interface for all translations
export interface Translations {
  [language: string]: TranslationDict;
}

// Get browser language or fallback to default
export const getBrowserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language.split('-')[0];
  return Object.keys(LANGUAGE_NAMES).includes(browserLang) 
    ? browserLang as SupportedLanguage 
    : DEFAULT_LANGUAGE;
};

// Get language from localStorage or fallback to browser language
export const getStoredLanguage = (): SupportedLanguage => {
  const storedLang = localStorage.getItem('preferredLanguage');
  if (storedLang && Object.keys(LANGUAGE_NAMES).includes(storedLang)) {
    return storedLang as SupportedLanguage;
  }
  return getBrowserLanguage();
};

// Store language preference in localStorage
export const storeLanguagePreference = (language: SupportedLanguage): void => {
  localStorage.setItem('preferredLanguage', language);
};

// Base translations for the application
export const baseTranslations: Translations = {
  en: {
    'app.title': 'TensorFlow.js Model Explorer',
    'app.description': 'Explore and use TensorFlow.js models in your browser',
    'model.loading': 'Loading model...',
    'model.loaded': 'Model loaded successfully',
    'model.error': 'Error loading model',
    'model.inference': 'Running inference...',
    'model.memory': 'Memory Usage',
    'model.select': 'Select Model',
    'model.run': 'Run Model',
    'model.accuracy': 'Model Accuracy',
    'model.processing': 'Processing...',
    'model.complete': 'Processing complete',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.advanced': 'Advanced Settings',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.deploy': 'Deploy',
    'action.export': 'Export',
    'action.analyze': 'Analyze',
    'error.general': 'An error occurred',
    'error.model': 'Model error',
    'error.network': 'Network error',
    'error.browser': 'Browser not supported'
  },
  es: {
    'app.title': 'Explorador de Modelos TensorFlow.js',
    'app.description': 'Explora y utiliza modelos de TensorFlow.js en tu navegador',
    'model.loading': 'Cargando modelo...',
    'model.loaded': 'Modelo cargado correctamente',
    'model.error': 'Error al cargar el modelo',
    'model.inference': 'Ejecutando inferencia...',
    'model.memory': 'Uso de memoria',
    'model.select': 'Seleccionar Modelo',
    'model.run': 'Ejecutar Modelo',
    'model.accuracy': 'Precisión del Modelo',
    'model.processing': 'Procesando...',
    'model.complete': 'Procesamiento completo',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.advanced': 'Configuración Avanzada',
    'action.save': 'Guardar',
    'action.cancel': 'Cancelar',
    'action.deploy': 'Implementar',
    'action.export': 'Exportar',
    'action.analyze': 'Analizar',
    'error.general': 'Ocurrió un error',
    'error.model': 'Error del modelo',
    'error.network': 'Error de red',
    'error.browser': 'Navegador no compatible'
  },
  // Add more languages as needed...
  fr: {
    'app.title': 'Explorateur de Modèles TensorFlow.js',
    'app.description': 'Explorez et utilisez des modèles TensorFlow.js dans votre navigateur',
    'model.loading': 'Chargement du modèle...',
    'model.loaded': 'Modèle chargé avec succès',
    'model.error': 'Erreur lors du chargement du modèle',
    'model.inference': 'Exécution de l\'inférence...',
    'model.memory': 'Utilisation de la mémoire',
    'model.select': 'Sélectionner le Modèle',
    'model.run': 'Exécuter le Modèle',
    'model.accuracy': 'Précision du Modèle',
    'model.processing': 'Traitement en cours...',
    'model.complete': 'Traitement terminé',
    'settings.language': 'Langue',
    'settings.theme': 'Thème',
    'settings.advanced': 'Paramètres Avancés',
    'action.save': 'Enregistrer',
    'action.cancel': 'Annuler',
    'action.deploy': 'Déployer',
    'action.export': 'Exporter',
    'action.analyze': 'Analyser',
    'error.general': 'Une erreur s\'est produite',
    'error.model': 'Erreur de modèle',
    'error.network': 'Erreur de réseau',
    'error.browser': 'Navigateur non pris en charge'
  },
  de: {
    // German translations to be added
    'app.title': 'TensorFlow.js Modell-Explorer',
    'app.description': 'Erkunden und verwenden Sie TensorFlow.js-Modelle in Ihrem Browser',
    'model.loading': 'Modell wird geladen...',
    'model.loaded': 'Modell erfolgreich geladen',
    'model.error': 'Fehler beim Laden des Modells',
    'model.inference': 'Inferenz wird ausgeführt...',
    'model.memory': 'Speichernutzung',
    'model.select': 'Modell auswählen',
    'model.run': 'Modell ausführen',
    'model.accuracy': 'Modellgenauigkeit',
    'model.processing': 'Verarbeitung...',
    'model.complete': 'Verarbeitung abgeschlossen',
    'settings.language': 'Sprache',
    'settings.theme': 'Thema',
    'settings.advanced': 'Erweiterte Einstellungen',
    'action.save': 'Speichern',
    'action.cancel': 'Abbrechen',
    'action.deploy': 'Bereitstellen',
    'action.export': 'Exportieren',
    'action.analyze': 'Analysieren',
    'error.general': 'Ein Fehler ist aufgetreten',
    'error.model': 'Modellfehler',
    'error.network': 'Netzwerkfehler',
    'error.browser': 'Browser nicht unterstützt'
  },
  zh: {
    // Chinese translations to be added
    'app.title': 'TensorFlow.js 模型浏览器',
    'app.description': '在浏览器中探索和使用 TensorFlow.js 模型',
    'model.loading': '正在加载模型...',
    'model.loaded': '模型加载成功',
    'model.error': '加载模型时出错',
    'model.inference': '正在运行推理...',
    'model.memory': '内存使用情况',
    'model.select': '选择模型',
    'model.run': '运行模型',
    'model.accuracy': '模型精度',
    'model.processing': '正在处理...',
    'model.complete': '处理完成',
    'settings.language': '语言',
    'settings.theme': '主题',
    'settings.advanced': '高级设置',
    'action.save': '保存',
    'action.cancel': '取消',
    'action.deploy': '部署',
    'action.export': '导出',
    'action.analyze': '分析',
    'error.general': '发生错误',
    'error.model': '模型错误',
    'error.network': '网络错误',
    'error.browser': '不支持的浏览器'
  },
  ja: {
    // Japanese translations to be added
    'app.title': 'TensorFlow.js モデルエクスプローラー',
    'app.description': 'ブラウザでTensorFlow.jsモデルを探索して使用する',
    'model.loading': 'モデルを読み込み中...',
    'model.loaded': 'モデルが正常に読み込まれました',
    'model.error': 'モデルの読み込み中にエラーが発生しました',
    'model.inference': '推論を実行中...',
    'model.memory': 'メモリ使用量',
    'model.select': 'モデルを選択',
    'model.run': 'モデルを実行',
    'model.accuracy': 'モデルの精度',
    'model.processing': '処理中...',
    'model.complete': '処理完了',
    'settings.language': '言語',
    'settings.theme': 'テーマ',
    'settings.advanced': '詳細設定',
    'action.save': '保存',
    'action.cancel': 'キャンセル',
    'action.deploy': 'デプロイ',
    'action.export': 'エクスポート',
    'action.analyze': '分析',
    'error.general': 'エラーが発生しました',
    'error.model': 'モデルエラー',
    'error.network': 'ネットワークエラー',
    'error.browser': 'サポートされていないブラウザ'
  }
};

// Hook for using translations in components
export const useTranslation = () => {
  const [language, setLanguage] = useState<SupportedLanguage>(getStoredLanguage());
  const [translations, setTranslations] = useState<TranslationDict>(baseTranslations[language] || baseTranslations[DEFAULT_LANGUAGE]);

  // Update translations when language changes
  useEffect(() => {
    setTranslations(baseTranslations[language] || baseTranslations[DEFAULT_LANGUAGE]);
    storeLanguagePreference(language);
  }, [language]);

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    let translatedText = translations[key] || baseTranslations[DEFAULT_LANGUAGE][key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translatedText = translatedText.replace(`{{${paramKey}}}`, paramValue);
      });
    }
    
    return translatedText;
  };

  return { t, language, setLanguage, languages: LANGUAGE_NAMES };
};
