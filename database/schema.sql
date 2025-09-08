-- نظام إدارة الأكاديمية المالي - قاعدة البيانات
-- Database Schema for Academy Financial Management System

-- 1. جدول الطلاب (Students)
CREATE TABLE students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    guardian_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(20) NOT NULL,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    grade_level VARCHAR(100),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    address TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول الدورات (Courses)
CREATE TABLE courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    monthly_fee DECIMAL(10,2) NOT NULL CHECK (monthly_fee >= 0),
    total_sessions INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    instructor_id UUID,
    start_date DATE,
    end_date DATE,
    max_students INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول الموظفين (Employees)
CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    position VARCHAR(100) NOT NULL,
    salary DECIMAL(10,2) NOT NULL CHECK (salary >= 0),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    bank_account VARCHAR(50),
    tax_id VARCHAR(50),
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول تسجيل الطلاب في الدورات (Student Courses)
CREATE TABLE student_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completion_date DATE,
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
    final_grade DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- 5. جدول المدفوعات (Payments)
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('cash', 'bank_transfer', 'online', 'check')),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('monthly_fee', 'registration', 'materials', 'penalty', 'refund', 'other')),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled', 'refunded')),
    course_id UUID REFERENCES courses(id),
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. جدول المصروفات (Expenses)
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(30) NOT NULL CHECK (category IN ('salaries', 'rent', 'utilities', 'equipment', 'marketing', 'maintenance', 'supplies', 'insurance', 'taxes', 'other')),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_number VARCHAR(50),
    supplier_name VARCHAR(255),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'credit_card')),
    status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id),
    created_by UUID REFERENCES employees(id),
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. جدول الرواتب (Salaries)
CREATE TABLE salaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    salary_month INTEGER NOT NULL CHECK (salary_month >= 1 AND salary_month <= 12),
    salary_year INTEGER NOT NULL CHECK (salary_year >= 2020),
    base_salary DECIMAL(10,2) NOT NULL CHECK (base_salary >= 0),
    bonuses DECIMAL(10,2) DEFAULT 0 CHECK (bonuses >= 0),
    deductions DECIMAL(10,2) DEFAULT 0 CHECK (deductions >= 0),
    tax_deduction DECIMAL(10,2) DEFAULT 0 CHECK (tax_deduction >= 0),
    net_salary DECIMAL(10,2) NOT NULL CHECK (net_salary >= 0),
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, salary_month, salary_year)
);

-- 8. جدول الحضور (Attendance)
CREATE TABLE attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    recorded_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id, attendance_date)
);

-- 9. جدول التنبيهات (Notifications)
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('payment_reminder', 'overdue_payment', 'salary_due', 'expense_approval', 'general', 'system')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    target_user_id UUID,
    target_role VARCHAR(20) CHECK (target_role IN ('admin', 'teacher', 'accountant', 'manager')),
    is_read BOOLEAN DEFAULT FALSE,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 10. جدول الاشتراكات الشهرية (Monthly Subscriptions)
CREATE TABLE monthly_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    subscription_month INTEGER NOT NULL CHECK (subscription_month >= 1 AND subscription_month <= 12),
    subscription_year INTEGER NOT NULL CHECK (subscription_year >= 2020),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    final_amount DECIMAL(10,2) NOT NULL CHECK (final_amount >= 0),
    due_date DATE NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_date DATE,
    payment_id UUID REFERENCES payments(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id, subscription_month, subscription_year)
);

-- 11. جدول الأنشطة (Activities Log)
CREATE TABLE activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('payment_received', 'student_enrolled', 'expense_added', 'subscription_created', 'course_created', 'employee_added', 'salary_paid', 'attendance_marked')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50), -- students, courses, payments, expenses, etc.
    entity_id UUID,
    amount DECIMAL(10,2),
    performed_by UUID REFERENCES employees(id),
    metadata JSONB, -- Additional data specific to activity type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. جدول سجل التدقيق (Audit Log)
CREATE TABLE audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES employees(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء الفهارس (Indexes)
CREATE INDEX idx_student_courses_student_id ON student_courses(student_id);
CREATE INDEX idx_student_courses_course_id ON student_courses(course_id);
CREATE INDEX idx_student_courses_status ON student_courses(status);

CREATE INDEX idx_monthly_subscriptions_student_id ON monthly_subscriptions(student_id);
CREATE INDEX idx_monthly_subscriptions_course_id ON monthly_subscriptions(course_id);
CREATE INDEX idx_monthly_subscriptions_status ON monthly_subscriptions(payment_status);
CREATE INDEX idx_monthly_subscriptions_due_date ON monthly_subscriptions(due_date);
CREATE INDEX idx_monthly_subscriptions_year_month ON monthly_subscriptions(subscription_year, subscription_month);

CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_activities_performed_by ON activities(performed_by);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_phone ON students(phone);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_enrollment_date ON students(enrollment_date);

CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_receipt ON payments(receipt_number);

CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_status ON expenses(status);

CREATE INDEX idx_attendance_student_course ON attendance(student_id, course_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

CREATE INDEX idx_notifications_target_user ON notifications(target_user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- إنشاء التريجرز للتحديث التلقائي (Triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق التريجر على الجداول المطلوبة
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salaries_updated_at BEFORE UPDATE ON salaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_subscriptions_updated_at BEFORE UPDATE ON monthly_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_courses_updated_at BEFORE UPDATE ON student_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- دالة لإنشاء رقم الإيصال التلقائي
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := 'REC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('receipt_sequence')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة لإنشاء اشتراك شهري تلقائياً عند تسجيل الطالب في دورة
CREATE OR REPLACE FUNCTION create_monthly_subscription()
RETURNS TRIGGER AS $$
DECLARE
    course_fee DECIMAL(10,2);
    student_discount DECIMAL(5,2);
    final_amount DECIMAL(10,2);
    current_month INTEGER;
    current_year INTEGER;
BEGIN
    -- الحصول على رسوم الدورة وخصم الطالب
    SELECT c.monthly_fee, s.discount_percentage 
    INTO course_fee, student_discount
    FROM courses c, students s 
    WHERE c.id = NEW.course_id AND s.id = NEW.student_id;
    
    -- حساب المبلغ النهائي مع الخصم
    final_amount := course_fee - (course_fee * student_discount / 100);
    
    -- الحصول على الشهر والسنة الحالية
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- إنشاء اشتراك شهري
    INSERT INTO monthly_subscriptions (
        student_id, 
        course_id, 
        subscription_month, 
        subscription_year,
        amount, 
        discount_amount, 
        final_amount, 
        due_date
    ) VALUES (
        NEW.student_id, 
        NEW.course_id, 
        current_month, 
        current_year,
        course_fee, 
        course_fee * student_discount / 100, 
        final_amount, 
        CURRENT_DATE + INTERVAL '7 days'
    );
    
    -- تسجيل النشاط
    INSERT INTO activities (
        type, 
        title, 
        description, 
        entity_type, 
        entity_id, 
        amount
    ) VALUES (
        'subscription_created',
        'تم إنشاء اشتراك شهري جديد',
        'تم إنشاء اشتراك شهري للطالب في الدورة',
        'monthly_subscriptions',
        NEW.id,
        final_amount
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب الإحصائيات المالية
CREATE OR REPLACE FUNCTION get_financial_stats(start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (
    total_revenue DECIMAL(10,2),
    total_expenses DECIMAL(10,2),
    net_profit DECIMAL(10,2),
    pending_payments DECIMAL(10,2),
    overdue_subscriptions DECIMAL(10,2),
    active_students INTEGER,
    active_courses INTEGER
) AS $$
BEGIN
    -- تعيين قيم افتراضية للتواريخ
    IF start_date IS NULL THEN
        start_date := DATE_TRUNC('month', CURRENT_DATE);
    END IF;
    
    IF end_date IS NULL THEN
        end_date := CURRENT_DATE;
    END IF;
    
    RETURN QUERY
    SELECT 
        COALESCE((SELECT SUM(amount) FROM payments WHERE payment_date BETWEEN start_date AND end_date AND status = 'completed'), 0)::DECIMAL(10,2),
        COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date BETWEEN start_date AND end_date AND status = 'paid'), 0)::DECIMAL(10,2),
        COALESCE((SELECT SUM(amount) FROM payments WHERE payment_date BETWEEN start_date AND end_date AND status = 'completed'), 0)::DECIMAL(10,2) - 
        COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date BETWEEN start_date AND end_date AND status = 'paid'), 0)::DECIMAL(10,2),
        COALESCE((SELECT SUM(final_amount) FROM monthly_subscriptions WHERE payment_status = 'pending'), 0)::DECIMAL(10,2),
        COALESCE((SELECT SUM(final_amount) FROM monthly_subscriptions WHERE payment_status = 'overdue'), 0)::DECIMAL(10,2),
        (SELECT COUNT(*) FROM students WHERE status = 'active')::INTEGER,
        (SELECT COUNT(*) FROM courses WHERE status = 'active')::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- إنشاء تسلسل للإيصالات
CREATE SEQUENCE IF NOT EXISTS receipt_sequence START 1;

-- تطبيق التريجر لإنشاء رقم الإيصال
CREATE TRIGGER generate_receipt_number_trigger 
    BEFORE INSERT ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_receipt_number();

-- تطبيق التريجر لإنشاء اشتراك شهري تلقائياً
CREATE TRIGGER create_monthly_subscription_trigger 
    AFTER INSERT ON student_courses 
    FOR EACH ROW 
    EXECUTE FUNCTION create_monthly_subscription();

-- تريجر لتسجيل الأنشطة
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- تسجيل نشاط الدفع
    IF TG_TABLE_NAME = 'payments' AND TG_OP = 'INSERT' THEN
        INSERT INTO activities (type, title, description, entity_type, entity_id, amount)
        VALUES (
            'payment_received',
            'تم استلام دفعة جديدة',
            'تم تسجيل دفعة جديدة رقم ' || NEW.receipt_number,
            'payments',
            NEW.id,
            NEW.amount
        );
        RETURN NEW;
    END IF;
    
    -- تسجيل نشاط إضافة طالب
    IF TG_TABLE_NAME = 'students' AND TG_OP = 'INSERT' THEN
        INSERT INTO activities (type, title, description, entity_type, entity_id)
        VALUES (
            'student_enrolled',
            'تم تسجيل طالب جديد',
            'تم تسجيل الطالب ' || NEW.name,
            'students',
            NEW.id
        );
        RETURN NEW;
    END IF;
    
    -- تسجيل نشاط إضافة مصروف
    IF TG_TABLE_NAME = 'expenses' AND TG_OP = 'INSERT' THEN
        INSERT INTO activities (type, title, description, entity_type, entity_id, amount)
        VALUES (
            'expense_added',
            'تم إضافة مصروف جديد',
            'تم إضافة مصروف: ' || NEW.description,
            'expenses',
            NEW.id,
            NEW.amount
        );
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- تطبيق تريجر تسجيل الأنشطة
CREATE TRIGGER log_payment_activity AFTER INSERT ON payments FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_student_activity AFTER INSERT ON students FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_expense_activity AFTER INSERT ON expenses FOR EACH ROW EXECUTE FUNCTION log_activity();

-- إنشاء Views مفيدة
-- عرض ملخص الطلاب مع المدفوعات والاشتراكات
CREATE VIEW student_payment_summary AS
SELECT 
    s.id,
    s.name,
    s.email,
    s.phone,
    s.status,
    s.enrollment_date,
    s.discount_percentage,
    COALESCE(SUM(p.amount), 0) as total_paid,
    COUNT(p.id) as payment_count,
    MAX(p.payment_date) as last_payment_date,
    COUNT(sc.id) as enrolled_courses,
    COALESCE(SUM(ms.final_amount), 0) as total_subscription_amount,
    COUNT(CASE WHEN ms.payment_status = 'pending' THEN 1 END) as pending_subscriptions,
    COUNT(CASE WHEN ms.payment_status = 'overdue' THEN 1 END) as overdue_subscriptions
FROM students s
LEFT JOIN payments p ON s.id = p.student_id AND p.status = 'completed'
LEFT JOIN student_courses sc ON s.id = sc.student_id AND sc.status = 'enrolled'
LEFT JOIN monthly_subscriptions ms ON s.id = ms.student_id
GROUP BY s.id, s.name, s.email, s.phone, s.status, s.enrollment_date, s.discount_percentage;

-- عرض تحليل الدورات مع الإيرادات والطلاب
CREATE VIEW course_analytics AS
SELECT 
    c.id,
    c.name,
    c.monthly_fee,
    c.status,
    c.max_students,
    COUNT(sc.student_id) as enrolled_students,
    COALESCE(SUM(p.amount), 0) as total_revenue,
    COALESCE(SUM(ms.final_amount), 0) as total_subscription_revenue,
    COUNT(CASE WHEN ms.payment_status = 'paid' THEN 1 END) as paid_subscriptions,
    COUNT(CASE WHEN ms.payment_status = 'pending' THEN 1 END) as pending_subscriptions,
    COUNT(CASE WHEN ms.payment_status = 'overdue' THEN 1 END) as overdue_subscriptions,
    ROUND(AVG(s.discount_percentage), 2) as avg_discount_percentage
FROM courses c
LEFT JOIN student_courses sc ON c.id = sc.course_id AND sc.status = 'enrolled'
LEFT JOIN students s ON sc.student_id = s.id
LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'completed'
LEFT JOIN monthly_subscriptions ms ON c.id = ms.course_id
GROUP BY c.id, c.name, c.monthly_fee, c.status, c.max_students;

-- عرض الأنشطة الحديثة مع التفاصيل
CREATE VIEW recent_activities AS
SELECT 
    a.id,
    a.type,
    a.title,
    a.description,
    a.amount,
    a.created_at,
    CASE 
        WHEN a.entity_type = 'students' THEN s.name
        WHEN a.entity_type = 'courses' THEN c.name
        WHEN a.entity_type = 'payments' THEN CONCAT('إيصال رقم: ', p.receipt_number)
        WHEN a.entity_type = 'expenses' THEN e.description
        ELSE 'غير محدد'
    END as entity_name,
    CASE 
        WHEN a.performed_by IS NOT NULL THEN emp.name
        ELSE 'النظام'
    END as performed_by_name
FROM activities a
LEFT JOIN students s ON a.entity_type = 'students' AND a.entity_id = s.id
LEFT JOIN courses c ON a.entity_type = 'courses' AND a.entity_id = c.id
LEFT JOIN payments p ON a.entity_type = 'payments' AND a.entity_id = p.id
LEFT JOIN expenses e ON a.entity_type = 'expenses' AND a.entity_id = e.id
LEFT JOIN employees emp ON a.performed_by = emp.id
ORDER BY a.created_at DESC;

-- عرض الاشتراكات المتأخرة
CREATE VIEW overdue_subscriptions AS
SELECT 
    ms.id,
    s.name as student_name,
    s.phone as student_phone,
    c.name as course_name,
    ms.final_amount,
    ms.due_date,
    CURRENT_DATE - ms.due_date as days_overdue,
    ms.subscription_month,
    ms.subscription_year
FROM monthly_subscriptions ms
JOIN students s ON ms.student_id = s.id
JOIN courses c ON ms.course_id = c.id
WHERE ms.payment_status = 'pending' 
AND ms.due_date < CURRENT_DATE
ORDER BY ms.due_date ASC;

-- عرض ملخص المصروفات الشهرية
CREATE VIEW monthly_expenses_summary AS
SELECT 
    EXTRACT(YEAR FROM expense_date) as year,
    EXTRACT(MONTH FROM expense_date) as month,
    category,
    SUM(amount) as total_amount,
    COUNT(*) as expense_count,
    AVG(amount) as avg_amount
FROM expenses 
WHERE status = 'paid'
GROUP BY EXTRACT(YEAR FROM expense_date), EXTRACT(MONTH FROM expense_date), category
ORDER BY year DESC, month DESC;

-- عرض ملخص الإيرادات الشهرية
CREATE VIEW monthly_revenue_summary AS
SELECT 
    EXTRACT(YEAR FROM payment_date) as year,
    EXTRACT(MONTH FROM payment_date) as month,
    payment_method,
    SUM(amount) as total_amount,
    COUNT(*) as payment_count,
    AVG(amount) as avg_amount
FROM payments 
WHERE status = 'completed'
GROUP BY EXTRACT(YEAR FROM payment_date), EXTRACT(MONTH FROM payment_date), payment_method
ORDER BY year DESC, month DESC;

-- تفعيل Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان (RLS Policies)
-- يمكن للجميع قراءة البيانات (يمكن تخصيصها حسب الحاجة)
CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON courses FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON employees FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON student_courses FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON payments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON salaries FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON attendance FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON monthly_subscriptions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON activities FOR SELECT USING (true);

-- السماح بالإدراج والتحديث للجميع (يمكن تخصيصها لاحقاً)
CREATE POLICY "Enable insert for all users" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON students FOR UPDATE USING (true);
CREATE POLICY "Enable insert for all users" ON courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON courses FOR UPDATE USING (true);
CREATE POLICY "Enable insert for all users" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON employees FOR UPDATE USING (true);
CREATE POLICY "Enable insert for all users" ON student_courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON student_courses FOR UPDATE USING (true);
CREATE POLICY "Enable insert for all users" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON payments FOR UPDATE USING (true);
CREATE POLICY "Enable insert for all users" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Enable insert for all users" ON salaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON salaries FOR UPDATE USING (true);
CREATE POLICY "Enable insert for all users" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON attendance FOR UPDATE USING (true);
CREATE POLICY "Enable insert for all users" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Enable insert for all users" ON monthly_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON monthly_subscriptions FOR UPDATE USING (true);
CREATE POLICY "Enable insert for all users" ON activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON activities FOR UPDATE USING (true);

-- إدراج بيانات تجريبية
-- إدراج موظفين
INSERT INTO employees (name, email, phone, position, salary, hire_date, status) VALUES
('أحمد محمد', 'ahmed@academy.com', '01234567890', 'مدير', 5000.00, '2024-01-01', 'active'),
('فاطمة علي', 'fatima@academy.com', '01234567891', 'مدرس', 3000.00, '2024-01-15', 'active'),
('محمد سعد', 'mohammed@academy.com', '01234567892', 'محاسب', 3500.00, '2024-02-01', 'active');

-- إدراج دورات
INSERT INTO courses (name, description, monthly_fee, total_sessions, status, max_students) VALUES
('الرياضيات المتقدمة', 'دورة في الرياضيات للطلاب المتفوقين', 150.00, 16, 'active', 25),
('اللغة الإنجليزية', 'دورة تقوية في اللغة الإنجليزية', 120.00, 12, 'active', 30),
('الفيزياء', 'أساسيات الفيزياء للمرحلة الثانوية', 180.00, 20, 'active', 20),
('الكيمياء', 'مبادئ الكيمياء العامة', 160.00, 18, 'active', 22);

-- إدراج طلاب
INSERT INTO students (name, email, phone, guardian_name, guardian_phone, grade_level, discount_percentage, status) VALUES
('سارة أحمد', 'sara@email.com', '01111111111', 'أحمد محمود', '01111111110', 'الصف العاشر', 0, 'active'),
('محمد خالد', 'mohammed.k@email.com', '01222222222', 'خالد عبدالله', '01222222220', 'الصف الحادي عشر', 10, 'active'),
('نور فاطمة', 'noor@email.com', '01333333333', 'فاطمة سعد', '01333333330', 'الصف الثاني عشر', 5, 'active'),
('عمر محسن', 'omar@email.com', '01444444444', 'محسن علي', '01444444440', 'الصف العاشر', 0, 'active'),
('ليلى أمين', 'layla@email.com', '01555555555', 'أمين حسن', '01555555550', 'الصف الحادي عشر', 15, 'active');

-- تحديث الـ IDs للاستفادة منها في الجداول الأخرى
-- (ملاحظة: في التطبيق الفعلي، يجب استخدام المتغيرات أو استعلامات للحصول على الـ IDs)

-- البيانات التجريبية ستكون مفيدة للاختبار والتطوير
-- يمكن حذفها أو تعديلها حسب الحاجة في الإنتاج

-- دالة لتحديث حالة الاشتراكات المتأخرة
CREATE OR REPLACE FUNCTION update_overdue_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE monthly_subscriptions 
    SET payment_status = 'overdue'
    WHERE payment_status = 'pending' 
    AND due_date < CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على إحصائيات سريعة للوحة الرئيسية
CREATE OR REPLACE FUNCTION get_dashboard_quick_stats()
RETURNS TABLE (
    total_students INTEGER,
    active_students INTEGER,
    total_courses INTEGER,
    active_courses INTEGER,
    total_employees INTEGER,
    active_employees INTEGER,
    monthly_revenue DECIMAL(10,2),
    monthly_expenses DECIMAL(10,2),
    pending_payments INTEGER,
    overdue_payments INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM students),
        (SELECT COUNT(*)::INTEGER FROM students WHERE status = 'active'),
        (SELECT COUNT(*)::INTEGER FROM courses),
        (SELECT COUNT(*)::INTEGER FROM courses WHERE status = 'active'),
        (SELECT COUNT(*)::INTEGER FROM employees),
        (SELECT COUNT(*)::INTEGER FROM employees WHERE status = 'active'),
        COALESCE((SELECT SUM(amount) FROM payments WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND status = 'completed'), 0)::DECIMAL(10,2),
        COALESCE((SELECT SUM(amount) FROM expenses WHERE EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM expense_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND status = 'paid'), 0)::DECIMAL(10,2),
        (SELECT COUNT(*)::INTEGER FROM monthly_subscriptions WHERE payment_status = 'pending'),
        (SELECT COUNT(*)::INTEGER FROM monthly_subscriptions WHERE payment_status = 'overdue');
END;
$$ LANGUAGE plpgsql;
