# نظام إدارة الأكاديمية المالي

This is a [Next.js](https://nextjs.org) project for managing academy finances, built with TypeScript and Supabase.

## Environment Variables Setup

### For Vercel Deployment

You need to set the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wyaweaunabutzpsnogti.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YXdlYXVuYWJ1dHpwc25vZ3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMTY3NjEsImV4cCI6MjA3Mjg5Mjc2MX0.jqXqTS2uCiZCNzO9u71im6DcQu621RiPsIaZYKIYlC0
NEXT_PUBLIC_APP_NAME=نظام إدارة الأكاديمية المالي
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### For Local Development

Create a `.env.local` file in the project root with the same variables as shown in `.env.example`.

## Getting Started

First, run the development server:

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
