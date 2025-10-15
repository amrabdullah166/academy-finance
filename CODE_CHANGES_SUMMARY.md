# 📝 التغييرات في الكود - نظام الرسوم

## الملفات المُعدّلة

### 1. `src/app/courses/page.tsx`

#### State الجديد:
```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  monthly_fee: '',
  registration_fee: '',      // ← جديد
  transportation_fee: '',    // ← جديد
  total_sessions: '',
  status: 'active',
  start_date: '',
  end_date: '',
  max_students: ''
})
```

#### نموذج الإضافة - الحقول الجديدة:
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label htmlFor="registration_fee">رسوم التسجيل</Label>
    <Input
      id="registration_fee"
      type="number"
      step="0.01"
      value={formData.registration_fee}
      onChange={(e) => setFormData({...formData, registration_fee: e.target.value})}
      placeholder="0"
    />
  </div>
  
  <div>
    <Label htmlFor="transportation_fee">رسوم المواصلات (شهرياً)</Label>
    <Input
      id="transportation_fee"
      type="number"
      step="0.01"
      value={formData.transportation_fee}
      onChange={(e) => setFormData({...formData, transportation_fee: e.target.value})}
      placeholder="0"
    />
  </div>
</div>
```

#### handleSubmit المحدّث:
```typescript
const courseData = {
  name: formData.name,
  description: formData.description || undefined,
  monthly_fee: parseFloat(formData.monthly_fee),
  registration_fee: parseFloat(formData.registration_fee) || 0,    // ← جديد
  transportation_fee: parseFloat(formData.transportation_fee) || 0, // ← جديد
  total_sessions: formData.total_sessions ? parseInt(formData.total_sessions) : undefined,
  // ... باقي الحقول
}
```

#### الجدول - الأعمدة الجديدة:
```tsx
<TableHead>رسوم شهرية</TableHead>
<TableHead>رسوم تسجيل</TableHead>      {/* جديد */}
<TableHead>رسوم مواصلات</TableHead>     {/* جديد */}

{/* ... */}

<TableCell className="text-right rtl-content">
  {((course as any).registration_fee || 0).toLocaleString()} د
</TableCell>
<TableCell className="text-right rtl-content">
  {((course as any).transportation_fee || 0).toLocaleString()} د
</TableCell>
```

---

### 2. `src/app/enrollments/page.tsx`

#### State الجديد:
```typescript
const [hasTransportation, setHasTransportation] = useState(false) // ← جديد
```

#### نموذج التسجيل - Checkbox المواصلات:
```tsx
{/* عرض الخيار فقط للكورسات التي لديها رسوم مواصلات */}
{selectedCourse && courses.find(c => c.id === selectedCourse && (c as any).transportation_fee > 0) && (
  <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded-md">
    <input
      type="checkbox"
      id="transportation"
      checked={hasTransportation}
      onChange={(e) => setHasTransportation(e.target.checked)}
      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
    />
    <Label htmlFor="transportation" className="cursor-pointer">
      إضافة خدمة المواصلات 
      ({courses.find(c => c.id === selectedCourse)?.transportation_fee || 0} دينار شهرياً)
    </Label>
  </div>
)}
```

#### handleEnrollment المحدّث:
```typescript
const handleEnrollment = async () => {
  if (!selectedStudent || !selectedCourse) {
    alert('يرجى اختيار الطالب والدورة')
    return
  }

  try {
    // ← تمرير hasTransportation كمعامل ثالث
    await enrollStudentInCourse(selectedStudent, selectedCourse, hasTransportation)
    
    setIsEnrollDialogOpen(false)
    setSelectedStudent('')
    setSelectedCourse('')
    setHasTransportation(false) // ← إعادة تعيين
    
    fetchData()
    alert('تم تسجيل الطالب في الدورة بنجاح')
  } catch (error) {
    console.error('Error enrolling student:', error)
    alert('حدث خطأ أثناء تسجيل الطالب')
  }
}
```

---

### 3. `src/lib/supabase.ts`

#### enrollStudentInCourse - التحديث الكامل:
```typescript
export const enrollStudentInCourse = async (
  studentId: string, 
  courseId: string, 
  hasTransportation: boolean = false  // ← معامل جديد
) => {
  // 1. جلب تفاصيل الكورس لحساب الرسوم
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('monthly_fee, registration_fee, transportation_fee')
    .eq('id', courseId)
    .single()
  
  if (courseError) throw courseError
  
  // 2. حساب الرسوم
  const monthlyFee = course.monthly_fee + 
    (hasTransportation ? (course.transportation_fee || 0) : 0)
  const registrationFee = course.registration_fee || 0
  
  // 3. إدراج السجل مع الرسوم المحسوبة
  const { data, error } = await supabase
    .from('student_courses')
    .insert([{
      student_id: studentId,
      course_id: courseId,
      enrollment_date: new Date().toISOString().split('T')[0],
      status: 'enrolled',
      has_transportation: hasTransportation,          // ← جديد
      monthly_fee: monthlyFee,                        // ← جديد
      registration_fee: registrationFee,              // ← جديد
      registration_fee_paid: false                    // ← جديد
    }])
    .select(`
      *,
      students (name),
      courses (name, monthly_fee, registration_fee, transportation_fee)
    `)
    .single()
  
  if (error) throw error
  return data
}
```

#### الدوال الجديدة المضافة:

```typescript
// 1. الحصول على المدفوعات الشهرية مع فلترة
export const getMonthlyPayments = async (filters?: {
  status?: 'paid' | 'unpaid' | 'overdue'
  month?: number
  year?: number
  courseId?: string
  studentId?: string
}) => { /* ... */ }

// 2. إحصائيات المدفوعات الشهرية
export const getMonthlyPaymentsSummary = async (month?: number, year?: number) => {
  // يعيد:
  // - totalPayments: عدد المدفوعات الكلي
  // - paidCount: عدد المدفوعات المدفوعة
  // - unpaidCount: عدد المدفوعات غير المدفوعة
  // - overdueCount: عدد المدفوعات المتأخرة
  // - totalAmount: المبلغ الكلي
  // - paidAmount: المبلغ المدفوع
  // - unpaidAmount: المبلغ غير المدفوع
  // - collectionRate: نسبة التحصيل
}

// 3. تحديد دفعة كمدفوعة
export const markMonthlyPaymentAsPaid = async (paymentId: string) => { /* ... */ }

// 4. سجل دفعات الطالب
export const getStudentPaymentHistory = async (studentId: string) => {
  // يعيد:
  // - enrollments: جميع تسجيلات الطالب مع رسومها
  // - monthlyPayments: جميع المدفوعات الشهرية
}
```

---

### 4. `database/fees-system.sql` (جديد)

#### تعديلات جدول courses:
```sql
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS registration_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS transportation_fee DECIMAL(10, 2) DEFAULT 0;
```

#### تعديلات جدول student_courses:
```sql
ALTER TABLE student_courses
ADD COLUMN IF NOT EXISTS registration_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS has_transportation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transportation_fee DECIMAL(10, 2) DEFAULT 0;
```

#### جدول جديد monthly_payments:
```sql
CREATE TABLE IF NOT EXISTS monthly_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES student_courses(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue')),
  due_date DATE,
  paid_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Trigger 1: إنشاء مدفوعات شهرية عند التسجيل:
```sql
CREATE OR REPLACE FUNCTION create_monthly_payments_for_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- إنشاء 12 سجل دفع (يناير - ديسمبر)
  FOR i IN 1..12 LOOP
    INSERT INTO monthly_payments (enrollment_id, month, year, amount, due_date)
    VALUES (
      NEW.id,
      i,
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      NEW.monthly_fee,
      (CURRENT_DATE + (i || ' months')::INTERVAL)::DATE
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_monthly_payments
AFTER INSERT ON student_courses
FOR EACH ROW
WHEN (NEW.status = 'enrolled')
EXECUTE FUNCTION create_monthly_payments_for_enrollment();
```

#### Trigger 2: تحديث حالة الدفع عند إضافة دفعة:
```sql
CREATE OR REPLACE FUNCTION update_monthly_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- البحث عن الدفعة الشهرية المطابقة وتحديثها
  UPDATE monthly_payments
  SET 
    status = 'paid',
    paid_date = NEW.payment_date
  WHERE enrollment_id = (
    SELECT id FROM student_courses 
    WHERE student_id = NEW.student_id 
      AND course_id = NEW.course_id
    LIMIT 1
  )
  AND month = EXTRACT(MONTH FROM NEW.payment_date)::INTEGER
  AND year = EXTRACT(YEAR FROM NEW.payment_date)::INTEGER
  AND status = 'unpaid';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_payment
AFTER INSERT ON payments
FOR EACH ROW
WHEN (NEW.payment_method = 'monthly_fee')
EXECUTE FUNCTION update_monthly_payment_status();
```

---

## 📊 مثال كامل للتدفق

### عند تسجيل طالب:

```typescript
// 1. المستخدم يختار:
selectedStudent = "123-abc"
selectedCourse = "456-def"  // كورس رسومه: 50د شهري، 20د تسجيل، 15د مواصلات
hasTransportation = true

// 2. يتم استدعاء:
await enrollStudentInCourse("123-abc", "456-def", true)

// 3. داخل الدالة:
const course = {
  monthly_fee: 50,
  registration_fee: 20,
  transportation_fee: 15
}

const monthlyFee = 50 + 15 = 65  // لأن hasTransportation = true
const registrationFee = 20

// 4. يتم الإدراج في student_courses:
INSERT INTO student_courses (
  student_id: "123-abc",
  course_id: "456-def",
  has_transportation: true,
  monthly_fee: 65,
  registration_fee: 20,
  registration_fee_paid: false
)

// 5. Trigger تلقائي ينشئ 12 سجل في monthly_payments:
INSERT INTO monthly_payments VALUES
  (enrollment_id, month: 1,  year: 2024, amount: 65, status: 'unpaid', due_date: '2024-01-01'),
  (enrollment_id, month: 2,  year: 2024, amount: 65, status: 'unpaid', due_date: '2024-02-01'),
  (enrollment_id, month: 3,  year: 2024, amount: 65, status: 'unpaid', due_date: '2024-03-01'),
  ...
  (enrollment_id, month: 12, year: 2024, amount: 65, status: 'unpaid', due_date: '2024-12-01')
```

### عند إضافة دفعة:

```typescript
// 1. إضافة دفعة في صفحة المدفوعات:
INSERT INTO payments (
  student_id: "123-abc",
  course_id: "456-def",
  amount: 65,
  payment_method: 'monthly_fee',
  payment_date: '2024-03-15'
)

// 2. Trigger تلقائي يحدّث monthly_payments:
UPDATE monthly_payments
SET status = 'paid', paid_date = '2024-03-15'
WHERE enrollment_id = ...
  AND month = 3      // من EXTRACT(MONTH FROM payment_date)
  AND year = 2024    // من EXTRACT(YEAR FROM payment_date)
  AND status = 'unpaid'

// 3. النتيجة:
// الدفعة الشهرية لشهر مارس أصبحت "paid" تلقائياً!
```

---

## ✅ قائمة التحقق

- [x] تعديل جدول courses (رسوم تسجيل ومواصلات)
- [x] تعديل جدول student_courses (حقول الرسوم)
- [x] إنشاء جدول monthly_payments
- [x] إضافة Triggers (إنشاء + تحديث)
- [x] إضافة RLS Policies
- [x] إضافة Indexes
- [x] تحديث واجهة الكورسات (نموذج + جدول)
- [x] تحديث واجهة التسجيل (checkbox مواصلات)
- [x] تحديث enrollStudentInCourse (حساب الرسوم)
- [x] إضافة دوال جديدة (getMonthlyPayments, markAsPaid, ...)
- [x] إنشاء ملفات التوثيق

---

## 🎯 الخطوة التالية

**فقط نفّذ `database/fees-system.sql` على Supabase وكل شيء جاهز!**
