'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter,
  Receipt,
  DollarSign,
  Calendar,
  ArrowLeft,
  Banknote,
  Building2,
  Smartphone,
  PrinterIcon,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { getPayments, createPayment, getStudents, getCourses, Payment, Student, Course } from '@/lib/supabase'

interface PaymentWithDetails extends Payment {
  students?: {
    name: string
    email?: string
  }
  courses?: {
    name: string
  }
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    amount: '',
    payment_type: 'cash' as 'cash' | 'bank_transfer' | 'online' | 'check',
    payment_method: 'monthly_fee' as 'monthly_fee' | 'registration' | 'materials' | 'penalty' | 'refund' | 'other',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [paymentsData, studentsData, coursesData] = await Promise.all([
        getPayments(),
        getStudents(),
        getCourses()
      ])
      setPayments(paymentsData || [])
      setStudents(studentsData || [])
      setCourses(coursesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createPayment({
        ...formData,
        course_id: formData.course_id === 'none' ? undefined : formData.course_id,
        amount: parseFloat(formData.amount),
        payment_date: new Date().toISOString().split('T')[0],
        status: 'completed'
      })
      
      setIsAddDialogOpen(false)
      setFormData({
        student_id: '',
        course_id: '',
        amount: '',
        payment_type: 'cash',
        payment_method: 'monthly_fee',
        notes: ''
      })
      fetchData()
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('حدث خطأ أثناء إضافة الدفعة')
    }
  }

  const filteredPayments = payments.filter(payment => {
    const studentName = payment.students?.name || 'غير محدد'
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesType = typeFilter === 'all' || payment.payment_method === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">مكتمل</Badge>
      case 'pending':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">معلق</Badge>
      case 'cancelled':
        return <Badge variant="destructive">ملغي</Badge>
      case 'refunded':
        return <Badge variant="outline">مسترد</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Banknote className="h-4 w-4 text-green-600" />
      case 'bank_transfer': return <Building2 className="h-4 w-4 text-blue-600" />
      case 'online': return <Smartphone className="h-4 w-4 text-purple-600" />
      case 'check': return <Receipt className="h-4 w-4 text-orange-600" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentTypeName = (type: string) => {
    switch (type) {
      case 'cash': return 'نقد'
      case 'bank_transfer': return 'تحويل بنكي'
      case 'online': return 'دفع إلكتروني'
      case 'check': return 'شيك'
      default: return type
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'monthly_fee': return 'رسوم شهرية'
      case 'registration': return 'رسوم تسجيل'
      case 'materials': return 'رسوم مواد'
      case 'penalty': return 'غرامة'
      case 'refund': return 'استرداد'
      case 'other': return 'أخرى'
      default: return method
    }
  }

  const getTodaysTotal = () => {
    const today = new Date().toISOString().split('T')[0]
    return payments
      .filter(p => p.payment_date === today && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  const getMonthlyTotal = () => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return payments
      .filter(p => p.payment_date.startsWith(currentMonth) && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xl text-slate-600">جاري تحميل بيانات المدفوعات...</p>
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
                إدارة المدفوعات
              </h1>
              <p className="text-slate-600 text-lg">
                تسجيل ومتابعة جميع المدفوعات والإيصالات
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 ml-2" />
                إضافة دفعة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة دفعة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل الدفعة الجديدة
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student">الطالب *</Label>
                    <Select 
                      value={formData.student_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الطالب" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">الدورة (اختياري)</Label>
                    <Select 
                      value={formData.course_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدورة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون دورة محددة</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ *</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      placeholder="0.00" 
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentType">طريقة الدفع</Label>
                    <Select 
                      value={formData.payment_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقد</SelectItem>
                        <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                        <SelectItem value="online">دفع إلكتروني</SelectItem>
                        <SelectItem value="check">شيك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">نوع الدفعة</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly_fee">رسوم شهرية</SelectItem>
                      <SelectItem value="registration">رسوم تسجيل</SelectItem>
                      <SelectItem value="materials">رسوم مواد</SelectItem>
                      <SelectItem value="penalty">غرامة</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">الملاحظات</Label>
                  <Input 
                    id="notes" 
                    placeholder="أدخل أي ملاحظات إضافية"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    حفظ الدفعة
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              إجمالي المدفوعات اليوم
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {getTodaysTotal().toLocaleString()} دينار
            </div>
            <p className="text-xs text-green-600">دفعات اليوم</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              المدفوعات المكتملة
            </CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {payments.filter(p => p.status === 'completed').length}
            </div>
            <p className="text-xs text-blue-600">من أصل {payments.length} دفعة</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              الدفعات المعلقة
            </CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {payments.filter(p => p.status === 'pending').length}
            </div>
            <p className="text-xs text-orange-600">يحتاج متابعة</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              إجمالي الشهر
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {getMonthlyTotal().toLocaleString()} دينار
            </div>
            <p className="text-xs text-green-600">هذا الشهر</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 mb-6">
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="البحث بالطالب أو رقم الإيصال..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="cancelled">ملغية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="تصفية حسب النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="monthly_fee">رسوم شهرية</SelectItem>
                  <SelectItem value="registration">رسوم تسجيل</SelectItem>
                  <SelectItem value="materials">رسوم مواد</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader>
          <CardTitle>قائمة المدفوعات</CardTitle>
          <CardDescription>
            إجمالي {filteredPayments.length} دفعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الإيصال</TableHead>
                  <TableHead className="text-right">الطالب</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">طريقة الدفع</TableHead>
                  <TableHead className="text-right">نوع الدفعة</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-right">الملاحظات</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-right rtl-content">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-mono text-sm rtl-content">{payment.receipt_number}</span>
                        <Receipt className="h-4 w-4 text-slate-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <p className="font-medium text-slate-800 rtl-content">
                        {payment.students?.name || 'غير محدد'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <span className="text-green-600 font-bold text-lg rtl-content">
                        {payment.amount.toLocaleString()} دينار
                      </span>
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-sm rtl-content">{payment.payment_date}</span>
                        <Calendar className="h-3 w-3 text-slate-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm rtl-content">{getPaymentTypeName(payment.payment_type)}</span>
                        {getPaymentTypeIcon(payment.payment_type)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <Badge variant="secondary" className="rtl-content">
                        {getPaymentMethodName(payment.payment_method)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <span className="text-sm text-slate-600 rtl-content">{payment.notes}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm">
                          <PrinterIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              لا توجد مدفوعات للعرض
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
