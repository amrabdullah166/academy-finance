# نظام إدارة الأكاديمية المالي

This is a [Next.js](https://nextjs.org) project for managing academy finances, built with TypeScript and Supabase.

## Features

- 📊 **Dashboard**: Overview of academy statistics and activities
- 👥 **Student Management**: Add, edit, and track student information
- 📚 **Course Management**: Manage courses, fees, and enrollments
- 💰 **Payment Tracking**: Record and monitor student payments
- 👨‍💼 **Employee Management**: Manage staff and salary records
- 💸 **Expense Tracking**: Track academy expenses and categories
- 📈 **Reports**: Generate financial reports and analytics
- ⚙️ **Settings**: Configure system preferences

## Environment Variables Setup

### For Vercel Deployment

You need to set the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_NAME=نظام إدارة الأكاديمية المالي
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Note**: Get your Supabase URL and anon key from your [Supabase project dashboard](https://supabase.com/dashboard).

### For Local Development

1. Copy `.env.example` to `.env.local`
2. Replace the placeholder values with your actual Supabase credentials
3. The app will work with mock data if Supabase is not configured

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Build and Deploy

### Local Build

```bash
npm run build
```

### Deploy to Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1. Connect your GitHub repository to Vercel
2. Set the required environment variables
3. Deploy automatically on every push

## Database Schema

The app uses Supabase with the following main tables:
- `students` - Student information
- `courses` - Course details and pricing
- `payments` - Payment records
- `expenses` - Academy expenses
- `employees` - Staff information
- `student_courses` - Enrollment relationships

## Fallback Mode

The application includes fallback mechanisms:
- ✅ Works with mock data when Supabase is not configured
- ✅ Graceful error handling for database operations
- ✅ Static generation support for better performance

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
