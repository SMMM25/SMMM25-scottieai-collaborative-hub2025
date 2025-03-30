
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/utils/i18nUtils';

interface TranslatedButtonProps {
  translationKey: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
}

const TranslatedButton: React.FC<TranslatedButtonProps> = ({
  translationKey,
  onClick,
  className = '',
  variant = 'default',
  disabled = false
}) => {
  const { t } = useTranslation();
  
  return (
    <Button 
      onClick={onClick} 
      className={className} 
      variant={variant}
      disabled={disabled}
    >
      {t(translationKey)}
    </Button>
  );
};

export default TranslatedButton;
