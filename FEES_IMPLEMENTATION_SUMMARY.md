# ✅ نظام الرسوم - تم التنفيذ بنجاح

## 📋 ملخص التحديثات

### 1️⃣ قاعدة البيانات (Database)
**الملف**: `database/fees-system.sql`

#### التعديلات على جدول `courses`:
- ✅ `registration_fee` - رسوم التسجيل (مرة واحدة)
- ✅ `monthly_fee` - الرسوم الشهرية (موجودة مسبقاً)
- ✅ `transportation_fee` - رسوم المواصلات (شهرياً)

#### التعديلات على جدول `student_courses`:
- ✅ `registration_fee` - رسوم التسجيل لهذا الطالب
- ✅ `registration_fee_paid` - هل تم دفع رسوم التسجيل؟
- ✅ `monthly_fee` - الرسوم الشهرية (كورس + مواصلات)
- ✅ `has_transportation` - هل الطالب مشترك بالمواصلات؟
- ✅ `transportation_fee` - قيمة رسوم المواصلات

#### جدول جديد `monthly_payments`:
```sql
- id (UUID)
- enrollment_id (FK → student_courses)
- month (1-12)
- year (2024, 2025, ...)
- amount (المبلغ المطلوب)
- status (paid/unpaid/overdue)
- paid_date (تاريخ الدفع)
- due_date (تاريخ الاستحقاق)
```

#### Triggers تلقائية:
1. **create_monthly_payments_for_enrollment**:
   - يتم تفعيله عند: تسجيل طالب جديد في كورس
   - الإجراء: إنشاء 12 سجل دفع شهري تلقائياً

2. **update_monthly_payment_status**:
   - يتم تفعيله عند: إضافة دفعة في جدول payments
   - الإجراء: تحديث حالة الدفعة الشهرية إلى "paid"

---

### 2️⃣ واجهة الكورسات
**الملف**: `src/app/courses/page.tsx`

#### نموذج إضافة/تعديل كورس:
```tsx
<Input label="رسوم التسجيل" type="number" />
<Input label="الرسوم الشهرية" type="number" required />
<Input label="رسوم المواصلات (شهرياً)" type="number" />
```

#### جدول الكورسات:
| اسم الكورس | رسوم شهرية | رسوم تسجيل | رسوم مواصلات | ... |
|------------|-----------|-----------|-------------|-----|

---

### 3️⃣ واجهة التسجيل
**الملف**: `src/app/enrollments/page.tsx`

#### نموذج تسجيل طالب:
1. اختر الطالب
2. اختر الكورس
3. **[جديد]** ☑️ إضافة خدمة المواصلات (يظهر فقط للكورسات التي فيها رسوم مواصلات)

#### مثال:
```
الكورس: برمجة - 50 دينار شهرياً (مواصلات: 15 د)
☑️ إضافة خدمة المواصلات (15 دينار شهرياً)
→ الإجمالي الشهري: 65 دينار
```

---

### 4️⃣ مكتبة Supabase
**الملف**: `src/lib/supabase.ts`

#### دوال محدّثة:
```typescript
// تحديث: تقبل معامل المواصلات
enrollStudentInCourse(studentId, courseId, hasTransportation)

// جديد: الحصول على المدفوعات الشهرية
getMonthlyPayments(filters?)

// جديد: إحصائيات المدفوعات
getMonthlyPaymentsSummary(month, year)

// جديد: تحديد دفعة كمدفوعة
markMonthlyPaymentAsPaid(paymentId)

// جديد: سجل دفعات الطالب
getStudentPaymentHistory(studentId)
```

---

## 🚀 الخطوة الوحيدة المطلوبة

### تطبيق SQL على Supabase:

1. افتح **Supabase Dashboard**: https://app.supabase.com
2. اذهب إلى **SQL Editor**
3. انسخ محتوى ملف `database/fees-system.sql`
4. الصق في المحرر
5. اضغط **Run** أو **Execute**

✅ انتهى!

---

## 💡 كيفية الاستخدام

### سيناريو 1: إضافة كورس جديد بجميع أنواع الرسوم
```
الخطوات:
1. صفحة الكورسات → "إضافة كورس جديد"
2. أدخل البيانات:
   - اسم الكورس: "برمجة متقدمة"
   - الرسوم الشهرية: 50 دينار ✅ (إلزامي)
   - رسوم التسجيل: 20 دينار (اختياري)
   - رسوم المواصلات: 15 دينار (اختياري)
3. احفظ

النتيجة:
✅ الكورس جاهز بجميع أنواع الرسوم
```

### سيناريو 2: تسجيل طالب مع مواصلات
```
الخطوات:
1. صفحة التسجيل → "تسجيل طالب في دورة"
2. اختر الطالب: "أحمد محمد"
3. اختر الكورس: "برمجة متقدمة"
4. ☑️ إضافة خدمة المواصلات (15 دينار شهرياً)
5. تسجيل الطالب

ماذا يحدث تلقائياً؟
1. يُحسب الإجمالي الشهري: 50 + 15 = 65 دينار
2. تُحفظ رسوم التسجيل: 20 دينار (غير مدفوعة)
3. يتم إنشاء 12 سجل دفع شهري:
   - يناير 2024: 65 دينار (unpaid)
   - فبراير 2024: 65 دينار (unpaid)
   - مارس 2024: 65 دينار (unpaid)
   ... إلخ
```

### سيناريو 3: تسجيل طالب بدون مواصلات
```
الخطوات:
1-3. نفس الخطوات السابقة
4. ⬜ لا تضع علامة على المواصلات
5. تسجيل الطالب

النتيجة:
- الإجمالي الشهري: 50 دينار فقط
- رسوم التسجيل: 20 دينار
- 12 سجل دفع شهري بـ 50 دينار لكل منها
```

---

## 📊 الميزات التلقائية

### 1. إنشاء المدفوعات الشهرية
```
عند تسجيل طالب → تلقائياً:
✅ إنشاء 12 سجل دفع (يناير - ديسمبر)
✅ حساب المبلغ الصحيح (مع أو بدون مواصلات)
✅ تحديد تاريخ الاستحقاق لكل شهر
✅ الحالة الأولية: "unpaid"
```

### 2. تحديث حالة الدفع
```
عند إضافة دفعة في جدول payments → تلقائياً:
✅ البحث عن الدفعة الشهرية المطابقة
✅ تحديث الحالة إلى "paid"
✅ حفظ تاريخ الدفع
```

### 3. تحديد المدفوعات المتأخرة
```
يمكنك لاحقاً إضافة:
- Cron job يومي يحدّث الدفعات المتأخرة
- أو استعلام SQL:
  UPDATE monthly_payments
  SET status = 'overdue'
  WHERE status = 'unpaid'
    AND due_date < CURRENT_DATE;
```

---

## 📈 الخطوات التالية (اختياري)

### إنشاء صفحة المدفوعات الشهرية
صفحة جديدة تعرض:
- ✅ جميع المدفوعات المستحقة هذا الشهر
- ✅ فلترة: مدفوع / غير مدفوع / متأخر
- ✅ إحصائيات: نسبة التحصيل، المبالغ المتأخرة
- ✅ إمكانية تسجيل دفعة مباشرة

### تحسين صفحة المدفوعات
- عرض رسوم التسجيل منفصلة
- تمييز المدفوعات الشهرية عن الدفعات الأخرى
- إظهار حالة كل شهر (مدفوع/غير مدفوع)

### تقارير مالية
- تقرير الإيرادات حسب نوع الرسوم
- تقرير المدفوعات المتأخرة
- تحليل الإيرادات الشهرية

---

## 🔍 استعلامات SQL مفيدة

### المدفوعات المستحقة هذا الشهر
```sql
SELECT 
  s.name as student_name,
  c.name as course_name,
  mp.amount,
  mp.status,
  mp.due_date
FROM monthly_payments mp
JOIN student_courses sc ON mp.enrollment_id = sc.id
JOIN students s ON sc.student_id = s.id
JOIN courses c ON sc.course_id = c.id
WHERE mp.month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND mp.year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY mp.due_date;
```

### إحصائيات الرسوم لكل كورس
```sql
SELECT 
  c.name as course_name,
  COUNT(sc.id) as total_students,
  SUM(sc.registration_fee) as total_registration_fees,
  SUM(sc.monthly_fee) as monthly_revenue_potential,
  COUNT(*) FILTER (WHERE sc.has_transportation) as students_with_transport
FROM courses c
LEFT JOIN student_courses sc ON c.id = sc.course_id
GROUP BY c.id, c.name;
```

### الطلاب الذين لديهم مدفوعات متأخرة
```sql
SELECT DISTINCT
  s.name,
  s.phone,
  COUNT(*) as overdue_count,
  SUM(mp.amount) as total_overdue
FROM monthly_payments mp
JOIN student_courses sc ON mp.enrollment_id = sc.id
JOIN students s ON sc.student_id = s.id
WHERE mp.status = 'overdue'
GROUP BY s.id, s.name, s.phone
ORDER BY total_overdue DESC;
```

---

## ⚠️ ملاحظات مهمة

### قبل التطبيق على Production:
- ✅ احفظ نسخة احتياطية من قاعدة البيانات
- ✅ اختبر على بيئة تطوير أولاً
- ✅ تحقق من RLS policies

### البيانات الموجودة:
- الكورسات القديمة → رسوم جديدة = 0 (يمكنك تحديثها)
- التسجيلات القديمة → لن تحصل على مدفوعات شهرية تلقائياً
  - يمكنك تشغيل الـ trigger يدوياً إذا أردت

### الأمان:
- ✅ جميع الجداول محمية بـ RLS
- ✅ Triggers لا يمكن تعديلها من المستخدمين
- ✅ Policies تسمح فقط بالعمليات المصرح بها

---

## 🎉 تم!

النظام جاهز تماماً. فقط نفّذ ملف SQL على Supabase وابدأ الاستخدام!

### الدعم
إذا واجهت أي مشكلة:
1. تحقق من **Console** في المتصفح (F12)
2. تحقق من **Supabase Logs**
3. تأكد من تطبيق SQL بالكامل بنجاح

---

📖 **الملفات ذات الصلة:**
- `database/fees-system.sql` - Schema الكامل
- `FEE_SYSTEM_SETUP.md` - دليل تفصيلي
- `QUICK_START_FEES.md` - دليل سريع
