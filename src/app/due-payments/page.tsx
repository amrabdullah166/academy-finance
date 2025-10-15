'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Calendar,
  User,
  CreditCard,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { 
  getUnpaidRegistrationFees,
  getMonthlyPayments,
  markRegistrationFeePaid,
  markMonthlyPaymentAsPaid,
  getStudents
} from '@/lib/supabase'

interface UnpaidRegistrationFee {
  id: string
  registration_fee: number
  enrollment_date: string
  student: {
    id: string
    name: string
    phone: string
  }
  course: {
    id: string
    name: string
  }
}

interface UnpaidMonthlyPayment {
  id: string
  payment_month: string
  total_amount: number
  monthly_fee: number
  transportation_fee: number
  enrollment: {
    course: {
      name: string
    }
  }
}

export default function DuePaymentsPage() {
  const [registrationFees, setRegistrationFees] = useState<UnpaidRegistrationFee[]>([])
  const [monthlyPayments, setMonthlyPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<string>('all')
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [regFeesData, monthlyData, studentsData] = await Promise.all([
        getUnpaidRegistrationFees(),
        getMonthlyPayments({ status: 'unpaid' }),
        getStudents()
      ])

      setRegistrationFees(Array.isArray(regFeesData) ? regFeesData as any : [])
      setMonthlyPayments(Array.isArray(monthlyData) ? monthlyData : [])
      setStudents(Array.isArray(studentsData) ? studentsData : [])
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRegistrationPaid = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`هل أنت متأكد من تسجيل دفع رسوم التسجيل للطالب ${studentName}؟`)) {
      return
    }

    try {
      await markRegistrationFeePaid(enrollmentId)
      alert('تم تسجيل الدفع بنجاح!')
      loadData()
    } catch (error) {
      console.error('خطأ:', error)
      alert('حدث خطأ أثناء تسجيل الدفع')
    }
  }

  const handleMarkMonthlyPaid = async (paymentId: string) => {
    if (!confirm('هل أنت متأكد من تسجيل هذا الدفع؟')) {
      return
    }

    try {
      await markMonthlyPaymentAsPaid(paymentId)
      alert('تم تسجيل الدفع بنجاح!')
      loadData()
    } catch (error) {
      console.error('خطأ:', error)
      alert('حدث خطأ أثناء تسجيل الدفع')
    }
  }

  // Filter data
  const filteredRegistrationFees = registrationFees.filter(fee => {
    const matchesSearch = fee.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fee.course.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStudent = selectedStudent === 'all' || fee.student.id === selectedStudent
    return matchesSearch && matchesStudent
  })

  const filteredMonthlyPayments = monthlyPayments.filter(payment => {
    const studentName = (payment.enrollment?.student?.name || '').toLowerCase()
    const courseName = (payment.enrollment?.course?.name || '').toLowerCase()
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
                         courseName.includes(searchTerm.toLowerCase())
    const matchesStudent = selectedStudent === 'all' || 
                          payment.enrollment?.student?.id === selectedStudent
    return matchesSearch && matchesStudent
  })

  // Calculate totals
  const totalRegistrationDue = filteredRegistrationFees.reduce((sum, f) => sum + f.registration_fee, 0)
  const totalMonthlyDue = filteredMonthlyPayments.reduce((sum, p) => sum + p.total_amount, 0)
  const totalDue = totalRegistrationDue + totalMonthlyDue

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-slate-600">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              المدفوعات المستحقة
            </h1>
            <p className="text-slate-600 text-lg">
              تتبع رسوم التسجيل والمدفوعات الشهرية غير المدفوعة
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستحقات</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalDue.toLocaleString()} د</div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رسوم التسجيل</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalRegistrationDue.toLocaleString()} د</div>
            <p className="text-xs text-slate-600">{filteredRegistrationFees.length} طالب</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأقساط الشهرية</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalMonthlyDue.toLocaleString()} د</div>
            <p className="text-xs text-slate-600">{filteredMonthlyPayments.length} دفعة</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد المدفوعات</CardTitle>
            <AlertCircle className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {filteredRegistrationFees.length + filteredMonthlyPayments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="بحث بالاسم أو الكورس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="all">جميع الطلاب</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Registration Fees Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            رسوم التسجيل غير المدفوعة ({filteredRegistrationFees.length})
          </CardTitle>
          <CardDescription>
            رسوم التسجيل التي لم يتم دفعها بعد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الطالب</TableHead>
                <TableHead className="text-right">الكورس</TableHead>
                <TableHead className="text-right">تاريخ التسجيل</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-center">الإجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrationFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    لا توجد رسوم تسجيل غير مدفوعة
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegistrationFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="text-right">
                      <div>
                        <div className="font-medium">{fee.student.name}</div>
                        <div className="text-sm text-slate-500">{fee.student.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{fee.course.name}</TableCell>
                    <TableCell className="text-right">
                      {new Date(fee.enrollment_date).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">{fee.registration_fee.toLocaleString()} دينار</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        onClick={() => handleMarkRegistrationPaid(fee.id, fee.student.name)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                        تسجيل الدفع
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            الأقساط الشهرية المستحقة ({filteredMonthlyPayments.length})
          </CardTitle>
          <CardDescription>
            الأقساط الشهرية التي حان موعد استحقاقها ولم تُدفع
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الطالب</TableHead>
                <TableHead className="text-right">الكورس</TableHead>
                <TableHead className="text-right">الشهر</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-center">الإجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMonthlyPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    لا توجد أقساط شهرية مستحقة
                  </TableCell>
                </TableRow>
              ) : (
                filteredMonthlyPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-right">
                      <div>
                        <div className="font-medium">{payment.enrollment?.student?.name || 'غير محدد'}</div>
                        <div className="text-sm text-slate-500">{payment.enrollment?.student?.phone || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{payment.enrollment?.course?.name || 'غير محدد'}</TableCell>
                    <TableCell className="text-right">
                      {new Date(payment.payment_month).toLocaleDateString('ar-EG', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">{payment.total_amount?.toLocaleString() || 0} دينار</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        onClick={() => handleMarkMonthlyPaid(payment.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                        تسجيل الدفع
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
