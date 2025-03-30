
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { 
  RadioGroup, 
  RadioGroupItem 
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslation, SupportedLanguage, LANGUAGE_NAMES } from '@/utils/i18nUtils';

interface ModelLanguageSelectorProps {
  supportedLanguages: SupportedLanguage[];
  onChange?: (language: SupportedLanguage) => void;
  className?: string;
}

const ModelLanguageSelector: React.FC<ModelLanguageSelectorProps> = ({
  supportedLanguages,
  onChange,
  className = ''
}) => {
  const { language, setLanguage, t } = useTranslation();
  
  const handleLanguageChange = (value: string) => {
    const lang = value as SupportedLanguage;
    setLanguage(lang);
    if (onChange) {
      onChange(lang);
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle>{t('settings.language')}</CardTitle>
        <CardDescription>
          {t('model.select')} {supportedLanguages.length} {t('settings.language')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={language} 
          onValueChange={handleLanguageChange}
          className="grid grid-cols-2 gap-4"
        >
          {supportedLanguages.map((lang) => (
            <div key={lang} className="flex items-center space-x-2">
              <RadioGroupItem value={lang} id={`lang-${lang}`} />
              <Label htmlFor={`lang-${lang}`}>{LANGUAGE_NAMES[lang]}</Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default ModelLanguageSelector;
