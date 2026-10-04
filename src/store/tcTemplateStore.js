// Zustand store for the T&C Template Engine (Module 3).
import { create } from 'zustand'
import { TC_TEMPLATES_INITIAL, getActiveTemplate } from '../api/mock/tcTemplateData'

const now = () => new Date().toISOString()

const useTCTemplateStore = create((set, get) => ({
  templates: TC_TEMPLATES_INITIAL,

  // Pure selector — find the active template for a (docType, scope) pair.
  getActive: (docType, scope) => getActiveTemplate(get().templates, docType, scope),

  // Patch a template's body. Bumps version and writes an audit entry.
  saveBody: (id, body, actor = 'Khalid Salman') =>
    set(s => ({
      templates: s.templates.map(t => t.id !== id ? t : ({
        ...t,
        body,
        version: t.version + 1,
        updatedAt: now(),
        updatedBy: actor,
        audit: [
          ...t.audit,
          { id: `${id}-${Date.now()}`, actor, action: 'Edited body text', at: now(), meta: { version: t.version + 1 } },
        ],
      })),
    })),

  // Toggle active flag with audit. When deactivating, the caller is expected
  // to have shown the confirmation modal already (we keep the action pure here).
  setActive: (id, active, actor = 'Khalid Salman') =>
    set(s => ({
      templates: s.templates.map(t => t.id !== id ? t : ({
        ...t,
        active,
        updatedAt: now(),
        updatedBy: actor,
        audit: [
          ...t.audit,
          { id: `${id}-${Date.now()}`, actor, action: active ? 'Activated' : 'Deactivated', at: now(), meta: { active } },
        ],
      })),
    })),
}))

export default useTCTemplateStore
