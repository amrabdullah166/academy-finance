'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, TrendingUp, TrendingDown, Download, BarChart3, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { getDashboardStats, getPayments, getExpenses } from '@/lib/supabase'

interface FinancialData {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  monthlyRevenue: { month: string; amount: number }[]
  monthlyExpenses: { month: string; amount: number }[]
  expensesByCategory: { category: string; amount: number; count: number }[]
  revenueByMethod: { method: string; amount: number; count: number }[]
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    monthlyRevenue: [],
    monthlyExpenses: [],
    expensesByCategory: [],
    revenueByMethod: []
  })
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const [reportType, setReportType] = useState('monthly')

  useEffect(() => {
    loadFinancialData()
  }, [dateRange])

  const loadFinancialData = async () => {
    setLoading(true)
    try {
      const [payments, expenses] = await Promise.all([
        getPayments(),
        getExpenses()
      ])

      // Filter data by date range
      const filteredPayments = payments.filter(payment => 
        payment.payment_date >= dateRange.startDate && 
        payment.payment_date <= dateRange.endDate &&
        payment.status === 'completed'
      )

      const filteredExpenses = expenses.filter(expense => 
        expense.expense_date >= dateRange.startDate && 
        expense.expense_date <= dateRange.endDate &&
        expense.status === 'paid'
      )

      // Calculate totals
      const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const netProfit = totalRevenue - totalExpenses

      // Monthly revenue
      const monthlyRevenue = getMonthlyData(filteredPayments, 'payment_date')
      
      // Monthly expenses
      const monthlyExpenses = getMonthlyData(filteredExpenses, 'expense_date')

      // Expenses by category
      const expensesByCategory = getExpensesByCategory(filteredExpenses)

      // Revenue by payment method
      const revenueByMethod = getRevenueByMethod(filteredPayments)

      setFinancialData({
        totalRevenue,
        totalExpenses,
        netProfit,
        monthlyRevenue,
        monthlyExpenses,
        expensesByCategory,
        revenueByMethod
      })

    } catch (error) {
      console.error('خطأ في تحميل البيانات المالية:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMonthlyData = (data: any[], dateField: string) => {
    const monthlyData: { [key: string]: number } = {}
    
    data.forEach(item => {
      const date = new Date(item[dateField])
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.amount
    })

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  const getExpensesByCategory = (expenses: any[]) => {
    const categoryData: { [key: string]: { amount: number; count: number } } = {}
    
    expenses.forEach(expense => {
      const category = expense.category
      if (!categoryData[category]) {
        categoryData[category] = { amount: 0, count: 0 }
      }
      categoryData[category].amount += expense.amount
      categoryData[category].count += 1
    })

    return Object.entries(categoryData)
      .map(([category, data]) => ({ category, amount: data.amount, count: data.count }))
      .sort((a, b) => b.amount - a.amount)
  }

  const getRevenueByMethod = (payments: any[]) => {
    const methodData: { [key: string]: { amount: number; count: number } } = {}
    
    payments.forEach(payment => {
      const method = payment.payment_method
      if (!methodData[method]) {
        methodData[method] = { amount: 0, count: 0 }
      }
      methodData[method].amount += payment.amount
      methodData[method].count += 1
    })

    return Object.entries(methodData)
      .map(([method, data]) => ({ method, amount: data.amount, count: data.count }))
      .sort((a, b) => b.amount - a.amount)
  }

  const getCategoryLabel = (category: string) => {
    const categories: { [key: string]: string } = {
      'salaries': 'رواتب',
      'rent': 'إيجار',
      'utilities': 'مرافق عامة',
      'equipment': 'معدات',
      'marketing': 'تسويق',
      'maintenance': 'صيانة',
      'supplies': 'مستلزمات',
      'insurance': 'تأمين',
      'taxes': 'ضرائب',
      'other': 'أخرى'
    }
    return categories[category] || category
  }

  const getMethodLabel = (method: string) => {
    const methods: { [key: string]: string } = {
      'monthly_fee': 'رسوم شهرية',
      'registration': 'رسوم تسجيل',
      'materials': 'مواد دراسية',
      'penalty': 'غرامة',
      'refund': 'استرداد',
      'other': 'أخرى'
    }
    return methods[method] || method
  }

  const exportReport = () => {
    // Here you would implement PDF/Excel export functionality
    alert('سيتم تطوير وظيفة التصدير قريباً')
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">جاري تحميل التقارير...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">التقارير المالية</h1>
          <p className="text-muted-foreground">تحليل شامل للوضع المالي للأكاديمية</p>
        </div>
        
        <Button onClick={exportReport}>
          <Download className="ml-2 h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      {/* Date Range Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="startDate">من تاريخ</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="endDate">إلى تاريخ</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="reportType">نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  <SelectItem value="yearly">سنوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={loadFinancialData}>
              تحديث التقرير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {financialData.totalRevenue.toLocaleString()} ر.س
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {financialData.totalExpenses.toLocaleString()} ر.س
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <DollarSign className={`h-4 w-4 ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {financialData.netProfit.toLocaleString()} ر.س
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.netProfit >= 0 ? 'ربح' : 'خسارة'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.totalRevenue > 0 ? 
                ((financialData.netProfit / financialData.totalRevenue) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly">التقرير الشهري</TabsTrigger>
          <TabsTrigger value="categories">تحليل المصروفات</TabsTrigger>
          <TabsTrigger value="revenue">تحليل الإيرادات</TabsTrigger>
          <TabsTrigger value="comparison">المقارنات</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الإيرادات الشهرية</CardTitle>
                <CardDescription>تطور الإيرادات عبر الأشهر</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشهر</TableHead>
                      <TableHead>المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData.monthlyRevenue.map((item) => (
                      <TableRow key={item.month}>
                        <TableCell>{formatMonth(item.month)}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {item.amount.toLocaleString()} ر.س
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المصروفات الشهرية</CardTitle>
                <CardDescription>تطور المصروفات عبر الأشهر</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشهر</TableHead>
                      <TableHead>المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData.monthlyExpenses.map((item) => (
                      <TableRow key={item.month}>
                        <TableCell>{formatMonth(item.month)}</TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {item.amount.toLocaleString()} ر.س
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>تحليل المصروفات حسب الفئة</CardTitle>
              <CardDescription>توزيع المصروفات على الفئات المختلفة</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفئة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>عدد المعاملات</TableHead>
                    <TableHead>النسبة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.expensesByCategory.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell>{getCategoryLabel(item.category)}</TableCell>
                      <TableCell className="font-medium">
                        {item.amount.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {((item.amount / financialData.totalExpenses) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>تحليل الإيرادات حسب نوع الدفع</CardTitle>
              <CardDescription>توزيع الإيرادات على طرق الدفع المختلفة</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع الدفع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>عدد المعاملات</TableHead>
                    <TableHead>النسبة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.revenueByMethod.map((item) => (
                    <TableRow key={item.method}>
                      <TableCell>{getMethodLabel(item.method)}</TableCell>
                      <TableCell className="font-medium">
                        {item.amount.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {((item.amount / financialData.totalRevenue) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة الإيرادات والمصروفات</CardTitle>
              <CardDescription>مقارنة شهرية بين الإيرادات والمصروفات</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر</TableHead>
                    <TableHead>الإيرادات</TableHead>
                    <TableHead>المصروفات</TableHead>
                    <TableHead>صافي الربح/الخسارة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.monthlyRevenue.map((revenueItem) => {
                    const expenseItem = financialData.monthlyExpenses.find(
                      e => e.month === revenueItem.month
                    )
                    const netAmount = revenueItem.amount - (expenseItem?.amount || 0)
                    
                    return (
                      <TableRow key={revenueItem.month}>
                        <TableCell>{formatMonth(revenueItem.month)}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {revenueItem.amount.toLocaleString()} ر.س
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {(expenseItem?.amount || 0).toLocaleString()} ر.س
                        </TableCell>
                        <TableCell className={`font-medium ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {netAmount.toLocaleString()} ر.س
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
