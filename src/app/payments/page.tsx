'use client'

import { useState } from 'react'
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
  PrinterIcon
} from 'lucide-react'
import Link from 'next/link'

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // البيانات التجريبية للمدفوعات
  const payments = [
    {
      id: 1,
      receiptNumber: 'REC-2025-001',
      studentName: 'أحمد محمد علي',
      amount: 300,
      paymentDate: '2025-09-08',
      paymentType: 'cash',
      paymentMethod: 'monthly_fee',
      status: 'completed',
      notes: 'رسوم شهر سبتمبر'
    },
    {
      id: 2,
      receiptNumber: 'REC-2025-002',
      studentName: 'فاطمة حسن أحمد',
      amount: 250,
      paymentDate: '2025-09-07',
      paymentType: 'bank_transfer',
      paymentMethod: 'monthly_fee',
      status: 'completed',
      notes: 'رسوم شهر سبتمبر'
    },
    {
      id: 3,
      receiptNumber: 'REC-2025-003',
      studentName: 'محمد حسن',
      amount: 400,
      paymentDate: '2025-09-06',
      paymentType: 'cash',
      paymentMethod: 'registration',
      status: 'completed',
      notes: 'رسوم تسجيل جديد'
    },
    {
      id: 4,
      receiptNumber: 'REC-2025-004',
      studentName: 'عائشة علي',
      amount: 150,
      paymentDate: '2025-09-05',
      paymentType: 'online',
      paymentMethod: 'materials',
      status: 'pending',
      notes: 'رسوم الكتب والمواد'
    }
  ]

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesType = typeFilter === 'all' || payment.paymentMethod === typeFilter
    
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
      default:
        return <Badge variant="outline">غير محدد</Badge>
    }
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Banknote className="h-4 w-4 text-green-600" />
      case 'bank_transfer':
        return <Building2 className="h-4 w-4 text-blue-600" />
      case 'online':
        return <Smartphone className="h-4 w-4 text-purple-600" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentTypeName = (type: string) => {
    switch (type) {
      case 'cash':
        return 'نقدي'
      case 'bank_transfer':
        return 'تحويل بنكي'
      case 'online':
        return 'دفع إلكتروني'
      default:
        return 'غير محدد'
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'monthly_fee':
        return 'رسوم شهرية'
      case 'registration':
        return 'رسوم تسجيل'
      case 'materials':
        return 'رسوم مواد'
      case 'other':
        return 'أخرى'
      default:
        return 'غير محدد'
    }
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
                تسجيل ومتابعة مدفوعات الطلاب والإيصالات
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 ml-2" />
                تسجيل دفعة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل بيانات الدفعة الجديدة
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student">الطالب</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الطالب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student1">أحمد محمد علي</SelectItem>
                        <SelectItem value="student2">فاطمة حسن أحمد</SelectItem>
                        <SelectItem value="student3">محمد حسن</SelectItem>
                        <SelectItem value="student4">عائشة علي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ (ر.س)</Label>
                    <Input id="amount" type="number" placeholder="0.00" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentType">طريقة الدفع</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر طريقة الدفع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                        <SelectItem value="online">دفع إلكتروني</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">نوع الدفعة</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الدفعة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly_fee">رسوم شهرية</SelectItem>
                        <SelectItem value="registration">رسوم تسجيل</SelectItem>
                        <SelectItem value="materials">رسوم مواد</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">تاريخ الدفع</Label>
                    <Input id="paymentDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receiptNumber">رقم الإيصال</Label>
                    <Input id="receiptNumber" placeholder="سيتم إنشاؤه تلقائياً" disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input id="notes" placeholder="أدخل أي ملاحظات إضافية" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={() => setIsAddDialogOpen(false)}>
                    حفظ الدفعة
                  </Button>
                </div>
              </div>
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
              {payments.filter(p => p.paymentDate === '2025-09-08').reduce((sum, p) => sum + p.amount, 0).toLocaleString()} ر.س
            </div>
            <p className="text-xs text-green-600">+3 دفعات اليوم</p>
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
              {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} ر.س
            </div>
            <p className="text-xs text-green-600">+15% من الشهر الماضي</p>
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
                  <TableHead>رقم الإيصال</TableHead>
                  <TableHead>الطالب</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>نوع الدفعة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الملاحظات</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-slate-500" />
                        <span className="font-mono text-sm">{payment.receiptNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800">{payment.studentName}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-bold text-lg">
                        {payment.amount.toLocaleString()} ر.س
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        <span className="text-sm">{payment.paymentDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentTypeIcon(payment.paymentType)}
                        <span className="text-sm">{getPaymentTypeName(payment.paymentType)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getPaymentMethodName(payment.paymentMethod)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{payment.notes}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <PrinterIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Receipt className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
