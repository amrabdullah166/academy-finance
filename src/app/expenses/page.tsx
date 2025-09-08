'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit, Trash2, Receipt, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/lib/supabase'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  expense_date: string
  receipt_number?: string
  supplier_name?: string
  payment_method: string
  status: string
  created_at: string
}

const categories = [
  { value: 'salaries', label: 'رواتب' },
  { value: 'rent', label: 'إيجار' },
  { value: 'utilities', label: 'مرافق عامة' },
  { value: 'equipment', label: 'معدات' },
  { value: 'marketing', label: 'تسويق' },
  { value: 'maintenance', label: 'صيانة' },
  { value: 'supplies', label: 'مستلزمات' },
  { value: 'insurance', label: 'تأمين' },
  { value: 'taxes', label: 'ضرائب' },
  { value: 'other', label: 'أخرى' }
]

const paymentMethods = [
  { value: 'cash', label: 'نقد' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'check', label: 'شيك' },
  { value: 'credit_card', label: 'بطاقة ائتمان' }
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_number: '',
    supplier_name: '',
    payment_method: 'cash',
    status: 'paid'
  })

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      const data = await getExpenses()
      setExpenses(data)
    } catch (error) {
      console.error('خطأ في تحميل المصروفات:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterExpenses = useCallback(() => {
    let filtered = expenses

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(expense => expense.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter)
    }

    setFilteredExpenses(filtered)
  }, [expenses, searchTerm, statusFilter, categoryFilter])

  useEffect(() => {
    filterExpenses()
  }, [filterExpenses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        category: formData.category as 'salaries' | 'rent' | 'utilities' | 'equipment' | 'marketing' | 'maintenance' | 'supplies' | 'insurance' | 'taxes' | 'other',
        payment_method: formData.payment_method as 'cash' | 'bank_transfer' | 'check' | 'credit_card',
        status: formData.status as 'paid' | 'pending' | 'approved' | 'rejected'
      }

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData)
      } else {
        await createExpense(expenseData)
      }

      setIsDialogOpen(false)
      setEditingExpense(null)
      resetForm()
      loadExpenses()
    } catch (error) {
      console.error('خطأ في حفظ المصروف:', error)
      alert('حدث خطأ أثناء حفظ المصروف')
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      receipt_number: expense.receipt_number || '',
      supplier_name: expense.supplier_name || '',
      payment_method: expense.payment_method,
      status: expense.status
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      try {
        await deleteExpense(id)
        loadExpenses()
      } catch (error) {
        console.error('خطأ في حذف المصروف:', error)
        alert('حدث خطأ أثناء حذف المصروف')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      receipt_number: '',
      supplier_name: '',
      payment_method: 'cash',
      status: 'paid'
    })
  }

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category
  }

  const getPaymentMethodLabel = (method: string) => {
    return paymentMethods.find(m => m.value === method)?.label || method
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'مدفوع', variant: 'default' as const },
      pending: { label: 'قيد الانتظار', variant: 'secondary' as const },
      approved: { label: 'موافق عليه', variant: 'outline' as const },
      rejected: { label: 'مرفوض', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">إدارة المصروفات</h1>
          <p className="text-muted-foreground">إدارة وتتبع مصروفات الأكاديمية</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingExpense(null) }}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة مصروف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingExpense ? 'تعديل بيانات المصروف' : 'أدخل بيانات المصروف الجديد'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">الفئة</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">الوصف</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expense_date">تاريخ المصروف</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="payment_method">طريقة الدفع</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receipt_number">رقم الإيصال</Label>
                  <Input
                    id="receipt_number"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({...formData, receipt_number: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplier_name">اسم المورد</Label>
                  <Input
                    id="supplier_name"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingExpense ? 'تحديث' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses.toLocaleString()} دينار</div>
            <p className="text-xs text-muted-foreground">
              من {filteredExpenses.length} مصروف
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المصروفات هذا الشهر</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredExpenses
                .filter(expense => {
                  const expenseMonth = new Date(expense.expense_date).getMonth()
                  const currentMonth = new Date().getMonth()
                  return expenseMonth === currentMonth
                })
                .reduce((sum, expense) => sum + expense.amount, 0)
                .toLocaleString()} دينار
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المصروفات المعلقة</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredExpenses.filter(expense => expense.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في المصروفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="فلترة حسب الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="approved">موافق عليه</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المصروفات</CardTitle>
          <CardDescription>
            عرض جميع المصروفات المسجلة ({filteredExpenses.length} مصروف)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {new Date(expense.expense_date).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      {expense.supplier_name && (
                        <div className="text-sm text-muted-foreground">
                          المورد: {expense.supplier_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{expense.amount.toLocaleString()} دينار</TableCell>
                  <TableCell>{getPaymentMethodLabel(expense.payment_method)}</TableCell>
                  <TableCell>{getStatusBadge(expense.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredExpenses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مصروفات مطابقة للفلترة المحددة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
