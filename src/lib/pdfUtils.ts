import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFPayment {
  id: string
  amount: number
  payment_date: string
  payment_type: string
  payment_method: string
  receipt_number: string
  notes?: string
  students?: { name: string }
  course_name?: string
}

export interface AcademyInfo {
  name: string
  address: string
  phone: string
  email: string
  logo?: string
}

export const generatePaymentReceiptPDF = async (
  payment: PDFPayment,
  academyInfo: AcademyInfo
): Promise<void> => {
  try {
    // البحث عن عنصر الإيصال
    const receiptElement = document.getElementById('payment-receipt')
    
    if (!receiptElement) {
      throw new Error('عنصر الإيصال غير موجود')
    }

    console.log('تم العثور على عنصر الإيصال')

    // تحويل HTML إلى canvas بأبسط إعدادات
    const canvas = await html2canvas(receiptElement, {
      backgroundColor: 'white'
    })

    // إنشاء PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 190
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)

    // حفظ الملف
    const fileName = `إيصال-دفع-${payment.receipt_number || 'جديد'}.pdf`
    pdf.save(fileName)
    
    console.log('تم إنتاج الإيصال بنجاح!')
    
  } catch (error) {
    console.error('خطأ في إنتاج الإيصال:', error)
    throw error
  }
}

export const sharePaymentReceiptPDF = async (
  payment: PDFPayment,
  academyInfo: AcademyInfo
): Promise<void> => {
  try {
    // التحقق من دعم مشاركة الملفات
    if (!navigator.share) {
      throw new Error('مشاركة الملفات غير مدعومة في هذا المتصفح')
    }

    const receiptElement = document.getElementById('payment-receipt')
    
    if (!receiptElement) {
      throw new Error('عنصر الفاتورة غير موجود')
    }

    // تحويل HTML إلى canvas
    const canvas = await html2canvas(receiptElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    })

    // تحويل canvas إلى blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
      }, 'image/png', 0.9)
    })

    // إنشاء ملف
    const studentName = payment.students?.name || 'غير محدد'
    const receiptNumber = payment.receipt_number || payment.id.slice(0, 8)
    const fileName = `إيصال_دفع_${studentName}.png`
    
    const file = new File([blob], fileName, { type: 'image/png' })

    // مشاركة الملف
    await navigator.share({
      title: 'إيصال دفع - ' + academyInfo.name,
      text: `إيصال دفع للطالب ${studentName} - المبلغ: ${payment.amount} دينار`,
      files: [file]
    })

    console.log('تم مشاركة الإيصال بنجاح!')
    
  } catch (error) {
    console.error('خطأ في مشاركة الإيصال:', error)
    // إذا فشلت المشاركة، نستخدم التحميل العادي
    await generatePaymentReceiptPDF(payment, academyInfo)
  }
}

export const printPaymentReceipt = (): void => {
  try {
    const receiptElement = document.getElementById('payment-receipt')
    
    if (!receiptElement) {
      throw new Error('عنصر الفاتورة غير موجود')
    }

    // إنشاء نافذة طباعة جديدة
    const printWindow = window.open('', '_blank')
    
    if (!printWindow) {
      throw new Error('تعذر فتح نافذة الطباعة')
    }

    // إضافة المحتوى والتنسيق
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إيصال دفع مالي</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: 'Cairo', sans-serif; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${receiptElement.outerHTML}
      </body>
      </html>
    `)
    
    printWindow.document.close()
    
    // انتظار تحميل المحتوى ثم الطباعة
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
    
    console.log('تم إرسال الإيصال للطباعة!')
    
  } catch (error) {
    console.error('خطأ في طباعة الإيصال:', error)
    throw new Error('فشل في طباعة الإيصال. يرجى المحاولة مرة أخرى.')
  }
}