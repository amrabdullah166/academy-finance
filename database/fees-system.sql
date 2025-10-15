-- إضافة حقول الرسوم إلى جدول الكورسات
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS registration_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS transportation_fee DECIMAL(10,2) DEFAULT 0;

-- إضافة حقول الرسوم إلى جدول الاشتراكات (student_courses)
ALTER TABLE student_courses
ADD COLUMN IF NOT EXISTS registration_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_transportation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transportation_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 0;

-- إنشاء جدول لتتبع المدفوعات الشهرية
CREATE TABLE IF NOT EXISTS monthly_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES student_courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  payment_month DATE NOT NULL, -- أول يوم من الشهر (YYYY-MM-01)
  
  -- تفاصيل الرسوم
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  transportation_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  
  -- حالة الدفع
  paid BOOLEAN DEFAULT FALSE,
  payment_date DATE,
  payment_id UUID REFERENCES payments(id), -- ربط مع جدول المدفوعات الرئيسي
  
  -- بيانات إضافية
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- منع التكرار: اشتراك واحد لكل شهر
  UNIQUE(enrollment_id, payment_month)
);

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_monthly_payments_enrollment ON monthly_payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_student ON monthly_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_month ON monthly_payments(payment_month);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_paid ON monthly_payments(paid);

-- إضافة RLS policies
ALTER TABLE monthly_payments ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة للجميع
CREATE POLICY "Enable read access for all users" ON monthly_payments
  FOR SELECT USING (true);

-- السماح بالإدراج والتحديث والحذف للجميع (مؤقتاً حتى يتم إضافة نظام المصادقة)
CREATE POLICY "Enable insert for all users" ON monthly_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON monthly_payments
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON monthly_payments
  FOR DELETE USING (true);

-- دالة لإنشاء المدفوعات الشهرية تلقائياً عند إنشاء اشتراك جديد
CREATE OR REPLACE FUNCTION create_monthly_payments_for_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  months_count INT := 12; -- عدد الأشهر المطلوبة (سنة كاملة)
  current_month DATE;
  course_record RECORD;
BEGIN
  -- جلب معلومات الكورس
  SELECT monthly_fee, transportation_fee 
  INTO course_record
  FROM courses 
  WHERE id = NEW.course_id;
  
  -- إنشاء سجلات المدفوعات الشهرية للسنة القادمة
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
      paid
    ) VALUES (
      NEW.id,
      NEW.student_id,
      NEW.course_id,
      current_month,
      course_record.monthly_fee,
      CASE WHEN NEW.has_transportation THEN course_record.transportation_fee ELSE 0 END,
      course_record.monthly_fee + CASE WHEN NEW.has_transportation THEN course_record.transportation_fee ELSE 0 END,
      FALSE
    )
    ON CONFLICT (enrollment_id, payment_month) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتفعيل الدالة
DROP TRIGGER IF EXISTS create_monthly_payments_trigger ON student_courses;
CREATE TRIGGER create_monthly_payments_trigger
  AFTER INSERT ON student_courses
  FOR EACH ROW
  WHEN (NEW.status = 'enrolled')
  EXECUTE FUNCTION create_monthly_payments_for_enrollment();

-- دالة لتحديث حالة المدفوعات الشهرية عند إنشاء دفعة جديدة
CREATE OR REPLACE FUNCTION update_monthly_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  payment_to_update UUID;
BEGIN
  -- البحث عن أقدم دفعة شهرية غير مدفوعة لهذا الطالب
  SELECT id INTO payment_to_update
  FROM monthly_payments
  WHERE 
    student_id = NEW.student_id 
    AND paid = FALSE
    AND payment_month <= DATE_TRUNC('month', NEW.payment_date)
  ORDER BY payment_month ASC
  LIMIT 1;
  
  -- تحديث الدفعة إذا وُجدت
  IF payment_to_update IS NOT NULL THEN
    UPDATE monthly_payments
    SET 
      paid = TRUE,
      payment_date = NEW.payment_date,
      payment_id = NEW.id,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = payment_to_update;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger على جدول payments
DROP TRIGGER IF EXISTS update_monthly_payment_trigger ON payments;
CREATE TRIGGER update_monthly_payment_trigger
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_payment_status();

COMMENT ON TABLE monthly_payments IS 'جدول لتتبع المدفوعات الشهرية لكل اشتراك';
COMMENT ON COLUMN monthly_payments.payment_month IS 'الشهر المستحق (أول يوم من الشهر)';
COMMENT ON COLUMN monthly_payments.monthly_fee IS 'رسوم الاشتراك الشهري';
COMMENT ON COLUMN monthly_payments.transportation_fee IS 'رسوم المواصلات الشهرية';
