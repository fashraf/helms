// Finance + Inventory unified store
import { create } from 'zustand'
import {
  INVENTORY_MASTER,
  CUSTOMERS,
  CUSTOMER_INVOICES,
  CUSTOMER_RECEIPTS,
} from '../api/mock/financeData'

const useFinanceStore = create((set, get) => ({
  // ─── Inventory ──────────────────────────────────────────────
  inventory: INVENTORY_MASTER,
  addInventoryItem: (item) => set(s => ({ inventory: [...s.inventory, item] })),
  updateInventoryItem: (id, patch) => set(s => ({
    inventory: s.inventory.map(i => i.id === id ? { ...i, ...patch, lastUpdated: new Date().toISOString() } : i),
  })),
  adjustStock: (id, delta, reason) => set(s => ({
    inventory: s.inventory.map(i => i.id === id ? { ...i, stock: Math.max(0, i.stock + delta), lastUpdated: new Date().toISOString() } : i),
  })),

  // ─── Customers ──────────────────────────────────────────────
  customers: CUSTOMERS,
  addCustomer: (customer) => set(s => ({ customers: [...s.customers, customer] })),
  updateCustomer: (id, patch) => set(s => ({
    customers: s.customers.map(c => c.id === id ? { ...c, ...patch } : c),
  })),

  // ─── Customer Invoices (AR) ─────────────────────────────────
  customerInvoices: CUSTOMER_INVOICES,
  addCustomerInvoice: (invoice) => set(s => ({ customerInvoices: [...s.customerInvoices, invoice] })),
  updateCustomerInvoice: (id, patch) => set(s => ({
    customerInvoices: s.customerInvoices.map(i => i.id === id ? { ...i, ...patch } : i),
  })),

  // ─── Customer Receipts ──────────────────────────────────────
  customerReceipts: CUSTOMER_RECEIPTS,
  addCustomerReceipt: (receipt) => set(s => {
    const newReceipts = [...s.customerReceipts, receipt]
    // Cascade: update invoice paidAmount + status
    const updatedInvoices = s.customerInvoices.map(inv => {
      if (inv.id !== receipt.invoiceId) return inv
      const newPaid = (inv.paidAmount ?? 0) + receipt.amount
      let newStatus = inv.status
      if (newPaid >= inv.amount)     newStatus = 'paid'
      else if (newPaid > 0)          newStatus = 'partially_paid'
      return { ...inv, paidAmount: newPaid, status: newStatus }
    })
    return { customerReceipts: newReceipts, customerInvoices: updatedInvoices }
  }),
  updateCustomerReceipt: (id, patch) => set(s => ({
    customerReceipts: s.customerReceipts.map(r => r.id === id ? { ...r, ...patch } : r),
  })),
}))

export default useFinanceStore
