export const playbooks = {
  drivers_license: {
    title: "Driver's License Renewal",
    lastVerified: '2026-08-01',
    overview:
      "Renewal can mostly be done online through the LTMS portal, but biometrics and card release still require an in-person visit.",
    requirements: [
      'Your current or expired driver\'s license (original)',
      'Medical certificate from an LTO-accredited clinic (valid 60 days from issuance)',
      'Completed CDE (Comprehensive Driver\'s Education) exam via the LTMS portal',
      'Settle any unpaid traffic violations before applying',
    ],
    steps: [
      'Create or log in to your account on the LTMS portal',
      'Complete the CDE online exam if required for your license type',
      'Book a telemedicine or in-clinic medical exam and get your certificate transmitted online',
      'Schedule your renewal appointment through the portal',
      'Pay the renewal fee online',
      'Visit your chosen LTO branch on your appointment date for biometrics and card release',
    ],
    estimatedCost: '₱585–₱1,300 (base fee + medical certificate)',
    estimatedTime: 'Same day to a few weeks, depending on appointment availability',
  },

  passport: {
    title: 'Passport Renewal',
    lastVerified: '2026-08-01',
    overview:
      'Passport renewal requires an appointment booked through the DFA website, and applicants must appear in person.',
    requirements: [
      'Current passport (original)',
      'Valid government-issued ID',
      'Confirmed appointment from the DFA online appointment system',
      'Proof of payment (paid online or on-site depending on your appointment type)',
    ],
    steps: [
      'Book an appointment through the DFA appointment website',
      'Fill out the online application form and pay the applicable fee',
      'Appear at your chosen DFA site on your appointment date with required documents',
      'Have your biometrics (photo, fingerprints) captured on-site',
      'Track your passport status online and claim or wait for delivery',
    ],
    estimatedCost: '₱950 (regular processing) to ₱1,200 (expedited)',
    estimatedTime: '6-15 business days depending on processing type',
  },

  nbi_clearance: {
    title: 'NBI Clearance',
    lastVerified: '2026-08-01',
    overview:
      'Mostly online now — the main friction is booking a same-day-available biometrics slot at a branch near you.',
    requirements: [
      'Valid government-issued ID',
      'NBI online account (register at the NBI clearance website)',
      'Payment (online or at accredited payment centers)',
    ],
    steps: [
      'Register or log in to your account on the NBI clearance online system',
      'Fill out the application form with accurate personal details',
      'Choose your preferred branch and available appointment date',
      'Pay the clearance fee online or at an accredited outlet',
      'Appear at the branch for biometrics capture on your appointment date',
      'If flagged for a "hit" (name match), wait for manual verification before release',
    ],
    estimatedCost: '₱130 + minor transaction fee if paid online',
    estimatedTime: 'Same day if no hit; 3-10 business days if flagged for verification',
  },
}