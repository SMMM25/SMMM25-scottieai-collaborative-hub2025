
import React from 'react';
import { useTranslation } from '@/utils/i18nUtils';

interface TranslatedTextProps {
  translationKey: string;
  params?: Record<string, string>;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

const TranslatedText: React.FC<TranslatedTextProps> = ({
  translationKey,
  params,
  as: Component = 'span',
  className = ''
}) => {
  const { t } = useTranslation();
  
  return (
    <Component className={className}>
      {t(translationKey, params)}
    </Component>
  );
};

export default TranslatedText;
