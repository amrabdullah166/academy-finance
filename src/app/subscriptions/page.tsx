'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, Users, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getStudents, getCourses, getPayments, createPayment } from '@/lib/supabase'

interface Student {
  id: string
  name: string
  email?: string
  phone?: string
  status: string
}

interface Course {
  id: string
  name: string
  monthly_fee: number
  status: string
}

interface Subscription {
  id: string
  student_id: string
  course_id: string
  month: number
  year: number
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  due_date: string
  payment_date?: string
  student_name?: string
  course_name?: string
}

export default function SubscriptionsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)

  // Form state for individual subscription
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    due_date: ''
  })

  // Form state for bulk subscription
  const [bulkFormData, setBulkFormData] = useState({
    course_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: ''
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')

  const months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsData, coursesData, paymentsData] = await Promise.all([
        getStudents(),
        getCourses(),
        getPayments()
      ])
      
      setStudents(studentsData.filter(s => s.status === 'active'))
      setCourses(coursesData.filter(c => c.status === 'active'))
      
      // Generate subscriptions from student-course combinations
      const generatedSubscriptions = generateSubscriptions(studentsData, coursesData, paymentsData)
      setSubscriptions(generatedSubscriptions)
      
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSubscriptions = (students: Student[], courses: Course[], payments: any[]) => {
    // This is a simplified version - in a real app, you'd have a subscriptions table
    const subscriptions: Subscription[] = []
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    students.forEach(student => {
      courses.forEach(course => {
        // Check if student has paid for current month
        const payment = payments.find(p => 
          p.student_id === student.id && 
          p.course_id === course.id &&
          p.payment_method === 'monthly_fee' &&
          new Date(p.payment_date).getMonth() + 1 === currentMonth &&
          new Date(p.payment_date).getFullYear() === currentYear
        )

        const dueDate = new Date(currentYear, currentMonth - 1, 5) // Due on 5th of each month
        const isOverdue = new Date() > dueDate

        subscriptions.push({
          id: `${student.id}-${course.id}-${currentMonth}-${currentYear}`,
          student_id: student.id,
          course_id: course.id,
          month: currentMonth,
          year: currentYear,
          amount: course.monthly_fee,
          status: payment ? 'paid' : (isOverdue ? 'overdue' : 'pending'),
          due_date: dueDate.toISOString().split('T')[0],
          payment_date: payment?.payment_date,
          student_name: student.name,
          course_name: course.name
        })
      })
    })

    return subscriptions
  }

  const handlePaySubscription = async (subscription: Subscription) => {
    try {
      const paymentData = {
        student_id: subscription.student_id,
        course_id: subscription.course_id,
        amount: subscription.amount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: 'cash' as const,
        payment_method: 'monthly_fee' as const,
        receipt_number: '', // Will be auto-generated
        notes: `اشتراك شهر ${months.find(m => m.value === subscription.month)?.label} ${subscription.year}`,
        status: 'completed' as const
      }

      await createPayment(paymentData)
      alert('تم تسجيل الدفع بنجاح')
      loadData() // Reload to update status
    } catch (error) {
      console.error('خطأ في تسجيل الدفع:', error)
      alert('حدث خطأ أثناء تسجيل الدفع')
    }
  }

  const handleBulkPayment = async () => {
    try {
      if (selectedStudents.length === 0) {
        alert('يرجى اختيار طلاب أولاً')
        return
      }

      const course = courses.find(c => c.id === bulkFormData.course_id)
      if (!course) {
        alert('يرجى اختيار كورس')
        return
      }

      for (const studentId of selectedStudents) {
        const paymentData = {
          student_id: studentId,
          course_id: bulkFormData.course_id,
          amount: course.monthly_fee,
          payment_date: new Date().toISOString().split('T')[0],
          payment_type: 'cash' as const,
          payment_method: 'monthly_fee' as const,
          receipt_number: '', // Will be auto-generated
          notes: `اشتراك جماعي شهر ${months.find(m => m.value === bulkFormData.month)?.label} ${bulkFormData.year}`,
          status: 'completed' as const
        }

        await createPayment(paymentData)
      }

      alert(`تم تسجيل ${selectedStudents.length} دفعة بنجاح`)
      setIsBulkDialogOpen(false)
      setSelectedStudents([])
      loadData()
    } catch (error) {
      console.error('خطأ في الدفع الجماعي:', error)
      alert('حدث خطأ أثناء الدفع الجماعي')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'مدفوع', variant: 'default' as const, icon: CheckCircle },
      pending: { label: 'معلق', variant: 'secondary' as const, icon: Clock },
      overdue: { label: 'متأخر', variant: 'destructive' as const, icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const, icon: Clock }
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.course_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter
    const matchesMonth = monthFilter === 'all' || subscription.month.toString() === monthFilter

    return matchesSearch && matchesStatus && matchesMonth
  })

  const stats = {
    totalSubscriptions: filteredSubscriptions.length,
    paidSubscriptions: filteredSubscriptions.filter(s => s.status === 'paid').length,
    pendingSubscriptions: filteredSubscriptions.filter(s => s.status === 'pending').length,
    overdueSubscriptions: filteredSubscriptions.filter(s => s.status === 'overdue').length,
    totalRevenue: filteredSubscriptions.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0)
  }

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
          <h1 className="text-3xl font-bold">إدارة الاشتراكات الشهرية</h1>
          <p className="text-muted-foreground">متابعة ودفع الاشتراكات الشهرية للطلاب</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="ml-2 h-4 w-4" />
                دفع جماعي
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>الدفع الجماعي للاشتراكات</DialogTitle>
                <DialogDescription>
                  دفع اشتراكات شهرية لمجموعة من الطلاب
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk_course">الكورس</Label>
                  <Select value={bulkFormData.course_id} onValueChange={(value) => setBulkFormData({...bulkFormData, course_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الكورس" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} - {course.monthly_fee} ر.س
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulk_month">الشهر</Label>
                    <Select value={bulkFormData.month.toString()} onValueChange={(value) => setBulkFormData({...bulkFormData, month: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="bulk_year">السنة</Label>
                    <Input
                      id="bulk_year"
                      type="number"
                      value={bulkFormData.year}
                      onChange={(e) => setBulkFormData({...bulkFormData, year: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <Label>اختيار الطلاب ({selectedStudents.length} مختار)</Label>
                  <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                    {students.map(student => (
                      <div key={student.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={student.id}
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setSelectedStudents([...selectedStudents, student.id])
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                            }
                          }}
                        />
                        <Label htmlFor={student.id} className="text-sm">
                          {student.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleBulkPayment}>
                  دفع جماعي ({selectedStudents.length} طالب)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاشتراكات</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مدفوع</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معلق</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متأخر</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} ر.س</div>
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
                  placeholder="البحث في الاشتراكات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="overdue">متأخر</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="فلترة حسب الشهر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأشهر</SelectItem>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الاشتراكات الشهرية</CardTitle>
          <CardDescription>
            عرض جميع الاشتراكات ({filteredSubscriptions.length} اشتراك)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الطالب</TableHead>
                <TableHead>الكورس</TableHead>
                <TableHead>الشهر/السنة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">
                    {subscription.student_name}
                  </TableCell>
                  <TableCell>{subscription.course_name}</TableCell>
                  <TableCell>
                    {months.find(m => m.value === subscription.month)?.label} {subscription.year}
                  </TableCell>
                  <TableCell>{subscription.amount.toLocaleString()} ر.س</TableCell>
                  <TableCell>
                    {new Date(subscription.due_date).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>
                    {subscription.status !== 'paid' && (
                      <Button
                        size="sm"
                        onClick={() => handlePaySubscription(subscription)}
                      >
                        دفع الآن
                      </Button>
                    )}
                    {subscription.status === 'paid' && subscription.payment_date && (
                      <span className="text-sm text-muted-foreground">
                        دُفع في {new Date(subscription.payment_date).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد اشتراكات مطابقة للفلترة المحددة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
