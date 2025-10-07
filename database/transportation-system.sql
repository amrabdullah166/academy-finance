-- إنشاء جدول اشتراك المواصلات
CREATE TABLE IF NOT EXISTS transportation_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pickup_location TEXT,
  dropoff_location TEXT,
  pickup_time TIME,
  dropoff_time TIME,
  transportation_route TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إنشاء فهارس للاستعلامات السريعة
CREATE INDEX IF NOT EXISTS idx_transportation_student ON transportation_subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_transportation_course ON transportation_subscriptions(course_id);
CREATE INDEX IF NOT EXISTS idx_transportation_active ON transportation_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_transportation_dates ON transportation_subscriptions(start_date, end_date);

-- إضافة قيد لمنع الاشتراك المزدوج في نفس الكورس
ALTER TABLE transportation_subscriptions 
ADD CONSTRAINT IF NOT EXISTS unique_student_course_transport 
UNIQUE (student_id, course_id);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_transportation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_transportation_subscriptions_updated_at ON transportation_subscriptions;
CREATE TRIGGER update_transportation_subscriptions_updated_at 
    BEFORE UPDATE ON transportation_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_transportation_updated_at();

-- تفعيل Row Level Security
ALTER TABLE transportation_subscriptions ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة وإنشاؤها من جديد
DROP POLICY IF EXISTS "Enable read access for transportation" ON transportation_subscriptions;
DROP POLICY IF EXISTS "Enable insert for transportation" ON transportation_subscriptions;
DROP POLICY IF EXISTS "Enable update for transportation" ON transportation_subscriptions;
DROP POLICY IF EXISTS "Enable delete for transportation" ON transportation_subscriptions;

-- إنشاء السياسات الجديدة
CREATE POLICY "Enable read access for transportation" ON transportation_subscriptions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for transportation" ON transportation_subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for transportation" ON transportation_subscriptions
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for transportation" ON transportation_subscriptions
    FOR DELETE USING (true);

-- إضافة عمود اشتراك المواصلات لجدول التسجيلات الموجود
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') THEN
        -- إضافة عمود المواصلات إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'enrollments' 
            AND column_name = 'has_transportation'
        ) THEN
            ALTER TABLE enrollments ADD COLUMN has_transportation BOOLEAN DEFAULT false;
        END IF;
        
        -- إضافة عمود رسوم المواصلات
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'enrollments' 
            AND column_name = 'transportation_fee'
        ) THEN
            ALTER TABLE enrollments ADD COLUMN transportation_fee DECIMAL(10,2) DEFAULT 0.00;
        END IF;
    END IF;
END $$;

-- إضافة جدول المسارات (Routes) للمواصلات
CREATE TABLE IF NOT EXISTS transportation_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pickup_locations TEXT[], -- مصفوفة من المواقع
  dropoff_locations TEXT[], -- مصفوفة من المواقع
  schedule JSONB, -- جدول زمني مرن
  capacity INTEGER DEFAULT 0,
  current_students INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إضافة مرجع للمسار في جدول الاشتراكات
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transportation_subscriptions' 
        AND column_name = 'route_id'
    ) THEN
        ALTER TABLE transportation_subscriptions ADD COLUMN route_id UUID REFERENCES transportation_routes(id);
    END IF;
END $$;

-- تفعيل RLS للمسارات
ALTER TABLE transportation_routes ENABLE ROW LEVEL SECURITY;

-- سياسات المسارات
CREATE POLICY "Enable read access for routes" ON transportation_routes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for routes" ON transportation_routes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for routes" ON transportation_routes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for routes" ON transportation_routes
    FOR DELETE USING (true);

-- إدراج بعض المسارات التجريبية
INSERT INTO transportation_routes (name, description, monthly_fee, pickup_locations, dropoff_locations, capacity)
VALUES 
  ('مسار الشرق', 'يغطي المناطق الشرقية من المدينة', 50.00, 
   ARRAY['الحي الأول', 'الحي الثاني', 'السوق الشرقي'], 
   ARRAY['الحي الأول', 'الحي الثاني', 'السوق الشرقي'], 
   20),
  ('مسار الغرب', 'يغطي المناطق الغربية من المدينة', 45.00, 
   ARRAY['الحي الثالث', 'الحي الرابع', 'المركز التجاري'], 
   ARRAY['الحي الثالث', 'الحي الرابع', 'المركز التجاري'], 
   25),
  ('مسار الوسط', 'يغطي وسط المدينة والأحياء المجاورة', 40.00, 
   ARRAY['وسط البلد', 'الحي الخامس', 'منطقة الجامعة'], 
   ARRAY['وسط البلد', 'الحي الخامس', 'منطقة الجامعة'], 
   30)
ON CONFLICT DO NOTHING;