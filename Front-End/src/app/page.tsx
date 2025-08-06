"use client";
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import dynamicLib from 'next/dynamic';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { fetchApi } from '@/lib/utils';
import { Suspense } from 'react';
import Footer from '@/components/Footer';

// 🧪 TEST: ZoneGrid seul (MapView toujours désactivé)
const ZoneGridLazy = dynamicLib(() => import('@/components/ZoneGrid'), {
  ssr: false,
  loading: () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
      <div className="text-blue-600">🧪 Chargement ZoneGrid pour test...</div>
    </div>
  ),
});

export const dynamic = 'force-dynamic';

interface PerformanceMetrics {
  memoryStart: number;
  memoryCurrent: number;
  memoryPeak: number;
  zoneGridLoaded: boolean;
  loadTime: number;
  renderTime: number;
  frameDrops: number;
  lastFrameTime: number;
  componentMountTime: number;
  apiResponseTime: number;
  totalElements: number;
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const [welcome, setWelcome] = React.useState(t('welcome'));
  const [debugInfo, setDebugInfo] = React.useState<PerformanceMetrics>({
    memoryStart: 0,
    memoryCurrent: 0,
    memoryPeak: 0,
    zoneGridLoaded: false,
    loadTime: 0,
    renderTime: 0,
    frameDrops: 0,
    lastFrameTime: 0,
    componentMountTime: 0,
    apiResponseTime: 0,
    totalElements: 0
  });

  const [logs, setLogs] = React.useState<string[]>([]);
  const lastFrameTimeRef = React.useRef(0);
  const frameDropCountRef = React.useRef(0);

  // 📊 Fonction pour ajouter des logs horodatés
  const addLog = React.useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`🧪 ${logMessage}`);
    setLogs(prev => [...prev.slice(-9), logMessage]); // Garde seulement les 10 derniers logs
  }, []);

  // 🎯 Monitoring des performances de rendu (FPS)
  React.useEffect(() => {
    let animationId: number;

    const checkFrameRate = (currentTime: number) => {
      if (lastFrameTimeRef.current) {
        const deltaTime = currentTime - lastFrameTimeRef.current;

        // Si > 20ms entre frames = drop de FPS (moins de 50 FPS)
        if (deltaTime > 20) {
          frameDropCountRef.current++;
          if (frameDropCountRef.current % 10 === 0) { // Log tous les 10 drops
            addLog(`⚠️ Frame drop détecté: ${Math.round(deltaTime)}ms (${Math.round(1000 / deltaTime)} FPS)`, 'warning');
          }
        }
      }

      lastFrameTimeRef.current = currentTime;
      setDebugInfo(prev => ({
        ...prev,
        frameDrops: frameDropCountRef.current,
        lastFrameTime: Math.round(currentTime)
      }));

      animationId = requestAnimationFrame(checkFrameRate);
    };

    animationId = requestAnimationFrame(checkFrameRate);
    return () => cancelAnimationFrame(animationId);
  }, [addLog]);

  // 🔍 Monitoring mémoire avancé
  React.useEffect(() => {
    let startMemory = 0;
    if (typeof window !== 'undefined' && 'memory' in performance) {
      startMemory = Math.round((performance as any).memory.usedJSHeapSize / 1048576);
      setDebugInfo(prev => ({ ...prev, memoryStart: startMemory, memoryPeak: startMemory }));
      addLog(`🚀 Démarrage - Mémoire initiale: ${startMemory}MB`);
    }

    const monitor = setInterval(() => {
      if (typeof window !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;
        const currentMemory = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMemory = Math.round(memory.totalJSHeapSize / 1048576);
        const limit = Math.round(memory.jsHeapSizeLimit / 1048576);

        setDebugInfo(prev => {
          const newPeak = Math.max(prev.memoryPeak, currentMemory);
          const delta = currentMemory - prev.memoryStart;

          // Alerte si augmentation importante
          if (delta > prev.memoryCurrent - prev.memoryStart + 20) {
            addLog(`📈 Pic mémoire: +${delta}MB (${currentMemory}/${totalMemory}MB, limite: ${limit}MB)`, 'warning');
          }

          return {
            ...prev,
            memoryCurrent: currentMemory,
            memoryPeak: newPeak
          };
        });
      }
    }, 1500);

    return () => clearInterval(monitor);
  }, [addLog]);

  // 🧪 Détection avancée du chargement ZoneGrid avec métriques
  React.useEffect(() => {
    const startTime = performance.now();
    let componentDetected = false;

    const observer = new MutationObserver((mutations) => {
      const mutationTime = performance.now();

      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          const addedElements = Array.from(mutation.addedNodes).filter(node => node.nodeType === 1);

          // Comptage des éléments ajoutés
          if (addedElements.length > 5) {
            setDebugInfo(prev => ({
              ...prev,
              totalElements: prev.totalElements + addedElements.length
            }));
          }

          // Détection ZoneGrid
          const hasZoneGrid = addedElements.some((node) => {
            const element = node as Element;
            return (
              element.querySelector?.('.grid') ||
              element.classList?.contains('grid') ||
              element.querySelector?.('[class*="grid-cols"]')
            );
          });

          if (hasZoneGrid && !componentDetected) {
            componentDetected = true;
            const totalLoadTime = mutationTime - startTime;
            const renderTime = performance.now() - mutationTime;

            setDebugInfo(prev => ({
              ...prev,
              zoneGridLoaded: true,
              loadTime: Math.round(totalLoadTime),
              componentMountTime: Math.round(mutationTime - startTime),
              renderTime: Math.round(renderTime)
            }));

            addLog(`✅ ZoneGrid détecté! Temps total: ${Math.round(totalLoadTime)}ms`);
            addLog(`📊 Mount: ${Math.round(mutationTime - startTime)}ms, Render: ${Math.round(renderTime)}ms`);

            // Analyse post-chargement
            setTimeout(() => {
              const cards = document.querySelectorAll('[class*="Card"]');
              const images = document.querySelectorAll('img');
              addLog(`📋 Éléments chargés: ${cards.length} cartes, ${images.length} images`);
            }, 500);

            observer.disconnect();
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      attributeOldValue: false
    });

    return () => observer.disconnect();
  }, [addLog]);

  // 📡 Monitoring des requêtes API
  React.useEffect(() => {
    const cacheKey = `greeting-${i18n.language}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setWelcome(cached);
      addLog(`💾 Message du cache utilisé`);
      return;
    }

    const apiStart = performance.now();
    addLog(`📡 Requête API greeting...`);

    fetchApi<{ message: string }>("/api/public/greeting", {
      headers: { 'Accept-Language': i18n.language },
    })
      .then((d) => {
        const apiTime = performance.now() - apiStart;
        setDebugInfo(prev => ({ ...prev, apiResponseTime: Math.round(apiTime) }));

        if (d?.message) {
          setWelcome(d.message);
          sessionStorage.setItem(cacheKey, d.message);
          addLog(`✅ API greeting: ${Math.round(apiTime)}ms`);
        } else {
          addLog(`⚠️ API greeting sans données: ${Math.round(apiTime)}ms`, 'warning');
        }
      })
      .catch((err) => {
        const apiTime = performance.now() - apiStart;
        addLog(`❌ Erreur API greeting: ${Math.round(apiTime)}ms - ${err.message}`, 'error');
      });
  }, [i18n.language, t, addLog]);

  // 🎯 Fonction de diagnostic automatique
  const getDiagnostic = React.useCallback(() => {
    const memoryDelta = debugInfo.memoryCurrent - debugInfo.memoryStart;
    const memoryPeakDelta = debugInfo.memoryPeak - debugInfo.memoryStart;

    if (!debugInfo.zoneGridLoaded) return "⏳ En attente du chargement...";

    const issues: string[] = [];
    const warnings: string[] = [];
    const success: string[] = [];

    // Analyse mémoire
    if (memoryPeakDelta > 100) issues.push(`🚨 Pic mémoire critique: +${memoryPeakDelta}MB`);
    else if (memoryPeakDelta > 50) warnings.push(`⚠️ Pic mémoire élevé: +${memoryPeakDelta}MB`);
    else success.push(`✅ Mémoire acceptable: +${memoryPeakDelta}MB max`);

    // Analyse temps de chargement
    if (debugInfo.loadTime > 3000) issues.push(`🚨 Chargement très lent: ${debugInfo.loadTime}ms`);
    else if (debugInfo.loadTime > 1000) warnings.push(`⚠️ Chargement lent: ${debugInfo.loadTime}ms`);
    else success.push(`✅ Chargement rapide: ${debugInfo.loadTime}ms`);

    // Analyse FPS
    if (debugInfo.frameDrops > 50) issues.push(`🚨 Nombreux drops FPS: ${debugInfo.frameDrops}`);
    else if (debugInfo.frameDrops > 10) warnings.push(`⚠️ Quelques drops FPS: ${debugInfo.frameDrops}`);
    else success.push(`✅ FPS stable: ${debugInfo.frameDrops} drops`);

    return { issues, warnings, success };
  }, [debugInfo]);

  const diagnostic = getDiagnostic();

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* 🧪 Panel de Test Avancé */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-6 m-4">
        <div className="ml-3 w-full">
          <h3 className="text-lg font-medium text-blue-800 mb-4">
            🧪 Diagnostic Avancé ZoneGrid - MapView Désactivé
          </h3>

          {/* Métriques principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-600">Mémoire Start</div>
              <div className="text-lg font-bold text-blue-600">{debugInfo.memoryStart}MB</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-600">Mémoire Now</div>
              <div className={`text-lg font-bold ${
                debugInfo.memoryCurrent > debugInfo.memoryStart + 50 ? 'text-red-600' :
                debugInfo.memoryCurrent > debugInfo.memoryStart + 20 ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {debugInfo.memoryCurrent}MB
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-600">Pic Mémoire</div>
              <div className="text-lg font-bold text-purple-600">{debugInfo.memoryPeak}MB</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-600">Chargement</div>
              <div className={`text-lg font-bold ${debugInfo.zoneGridLoaded ? 'text-green-600' : 'text-gray-400'}`}>
                {debugInfo.zoneGridLoaded ? `${debugInfo.loadTime}ms` : '⏳'}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-600">Frame Drops</div>
              <div className={`text-lg font-bold ${
                debugInfo.frameDrops > 50 ? 'text-red-600' :
                debugInfo.frameDrops > 10 ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {debugInfo.frameDrops}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-600">Éléments DOM</div>
              <div className="text-lg font-bold text-indigo-600">{debugInfo.totalElements}</div>
            </div>
          </div>

          {/* Diagnostic automatique */}
          {typeof diagnostic === 'object' && (
            <div className="mb-4 space-y-2">
              {diagnostic.issues.map((issue, i) => (
                <div key={i} className="text-red-700 font-medium">{issue}</div>
              ))}
              {diagnostic.warnings.map((warning, i) => (
                <div key={i} className="text-orange-700">{warning}</div>
              ))}
              {diagnostic.success.map((success, i) => (
                <div key={i} className="text-green-700">{success}</div>
              ))}
            </div>
          )}

          {/* Logs en temps réel */}
          <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
            <div className="text-white mb-1">📋 Logs temps réel:</div>
            {logs.map((log, i) => (
              <div key={i} className="opacity-80">{log}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {welcome || t('welcome')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              🧪 <strong>Test ZoneGrid Avancé:</strong> Monitoring complet des performances.
            </p>
          </div>

          <SearchBar />
        </div>
      </section>

      {/* 🚫 Map section désactivée */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center space-y-4">
                <div className="text-6xl">🚫</div>
                <h3 className="text-xl font-semibold text-gray-700">
                  MapView Complètement Désactivé
                </h3>
                <p className="text-gray-600">
                  Focus sur le test de ZoneGrid uniquement.<br />
                  <span className="text-sm text-blue-600">Scrollez vers le bas pour charger ZoneGrid</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🧪 TEST: ZoneGrid section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🧪 Test ZoneGrid avec Monitoring Avancé
            </h2>
            <p className="text-gray-600">
              Surveillance mémoire, FPS, temps de rendu et éléments DOM
            </p>
          </div>

          <Suspense fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-blue-600 font-medium">🧪 Chargement ZoneGrid...</p>
              <p className="text-sm text-gray-500 mt-2">Monitoring en cours...</p>
            </div>
          }>
            <ZoneGridLazy />
          </Suspense>
        </div>
      </section>

      {/* Résultats de diagnostic */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              📊 Analyse de Performance
            </h2>
            <div className="max-w-4xl mx-auto">
              {debugInfo.zoneGridLoaded ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">🔍 Métriques Détaillées</h3>
                    <div className="space-y-2 text-sm">
                      <div>⏱️ Temps de chargement: <strong>{debugInfo.loadTime}ms</strong></div>
                      <div>🏗️ Temps de mount: <strong>{debugInfo.componentMountTime}ms</strong></div>
                      <div>🎨 Temps de rendu: <strong>{debugInfo.renderTime}ms</strong></div>
                      <div>📡 API Response: <strong>{debugInfo.apiResponseTime}ms</strong></div>
                      <div>📊 Éléments créés: <strong>{debugInfo.totalElements}</strong></div>
                      <div>📈 Pic mémoire: <strong>+{debugInfo.memoryPeak - debugInfo.memoryStart}MB</strong></div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">🎯 Recommandations</h3>
                    <div className="space-y-2 text-sm">
                      {debugInfo.loadTime > 2000 && (
                        <div className="text-red-600">• Optimiser le temps de chargement (lazy loading images)</div>
                      )}
                      {debugInfo.memoryPeak - debugInfo.memoryStart > 50 && (
                        <div className="text-orange-600">• Réduire l'empreinte mémoire (pagination plus agressive)</div>
                      )}
                      {debugInfo.frameDrops > 20 && (
                        <div className="text-red-600">• Optimiser les animations et transitions</div>
                      )}
                      {debugInfo.totalElements > 500 && (
                        <div className="text-orange-600">• Implémenter la virtualisation (react-window)</div>
                      )}
                      <div className="text-green-600">• Monitoring actif pour détecter les régressions</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  ⏳ En attente du chargement de ZoneGrid...
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
