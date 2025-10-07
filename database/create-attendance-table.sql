-- حذف الجدول إذا كان موجوداً وإنشاؤه من جديد
DROP TABLE IF EXISTS attendance CASCADE;

-- إنشاء جدول تسجيل الحضور
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance_time TIME DEFAULT CURRENT_TIME,
  is_present BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إضافة المراجع للجداول الأخرى إذا كانت موجودة
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        ALTER TABLE attendance ADD CONSTRAINT fk_attendance_student 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        ALTER TABLE attendance ADD CONSTRAINT fk_attendance_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- إنشاء فهارس للاستعلامات السريعة
CREATE INDEX idx_attendance_student_date ON attendance(student_id, attendance_date);
CREATE INDEX idx_attendance_course_date ON attendance(course_id, attendance_date);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

-- إضافة قيد لمنع التسجيل المزدوج
ALTER TABLE attendance ADD CONSTRAINT unique_student_course_date 
UNIQUE (student_id, course_id, attendance_date);

-- إنشاء دالة تحديث الوقت
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE TRIGGER update_attendance_updated_at 
    BEFORE UPDATE ON attendance 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- تفعيل Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات
CREATE POLICY "Enable read access for all users" ON attendance
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON attendance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON attendance
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON attendance
    FOR DELETE USING (true);

-- إدراج بيانات تجريبية (اختياري)
-- INSERT INTO attendance (student_id, course_id, attendance_date, is_present, notes)
-- VALUES 
-- ('student-uuid-here', 'course-uuid-here', CURRENT_DATE, true, 'حاضر اليوم'),
-- ('student-uuid-here', 'course-uuid-here', CURRENT_DATE - INTERVAL '1 day', false, 'غائب أمس');