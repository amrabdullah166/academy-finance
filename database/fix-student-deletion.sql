-- إصلاح مشكلة حذف الطلاب - إضافة CASCADE للقيود الخارجية
-- Fix student deletion issue - Add CASCADE to foreign key constraints

-- 1. حذف القيد الحالي في جدول monthly_subscriptions
ALTER TABLE monthly_subscriptions 
DROP CONSTRAINT IF EXISTS monthly_subscriptions_payment_id_fkey;

-- 2. إعادة إضافة القيد مع ON DELETE SET NULL لأن payment_id اختياري
ALTER TABLE monthly_subscriptions 
ADD CONSTRAINT monthly_subscriptions_payment_id_fkey 
FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- 3. التحقق من باقي الجداول التي قد تحتوي على مراجع للطلاب
-- للتأكد من أن جميع القيود تحتوي على CASCADE

-- جدول الحضور
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;

ALTER TABLE attendance 
ADD CONSTRAINT attendance_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- جدول الإشعارات (إذا كان يحتوي على student_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'student_id') THEN
        ALTER TABLE notifications 
        DROP CONSTRAINT IF EXISTS notifications_student_id_fkey;
        
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
    END IF;
END $$;

-- إضافة فهرس لتحسين الأداء عند حذف الطلاب
CREATE INDEX IF NOT EXISTS idx_monthly_subscriptions_student_id ON monthly_subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_monthly_subscriptions_payment_id ON monthly_subscriptions(payment_id);

-- إنشاء دالة لحذف الطالب مع جميع البيانات المرتبطة به
CREATE OR REPLACE FUNCTION delete_student_cascade(student_uuid UUID)
RETURNS JSON AS $$
DECLARE
    deleted_reminders INTEGER := 0;
    deleted_subscriptions INTEGER := 0;
    deleted_payments INTEGER := 0;
    deleted_enrollments INTEGER := 0;
    student_name VARCHAR(255);
    result JSON;
BEGIN
    -- التحقق من وجود الطالب
    SELECT name INTO student_name FROM students WHERE id = student_uuid;
    
    IF student_name IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'الطالب غير موجود');
    END IF;
    
    -- حذف تفاصيل التذكيرات
    DELETE FROM reminder_details WHERE student_id = student_uuid;
    GET DIAGNOSTICS deleted_reminders = ROW_COUNT;
    
    -- حذف الاشتراكات الشهرية
    DELETE FROM monthly_subscriptions WHERE student_id = student_uuid;
    GET DIAGNOSTICS deleted_subscriptions = ROW_COUNT;
    
    -- حذف المدفوعات
    DELETE FROM payments WHERE student_id = student_uuid;
    GET DIAGNOSTICS deleted_payments = ROW_COUNT;
    
    -- حذف تسجيل الطلاب في الكورسات
    DELETE FROM student_courses WHERE student_id = student_uuid;
    GET DIAGNOSTICS deleted_enrollments = ROW_COUNT;
    
    -- حذف الطالب
    DELETE FROM students WHERE id = student_uuid;
    
    -- إنشاء النتيجة
    result := json_build_object(
        'success', true,
        'student_name', student_name,
        'deletedReminders', deleted_reminders,
        'deletedSubscriptions', deleted_subscriptions,
        'deletedPayments', deleted_payments,
        'deletedEnrollments', deleted_enrollments
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;