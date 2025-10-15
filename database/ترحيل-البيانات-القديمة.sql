-- ═══════════════════════════════════════════════════════════
--  ترحيل البيانات القديمة لنظام الرسوم الجديد
-- ═══════════════════════════════════════════════════════════
-- هذا السكريبت بيحدث كل الاشتراكات القديمة لتتوافق مع النظام الجديد

-- ═══════════════════════════════════════════════════════════
--  الخطوة 1: تحديث جدول الكورسات
-- ═══════════════════════════════════════════════════════════
-- إضافة رسوم تسجيل ومواصلات افتراضية للكورسات اللي ما عندها

UPDATE courses
SET 
  registration_fee = COALESCE(registration_fee, 0),
  transportation_fee = COALESCE(transportation_fee, 0)
WHERE 
  registration_fee IS NULL 
  OR transportation_fee IS NULL;

-- ═══════════════════════════════════════════════════════════
--  الخطوة 2: تحديث الاشتراكات القديمة
-- ═══════════════════════════════════════════════════════════
-- نملأ الحقول الناقصة في جدول student_courses

UPDATE student_courses sc
SET 
  -- نسخ الرسوم من جدول الكورسات
  registration_fee = COALESCE(sc.registration_fee, c.registration_fee, 0),
  monthly_fee = COALESCE(sc.monthly_fee, c.monthly_fee, 0),
  transportation_fee = COALESCE(sc.transportation_fee, 0),
  
  -- تعيين حالة رسوم التسجيل
  -- إذا الطالب دفع أي مبلغ، نعتبر رسوم التسجيل مدفوعة
  registration_fee_paid = COALESCE(
    sc.registration_fee_paid,
    EXISTS(
      SELECT 1 FROM payments p 
      WHERE p.student_id = sc.student_id 
      AND p.course_id = sc.course_id
    )
  ),
  
  -- المواصلات (افتراضياً false للطلاب القدام)
  has_transportation = COALESCE(sc.has_transportation, false)
  
FROM courses c
WHERE sc.course_id = c.id
  AND (
    sc.registration_fee IS NULL 
    OR sc.monthly_fee IS NULL 
    OR sc.registration_fee_paid IS NULL
    OR sc.has_transportation IS NULL
  );

-- ═══════════════════════════════════════════════════════════
--  الخطوة 3: إنشاء سجلات المدفوعات الشهرية للاشتراكات القديمة
-- ═══════════════════════════════════════════════════════════

-- حذف أي سجلات موجودة مسبقاً (لتجنب التكرار)
-- DELETE FROM monthly_payments 
-- WHERE enrollment_id IN (
--   SELECT id FROM student_courses 
--   WHERE created_at < NOW() - INTERVAL '1 day'
-- );

-- إنشاء المدفوعات الشهرية لكل اشتراك قديم
DO $$
DECLARE
  enrollment_record RECORD;
  current_month DATE;
  months_count INT := 12; -- عدد الأشهر (سنة كاملة)
  existing_payments INT;
BEGIN
  -- نمر على كل الاشتراكات النشطة
  FOR enrollment_record IN 
    SELECT 
      sc.id as enrollment_id,
      sc.student_id,
      sc.course_id,
      sc.monthly_fee,
      sc.transportation_fee,
      sc.has_transportation,
      sc.created_at
    FROM student_courses sc
    WHERE sc.status = 'enrolled'
  LOOP
    -- نتأكد إذا في مدفوعات شهرية موجودة
    SELECT COUNT(*) INTO existing_payments
    FROM monthly_payments
    WHERE enrollment_id = enrollment_record.enrollment_id;
    
    -- إذا ما في مدفوعات، ننشئها
    IF existing_payments = 0 THEN
      -- ننشئ 12 سجل شهري (سنة كاملة)
      FOR i IN 0..months_count-1 LOOP
        current_month := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
        
        INSERT INTO monthly_payments (
          enrollment_id,
          student_id,
          course_id,
          payment_month,
          monthly_fee,
          transportation_fee,
          total_amount,
          paid,
          notes
        ) VALUES (
          enrollment_record.enrollment_id,
          enrollment_record.student_id,
          enrollment_record.course_id,
          current_month,
          enrollment_record.monthly_fee,
          CASE 
            WHEN enrollment_record.has_transportation THEN enrollment_record.transportation_fee 
            ELSE 0 
          END,
          enrollment_record.monthly_fee + CASE 
            WHEN enrollment_record.has_transportation THEN enrollment_record.transportation_fee 
            ELSE 0 
          END,
          false,
          'تم الإنشاء تلقائياً للاشتراكات القديمة'
        )
        ON CONFLICT (enrollment_id, payment_month) DO NOTHING;
      END LOOP;
      
      RAISE NOTICE 'تم إنشاء % سجل شهري للاشتراك %', months_count, enrollment_record.enrollment_id;
    ELSE
      RAISE NOTICE 'الاشتراك % عنده % سجل موجود مسبقاً', enrollment_record.enrollment_id, existing_payments;
    END IF;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════
--  الخطوة 4: ربط المدفوعات القديمة مع السجلات الشهرية
-- ═══════════════════════════════════════════════════════════
-- نحدث سجلات المدفوعات الشهرية بناءً على المدفوعات الموجودة

UPDATE monthly_payments mp
SET 
  paid = true,
  payment_date = p.payment_date,
  payment_id = p.id,
  notes = COALESCE(mp.notes, '') || ' - تم الدفع في ' || p.payment_date::text
FROM payments p
WHERE 
  mp.student_id = p.student_id
  AND mp.course_id = p.course_id
  AND DATE_TRUNC('month', p.payment_date) = mp.payment_month
  AND mp.paid = false;

-- ═══════════════════════════════════════════════════════════
--  الخطوة 5: إحصائيات النتائج
-- ═══════════════════════════════════════════════════════════

-- عرض ملخص للعملية
SELECT 
  'إجمالي الاشتراكات' as البيان,
  COUNT(*) as العدد
FROM student_courses
WHERE status = 'enrolled'

UNION ALL

SELECT 
  'اشتراكات لها مدفوعات شهرية',
  COUNT(DISTINCT enrollment_id)
FROM monthly_payments

UNION ALL

SELECT 
  'إجمالي المدفوعات الشهرية المنشأة',
  COUNT(*)
FROM monthly_payments

UNION ALL

SELECT 
  'مدفوعات شهرية مدفوعة',
  COUNT(*)
FROM monthly_payments
WHERE paid = true

UNION ALL

SELECT 
  'مدفوعات شهرية مستحقة',
  COUNT(*)
FROM monthly_payments
WHERE paid = false AND payment_month <= CURRENT_DATE;

-- ═══════════════════════════════════════════════════════════
--  ملاحظات مهمة:
-- ═══════════════════════════════════════════════════════════
-- ✅ هذا السكريبت آمن - يمكن تشغيله أكثر من مرة
-- ✅ يستخدم ON CONFLICT لتجنب التكرار
-- ✅ يحفظ البيانات القديمة ويبني عليها
-- ✅ ينشئ 12 شهر قدام لكل اشتراك
-- 
-- ⚠️ راجع النتائج قبل الاعتماد الكامل على النظام الجديد
-- ═══════════════════════════════════════════════════════════
