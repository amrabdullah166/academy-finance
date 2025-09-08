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
  Calendar, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  DollarSign,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { getMonthlySubscriptions, getOverdueSubscriptions, createMonthlySubscription, getStudents, getCourses, updateSubscriptionPayment, createPayment, Student, Course } from '@/lib/supabase'

interface MonthlySubscription {
  id: string
  student_id: string
  course_id: string
  subscription_month: number
  subscription_year: number
  amount: number
  discount_amount: number
  final_amount: number
  due_date: string
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  payment_date?: string
  payment_id?: string
  students?: { id: string; name: string; phone?: string; guardian_phone?: string }
  courses?: { id: string; name: string; monthly_fee: number }
}

export default function SubscriptionsPageNew() {
  const [subscriptions, setSubscriptions] = useState<MonthlySubscription[]>([])
  const [overdueSubscriptions, setOverdueSubscriptions] = useState<MonthlySubscription[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    subscription_month: new Date().getMonth() + 1,
    subscription_year: new Date().getFullYear(),
    discount_percentage: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [subscriptionsData, overdueData, studentsData, coursesData] = await Promise.all([
        getMonthlySubscriptions(),
        getOverdueSubscriptions(),
        getStudents(),
        getCourses()
      ])
      setSubscriptions(subscriptionsData || [])
      setOverdueSubscriptions(overdueData || [])
      setStudents(studentsData || [])
      setCourses(coursesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const course = courses.find(c => c.id === formData.course_id)
      const student = students.find(s => s.id === formData.student_id)
      
      if (!course || !student) {
        alert('يرجى اختيار الطالب والدورة')
        return
      }

      const amount = course.monthly_fee
      const discountAmount = (amount * formData.discount_percentage) / 100
      const finalAmount = amount - discountAmount
      
      // تحديد تاريخ الاستحقاق (5 أيام من بداية الشهر)
      const dueDate = new Date(formData.subscription_year, formData.subscription_month - 1, 5).toISOString().split('T')[0]

      await createMonthlySubscription({
        student_id: formData.student_id,
        course_id: formData.course_id,
        subscription_month: formData.subscription_month,
        subscription_year: formData.subscription_year,
        amount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        due_date: dueDate
      })

      setIsAddDialogOpen(false)
      setFormData({
        student_id: '',
        course_id: '',
        subscription_month: new Date().getMonth() + 1,
        subscription_year: new Date().getFullYear(),
        discount_percentage: 0
      })
      fetchData()
    } catch (error) {
      console.error('Error creating subscription:', error)
      alert('حدث خطأ أثناء إنشاء الاشتراك')
    }
  }

  const handlePaySubscription = async (subscription: MonthlySubscription) => {
    try {
      // إنشاء دفعة جديدة
      const payment = await createPayment({
        student_id: subscription.student_id,
        course_id: subscription.course_id,
        amount: subscription.final_amount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: 'cash',
        payment_method: 'monthly_fee',
        status: 'completed',
        notes: `اشتراك ${getMonthName(subscription.subscription_month)} ${subscription.subscription_year}`
      })

      // تحديث حالة الاشتراك
      await updateSubscriptionPayment(subscription.id, payment.id)
      
      fetchData()
      alert('تم تسجيل الدفعة بنجاح')
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('حدث خطأ أثناء تسجيل الدفعة')
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]
    return months[month - 1]
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">مدفوع</Badge>
      case 'pending':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">معلق</Badge>
      case 'overdue':
        return <Badge variant="destructive">متأخر</Badge>
      case 'cancelled':
        return <Badge variant="outline">ملغي</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const studentName = subscription.students?.name || ''
    const courseName = subscription.courses?.name || ''
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courseName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || subscription.payment_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getPendingTotal = () => {
    return subscriptions
      .filter(s => s.payment_status === 'pending')
      .reduce((sum, s) => sum + s.final_amount, 0)
  }

  const getOverdueTotal = () => {
    return overdueSubscriptions.reduce((sum, s) => sum + s.final_amount, 0)
  }

  const getMonthlyTotal = () => {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    return subscriptions
      .filter(s => s.subscription_month === currentMonth && s.subscription_year === currentYear && s.payment_status === 'paid')
      .reduce((sum, s) => sum + s.final_amount, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xl text-slate-600">جاري تحميل بيانات الاشتراكات...</p>
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
                إدارة الاشتراكات الشهرية
              </h1>
              <p className="text-slate-600 text-lg">
                متابعة وإدارة اشتراكات الطلاب الشهرية
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 ml-2" />
                إضافة اشتراك جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة اشتراك شهري جديد</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل الاشتراك الجديد
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubscription} className="grid gap-4 py-4">
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
                    <Label htmlFor="course">الدورة *</Label>
                    <Select 
                      value={formData.course_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدورة" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} - {course.monthly_fee} دينار
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">الشهر</Label>
                    <Select 
                      value={formData.subscription_month.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subscription_month: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {getMonthName(i + 1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">السنة</Label>
                    <Select 
                      value={formData.subscription_year.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subscription_year: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">خصم إضافي (%)</Label>
                    <Input 
                      id="discount" 
                      type="number" 
                      placeholder="0" 
                      min="0" 
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    إنشاء الاشتراك
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
              الاشتراكات المعلقة
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {subscriptions.filter(s => s.payment_status === 'pending').length}
            </div>
            <p className="text-xs text-orange-600">{getPendingTotal().toLocaleString()} دينار</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              الاشتراكات المتأخرة
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {overdueSubscriptions.length}
            </div>
            <p className="text-xs text-red-600">{getOverdueTotal().toLocaleString()} دينار</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              الاشتراكات المدفوعة
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {subscriptions.filter(s => s.payment_status === 'paid').length}
            </div>
            <p className="text-xs text-green-600">مكتملة</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              إيرادات هذا الشهر
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {getMonthlyTotal().toLocaleString()} دينار
            </div>
            <p className="text-xs text-purple-600">من الاشتراكات</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueSubscriptions.length > 0 && (
        <Card className="bg-red-50 border-red-200 mb-6">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              تنبيه: اشتراكات متأخرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">
              يوجد {overdueSubscriptions.length} اشتراك متأخر بإجمالي {getOverdueTotal().toLocaleString()} دينار
            </p>
            <div className="space-y-2">
              {overdueSubscriptions.slice(0, 3).map((sub) => (
                <div key={sub.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                  <div>
                    <span className="font-medium">{sub.students?.name}</span>
                    <span className="text-sm text-slate-600 mr-2">
                      - {sub.courses?.name} - {getMonthName(sub.subscription_month)} {sub.subscription_year}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => handlePaySubscription(sub)}>
                    تسجيل الدفع
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  placeholder="البحث بالطالب أو الدورة..."
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
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="overdue">متأخرة</SelectItem>
                  <SelectItem value="cancelled">ملغية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader>
          <CardTitle>قائمة الاشتراكات الشهرية</CardTitle>
          <CardDescription>
            إجمالي {filteredSubscriptions.length} اشتراك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الطالب</TableHead>
                  <TableHead className="text-right">الدورة</TableHead>
                  <TableHead className="text-right">الشهر/السنة</TableHead>
                  <TableHead className="text-right">المبلغ الأصلي</TableHead>
                  <TableHead className="text-right">الخصم</TableHead>
                  <TableHead className="text-right">المبلغ النهائي</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="text-right">
                      <p className="font-medium text-slate-800">
                        {subscription.students?.name}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-slate-700">
                        {subscription.courses?.name}
                      </p>
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <span className="text-sm rtl-content">
                        {getMonthName(subscription.subscription_month)} {subscription.subscription_year}
                      </span>
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-600 rtl-content">
                          {subscription.amount.toLocaleString()} دينار
                        </span>
                        <DollarSign className="h-3 w-3 text-slate-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-orange-600 rtl-content">
                          {subscription.discount_amount.toLocaleString()} دينار
                        </span>
                        <DollarSign className="h-3 w-3 text-orange-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-green-600 font-bold rtl-content">
                          {subscription.final_amount.toLocaleString()} دينار
                        </span>
                        <DollarSign className="h-3 w-3 text-green-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right rtl-content">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-sm rtl-content">{subscription.due_date}</span>
                        <Calendar className="h-3 w-3 text-slate-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(subscription.payment_status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {subscription.payment_status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePaySubscription(subscription)}
                          >
                            تسجيل الدفع
                          </Button>
                        )}
                        {subscription.payment_status === 'paid' && (
                          <Badge variant="outline" className="text-green-600">
                            مدفوع
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              لا توجد اشتراكات للعرض
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
