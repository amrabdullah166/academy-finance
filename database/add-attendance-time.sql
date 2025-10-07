-- إضافة العمود attendance_time إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
        AND column_name = 'attendance_time'
    ) THEN
        ALTER TABLE attendance ADD COLUMN attendance_time TIME DEFAULT CURRENT_TIME;
    END IF;
END $$;

-- تحديث السجلات الموجودة لتحتوي على وقت افتراضي
UPDATE attendance SET attendance_time = CURRENT_TIME WHERE attendance_time IS NULL;
