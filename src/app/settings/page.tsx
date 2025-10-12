'use client'

import { useState, useEffect } from 'react'

// إضافة تعريفات للدوال المخصصة في window
declare global {
  interface Window {
    clearAppCache?: () => void;
    forceUpdateSW?: () => void;
  }
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Bell, 
  Calendar,
  DollarSign,
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle,
  Receipt
} from 'lucide-react'
import Link from 'next/link'
import { 
  getSystemSettings, 
  updateSystemSetting, 
  SystemSetting,
  generateMonthlyReminder,
  getMonthlyReminders,
  MonthlyReminder
} from '@/lib/supabase'

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [reminders, setReminders] = useState<MonthlyReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [copyTemplate, setCopyTemplate] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 5000) // إخفاء الرسالة بعد 5 ثوانٍ
      
      return () => clearTimeout(timer)
    }
  }, [message])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [settingsData, remindersData] = await Promise.all([
        getSystemSettings(),
        getMonthlyReminders()
      ])
      setSettings(settingsData)
      setReminders(remindersData)
      
      // تحديث النموذج المحلي
      const templateSetting = settingsData.find(s => s.setting_key === 'copy_student_template')
      setCopyTemplate(templateSetting?.setting_value || 'الطالب: {student_name}\nالمتطلبات المالية: {amount} دينار\nرقم ولي الأمر: {guardian_phone}\nالكورسات: {courses}')
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage({type: 'error', text: 'حدث خطأ في تحميل البيانات'})
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = async (key: string, value: string) => {
    try {
      setSaving(true)
      await updateSystemSetting(key, value)
      
      setSettings(prev => prev.map(setting => 
        setting.setting_key === key 
          ? { ...setting, setting_value: value }
          : setting
      ))
      
      setMessage({type: 'success', text: 'تم حفظ الإعدادات بنجاح'})
    } catch (error) {
      console.error('Error updating setting:', error)
      setMessage({type: 'error', text: 'حدث خطأ في حفظ الإعدادات'})
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateReminder = async () => {
    try {
      setSaving(true)
      const result = await generateMonthlyReminder()
      await fetchData() // إعادة تحميل البيانات
      setMessage({
        type: 'success', 
        text: `تم إنشاء التذكير الشهري بنجاح! ${result?.total_students} طالب بإجمالي ${result?.total_amount} دينار`
      })
    } catch (error) {
      console.error('Error generating reminder:', error)
      setMessage({type: 'error', text: 'حدث خطأ في إنشاء التذكير'})
    } finally {
      setSaving(false)
    }
  }

  const getSetting = (key: string) => {
    return settings.find(s => s.setting_key === key)?.setting_value || ''
  }

  const updateSettingValue = (key: string, value: string) => {
    setSettings(prev => prev.map(setting => 
      setting.setting_key === key 
        ? { ...setting, setting_value: value }
        : setting
    ))
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      
      // حفظ جميع الإعدادات
      const invoiceSettings = [
        'academy_name', 'academy_phone', 'academy_email', 'academy_address',
        'academy_logo', 'receipt_footer_text', 'currency_symbol', 'receipt_prefix'
      ]
      
      for (const key of invoiceSettings) {
        const setting = settings.find(s => s.setting_key === key)
        if (setting) {
          await updateSystemSetting(key, setting.setting_value)
        }
      }
      
      setMessage({type: 'success', text: '✅ تم حفظ إعدادات الفواتير بنجاح!'})
    } catch (error) {
      console.error('Error saving invoice settings:', error)
      setMessage({type: 'error', text: '❌ فشل في حفظ الإعدادات. يرجى المحاولة مرة أخرى.'})
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCopyTemplate = async () => {
    try {
      setSaving(true)
      await updateSystemSetting('copy_student_template', copyTemplate)
      
      setSettings(prev => prev.map(setting => 
        setting.setting_key === 'copy_student_template' 
          ? { ...setting, setting_value: copyTemplate }
          : setting
      ))
      
      setMessage({type: 'success', text: '✅ تم حفظ نموذج النسخ بنجاح! يمكنك الآن استخدامه في صفحة الطلاب.'})
    } catch (error) {
      console.error('Error saving copy template:', error)
      setMessage({type: 'error', text: '❌ حدث خطأ في حفظ النموذج. يرجى المحاولة مرة أخرى.'})
    } finally {
      setSaving(false)
    }
  }

  const resetCopyTemplate = () => {
    const defaultTemplate = 'الطالب: {student_name}\nالمتطلبات المالية: {amount} دينار\nرقم ولي الأمر: {guardian_phone}\nالكورسات: {courses}'
    setCopyTemplate(defaultTemplate)
  }

  const hasTemplateChanged = () => {
    const currentSavedTemplate = getSetting('copy_student_template') || 'الطالب: {student_name}\nالمتطلبات المالية: {amount} دينار\nرقم ولي الأمر: {guardian_phone}\nالكورسات: {courses}'
    return copyTemplate !== currentSavedTemplate
  }

  const formatReminderDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800">معلق</Badge>
      case 'sent':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">تم الإرسال</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">مكتمل</Badge>
      default:
        return <Badge variant="secondary">غير محدد</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xl text-slate-600">جاري تحميل الإعدادات...</p>
        </div>
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
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              إعدادات النظام
            </h1>
            <p className="text-slate-600 text-lg">
              إدارة إعدادات النظام والتذكيرات الشهرية
            </p>
          </div>
        </div>
        
        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? 
              <CheckCircle className="h-4 w-4" /> : 
              <AlertCircle className="h-4 w-4" />
            }
            {message.text}
          </div>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">الإعدادات العامة</TabsTrigger>
          <TabsTrigger value="invoices">إعدادات الفواتير</TabsTrigger>
          <TabsTrigger value="reminders">التذكيرات الشهرية</TabsTrigger>
          <TabsTrigger value="payments">إعدادات المدفوعات</TabsTrigger>
        </TabsList>

        {/* الإعدادات العامة */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                معلومات الأكاديمية
              </CardTitle>
              <CardDescription>
                إعدادات عامة للأكاديمية ومعلومات الاتصال
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academy_name">اسم الأكاديمية</Label>
                  <Input
                    id="academy_name"
                    value={getSetting('academy_name')}
                    onChange={(e) => handleSettingChange('academy_name', e.target.value)}
                    placeholder="اسم الأكاديمية"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">رقم الهاتف</Label>
                  <Input
                    id="contact_phone"
                    value={getSetting('contact_phone')}
                    onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                    placeholder="05xxxxxxxx"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="contact_email">البريد الإلكتروني</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={getSetting('contact_email')}
                    onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                    placeholder="info@academy.com"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="copy_student_template">نموذج نسخ بيانات الطالب</Label>
                    {hasTemplateChanged() && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-600">
                        تغييرات غير محفوظة
                      </Badge>
                    )}
                  </div>
                  <textarea
                    id="copy_student_template"
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={copyTemplate}
                    onChange={(e) => setCopyTemplate(e.target.value)}
                    placeholder="أدخل نموذج النص الذي سيتم نسخه"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      استخدم: {'{student_name}'} للاسم، {'{amount}'} للمبلغ، {'{guardian_phone}'} لرقم ولي الأمر، {'{courses}'} للكورسات
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={resetCopyTemplate}
                        disabled={saving}
                      >
                        إعادة تعيين
                      </Button>
                      <Button 
                        size="sm" 
                        variant={hasTemplateChanged() ? "default" : "outline"}
                        onClick={handleSaveCopyTemplate}
                        disabled={saving || !hasTemplateChanged()}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                        حفظ النموذج
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات الفواتير */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                إعدادات الفواتير والإيصالات
              </CardTitle>
              <CardDescription>
                تخصيص معلومات الأكاديمية التي ستظهر في الفواتير والإيصالات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>اسم الأكاديمية</Label>
                  <Input
                    value={getSetting('academy_name')}
                    onChange={(e) => updateSettingValue('academy_name', e.target.value)}
                    placeholder="أكاديمية بساط العلم"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={getSetting('academy_phone')}
                    onChange={(e) => updateSettingValue('academy_phone', e.target.value)}
                    placeholder="+962-XX-XXXX-XXX"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={getSetting('academy_email')}
                    onChange={(e) => updateSettingValue('academy_email', e.target.value)}
                    placeholder="info@academy.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Input
                    value={getSetting('currency_symbol')}
                    onChange={(e) => updateSettingValue('currency_symbol', e.target.value)}
                    placeholder="دينار"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>عنوان الأكاديمية</Label>
                <Input
                  value={getSetting('academy_address')}
                  onChange={(e) => updateSettingValue('academy_address', e.target.value)}
                  placeholder="أدخل العنوان الكامل للأكاديمية"
                />
              </div>
              
              <div className="space-y-2">
                <Label>رابط الشعار (اختياري)</Label>
                <Input
                  value={getSetting('academy_logo')}
                  onChange={(e) => updateSettingValue('academy_logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div className="space-y-2">
                <Label>نص أسفل الإيصال</Label>
                <Input
                  value={getSetting('receipt_footer_text')}
                  onChange={(e) => updateSettingValue('receipt_footer_text', e.target.value)}
                  placeholder="نشكركم لثقتكم بنا"
                />
              </div>
              
              <div className="space-y-2">
                <Label>بادئة رقم الإيصال</Label>
                <Input
                  value={getSetting('receipt_prefix')}
                  onChange={(e) => updateSettingValue('receipt_prefix', e.target.value)}
                  placeholder="INV"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  حفظ إعدادات الفواتير
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* إدارة الـ Cache والذاكرة المؤقتة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إدارة الذاكرة المؤقتة (Cache)
              </CardTitle>
              <CardDescription>
                إدارة ذاكرة التخزين المؤقت لتحسين أداء الموقع وحل مشاكل التحديث
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">ما هي الذاكرة المؤقتة؟</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      الذاكرة المؤقتة تحفظ نسخاً من الصفحات والبيانات لتسريع تحميل الموقع، لكنها قد تسبب عرض محتوى قديم.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.clearAppCache) {
                      if (confirm('سيتم مسح جميع البيانات المحفوظة مؤقتاً وإعادة تحميل الصفحة. هل تريد المتابعة؟')) {
                        window.clearAppCache();
                      }
                    } else {
                      alert('مسح الذاكرة المؤقتة غير متاح حالياً');
                    }
                  }}
                  className="gap-2 w-full"
                >
                  <Receipt className="h-4 w-4" />
                  مسح الذاكرة المؤقتة
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.forceUpdateSW) {
                      window.forceUpdateSW();
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="gap-2 w-full"
                >
                  <CheckCircle className="h-4 w-4" />
                  تحديث الموقع
                </Button>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>متى تستخدم هذه الأدوات:</strong></p>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>عند عدم ظهور التحديثات الجديدة</li>
                  <li>عند مواجهة مشاكل في تحميل الصفحات</li>
                  <li>عند ظهور بيانات قديمة أو خاطئة</li>
                  <li>عند تغيير إعدادات مهمة في النظام</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التذكيرات الشهرية */}
        <TabsContent value="reminders">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  إعدادات التذكير الشهري
                </CardTitle>
                <CardDescription>
                  تخصيص إعدادات التذكير للمدفوعات المستحقة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_reminder_enabled">حالة التذكير</Label>
                    <Select 
                      value={getSetting('monthly_reminder_enabled')}
                      onValueChange={(value) => handleSettingChange('monthly_reminder_enabled', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">مفعل</SelectItem>
                        <SelectItem value="false">معطل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="monthly_reminder_day">يوم التذكير (من الشهر)</Label>
                    <Select 
                      value={getSetting('monthly_reminder_day')}
                      onValueChange={(value) => handleSettingChange('monthly_reminder_day', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="monthly_reminder_time">وقت التذكير</Label>
                    <Input
                      id="monthly_reminder_time"
                      type="time"
                      value={getSetting('monthly_reminder_time')}
                      onChange={(e) => handleSettingChange('monthly_reminder_time', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="font-medium">إنشاء تذكير فوري</p>
                    <p className="text-sm text-gray-600">إنشاء تذكير للمدفوعات المستحقة الآن</p>
                  </div>
                  <Button 
                    onClick={handleGenerateReminder}
                    disabled={saving}
                    className="gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                    إنشاء تذكير
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* قائمة التذكيرات */}
            <Card>
              <CardHeader>
                <CardTitle>التذكيرات السابقة</CardTitle>
                <CardDescription>
                  سجل التذكيرات الشهرية التي تم إنشاؤها
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reminders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>لا توجد تذكيرات</p>
                    </div>
                  ) : (
                    reminders.map((reminder) => (
                      <div key={reminder.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{reminder.title}</h4>
                          <p className="text-sm text-gray-600">{reminder.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatReminderDate(reminder.reminder_date)} - 
                            {reminder.total_students} طالب - 
                            {reminder.total_amount.toLocaleString()} دينار
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(reminder.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* إعدادات المدفوعات */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                إعدادات المدفوعات والغرامات
              </CardTitle>
              <CardDescription>
                تخصيص إعدادات المدفوعات وفترات السماح
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_grace_period">فترة السماح (بالأيام)</Label>
                  <Input
                    id="default_grace_period"
                    type="number"
                    min="0"
                    max="30"
                    value={getSetting('default_grace_period')}
                    onChange={(e) => handleSettingChange('default_grace_period', e.target.value)}
                    placeholder="7"
                  />
                  <p className="text-xs text-gray-600">
                    عدد الأيام المسموحة بعد تاريخ الاستحقاق قبل اعتبار الدفعة متأخرة
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="late_payment_penalty">غرامة التأخير (دينار)</Label>
                  <Input
                    id="late_payment_penalty"
                    type="number"
                    min="0"
                    step="0.01"
                    value={getSetting('late_payment_penalty')}
                    onChange={(e) => handleSettingChange('late_payment_penalty', e.target.value)}
                    placeholder="50"
                  />
                  <p className="text-xs text-gray-600">
                    المبلغ المضاف كغرامة عن كل شهر تأخير
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
