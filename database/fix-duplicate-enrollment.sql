-- حل مشكلة عدم إمكانية إعادة تسجيل طالب في دورة
-- السبب: القيد UNIQUE(student_id, course_id) يمنع التسجيل المكرر حتى لو كان status مختلف

-- الحل 1: استبدال القيد القديم بقيد جديد يسمح بإعادة التسجيل للطلاب المنسحبين
BEGIN;

-- 1. حذف القيد القديم
ALTER TABLE student_courses 
DROP CONSTRAINT IF EXISTS student_courses_student_id_course_id_key;

-- 2. إضافة قيد جديد يسمح بطالب واحد فقط "نشط" في كل دورة
-- (يمكن أن يكون له عدة سجلات dropped/completed ولكن enrolled واحد فقط)
CREATE UNIQUE INDEX unique_active_enrollment 
ON student_courses (student_id, course_id) 
WHERE status = 'enrolled';

-- 3. إضافة فهرس للاستعلامات السريعة
CREATE INDEX IF NOT EXISTS idx_student_courses_status 
ON student_courses (student_id, course_id, status);

COMMIT;

-- الآن يمكن:
-- ✅ تسجيل طالب في دورة (status = 'enrolled')
-- ✅ إنهاء تسجيله (status = 'completed' أو 'dropped')  
-- ✅ إعادة تسجيله مرة أخرى (status = 'enrolled' جديد)
-- ❌ منع تسجيل طالب في نفس الدورة مرتين في نفس الوقت

-- مثال للاستخدام:
-- INSERT INTO student_courses (student_id, course_id, status) VALUES ('student1', 'course1', 'enrolled');  -- ✅
-- UPDATE student_courses SET status = 'dropped' WHERE id = 'enrollment1';  -- ✅
-- INSERT INTO student_courses (student_id, course_id, status) VALUES ('student1', 'course1', 'enrolled');  -- ✅ الآن يعمل!