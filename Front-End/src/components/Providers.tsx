'use client';

import { useEffect } from 'react';
import { initI18n } from '../i18n';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initI18n();
  }, []);

  return <>{children}</>;
}
