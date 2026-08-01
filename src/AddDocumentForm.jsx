import { useState } from 'react'
import { supabase } from './supabaseClient'

const DOC_TYPES = [
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'passport', label: 'Passport' },
  { value: 'nbi_clearance', label: 'NBI Clearance' },
]

export default function AddDocumentForm({ userId, onDocumentAdded }) {
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('drivers_license')
  const [expiryDate, setExpiryDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')

    const { error } = await supabase.from('documents').insert({
      user_id: userId,
      title,
      doc_type: docType,
      expiry_date: expiryDate,
    })

    if (error) {
      setErrorMsg(error.message)
      setSaving(false)
      return
    }

    // Reset form
    setTitle('')
    setDocType('drivers_license')
    setExpiryDate('')
    setSaving(false)

    // Tell the parent (Dashboard) to refresh the list
    onDocumentAdded()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-lg p-4 bg-white shadow-sm mb-6"
    >
      <h3 className="font-semibold mb-3">Add a Document</h3>

      <input
        type="text"
        placeholder="e.g. My Driver's License"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded mb-3"
        required
      />

      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      >
        {DOC_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      <label className="block text-sm text-gray-500 mb-1">Expiry Date</label>
      <input
        type="date"
        value={expiryDate}
        onChange={(e) => setExpiryDate(e.target.value)}
        className="w-full border p-2 rounded mb-3"
        required
      />

      {errorMsg && <p className="text-red-500 text-sm mb-3">{errorMsg}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {saving ? 'Saving...' : 'Add Document'}
      </button>
    </form>
  )
}