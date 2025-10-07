import jsPDF from 'jspdf'
import 'jspdf-autotable'

export interface ArabicPDFPayment {
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

export interface ArabicPDFAcademy {
  name: string
  address: string
  phone: string
  email: string
}

// دالة لتحويل النص العربي إلى Unicode بشكل صحيح
const processArabicText = (text: string): string => {
  // إذا كان النص يحتوي على أحرف عربية، نستخدم ترميز مختلف
  if (/[\u0600-\u06FF]/.test(text)) {
    // تحويل النص العربي إلى شكل يمكن قراءته في PDF
    return text.split('').reverse().join('') // عكس النص للقراءة الصحيحة
  }
  return text
}

// دالة لمعالجة النص العربي إذا احتجنا لها لاحقاً

export const generateArabicPDF = async (
  payment: ArabicPDFPayment,
  academy: ArabicPDFAcademy
): Promise<void> => {
  try {
    // إنشاء PDF جديد مع دعم Unicode
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm', 
      format: 'a4',
      compress: false
    })
    
    // إعدادات الصفحة
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    const lineHeight = 8
    let currentY = margin

    // تحديد الخط مع دعم Unicode
    pdf.setFont('helvetica')
    pdf.setCharSpace(0.5)

    // ===== HEADER =====
    
    // عنوان الأكاديمية (بالإنجليزية أو كما هو)
    pdf.setFontSize(18)
    pdf.setTextColor(0, 0, 0)
    const academyName = academy.name || 'Academy Name'
    const academyNameWidth = pdf.getTextWidth(academyName)
    pdf.text(academyName, (pageWidth - academyNameWidth) / 2, currentY)
    currentY += lineHeight * 2

    // عنوان الأكاديمية
    pdf.setFontSize(11)
    pdf.setTextColor(80, 80, 80)
    const academyAddress = academy.address || 'Academy Address'
    const academyAddressWidth = pdf.getTextWidth(academyAddress)
    pdf.text(academyAddress, (pageWidth - academyAddressWidth) / 2, currentY)
    currentY += lineHeight * 2.5

    // خط فاصل
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(1)
    pdf.line(margin, currentY, pageWidth - margin, currentY)
    currentY += lineHeight * 2

    // ===== TITLE =====
    
    pdf.setFontSize(20)
    pdf.setTextColor(0, 0, 0)
    const titleEn = 'PAYMENT RECEIPT'
    
    // العنوان بالإنجليزية (واضح)
    const titleEnWidth = pdf.getTextWidth(titleEn)
    pdf.text(titleEn, (pageWidth - titleEnWidth) / 2, currentY)
    currentY += lineHeight * 2.5

    // ===== RECEIPT INFO =====
    
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    
    // رقم الإيصال
    pdf.text(`Receipt No: ${payment.receipt_number}`, margin, currentY)
    currentY += lineHeight * 1.5

    // التاريخ
    const date = new Date(payment.payment_date).toLocaleDateString('en-GB')
    pdf.text(`Date: ${date}`, margin, currentY)
    currentY += lineHeight * 2.5

    // ===== PAYMENT BOX =====
    
    // إطار التفاصيل
    pdf.setDrawColor(150, 150, 150)
    pdf.setFillColor(248, 249, 250)
    const boxHeight = 80
    pdf.rect(margin, currentY, pageWidth - 2 * margin, boxHeight, 'FD')
    
    currentY += lineHeight * 1.5

    // عنوان التفاصيل
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    pdf.text('PAYMENT DETAILS', margin + 5, currentY)
    currentY += lineHeight * 2

    pdf.setFontSize(12)
    
    // ===== DETAILS =====
    
    // اسم الطالب (نحاول عرض النص العربي)
    const studentName = payment.students?.name || 'Not Specified'
    pdf.text(`Student: ${studentName}`, margin + 5, currentY)
    currentY += lineHeight * 1.5

    // المبلغ
    pdf.setFontSize(16)
    pdf.setTextColor(0, 128, 0)
    pdf.text(`Amount: ${payment.amount.toFixed(2)} JD`, margin + 5, currentY)
    currentY += lineHeight * 2

    // تفاصيل إضافية
    pdf.setFontSize(11)
    pdf.setTextColor(60, 60, 60)
    
    // نوع الدفع
    const paymentTypes: { [key: string]: string } = {
      'cash': 'Cash Payment',
      'bank_transfer': 'Bank Transfer',
      'online': 'Online Payment',
      'check': 'Check Payment'
    }
    const paymentType = paymentTypes[payment.payment_type] || payment.payment_type
    pdf.text(`Type: ${paymentType}`, margin + 5, currentY)
    currentY += lineHeight * 1.2

    // طريقة الدفع
    const paymentMethods: { [key: string]: string } = {
      'monthly_fee': 'Monthly Tuition',
      'registration_fee': 'Registration Fee', 
      'books': 'Books & Materials',
      'other': 'Other'
    }
    const paymentMethod = paymentMethods[payment.payment_method] || payment.payment_method
    pdf.text(`Method: ${paymentMethod}`, margin + 5, currentY)
    currentY += lineHeight * 1.2

    // الكورس
    if (payment.course_name) {
      pdf.text(`Course: ${payment.course_name}`, margin + 5, currentY)
      currentY += lineHeight * 1.2
    }

    currentY += lineHeight * 3

    // ===== NOTES =====
    if (payment.notes) {
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Notes: ${payment.notes}`, margin, currentY)
      currentY += lineHeight * 2
    }

    // ===== SIGNATURE =====
    currentY += lineHeight * 4
    
    // خط التوقيع
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.5)
    pdf.line(margin, currentY, margin + 80, currentY)
    
    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)
    pdf.text('Authorized Signature', margin, currentY + 5)

    // تاريخ الإنتاج
    const generatedDate = new Date().toLocaleDateString('en-GB')
    pdf.text(`Generated: ${generatedDate}`, margin + 120, currentY + 5)

    // ===== FOOTER =====
    currentY = pageHeight - 25
    
    pdf.setFontSize(9)
    pdf.setTextColor(120, 120, 120)
    const contactInfo = `Contact: 07 8019 1346`
    const contactWidth = pdf.getTextWidth(contactInfo)
    pdf.text(contactInfo, (pageWidth - contactWidth) / 2, currentY)

    // رقم الصفحة
    pdf.setFontSize(8)
    pdf.text(`Receipt ID: ${payment.id.substring(0, 8)}`, margin, pageHeight - 8)
    pdf.text('Page 1/1', pageWidth - margin - 15, pageHeight - 8)

    // ===== SAVE =====
    
    const fileName = `Receipt-${payment.receipt_number}-${generatedDate.replace(/\//g, '-')}.pdf`
    pdf.save(fileName)

    console.log('Arabic PDF generated successfully!')

  } catch (error) {
    console.error('Error generating Arabic PDF:', error)
    throw new Error('Failed to generate receipt. Please try again.')
  }
}