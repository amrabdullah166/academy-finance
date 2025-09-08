-- سكريپت شامل لإنشاء جميع الميزات الجديدة من الصفر
-- هذا السكريپت يعمل حتى لو لم تكن الجداول موجودة

-- ===== 1. إنشاء جدول الإعدادات العامة =====
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, date
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج الإعدادات الافتراضية
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
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

-- ===== 2. إنشاء جدول التذكيرات الشهرية =====
CREATE TABLE IF NOT EXISTS monthly_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_date DATE NOT NULL,
    reminder_type VARCHAR(50) DEFAULT 'payment_due', -- payment_due, late_payment, general
    title VARCHAR(200) NOT NULL,
    description TEXT,
    total_students INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(reminder_date, reminder_type)
);

-- ===== 3. إنشاء جدول تفاصيل التذكيرات للطلاب =====
CREATE TABLE IF NOT EXISTS reminder_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id UUID REFERENCES monthly_reminders(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    due_amount DECIMAL(10,2) NOT NULL,
    months_overdue INTEGER DEFAULT 0,
    penalty_amount DECIMAL(10,2) DEFAULT 0,
    last_payment_date DATE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(reminder_id, student_id, course_id)
);

-- ===== 4. إنشاء فيو للمدفوعات المستحقة =====
CREATE OR REPLACE VIEW student_payment_status AS
WITH monthly_dues AS (
    -- حساب المدفوعات المستحقة لكل طالب لكل شهر
    SELECT 
        sc.student_id,
        sc.course_id,
        s.name as student_name,
        s.phone as student_phone,
        c.name as course_name,
        c.monthly_fee,
        sc.enrollment_date,
        
        -- حساب عدد الأشهر من تاريخ التسجيل حتى الآن
        EXTRACT(YEAR FROM age(CURRENT_DATE, sc.enrollment_date)) * 12 + 
        EXTRACT(MONTH FROM age(CURRENT_DATE, sc.enrollment_date)) + 1 AS months_enrolled,
        
        -- المبلغ الإجمالي المطلوب
        (EXTRACT(YEAR FROM age(CURRENT_DATE, sc.enrollment_date)) * 12 + 
         EXTRACT(MONTH FROM age(CURRENT_DATE, sc.enrollment_date)) + 1) * c.monthly_fee AS total_due_amount
        
    FROM student_courses sc
    JOIN students s ON sc.student_id = s.id
    JOIN courses c ON sc.course_id = c.id
    WHERE sc.status = 'enrolled' 
    AND s.status = 'active'
    AND c.status = 'active'
),
payments_made AS (
    -- حساب إجمالي المدفوعات لكل طالب في كل كورس
    SELECT 
        student_id,
        course_id,
        COALESCE(SUM(amount), 0) as total_paid
    FROM payments 
    WHERE status = 'completed' 
    AND payment_method = 'monthly_fee'
    GROUP BY student_id, course_id
)
SELECT 
    md.*,
    COALESCE(pm.total_paid, 0) as total_paid,
    (md.total_due_amount - COALESCE(pm.total_paid, 0)) as remaining_amount,
    
    -- حساب عدد الأشهر المتأخرة
    CASE 
        WHEN (md.total_due_amount - COALESCE(pm.total_paid, 0)) <= 0 THEN 0
        ELSE CEIL((md.total_due_amount - COALESCE(pm.total_paid, 0)) / md.monthly_fee)
    END as months_overdue,
    
    -- حالة الدفع
    CASE 
        WHEN (md.total_due_amount - COALESCE(pm.total_paid, 0)) <= 0 THEN 'paid_up'
        WHEN (md.total_due_amount - COALESCE(pm.total_paid, 0)) <= md.monthly_fee THEN 'current_month_due'
        ELSE 'overdue'
    END as payment_status,
    
    -- آخر دفعة
    (SELECT MAX(payment_date) FROM payments p 
     WHERE p.student_id = md.student_id 
     AND p.course_id = md.course_id 
     AND p.status = 'completed'
     AND p.payment_method = 'monthly_fee') as last_payment_date
     
FROM monthly_dues md
LEFT JOIN payments_made pm ON md.student_id = pm.student_id AND md.course_id = pm.course_id
ORDER BY remaining_amount DESC, student_name;

-- ===== 5. دالة لإنشاء التذكير الشهري =====
CREATE OR REPLACE FUNCTION generate_monthly_reminder()
RETURNS TABLE (
    reminder_id UUID,
    total_students INTEGER,
    total_amount DECIMAL(10,2)
) AS $$
DECLARE
    current_reminder_id UUID;
    reminder_title VARCHAR(200);
    reminder_desc TEXT;
    students_count INTEGER;
    total_due DECIMAL(10,2);
BEGIN
    -- إنشاء عنوان ووصف التذكير
    reminder_title := 'تذكير مدفوعات شهر ' || TO_CHAR(CURRENT_DATE, 'MM/YYYY');
    reminder_desc := 'قائمة بالطلاب الذين عليهم مدفوعات مستحقة لشهر ' || TO_CHAR(CURRENT_DATE, 'Month YYYY');
    
    -- حساب إجمالي الطلاب والمبالغ المستحقة
    SELECT 
        COUNT(DISTINCT sps.student_id),
        SUM(sps.remaining_amount)
    INTO students_count, total_due
    FROM student_payment_status sps
    WHERE sps.remaining_amount > 0;
    
    -- التحقق من وجود تذكير لنفس التاريخ
    SELECT id INTO current_reminder_id
    FROM monthly_reminders 
    WHERE reminder_date = CURRENT_DATE 
    AND reminder_type = 'payment_due';
    
    -- إذا وُجد تذكير، قم بتحديثه
    IF current_reminder_id IS NOT NULL THEN
        UPDATE monthly_reminders SET
            total_students = students_count,
            total_amount = COALESCE(total_due, 0),
            updated_at = NOW()
        WHERE id = current_reminder_id;
    ELSE
        -- إنشاء تذكير جديد
        INSERT INTO monthly_reminders (
            reminder_date, 
            reminder_type,
            title, 
            description, 
            total_students, 
            total_amount,
            status
        ) VALUES (
            CURRENT_DATE,
            'payment_due',
            reminder_title,
            reminder_desc,
            students_count,
            COALESCE(total_due, 0),
            'pending'
        ) 
        RETURNING id INTO current_reminder_id;
    END IF;
    
    -- حذف التفاصيل القديمة وإضافة الجديدة
    DELETE FROM reminder_details WHERE reminder_details.reminder_id = current_reminder_id;
    
    -- إضافة تفاصيل التذكير
    INSERT INTO reminder_details (
        reminder_id,
        student_id,
        course_id,
        due_amount,
        months_overdue,
        penalty_amount,
        last_payment_date,
        status
    )
    SELECT 
        current_reminder_id,
        sps.student_id,
        sps.course_id,
        sps.remaining_amount,
        sps.months_overdue,
        CASE 
            WHEN sps.months_overdue > 0 THEN 
                COALESCE((SELECT CAST(setting_value AS DECIMAL) FROM system_settings WHERE setting_key = 'late_payment_penalty'), 50) * sps.months_overdue
            ELSE 0
        END,
        sps.last_payment_date,
        CASE 
            WHEN sps.remaining_amount <= 0 THEN 'paid'
            WHEN sps.months_overdue > 0 THEN 'overdue'
            ELSE 'pending'
        END
    FROM student_payment_status sps
    WHERE sps.remaining_amount > 0;
    
    RETURN QUERY 
    SELECT current_reminder_id, students_count, COALESCE(total_due, 0);
END;
$$ LANGUAGE plpgsql;

-- ===== 6. دالة للحصول على إحصائيات المدفوعات =====
CREATE OR REPLACE FUNCTION get_payment_statistics_simple()
RETURNS TABLE (
    total_students_with_dues BIGINT,
    total_outstanding_amount DECIMAL(10,2),
    students_current_month BIGINT,
    students_overdue BIGINT,
    average_months_overdue DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT student_id) FROM student_payment_status WHERE remaining_amount > 0),
        (SELECT COALESCE(SUM(remaining_amount), 0) FROM student_payment_status WHERE remaining_amount > 0),
        (SELECT COUNT(DISTINCT student_id) FROM student_payment_status WHERE payment_status = 'current_month_due'),
        (SELECT COUNT(DISTINCT student_id) FROM student_payment_status WHERE payment_status = 'overdue'),
        (SELECT COALESCE(AVG(months_overdue), 0) FROM student_payment_status WHERE months_overdue > 0);
END;
$$ LANGUAGE plpgsql;

-- ===== 7. إضافة فهارس للأداء =====
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_monthly_reminders_date ON monthly_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_monthly_reminders_status ON monthly_reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminder_details_reminder ON reminder_details(reminder_id);
CREATE INDEX IF NOT EXISTS idx_reminder_details_student ON reminder_details(student_id);
CREATE INDEX IF NOT EXISTS idx_reminder_details_status ON reminder_details(status);

-- ===== 8. إضافة Triggers للتحديث التلقائي =====
-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (إنشاؤها بأمان)
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monthly_reminders_updated_at ON monthly_reminders;
CREATE TRIGGER update_monthly_reminders_updated_at 
    BEFORE UPDATE ON monthly_reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 9. تحديث الـ RLS Policies =====
-- سياسات الأمان للجداول الجديدة
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_details ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات للقراءة والكتابة (مؤقتاً مفتوحة للجميع - يمكن تخصيصها حسب المطلوب)
DO $$ 
BEGIN
    -- سياسات system_settings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Enable read access for all users') THEN
        CREATE POLICY "Enable read access for all users" ON system_settings FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Enable all access for all users') THEN
        CREATE POLICY "Enable all access for all users" ON system_settings FOR ALL USING (true);
    END IF;

    -- سياسات monthly_reminders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_reminders' AND policyname = 'Enable read access for all users') THEN
        CREATE POLICY "Enable read access for all users" ON monthly_reminders FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_reminders' AND policyname = 'Enable all access for all users') THEN
        CREATE POLICY "Enable all access for all users" ON monthly_reminders FOR ALL USING (true);
    END IF;

    -- سياسات reminder_details
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminder_details' AND policyname = 'Enable read access for all users') THEN
        CREATE POLICY "Enable read access for all users" ON reminder_details FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminder_details' AND policyname = 'Enable all access for all users') THEN
        CREATE POLICY "Enable all access for all users" ON reminder_details FOR ALL USING (true);
    END IF;
END $$;

-- ===== 10. اختبار النظام =====
-- عرض الجداول المنشأة
SELECT 
    table_name,
    CASE WHEN table_type = 'BASE TABLE' THEN 'جدول' ELSE 'عرض' END as type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('system_settings', 'monthly_reminders', 'reminder_details', 'student_payment_status')
ORDER BY table_name;

-- تشغيل دالة إنشاء التذكير
SELECT 
    reminder_id,
    total_students,
    total_amount
FROM generate_monthly_reminder();

-- اختبار دالة الإحصائيات
SELECT * FROM get_payment_statistics_simple();

-- عرض آخر تذكير تم إنشاؤه
SELECT 
    id,
    reminder_date,
    title,
    total_students,
    total_amount,
    status,
    created_at
FROM monthly_reminders 
ORDER BY created_at DESC 
LIMIT 1;

-- إضافة تعليقات للجداول
COMMENT ON TABLE system_settings IS 'جدول الإعدادات العامة للنظام';
COMMENT ON TABLE monthly_reminders IS 'جدول التذكيرات الشهرية للمدفوعات';
COMMENT ON TABLE reminder_details IS 'تفاصيل التذكيرات لكل طالب';
COMMENT ON VIEW student_payment_status IS 'عرض حالة المدفوعات لكل طالب';
COMMENT ON FUNCTION generate_monthly_reminder() IS 'دالة لإنشاء التذكير الشهري للمدفوعات';
COMMENT ON FUNCTION get_payment_statistics_simple() IS 'دالة للحصول على إحصائيات المدفوعات';
