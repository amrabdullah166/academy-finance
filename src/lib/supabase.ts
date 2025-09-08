import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface DashboardStats {
  totalStudents: number
  activeStudents: number
  totalCourses: number
  activeCourses: number
  monthlyRevenue: number
  monthlyExpenses: number
  netProfit: number
  pendingPayments: number
  overdueSubscriptions: number
}

export interface Student {
  id: string
  name: string
  email?: string
  phone?: string
  guardian_name: string
  guardian_phone: string
  enrollment_date: string
  status: 'active' | 'inactive' | 'suspended'
  grade_level?: string
  discount_percentage: number
  address?: string
  date_of_birth?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  name: string
  description?: string
  monthly_fee: number
  total_sessions?: number
  status: 'active' | 'inactive'
  instructor_id?: string
  start_date?: string
  end_date?: string
  max_students?: number
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  name: string
  email?: string
  phone?: string
  position: string
  salary: number
  hire_date: string
  status: 'active' | 'inactive'
  bank_account?: string
  tax_id?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  student_id: string
  amount: number
  payment_date: string
  payment_type: 'cash' | 'bank_transfer' | 'online' | 'check'
  payment_method: 'monthly_fee' | 'registration' | 'materials' | 'penalty' | 'refund' | 'other'
  receipt_number: string
  notes?: string
  status: 'completed' | 'pending' | 'cancelled' | 'refunded'
  course_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  category: 'salaries' | 'rent' | 'utilities' | 'equipment' | 'marketing' | 'maintenance' | 'supplies' | 'insurance' | 'taxes' | 'other'
  description: string
  amount: number
  expense_date: string
  receipt_number?: string
  supplier_name?: string
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'credit_card'
  status: 'paid' | 'pending' | 'approved' | 'rejected'
  approved_by?: string
  created_by?: string
  attachment_url?: string
  created_at: string
  updated_at: string
}

export interface StudentCourse {
  id: string
  student_id: string
  course_id: string
  enrollment_date: string
  completion_date?: string
  status: 'enrolled' | 'completed' | 'dropped'
  final_grade?: number
  notes?: string
  created_at: string
}

export interface Salary {
  id: string
  employee_id: string
  salary_month: number
  salary_year: number
  base_salary: number
  bonuses: number
  deductions: number
  tax_deduction: number
  net_salary: number
  payment_date?: string
  status: 'pending' | 'paid' | 'cancelled'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'payment_reminder' | 'overdue_payment' | 'salary_due' | 'expense_approval' | 'general' | 'system'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  target_user_id?: string
  target_role?: 'admin' | 'teacher' | 'accountant' | 'manager'
  is_read: boolean
  scheduled_date?: string
  created_at: string
  expires_at?: string
}

// Helper Functions for Database Operations

// Students Functions
export const getStudents = async () => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const createStudent = async (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
  // تنظيف البيانات قبل الإرسال
  const cleanedStudent = {
    ...student,
    email: student.email || null,
    phone: student.phone || null,
    grade_level: student.grade_level || null,
    address: student.address || null,
    date_of_birth: student.date_of_birth || null,
    discount_percentage: student.discount_percentage || 0
  }

  const { data, error } = await supabase
    .from('students')
    .insert([cleanedStudent])
    .select()
  
  if (error) {
    console.error('خطأ في إنشاء الطالب:', error)
    throw error
  }
  return data[0]
}

export const updateStudent = async (id: string, updates: Partial<Student>) => {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0]
}

export const deleteStudent = async (studentId: string) => {
  try {
    // الحصول على معلومات الطالب قبل الحذف للتأكد من وجوده
    const { data: studentData, error: studentCheckError } = await supabase
      .from('students')
      .select('id, name')
      .eq('id', studentId)
      .single()

    if (studentCheckError || !studentData) {
      throw new Error('الطالب غير موجود')
    }

    console.log(`بدء حذف الطالب: ${studentData.name} (${studentId})`)

    let deletedReminders = 0
    let deletedPayments = 0
    let deletedEnrollments = 0

    // 1. محاولة حذف تفاصيل التذكيرات المرتبطة بالطالب
    try {
      const { data: reminderDetails, error: reminderDetailsError } = await supabase
        .from('reminder_details')
        .delete()
        .eq('student_id', studentId)
        .select('id')
      
      if (reminderDetailsError) {
        console.warn('خطأ في حذف تفاصيل التذكيرات:', reminderDetailsError)
      } else {
        deletedReminders = reminderDetails?.length || 0
        console.log(`تم حذف ${deletedReminders} تفصيل تذكير`)
      }
    } catch (reminderError) {
      console.warn('جدول التذكيرات غير موجود أو خطأ في الوصول إليه:', reminderError)
    }

    // 2. حذف المدفوعات المرتبطة بالطالب
    console.log(`محاولة حذف المدفوعات للطالب: ${studentId}`)
    const { data: deletedPaymentsData, error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('student_id', studentId)
      .select('id')
    
    if (paymentsError) {
      console.error('خطأ في حذف المدفوعات:', paymentsError)
      throw new Error(`فشل في حذف المدفوعات: ${paymentsError.message}`)
    } else {
      deletedPayments = deletedPaymentsData?.length || 0
      console.log(`تم حذف ${deletedPayments} دفعة فعلياً`)
    }

    // 3. حذف تسجيل الطالب في الكورسات
    console.log(`محاولة حذف التسجيلات للطالب: ${studentId}`)
    const { data: deletedEnrollmentsData, error: enrollmentError } = await supabase
      .from('student_courses')
      .delete()
      .eq('student_id', studentId)
      .select('id')
    
    if (enrollmentError) {
      console.error('خطأ في حذف تسجيل الطالب:', enrollmentError)
      throw new Error(`فشل في حذف تسجيل الطالب: ${enrollmentError.message}`)
    } else {
      deletedEnrollments = deletedEnrollmentsData?.length || 0
      console.log(`تم حذف ${deletedEnrollments} تسجيل في كورس فعلياً`)
    }

    // 4. الآن حذف الطالب نفسه
    console.log(`محاولة حذف الطالب من قاعدة البيانات: ${studentId}`)
    const { data: deletedStudent, error: studentError } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)
      .select()
    
    if (studentError) {
      console.error('خطأ في حذف الطالب:', studentError)
      throw new Error(`فشل في حذف الطالب: ${studentError.message}`)
    }

    console.log('البيانات المحذوفة:', deletedStudent)
    if (!deletedStudent || deletedStudent.length === 0) {
      console.warn('تحذير: لم يتم حذف أي بيانات من جدول الطلاب')
    }

    console.log('تم حذف الطالب بنجاح')
    return {
      success: true,
      deletedPayments,
      deletedEnrollments,
      deletedReminders
    }

  } catch (error) {
    console.error('خطأ عام في حذف الطالب:', error)
    throw error
  }
}

// Activity Functions - إضافة جديدة
export const getRecentActivities = async (limit = 10) => {
  try {
    // جلب آخر المدفوعات مع أسماء الطلاب
    const { data: recentPayments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_date,
        payment_method,
        status,
        created_at,
        students!inner(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (paymentsError) {
      console.error('خطأ في جلب المدفوعات:', paymentsError)
    }

    // جلب آخر التسجيلات مع أسماء الطلاب والكورسات
    const { data: recentEnrollments, error: enrollmentsError } = await supabase
      .from('student_courses')
      .select(`
        id,
        enrollment_date,
        status,
        created_at,
        students!inner(name, email),
        courses!inner(name, monthly_fee)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (enrollmentsError) {
      console.error('خطأ في جلب التسجيلات:', enrollmentsError)
    }

    // دمج النشاطات وترتيبها
    const activities = []

    // إضافة المدفوعات
    if (recentPayments) {
      activities.push(...recentPayments.map((payment: any) => ({
        id: `payment-${payment.id}`,
        type: 'payment' as const,
        description: `دفعة من ${payment.students?.name || 'غير محدد'} - ${payment.payment_method === 'monthly_fee' ? 'اشتراك شهري' : getPaymentMethodName(payment.payment_method)}`,
        amount: payment.amount,
        date: payment.payment_date,
        status: payment.status,
        created_at: payment.created_at
      })))
    }

    // إضافة التسجيلات
    if (recentEnrollments) {
      activities.push(...recentEnrollments.map((enrollment: any) => ({
        id: `enrollment-${enrollment.id}`,
        type: 'enrollment' as const,
        description: `تسجيل ${enrollment.students?.name || 'غير محدد'} في ${enrollment.courses?.name || 'غير محدد'}`,
        amount: enrollment.courses?.monthly_fee || 0,
        date: enrollment.enrollment_date,
        status: enrollment.status,
        created_at: enrollment.created_at
      })))
    }

    // ترتيب النشاطات حسب التاريخ وإرجاع المحدود
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)

  } catch (error) {
    console.error('خطأ في جلب النشاطات الأخيرة:', error)
    return []
  }
}

const getPaymentMethodName = (method: string) => {
  const methods = {
    monthly_fee: 'اشتراك شهري',
    registration: 'رسوم تسجيل',
    materials: 'رسوم مواد',
    penalty: 'غرامة',
    refund: 'استرداد',
    other: 'أخرى'
  }
  return methods[method as keyof typeof methods] || method
}

// إضافة نشاط جديد (اختياري - يمكن استخدامه لاحقاً)
export const createActivity = async (activity: {
  type: string;
  description: string;
  amount?: number;
  related_id?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([{
        ...activity,
        created_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('خطأ في إنشاء النشاط:', error)
    // لا نرمي خطأ هنا لأن الأنشطة اختيارية
    return null
  }
}
export const getPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      students (name)
    `)
    .order('payment_date', { ascending: false })
  
  if (error) throw error
  return data
}

export const createPayment = async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'receipt_number'>) => {
  const { data, error } = await supabase
    .from('payments')
    .insert([payment])
    .select(`
      *,
      students (name)
    `)
  
  if (error) throw error
  return data[0]
}

export const updatePayment = async (id: string, updates: Partial<Payment>) => {
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      students (name)
    `)
  
  if (error) throw error
  return data[0]
}

export const deletePayment = async (id: string) => {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Expenses Functions
export const getExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
  
  if (error) throw error
  return data
}

export const createExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()
  
  if (error) throw error
  return data[0]
}

// Courses Functions
export const getCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const createCourse = async (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select()
  
  if (error) throw error
  
  // لا نضيف أي طلاب تلقائياً - الكورس ينشأ فارغاً
  // ويمكن إضافة الطلاب لاحقاً من خلال واجهة منفصلة
  
  return data[0]
}

export const deleteCourse = async (courseId: string) => {
  try {
    // الحصول على معلومات الكورس قبل الحذف للتأكد من وجوده
    const { data: courseData, error: courseCheckError } = await supabase
      .from('courses')
      .select('id, name')
      .eq('id', courseId)
      .single()

    if (courseCheckError || !courseData) {
      throw new Error('الكورس غير موجود')
    }

    console.log(`بدء حذف الكورس: ${courseData.name} (${courseId})`)

    let deletedReminders = 0
    let deletedPayments = 0
    let deletedEnrollments = 0

    // 1. محاولة حذف تفاصيل التذكيرات (قد لا يكون الجدول موجوداً)
    try {
      const { data: reminderDetails, error: reminderDetailsError } = await supabase
        .from('reminder_details')
        .delete()
        .eq('course_id', courseId)
        .select('id')
      
      if (reminderDetailsError) {
        console.warn('خطأ في حذف تفاصيل التذكيرات:', reminderDetailsError)
      } else {
        deletedReminders = reminderDetails?.length || 0
        console.log(`تم حذف ${deletedReminders} تفصيل تذكير`)
      }
    } catch (reminderError) {
      console.warn('جدول التذكيرات غير موجود أو خطأ في الوصول إليه:', reminderError)
    }

    // 2. حذف المدفوعات المرتبطة بالكورس أولاً
    const { data: deletedPaymentsData, error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('course_id', courseId)
      .select('id')
    
    if (paymentsError) {
      console.error('خطأ في حذف المدفوعات:', paymentsError)
      throw new Error(`فشل في حذف المدفوعات: ${paymentsError.message}`)
    } else {
      deletedPayments = deletedPaymentsData?.length || 0
      console.log(`تم حذف ${deletedPayments} دفعة`)
    }

    // 3. حذف تسجيل الطلاب في الكورس
    const { data: deletedEnrollmentsData, error: enrollmentError } = await supabase
      .from('student_courses')
      .delete()
      .eq('course_id', courseId)
      .select('id')
    
    if (enrollmentError) {
      console.error('خطأ في حذف تسجيل الطلاب:', enrollmentError)
      throw new Error(`فشل في حذف تسجيل الطلاب: ${enrollmentError.message}`)
    } else {
      deletedEnrollments = deletedEnrollmentsData?.length || 0
      console.log(`تم حذف ${deletedEnrollments} تسجيل طالب`)
    }

    // 4. الآن حذف الكورس نفسه
    const { error: courseError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
    
    if (courseError) {
      console.error('خطأ في حذف الكورس:', courseError)
      throw new Error(`فشل في حذف الكورس: ${courseError.message}`)
    }

    console.log('تم حذف الكورس بنجاح')
    return {
      success: true,
      deletedPayments,
      deletedEnrollments,
      deletedReminders
    }

  } catch (error) {
    console.error('خطأ عام في حذف الكورس:', error)
    throw error
  }
}

// Employees Functions
export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('employees')
    .insert([employee])
    .select()
  
  if (error) throw error
  return data[0]
}

// Additional Expense Functions
export const updateExpense = async (id: string, expense: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('expenses')
    .update(expense)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const deleteExpense = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Additional Employee Functions
export const updateEmployee = async (id: string, employee: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('employees')
    .update(employee)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const deleteEmployee = async (id: string) => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Student-Courses Relationship Functions
export const getStudentCourses = async () => {
  const { data, error } = await supabase
    .from('student_courses')
    .select(`
      *,
      students (id, name, email, phone, status),
      courses (id, name, monthly_fee, status)
    `)
    .order('enrollment_date', { ascending: false })
  
  if (error) throw error
  return data
}

export const enrollStudentInCourse = async (studentId: string, courseId: string) => {
  const { data, error } = await supabase
    .from('student_courses')
    .insert([{
      student_id: studentId,
      course_id: courseId,
      enrollment_date: new Date().toISOString().split('T')[0],
      status: 'enrolled'
    }])
    .select(`
      *,
      students (name),
      courses (name, monthly_fee)
    `)
    .single()
  
  if (error) throw error
  return data
}

// إضافة عدة طلاب للكورس دفعة واحدة
export const enrollMultipleStudentsInCourse = async (studentIds: string[], courseId: string) => {
  const enrollments = studentIds.map(studentId => ({
    student_id: studentId,
    course_id: courseId,
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'enrolled'
  }))

  const { data, error } = await supabase
    .from('student_courses')
    .insert(enrollments)
    .select(`
      *,
      students (name),
      courses (name, monthly_fee)
    `)
  
  if (error) throw error
  return data
}

export const getStudentsByCoursea = async (courseId: string) => {
  const { data, error } = await supabase
    .from('student_courses')
    .select(`
      *,
      students (*)
    `)
    .eq('course_id', courseId)
    .eq('status', 'enrolled')
  
  if (error) throw error
  return data
}

export const getCoursesByStudent = async (studentId: string) => {
  const { data, error } = await supabase
    .from('student_courses')
    .select(`
      *,
      courses (*)
    `)
    .eq('student_id', studentId)
    .eq('status', 'enrolled')
  
  if (error) throw error
  return data
}

export const unenrollStudentFromCourse = async (studentId: string, courseId: string) => {
  const { error } = await supabase
    .from('student_courses')
    .update({ status: 'dropped' })
    .eq('student_id', studentId)
    .eq('course_id', courseId)
  
  if (error) throw error
}

// Advanced Analytics Functions
export const getCourseAnalytics = async (courseId: string) => {
  try {
    // Get enrolled students
    const { count: enrolledStudents } = await supabase
      .from('student_courses')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('status', 'enrolled')

    // Get course payments (revenue)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('course_id', courseId)
      .eq('status', 'completed')

    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
    
    // Get monthly revenue trend
    const monthlyRevenue = payments?.reduce((acc: any, payment) => {
      const month = new Date(payment.payment_date).toISOString().slice(0, 7)
      acc[month] = (acc[month] || 0) + payment.amount
      return acc
    }, {}) || {}

    // Get current month subscriptions
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { count: currentMonthSubscriptions } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .eq('payment_method', 'monthly_fee')
      .gte('payment_date', currentMonth + '-01')
      .lt('payment_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10))

    return {
      enrolledStudents: enrolledStudents || 0,
      totalRevenue,
      monthlyRevenue,
      currentMonthSubscriptions: currentMonthSubscriptions || 0,
      averageRevenuePerStudent: enrolledStudents ? totalRevenue / enrolledStudents : 0
    }
  } catch (error) {
    console.error('Error fetching course analytics:', error)
    throw error
  }
}

export const getStudentFinancialSummary = async (studentId: string) => {
  try {
    // Get student's payments
    const { data: payments } = await supabase
      .from('payments')
      .select(`
        *,
        courses (name, monthly_fee)
      `)
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false })

    // Get student's enrolled courses
    const { data: enrolledCourses } = await supabase
      .from('student_courses')
      .select(`
        *,
        courses (*)
      `)
      .eq('student_id', studentId)
      .eq('status', 'enrolled')

    const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
    const totalCourseFees = enrolledCourses?.reduce((sum, sc) => sum + sc.courses.monthly_fee, 0) || 0
    
    // Calculate outstanding amount (simplified)
    const currentMonth = new Date().toISOString().slice(0, 7)
    const paidThisMonth = payments?.filter(p => 
      p.payment_date.startsWith(currentMonth) && p.payment_method === 'monthly_fee'
    ).reduce((sum, p) => sum + p.amount, 0) || 0

    return {
      totalPaid,
      totalCourseFees,
      enrolledCoursesCount: enrolledCourses?.length || 0,
      paymentsCount: payments?.length || 0,
      lastPayment: payments?.[0] || null,
      paidThisMonth,
      outstandingThisMonth: totalCourseFees - paidThisMonth,
      enrolledCourses,
      recentPayments: payments?.slice(0, 5) || []
    }
  } catch (error) {
    console.error('Error fetching student financial summary:', error)
    throw error
  }
}

// Dashboard Statistics Functions
export const getDashboardStats = async () => {
  try {
    // Get total students
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    // Get active students
    const { count: activeStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get this month's revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const { data: monthlyPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('payment_date', startOfMonth)

    const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

    // Get this month's expenses
    const { data: monthlyExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('status', 'paid')
      .gte('expense_date', startOfMonth)

    const totalExpenses = monthlyExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0

    // Get active courses
    const { count: activeCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get pending payments
    const { count: pendingPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return {
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      monthlyRevenue,
      totalExpenses,
      activeCourses: activeCourses || 0,
      pendingPayments: pendingPayments || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

// Monthly Subscriptions Functions
export const getMonthlySubscriptions = async () => {
  const { data, error } = await supabase
    .from('monthly_subscriptions')
    .select(`
      *,
      students (id, name, email, phone),
      courses (id, name, monthly_fee)
    `)
    .order('due_date', { ascending: false })
  
  if (error) throw error
  return data
}

export const createMonthlySubscription = async (subscription: {
  student_id: string
  course_id: string
  subscription_month: number
  subscription_year: number
  amount: number
  discount_amount?: number
  final_amount: number
  due_date: string
}) => {
  const { data, error } = await supabase
    .from('monthly_subscriptions')
    .insert([subscription])
    .select(`
      *,
      students (name),
      courses (name)
    `)
  
  if (error) throw error
  return data[0]
}

export const getOverdueSubscriptions = async () => {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('monthly_subscriptions')
    .select(`
      *,
      students (id, name, phone, guardian_phone),
      courses (id, name, monthly_fee)
    `)
    .eq('payment_status', 'pending')
    .lt('due_date', today)
    .order('due_date', { ascending: true })
  
  if (error) throw error
  return data
}

export const updateSubscriptionPayment = async (subscriptionId: string, paymentId: string) => {
  const { data, error } = await supabase
    .from('monthly_subscriptions')
    .update({ 
      payment_status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
      payment_id: paymentId
    })
    .eq('id', subscriptionId)
    .select()
  
  if (error) throw error
  return data[0]
}

// Activities and Notifications Functions
export const getNotifications = async (userId?: string, unreadOnly: boolean = true): Promise<Notification[]> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (userId) {
      query = query.eq('target_user_id', userId)
    }

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getNotifications:', error)
    return []
  }
}

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ ...notification, is_read: false }])
    .select()
  
  if (error) throw error
  return data[0]
}

export const markNotificationAsRead = async (id: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
  
  if (error) throw error
}

export const getActivities = async (limit = 20) => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

// Enhanced Dashboard Stats Function
export const getEnhancedDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
    const startOfNextMonth = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`

    const [
      studentsResult,
      coursesResult,
      paymentsResult,
      expensesResult,
      subscriptionsResult
    ] = await Promise.all([
      supabase.from('students').select('id, status'),
      supabase.from('courses').select('id, status'),
      supabase
        .from('payments')
        .select('amount, status, payment_date')
        .gte('payment_date', startOfMonth)
        .lt('payment_date', startOfNextMonth),
      supabase
        .from('expenses')
        .select('amount, expense_date, status')
        .gte('expense_date', startOfMonth)
        .lt('expense_date', startOfNextMonth),
      supabase
        .from('monthly_subscriptions')
        .select('payment_status')
        .eq('subscription_month', currentMonth)
        .eq('subscription_year', currentYear)
    ])

    const students = studentsResult.data || []
    const courses = coursesResult.data || []
    const payments = paymentsResult.data || []
    const expenses = expensesResult.data || []
    const subscriptions = subscriptionsResult.data || []

    const totalStudents = students.length
    const activeStudents = students.filter(s => s.status === 'active').length
    const totalCourses = courses.length
    const activeCourses = courses.filter(c => c.status === 'active').length

    const monthlyRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const monthlyExpenses = expenses
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + (e.amount || 0), 0)

    const netProfit = monthlyRevenue - monthlyExpenses
    const pendingPayments = payments.filter(p => p.status === 'pending').length
    const overdueSubscriptions = subscriptions.filter(s => s.payment_status === 'overdue').length

    return {
      totalStudents,
      activeStudents,
      totalCourses,
      activeCourses,
      monthlyRevenue,
      monthlyExpenses,
      netProfit,
      pendingPayments,
      overdueSubscriptions
    }
  } catch (error) {
    console.error('Error getting enhanced dashboard stats:', error)
    return {
      totalStudents: 0,
      activeStudents: 0,
      totalCourses: 0,
      activeCourses: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      netProfit: 0,
      pendingPayments: 0,
      overdueSubscriptions: 0
    }
  }
}

// Recent Payments Function
export const getRecentPayments = async (limit: number = 5): Promise<Payment[]> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        students:student_id(name, email),
        courses:course_id(name)
      `)
      .order('payment_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent payments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getRecentPayments:', error)
    return []
  }
}

// ===== Payment Status and Reminders Types =====
export interface PaymentStatus {
  student_id: string
  course_id: string
  student_name: string
  student_phone: string
  course_name: string
  monthly_fee: number
  enrollment_date: string
  months_enrolled: number
  total_due_amount: number
  total_paid: number
  remaining_amount: number
  months_overdue: number
  payment_status: 'paid_up' | 'current_month_due' | 'overdue'
  last_payment_date: string | null
}

export interface SystemSetting {
  id: string
  setting_key: string
  setting_value: string
  setting_type: 'string' | 'number' | 'boolean' | 'date'
  description: string
  created_at: string
  updated_at: string
}

export interface MonthlyReminder {
  id: string
  reminder_date: string
  reminder_type: string
  title: string
  description: string
  total_students: number
  total_amount: number
  status: 'pending' | 'sent' | 'completed'
  created_at: string
  processed_at: string | null
}

export interface ReminderDetail {
  id: string
  reminder_id: string
  student_id: string
  course_id: string
  due_amount: number
  months_overdue: number
  penalty_amount: number
  last_payment_date: string | null
  status: 'pending' | 'paid' | 'overdue'
  created_at: string
  student?: Student
  course?: Course
}

// ===== Payment Status Functions =====
export const getStudentPaymentStatus = async (): Promise<PaymentStatus[]> => {
  const { data, error } = await supabase
    .from('student_payment_status')
    .select('*')
    .order('remaining_amount', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const getPaymentStatistics = async () => {
  const { data, error } = await supabase
    .rpc('get_payment_statistics_simple')
  
  if (error) throw error
  return data?.[0] || {
    total_students_with_dues: 0,
    total_outstanding_amount: 0,
    students_current_month: 0,
    students_overdue: 0,
    average_months_overdue: 0
  }
}

// ===== System Settings Functions =====
export const getSystemSettings = async (): Promise<SystemSetting[]> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('setting_key')
  
  if (error) throw error
  
  const settings = data || []
  
  // إضافة الإعداد الافتراضي لنموذج النسخ إذا لم يكن موجوداً
  const copyTemplateExists = settings.find(s => s.setting_key === 'copy_student_template')
  if (!copyTemplateExists) {
    const defaultTemplate = 'الطالب: {student_name}\nالمتطلبات المالية: {amount} دينار\nرقم ولي الأمر: {guardian_phone}\nالكورسات: {courses}'
    
    const { data: newSetting, error: insertError } = await supabase
      .from('system_settings')
      .insert({
        setting_key: 'copy_student_template',
        setting_value: defaultTemplate,
        description: 'نموذج نسخ بيانات الطالب'
      })
      .select()
      .single()
    
    if (!insertError && newSetting) {
      settings.push(newSetting)
    }
  }
  
  return settings
}

export const updateSystemSetting = async (key: string, value: string) => {
  // محاولة التحديث أولاً
  const { data, error } = await supabase
    .from('system_settings')
    .update({ 
      setting_value: value,
      updated_at: new Date().toISOString()
    })
    .eq('setting_key', key)
    .select()
    .single()
  
  // إذا لم يكن الإعداد موجوداً، قم بإنشاؤه
  if (error && error.code === 'PGRST116') {
    const { data: newData, error: insertError } = await supabase
      .from('system_settings')
      .insert({
        setting_key: key,
        setting_value: value,
        description: `إعداد ${key}`
      })
      .select()
      .single()
    
    if (insertError) throw insertError
    return newData
  }
  
  if (error) throw error
  return data
}

export const getSystemSetting = async (key: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', key)
    .single()
  
  if (error) return null
  return data?.setting_value || null
}

// ===== Monthly Reminders Functions =====
export const getMonthlyReminders = async (): Promise<MonthlyReminder[]> => {
  const { data, error } = await supabase
    .from('monthly_reminders')
    .select('*')
    .order('reminder_date', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const generateMonthlyReminder = async () => {
  const { data, error } = await supabase
    .rpc('generate_monthly_reminder')
  
  if (error) throw error
  return data?.[0]
}

export const getReminderDetails = async (reminderId: string): Promise<ReminderDetail[]> => {
  const { data, error } = await supabase
    .from('reminder_details')
    .select(`
      *,
      student:students(name, phone, email),
      course:courses(name, monthly_fee)
    `)
    .eq('reminder_id', reminderId)
    .order('due_amount', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const markReminderAsProcessed = async (reminderId: string) => {
  const { data, error } = await supabase
    .from('monthly_reminders')
    .update({ 
      status: 'sent',
      processed_at: new Date().toISOString()
    })
    .eq('id', reminderId)
    .select()
    .single()
  
  if (error) throw error
  return data
}
