'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  BookOpen, 
  Calendar,
  Bell,
  CreditCard,
  UserCheck,
  Wallet,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { getEnhancedDashboardStats, getRecentPayments, getNotifications, getStudentCourses, Payment, Notification } from '@/lib/supabase'

interface DashboardStats {
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

interface RecentActivity {
  id: string
  type: 'payment' | 'enrollment' | 'expense'
  description: string
  amount?: number
  date: string
  status: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalCourses: 0,
    activeCourses: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0,
    pendingPayments: 0,
    overdueSubscriptions: 0
  })
  
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [recentEnrollments, setRecentEnrollments] = useState<Payment[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const [
        dashboardStats,
        payments,
        enrollments,
        notifs
      ] = await Promise.all([
        getEnhancedDashboardStats(),
        getRecentPayments(5),
        getStudentCourses(),
        getNotifications() // إزالة الـ parameter الخطأ
      ])

      setStats(dashboardStats)
      setRecentPayments(payments || [])
      setRecentEnrollments(enrollments?.slice(0, 5) || [])
      setNotifications(notifs || [])

      // Combine recent activities
      const activities: RecentActivity[] = [
        ...payments?.map((p: Payment & { students?: { name: string } }) => ({
          id: p.id,
          type: 'payment' as const,
          description: `دفعة من ${p.students?.name || 'غير محدد'} - ${p.payment_method === 'monthly_fee' ? 'اشتراك شهري' : 'رسوم أخرى'}`,
          amount: p.amount,
          date: p.payment_date,
          status: p.status
        })) || [],
        ...enrollments?.slice(0, 3).map((e: { 
          id: string; 
          enrollment_date: string; 
          status: string;
          students?: { name: string }; 
          courses?: { name: string } 
        }) => ({
          id: e.id,
          type: 'enrollment' as const,
          description: `تسجيل ${e.students?.name || 'غير محدد'} في ${e.courses?.name || 'غير محدد'}`,
          date: e.enrollment_date,
          status: e.status
        })) || []
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

      setRecentActivities(activities)

    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة التحكم:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CreditCard className="h-4 w-4 text-green-600" />
      case 'enrollment': return <UserCheck className="h-4 w-4 text-blue-600" />
      case 'expense': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string, type: string) => {
    if (type === 'payment') {
      switch (status) {
        case 'completed': return <Badge variant="default" className="bg-green-100 text-green-800">مكتمل</Badge>
        case 'pending': return <Badge variant="secondary">معلق</Badge>
        case 'cancelled': return <Badge variant="destructive">ملغى</Badge>
        default: return <Badge variant="outline">{status}</Badge>
      }
    } else if (type === 'enrollment') {
      switch (status) {
        case 'enrolled': return <Badge variant="default" className="bg-blue-100 text-blue-800">مسجل</Badge>
        case 'completed': return <Badge variant="outline">مكتمل</Badge>
        case 'dropped': return <Badge variant="destructive">منسحب</Badge>
        default: return <Badge variant="outline">{status}</Badge>
      }
    }
    return <Badge variant="outline">{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-2">جاري التحميل...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600">نظرة شاملة على الوضع المالي للأكاديمية</p>
        </div>
        <div className="flex gap-2">
          <Link href="/students">
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة طالب
            </Button>
          </Link>
          <Link href="/subscriptions">
            <Button variant="outline">
              <Calendar className="ml-2 h-4 w-4" />
              الاشتراكات
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert Cards */}
      {(stats.pendingPayments > 0 || stats.overdueSubscriptions > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {stats.pendingPayments > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      {stats.pendingPayments} دفعة معلقة
                    </span>
                  </div>
                  <Link href="/payments">
                    <Button size="sm" variant="outline" className="border-yellow-300">
                      مراجعة
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          
          {stats.overdueSubscriptions > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">
                      {stats.overdueSubscriptions} اشتراك متأخر
                    </span>
                  </div>
                  <Link href="/subscriptions">
                    <Button size="sm" variant="outline" className="border-red-300">
                      متابعة
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeStudents} نشط من أصل {stats.totalStudents}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-green-600">
                  +{((stats.activeStudents / stats.totalStudents) * 100).toFixed(0)}% نشط
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/courses">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الكورسات النشطة</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCourses}</div>
              <p className="text-xs text-muted-foreground">
                من أصل {stats.totalCourses} كورس
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-blue-600">
                  {stats.totalCourses - stats.activeCourses} غير نشط
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.monthlyRevenue.toLocaleString()} دينار
              </div>
              <p className="text-xs text-muted-foreground">
                هذا الشهر
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 inline ml-1" />
                  إيجابي
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className={`${stats.netProfit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            {stats.netProfit >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.netProfit.toLocaleString()} دينار
            </div>
            <p className="text-xs text-muted-foreground">
              الإيرادات - المصروفات
            </p>
            <div className="text-xs mt-1">
              <span className="text-green-600">إيرادات: {stats.monthlyRevenue.toLocaleString()}</span>
              <span className="text-red-600 mr-2">مصروفات: {stats.monthlyExpenses.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>النشاطات الأخيرة</CardTitle>
                <Link href="/payments">
                  <Button variant="outline" size="sm">
                    <Eye className="ml-2 h-4 w-4" />
                    عرض الكل
                  </Button>
                </Link>
              </div>
              <CardDescription>
                آخر العمليات والأنشطة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.amount && (
                        <span className="text-sm font-medium">
                          {activity.amount.toLocaleString()} دينار
                        </span>
                      )}
                      {getStatusBadge(activity.status, activity.type)}
                    </div>
                  </div>
                ))}
                
                {recentActivities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد أنشطة حديثة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات السريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/students">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="ml-2 h-4 w-4" />
                  إضافة طالب جديد
                </Button>
              </Link>
              <Link href="/subscriptions">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="ml-2 h-4 w-4" />
                  دفع اشتراكات
                </Button>
              </Link>
              <Link href="/expenses">
                <Button className="w-full justify-start" variant="outline">
                  <Wallet className="ml-2 h-4 w-4" />
                  تسجيل مصروف
                </Button>
              </Link>
              <Link href="/reports">
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="ml-2 h-4 w-4" />
                  عرض التقارير
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>التنبيهات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2">
                        <Bell className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">لا توجد تنبيهات جديدة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
