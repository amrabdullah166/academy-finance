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
  const { data, error } = await supabase
    .from('students')
    .insert([student])
    .select()
  
  if (error) throw error
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

export const deleteStudent = async (id: string) => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Payments Functions
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
  return data[0]
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
