import React from 'react'
import { FiFileText, FiCheck, FiCalendar, FiCreditCard } from 'react-icons/fi'

interface PaymentReceiptProps {
  payment: {
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
  academyInfo: {
    name: string
    address: string
    phone: string
    email: string
    logo?: string
  }
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ 
  payment, 
  academyInfo 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} دينار`
  }

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case 'cash': return 'نقدي'
      case 'bank_transfer': return 'تحويل بنكي'
      case 'online': return 'دفع إلكتروني'
      case 'check': return 'شيك'
      default: return type
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'monthly_fee': return 'رسوم شهرية'
      case 'registration_fee': return 'رسوم تسجيل'
      case 'books': return 'كتب'
      case 'other': return 'أخرى'
      default: return method
    }
  }

  return (
    <div id="payment-receipt" className="bg-white p-8 max-w-2xl mx-auto font-cairo" dir="rtl" style={{
      backgroundColor: '#ffffff',
      padding: '32px',
      maxWidth: '672px',
      margin: '0 auto',
      fontFamily: 'Cairo, Arial, sans-serif',
      direction: 'rtl'
    }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-300 pb-6 mb-6" style={{
        textAlign: 'center',
        borderBottom: '2px solid #d1d5db',
        paddingBottom: '24px',
        marginBottom: '24px'
      }}>
        <div className="flex items-center justify-center gap-4 mb-4">
          {academyInfo.logo && (
            <img 
              src={academyInfo.logo} 
              alt="شعار الأكاديمية" 
              className="w-16 h-16 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{academyInfo.name}</h1>
            <p className="text-gray-600 text-sm">{academyInfo.address}</p>
          </div>
        </div>
        <div className="flex justify-center items-center gap-2 text-green-600 mb-2">
          <FiCheck className="text-xl" />
          <h2 className="text-xl font-semibold">إيصال دفع مالي</h2>
        </div>
        <p className="text-gray-500 text-sm">Payment Receipt</p>
      </div>

      {/* Receipt Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FiFileText className="text-blue-600" />
            <span className="font-semibold text-gray-700">رقم الإيصال</span>
          </div>
          <p className="text-lg font-bold text-gray-900">#{payment.receipt_number || payment.id.slice(0, 8).toUpperCase()}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FiCalendar className="text-blue-600" />
            <span className="font-semibold text-gray-700">تاريخ الدفع</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatDate(payment.payment_date)}</p>
        </div>
      </div>

      {/* Student & Course Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-blue-800 mb-4 text-lg">تفاصيل الطالب والدورة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600 block mb-1">اسم الطالب:</span>
            <p className="font-semibold text-gray-900">{payment.students?.name || 'غير محدد'}</p>
          </div>
          {payment.course_name && (
            <div>
              <span className="text-gray-600 block mb-1">الدورة:</span>
              <p className="font-semibold text-gray-900">{payment.course_name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-green-800 mb-4 text-lg">تفاصيل الدفع</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <span className="text-gray-600 block mb-1">المبلغ المدفوع:</span>
            <p className="font-bold text-2xl text-green-600">{formatCurrency(payment.amount)}</p>
          </div>
          <div>
            <span className="text-gray-600 block mb-1">طريقة الدفع:</span>
            <div className="flex items-center gap-2">
              <FiCreditCard className="text-green-600" />
              <p className="font-semibold text-gray-900">{getPaymentTypeText(payment.payment_type)}</p>
            </div>
          </div>
          <div>
            <span className="text-gray-600 block mb-1">نوع الدفع:</span>
            <p className="font-semibold text-gray-900">{getPaymentMethodText(payment.payment_method)}</p>
          </div>
        </div>
        {payment.notes && (
          <div>
            <span className="text-gray-600 block mb-1">ملاحظات:</span>
            <p className="text-gray-900 bg-white p-3 rounded border">{payment.notes}</p>
          </div>
        )}
      </div>

      {/* Academy Contact Info */}
      <div className="border-t-2 border-gray-300 pt-6">
        <h4 className="font-bold text-gray-700 mb-3">معلومات التواصل</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <strong>الهاتف:</strong> {academyInfo.phone}
          </div>
          <div>
            <strong>البريد الإلكتروني:</strong> {academyInfo.email}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pt-4 border-t border-gray-200">
        <p className="text-gray-500 text-sm">
          تم إنتاج هذا الإيصال تلقائياً في {new Date().toLocaleDateString('ar-SA')}
        </p>
        <p className="text-gray-400 text-xs mt-2">
          نشكركم لثقتكم في {academyInfo.name}
        </p>
      </div>
    </div>
  )
}