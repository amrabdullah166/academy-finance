-- ═══════════════════════════════════════════════════════════
--  فحص قاعدة البيانات للبحث عن سجلات بـ ID فاضي
-- ═══════════════════════════════════════════════════════════
-- نفذ هذا الكود في Supabase Dashboard → SQL Editor

-- 1️⃣ فحص جدول الطلاب
SELECT 'طلاب' as الجدول, 
       COUNT(*) as "عدد السجلات الفاضية",
       ARRAY_AGG(name) as "أسماء الطلاب"
FROM students
WHERE id IS NULL OR id = '' OR id ~ '^\s*$';

-- 2️⃣ فحص جدول الكورسات
SELECT 'كورسات' as الجدول,
       COUNT(*) as "عدد السجلات الفاضية",
       ARRAY_AGG(name) as "أسماء الكورسات"
FROM courses
WHERE id IS NULL OR id = '' OR id ~ '^\s*$';

-- 3️⃣ فحص جدول الاشتراكات
SELECT 'اشتراكات' as الجدول,
       COUNT(*) as "عدد السجلات الفاضية"
FROM student_courses
WHERE id IS NULL OR id = '' OR id ~ '^\s*$';

-- ═══════════════════════════════════════════════════════════
--  إذا طلع عندك سجلات فاضية، احذفها بهذا الكود:
-- ═══════════════════════════════════════════════════════════
-- ⚠️ تحذير: هذا الكود راح يحذف السجلات نهائياً!

-- -- حذف الطلاب بـ ID فاضي
-- DELETE FROM students 
-- WHERE id IS NULL OR id = '' OR id ~ '^\s*$';

-- -- حذف الكورسات بـ ID فاضي
-- DELETE FROM courses 
-- WHERE id IS NULL OR id = '' OR id ~ '^\s*$';

-- -- حذف الاشتراكات بـ ID فاضي
-- DELETE FROM student_courses 
-- WHERE id IS NULL OR id = '' OR id ~ '^\s*$';

-- ═══════════════════════════════════════════════════════════
--  منع المشكلة من الحدوث مستقبلاً
-- ═══════════════════════════════════════════════════════════

-- إضافة قيود على الجداول لمنع IDs الفاضية:
ALTER TABLE students 
  DROP CONSTRAINT IF EXISTS students_id_not_empty,
  ADD CONSTRAINT students_id_not_empty 
    CHECK (id IS NOT NULL AND id <> '' AND id !~ '^\s*$');

ALTER TABLE courses 
  DROP CONSTRAINT IF EXISTS courses_id_not_empty,
  ADD CONSTRAINT courses_id_not_empty 
    CHECK (id IS NOT NULL AND id <> '' AND id !~ '^\s*$');

ALTER TABLE student_courses 
  DROP CONSTRAINT IF EXISTS student_courses_id_not_empty,
  ADD CONSTRAINT student_courses_id_not_empty 
    CHECK (id IS NOT NULL AND id <> '' AND id !~ '^\s*$');
