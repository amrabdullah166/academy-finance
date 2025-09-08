'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Users, Calendar, DollarSign, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/lib/supabase'

interface Employee {
  id: string
  name: string
  email?: string
  phone?: string
  position: string
  salary: number
  hire_date: string
  status: string
  bank_account?: string
  tax_id?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  created_at: string
  updated_at: string
}

const positions = [
  { value: 'teacher', label: 'مدرس' },
  { value: 'admin', label: 'موظف إداري' },
  { value: 'accountant', label: 'محاسب' },
  { value: 'manager', label: 'مدير' },
  { value: 'receptionist', label: 'موظف استقبال' },
  { value: 'security', label: 'أمن' },
  { value: 'cleaner', label: 'عامل نظافة' },
  { value: 'it_support', label: 'دعم تقني' },
  { value: 'other', label: 'أخرى' }
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [positionFilter, setPositionFilter] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0],
    status: 'active',
    bank_account: '',
    tax_id: '',
    address: '',
    emergency_contact: '',
    emergency_phone: ''
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, searchTerm, statusFilter, positionFilter])

  const loadEmployees = async () => {
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error('خطأ في تحميل الموظفين:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEmployees = () => {
    let filtered = employees

    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone?.includes(searchTerm)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(employee => employee.status === statusFilter)
    }

    if (positionFilter !== 'all') {
      filtered = filtered.filter(employee => employee.position === positionFilter)
    }

    setFilteredEmployees(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const employeeData = {
        ...formData,
        salary: parseFloat(formData.salary),
        status: formData.status as 'active' | 'inactive'
      }

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, employeeData)
      } else {
        await createEmployee(employeeData)
      }

      setIsDialogOpen(false)
      setEditingEmployee(null)
      resetForm()
      loadEmployees()
    } catch (error) {
      console.error('خطأ في حفظ الموظف:', error)
      alert('حدث خطأ أثناء حفظ الموظف')
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position,
      salary: employee.salary.toString(),
      hire_date: employee.hire_date,
      status: employee.status,
      bank_account: employee.bank_account || '',
      tax_id: employee.tax_id || '',
      address: employee.address || '',
      emergency_contact: employee.emergency_contact || '',
      emergency_phone: employee.emergency_phone || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        await deleteEmployee(id)
        loadEmployees()
      } catch (error) {
        console.error('خطأ في حذف الموظف:', error)
        alert('حدث خطأ أثناء حذف الموظف')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      salary: '',
      hire_date: new Date().toISOString().split('T')[0],
      status: 'active',
      bank_account: '',
      tax_id: '',
      address: '',
      emergency_contact: '',
      emergency_phone: ''
    })
  }

  const getPositionLabel = (position: string) => {
    return positions.find(p => p.value === position)?.label || position
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', variant: 'default' as const },
      inactive: { label: 'غير نشط', variant: 'secondary' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const totalSalaries = filteredEmployees.reduce((sum, employee) => sum + employee.salary, 0)
  const activeEmployees = filteredEmployees.filter(emp => emp.status === 'active').length

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
          <h1 className="text-3xl font-bold">إدارة الموظفين</h1>
          <p className="text-muted-foreground">إدارة وتتبع بيانات موظفي الأكاديمية</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingEmployee(null) }}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة موظف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'تعديل الموظف' : 'إضافة موظف جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee ? 'تعديل بيانات الموظف' : 'أدخل بيانات الموظف الجديد'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">الاسم الكامل *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="position">المنصب *</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنصب" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map(position => (
                        <SelectItem key={position.value} value={position.value}>
                          {position.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary">الراتب *</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="hire_date">تاريخ التوظيف *</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_account">رقم الحساب البنكي</Label>
                  <Input
                    id="bank_account"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tax_id">الرقم الضريبي</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact">جهة الاتصال للطوارئ</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="emergency_phone">هاتف الطوارئ</Label>
                  <Input
                    id="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'تحديث' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredEmployees.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموظفون النشطون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرواتب</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalaries.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">شهرياً</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الراتب</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeEmployees > 0 ? (totalSalaries / activeEmployees).toLocaleString() : 0} ر.س
            </div>
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
                  placeholder="البحث في الموظفين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="فلترة حسب المنصب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المناصب</SelectItem>
                {positions.map(position => (
                  <SelectItem key={position.value} value={position.value}>
                    {position.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين</CardTitle>
          <CardDescription>
            عرض جميع الموظفين المسجلين ({filteredEmployees.length} موظف)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>المنصب</TableHead>
                <TableHead>التواصل</TableHead>
                <TableHead>الراتب</TableHead>
                <TableHead>تاريخ التوظيف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="font-medium">{employee.name}</div>
                  </TableCell>
                  <TableCell>{getPositionLabel(employee.position)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {employee.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 ml-1" />
                          {employee.email}
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 ml-1" />
                          {employee.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{employee.salary.toLocaleString()} ر.س</TableCell>
                  <TableCell>
                    {new Date(employee.hire_date).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>{getStatusBadge(employee.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد موظفين مطابقين للفلترة المحددة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
