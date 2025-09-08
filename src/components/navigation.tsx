'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  CreditCard, 
  Receipt, 
  UserCheck, 
  BarChart3,
  Calendar,
  BookOpen,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navigationItems = [
  {
    name: 'لوحة التحكم',
    href: '/',
    icon: Home
  },
  {
    name: 'الطلاب',
    href: '/students',
    icon: Users
  },
  {
    name: 'الكورسات',
    href: '/courses',
    icon: BookOpen
  },
  {
    name: 'المدفوعات',
    href: '/payments',
    icon: CreditCard
  },
  {
    name: 'الاشتراكات الشهرية',
    href: '/subscriptions',
    icon: Calendar
  },
  {
    name: 'المصروفات',
    href: '/expenses',
    icon: Receipt
  },
  {
    name: 'الموظفين',
    href: '/employees',
    icon: UserCheck
  },
  {
    name: 'التقارير المالية',
    href: '/reports',
    icon: BarChart3
  }
]

export default function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div>
      {/* Desktop Navigation - Fixed Sidebar */}
      <div 
        className="hidden md:block fixed top-0 right-0 w-64 h-screen bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto"
        style={{ display: 'block' }}
      >
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 mb-1">أكاديمية بساط العلم</h1>
          <p className="text-sm text-gray-600">النظام المالي</p>
        </div>
        
        <div className="p-4">
          <nav>
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-blue-50 text-blue-700 border-r-4 border-blue-700" 
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className={cn(
                        "ml-3 h-5 w-5",
                        isActive ? "text-blue-600" : "text-gray-500"
                      )} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center z-50">
          <h1 className="text-lg font-bold text-gray-900">أكاديمية بساط العلم</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg">
              <div className="p-6 border-b">
                <h1 className="text-xl font-bold text-gray-900">أكاديمية بساط العلم</h1>
                <p className="text-sm text-gray-600">النظام المالي</p>
              </div>
              <div className="p-4">
                <nav>
                  <ul className="space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center px-4 py-3 text-sm font-medium rounded-lg",
                              isActive 
                                ? "bg-blue-50 text-blue-700" 
                                : "text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <Icon className="ml-3 h-5 w-5" />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile spacer */}
        <div className="h-20" />
      </div>
    </div>
  )
}
