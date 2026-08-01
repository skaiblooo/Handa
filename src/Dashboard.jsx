import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import AddDocumentForm from './AddDocumentForm'
import {
  getDaysUntilExpiry,
  getUrgencyLevel,
  getUrgencyStyles,
  getUrgencyLabel,
} from './utils/dateHelpers'
import { playbooks } from './data/playbooks'
import PlaybookModal from './PlaybookModal'

const GROUP_ORDER = ['expired', 'urgent', 'upcoming', 'safe']
const GROUP_TITLES = {
  expired: 'Expired',
  urgent: 'Expiring Soon (within 30 days)',
  upcoming: 'Coming Up (within 90 days)',
  safe: 'Not Urgent Yet',
}

export default function Dashboard({ session }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('expiry_date', { ascending: true })

    if (error) {
      console.error('Error fetching documents:', error)
    } else {
      setDocuments(data)
    }
    setLoading(false)
  }

  // Group documents by urgency level
  function groupDocuments() {
    const groups = { expired: [], urgent: [], upcoming: [], safe: [] }
    documents.forEach((doc) => {
      const daysUntil = getDaysUntilExpiry(doc.expiry_date)
      const urgency = getUrgencyLevel(daysUntil)
      groups[urgency].push({ ...doc, daysUntil, urgency })
    })
    return groups
  }

  const grouped = groupDocuments()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700">Handa</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          Log Out
        </button>
      </header>

      <AddDocumentForm
        userId={session.user.id}
        onDocumentAdded={fetchDocuments}
      />

      <h2 className="text-lg font-semibold mb-4">Your Documents</h2>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : documents.length === 0 ? (
        <p className="text-gray-500">No documents tracked yet. Add your first one above.</p>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.map((groupKey) => {
            const docsInGroup = grouped[groupKey]
            if (docsInGroup.length === 0) return null

            return (
              <div key={groupKey}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  {GROUP_TITLES[groupKey]}
                </h3>
                <ul className="space-y-3">
                  {docsInGroup.map((doc) => {
                    const styles = getUrgencyStyles(doc.urgency)
                    const label = getUrgencyLabel(doc.urgency, doc.daysUntil)

                    return (
                      <li
  key={doc.id}
  onClick={() => setSelectedDoc(doc)}
  className={`border-l-4 rounded-lg p-4 flex justify-between items-center shadow-sm cursor-pointer hover:opacity-90 ${styles}`}
>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-sm opacity-75">{doc.doc_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{label}</p>
                          <p className="text-xs opacity-75">{doc.expiry_date}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
      <PlaybookModal
  playbook={selectedDoc ? playbooks[selectedDoc.doc_type] : null}
  docType={selectedDoc?.doc_type}
  userId={session.user.id}
  onClose={() => setSelectedDoc(null)}
/>
    </div>
  )
}