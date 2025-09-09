# 🌐 دليل نشر الموقع على Netlify

## خطوات النشر:

### 1️⃣ إعداد الكود للنشر:
```bash
cd "C:\Users\amrabdullah\Documents\بساط العلم\academy-finance"
git add .
git commit -m "Deploy to Netlify"
git push origin master
```

### 2️⃣ إنشاء حساب على Netlify:
- اذهب إلى: https://netlify.com
- سجل دخول بـ GitHub

### 3️⃣ إضافة الموقع:
- اضغط **"Add new site"** → **"Import an existing project"**
- اختر **GitHub** واختر مستودع `academy-finance`

### 4️⃣ إعدادات البناء:
```
Build command: npm run build
Publish directory: .next
Base directory: (اتركه فارغ)
```

### 5️⃣ إضافة متغيرات البيئة:
بعد النشر، اذهب إلى **Site settings** → **Environment variables**:

```
NEXT_PUBLIC_SUPABASE_URL = https://wyaweaunabutzpsnogti.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YXdlYXVuYWJ1dHpwc25vZ3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMTY3NjEsImV4cCI6MjA3Mjg5Mjc2MX0.jqXqTS2uCiZCNzO9u71im6DcQu621RiPsIaZYKIYlC0
NEXT_PUBLIC_APP_NAME = نظام إدارة الأكاديمية المالي
NEXT_PUBLIC_APP_VERSION = 1.0.0
```

### 6️⃣ إعادة النشر:
- بعد إضافة المتغيرات اضغط **"Trigger deploy"**

## ✅ المميزات:
- ✅ نشر مجاني
- ✅ HTTPS تلقائي
- ✅ CDN عالمي
- ✅ لا يطلب تسجيل دخول من الزوار
- ✅ نشر تلقائي عند التحديث

## 🔗 النتيجة:
ستحصل على رابط مثل: `https://your-site-name.netlify.app`
