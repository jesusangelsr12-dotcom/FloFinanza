import { createClient } from '@/lib/supabase/client'

/**
 * Insert a transaction directly into the DB.
 * Usable from any hook without depending on useTransactions.
 */
export async function insertTransaction(tx: {
  type: 'expense' | 'income'
  amount: number
  description: string
  date: string
  category_id?: string | null
  budget_id?: string | null
  card_id?: string | null
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date,
      category_id: tx.category_id || null,
      budget_id: tx.budget_id || null,
      card_id: tx.card_id || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error inserting transaction:', error)
    return null
  }
  return data
}
