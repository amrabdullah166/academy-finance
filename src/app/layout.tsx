import type { Metadata } from 'next'
import './globals.css'
import '../styles/responsive-new.css'
import Navigation from '@/components/navigation'

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
      </body>
    </html>
  );
}
