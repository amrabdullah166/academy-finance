// Common Types for Academy Finance System

export interface BaseEntity {
  id: string
  created_at?: string
  updated_at?: string
}

export interface SelectOption {
  value: string
  label: string
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
}

export interface FilterOption {
  key: string
  label: string
  type: 'select' | 'date' | 'text' | 'number'
  options?: SelectOption[]
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export type Status = 'active' | 'inactive' | 'suspended'
export type PaymentStatus = 'completed' | 'pending' | 'cancelled'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'monthly_fee'
export type ExpenseCategory = 'salary' | 'utilities' | 'supplies' | 'maintenance' | 'rent' | 'marketing' | 'equipment' | 'insurance' | 'taxes' | 'other'
export type NotificationType = 'payment_due' | 'subscription_overdue' | 'enrollment' | 'system' | 'reminder'
export type ActivityType = 'payment' | 'enrollment' | 'expense' | 'notification'

// Form Types
export interface FormData {
  [key: string]: string | number | boolean | undefined
}

export interface ValidationError {
  field: string
  message: string
}

export interface FormState {
  data: FormData
  errors: ValidationError[]
  isSubmitting: boolean
  isValid: boolean
}
