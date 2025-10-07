-- إنشاء جدول تسجيل الحضور
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance_time TIME NOT NULL DEFAULT CURRENT_TIME,
  is_present BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إنشاء فهرس للاستعلامات السريعة
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_course_date ON attendance(course_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- إضافة قيود لمنع التسجيل المزدوج لنفس الطالب في نفس اليوم والكورس
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_student_course_date'
    ) THEN
        ALTER TABLE attendance ADD CONSTRAINT unique_student_course_date 
        UNIQUE (student_id, course_id, attendance_date);
    END IF;
END $$;

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- حذف الـ trigger إن وجد وإنشاؤه من جديد
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at 
    BEFORE UPDATE ON attendance 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- إضافة policy للأمان (RLS)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة مسبقاً إن وجدت
DROP POLICY IF EXISTS "Enable read access for all users" ON attendance;
DROP POLICY IF EXISTS "Enable insert for all users" ON attendance;
DROP POLICY IF EXISTS "Enable update for all users" ON attendance;
DROP POLICY IF EXISTS "Enable delete for all users" ON attendance;

-- إنشاء السياسات من جديد
CREATE POLICY "Enable read access for all users" ON attendance
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON attendance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON attendance
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON attendance
    FOR DELETE USING (true);