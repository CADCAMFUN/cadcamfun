// src/pages/_app.tsx
import 'src/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { Inter } from 'next/font/google';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from 'src/contexts/ToastContext';
import PageTransition from '../components/layout/PageTransition';
import PWAInstallPrompt from '../components/ui/PWAInstallPrompt';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NotificationProvider } from '../contexts/NotificationContext';
import SW from '../contexts/ServiceWorker';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { camFont } from 'src/lib/camFont';
import { useEffect } from 'react';
import ErrorBoundary from '../components/ui/ErrorBonduary';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import PageViewTracker from '../components/analytics/PageViewTracker';
import usePageTracker from '../hooks/usePageTracker';
import { useActivityTracking } from '../hooks/useActivityTracking';
import { Toaster } from 'react-hot-toast';
import { AnalyticsProvider } from '../contexts/AnalyticsContext';
import ViewportMeta from '../components/layout/ViewportMeta';
import { AIContextProvider } from '../components/ai/ai-new/AIContextProvider';
import { CursorProvider } from '../contexts/CursorContext';
import { PluginClientProvider } from '../context/PluginClientContext';
import Layout from '@/src/components/layout/Layout';
import { initializePluginRegistry } from '@/src/hooks/usePluginRegistry';
import { PluginRegistry, PluginStorage } from '@/src/plugins/core/registry';
import { InMemoryPluginStorage } from '@/src/plugins/core/registry/pluginStorage';
import MetaTags from '../components/layout/Metatags';
import { useElementsStore } from 'src/store/elementsStore';
import { ThemeProvider } from '../contexts/ThemeProvider';
import { ConstraintProvider } from '../contexts/ConstraintContext';



// Ensure this initialization runs only once client-side
let pluginSystemInitialized = false;

export default function App({ Component, pageProps: { session, ...pageProps }, router }: AppProps) {


  
  // Get the function to add elements from the Zustand store
  const addElements = useElementsStore((state) => state.addElements);

  // Service Worker Registration Effect (existing)
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered successfully:', registration.scope);
          })
          .catch(error => {
            console.log('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  // Plugin System Initialization Effect
  useEffect(() => {
    const initializePluginSystem = async () => {
       // Prevent double initialization
      if (pluginSystemInitialized) {
          console.log('[_app] Plugin system already initialized.');
          return;
      }
      pluginSystemInitialized = true; // Set flag immediately

      console.log('[_app] Initializing Plugin System...');
      try {
        // === Initialize Client-Side Plugin Registry ===
        // Use explicit client-side storage (e.g., in-memory for now)
        // In a real app, you might create a LocalStorage based provider
        const clientStorage = new PluginStorage(new InMemoryPluginStorage());
        const registry = new PluginRegistry(clientStorage);
        // Note: registry.init() is called in constructor, no need to await here

        // Set the global instance for the usePluginRegistry hook
        initializePluginRegistry(registry);
        console.log('[_app] Client-side PluginRegistry initialized and set for hook.');

      } catch (error) {
        console.error('[_app] Failed to initialize plugin system:', error);
        // Optionally: Set some global error state or show a notification
      }
    };
    
    // Run initialization only on the client
    if (typeof window !== 'undefined') {
       initializePluginSystem();
    }

  }, []); // Empty dependency array ensures this runs only once on mount
  
  return (
    <ErrorBoundary>

      <SessionProvider session={session}>
        <AuthProvider>
          <LanguageProvider>
            <MetaTags ogImage="/og-image.png" />
            <main className={`${camFont.style.fontFamily} antialiased bg-white dark:bg-gray-900`}>
            <div id="plugin-container-root" style={{ position: 'relative', zIndex: 1000 }} />
            <ThemeProvider>
              <SubscriptionProvider>
                <NotificationProvider>
                  <ToastProvider>
                    <AnimatePresence mode="wait">
                      <PageTransition key={router.route}>
                        <PageViewTracker />
                        <AnalyticsProvider>
                          <CursorProvider>
                            <ConstraintProvider>
                            <AIContextProvider addElementsToCanvas={addElements}>
                              <style jsx global>{`
                                body {
                                  font-family: ${camFont.style.fontFamily};
                                }
                              `}</style>
                              <ViewportMeta />
                              <PluginClientProvider>
                                <Component {...pageProps} />
                              </PluginClientProvider>
                            </AIContextProvider>
                           </ConstraintProvider>
                          </CursorProvider>
                        </AnalyticsProvider>
                        <PWAInstallPrompt />
                      </PageTransition>
                    </AnimatePresence>
                  </ToastProvider>
                </NotificationProvider>
              </SubscriptionProvider>
              </ThemeProvider>
            </main>
          </LanguageProvider>
        </AuthProvider>
      </SessionProvider>

    </ErrorBoundary>
  );
}