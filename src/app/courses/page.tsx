'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Users, DollarSign, Calendar, BookOpen, UserPlus, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { getCourses, createCourse, updateCourse, getStudents, getPayments, getStudentCourses, deleteCourse } from '@/lib/supabase'

interface Course {
  id: string
  name: string
  description?: string
  monthly_fee: number
  total_sessions?: number
  status: string
  instructor_id?: string
  start_date?: string
  end_date?: string
  max_students?: number
  created_at: string
  updated_at: string
}

interface Student {
  id: string
  name: string
  email?: string
  phone?: string
  status: string
}

interface CourseWithStats extends Course {
  enrolled_students: number
  total_revenue: number
  active_subscriptions: number
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseWithStats | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<CourseWithStats | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthly_fee: '',
    total_sessions: '',
    status: 'active',
    start_date: '',
    end_date: '',
    max_students: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [coursesData, studentsData, paymentsData, studentCoursesData] = await Promise.all([
        getCourses(),
        getStudents(),
        getPayments(),
        getStudentCourses()
      ])
      
      // Calculate stats for each course
      const coursesWithStats = coursesData.map(course => {
        // Count students actually enrolled in this specific course
        const enrolledStudents = studentCoursesData.filter(sc => 
          sc.course_id === course.id && sc.status === 'enrolled'
        ).length
        
        // Calculate revenue from payments for this course
        const coursePayments = paymentsData.filter(p => 
          p.course_id === course.id && 
          p.status === 'completed' &&
          p.payment_method === 'monthly_fee'
        )
        const totalRevenue = coursePayments.reduce((sum, p) => sum + p.amount, 0)
        
        // Count active subscriptions (current month)
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        const activeSubscriptions = coursePayments.filter(p => {
          const paymentDate = new Date(p.payment_date)
          return paymentDate.getMonth() + 1 === currentMonth && 
                 paymentDate.getFullYear() === currentYear
        }).length

        return {
          ...course,
          enrolled_students: enrolledStudents,
          total_revenue: totalRevenue,
          active_subscriptions: activeSubscriptions
        }
      })
      
      setCourses(coursesWithStats)
      setStudents(studentsData.filter(s => s.status === 'active'))
      
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter)
    }

    setFilteredCourses(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const courseData = {
        name: formData.name,
        description: formData.description || undefined,
        monthly_fee: parseFloat(formData.monthly_fee),
        total_sessions: formData.total_sessions ? parseInt(formData.total_sessions) : undefined,
        max_students: formData.max_students ? parseInt(formData.max_students) : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status as 'active' | 'inactive'
      }

      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData)
        alert('تم تحديث الكورس بنجاح!')
      } else {
        await createCourse(courseData)
        alert('تم إضافة الكورس بنجاح!')
      }

      setIsDialogOpen(false)
      setEditingCourse(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('خطأ في حفظ الكورس:', error)
      const errorMessage = editingCourse 
        ? 'حدث خطأ أثناء تحديث الكورس. يرجى المحاولة مرة أخرى.'
        : 'حدث خطأ أثناء إضافة الكورس. يرجى المحاولة مرة أخرى.'
      alert(errorMessage)
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      description: course.description || '',
      monthly_fee: course.monthly_fee.toString(),
      total_sessions: course.total_sessions?.toString() || '',
      status: course.status,
      start_date: course.start_date || '',
      end_date: course.end_date || '',
      max_students: course.max_students?.toString() || ''
    })
    setIsDialogOpen(true)
  }

  const handleViewStudents = (course: CourseWithStats) => {
    setSelectedCourse(course)
    setIsStudentsDialogOpen(true)
  }

  const handleDelete = (course: CourseWithStats) => {
    setCourseToDelete(course)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!courseToDelete) return
    
    try {
      const result = await deleteCourse(courseToDelete.id)
      setIsDeleteDialogOpen(false)
      setCourseToDelete(null)
      loadData()
      
      // رسالة تفصيلية عما تم حذفه
      const message = `تم حذف الكورس "${courseToDelete.name}" بنجاح!\n\nتفاصيل ما تم حذفه:\n• ${result.deletedPayments} مدفوعة\n• ${result.deletedEnrollments} تسجيل طالب\n• ${result.deletedReminders} تذكير`
      alert(message)
    } catch (error) {
      console.error('خطأ في حذف الكورس:', error)
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء حذف الكورس'
      alert(`فشل في حذف الكورس: ${errorMessage}`)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      monthly_fee: '',
      total_sessions: '',
      status: 'active',
      start_date: '',
      end_date: '',
      max_students: ''
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', variant: 'default' as const },
      inactive: { label: 'غير نشط', variant: 'secondary' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const totalStats = {
    totalCourses: filteredCourses.length,
    activeCourses: filteredCourses.filter(c => c.status === 'active').length,
    totalStudents: filteredCourses.reduce((sum, c) => sum + c.enrolled_students, 0),
    totalRevenue: filteredCourses.reduce((sum, c) => sum + c.total_revenue, 0),
    activeSubscriptions: filteredCourses.reduce((sum, c) => sum + c.active_subscriptions, 0)
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
          <h1 className="text-3xl font-bold">إدارة الكورسات</h1>
          <p className="text-muted-foreground">إدارة الكورسات والدورات التعليمية</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCourse(null) }}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة كورس جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingCourse ? (
                  <>
                    <Edit className="h-5 w-5 text-blue-600" />
                    تعديل الكورس: {editingCourse.name}
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-green-600" />
                    إضافة كورس جديد
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {editingCourse ? 'تعديل بيانات الكورس المحدد' : 'أدخل بيانات الكورس الجديد'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم الكورس *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly_fee">الرسوم الشهرية *</Label>
                  <Input
                    id="monthly_fee"
                    type="number"
                    step="0.01"
                    value={formData.monthly_fee}
                    onChange={(e) => setFormData({...formData, monthly_fee: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">وصف الكورس</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="total_sessions">عدد الجلسات</Label>
                  <Input
                    id="total_sessions"
                    type="number"
                    value={formData.total_sessions}
                    onChange={(e) => setFormData({...formData, total_sessions: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max_students">الحد الأقصى للطلاب</Label>
                  <Input
                    id="max_students"
                    type="number"
                    value={formData.max_students}
                    onChange={(e) => setFormData({...formData, max_students: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">الحالة</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">تاريخ البداية</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">تاريخ النهاية</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className={editingCourse ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}>
                  {editingCourse ? (
                    <>
                      <Edit className="h-4 w-4 ml-2" />
                      تحديث الكورس
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة كورس
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الكورسات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalCourses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الكورسات النشطة</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.activeCourses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.activeSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalRevenue.toLocaleString()} دينار</div>
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
                  placeholder="البحث في الكورسات..."
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
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الكورسات</CardTitle>
          <CardDescription>
            عرض جميع الكورسات المسجلة ({filteredCourses.length} كورس)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم الكورس</TableHead>
                <TableHead className="text-right">الرسوم الشهرية</TableHead>
                <TableHead className="text-center">الطلاب المسجلين</TableHead>
                <TableHead className="text-center">الاشتراكات النشطة</TableHead>
                <TableHead className="text-right">إجمالي الإيرادات</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-medium">{course.name}</div>
                      {course.description && (
                        <div className="text-sm text-muted-foreground">
                          {course.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right rtl-content">{course.monthly_fee.toLocaleString()} دينار</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Users className="h-4 w-4" />
                      <span className="rtl-content">{course.enrolled_students}</span>
                      {course.max_students && (
                        <span className="text-muted-foreground rtl-content">
                          / {course.max_students}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="rtl-content">{course.active_subscriptions}</Badge>
                  </TableCell>
                  <TableCell className="text-right rtl-content">{course.total_revenue.toLocaleString()} دينار</TableCell>
                  <TableCell className="text-center">{getStatusBadge(course.status)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewStudents(course)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(course)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCourses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد كورسات مطابقة للفلترة المحددة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Dialog */}
      <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>طلاب كورس: {selectedCourse?.name}</DialogTitle>
            <DialogDescription>
              إدارة الطلاب المسجلين في هذا الكورس
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="enrolled">
            <TabsList>
              <TabsTrigger value="enrolled">الطلاب المسجلين</TabsTrigger>
              <TabsTrigger value="available">الطلاب المتاحين</TabsTrigger>
            </TabsList>
            
            <TabsContent value="enrolled">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    الطلاب المسجلين ({selectedCourse?.enrolled_students} طالب)
                  </h3>
                  <Button size="sm">
                    <UserPlus className="ml-2 h-4 w-4" />
                    إضافة طلاب
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم الطالب</TableHead>
                      <TableHead className="text-right">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-center">حالة الاشتراك</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.slice(0, 5).map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium text-right">{student.name}</TableCell>
                        <TableCell className="text-right">{student.email || '-'}</TableCell>
                        <TableCell className="text-right">{student.phone || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default">نشط</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm">
                            إلغاء التسجيل
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="available">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">الطلاب المتاحين للتسجيل</h3>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`available-${student.id}`}
                        />
                        <Label htmlFor={`available-${student.id}`}>
                          {student.name}
                        </Label>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {student.email}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button>
                  تسجيل الطلاب المختارين
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف الكورس</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من أنك تريد حذف كورس "{courseToDelete?.name}"؟
              <br />
              <span className="text-red-600 font-medium">
                سيتم حذف جميع البيانات المرتبطة بهذا الكورس نهائياً.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <div className="flex items-start gap-2">
              <div className="text-red-600 mt-0.5">⚠️</div>
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">سيتم حذف البيانات التالية:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>الكورس نفسه</li>
                  <li>جميع الطلاب المسجلين في الكورس</li>
                  <li>جميع المدفوعات المرتبطة بالكورس</li>
                  <li>جميع التذكيرات المرتبطة بالكورس</li>
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
              نعم، احذف الكورس
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
