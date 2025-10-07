export interface CanvasPDFPayment {
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

export interface CanvasPDFAcademy {
  name: string
  address: string
  phone: string
  email: string
}

// دالة لرسم إيصال على Canvas ثم تحويله لـ PDF
export const generateCanvasPDF = async (
  payment: CanvasPDFPayment,
  academy: CanvasPDFAcademy
): Promise<void> => {
  try {
    // إنشاء canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Canvas not supported')
    }

    // إعدادات Canvas
    canvas.width = 800
    canvas.height = 1000
    
    // خلفية بيضاء
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // إعدادات الخط والألوان
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.direction = 'rtl' // دعم RTL للعربية
    
    let currentY = 60

    // === HEADER ===
    
    // عنوان الأكاديمية
    ctx.font = 'bold 28px Arial, Tahoma, sans-serif'
    ctx.fillText(academy.name, canvas.width / 2, currentY)
    currentY += 50
    
    // عنوان الأكاديمية
    ctx.font = '18px Arial, Tahoma, sans-serif'
    ctx.fillStyle = '#666666'
    ctx.fillText(academy.address, canvas.width / 2, currentY)
    currentY += 60
    
    // خط فاصل
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(50, currentY)
    ctx.lineTo(canvas.width - 50, currentY)
    ctx.stroke()
    currentY += 50

    // === TITLE ===
    
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 32px Arial, Tahoma, sans-serif'
    ctx.fillText('إيصال دفع - Payment Receipt', canvas.width / 2, currentY)
    currentY += 70

    // === INFO ===
    
    ctx.font = '20px Arial, Tahoma, sans-serif'
    ctx.textAlign = 'right'
    
    // رقم الإيصال
    ctx.fillText(`رقم الإيصال: ${payment.receipt_number}`, canvas.width - 60, currentY)
    currentY += 35
    
    // التاريخ بالميلادي
    const date = new Date(payment.payment_date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    })
    ctx.fillText(`التاريخ: ${date}`, canvas.width - 60, currentY)
    currentY += 60

    // === PAYMENT BOX ===
    
    // إطار التفاصيل
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(60, currentY, canvas.width - 120, 280)
    ctx.strokeStyle = '#dee2e6'
    ctx.lineWidth = 2
    ctx.strokeRect(60, currentY, canvas.width - 120, 280)
    
    currentY += 50
    
    // عنوان التفاصيل
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 24px Arial, Tahoma, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('تفاصيل الدفع', canvas.width / 2, currentY)
    currentY += 50

    // === DETAILS ===
    
    ctx.font = '22px Arial, Tahoma, sans-serif'
    ctx.textAlign = 'right'
    
    // اسم الطالب
    const studentName = payment.students?.name || 'غير محدد'
    ctx.fillText(`اسم الطالب: ${studentName}`, canvas.width - 100, currentY)
    currentY += 40

    // المبلغ
    ctx.fillStyle = '#28a745'
    ctx.font = 'bold 26px Arial, Tahoma, sans-serif'
    ctx.fillText(`المبلغ: ${payment.amount} دينار`, canvas.width - 100, currentY)
    currentY += 40

    // نوع الدفع
    ctx.fillStyle = '#000000'
    ctx.font = '20px Arial, Tahoma, sans-serif'
    const paymentTypeMap: { [key: string]: string } = {
      'cash': 'نقدي',
      'bank_transfer': 'تحويل بنكي',
      'online': 'دفع إلكتروني',
      'check': 'شيك'
    }
    const paymentType = paymentTypeMap[payment.payment_type] || payment.payment_type
    ctx.fillText(`نوع الدفع: ${paymentType}`, canvas.width - 100, currentY)
    currentY += 35

    // طريقة الدفع
    const paymentMethodMap: { [key: string]: string } = {
      'monthly_fee': 'رسوم شهرية',
      'registration_fee': 'رسوم تسجيل',
      'books': 'كتب',
      'other': 'أخرى'
    }
    const paymentMethod = paymentMethodMap[payment.payment_method] || payment.payment_method
    ctx.fillText(`طريقة الدفع: ${paymentMethod}`, canvas.width - 100, currentY)
    currentY += 35

    // الكورس
    if (payment.course_name) {
      ctx.fillText(`الكورس: ${payment.course_name}`, canvas.width - 100, currentY)
      currentY += 35
    }

    currentY += 80

    // === NOTES ===
    if (payment.notes) {
      ctx.fillText(`ملاحظات: ${payment.notes}`, canvas.width - 100, currentY)
      currentY += 60
    }

    // === SIGNATURE ===
    currentY += 80
    
    ctx.fillStyle = '#000000'
    ctx.font = '18px Arial, Tahoma, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('التوقيع: ________________', canvas.width - 100, currentY)

    // === FOOTER ===
    currentY = canvas.height - 60
    
    ctx.font = '16px Arial, Tahoma, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#666666'
    ctx.fillText(`للتواصل: 07 8019 1346`, canvas.width / 2, currentY)

    // === تحويل إلى PDF ===
    
    // استيراد jsPDF ديناميكياً
    const { default: jsPDF } = await import('jspdf')
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    })

    // إضافة الـ canvas كصورة
    const imgData = canvas.toDataURL('image/png', 1.0)
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)

    // حفظ الملف
    const fileName = `إيصال-دفع-${payment.receipt_number}-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

    console.log('تم إنتاج الإيصال بنجاح!')

  } catch (error) {
    console.error('خطأ في إنتاج الإيصال:', error)
    throw new Error('فشل في إنتاج الإيصال. يرجى المحاولة مرة أخرى.')
  }
}

// دالة لطباعة الإيصال
export const printCanvasPDF = async (
  payment: CanvasPDFPayment,
  academy: CanvasPDFAcademy
): Promise<void> => {
  try {
    // نفس منطق الرسم
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // ... نفس كود الرسم أعلاه ...
    
    // فتح نافذة طباعة جديدة
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>إيصال دفع</title></head>
          <body style="margin:0; padding:20px;">
            <img src="${canvas.toDataURL()}" style="width:100%; height:auto;" />
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }

  } catch (error) {
    console.error('خطأ في الطباعة:', error)
  }
}