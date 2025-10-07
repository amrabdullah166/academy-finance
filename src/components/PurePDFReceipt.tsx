import React from 'react'

interface PurePDFReceiptProps {
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

export const PurePDFReceipt: React.FC<PurePDFReceiptProps> = ({ 
  payment, 
  academyInfo 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',  
      day: 'numeric'
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
    <div 
      id="payment-receipt"
      style={{
        width: '800px',
        minHeight: '600px',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        direction: 'rtl',
        padding: '40px',
        margin: '0',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{
        textAlign: 'center',
        borderBottom: '3px solid #333333',
        paddingBottom: '30px',
        marginBottom: '30px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#000000',
          margin: '0 0 10px 0',
          textAlign: 'center'
        }}>
          {academyInfo.name}
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#555555',
          margin: '0 0 20px 0',
          textAlign: 'center'
        }}>
          {academyInfo.address}
        </p>
        
        <div style={{
          backgroundColor: '#22c55e',
          color: '#ffffff',
          padding: '15px 30px',
          borderRadius: '10px',
          display: 'inline-block',
          margin: '10px 0'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0',
            textAlign: 'center'
          }}>
            ✓ إيصال دفع مالي
          </h2>
        </div>
        
        <p style={{
          fontSize: '12px',
          color: '#888888',
          margin: '10px 0 0 0',
          textAlign: 'center'
        }}>
          Payment Receipt
        </p>
      </div>

      {/* Receipt Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '30px',
        gap: '20px'
      }}>
        <div style={{
          flex: '1',
          backgroundColor: '#f8f8f8',
          border: '2px solid #dddddd',
          borderRadius: '10px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333333',
            marginBottom: '10px'
          }}>
            📄 رقم الإيصال
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#000000'
          }}>
            #{payment.receipt_number || payment.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
        
        <div style={{
          flex: '1',
          backgroundColor: '#f8f8f8',
          border: '2px solid #dddddd',
          borderRadius: '10px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333333',
            marginBottom: '10px'
          }}>
            📅 تاريخ الدفع
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#000000'
          }}>
            {formatDate(payment.payment_date)}
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '2px solid #2196f3',
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '25px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1976d2',
          margin: '0 0 20px 0',
          textAlign: 'center'
        }}>
          معلومات الطالب والدورة
        </h3>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div style={{ flex: '1' }}>
            <div style={{
              fontSize: '14px',
              color: '#666666',
              marginBottom: '5px'
            }}>
              اسم الطالب:
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              {payment.students?.name || 'غير محدد'}
            </div>
          </div>
          
          {payment.course_name && (
            <div style={{ flex: '1' }}>
              <div style={{
                fontSize: '14px',
                color: '#666666',
                marginBottom: '5px'
              }}>
                الدورة:
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#000000'
              }}>
                {payment.course_name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div style={{
        backgroundColor: '#e8f5e8',
        border: '2px solid #4caf50',
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '25px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#2e7d32',
          margin: '0 0 20px 0',
          textAlign: 'center'
        }}>
          تفاصيل الدفع
        </h3>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          marginBottom: payment.notes ? '20px' : '0'
        }}>
          <div style={{
            textAlign: 'center',
            flex: '1'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666666',
              marginBottom: '5px'
            }}>
              المبلغ المدفوع:
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#2e7d32'
            }}>
              {formatCurrency(payment.amount)}
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            flex: '1'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666666',
              marginBottom: '5px'
            }}>
              طريقة الدفع:
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              💳 {getPaymentTypeText(payment.payment_type)}
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            flex: '1'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666666',
              marginBottom: '5px'
            }}>
              نوع الدفع:
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              {getPaymentMethodText(payment.payment_method)}
            </div>
          </div>
        </div>
        
        {payment.notes && (
          <div>
            <div style={{
              fontSize: '14px',
              color: '#666666',
              marginBottom: '8px'
            }}>
              ملاحظات:
            </div>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cccccc',
              borderRadius: '5px',
              padding: '15px',
              fontSize: '16px',
              color: '#000000'
            }}>
              {payment.notes}
            </div>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div style={{
        borderTop: '3px solid #333333',
        paddingTop: '25px',
        marginTop: '30px'
      }}>
        <h4 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333333',
          margin: '0 0 15px 0',
          textAlign: 'center'
        }}>
          معلومات التواصل
        </h4>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          gap: '20px',
          textAlign: 'center'
        }}>
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
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #cccccc'
      }}>
        <p style={{
          fontSize: '12px',
          color: '#888888',
          margin: '0 0 10px 0'
        }}>
          تم إنتاج هذا الإيصال تلقائياً في {new Date().toLocaleDateString('ar-SA')}
        </p>
        <p style={{
          fontSize: '11px',
          color: '#aaaaaa',
          margin: '0'
        }}>
          نشكركم لثقتكم في {academyInfo.name}
        </p>
      </div>
    </div>
  )
}