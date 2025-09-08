'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  ArrowLeft,
  Download,
  Filter,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { getEnhancedDashboardStats, getPayments, getExpenses, Payment, Expense } from '@/lib/supabase'

interface ReportData {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  totalStudents: number
  activeStudents: number
  totalCourses: number
  activeCourses: number
  monthlyData: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
  }>
  paymentMethods: Array<{
    method: string
    amount: number
    count: number
  }>
  expenseCategories: Array<{
    category: string
    amount: number
    count: number
  }>
}

export default function ReportsPageNew() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('current_month')
  const [reportType, setReportType] = useState('financial')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      
      // تحديد نطاق التاريخ
      let start: Date, end: Date
      const now = new Date()
      
      switch (dateRange) {
        case 'current_month':
          start = new Date(now.getFullYear(), now.getMonth(), 1)
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case 'last_month':
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          end = new Date(now.getFullYear(), now.getMonth(), 0)
          break
        case 'current_year':
          start = new Date(now.getFullYear(), 0, 1)
          end = new Date(now.getFullYear(), 11, 31)
          break
        case 'custom':
          start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1)
          end = endDate ? new Date(endDate) : now
          break
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1)
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }

      const [dashboardStats, payments, expenses] = await Promise.all([
        getEnhancedDashboardStats(),
        getPayments(),
        getExpenses()
      ])

      // تصفية البيانات حسب نطاق التاريخ
      const filteredPayments = payments?.filter(p => {
        const paymentDate = new Date(p.payment_date)
        return paymentDate >= start && paymentDate <= end && p.status === 'completed'
      }) || []

      const filteredExpenses = expenses?.filter(e => {
        const expenseDate = new Date(e.expense_date)
        return expenseDate >= start && expenseDate <= end && e.status === 'paid'
      }) || []

      // حساب الإجماليات
      const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
      const netProfit = totalRevenue - totalExpenses

      // تجميع البيانات الشهرية
      const monthlyData = generateMonthlyData(filteredPayments, filteredExpenses)

      // تجميع طرق الدفع
      const paymentMethods = generatePaymentMethodsData(filteredPayments)

      // تجميع فئات المصروفات
      const expenseCategories = generateExpenseCategoriesData(filteredExpenses)

      setReportData({
        totalRevenue,
        totalExpenses,
        netProfit,
        totalStudents: dashboardStats.totalStudents,
        activeStudents: dashboardStats.activeStudents,
        totalCourses: dashboardStats.totalCourses,
        activeCourses: dashboardStats.activeCourses,
        monthlyData,
        paymentMethods,
        expenseCategories
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange, startDate, endDate])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  const generateMonthlyData = (payments: Payment[], expenses: Expense[]) => {
    const monthlyMap = new Map()
    
    // إضافة الإيرادات
    payments.forEach(payment => {
      const month = payment.payment_date.slice(0, 7) // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, revenue: 0, expenses: 0, profit: 0 })
      }
      monthlyMap.get(month).revenue += payment.amount
    })

    // إضافة المصروفات
    expenses.forEach(expense => {
      const month = expense.expense_date.slice(0, 7) // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, revenue: 0, expenses: 0, profit: 0 })
      }
      monthlyMap.get(month).expenses += expense.amount
    })

    // حساب الربح
    monthlyMap.forEach(data => {
      data.profit = data.revenue - data.expenses
    })

    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
  }

  const generatePaymentMethodsData = (payments: Payment[]) => {
    const methodsMap = new Map()
    
    payments.forEach(payment => {
      const method = payment.payment_type
      if (!methodsMap.has(method)) {
        methodsMap.set(method, { method, amount: 0, count: 0 })
      }
      methodsMap.get(method).amount += payment.amount
      methodsMap.get(method).count += 1
    })

    return Array.from(methodsMap.values()).sort((a, b) => b.amount - a.amount)
  }

  const generateExpenseCategoriesData = (expenses: Expense[]) => {
    const categoriesMap = new Map()
    
    expenses.forEach(expense => {
      const category = expense.category
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, { category, amount: 0, count: 0 })
      }
      categoriesMap.get(category).amount += expense.amount
      categoriesMap.get(category).count += 1
    })

    return Array.from(categoriesMap.values()).sort((a, b) => b.amount - a.amount)
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'cash': return 'نقد'
      case 'bank_transfer': return 'تحويل بنكي'
      case 'online': return 'دفع إلكتروني'
      case 'check': return 'شيك'
      default: return method
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'salaries': return 'رواتب'
      case 'rent': return 'إيجار'
      case 'utilities': return 'مرافق عامة'
      case 'equipment': return 'معدات'
      case 'marketing': return 'تسويق'
      case 'maintenance': return 'صيانة'
      case 'supplies': return 'مستلزمات'
      case 'insurance': return 'تأمين'
      case 'taxes': return 'ضرائب'
      case 'other': return 'أخرى'
      default: return category
    }
  }

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]
    return `${months[parseInt(month) - 1]} ${year}`
  }

  const exportToCSV = () => {
    if (!reportData) return

    let csvContent = 'التقرير المالي\n\n'
    
    // الملخص المالي
    csvContent += 'الملخص المالي\n'
    csvContent += `إجمالي الإيرادات,${reportData.totalRevenue}\n`
    csvContent += `إجمالي المصروفات,${reportData.totalExpenses}\n`
    csvContent += `صافي الربح,${reportData.netProfit}\n\n`

    // البيانات الشهرية
    csvContent += 'البيانات الشهرية\n'
    csvContent += 'الشهر,الإيرادات,المصروفات,الربح\n'
    reportData.monthlyData.forEach(data => {
      csvContent += `${getMonthName(data.month)},${data.revenue},${data.expenses},${data.profit}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `financial-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xl text-slate-600">جاري تحميل بيانات التقارير...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                التقارير المالية
              </h1>
              <p className="text-slate-600 text-lg">
                تحليل شامل للأداء المالي والإحصائيات
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV} size="lg">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 mb-6">
        <CardHeader>
          <CardTitle>تصفية التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">مالي</SelectItem>
                  <SelectItem value="students">الطلاب</SelectItem>
                  <SelectItem value="courses">الدورات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>نطاق التاريخ</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">الشهر الحالي</SelectItem>
                  <SelectItem value="last_month">الشهر الماضي</SelectItem>
                  <SelectItem value="current_year">السنة الحالية</SelectItem>
                  <SelectItem value="custom">نطاق مخصص</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateRange === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          {dateRange === 'custom' && (
            <div className="mt-4">
              <Button onClick={fetchReportData}>
                <Filter className="h-4 w-4 ml-2" />
                تطبيق الفلتر
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  إجمالي الإيرادات
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.totalRevenue.toLocaleString()} دينار
                </div>
                <p className="text-xs text-slate-600">خلال الفترة المحددة</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  إجمالي المصروفات
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {reportData.totalExpenses.toLocaleString()} دينار
                </div>
                <p className="text-xs text-slate-600">خلال الفترة المحددة</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  صافي الربح
                </CardTitle>
                <DollarSign className={`h-4 w-4 ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.netProfit.toLocaleString()} دينار
                </div>
                <p className="text-xs text-slate-600">
                  {reportData.netProfit >= 0 ? 'ربح' : 'خسارة'} صافية
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  الطلاب النشطون
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {reportData.activeStudents}
                </div>
                <p className="text-xs text-slate-600">
                  من أصل {reportData.totalStudents} طالب
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 mb-6">
            <CardHeader>
              <CardTitle>الاتجاه الشهري</CardTitle>
              <CardDescription>مقارنة الإيرادات والمصروفات على مدار الفترة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-2">الشهر</th>
                      <th className="text-right py-2">الإيرادات</th>
                      <th className="text-right py-2">المصروفات</th>
                      <th className="text-right py-2">صافي الربح</th>
                      <th className="text-right py-2">النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthlyData.map((data, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{getMonthName(data.month)}</td>
                        <td className="py-2 text-green-600">{data.revenue.toLocaleString()} دينار</td>
                        <td className="py-2 text-red-600">{data.expenses.toLocaleString()} دينار</td>
                        <td className={`py-2 ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.profit.toLocaleString()} دينار
                        </td>
                        <td className="py-2">
                          <Badge variant={data.profit >= 0 ? 'default' : 'destructive'} className="text-xs">
                            {data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : 0}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods & Expense Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle>طرق الدفع</CardTitle>
                <CardDescription>توزيع الإيرادات حسب طريقة الدفع</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{getPaymentMethodName(method.method)}</p>
                        <p className="text-sm text-slate-600">{method.count} دفعة</p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-green-600">{method.amount.toLocaleString()} دينار</p>
                        <p className="text-xs text-slate-500">
                          {reportData.totalRevenue > 0 ? ((method.amount / reportData.totalRevenue) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle>فئات المصروفات</CardTitle>
                <CardDescription>توزيع المصروفات حسب الفئة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.expenseCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{getCategoryName(category.category)}</p>
                        <p className="text-sm text-slate-600">{category.count} مصروف</p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-red-600">{category.amount.toLocaleString()} دينار</p>
                        <p className="text-xs text-slate-500">
                          {reportData.totalExpenses > 0 ? ((category.amount / reportData.totalExpenses) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
