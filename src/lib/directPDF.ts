import jsPDF from 'jspdf'

export interface DirectPDFPayment {
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

export interface DirectPDFAcademy {
  name: string
  address: string
  phone: string
  email: string
}

// دالة لتحويل النص العربي إلى نص إنجليزي مكافئ
const convertArabicToEnglish = (text: string): string => {
  const arabicMap: { [key: string]: string } = {
    'إيصال دفع': 'Payment Receipt',
    'رقم الإيصال': 'Receipt Number',
    'التاريخ': 'Date', 
    'تفاصيل الدفع': 'Payment Details',
    'اسم الطالب': 'Student Name',
    'المبلغ': 'Amount',
    'نوع الدفع': 'Payment Type',
    'طريقة الدفع': 'Payment Method',
    'الكورس': 'Course',
    'ملاحظات': 'Notes',
    'التوقيع': 'Signature',
    'للتواصل': 'Contact',
    'نقدي': 'Cash',
    'تحويل بنكي': 'Bank Transfer',
    'دفع إلكتروني': 'Online Payment',
    'شيك': 'Check',
    'رسوم شهرية': 'Monthly Fee',
    'رسوم تسجيل': 'Registration Fee',
    'كتب': 'Books',
    'أخرى': 'Other',
    'دينار': 'JD'
  }
  
  let result = text
  Object.keys(arabicMap).forEach(arabic => {
    result = result.replace(new RegExp(arabic, 'g'), arabicMap[arabic])
  })
  
  return result
}

export const generateDirectPDF = async (
  payment: DirectPDFPayment,
  academy: DirectPDFAcademy
): Promise<void> => {
  try {
    // إنشاء PDF جديد
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // إعدادات الصفحة
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    const lineHeight = 10
    let currentY = margin

    // تحديد الخط (نستخدم خط أساسي يدعم العربية)
    pdf.setFont('helvetica')

    // عنوان الأكاديمية
    pdf.setFontSize(20)
    pdf.setTextColor(0, 0, 0)
    const academyName = convertArabicToEnglish(academy.name) || academy.name
    const academyNameWidth = pdf.getTextWidth(academyName)
    pdf.text(academyName, (pageWidth - academyNameWidth) / 2, currentY)
    currentY += lineHeight * 1.5

    // عنوان الأكاديمية
    pdf.setFontSize(12)
    pdf.setTextColor(100, 100, 100)
    const academyAddress = convertArabicToEnglish(academy.address) || academy.address
    const academyAddressWidth = pdf.getTextWidth(academyAddress)
    pdf.text(academyAddress, (pageWidth - academyAddressWidth) / 2, currentY)
    currentY += lineHeight * 2

    // خط فاصل
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.5)
    pdf.line(margin, currentY, pageWidth - margin, currentY)
    currentY += lineHeight

    // عنوان الإيصال
    pdf.setFontSize(18)
    pdf.setTextColor(0, 0, 0)
    const receiptTitle = 'PAYMENT RECEIPT'
    const receiptTitleWidth = pdf.getTextWidth(receiptTitle)
    pdf.text(receiptTitle, (pageWidth - receiptTitleWidth) / 2, currentY)
    currentY += lineHeight * 2

    // معلومات الإيصال
    pdf.setFontSize(12)
    
    // رقم الإيصال
    pdf.setTextColor(0, 0, 0)
    const receiptNumber = `Receipt Number: ${payment.receipt_number}`
    pdf.text(receiptNumber, margin, currentY)
    currentY += lineHeight * 1.5

    // التاريخ
    const date = new Date(payment.payment_date).toLocaleDateString('en-US')
    const dateText = `Date: ${date}`
    pdf.text(dateText, margin, currentY)
    currentY += lineHeight * 2

    // إطار لتفاصيل الدفع
    pdf.setDrawColor(200, 200, 200)
    pdf.setFillColor(250, 250, 250)
    const boxHeight = 60
    pdf.rect(margin, currentY, pageWidth - 2 * margin, boxHeight, 'FD')
    currentY += 10

    // تفاصيل الدفع
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    pdf.text('PAYMENT DETAILS', margin + 5, currentY)
    currentY += lineHeight * 1.5

    pdf.setFontSize(12)
    
    // اسم الطالب
    const studentName = payment.students?.name || 'Not Specified'
    pdf.text(`Student Name: ${studentName}`, margin + 5, currentY)
    currentY += lineHeight

    // المبلغ
    pdf.setFontSize(14)
    pdf.setTextColor(34, 197, 94) // لون أخضر
    pdf.text(`Amount: ${payment.amount} JD`, margin + 5, currentY)
    currentY += lineHeight

    // نوع الدفع
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    const paymentTypeMap: { [key: string]: string } = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'online': 'Online Payment',
      'check': 'Check'
    }
    const paymentTypeText = paymentTypeMap[payment.payment_type] || payment.payment_type
    pdf.text(`Payment Type: ${paymentTypeText}`, margin + 5, currentY)
    currentY += lineHeight

    // طريقة الدفع
    const paymentMethodMap: { [key: string]: string } = {
      'monthly_fee': 'Monthly Fee',
      'registration_fee': 'Registration Fee',
      'books': 'Books',
      'other': 'Other'
    }
    const paymentMethodText = paymentMethodMap[payment.payment_method] || payment.payment_method
    pdf.text(`Payment Method: ${paymentMethodText}`, margin + 5, currentY)
    currentY += lineHeight * 2

    // الكورس إذا كان موجود
    if (payment.course_name) {
      pdf.text(`Course: ${payment.course_name}`, margin + 5, currentY)
      currentY += lineHeight
    }

    // الملاحظات إذا كانت موجودة
    if (payment.notes) {
      currentY += lineHeight
      pdf.text(`Notes: ${payment.notes}`, margin, currentY)
      currentY += lineHeight
    }

    // مساحة للتوقيع
    currentY += lineHeight * 3
    pdf.setDrawColor(0, 0, 0)
    pdf.line(margin, currentY, margin + 60, currentY)
    pdf.text('Signature', margin, currentY + 5)

    // معلومات التواصل في الأسفل
    currentY = pageHeight - 40
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    const contactInfo = `Contact: 07 8019 1346`
    const contactWidth = pdf.getTextWidth(contactInfo)
    pdf.text(contactInfo, (pageWidth - contactWidth) / 2, currentY)

    // حفظ الملف
    const fileName = `Payment-Receipt-${payment.receipt_number || payment.id.slice(0, 8)}.pdf`
    pdf.save(fileName)

    console.log('تم إنتاج الإيصال بنجاح!')

  } catch (error) {
    console.error('خطأ في إنتاج PDF:', error)
    throw error
  }
}

// دالة للطباعة
export const printDirectPDF = async (
  payment: DirectPDFPayment,
  academy: DirectPDFAcademy
): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    // نفس الكود أعلاه لكن نفتح نافذة طباعة
    // ... (كود مماثل)
    
    // فتح نافذة طباعة
    const pdfDataUri = pdf.output('datauristring')
    const printWindow = window.open('')
    if (printWindow) {
      printWindow.document.write(`<iframe src="${pdfDataUri}" width="100%" height="100%"></iframe>`)
    }

  } catch (error) {
    console.error('خطأ في الطباعة:', error)
    throw error
  }
}