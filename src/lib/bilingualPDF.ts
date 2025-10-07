import jsPDF from 'jspdf'

export interface BilingualPDFPayment {
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

export interface BilingualPDFAcademy {
  name: string
  address: string
  phone: string
  email: string
}

export const generateBilingualPDF = async (
  payment: BilingualPDFPayment,
  academy: BilingualPDFAcademy
): Promise<void> => {
  try {
    // إنشاء PDF جديد
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // إعدادات الصفحة
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    const lineHeight = 8
    let currentY = margin

    // تحديد الخط
    pdf.setFont('helvetica')

    // عنوان الأكاديمية
    pdf.setFontSize(20)
    pdf.setTextColor(0, 0, 0)
    const academyName = academy.name
    const academyNameWidth = pdf.getTextWidth(academyName)
    pdf.text(academyName, (pageWidth - academyNameWidth) / 2, currentY)
    currentY += lineHeight * 2

    // عنوان الأكاديمية
    pdf.setFontSize(12)
    pdf.setTextColor(100, 100, 100)
    const academyAddress = academy.address
    const academyAddressWidth = pdf.getTextWidth(academyAddress)
    pdf.text(academyAddress, (pageWidth - academyAddressWidth) / 2, currentY)
    currentY += lineHeight * 2.5

    // خط فاصل
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.5)
    pdf.line(margin, currentY, pageWidth - margin, currentY)
    currentY += lineHeight * 1.5

    // عنوان الإيصال مزدوج اللغة
    pdf.setFontSize(18)
    pdf.setTextColor(0, 0, 0)
    const receiptTitleEn = 'PAYMENT RECEIPT'
    const receiptTitleEnWidth = pdf.getTextWidth(receiptTitleEn)
    pdf.text(receiptTitleEn, (pageWidth - receiptTitleEnWidth) / 2, currentY)
    currentY += lineHeight * 3

    // معلومات الإيصال
    pdf.setFontSize(12)
    
    // رقم الإيصال
    pdf.setTextColor(0, 0, 0)
    pdf.text(`Receipt Number: ${payment.receipt_number}`, margin, currentY)
    currentY += lineHeight * 1.2

    // التاريخ
    const date = new Date(payment.payment_date).toLocaleDateString('en-GB')
    pdf.text(`Date: ${date}`, margin, currentY)
    currentY += lineHeight * 2

    // إطار لتفاصيل الدفع
    pdf.setDrawColor(200, 200, 200)
    pdf.setFillColor(250, 250, 250)
    const boxHeight = 70
    pdf.rect(margin, currentY, pageWidth - 2 * margin, boxHeight, 'FD')
    currentY += lineHeight * 1.5

    // تفاصيل الدفع
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    pdf.text('PAYMENT DETAILS', margin + 5, currentY)
    currentY += lineHeight * 2

    pdf.setFontSize(12)
    
    // اسم الطالب
    const studentName = payment.students?.name || 'Not Specified'
    pdf.text(`Student Name: ${studentName}`, margin + 5, currentY)
    currentY += lineHeight * 1.2

    // المبلغ
    pdf.setFontSize(14)
    pdf.setTextColor(0, 150, 0) // لون أخضر
    pdf.text(`Amount: ${payment.amount.toFixed(2)} JD`, margin + 5, currentY)
    currentY += lineHeight * 1.5

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
    currentY += lineHeight * 1.2

    // طريقة الدفع
    const paymentMethodMap: { [key: string]: string } = {
      'monthly_fee': 'Monthly Fee',
      'registration_fee': 'Registration Fee',
      'books': 'Books',
      'other': 'Other'
    }
    const paymentMethodText = paymentMethodMap[payment.payment_method] || payment.payment_method
    pdf.text(`Payment Method: ${paymentMethodText}`, margin + 5, currentY)
    currentY += lineHeight * 1.2

    // الكورس إذا كان موجود
    if (payment.course_name) {
      pdf.text(`Course: ${payment.course_name}`, margin + 5, currentY)
      currentY += lineHeight * 1.2
    }

    currentY += lineHeight * 2

    // الملاحظات إذا كانت موجودة
    if (payment.notes) {
      currentY += lineHeight
      pdf.text(`Notes: ${payment.notes}`, margin, currentY)
      currentY += lineHeight * 2
    }

    // مساحة للتوقيع
    currentY += lineHeight * 4
    pdf.setDrawColor(0, 0, 0)
    pdf.line(margin, currentY, margin + 80, currentY)
    pdf.text('Authorized Signature', margin, currentY + 5)

    // التاريخ والوقت
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, margin + 120, currentY + 5)

    // معلومات التواصل في الأسفل
    currentY = pageHeight - 30
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    const contactInfo = `Contact: 07 8019 1346`
    const contactWidth = pdf.getTextWidth(contactInfo)
    pdf.text(contactInfo, (pageWidth - contactWidth) / 2, currentY)

    // رقم الصفحة
    pdf.text('Page 1 of 1', pageWidth - margin - 20, pageHeight - 10)

    // حفظ الملف
    const fileName = `Payment-Receipt-${payment.receipt_number}-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

    console.log('PDF generated successfully!')

  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}