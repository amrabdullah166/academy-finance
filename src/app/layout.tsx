import type { Metadata } from 'next'
import './globals.css'
import '../styles/responsive-new.css'
import Navigation from '@/components/navigation-new'
import Script from 'next/script'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: "أكاديمية بساط العلم - النظام المالي",
  description: "نظام إدارة مالي متكامل لأكاديمية بساط العلم",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
  <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Academy Finance" />
        
        {/* منع الـ cache المفرط */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased bg-gray-50 min-h-screen font-cairo" dir="rtl">
        <Navigation />
        <main className="main-content-desktop md:mr-64 min-h-screen bg-gray-50">
          <div className="p-6 pt-20 md:pt-6">
            {children}
          </div>
        </main>
        <Toaster position="top-center" dir="rtl" />
        <Script id="sw-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                    
                    // التحقق من وجود تحديثات
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // يوجد تحديث جديد
                            if (confirm('يوجد تحديث جديد للموقع. هل تريد تحديث الصفحة؟')) {
                              window.location.reload();
                            }
                          }
                        });
                      }
                    });
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
                
                // إضافة دوال لمسح الـ cache
                window.clearAppCache = function() {
                  if ('serviceWorker' in navigator && 'caches' in window) {
                    caches.keys().then(function(cacheNames) {
                      return Promise.all(
                        cacheNames.map(function(cacheName) {
                          console.log('Deleting cache:', cacheName);
                          return caches.delete(cacheName);
                        })
                      );
                    }).then(function() {
                      console.log('All caches cleared!');
                      // إعادة تحميل الصفحة
                      window.location.reload(true);
                    });
                  }
                };
                
                // دالة لإجبار تحديث Service Worker
                window.forceUpdateSW = function() {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(function(registration) {
                      registration.update().then(function() {
                        window.location.reload();
                      });
                    });
                  }
                };
                
                // مسح الـ cache تلقائياً كل 30 دقيقة
                setInterval(function() {
                  if ('caches' in window) {
                    caches.keys().then(function(cacheNames) {
                      cacheNames.forEach(function(cacheName) {
                        if (cacheName.includes('academy-finance-v') || cacheName.includes('academy-data-v')) {
                          caches.delete(cacheName);
                        }
                      });
                    });
                  }
                }, 30 * 60 * 1000); // 30 دقيقة
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
