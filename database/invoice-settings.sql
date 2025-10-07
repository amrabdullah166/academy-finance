-- إضافة إعدادات الأكاديمية للفواتير
-- Adding Academy Settings for Invoices

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('academy_name', 'أكاديمية بساط العلم', 'string', 'اسم الأكاديمية الذي سيظهر في الفواتير'),
('academy_address', 'العنوان: [أدخل عنوان الأكاديمية هنا]', 'string', 'عنوان الأكاديمية الذي سيظهر في الفواتير'),
('academy_phone', '+962-XX-XXXX-XXX', 'string', 'رقم هاتف الأكاديمية للتواصل'),
('academy_email', 'info@academy.com', 'string', 'البريد الإلكتروني للأكاديمية'),
('academy_logo', '', 'string', 'رابط شعار الأكاديمية (اختياري)'),
('receipt_footer_text', 'نشكركم لثقتكم بنا', 'string', 'النص الذي يظهر في أسفل الإيصال'),
('currency_symbol', 'دينار', 'string', 'رمز العملة المستخدمة'),
('receipt_prefix', 'INV', 'string', 'بادئة رقم الإيصال')
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description;