-- إضافة البيانات الجديدة لجدول system_settings الموجود
-- تشغيل هذا الكود في Supabase SQL Editor

-- إضافة إعداد نموذج نسخ بيانات الطالب
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description) VALUES
('copy_student_template', 'الطالب: {student_name}
المتطلبات المالية: {amount} دينار
رقم ولي الأمر: {guardian_phone}
الكورسات: {courses}', 'string', 'نموذج نسخ بيانات الطالب')
ON CONFLICT (setting_key) DO NOTHING;

-- التحقق من أن البيانات تمت إضافتها بنجاح
SELECT * FROM public.system_settings WHERE setting_key = 'copy_student_template';
