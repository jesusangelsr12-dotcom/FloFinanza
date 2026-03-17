'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { insertTransaction } from '@/lib/utils/transactions'

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
  budget_id: string | null
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
  budget_id: string | null
  budget?: { id: string; name: string; icon: string | null } | null
}

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLoans = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('loans')
      .select('*, contact:contacts(id, name)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setLoans(data as Loan[])
    } else if (error) {
      console.error('Error fetching loans with contact join:', error)
      // Fallback: query without the contact join
      const { data: fallback } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false })
      if (fallback) {
        setLoans(fallback.map((l) => ({ ...l, contact: null })) as Loan[])
      }
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
    budget_id?: string
    budget_name?: string
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
        budget_id: loan.budget_id || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error inserting loan:', error)
      throw new Error(error.message)
    }

    if (data) {
      // Build the loan object with contact info for local state
      const loanWithContact = { ...data, contact: null } as Loan

      // Update state immediately so the UI reflects the new loan
      setLoans((prev) => [loanWithContact, ...prev])

      // Generate payment schedule (non-blocking for UI)
      try {
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

        const { error: payError } = await supabase.from('loan_payments').insert(payments)
        if (payError) console.error('Error inserting loan payments:', payError)

        // Create transaction: lending = expense, borrowing = income
        const monthsLabel = `${loan.total_months} mes${loan.total_months !== 1 ? 'es' : ''}`
        const budgetLabel = loan.budget_name ? ` · Cajita: ${loan.budget_name}` : ''
        await insertTransaction({
          type: loan.direction === 'given' ? 'expense' : 'income',
          amount: loan.principal,
          description: loan.direction === 'given'
            ? `Préstamo a ${loan.contact_name} a ${monthsLabel}${budgetLabel}`
            : `Préstamo de ${loan.contact_name} a ${monthsLabel}${budgetLabel}`,
          date: loan.start_date,
          budget_id: loan.budget_id || null,
        })
      } catch (err) {
        console.error('Error creating loan auxiliaries:', err)
      }
    }
    return data
  }

  const markPayment = async (loanId: string, monthNumber: number, budgetId?: string, budgetName?: string) => {
    const supabase = createClient()
    await supabase
      .from('loan_payments')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        budget_id: budgetId || null,
      })
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

      // Create transaction: receiving payment = income, making payment = expense
      const contactName = loan.contact?.name || loan.contact_name || ''
      const today = new Date().toISOString().split('T')[0]
      const budgetLabel = budgetName ? ` → ${budgetName}` : ''
      await insertTransaction({
        type: loan.direction === 'given' ? 'income' : 'expense',
        amount: loan.monthly_payment,
        description: loan.direction === 'given'
          ? `${contactName} te pagó préstamo (${newPaidMonths}/${loan.total_months})${budgetLabel}`
          : `Pagaste préstamo a ${contactName} (${newPaidMonths}/${loan.total_months})${budgetLabel}`,
        date: today,
        budget_id: budgetId || null,
      })

      setLoans((prev) =>
        prev.map((l) =>
          l.id === loanId ? { ...l, paid_months: newPaidMonths, is_completed: isCompleted } : l
        )
      )
    }
  }

  const getPayments = async (loanId: string): Promise<LoanPayment[]> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('loan_payments')
      .select('*, budget:budgets(id, name, icon)')
      .eq('loan_id', loanId)
      .order('month_number')

    if (error) {
      console.error('Error fetching payments with budget join:', error)
      // Fallback: query without the budget join
      const { data: fallback } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('month_number')
      return (fallback as LoanPayment[]) || []
    }

    return (data as LoanPayment[]) || []
  }

  const deleteLoan = async (id: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const loan = loans.find((l) => l.id === id)

    if (loan && user) {
      const reverseBudget = async (budgetId: string, amount: number, note: string) => {
        await supabase.from('budget_movements').insert({
          budget_id: budgetId,
          user_id: user.id,
          amount,
          note,
        })
        const { data: budget } = await supabase
          .from('budgets')
          .select('accumulated')
          .eq('id', budgetId)
          .single()
        if (budget) {
          await supabase
            .from('budgets')
            .update({ accumulated: budget.accumulated + amount })
            .eq('id', budgetId)
        }
      }

      // Reverse the initial cajita movement (loan disbursement)
      if (loan.budget_id) {
        const reverseAmount = loan.direction === 'given'
          ? loan.principal   // was subtracted, add back
          : -loan.principal  // was added, subtract
        await reverseBudget(loan.budget_id, reverseAmount, `Préstamo eliminado: ${loan.contact_name}`)
      }

      // Reverse payment movements that went to cajitas
      const { data: paidPayments } = await supabase
        .from('loan_payments')
        .select('budget_id, amount')
        .eq('loan_id', id)
        .eq('is_paid', true)
        .not('budget_id', 'is', null)

      if (paidPayments?.length) {
        const reversals: Record<string, number> = {}
        for (const p of paidPayments) {
          if (p.budget_id) {
            reversals[p.budget_id] = (reversals[p.budget_id] || 0) + p.amount
          }
        }
        for (const budgetId of Object.keys(reversals)) {
          await reverseBudget(budgetId, -reversals[budgetId], `Pagos revertidos: ${loan.contact_name}`)
        }
      }
    }

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
