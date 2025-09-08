-- SQL لإنشاء جدول system_settings في Supabase
-- يتم تشغيل هذا الكود في Supabase SQL Editor

-- إنشاء جدول الإعدادات العامة
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key character varying(100) NOT NULL,
  setting_value text NULL,
  setting_type character varying(50) NULL DEFAULT 'string'::character varying,
  description text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id),
  CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key)
) TABLESPACE pg_default;

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_system_settings_key 
ON public.system_settings 
USING btree (setting_key) 
TABLESPACE pg_default;

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE TRIGGER update_system_settings_updated_at 
BEFORE UPDATE ON system_settings 
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- إدراج الإعدادات الافتراضية
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description) VALUES
('monthly_reminder_enabled', 'true', 'boolean', 'تفعيل التذكير الشهري للمدفوعات'),
('monthly_reminder_day', '1', 'number', 'يوم الشهر للتذكير (1-28)'),
('monthly_reminder_time', '09:00', 'string', 'وقت التذكير (HH:MM)'),
('default_grace_period', '7', 'number', 'فترة السماح بالأيام قبل اعتبار الدفعة متأخرة'),
('late_payment_penalty', '50', 'number', 'غرامة التأخير بالريال'),
('academy_name', 'بساط العلم', 'string', 'اسم الأكاديمية'),
('contact_phone', '', 'string', 'رقم هاتف الأكاديمية'),
('contact_email', '', 'string', 'بريد الأكاديمية الإلكتروني'),
('copy_student_template', 'الطالب: {student_name}
المتطلبات المالية: {amount} دينار
رقم ولي الأمر: {guardian_phone}
الكورسات: {courses}', 'string', 'نموذج نسخ بيانات الطالب')
ON CONFLICT (setting_key) DO NOTHING;

-- تفعيل Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء policies للأمان
CREATE POLICY "Allow read access to system_settings" ON public.system_settings
FOR SELECT USING (true);

CREATE POLICY "Allow update access to system_settings" ON public.system_settings
FOR UPDATE USING (true);

CREATE POLICY "Allow insert access to system_settings" ON public.system_settings
FOR INSERT WITH CHECK (true);

-- ملاحظات:
-- 1. هذا الجدول يحفظ جميع إعدادات النظام
-- 2. setting_key هو المفتاح الفريد لكل إعداد
-- 3. setting_value يحفظ القيمة كنص
-- 4. setting_type يحدد نوع البيانات (string, number, boolean, date)
-- 5. يتم تحديث updated_at تلقائياً عند أي تعديل
