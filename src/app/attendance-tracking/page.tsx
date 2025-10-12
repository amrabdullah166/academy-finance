'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, TrendingUp, TrendingDown, Eye, Filter, Download } from 'lucide-react'
import { getStudents, getCourses, Student, Course, getAttendanceRecordsWithDetails, getStudentAttendanceStats } from '@/lib/supabase'
import { toast } from 'sonner'

interface AttendanceRecord {
  id: string
  student_id: string
  course_id: string
  attendance_date: string
  is_present: boolean
  notes?: string
  students: {
    name: string
    email?: string
  }
  courses: {
    name: string
  }
}

interface AttendanceStats {
  totalDays: number
  presentDays: number
  absentDays: number
  attendanceRate: number
}

export default function AttendanceTrackingPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, present, absent

  // Get current month dates as default
  const currentDate = new Date()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  useEffect(() => {
    if (!startDate) setStartDate(firstDay.toISOString().split('T')[0])
    if (!endDate) setEndDate(lastDay.toISOString().split('T')[0])
    
    loadInitialData()
  }, [])

  useEffect(() => {
    if (students.length > 0 && courses.length > 0) {
      loadAttendanceData()
    }
  }, [selectedCourse, selectedStudent, startDate, endDate])

  useEffect(() => {
    applyFilters()
  }, [attendanceRecords, statusFilter])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [studentsData, coursesData] = await Promise.all([
        getStudents(),
        getCourses()
      ])
      
      setStudents(studentsData || [])
      setCourses(coursesData || [])
      
      await loadAttendanceData()
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceData = async () => {
    try {
      // جلب سجلات الحضور من قاعدة البيانات مع الفلاتر الحالية
      const filters = {
        courseId: selectedCourse || undefined,
        studentId: selectedStudent || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 1000 // حد أقصى للنتائج
      }
      
      const records = await getAttendanceRecordsWithDetails(filters)
      
      // تحويل البيانات للشكل المطلوب
      const formattedRecords: AttendanceRecord[] = records.map((record: any) => ({
        id: record.id,
        student_id: record.student_id,
        course_id: record.course_id,
        attendance_date: record.attendance_date,
        is_present: record.is_present,
        notes: record.notes || '',
        students: {
          name: record.students?.name || 'غير محدد',
          email: record.students?.email
        },
        courses: {
          name: record.courses?.name || 'غير محدد'
        }
      }))
      
      setAttendanceRecords(formattedRecords)
    } catch (error) {
      console.error('خطأ في تحميل بيانات الحضور:', error)
      toast.error('فشل في تحميل بيانات الحضور')
      
      // في حالة الخطأ، استخدم بيانات فارغة
      setAttendanceRecords([])
    }
  }

  const applyFilters = () => {
    let filtered = attendanceRecords.filter(record => {
      // تصفية حسب التاريخ
      const recordDate = new Date(record.attendance_date)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null
      
      if (start && recordDate < start) return false
      if (end && recordDate > end) return false
      
      // تصفية حسب الكورس
      if (selectedCourse && record.course_id !== selectedCourse) return false
      
      // تصفية حسب الطالب
      if (selectedStudent && record.student_id !== selectedStudent) return false
      
      // تصفية حسب الحالة
      if (statusFilter === 'present' && !record.is_present) return false
      if (statusFilter === 'absent' && record.is_present) return false
      
      return true
    })
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    filtered.sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime())
    
    setFilteredRecords(filtered)
  }

  const calculateStudentStats = (studentId: string): AttendanceStats => {
    // استخدام البيانات المحلية المفلترة لحساب الإحصائيات بسرعة
    const studentRecords = filteredRecords.filter(record => record.student_id === studentId)
    const totalDays = studentRecords.length
    const presentDays = studentRecords.filter(record => record.is_present).length
    const absentDays = totalDays - presentDays
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    
    return { totalDays, presentDays, absentDays, attendanceRate }
  }

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50'
    if (rate >= 75) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const clearFilters = () => {
    setSelectedCourse('')
    setSelectedStudent('')
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
    setStatusFilter('all')
  }

  // حساب إحصائيات عامة
  const totalRecords = filteredRecords.length
  const totalPresent = filteredRecords.filter(r => r.is_present).length
  const totalAbsent = totalRecords - totalPresent
  const overallAttendanceRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0

  // جلب الطلاب الفريدين من النتائج المفلترة
  const uniqueStudents = Array.from(new Set(filteredRecords.map(r => r.student_id)))
    .map(id => {
      const record = filteredRecords.find(r => r.student_id === id)
      return record ? { id, name: record.students.name } : null
    })
    .filter(Boolean)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">تتبع الحضور والغياب</h1>
          <p className="text-gray-600">عرض وتحليل سجلات حضور الطلاب</p>
        </div>
      </div>

      {/* إحصائيات عامة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي السجلات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-blue-600 ml-2" />
              <span className="text-2xl font-bold">{totalRecords}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600 ml-2" />
              <span className="text-2xl font-bold text-green-600">{totalPresent}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي الغياب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingDown className="h-4 w-4 text-red-600 ml-2" />
              <span className="text-2xl font-bold text-red-600">{totalAbsent}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">نسبة الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-blue-600 ml-2" />
              <span className={`text-2xl font-bold ${getAttendanceRateColor(overallAttendanceRate)}`}>
                {overallAttendanceRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فلاتر البحث */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر البحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>الكورس</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الكورسات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الكورسات</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الطالب</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الطلاب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الطلاب</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>حالة الحضور</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="present">حاضر فقط</SelectItem>
                  <SelectItem value="absent">غائب فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات الطلاب */}
      {selectedStudent === '' && (
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الطلاب</CardTitle>
            <CardDescription>نسب الحضور لكل طالب خلال الفترة المحددة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueStudents.map((student) => {
                if (!student) return null
                const stats = calculateStudentStats(student.id)
                return (
                  <div key={student.id} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">{student.name}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>إجمالي الأيام:</span>
                        <span className="font-medium">{stats.totalDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>أيام الحضور:</span>
                        <span className="font-medium text-green-600">{stats.presentDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>أيام الغياب:</span>
                        <span className="font-medium text-red-600">{stats.absentDays}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span>نسبة الحضور:</span>
                        <Badge className={getAttendanceRateColor(stats.attendanceRate)}>
                          {stats.attendanceRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* جدول سجلات الحضور */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>سجلات الحضور</CardTitle>
              <CardDescription>
                عرض {filteredRecords.length} سجل من أصل {attendanceRecords.length}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">جاري التحميل...</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3">التاريخ</th>
                    <th className="text-right p-3">الطالب</th>
                    <th className="text-right p-3">الكورس</th>
                    <th className="text-right p-3">الحالة</th>
                    <th className="text-right p-3">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.slice(0, 100).map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {new Date(record.attendance_date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="p-3 font-medium">{record.students.name}</td>
                      <td className="p-3">{record.courses.name}</td>
                      <td className="p-3">
                        <Badge variant={record.is_present ? "default" : "destructive"}>
                          {record.is_present ? "حاضر" : "غائب"}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-500">
                        {record.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredRecords.length > 100 && (
                <div className="text-center py-4 text-gray-500">
                  يتم عرض أول 100 سجل. استخدم الفلاتر لتضييق النتائج.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد سجلات حضور تطابق الفلاتر المحددة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}