-- ═══════════════════════════════════════════════════════════
--  إضافة عمود is_present لجدول الحضور
-- ═══════════════════════════════════════════════════════════

-- 1️⃣ إضافة العمود الجديد
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS is_present BOOLEAN;

-- 2️⃣ تحديث البيانات الموجودة (تحويل status إلى is_present)
UPDATE attendance 
SET is_present = (
  CASE 
    WHEN status IN ('present', 'late') THEN true
    WHEN status IN ('absent', 'excused') THEN false
    ELSE false
  END
)
WHERE is_present IS NULL;

-- 3️⃣ جعل العمود إلزامي بعد ملء البيانات
ALTER TABLE attendance 
ALTER COLUMN is_present SET NOT NULL;

-- 4️⃣ إنشاء trigger لتحديث is_present تلقائياً عند تغيير status
CREATE OR REPLACE FUNCTION sync_attendance_is_present()
RETURNS TRIGGER AS $$
BEGIN
  -- عند إدخال سجل جديد أو تحديث status
  IF NEW.status IN ('present', 'late') THEN
    NEW.is_present := true;
  ELSIF NEW.status IN ('absent', 'excused') THEN
    NEW.is_present := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_attendance_is_present_trigger ON attendance;
CREATE TRIGGER sync_attendance_is_present_trigger
  BEFORE INSERT OR UPDATE OF status ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION sync_attendance_is_present();

-- 5️⃣ إنشاء trigger لتحديث status عند تغيير is_present
CREATE OR REPLACE FUNCTION sync_attendance_status()
RETURNS TRIGGER AS $$
BEGIN
  -- عند تحديث is_present، نحدث status
  IF NEW.is_present = true AND (OLD.is_present IS NULL OR OLD.is_present = false) THEN
    NEW.status := 'present';
  ELSIF NEW.is_present = false AND (OLD.is_present IS NULL OR OLD.is_present = true) THEN
    NEW.status := 'absent';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_attendance_status_trigger ON attendance;
CREATE TRIGGER sync_attendance_status_trigger
  BEFORE INSERT OR UPDATE OF is_present ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION sync_attendance_status();

-- ═══════════════════════════════════════════════════════════
--  ملاحظات:
-- ═══════════════════════════════════════════════════════════
-- ✅ الآن الجدول يدعم كلا النظامين:
--    - is_present (boolean) → للكود الحالي
--    - status (text) → للتوافق المستقبلي
--
-- 🔄 التحديث يتم تلقائياً في الاتجاهين:
--    - لما تغير status → is_present يتحدث
--    - لما تغير is_present → status يتحدث
-- ═══════════════════════════════════════════════════════════
