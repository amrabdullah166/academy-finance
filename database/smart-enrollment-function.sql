-- حل بديل: تحديث السجل الموجود بدلاً من إنشاء سجل جديد
-- هذا ملف SQL إضافي لتحديث منطق التطبيق

-- دالة للتحقق من وجود تسجيل سابق وإعادة تفعيله
CREATE OR REPLACE FUNCTION smart_enroll_student(
    p_student_id UUID,
    p_course_id UUID,
    p_has_transportation BOOLEAN DEFAULT false
) RETURNS TABLE (
    enrollment_id UUID,
    is_new_enrollment BOOLEAN,
    message TEXT
) AS $$
DECLARE
    existing_enrollment UUID;
    course_fees RECORD;
    monthly_fee_amount DECIMAL(10,2);
    registration_fee_amount DECIMAL(10,2);
BEGIN
    -- 1. البحث عن تسجيل موجود
    SELECT id INTO existing_enrollment
    FROM student_courses 
    WHERE student_id = p_student_id 
    AND course_id = p_course_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- 2. جلب رسوم الدورة
    SELECT monthly_fee, registration_fee, transportation_fee 
    INTO course_fees
    FROM courses 
    WHERE id = p_course_id;
    
    -- 3. حساب الرسوم
    monthly_fee_amount := course_fees.monthly_fee + 
        CASE WHEN p_has_transportation THEN COALESCE(course_fees.transportation_fee, 0) ELSE 0 END;
    registration_fee_amount := COALESCE(course_fees.registration_fee, 0);
    
    IF existing_enrollment IS NOT NULL THEN
        -- تحديث التسجيل الموجود
        UPDATE student_courses 
        SET 
            status = 'enrolled',
            enrollment_date = CURRENT_DATE,
            completion_date = NULL,
            has_transportation = p_has_transportation,
            monthly_fee = monthly_fee_amount,
            registration_fee = registration_fee_amount,
            registration_fee_paid = false,
            updated_at = NOW()
        WHERE id = existing_enrollment;
        
        RETURN QUERY SELECT 
            existing_enrollment,
            false,
            'تم إعادة تفعيل التسجيل الموجود'::TEXT;
    ELSE
        -- إنشاء تسجيل جديد
        INSERT INTO student_courses (
            student_id, course_id, status, enrollment_date,
            has_transportation, monthly_fee, registration_fee, registration_fee_paid
        ) VALUES (
            p_student_id, p_course_id, 'enrolled', CURRENT_DATE,
            p_has_transportation, monthly_fee_amount, registration_fee_amount, false
        ) RETURNING id INTO existing_enrollment;
        
        RETURN QUERY SELECT 
            existing_enrollment,
            true,
            'تم إنشاء تسجيل جديد'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- مثال للاستخدام:
-- SELECT * FROM smart_enroll_student('student-uuid', 'course-uuid', true);