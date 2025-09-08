-- إصلاح وتحديث الميزات الجديدة للنظام
-- هذا السكريپت يحل مشاكل الإصدار السابق

-- ===== 1. إضافة العمود المفقود إذا لم يكن موجوداً =====
DO $$ 
BEGIN 
    -- إضافة updated_at إلى monthly_reminders إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'monthly_reminders' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE monthly_reminders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ===== 2. تصحيح دالة إنشاء التذكير الشهري =====
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
    DELETE FROM reminder_details WHERE reminder_id = current_reminder_id;
    
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

-- ===== 3. إنشاء دالة بديلة للحصول على إحصائيات المدفوعات =====
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

-- ===== 4. إضافة Triggers للتحديث التلقائي =====
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

-- ===== 5. اختبار النظام =====
-- تشغيل دالة إنشاء التذكير المحدثة
SELECT * FROM generate_monthly_reminder();

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
