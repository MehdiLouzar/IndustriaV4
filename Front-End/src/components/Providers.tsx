'use client';

import { I18nextProvider } from 'react-i18next'
import i18n, { setupClientI18n } from '../i18n'
import { useEffect } from 'react'
import '../i18n'
import '../lib/emergency-monitor'

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    setupClientI18n()
  }, [])
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
