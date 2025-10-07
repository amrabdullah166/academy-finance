import React from 'react'

interface SimpleReceiptProps {
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

export const SimpleReceipt: React.FC<SimpleReceiptProps> = ({ 
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

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '32px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    direction: 'rtl',
    color: '#000000'
  }

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    borderBottom: '2px solid #cccccc',
    paddingBottom: '24px',
    marginBottom: '24px'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#000000',
    margin: '8px 0'
  }

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#f5f5f5',
    border: '1px solid #dddddd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px'
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '16px'
  }

  return (
    <div id="payment-receipt" style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>{academyInfo.name}</h1>
        <p style={{ color: '#666666', fontSize: '14px', margin: '4px 0' }}>{academyInfo.address}</p>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#22c55e', margin: '16px 0' }}>
          ✓ إيصال دفع مالي
        </h2>
        <p style={{ color: '#888888', fontSize: '12px' }}>Payment Receipt</p>
      </div>

      {/* Receipt Details */}
      <div style={gridStyle}>
        <div style={sectionStyle}>
          <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
            📄 رقم الإيصال
          </div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#000000', margin: '0' }}>
            #{payment.receipt_number || payment.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        
        <div style={sectionStyle}>
          <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
            📅 تاريخ الدفع
          </div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#000000', margin: '0' }}>
            {formatDate(payment.payment_date)}
          </p>
        </div>
      </div>

      {/* Student & Course Info */}
      <div style={{
        ...sectionStyle,
        backgroundColor: '#dbeafe',
        borderColor: '#93c5fd'
      }}>
        <h3 style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '16px', fontSize: '18px' }}>
          تفاصيل الطالب والدورة
        </h3>
        <div style={gridStyle}>
          <div>
            <span style={{ color: '#666666', display: 'block', marginBottom: '4px' }}>اسم الطالب:</span>
            <p style={{ fontWeight: 'bold', color: '#000000', margin: '0' }}>
              {payment.students?.name || 'غير محدد'}
            </p>
          </div>
          {payment.course_name && (
            <div>
              <span style={{ color: '#666666', display: 'block', marginBottom: '4px' }}>الدورة:</span>
              <p style={{ fontWeight: 'bold', color: '#000000', margin: '0' }}>
                {payment.course_name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div style={{
        ...sectionStyle,
        backgroundColor: '#dcfce7',
        borderColor: '#86efac'
      }}>
        <h3 style={{ fontWeight: 'bold', color: '#15803d', marginBottom: '16px', fontSize: '18px' }}>
          تفاصيل الدفع
        </h3>
        <div style={gridStyle}>
          <div>
            <span style={{ color: '#666666', display: 'block', marginBottom: '4px' }}>المبلغ المدفوع:</span>
            <p style={{ fontWeight: 'bold', fontSize: '24px', color: '#16a34a', margin: '0' }}>
              {formatCurrency(payment.amount)}
            </p>
          </div>
          <div>
            <span style={{ color: '#666666', display: 'block', marginBottom: '4px' }}>طريقة الدفع:</span>
            <p style={{ fontWeight: 'bold', color: '#000000', margin: '0' }}>
              💳 {getPaymentTypeText(payment.payment_type)}
            </p>
          </div>
          <div>
            <span style={{ color: '#666666', display: 'block', marginBottom: '4px' }}>نوع الدفع:</span>
            <p style={{ fontWeight: 'bold', color: '#000000', margin: '0' }}>
              {getPaymentMethodText(payment.payment_method)}
            </p>
          </div>
        </div>
        {payment.notes && (
          <div style={{ marginTop: '16px' }}>
            <span style={{ color: '#666666', display: 'block', marginBottom: '4px' }}>ملاحظات:</span>
            <p style={{ 
              color: '#000000', 
              backgroundColor: '#ffffff', 
              padding: '12px', 
              borderRadius: '4px', 
              border: '1px solid #dddddd',
              margin: '0'
            }}>
              {payment.notes}
            </p>
          </div>
        )}
      </div>

      {/* Academy Contact Info */}
      <div style={{
        borderTop: '2px solid #cccccc',
        paddingTop: '24px',
        marginTop: '24px'
      }}>
        <h4 style={{ fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>معلومات التواصل</h4>
        <div style={gridStyle}>
          <div>
            <strong>الهاتف:</strong> {academyInfo.phone}
          </div>
          <div>
            <strong>البريد الإلكتروني:</strong> {academyInfo.email}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '32px', 
        paddingTop: '16px', 
        borderTop: '1px solid #dddddd'
      }}>
        <p style={{ color: '#888888', fontSize: '12px', margin: '0 0 8px 0' }}>
          تم إنتاج هذا الإيصال تلقائياً في {new Date().toLocaleDateString('ar-SA')}
        </p>
        <p style={{ color: '#aaaaaa', fontSize: '10px', margin: '0' }}>
          نشكركم لثقتكم في {academyInfo.name}
        </p>
      </div>
    </div>
  )
}