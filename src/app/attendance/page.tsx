'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Check, X, Users, Clock, BookOpen, Save, RefreshCw } from 'lucide-react'
import { 
  getStudents, 
  getCourses, 
  recordAttendance, 
  getCourseAttendance,
  Student, 
  Course,
  AttendanceRecord 
} from '@/lib/supabase'
import { toast } from 'sonner'

interface StudentAttendance {
  student: Student
  isPresent: boolean | null
  notes?: string
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [studentsAttendance, setStudentsAttendance] = useState<StudentAttendance[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // جلب البيانات الأساسية
  useEffect(() => {
    loadInitialData()
  }, [])

  // تحديث قائمة الطلاب عند تغيير الكورس
  useEffect(() => {
    if (selectedCourse) {
      loadCourseStudents()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, attendanceDate, students])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [studentsData, coursesData] = await Promise.all([
        getStudents(),
        getCourses()
      ])
      setStudents(studentsData)
      setCourses(coursesData)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const loadCourseStudents = async () => {
    if (!selectedCourse) return
    
    setLoading(true)
    try {
      // جلب الحضور المسجل مسبقاً لهذا اليوم والكورس
      const existingAttendance = await getCourseAttendance(selectedCourse, attendanceDate)
      
      // جلب طلاب الكورس من جدول التسجيلات
      const enrolledStudents = students.filter((_student) => 
        // هنا يجب أن نربط الطلاب بالكورسات حسب جدول enrollments
        // لكن للآن سنعرض جميع الطلاب
        true
      )

      // دمج بيانات الطلاب مع الحضور المسجل
      const studentsWithAttendance: StudentAttendance[] = enrolledStudents.map(student => {
        const attendanceRecord = existingAttendance.find(att => att.student_id === student.id)
        return {
          student,
          isPresent: attendanceRecord ? attendanceRecord.is_present : null,
          notes: attendanceRecord?.notes || ''
        }
      })

      setStudentsAttendance(studentsWithAttendance)
    } catch (error) {
      console.error('خطأ في تحميل طلاب الكورس:', error)
      toast.error('فشل في تحميل بيانات الطلاب')
    } finally {
      setLoading(false)
    }
  }

  const updateStudentAttendance = (studentId: string, isPresent: boolean, notes?: string) => {
    setStudentsAttendance(prev => 
      prev.map(item => 
        item.student.id === studentId 
          ? { ...item, isPresent, notes: notes || item.notes }
          : item
      )
    )
  }

  const updateStudentNotes = (studentId: string, notes: string) => {
    setStudentsAttendance(prev => 
      prev.map(item => 
        item.student.id === studentId 
          ? { ...item, notes }
          : item
      )
    )
  }

  const saveAttendance = async () => {
    if (!selectedCourse) {
      toast.error('يجب اختيار كورس أولاً')
      return
    }

    const attendanceRecords: AttendanceRecord[] = studentsAttendance
      .filter(item => item.isPresent !== null)
      .map(item => ({
        student_id: item.student.id,
        course_id: selectedCourse,
        attendance_date: attendanceDate,
        is_present: item.isPresent!,
        notes: item.notes || undefined
      }))

    if (attendanceRecords.length === 0) {
      toast.error('لم يتم تسجيل أي حضور')
      return
    }

    setSaving(true)
    try {
      await recordAttendance(attendanceRecords)
      toast.success(`تم حفظ الحضور لـ ${attendanceRecords.length} طالب`)
    } catch (error) {
      console.error('خطأ في حفظ الحضور:', error)
      toast.error('فشل في حفظ بيانات الحضور')
    } finally {
      setSaving(false)
    }
  }

  const getAttendanceStats = () => {
    const present = studentsAttendance.filter(item => item.isPresent === true).length
    const absent = studentsAttendance.filter(item => item.isPresent === false).length
    const notMarked = studentsAttendance.filter(item => item.isPresent === null).length
    const total = studentsAttendance.length
    
    return { present, absent, notMarked, total }
  }

  const stats = getAttendanceStats()

  return (
    <div className="container mx-auto p-6 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            تسجيل الحضور
          </h1>
          <p className="text-muted-foreground mt-2">
            قم بتسجيل حضور وغياب الطلاب للكورسات المختلفة
          </p>
        </div>
        
        {selectedCourse && (
          <Button 
            onClick={saveAttendance} 
            disabled={saving || stats.notMarked === stats.total}
            className="flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ الحضور ({stats.present + stats.absent} من {stats.total})
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>الكورس</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الكورس" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {course.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>التاريخ</Label>
          <Input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>الوقت</Label>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <Clock className="h-4 w-4" />
            {new Date().toLocaleTimeString('ar-SA')}
          </div>
        </div>
      </div>

      {/* Stats */}
      {selectedCourse && studentsAttendance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المجموع</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">حاضر</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                </div>
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">غائب</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                </div>
                <X className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">غير مسجل</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.notMarked}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>جاري تحميل البيانات...</p>
          </CardContent>
        </Card>
      ) : !selectedCourse ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">اختر كورساً للبدء</h3>
            <p className="text-muted-foreground">
              يرجى اختيار الكورس والتاريخ لبدء تسجيل الحضور
            </p>
          </CardContent>
        </Card>
      ) : studentsAttendance.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لا توجد طلاب مسجلين</h3>
            <p className="text-muted-foreground">
              لا توجد طلاب مسجلين في هذا الكورس
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentsAttendance.map((item) => (
            <Card key={item.student.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{item.student.name}</CardTitle>
                  {item.isPresent !== null && (
                    <Badge variant={item.isPresent ? "default" : "destructive"}>
                      {item.isPresent ? "حاضر" : "غائب"}
                    </Badge>
                  )}
                </div>
                <CardDescription>{item.student.email}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Attendance Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={item.isPresent === true ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStudentAttendance(item.student.id, true)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    حاضر
                  </Button>
                  <Button
                    variant={item.isPresent === false ? "destructive" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStudentAttendance(item.student.id, false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    غائب
                  </Button>
                </div>

                {/* Notes */}
                <Textarea
                  placeholder="ملاحظات (اختياري)"
                  value={item.notes || ''}
                  onChange={(e) => updateStudentNotes(item.student.id, e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}