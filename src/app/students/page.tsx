'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ArrowLeft,
  Loader2,
  Copy
} from 'lucide-react'
import Link from 'next/link'
import { 
  getStudents, 
  createStudent, 
  Student, 
  getCourses, 
  Course, 
  enrollStudentInCourse,
  getStudentPaymentStatus,
  PaymentStatus,
  deleteStudent,
  getSystemSettings,
  SystemSetting
} from '@/lib/supabase'

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus[]>([])
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guardian_name: '',
    guardian_phone: '',
    grade_level: '',
    discount_percentage: 0,
    address: '',
    date_of_birth: '',
    selected_course: '' // إضافة خيار الدورة
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const [studentsData, coursesData, paymentStatusData, settingsData] = await Promise.all([
        getStudents(),
        getCourses(),
        getStudentPaymentStatus(),
        getSystemSettings()
      ])
      setStudents(studentsData)
      setCourses(coursesData.filter(course => course.status === 'active'))
      setPaymentStatus(paymentStatusData)
      setSettings(settingsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // التحقق من الحقول المطلوبة
      if (!formData.name.trim()) {
        alert('يرجى إدخال اسم الطالب')
        return
      }
      if (!formData.guardian_name.trim()) {
        alert('يرجى إدخال اسم ولي الأمر')
        return
      }
      if (!formData.guardian_phone.trim()) {
        alert('يرجى إدخال رقم هاتف ولي الأمر')
        return
      }

      // إنشاء الطالب (بدون selected_course)
      const studentData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        guardian_name: formData.guardian_name.trim(),
        guardian_phone: formData.guardian_phone.trim(),
        grade_level: formData.grade_level.trim() || null,
        discount_percentage: Number(formData.discount_percentage) || 0,
        address: formData.address.trim() || null,
        date_of_birth: formData.date_of_birth.trim() || null, // إرسال null بدلاً من سلسلة فارغة
        status: 'active' as const,
        enrollment_date: new Date().toISOString().split('T')[0]
      }
      
      console.log('بيانات الطالب قبل الإرسال:', studentData)
      
      const newStudent = await createStudent(studentData)
      
      // إذا تم اختيار دورة، سجل الطالب فيها
      if (formData.selected_course && formData.selected_course !== 'none' && newStudent?.id) {
        await enrollStudentInCourse(newStudent.id, formData.selected_course)
      }
      
      setIsAddDialogOpen(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        guardian_name: '',
        guardian_phone: '',
        grade_level: '',
        discount_percentage: 0,
        address: '',
        date_of_birth: '',
        selected_course: ''
      })
      fetchStudents()
      
      // رسالة نجاح
      const successMessage = formData.selected_course && formData.selected_course !== 'none' 
        ? 'تم إضافة الطالب بنجاح وتسجيله في الدورة' 
        : 'تم إضافة الطالب بنجاح'
      alert(successMessage)
    } catch (error) {
      console.error('Error creating student:', error)
      alert('حدث خطأ أثناء إضافة الطالب')
    }
  }

  const handleDelete = (student: Student) => {
    setStudentToDelete(student)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!studentToDelete) return
    
    try {
      console.log(`محاولة حذف الطالب: ${studentToDelete.name} (${studentToDelete.id})`)
      const result = await deleteStudent(studentToDelete.id)
      console.log('نتيجة الحذف:', result)
      
      // تحديث الحالة المحلية فوراً
      setStudents(prevStudents => prevStudents.filter(s => s.id !== studentToDelete.id))
      
      setIsDeleteDialogOpen(false)
      setStudentToDelete(null)
      
      // إعادة تحميل البيانات للتأكد
      await fetchStudents()
      
      // رسالة تفصيلية عما تم حذفه
      const message = `تم حذف الطالب "${studentToDelete.name}" بنجاح!\n\nتفاصيل ما تم حذفه:\n• ${result.deletedPayments} مدفوعة\n• ${result.deletedEnrollments} تسجيل في كورس\n• ${result.deletedReminders} تذكير`
      alert(message)
    } catch (error) {
      console.error('خطأ في حذف الطالب:', error)
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء حذف الطالب'
      alert(`فشل في حذف الطالب: ${errorMessage}`)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (student.phone?.includes(searchTerm))
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getSetting = (key: string) => {
    return settings.find(s => s.setting_key === key)?.setting_value || ''
  }

  const copyStudentInfo = async (student: Student) => {
    try {
      const paymentInfo = getStudentPaymentInfo(student.id)
      const template = getSetting('copy_student_template') || 'الطالب: {student_name}\nالمتطلبات المالية: {amount} دينار\nرقم ولي الأمر: {guardian_phone}'
      
      // الحصول على كورسات الطالب
      const studentCourses = courses.filter(course => 
        paymentStatus.some(ps => ps.student_id === student.id && ps.course_name === course.name)
      )
      
      const text = template
        .replace('{student_name}', student.name)
        .replace('{amount}', paymentInfo?.totalRemaining?.toString() || '0')
        .replace('{guardian_phone}', student.guardian_phone || '')
        .replace('{courses}', studentCourses.map(c => c.name).join(', ') || 'لا توجد كورسات')
      
      await navigator.clipboard.writeText(text)
      alert('تم نسخ بيانات الطالب إلى الحافظة!')
    } catch (error) {
      console.error('Error copying text:', error)
      alert('حدث خطأ أثناء نسخ البيانات')
    }
  }

  const getStudentPaymentInfo = (studentId: string) => {
    const studentPayments = paymentStatus.filter(ps => ps.student_id === studentId)
    if (studentPayments.length === 0) return null
    
    const totalRemaining = studentPayments.reduce((sum, ps) => sum + ps.remaining_amount, 0)
    const hasOverdue = studentPayments.some(ps => ps.payment_status === 'overdue')
    const maxMonthsOverdue = Math.max(...studentPayments.map(ps => ps.months_overdue))
    
    return {
      totalRemaining,
      hasOverdue,
      maxMonthsOverdue,
      coursesCount: studentPayments.length
    }
  }

  const getPaymentStatusBadge = (studentId: string) => {
    const paymentInfo = getStudentPaymentInfo(studentId)
    if (!paymentInfo) return <Badge variant="outline">غير مسجل</Badge>
    
    if (paymentInfo.totalRemaining <= 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800">مدفوع</Badge>
    } else if (paymentInfo.hasOverdue) {
      return <Badge variant="destructive">متأخر ({paymentInfo.maxMonthsOverdue} شهر)</Badge>
    } else {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-800">مستحق</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">نشط</Badge>
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>
      case 'suspended':
        return <Badge variant="destructive">معلق</Badge>
      default:
        return <Badge variant="outline">غير محدد</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xl text-slate-600">جاري تحميل بيانات الطلاب...</p>
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
                إدارة الطلاب
              </h1>
              <p className="text-slate-600 text-lg">
                إدارة بيانات الطلاب والملفات المالية
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 ml-2" />
                إضافة طالب جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة طالب جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات الطالب الجديد
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم الطالب *</Label>
                    <Input 
                      id="name" 
                      placeholder="أدخل اسم الطالب الكامل" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradeLevel">المستوى الدراسي</Label>
                    <Input 
                      id="gradeLevel" 
                      placeholder="مثل: الصف الثالث"
                      value={formData.grade_level}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade_level: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="student@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input 
                      id="phone" 
                      placeholder="05xxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">اسم ولي الأمر *</Label>
                    <Input 
                      id="guardianName" 
                      placeholder="أدخل اسم ولي الأمر"
                      value={formData.guardian_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">رقم هاتف ولي الأمر *</Label>
                    <Input 
                      id="guardianPhone" 
                      placeholder="05xxxxxxxx"
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, guardian_phone: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">تاريخ الميلاد</Label>
                    <Input 
                      id="dateOfBirth" 
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">نسبة الخصم (%)</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Input 
                    id="address" 
                    placeholder="أدخل العنوان"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">الدورة (اختياري)</Label>
                  <Select value={formData.selected_course} onValueChange={(value) => setFormData(prev => ({ ...prev, selected_course: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر دورة لتسجيل الطالب فيها" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون دورة</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} - {course.monthly_fee} دينار شهرياً
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">الدورة (اختياري)</Label>
                  <Select 
                    value={formData.selected_course} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, selected_course: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر دورة لتسجيل الطالب فيها" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون دورة</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} - {course.monthly_fee} دينار
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    حفظ الطالب
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
              إجمالي الطلاب
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{students.length}</div>
            <p className="text-xs text-green-600">مسجل في النظام</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              الطلاب النشطون
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {students.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-blue-600">طالب نشط</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              الطلاب المعلقون
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {students.filter(s => s.status === 'suspended').length}
            </div>
            <p className="text-xs text-orange-600">يحتاج متابعة</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              متوسط الخصم
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {students.length > 0 
                ? (students.reduce((sum, s) => sum + s.discount_percentage, 0) / students.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-slate-600">خصم متوسط</p>
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
                  placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
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
                  <SelectItem value="all">جميع الطلاب</SelectItem>
                  <SelectItem value="active">النشطون</SelectItem>
                  <SelectItem value="inactive">غير النشطين</SelectItem>
                  <SelectItem value="suspended">المعلقون</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader>
          <CardTitle>قائمة الطلاب</CardTitle>
          <CardDescription>
            إجمالي {filteredStudents.length} طالب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الطالب</TableHead>
                  <TableHead className="text-right">ولي الأمر</TableHead>
                  <TableHead className="text-right">التواصل</TableHead>
                  <TableHead className="text-right">المستوى</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">حالة الدفع</TableHead>
                  <TableHead className="text-right">المبلغ المتبقي</TableHead>
                  <TableHead className="text-right">الخصم</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800 text-base">{student.name}</p>
                        <p className="text-sm text-slate-500">#{student.id.slice(0, 8)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-right">
                        <p className="text-sm font-medium text-slate-700">{student.guardian_name}</p>
                        {student.guardian_phone && (
                          <div className="flex items-center justify-end gap-1 text-sm">
                            <span className="text-slate-600">{student.guardian_phone}</span>
                            <Phone className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-right">
                        {student.email && (
                          <div className="flex items-center justify-end gap-1 text-sm">
                            <span className="text-slate-600">{student.email}</span>
                            <Mail className="h-3 w-3" />
                          </div>
                        )}
                        {student.phone && (
                          <div className="flex items-center justify-end gap-1 text-sm">
                            <span className="text-slate-600">{student.phone}</span>
                            <Phone className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {student.grade_level && (
                        <Badge variant="outline">{student.grade_level}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(student.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getPaymentStatusBadge(student.id)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const paymentInfo = getStudentPaymentInfo(student.id)
                        if (!paymentInfo) return <span className="text-slate-500">-</span>
                        return (
                          <div className="flex items-center justify-end gap-1">
                            <span className={`font-medium rtl-content ${paymentInfo.totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {paymentInfo.totalRemaining.toLocaleString()} دينار
                            </span>
                            <DollarSign className="h-3 w-3 text-red-500" />
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-orange-600 font-medium">
                        {student.discount_percentage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-sm">
                        <span className="text-slate-600">{student.enrollment_date}</span>
                        <Calendar className="h-3 w-3" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => copyStudentInfo(student)}
                          title="نسخ بيانات الطالب"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(student)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              لا توجد نتائج للبحث الحالي
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف الطالب</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من أنك تريد حذف الطالب &quot;{studentToDelete?.name}&quot;؟
              <br />
              <span className="text-red-600 font-medium">
                سيتم حذف جميع البيانات المرتبطة بهذا الطالب نهائياً.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <div className="flex items-start gap-2">
              <div className="text-red-600 mt-0.5">⚠️</div>
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">سيتم حذف البيانات التالية:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>بيانات الطالب الشخصية</li>
                  <li>جميع المدفوعات المرتبطة بالطالب</li>
                  <li>تسجيل الطالب في جميع الكورسات</li>
                  <li>جميع التذكيرات المرتبطة بالطالب</li>
                  <li><strong>هذا الإجراء لا يمكن التراجع عنه!</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              نعم، احذف الطالب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
