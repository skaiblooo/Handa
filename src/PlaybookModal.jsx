import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function PlaybookModal({ playbook, docType, userId, onClose }) {
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!playbook) return null

  async function submitFeedback(wasAccurate) {
    setSubmitting(true)

    const { error } = await supabase.from('playbook_feedback').insert({
      user_id: userId,
      doc_type: docType,
      was_accurate: wasAccurate,
      comment: comment || null,
    })

    setSubmitting(false)

    if (error) {
      console.error('Error submitting feedback:', error)
      return
    }

    setFeedbackGiven(true)
    if (!wasAccurate) setShowCommentBox(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">{playbook.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Last verified: {playbook.lastVerified}
        </p>

        <p className="mb-4">{playbook.overview}</p>

        <h3 className="font-semibold mb-2">What you'll need</h3>
        <ul className="list-disc list-inside mb-4 space-y-1 text-sm">
          {playbook.requirements.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <h3 className="font-semibold mb-2">Steps</h3>
        <ol className="list-decimal list-inside mb-4 space-y-1 text-sm">
          {playbook.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        <div className="flex justify-between text-sm border-t pt-3 mb-4">
          <p>
            <span className="font-semibold">Est. cost:</span> {playbook.estimatedCost}
          </p>
          <p>
            <span className="font-semibold">Est. time:</span> {playbook.estimatedTime}
          </p>
        </div>

        <div className="border-t pt-4">
          {feedbackGiven ? (
            <p className="text-sm text-green-600 font-medium">
              Thanks for helping keep this accurate!
            </p>
          ) : (
            <>
              <p className="text-sm font-medium mb-2">Was this accurate for you?</p>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => submitFeedback(true)}
                  disabled={submitting}
                  className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-sm hover:bg-green-200"
                >
                  👍 Yes
                </button>
                <button
                  onClick={() => setShowCommentBox(true)}
                  disabled={submitting}
                  className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-sm hover:bg-red-200"
                >
                  👎 Something was off
                </button>
              </div>

              {showCommentBox && (
                <div className="mt-2">
                  <textarea
                    placeholder="What was different from what's listed here?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border rounded p-2 text-sm mb-2"
                    rows={3}
                  />
                  <button
                    onClick={() => submitFeedback(false)}
                    disabled={submitting}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}