'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Loan {
  id: string
  direction: 'given' | 'received'
  contact_id: string | null
  contact_name: string | null
  principal: number
  monthly_payment: number
  total_months: number
  paid_months: number
  start_date: string
  is_completed: boolean
  notes: string | null
  created_at: string
  contact?: { id: string; name: string } | null
}

export interface LoanPayment {
  id: string
  loan_id: string
  month_number: number
  amount: number
  due_date: string
  is_paid: boolean
  paid_at: string | null
}

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLoans = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('loans')
      .select(`*, contact:contacts(id, name)`)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setLoans(data as Loan[])
    }
    setLoading(false)
  }

  const addLoan = async (loan: {
    direction: 'given' | 'received'
    contact_id?: string
    contact_name: string
    principal: number
    monthly_payment: number
    total_months: number
    start_date: string
    notes?: string
  }) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('loans')
      .insert({
        user_id: user.id,
        direction: loan.direction,
        contact_id: loan.contact_id || null,
        contact_name: loan.contact_name,
        principal: loan.principal,
        monthly_payment: loan.monthly_payment,
        total_months: loan.total_months,
        start_date: loan.start_date,
        notes: loan.notes || null,
      })
      .select(`*, contact:contacts(id, name)`)
      .single()

    if (!error && data) {
      // Generate payment schedule
      const payments = []
      const startDate = new Date(loan.start_date)
      for (let i = 1; i <= loan.total_months; i++) {
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + i)
        payments.push({
          loan_id: data.id,
          user_id: user.id,
          month_number: i,
          amount: loan.monthly_payment,
          due_date: dueDate.toISOString().split('T')[0],
        })
      }

      await supabase.from('loan_payments').insert(payments)
      setLoans((prev) => [data as Loan, ...prev])
    }
    return data
  }

  const markPayment = async (loanId: string, monthNumber: number) => {
    const supabase = createClient()
    await supabase
      .from('loan_payments')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('loan_id', loanId)
      .eq('month_number', monthNumber)

    // Update paid_months on loan
    const loan = loans.find((l) => l.id === loanId)
    if (loan) {
      const newPaidMonths = loan.paid_months + 1
      const isCompleted = newPaidMonths >= loan.total_months
      await supabase
        .from('loans')
        .update({ paid_months: newPaidMonths, is_completed: isCompleted })
        .eq('id', loanId)

      setLoans((prev) =>
        prev.map((l) =>
          l.id === loanId ? { ...l, paid_months: newPaidMonths, is_completed: isCompleted } : l
        )
      )
    }
  }

  const getPayments = async (loanId: string): Promise<LoanPayment[]> => {
    const supabase = createClient()
    const { data } = await supabase
      .from('loan_payments')
      .select('*')
      .eq('loan_id', loanId)
      .order('month_number')

    return (data as LoanPayment[]) || []
  }

  const deleteLoan = async (id: string) => {
    const supabase = createClient()
    await supabase.from('loans').delete().eq('id', id)
    setLoans((prev) => prev.filter((l) => l.id !== id))
  }

  const givenLoans = loans.filter((l) => l.direction === 'given')
  const receivedLoans = loans.filter((l) => l.direction === 'received')

  const totalGivenPending = givenLoans
    .filter((l) => !l.is_completed)
    .reduce((sum, l) => sum + (l.principal - l.monthly_payment * l.paid_months), 0)

  const totalReceivedPending = receivedLoans
    .filter((l) => !l.is_completed)
    .reduce((sum, l) => sum + (l.principal - l.monthly_payment * l.paid_months), 0)

  useEffect(() => {
    fetchLoans()
  }, [])

  return {
    loans,
    givenLoans,
    receivedLoans,
    loading,
    addLoan,
    markPayment,
    getPayments,
    deleteLoan,
    totalGivenPending,
    totalReceivedPending,
    refresh: fetchLoans,
  }
}
