'use client'

import { useState } from 'react'

interface BookingData {
  package_id: number | string
  customer_name: string
  customer_email: string
  customer_phone?: string
  travel_date: string
  travelers: {
    adults: number
    children: number
    infants: number
    details?: Array<{
      name: string
      age: number
      document_type: string
      document_number: string
    }>
  }
  total_amount?: {
    amount: number
    currency: string
  }
  special_requests?: string
}

interface BookingResponse {
  success: boolean
  booking?: any
  error?: string
  code?: string
}

/**
 * 🛒 Hook para gestión de reservas
 * Conecta frontend con backend /api/bookings
 */
export function useBooking() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentBooking, setCurrentBooking] = useState(null)

  /**
   * 🎯 Obtener token de autenticación del localStorage
   */
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  /**
   * 📝 Crear nueva reserva
   */
  const createBooking = async (bookingData: BookingData): Promise<any> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = getAuthToken()
      
      const response = await fetch('http://localhost:3001/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(bookingData)
      })
      
      const result: BookingResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error creando la reserva')
      }
      
      setCurrentBooking(result.booking)
      return result.booking
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido'
      setError(errorMessage)
      console.error('❌ Error creating booking:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 📖 Obtener detalles de una reserva
   */
  const getBookingDetails = async (bookingId: string | number): Promise<any> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = getAuthToken()
      
      const response = await fetch(`http://localhost:3001/api/admin/bookings/${bookingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      const result: BookingResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error obteniendo la reserva')
      }
      
      return result.booking
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido'
      setError(errorMessage)
      console.error('❌ Error fetching booking:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 🔄 Actualizar estado de reserva
   */
  const updateBookingStatus = async (
    bookingId: string | number, 
    statusData: { booking_status?: string; payment_status?: string; reason?: string }
  ): Promise<any> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = getAuthToken()
      
      const response = await fetch(`http://localhost:3001/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(statusData)
      })
      
      const result: BookingResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error actualizando la reserva')
      }
      
      return result.booking
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido'
      setError(errorMessage)
      console.error('❌ Error updating booking status:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 📊 Obtener estadísticas de reservas
   */
  const getBookingStats = async (): Promise<any> => {
    try {
      const token = getAuthToken()
      
      const response = await fetch('http://localhost:3001/api/admin/bookings/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      const result = await response.json()
      return result.stats
      
    } catch (err: any) {
      console.error('❌ Error fetching booking stats:', err)
      return null
    }
  }

  /**
   * 🧹 Limpiar errores
   */
  const clearError = () => {
    setError(null)
  }

  /**
   * 📋 Generar voucher de reserva
   */
  const generateVoucher = async (bookingId: string | number): Promise<any> => {
    try {
      const token = getAuthToken()
      
      const response = await fetch(`http://localhost:3001/api/admin/bookings/${bookingId}/voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      const result = await response.json()
      return result.voucher
      
    } catch (err: any) {
      console.error('❌ Error generating voucher:', err)
      throw err
    }
  }

  return {
    // States
    isLoading,
    error,
    currentBooking,
    
    // Actions
    createBooking,
    getBookingDetails,
    updateBookingStatus,
    getBookingStats,
    generateVoucher,
    clearError,
    
    // Helpers
    hasError: !!error,
    isReady: !isLoading && !error
  }
}

/**
 * 🎯 Hook simplificado para uso público (sin autenticación)
 */
export function usePublicBooking() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 📝 Crear cotización pública
   */
  const createQuote = async (quoteData: Partial<BookingData>): Promise<any> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:3001/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quoteData)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error creando la cotización')
      }
      
      return result.quote
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    createQuote,
    clearError: () => setError(null)
  }
}