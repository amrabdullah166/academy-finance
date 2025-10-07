import React from 'react'

interface SimplePDFReceiptProps {
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
  }
}

export const SimplePDFReceipt: React.FC<SimplePDFReceiptProps> = ({ 
  payment, 
  academyInfo 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar')
  }

  const formatCurrency = (amount: number) => {
    return `${amount} دينار`
  }

  return (
    <div 
      id="payment-receipt"
      style={{
        width: '800px',
        backgroundColor: 'white',
        color: 'black',
        fontFamily: 'Arial',
        fontSize: '16px',
        direction: 'rtl',
        padding: '30px'
      }}
    >
      {/* العنوان */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>
          {academyInfo.name}
        </h1>
        <p style={{ margin: '0', color: 'gray' }}>
          {academyInfo.address}
        </p>
      </div>

      {/* عنوان الفاتورة */}
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '20px', 
        textAlign: 'center',
        marginBottom: '30px' 
      }}>
        <h2 style={{ margin: '0', fontSize: '20px' }}>
          إيصال دفع
        </h2>
        <p style={{ margin: '10px 0 0 0' }}>
          رقم الإيصال: {payment.receipt_number}
        </p>
      </div>

      {/* تفاصيل الدفع */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ borderBottom: '1px solid black', paddingBottom: '10px' }}>
          تفاصيل الدفع
        </h3>
        
        <div style={{ margin: '20px 0' }}>
          <strong>اسم الطالب:</strong> {payment.students?.name || 'غير محدد'}
        </div>
        
        <div style={{ margin: '20px 0' }}>
          <strong>المبلغ:</strong> {formatCurrency(payment.amount)}
        </div>
        
        <div style={{ margin: '20px 0' }}>
          <strong>تاريخ الدفع:</strong> {formatDate(payment.payment_date)}
        </div>
        
        <div style={{ margin: '20px 0' }}>
          <strong>طريقة الدفع:</strong> {payment.payment_type}
        </div>

        {payment.course_name && (
          <div style={{ margin: '20px 0' }}>
            <strong>الكورس:</strong> {payment.course_name}
          </div>
        )}

        {payment.notes && (
          <div style={{ margin: '20px 0' }}>
            <strong>ملاحظات:</strong> {payment.notes}
          </div>
        )}
      </div>

      {/* التوقيع */}
      <div style={{ 
        marginTop: '50px', 
        textAlign: 'left',
        borderTop: '1px solid black',
        paddingTop: '20px'
      }}>
        <p>التوقيع: ________________</p>
        <p>التاريخ: {formatDate(new Date().toISOString())}</p>
      </div>

      {/* معلومات التواصل */}
      <div style={{ 
        marginTop: '30px', 
        fontSize: '14px', 
        color: 'gray',
        textAlign: 'center' 
      }}>
        <p>للاستفسار: {academyInfo.phone} | {academyInfo.email}</p>
      </div>
    </div>
  )
}