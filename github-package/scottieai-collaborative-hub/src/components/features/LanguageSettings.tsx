
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Globe, Check } from 'lucide-react';
import { 
  useTranslation, 
  SupportedLanguage, 
  LANGUAGE_NAMES 
} from '@/utils/i18nUtils';
import TranslatedText from '@/components/i18n/TranslatedText';
import TranslatedButton from '@/components/i18n/TranslatedButton';
import { toast } from 'sonner';

interface LanguageSettingsProps {
  onLanguageChange?: (language: SupportedLanguage) => void;
  className?: string;
}

const LanguageSettings: React.FC<LanguageSettingsProps> = ({
  onLanguageChange,
  className = ''
}) => {
  const { language, setLanguage, languages, t } = useTranslation();
  
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
    toast.success(`Language changed to ${languages[lang]}`);
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-scottie" />
          <CardTitle>
            <TranslatedText translationKey="settings.language" />
          </CardTitle>
        </div>
        <CardDescription>
          <TranslatedText translationKey="settings.language" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(Object.entries(languages) as [SupportedLanguage, string][]).map(([code, name]) => (
            <div 
              key={code}
              className={`p-3 rounded-md border cursor-pointer transition-all flex items-center justify-between ${
                language === code ? 'border-scottie bg-scottie/5' : 'hover:border-scottie/30'
              }`}
              onClick={() => handleLanguageChange(code)}
            >
              <span>{name}</span>
              {language === code && <Check className="h-4 w-4 text-scottie" />}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          <TranslatedText 
            translationKey="model.language" 
            params={{ current: languages[language] }} 
          />
        </span>
        <TranslatedButton 
          translationKey="action.save" 
          variant="outline" 
          onClick={() => toast.success(`Language preference saved: ${languages[language]}`)}
        />
      </CardFooter>
    </Card>
  );
};

export default LanguageSettings;
