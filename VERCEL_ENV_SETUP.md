# إعداد متغيرات البيئة على Vercel

## الخطوات:

1. **انتقل إلى مشروعك على Vercel:**
   - https://vercel.com/dashboard
   - اختر مشروع `academy-finance`

2. **انتقل إلى Settings > Environment Variables**

3. **أضف المتغيرات التالية:**

### Production Environment Variables:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://wyaweaunabutzpsnogti.supabase.co
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YXdlYXVuYWJ1dHpwc25vZ3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMTY3NjEsImV4cCI6MjA3Mjg5Mjc2MX0.jqXqTS2uCiZCNzO9u71im6DcQu621RiPsIaZYKIYlC0
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_APP_NAME
Value: نظام إدارة الأكاديمية المالي
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_APP_VERSION
Value: 1.0.0
Environment: Production, Preview, Development
```

4. **بعد إضافة المتغيرات:**
   - اضغط "Redeploy" لإعادة النشر
   - أو ارفع أي تغيير جديد لتفعيل إعادة النشر

## ملاحظة مهمة:
- يجب أن تكون البادئة `NEXT_PUBLIC_` موجودة في جميع المتغيرات المراد استخدامها في الـ client-side
- تأكد من اختيار جميع البيئات (Production, Preview, Development) لكل متغير
