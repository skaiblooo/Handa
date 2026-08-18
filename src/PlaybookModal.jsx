import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useLanguage } from './i18n'
import { validatePhotoFile, uploadDocumentPhoto, deleteDocumentPhoto, getDocumentPhotoUrl } from './utils/documentPhotos'
import { AVATAR_COLORS } from './avatarColors'
import { AGENCY_BADGE } from './data/docTypes'

// Keeps the modal mounted for `duration` after it's told to close, so the
// exit animation actually gets to play instead of the element just vanishing.
function useDelayedUnmount(isOpen, duration = 180) {
  const [shouldRender, setShouldRender] = useState(isOpen)
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
    } else if (shouldRender) {
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen])
  return shouldRender
}

function t(isDark, darkClasses, lightClasses) {
  return isDark ? darkClasses : lightClasses
}

function Icon({ children, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

// Agency-level, not a specific branch — there's no branch directory to pick
// one from here, and building one is its own separate content task. Reports
// live 48 hours before aging out of the average, since a wait time from
// three days ago says nothing useful about right now.
const WAIT_REPORT_WINDOW_HOURS = 48
const WAIT_BUCKETS = [
  { minutes: 10, labelKey: 'wait_bucket_under_15' },
  { minutes: 22, labelKey: 'wait_bucket_15_30' },
  { minutes: 45, labelKey: 'wait_bucket_30_60' },
  { minutes: 75, labelKey: 'wait_bucket_over_60' },
]

function WaitTimeSection({ isDark, agencyCode, userId }) {
  const { translate } = useLanguage()
  const [reports, setReports] = useState(null) // null = still loading
  const [submitting, setSubmitting] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)

  useEffect(() => {
    if (!agencyCode) return
    let cancelled = false
    setReports(null)
    setJustSubmitted(false)
    async function load() {
      const since = new Date(Date.now() - WAIT_REPORT_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('branch_wait_reports')
        .select('wait_minutes')
        .eq('agency_code', agencyCode)
        .gte('reported_at', since)
        .order('reported_at', { ascending: false })
        .limit(50)
      if (!cancelled) setReports(data || [])
    }
    load()
    return () => { cancelled = true }
  }, [agencyCode])

  async function submitWait(minutes) {
    setSubmitting(true)
    const { error } = await supabase.from('branch_wait_reports').insert({
      user_id: userId,
      agency_code: agencyCode,
      wait_minutes: minutes,
    })
    setSubmitting(false)
    if (!error) {
      setJustSubmitted(true)
      setReports((prev) => [{ wait_minutes: minutes }, ...(prev || [])])
    }
  }

  if (!agencyCode) return null

  const avgMinutes =
    reports && reports.length > 0
      ? Math.round(reports.reduce((sum, r) => sum + r.wait_minutes, 0) / reports.length)
      : null

  return (
    <div className={`rounded-xl p-3 mb-3 ${t(isDark, 'bg-white/5', 'bg-slate-50')}`}>
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <p className={t(isDark, 'text-xs font-semibold text-slate-300', 'text-xs font-semibold text-slate-600')}>
          {translate('wait_times_heading', { agency: agencyCode })}
        </p>
        {reports !== null && (
          <span className="text-xs text-slate-500">
            {avgMinutes !== null
              ? translate('wait_times_summary', { minutes: avgMinutes, count: reports.length })
              : translate('wait_times_none')}
          </span>
        )}
      </div>
      {justSubmitted ? (
        <p className="text-xs text-emerald-400">{translate('wait_times_thanks')}</p>
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={t(isDark, 'text-xs text-slate-500 mr-1', 'text-xs text-slate-400 mr-1')}>{translate('wait_times_prompt')}</span>
          {WAIT_BUCKETS.map((bucket) => (
            <button
              key={bucket.minutes}
              type="button"
              disabled={submitting}
              onClick={() => submitWait(bucket.minutes)}
              className={`glass-interactive glass-interactive-flat text-xs px-2.5 py-1 rounded-full disabled:opacity-40 ${t(isDark,
                'bg-white/10 text-slate-300 hover:bg-white/15',
                'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              )}`}
            >
              {translate(bucket.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PlaybookModal({ isDark, playbook, docType, userId, doc, householdMember, onClose, onStepsUpdated }) {
  const { translate } = useLanguage()
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  // Overrides activeDoc.completed_steps the instant a step is toggled, so the
  // checkmark responds immediately instead of waiting on a round trip.
  const [optimisticCompleted, setOptimisticCompleted] = useState(null)
  const [viewingPhoto, setViewingPhoto] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoErrorKey, setPhotoErrorKey] = useState(null)

  const isOpen = !!playbook
  const shouldRender = useDelayedUnmount(isOpen)
  const [snapshot, setSnapshot] = useState({ playbook, doc, docType })

  useEffect(() => {
    if (isOpen) {
      setSnapshot({ playbook, doc, docType })
      setFeedbackGiven(false)
      setShowCommentBox(false)
      setComment('')
      setOptimisticCompleted(null)
      setPhotoErrorKey(null)
      // Resume wherever they left off, instead of always starting back at step 1.
      const completed = doc?.completed_steps || []
      const firstIncomplete = playbook.steps.findIndex((_, i) => !completed.includes(i))
      setCurrentStep(firstIncomplete === -1 ? playbook.steps.length - 1 : firstIncomplete)
    }
    // Keyed on doc?.id alone, not on the doc/playbook/docType objects: both
    // `doc` (refetched after every toggleStep) and `playbook` (rebuilt as a
    // new object by getPlaybook() on every Dashboard render) get a fresh
    // reference far more often than the open document actually changes.
    // Depending on either meant every checkbox click yanked the user away
    // from whatever step they were looking at back to the first incomplete
    // one, and reset the accuracy feedback UI (risking a duplicate
    // submission) — this should only run when a genuinely different
    // document is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, doc?.id])

  if (!shouldRender) return null

  const activePlaybook = isOpen ? playbook : snapshot.playbook
  const activeDoc = isOpen ? doc : snapshot.doc
  const activeDocType = isOpen ? docType : snapshot.docType

  const completedSteps = optimisticCompleted ?? (activeDoc?.completed_steps || [])
  const totalSteps = activePlaybook.steps.length
  const step = activePlaybook.steps[currentStep]
  const isStepDone = completedSteps.includes(currentStep)
  const isFinalStep = currentStep === totalSteps - 1
  const accent = isFinalStep ? 'emerald' : 'blue'

  function goToStep(index) {
    setDirection(index >= currentStep ? 1 : -1)
    setCurrentStep(index)
  }

  async function toggleStep(index) {
    const newCompleted = completedSteps.includes(index)
      ? completedSteps.filter((i) => i !== index)
      : [...completedSteps, index]
    setOptimisticCompleted(newCompleted)

    const { error } = await supabase
      .from('documents')
      .update({ completed_steps: newCompleted })
      .eq('id', activeDoc.id)

    if (!error && onStepsUpdated) onStepsUpdated()
  }

  async function submitFeedback(wasAccurate) {
    setSubmitting(true)
    const { error } = await supabase.from('playbook_feedback').insert({
      user_id: userId,
      doc_type: activeDocType,
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

  const docLabel = activeDocType ? activeDocType.replace(/_/g, ' ').toUpperCase() : ''

  async function viewPhoto() {
    setViewingPhoto(true)
    const url = await getDocumentPhotoUrl(supabase, activeDoc?.photo_path)
    setViewingPhoto(false)
    if (url) window.open(url, '_blank', 'noopener')
  }

  async function attachOrReplacePhoto(file) {
    if (!file) return
    const problem = validatePhotoFile(file)
    if (problem) {
      setPhotoErrorKey(problem)
      return
    }
    setPhotoErrorKey(null)
    setPhotoBusy(true)

    const uploadResult = await uploadDocumentPhoto(supabase, userId, file)
    if (!uploadResult.ok) {
      setPhotoErrorKey('add_doc_photo_upload_failed')
      setPhotoBusy(false)
      return
    }

    const previousPath = activeDoc?.photo_path
    const { error } = await supabase
      .from('documents')
      .update({ photo_path: uploadResult.path })
      .eq('id', activeDoc.id)

    if (error) {
      // Row update failed — don't leave an unreferenced file behind.
      await deleteDocumentPhoto(supabase, uploadResult.path)
      setPhotoErrorKey('add_doc_photo_upload_failed')
      setPhotoBusy(false)
      return
    }

    if (previousPath) await deleteDocumentPhoto(supabase, previousPath)
    if (onStepsUpdated) await onStepsUpdated()
    setPhotoBusy(false)
  }

  async function removePhoto() {
    const path = activeDoc?.photo_path
    if (!path) return
    setPhotoBusy(true)
    const { error } = await supabase.from('documents').update({ photo_path: null }).eq('id', activeDoc.id)
    if (!error) {
      await deleteDocumentPhoto(supabase, path)
      if (onStepsUpdated) await onStepsUpdated()
    }
    setPhotoBusy(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      style={{ animation: isOpen ? 'backdrop-in 150ms ease-out' : 'backdrop-out 180ms ease-in forwards' }}
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className={t(isDark,
          'no-scrollbar bg-[#0a0a0f] border border-white/10 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8',
          'no-scrollbar bg-white border border-slate-200 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8'
        )}
        style={{ animation: isOpen ? 'modal-in 180ms ease-out' : 'modal-out 180ms ease-in forwards' }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className={t(isDark, 'w-9 h-9 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center shrink-0', 'w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0')}>
              <Icon size={17}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></Icon>
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <p className={t(isDark, 'text-xs font-semibold tracking-widest text-slate-400', 'text-xs font-semibold tracking-widest text-slate-500')}>{docLabel}</p>
                {householdMember && (
                  <span
                    title={householdMember.name}
                    className={`flex items-center gap-1 rounded-full pl-0.5 pr-1.5 py-0.5 text-[10px] font-medium ${t(isDark, 'bg-white/10 text-slate-300', 'bg-slate-100 text-slate-600')}`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ fontSize: 7, backgroundColor: AVATAR_COLORS[householdMember.color] || AVATAR_COLORS[0] }}
                    >
                      {householdMember.name?.[0]?.toUpperCase()}
                    </span>
                    {householdMember.name}
                  </span>
                )}
              </div>
              <p className={t(isDark, 'text-[11px] text-slate-600', 'text-[11px] text-slate-400')}>{translate('playbook_last_verified', { date: activePlaybook.lastVerified })}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {activeDoc?.photo_path ? (
              <>
                <button
                  type="button"
                  title={translate('playbook_view_photo')}
                  onClick={viewPhoto}
                  disabled={viewingPhoto || photoBusy}
                  className={`glass-interactive glass-interactive-flat p-1.5 rounded-full disabled:opacity-40 ${t(isDark, 'text-slate-400 hover:text-slate-100', 'text-slate-500 hover:text-slate-900')}`}
                >
                  <Icon size={15}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></Icon>
                </button>
                <label
                  title={translate('playbook_replace_photo')}
                  className={`glass-interactive glass-interactive-flat p-1.5 rounded-full cursor-pointer ${photoBusy ? 'pointer-events-none opacity-40' : ''} ${t(isDark, 'text-slate-400 hover:text-slate-100', 'text-slate-500 hover:text-slate-900')}`}
                >
                  <Icon size={15}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></Icon>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => attachOrReplacePhoto(e.target.files?.[0])}
                  />
                </label>
                <button
                  type="button"
                  title={translate('playbook_remove_photo')}
                  onClick={removePhoto}
                  disabled={photoBusy}
                  className={`glass-interactive glass-interactive-flat p-1.5 rounded-full disabled:opacity-40 ${t(isDark, 'text-slate-400 hover:text-red-300', 'text-slate-500 hover:text-red-600')}`}
                >
                  <Icon size={15}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></Icon>
                </button>
              </>
            ) : (
              <label
                className={`glass-interactive glass-interactive-flat flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg cursor-pointer ${photoBusy ? 'pointer-events-none opacity-40' : ''} ${t(isDark,
                  'text-slate-300 hover:bg-white/5',
                  'text-slate-600 hover:bg-slate-100'
                )}`}
              >
                <Icon size={13}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></Icon>
                {translate('add_doc_attach_photo')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => attachOrReplacePhoto(e.target.files?.[0])}
                />
              </label>
            )}
            <button onClick={onClose} className={t(isDark, 'text-slate-500 hover:text-slate-100 text-xl leading-none ml-1', 'text-slate-400 hover:text-slate-900 text-xl leading-none ml-1')}>&times;</button>
          </div>
        </div>

        {photoErrorKey && (
          <p className="text-xs text-red-400 mb-3 -mt-1">{translate(photoErrorKey)}</p>
        )}

        <h2 className={t(isDark, 'text-2xl font-semibold text-slate-100 mb-4', 'text-2xl font-semibold text-slate-900 mb-4')}>{translate('playbook_how_to_apply')}</h2>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-2">
          {activePlaybook.steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= currentStep ? (accent === 'emerald' ? 'bg-emerald-400' : 'bg-[var(--accent-400)]') : t(isDark, 'bg-white/10', 'bg-slate-200')
              }`}
            />
          ))}
        </div>

        {/* Step counter + dots */}
        <div className="flex items-center justify-between mb-3">
          <span className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>{translate('playbook_step_counter', { current: currentStep + 1, total: totalSteps })}</span>
          <div className="flex items-center gap-1.5">
            {activePlaybook.steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`rounded-full transition-all ${
                  i === currentStep
                    ? `w-2.5 h-2.5 ${accent === 'emerald' ? 'bg-emerald-400' : 'bg-[var(--accent-400)]'}`
                    : t(isDark, 'w-1.5 h-1.5 bg-white/15 hover:bg-white/30', 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400')
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step card */}
        <div
          className={`rounded-2xl border p-4 md:p-5 mb-4 transition-colors duration-300 overflow-hidden ${
            accent === 'emerald'
              ? t(isDark, 'border-emerald-400/20 bg-emerald-400/[0.04]', 'border-emerald-200 bg-emerald-50')
              : t(isDark, 'border-blue-400/20 bg-blue-400/[0.04]', 'border-blue-200 bg-blue-50')
          }`}
        >
          <div
            key={currentStep}
            style={{ animation: `${direction === 1 ? 'flashcard-in-forward' : 'flashcard-in-backward'} 260ms ease-out` }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3 ${
                accent === 'emerald' ? 'bg-emerald-400 text-emerald-950' : 'bg-[var(--accent-400)] text-slate-950'
              }`}
            >
              {currentStep + 1}
            </div>

            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-5 items-center">
              <div
                className="rounded-xl flex items-center justify-center h-32 md:h-36"
                style={{
                  backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)'} 1px, transparent 1px)`,
                  backgroundSize: '18px 18px',
                  backgroundColor: accent === 'emerald' ? 'rgba(16,185,129,0.05)' : 'color-mix(in srgb, var(--accent-400) 6%, transparent)',
                }}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center font-semibold ${
                    isStepDone
                      ? accent === 'emerald'
                        ? 'bg-emerald-400 text-emerald-950'
                        : 'bg-[var(--accent-400)] text-slate-950'
                      : t(isDark, 'bg-white/10 text-slate-400', 'bg-slate-100 text-slate-500')
                  }`}
                >
                  {isStepDone ? <Icon size={28}><path d="M20 6L9 17l-5-5" /></Icon> : <span className="text-2xl">{currentStep + 1}</span>}
                </div>
              </div>

              <div>
                <h3 className={t(isDark, 'text-xl font-semibold text-slate-100 mb-1', 'text-xl font-semibold text-slate-900 mb-1')}>{step.title}</h3>
                <p className={t(isDark, 'text-sm text-slate-400 mb-3', 'text-sm text-slate-500 mb-3')}>{step.description}</p>

                {step.tags?.length > 0 && (
                  <>
                    <p className={t(isDark, 'text-xs font-semibold tracking-widest text-slate-500 mb-2', 'text-xs font-semibold tracking-widest text-slate-400 mb-2')}>{translate('playbook_what_youll_need')}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {step.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-xs px-3 py-1.5 rounded-full border ${
                            accent === 'emerald'
                              ? t(isDark, 'border-emerald-400/20 text-emerald-300 bg-emerald-400/5', 'border-emerald-300 text-emerald-700 bg-white')
                              : t(isDark, 'border-blue-400/20 text-blue-300 bg-blue-400/5', 'border-blue-300 text-blue-700 bg-white')
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => toggleStep(currentStep)}
                  className={t(isDark, 'flex items-center gap-2.5 text-sm text-slate-300 hover:text-slate-100 group', 'flex items-center gap-2.5 text-sm text-slate-600 hover:text-slate-900 group')}
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isStepDone
                        ? accent === 'emerald'
                          ? 'bg-emerald-400 border-emerald-400 text-emerald-950'
                          : 'bg-[var(--accent-400)] border-[var(--accent-400)] text-slate-950'
                        : t(isDark, 'border-white/20 text-transparent group-hover:border-white/40', 'border-slate-300 text-transparent group-hover:border-slate-400')
                    }`}
                  >
                    <Icon size={12}><path d="M20 6L9 17l-5-5" /></Icon>
                  </span>
                  {translate('playbook_mark_done')}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => goToStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`glass-interactive ${t(isDark,
                'flex items-center gap-1 text-sm font-medium text-slate-300 px-4 py-2 rounded-xl hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent',
                'flex items-center gap-1 text-sm font-medium text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent'
              )}`}
            >
              <Icon size={15}><path d="M15 18l-6-6 6-6" /></Icon>
              {translate('playbook_previous')}
            </button>

            {isFinalStep ? (
              <button
                type="button"
                onClick={() => toggleStep(currentStep)}
                className={`glass-interactive ${t(isDark,
                  'flex items-center gap-1.5 text-sm font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 px-4 py-2 rounded-xl',
                  'flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-xl'
                )}`}
              >
                <Icon size={14}><path d="M20 6L9 17l-5-5" /></Icon>
                {isStepDone ? translate('playbook_all_steps_done') : translate('playbook_final_step')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToStep(Math.min(totalSteps - 1, currentStep + 1))}
                className="glass-accent glass-interactive flex items-center gap-1 text-sm font-semibold text-white px-4 py-2 rounded-xl"
              >
                {translate('playbook_next_step')}
                <Icon size={15}><path d="M9 18l6-6-6-6" /></Icon>
              </button>
            )}
          </div>
        </div>

        {/* All steps */}
        <p className={t(isDark, 'text-xs font-semibold tracking-widest text-slate-500 mb-2', 'text-xs font-semibold tracking-widest text-slate-400 mb-2')}>{translate('playbook_all_steps')}</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {activePlaybook.steps.map((s, i) => {
            const done = completedSteps.includes(i)
            const active = i === currentStep
            return (
              <button
                key={i}
                type="button"
                onClick={() => goToStep(i)}
                className={`glass-interactive glass-interactive-slow rounded-xl border p-2.5 text-left ${
                  active
                    ? accent === 'emerald'
                      ? t(isDark, 'border-emerald-400/50 bg-emerald-400/5', 'border-emerald-400 bg-emerald-50')
                      : t(isDark, 'border-blue-400/50 bg-blue-400/5', 'border-blue-400 bg-blue-50')
                    : t(isDark, 'glass-dark border-white/10', 'glass-light border-slate-200')
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold mb-1.5 ${
                    done ? 'bg-emerald-400 text-emerald-950' : t(isDark, 'bg-white/10 text-slate-400', 'bg-slate-100 text-slate-500')
                  }`}
                >
                  {done ? <Icon size={12}><path d="M20 6L9 17l-5-5" /></Icon> : i + 1}
                </span>
                <p className={t(isDark, 'text-xs text-slate-300 leading-tight', 'text-xs text-slate-600 leading-tight')}>{s.title}</p>
              </button>
            )
          })}
        </div>

        <div className={t(isDark, 'flex flex-col gap-1.5 pt-1 mb-3 text-sm text-slate-300', 'flex flex-col gap-1.5 pt-1 mb-3 text-sm text-slate-600')}>
          <p className="flex items-center gap-2">
            <span className={t(isDark, 'text-slate-500 shrink-0', 'text-slate-400 shrink-0')} title={translate('playbook_estimated_cost')}>
              <Icon size={15}>
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </Icon>
            </span>
            {activePlaybook.estimatedCost}
          </p>
          <p className="flex items-center gap-2">
            <span className={t(isDark, 'text-slate-500 shrink-0', 'text-slate-400 shrink-0')} title={translate('playbook_estimated_time')}>
              <Icon size={15}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </Icon>
            </span>
            {activePlaybook.estimatedTime}
          </p>
          {activePlaybook.officialSite && (
            <p className="flex items-center gap-2">
              <span className={t(isDark, 'text-slate-500 shrink-0', 'text-slate-400 shrink-0')} title={translate('playbook_official_site')}>
                <Icon size={15}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" /></Icon>
              </span>
              <a
                href={activePlaybook.officialSite.url}
                target="_blank"
                rel="noopener noreferrer"
                className={t(isDark, 'text-blue-300 hover:text-blue-200 underline underline-offset-2', 'text-blue-600 hover:text-blue-700 underline underline-offset-2')}
              >
                {activePlaybook.officialSite.name}
              </a>
            </p>
          )}
        </div>

        <WaitTimeSection isDark={isDark} agencyCode={AGENCY_BADGE[activeDocType]?.label} userId={userId} />

        <div className="flex flex-col items-center text-center">
          {feedbackGiven ? (
            <p className={t(isDark, 'text-sm text-emerald-400 font-medium', 'text-sm text-emerald-600 font-medium')}>{translate('playbook_thanks_feedback')}</p>
          ) : (
            <>
              <p className={t(isDark, 'text-sm font-medium text-slate-100 mb-2', 'text-sm font-medium text-slate-900 mb-2')}>{translate('playbook_was_accurate')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => submitFeedback(true)}
                  disabled={submitting}
                  title={translate('playbook_yes_accurate')}
                  aria-label={translate('playbook_yes_accurate')}
                  className={`glass-interactive ${t(isDark,
                    'w-10 h-10 rounded-full bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 flex items-center justify-center disabled:opacity-50',
                    'w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center disabled:opacity-50'
                  )}`}
                >
                  <Icon size={20}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </Icon>
                </button>
                <button
                  onClick={() => setShowCommentBox(true)}
                  disabled={submitting}
                  title={translate('playbook_something_off')}
                  aria-label={translate('playbook_something_off')}
                  className={`glass-interactive ${t(isDark,
                    'w-10 h-10 rounded-full bg-red-400/10 text-red-300 hover:bg-red-400/20 flex items-center justify-center disabled:opacity-50',
                    'w-10 h-10 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center disabled:opacity-50'
                  )}`}
                >
                  <Icon size={20}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </Icon>
                </button>
              </div>
              {showCommentBox && (
                <div className="mt-2 w-full max-w-sm">
                  <textarea
                    placeholder={translate('playbook_comment_placeholder')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className={t(isDark,
                      'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 mb-2 focus:outline-none focus:border-blue-400/50 transition-colors',
                      'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 mb-2 focus:outline-none focus:border-blue-400 transition-colors'
                    )}
                    rows={3}
                  />
                  <button
                    onClick={() => submitFeedback(false)}
                    disabled={submitting}
                    className="glass-accent glass-interactive text-white font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-60"
                  >
                    {submitting ? translate('playbook_submitting') : translate('playbook_submit_feedback')}
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
