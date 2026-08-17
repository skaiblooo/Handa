// Backs the optional "attach a photo" step in Add Document and the "View
// photo" link in PlaybookModal. Uploads go to the private document-photos
// bucket under a path prefixed with the uploader's own user id — required
// server-side by that bucket's storage.objects RLS policies, not just a
// client-side convention.
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Returns an i18n key naming the problem, or null if the file's fine —
// kept as a plain function (no hook access) so callers translate it.
export function validatePhotoFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return 'add_doc_photo_invalid_type'
  if (file.size > MAX_PHOTO_BYTES) return 'add_doc_photo_too_large'
  return null
}

export async function uploadDocumentPhoto(supabase, userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('document-photos').upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
  })
  if (error) return { ok: false }
  return { ok: true, path }
}

// Private bucket, so viewing always goes through a signed URL rather than
// a plain public path — this one's good for an hour, plenty for opening
// it in a tab right after clicking.
export async function getDocumentPhotoUrl(supabase, path) {
  if (!path) return null
  const { data, error } = await supabase.storage.from('document-photos').createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}

// Best-effort — called both on an explicit "remove" and to clean up the
// old file after a "replace". Swallowing the error rather than surfacing
// it: an orphaned storage object is a minor cleanup miss, not something
// worth blocking the user's actual action (removing/replacing the photo
// on their document, which is the part that has to succeed) over.
export async function deleteDocumentPhoto(supabase, path) {
  if (!path) return
  try {
    await supabase.storage.from('document-photos').remove([path])
  } catch {
    // best-effort
  }
}
