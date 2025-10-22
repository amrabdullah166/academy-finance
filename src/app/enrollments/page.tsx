'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search, 
  BookOpen,
  UserPlus,
  UserMinus,
  Calendar,
  DollarSign,
  ArrowLeft,
  Loader2,
  UsersIcon
} from 'lucide-react'
import Link from 'next/link'
import { 
  getStudents, 
  getCourses, 
  getStudentCourses,
  enrollStudentInCourse,
  enrollMultipleStudentsInCourse,
  unenrollStudentFromCourse,
  Student,
  Course
} from '@/lib/supabase'

interface StudentCourse {
  id: string
  student_id: string
  course_id: string
  enrollment_date: string
  status: string
  students: Student
  courses: Course
}

export default function EnrollmentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [isBulkEnrollDialogOpen, setIsBulkEnrollDialogOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<StudentCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [bulkCourse, setBulkCourse] = useState('')
  const [hasTransportation, setHasTransportation] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [studentsData, coursesData, enrollmentsData] = await Promise.all([
        getStudents(),
        getCourses(),
        getStudentCourses()
      ])
      
      // Ensure data is arrays
      const students = Array.isArray(studentsData) ? studentsData : []
      const courses = Array.isArray(coursesData) ? coursesData : []
      const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : []
      
      setStudents(students.filter(s => s.status === 'active'))
      setCourses(courses.filter(c => c.status === 'active'))
      setEnrollments(enrollments)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollment = async () => {
    if (!selectedStudent || !selectedCourse) {
      alert('يرجى اختيار الطالب والدورة')
      return
    }

    try {
      // التحقق من وجود تسجيل سابق
      const existingEnrollment = enrollments.find(enrollment => 
        enrollment.student_id === selectedStudent && 
        enrollment.course_id === selectedCourse
      )

      if (existingEnrollment && existingEnrollment.status === 'enrolled') {
        alert('الطالب مسجل بالفعل في هذه الدورة')
        return
      }

      if (existingEnrollment && existingEnrollment.status === 'dropped') {
        const confirmReEnroll = confirm('الطالب كان مسجلاً في هذه الدورة وانسحب منها. هل تريد إعادة تسجيله؟')
        if (!confirmReEnroll) return
      }

      await enrollStudentInCourse(selectedStudent, selectedCourse, hasTransportation)
      setIsEnrollDialogOpen(false)
      setSelectedStudent('')
      setSelectedCourse('')
      setHasTransportation(false)
      fetchData()
      
      const message = existingEnrollment && existingEnrollment.status === 'dropped' 
        ? 'تم إعادة تسجيل الطالب في الدورة بنجاح' 
        : 'تم تسجيل الطالب في الدورة بنجاح'
      alert(message)
    } catch (error) {
      console.error('Error enrolling student:', error)
      
      // معالجة أخطاء قاعدة البيانات
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الطالب'
      
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        alert('الطالب مسجل بالفعل في هذه الدورة. لا يمكن تسجيله مرة أخرى.')
      } else {
        alert(errorMessage)
      }
    }
  }

  const handleReEnroll = async (studentId: string, courseId?: string) => {
    const targetCourseId = courseId || selectedCourse
    if (!targetCourseId) return
    
    const confirmReEnroll = confirm('هل تريد إعادة تسجيل هذا الطالب في الدورة؟')
    if (!confirmReEnroll) return

    try {
      await enrollStudentInCourse(studentId, targetCourseId, hasTransportation)
      fetchData()
      alert('تم إعادة تسجيل الطالب في الدورة بنجاح')
    } catch (error) {
      console.error('Error re-enrolling student:', error)
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إعادة تسجيل الطالب'
      alert(errorMessage)
    }
  }

  const handleUnenroll = async (studentId: string, courseId: string, studentName: string, courseName: string) => {
    const confirmUnenroll = confirm(`هل تريد إلغاء تسجيل ${studentName} من دورة ${courseName}؟\n\nسيتم تحويل حالة التسجيل إلى "منسحب" ولكن يمكن إعادة تسجيله لاحقاً.`)
    if (!confirmUnenroll) return

    const reason = prompt('سبب إلغاء التسجيل (اختياري):') || 'تم إلغاء التسجيل'

    try {
      await unenrollStudentFromCourse(studentId, courseId, reason)
      fetchData()
      alert('تم إلغاء تسجيل الطالب بنجاح')
    } catch (error) {
      console.error('Error unenrolling student:', error)
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إلغاء التسجيل'
      alert(errorMessage)
    }
  }

  // التسجيل المتعدد
  const handleBulkEnrollment = async () => {
    if (!bulkCourse || selectedStudents.length === 0) {
      alert('يرجى اختيار الدورة وطالب واحد على الأقل')
      return
    }

    const confirmBulk = confirm(`هل تريد تسجيل ${selectedStudents.length} طالب في الدورة المختارة؟`)
    if (!confirmBulk) return

    try {
      await enrollMultipleStudentsInCourse(selectedStudents, bulkCourse)
      setIsBulkEnrollDialogOpen(false)
      setSelectedStudents([])
      setBulkCourse('')
      fetchData()
      alert(`تم تسجيل ${selectedStudents.length} طالب بنجاح`)
    } catch (error) {
      console.error('Error bulk enrolling students:', error)
      alert('حدث خطأ أثناء التسجيل المتعدد')
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const selectAllAvailableStudents = () => {
    if (!bulkCourse) return
    
    const availableStudents = students
      .filter(student => student.status === 'active')
      .filter(student => {
        const hasActiveEnrollment = enrollments.some(enrollment => 
          enrollment.student_id === student.id && 
          enrollment.course_id === bulkCourse && 
          enrollment.status === 'enrolled'
        )
        return !hasActiveEnrollment
      })
      .map(student => student.id)
    
    setSelectedStudents(availableStudents)
  }

  const clearStudentSelection = () => {
    setSelectedStudents([])
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    const studentName = enrollment.students?.name || ''
    const courseName = enrollment.courses?.name || ''
    return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           courseName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <Badge variant="default" className="bg-green-100 text-green-800">مسجل</Badge>
      case 'completed':
        return <Badge variant="secondary">مكتمل</Badge>
      case 'withdrawn':
        return <Badge variant="destructive">منسحب</Badge>
      default:
        return <Badge variant="outline">غير محدد</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xl text-slate-600">جاري تحميل بيانات التسجيل...</p>
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
                إدارة التسجيل في الدورات
              </h1>
              <p className="text-slate-600 text-lg">
                تسجيل الطلاب في الدورات ومتابعة حالة التسجيل
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Dialog open={isBulkEnrollDialogOpen} onOpenChange={setIsBulkEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline">
                  <UsersIcon className="h-4 w-4 ml-2" />
                  تسجيل متعدد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>تسجيل عدة طلاب في دورة</DialogTitle>
                  <DialogDescription>
                    اختر الدورة ثم حدد الطلاب المراد تسجيلهم
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  {/* اختيار الدورة */}
                  <div className="space-y-2">
                    <Label htmlFor="bulk-course">الدورة</Label>
                    <Select value={bulkCourse} onValueChange={setBulkCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر دورة" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses
                          .filter(c => c?.id && String(c.id).trim() !== '')
                          .map(course => (
                          <SelectItem key={course.id} value={course.id!}>
                            {course.name} - {course.monthly_fee} دينار شهرياً
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* قائمة الطلاب */}
                  {bulkCourse && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>الطلاب المتاحين ({
                          students
                            .filter(student => student.status === 'active')
                            .filter(student => {
                              const hasActiveEnrollment = enrollments.some(enrollment => 
                                enrollment.student_id === student.id && 
                                enrollment.course_id === bulkCourse && 
                                enrollment.status === 'enrolled'
                              )
                              return !hasActiveEnrollment
                            }).length
                        })</Label>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={selectAllAvailableStudents}
                          >
                            تحديد الكل
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={clearStudentSelection}
                          >
                            إلغاء التحديد
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg max-h-60 overflow-y-auto">
                        <div className="p-3 space-y-2">
                          {students
                            .filter(student => student.status === 'active')
                            .filter(student => {
                              const hasActiveEnrollment = enrollments.some(enrollment => 
                                enrollment.student_id === student.id && 
                                enrollment.course_id === bulkCourse && 
                                enrollment.status === 'enrolled'
                              )
                              return !hasActiveEnrollment
                            })
                            .map(student => (
                              <div key={student.id} className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-gray-50 rounded">
                                <Checkbox
                                  id={`student-${student.id}`}
                                  checked={selectedStudents.includes(student.id)}
                                  onCheckedChange={() => toggleStudentSelection(student.id)}
                                />
                                <Label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer">
                                  <div>
                                    <div className="font-medium">{student.name}</div>
                                    <div className="text-sm text-gray-500">{student.phone}</div>
                                  </div>
                                </Label>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {selectedStudents.length > 0 && (
                        <div className="text-sm text-blue-600 font-medium">
                          تم تحديد {selectedStudents.length} طالب
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsBulkEnrollDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button 
                      onClick={handleBulkEnrollment}
                      disabled={!bulkCourse || selectedStudents.length === 0}
                    >
                      تسجيل {selectedStudents.length > 0 ? `(${selectedStudents.length})` : ''} طالب
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <UserPlus className="h-4 w-4 ml-2" />
                  تسجيل طالب في دورة
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل طالب في دورة</DialogTitle>
                <DialogDescription>
                  اختر الطالب والدورة للتسجيل
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="student">الطالب</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طالب" />
                    </SelectTrigger>
                    <SelectContent>
                      {students
                        .filter(s => s?.id && String(s.id).trim() !== '')
                        .filter(student => {
                          // إذا لم يتم اختيار دورة بعد، اعرض جميع الطلاب
                          if (!selectedCourse) return true
                          
                          // تحقق من عدم وجود تسجيل نشط للطالب في هذه الدورة
                          const hasActiveEnrollment = enrollments.some(enrollment => 
                            enrollment.student_id === student.id && 
                            enrollment.course_id === selectedCourse && 
                            enrollment.status === 'enrolled'
                          )
                          
                          return !hasActiveEnrollment
                        })
                        .map(student => (
                        <SelectItem key={student.id} value={student.id!}>
                          {student.name} - {student.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCourse && students.filter(s => s?.id && String(s.id).trim() !== '').filter(student => {
                    const hasActiveEnrollment = enrollments.some(enrollment => 
                      enrollment.student_id === student.id && 
                      enrollment.course_id === selectedCourse && 
                      enrollment.status === 'enrolled'
                    )
                    return !hasActiveEnrollment
                  }).length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      جميع الطلاب مسجلين بالفعل في هذه الدورة
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="course">الدورة</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر دورة" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses
                        .filter(c => c?.id && String(c.id).trim() !== '')
                        .map(course => (
                        <SelectItem key={course.id} value={course.id!}>
                          {course.name} - {course.monthly_fee} دينار شهرياً
                          {(course as any).transportation_fee > 0 && ` (مواصلات: ${(course as any).transportation_fee} د)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCourse && courses.find(c => c.id === selectedCourse && (c as any).transportation_fee > 0) && (
                  <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded-md">
                    <input
                      type="checkbox"
                      id="transportation"
                      checked={hasTransportation}
                      onChange={(e) => setHasTransportation(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="transportation" className="cursor-pointer">
                      إضافة خدمة المواصلات ({courses.find(c => c.id === selectedCourse)?.monthly_fee ? (courses.find(c => c.id === selectedCourse) as any).transportation_fee : 0} دينار شهرياً)
                    </Label>
                  </div>
                )}

                {/* قسم الطلاب المنسحبين */}
                {selectedCourse && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">الطلاب المنسحبين من هذه الدورة:</h4>
                    {enrollments
                      .filter(enrollment => 
                        enrollment.course_id === selectedCourse && 
                        enrollment.status === 'dropped'
                      )
                      .map(enrollment => {
                        const student = students.find(s => s.id === enrollment.student_id)
                        return student ? (
                          <div key={enrollment.id} className="flex items-center justify-between text-sm py-1">
                            <span>{student.name}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReEnroll(student.id)}
                            >
                              إعادة تسجيل
                            </Button>
                          </div>
                        ) : null
                      })}
                    {enrollments.filter(enrollment => 
                      enrollment.course_id === selectedCourse && 
                      enrollment.status === 'dropped'
                    ).length === 0 && (
                      <p className="text-sm text-yellow-700">لا توجد انسحابات من هذه الدورة</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleEnrollment}>
                    تسجيل الطالب
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              إجمالي التسجيلات النشطة
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {enrollments.filter(e => e.status === 'enrolled').length}
            </div>
            <p className="text-xs text-green-600">طالب مسجل حالياً</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              الدورات النشطة
            </CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{courses.length}</div>
            <p className="text-xs text-slate-600">دورة متاحة للتسجيل</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              الطلاب المتاحون
            </CardTitle>
            <UserPlus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{students.length}</div>
            <p className="text-xs text-slate-600">طالب نشط</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="ابحث عن طالب أو دورة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader>
          <CardTitle>قائمة التسجيلات</CardTitle>
          <CardDescription>
            جميع تسجيلات الطلاب في الدورات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الطالب</TableHead>
                  <TableHead className="text-right">الدورة</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-right">الرسوم الشهرية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{enrollment.students?.name}</div>
                        <div className="text-sm text-gray-500">{enrollment.students?.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{enrollment.courses?.name}</div>
                        <div className="text-sm text-gray-500">{enrollment.courses?.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(enrollment.enrollment_date).toLocaleDateString('ar-SA')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        {enrollment.courses?.monthly_fee} دينار
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(enrollment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {enrollment.status === 'enrolled' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnenroll(
                              enrollment.student_id,
                              enrollment.course_id,
                              enrollment.students?.name || 'الطالب',
                              enrollment.courses?.name || 'الدورة'
                            )}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                        {enrollment.status === 'dropped' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReEnroll(enrollment.student_id, enrollment.course_id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredEnrollments.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد تسجيلات</h3>
              <p className="text-gray-500">لم يتم العثور على أي تسجيلات مطابقة للبحث</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
