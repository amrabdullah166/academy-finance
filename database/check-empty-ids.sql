-- Check for records with empty or null IDs in all tables
-- Run this in Supabase SQL Editor to identify problematic records

-- Check students table
SELECT 'students' as table_name, COUNT(*) as count
FROM students
WHERE id IS NULL OR id = '' OR id ~ '^\s*$';

-- Check courses table  
SELECT 'courses' as table_name, COUNT(*) as count
FROM courses
WHERE id IS NULL OR id = '' OR id ~ '^\s*$';

-- Check student_courses table
SELECT 'student_courses' as table_name, COUNT(*) as count
FROM student_courses
WHERE id IS NULL OR id = '' OR id ~ '^\s*$';

-- Check attendance table (if exists)
SELECT 'attendance' as table_name, COUNT(*) as count
FROM attendance
WHERE id IS NULL OR id = '' OR id ~ '^\s*$';

-- If you find any, you can delete them (BE CAREFUL!):
-- DELETE FROM students WHERE id IS NULL OR id = '' OR id ~ '^\s*$';
-- DELETE FROM courses WHERE id IS NULL OR id = '' OR id ~ '^\s*$';
-- DELETE FROM student_courses WHERE id IS NULL OR id = '' OR id ~ '^\s*$';
