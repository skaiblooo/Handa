// Each document type has two real, distinct processes: applying for it for
// the first time, and renewing (or otherwise managing) one you already
// hold. Where the real-world process genuinely differs (driver's license,
// passport, NBI clearance, national ID, SSS, PhilHealth, Pag-IBIG, TIN),
// the two variants have different steps, requirements, costs, and
// timelines. Where it doesn't meaningfully differ (a PSA birth certificate
// is requested the same way every time), both variants share the same
// content rather than inventing a distinction that doesn't exist.
export const playbooks = {
  drivers_license: {
    lastVerified: '2026-08-01',
    application: {
      title: "Driver's License Application",
      overview:
        'First-time applicants need a Student Permit before they can apply for a license, plus a practical driving course, both extra steps that renewing drivers skip.',
      requirements: [
        'Valid ID',
        'Medical certificate from an LTO-accredited clinic (valid 60 days from issuance)',
        'Completed Theoretical Driving Course (TDC) via the LTMS portal',
        "Student Permit (SP), held for at least the required waiting period",
        'Practical Driving Course (PDC) certificate from an accredited driving school',
      ],
      steps: [
        {
          title: 'Log In to LTMS',
          description: 'Create your account on the LTMS portal',
          tags: ['Valid email address', 'Stable internet connection'],
        },
        {
          title: 'Complete TDC',
          description: 'Complete the Theoretical Driving Course online, required before a Student Permit is issued',
          tags: ['LTMS account', 'About an hour of time'],
        },
        {
          title: 'Get Medical Certificate',
          description: 'Book a telemedicine or in-clinic medical exam and get your certificate transmitted online',
          tags: ['Valid ID', 'LTO-accredited clinic'],
        },
        {
          title: 'Apply for Student Permit',
          description: 'Apply for and pay for your Student Permit (SP), valid for one year',
          tags: ['Completed TDC', 'Medical certificate'],
        },
        {
          title: 'Complete PDC',
          description: 'Complete the required Practical Driving Course at an LTO-accredited driving school',
          tags: ['Student Permit', 'Enrollment fee'],
        },
        {
          title: 'Take Exam & Claim License',
          description: 'Pass the theoretical and practical exams at your LTO branch, then claim your license',
          tags: ['PDC certificate', 'Proof of payment'],
        },
      ],
      estimatedCost: '₱1,500–₱4,000+ (SP fee, PDC training, medical, license fee)',
      estimatedTime: 'A few weeks to a couple of months, mostly gated by SP validity and PDC scheduling',
    },
    renewal: {
      title: "Driver's License Renewal",
      overview:
        'Renewal can mostly be done online through the LTMS portal, but biometrics and card release still require an in-person visit.',
      requirements: [
        'Your current or expired driver\'s license (original)',
        'Medical certificate from an LTO-accredited clinic (valid 60 days from issuance)',
        'Completed CDE (Comprehensive Driver\'s Education) exam via the LTMS portal',
        'Settle any unpaid traffic violations before applying',
      ],
      steps: [
        {
          title: 'Log In to LTMS',
          description: 'Create or log in to your account on the LTMS portal',
          tags: ['Valid email address', 'Stable internet connection'],
        },
        {
          title: 'Complete CDE Exam',
          description: 'Complete the CDE online exam if required for your license type',
          tags: ['LTMS account', 'About an hour of time'],
        },
        {
          title: 'Book Medical Exam',
          description: 'Book a telemedicine or in-clinic medical exam and get your certificate transmitted online',
          tags: ['Valid ID', 'LTO-accredited clinic'],
        },
        {
          title: 'Schedule Appointment',
          description: 'Schedule your renewal appointment through the portal',
          tags: ['Completed medical certificate', 'Preferred branch in mind'],
        },
        {
          title: 'Pay Renewal Fee',
          description: 'Pay the renewal fee online',
          tags: ['Online payment method', 'Confirmed appointment'],
        },
        {
          title: 'Visit LTO Branch',
          description: 'Visit your chosen LTO branch on your appointment date for biometrics and card release',
          tags: ['Current or expired license', 'Proof of payment'],
        },
      ],
      estimatedCost: '₱585–₱1,300 (base fee + medical certificate)',
      estimatedTime: 'Same day to a few weeks, depending on appointment availability',
    },
  },

  national_id: {
    lastVerified: '2026-08-01',
    application: {
      title: 'National ID Registration',
      overview: 'Registration and issuance is handled through the Philippine Statistics Authority (PSA) PhilSys program.',
      requirements: [
        'Birth certificate or other primary ID for registration',
        'Confirmed appointment (where required) via the PhilSys registration portal',
      ],
      steps: [
        {
          title: 'Register Online',
          description: 'Register online or at a registration center',
          tags: ['Birth certificate or primary ID', 'Basic personal info'],
        },
        {
          title: 'Demographic Data Capture',
          description: 'Complete Step 1 (demographic data capture)',
          tags: ['Valid ID', 'Proof of address'],
        },
        {
          title: 'Biometrics Capture',
          description: 'Complete Step 2 (biometrics capture) at a physical center',
          tags: ['Confirmed appointment', 'Valid ID'],
        },
        {
          title: 'Receive Your PhilID',
          description: 'Wait for your PhilID to be delivered or notified for pickup',
          tags: ['Tracking reference', 'Valid ID for claiming'],
        },
      ],
      estimatedCost: 'Free',
      estimatedTime: 'Several weeks to a few months for delivery',
    },
    renewal: {
      title: 'National ID Replacement / Update',
      overview: 'For a lost, damaged, or outdated PhilID, corrections and replacements are requested through PSA Serbilis or a registration center.',
      requirements: [
        'Valid ID',
        'Affidavit of loss (if lost) or the damaged card (if damaged)',
        'Supporting documents for the correction being requested',
      ],
      steps: [
        {
          title: 'Report the Issue',
          description: 'Report the loss, damage, or data correction needed via the PhilSys website or hotline',
          tags: ['Valid ID', 'Details of the issue'],
        },
        {
          title: 'Pay Replacement Fee',
          description: 'Pay the applicable fee. First data correction is typically free, lost or damaged cards have a minimal fee',
          tags: ['Payment method'],
        },
        {
          title: 'Submit Your Request',
          description: 'Submit your request and supporting documents at a registration center',
          tags: ['Affidavit of loss (if applicable)', 'Supporting documents'],
        },
        {
          title: 'Receive Updated PhilID',
          description: 'Wait for your replacement or corrected PhilID to be delivered or ready for pickup',
          tags: ['Tracking reference', 'Valid ID for claiming'],
        },
      ],
      estimatedCost: 'Free for first correction; minimal fee for lost/damaged replacement',
      estimatedTime: 'Several weeks',
    },
  },

  sss: {
    lastVerified: '2026-08-01',
    application: {
      title: 'Get Your SSS Number',
      overview: 'A one-time registration with the Social Security System (SSS) to get your permanent SS number.',
      requirements: [
        'Birth certificate or valid government-issued ID',
      ],
      steps: [
        {
          title: 'Prepare Requirements',
          description: 'Gather your birth certificate or a valid ID for the SS number application',
          tags: ['Birth certificate or valid ID'],
        },
        {
          title: 'Apply for SS Number',
          description: 'Apply online via the SSS website, or in person at an SSS branch',
          tags: ['Valid ID', 'Basic personal info'],
        },
        {
          title: 'Receive Your SS Number',
          description: 'Get confirmation of your permanent, lifetime SS number',
          tags: ['Application reference'],
        },
        {
          title: 'Register on My.SSS',
          description: 'Create your online My.SSS account using your new SS number',
          tags: ['SS number', 'Email address'],
        },
      ],
      estimatedCost: 'Free',
      estimatedTime: 'Same day online, longer if a branch visit is needed',
    },
    renewal: {
      title: 'SSS My.SSS Account & Records',
      overview: 'For members who already have an SS number, managed through the Social Security System (SSS), mostly online via the My.SSS portal.',
      requirements: [
        'Valid government-issued ID',
        'My.SSS online account',
      ],
      steps: [
        {
          title: 'Register on My.SSS',
          description: 'Register for a My.SSS account online',
          tags: ['Valid government ID', 'Email address'],
        },
        {
          title: 'Verify Your Account',
          description: 'Verify your account via email',
          tags: ['Access to your email'],
        },
        {
          title: 'Update Records',
          description: 'Update records or request documents through the portal',
          tags: ['My.SSS account', 'Supporting documents'],
        },
        {
          title: 'Visit SSS Branch (if needed)',
          description: 'Visit an SSS branch only if online verification fails',
          tags: ['Valid ID', 'Printed request form'],
        },
      ],
      estimatedCost: 'Free for registration',
      estimatedTime: 'Same day online, longer if branch visit is needed',
    },
  },

  philhealth: {
    lastVerified: '2026-08-01',
    application: {
      title: 'PhilHealth Registration',
      overview: 'First-time registration with PhilHealth to get your permanent PhilHealth Identification Number (PIN).',
      requirements: [
        'Valid government-issued ID',
        'Accomplished PhilHealth Member Registration Form (PMRF)',
      ],
      steps: [
        {
          title: 'Prepare Requirements',
          description: 'Get a valid ID ready and accomplish the PhilHealth Member Registration Form (PMRF)',
          tags: ['Valid ID', 'PMRF'],
        },
        {
          title: 'Register',
          description: 'Register online or at a PhilHealth office to get your PhilHealth Identification Number (PIN)',
          tags: ['Accomplished PMRF', 'Valid ID'],
        },
        {
          title: 'Receive Your PIN',
          description: 'Get confirmation of your permanent PhilHealth number',
          tags: ['Registration reference'],
        },
        {
          title: 'Log In to Member Portal',
          description: 'Create your online Member Portal account using your PIN',
          tags: ['PhilHealth PIN', 'Email address'],
        },
      ],
      estimatedCost: 'Free to register',
      estimatedTime: 'Same day online, longer if a branch visit is needed',
    },
    renewal: {
      title: 'PhilHealth Membership',
      overview: 'For existing members, managed through PhilHealth, with contribution tracking via the Member Portal.',
      requirements: [
        'Valid government-issued ID',
        'PhilHealth Member Portal account',
      ],
      steps: [
        {
          title: 'Log In to Member Portal',
          description: 'Register or log in to the PhilHealth Member Portal',
          tags: ['Valid ID', 'Email address'],
        },
        {
          title: 'Update Membership Data',
          description: 'Update your membership data if needed',
          tags: ['Member Portal account'],
        },
        {
          title: 'Pay Contributions',
          description: 'Pay contributions online or through accredited channels',
          tags: ['Payment method', 'PhilHealth number'],
        },
        {
          title: 'Download Your MDR',
          description: 'Download your Member Data Record (MDR) if required',
          tags: ['Member Portal account'],
        },
      ],
      estimatedCost: 'Contribution-based (varies by income bracket)',
      estimatedTime: 'Same day online',
    },
  },

  pagibig: {
    lastVerified: '2026-08-01',
    application: {
      title: 'Pag-IBIG Registration',
      overview: 'First-time registration with the Pag-IBIG Fund (HDMF) to get your permanent Membership ID (MID) number.',
      requirements: [
        'Valid government-issued ID',
        "Accomplished Member's Data Form (MDF)",
      ],
      steps: [
        {
          title: 'Prepare Requirements',
          description: "Get a valid ID ready and accomplish the Member's Data Form (MDF)",
          tags: ['Valid ID', 'MDF'],
        },
        {
          title: 'Register',
          description: 'Register online or at a Pag-IBIG branch to get your Pag-IBIG MID number',
          tags: ['Accomplished MDF', 'Valid ID'],
        },
        {
          title: 'Receive Your MID Number',
          description: 'Get confirmation of your permanent Pag-IBIG Membership ID number',
          tags: ['Registration reference'],
        },
        {
          title: 'Register on Virtual Pag-IBIG',
          description: 'Create your online account using your new MID number',
          tags: ['Pag-IBIG MID number', 'Email address'],
        },
      ],
      estimatedCost: 'Free to register',
      estimatedTime: 'Same day online, longer if a branch visit is needed',
    },
    renewal: {
      title: 'Pag-IBIG Membership',
      overview: 'For existing members, managed through the Pag-IBIG Fund (HDMF), via the Virtual Pag-IBIG online portal.',
      requirements: [
        'Valid government-issued ID',
        'Virtual Pag-IBIG account',
      ],
      steps: [
        {
          title: 'Register on Virtual Pag-IBIG',
          description: 'Register for a Virtual Pag-IBIG account',
          tags: ['Valid ID', 'Pag-IBIG MID number'],
        },
        {
          title: 'Verify Registration',
          description: 'Verify your registration',
          tags: ['Access to your email'],
        },
        {
          title: 'Pay Contributions',
          description: 'Pay contributions online or through accredited partners',
          tags: ['Payment method'],
        },
        {
          title: 'Check Your TAV',
          description: 'Check your Total Accumulated Value (TAV) through the portal',
          tags: ['Virtual Pag-IBIG account'],
        },
      ],
      estimatedCost: 'Contribution-based',
      estimatedTime: 'Same day online',
    },
  },

  psa_birth_certificate: {
    lastVerified: '2026-08-01',
    // A birth certificate is a historical record, not something you renew —
    // every request follows the same process, first time or not.
    shared: {
      title: 'PSA Birth Certificate',
      overview: 'Requested through the Philippine Statistics Authority, either online via PSA Serbilis/e-Census or in person.',
      requirements: [
        'Full name and birth details as registered',
        'Valid ID of the requesting party',
      ],
      steps: [
        {
          title: 'Request Online',
          description: 'Request online through an authorized PSA portal',
          tags: ['Full name & birth details', 'Valid ID'],
        },
        {
          title: 'Pay the Fee',
          description: 'Pay the applicable fee',
          tags: ['Payment method'],
        },
        {
          title: 'Receive Your Copy',
          description: 'Wait for delivery, or claim at a designated outlet',
          tags: ['Tracking reference', 'Valid ID for claiming'],
        },
      ],
      estimatedCost: '₱155–₱365 depending on delivery method',
      estimatedTime: '3-10 business days',
    },
  },

  tin_bir: {
    lastVerified: '2026-08-01',
    application: {
      title: 'TIN Registration',
      overview: 'First-time registration with the Bureau of Internal Revenue (BIR) to get a Taxpayer Identification Number (TIN).',
      requirements: [
        'Valid government-issued ID',
        'BIR Form 1902 (employees), 1901 (self-employed/professionals), or 1904 (one-time taxpayers)',
      ],
      steps: [
        {
          title: 'Determine Registration Type',
          description: 'Figure out whether you register as an employee, self-employed/professional, or one-time taxpayer',
          tags: ['Employment status in mind'],
        },
        {
          title: 'Prepare Requirements',
          description: 'Gather your valid ID and supporting documents (e.g. Certificate of Employment for employees)',
          tags: ['Valid ID', 'Supporting documents'],
        },
        {
          title: 'Register at Your RDO',
          description: 'Submit your form at the Revenue District Office (RDO) covering your address or employer, or online if eligible',
          tags: ['Accomplished form', 'Valid ID'],
        },
        {
          title: 'Receive Your TIN',
          description: 'Get your Taxpayer Identification Number and Certificate of Registration, if applicable',
          tags: ['Registration reference'],
        },
      ],
      estimatedCost: 'Free to register',
      estimatedTime: 'Same day to a few business days',
    },
    renewal: {
      title: 'TIN / BIR Records Update',
      overview: 'For existing TIN holders, managed through the Bureau of Internal Revenue (BIR), for records updates and transactions.',
      requirements: [
        'Valid government-issued ID',
        'Accomplished BIR form (varies by transaction type)',
      ],
      steps: [
        {
          title: 'Determine the Right Form',
          description: 'Determine the correct BIR form for your transaction',
          tags: ['Type of transaction in mind'],
        },
        {
          title: 'Accomplish the Form',
          description: 'Accomplish the form and prepare requirements',
          tags: ['Valid ID', 'Supporting documents'],
        },
        {
          title: 'Submit to Your RDO',
          description: 'Submit at your Revenue District Office (RDO) or online if eligible',
          tags: ['Accomplished form', 'Valid ID'],
        },
        {
          title: 'Keep Your Copy',
          description: 'Keep your stamped/received copy for your records',
          tags: ['Stamped or received form'],
        },
      ],
      estimatedCost: 'Varies by transaction',
      estimatedTime: 'Same day to a few business days',
    },
  },

  passport: {
    lastVerified: '2026-08-01',
    application: {
      title: 'Passport Application',
      overview:
        'First-time applicants need a PSA birth certificate on hand, but everything else follows the same DFA appointment process as a renewal.',
      requirements: [
        'PSA birth certificate (original and photocopy)',
        'At least one valid government-issued ID',
        'Confirmed appointment from the DFA online appointment system',
        'Proof of payment (paid online or on-site depending on your appointment type)',
      ],
      steps: [
        {
          title: 'Book DFA Appointment',
          description: 'Book an appointment through the DFA appointment website',
          tags: ['Stable internet connection', 'Email address'],
        },
        {
          title: 'Fill Out & Pay Online',
          description: 'Fill out the online application form and pay the applicable fee',
          tags: ['Payment method', 'Basic personal info'],
        },
        {
          title: 'Prepare Your Documents',
          description: 'Gather your PSA birth certificate and valid ID. First-timers need these since there\'s no prior passport on file',
          tags: ['PSA birth certificate', 'Valid ID'],
        },
        {
          title: 'Appear at DFA Site',
          description: 'Appear at your chosen DFA site on your appointment date with required documents',
          tags: ['Birth certificate', 'Valid ID', 'Confirmed appointment'],
        },
        {
          title: 'Biometrics Capture',
          description: 'Have your biometrics (photo, fingerprints) captured on-site',
          tags: ['Appear in person'],
        },
        {
          title: 'Track & Receive',
          description: 'Track your passport status online and claim or wait for delivery',
          tags: ['Reference number', 'Valid ID for claiming'],
        },
      ],
      estimatedCost: '₱950 (regular processing) to ₱1,200 (expedited)',
      estimatedTime: '6-15 business days once your appointment date arrives; first-timer slots can be booked weeks out',
    },
    renewal: {
      title: 'Passport Renewal',
      overview:
        'Passport renewal requires an appointment booked through the DFA website, and applicants must appear in person.',
      requirements: [
        'Current passport (original)',
        'Valid government-issued ID',
        'Confirmed appointment from the DFA online appointment system',
        'Proof of payment (paid online or on-site depending on your appointment type)',
      ],
      steps: [
        {
          title: 'Book DFA Appointment',
          description: 'Book an appointment through the DFA appointment website',
          tags: ['Stable internet connection', 'Email address'],
        },
        {
          title: 'Fill Out & Pay Online',
          description: 'Fill out the online application form and pay the applicable fee',
          tags: ['Payment method', 'Basic personal info'],
        },
        {
          title: 'Appear at DFA Site',
          description: 'Appear at your chosen DFA site on your appointment date with required documents',
          tags: ['Current passport', 'Valid ID', 'Confirmed appointment'],
        },
        {
          title: 'Biometrics Capture',
          description: 'Have your biometrics (photo, fingerprints) captured on-site',
          tags: ['Appear in person'],
        },
        {
          title: 'Track & Receive',
          description: 'Track your passport status online and claim or wait for delivery',
          tags: ['Reference number', 'Valid ID for claiming'],
        },
      ],
      estimatedCost: '₱950 (regular processing) to ₱1,200 (expedited)',
      estimatedTime: '6-15 business days depending on processing type',
    },
  },

  nbi_clearance: {
    lastVerified: '2026-08-01',
    application: {
      title: 'NBI Clearance Application',
      overview:
        'First-time applicants must appear in person for biometrics capture, since there\'s no prior fingerprint record on file yet.',
      requirements: [
        'Valid government-issued ID',
        'NBI online account (register at the NBI clearance website)',
        'Payment (online or at accredited payment centers)',
      ],
      steps: [
        {
          title: 'Register Online',
          description: 'Register for an account on the NBI clearance online system',
          tags: ['Valid email address', 'Mobile number', 'Full legal name'],
        },
        {
          title: 'Fill Out the Form',
          description: 'Fill out the application form with accurate personal details',
          tags: ['NBI online account', 'Basic personal info'],
        },
        {
          title: 'Choose a Branch',
          description: 'Choose your preferred branch and available appointment date',
          tags: ['Preferred branch in mind', 'Flexible schedule'],
        },
        {
          title: 'Pay the Fee',
          description: 'Pay the clearance fee online or at an accredited outlet',
          tags: ['Payment method', 'Confirmed application'],
        },
        {
          title: 'Biometrics Capture',
          description: 'Appear at the branch for biometrics capture, required since you have no prior record',
          tags: ['Valid ID', 'Proof of payment'],
        },
        {
          title: 'Receive Clearance',
          description: 'If flagged for a "hit" (name match), wait for manual verification before release',
          tags: ['Transaction reference', 'Valid ID for claiming', 'Same-day if no hit'],
        },
      ],
      estimatedCost: '₱130 + minor transaction fee if paid online',
      estimatedTime: 'Same day if no hit; 3-10 business days if flagged for verification',
    },
    renewal: {
      title: 'NBI Clearance Renewal',
      overview:
        "If your biometrics are already on file and clean, NBI's online system can skip the branch visit entirely. The main friction is just checking whether you qualify.",
      requirements: [
        'Valid government-issued ID',
        'NBI online account with a prior clearance on record',
        'Payment (online or at accredited payment centers)',
      ],
      steps: [
        {
          title: 'Register Online',
          description: 'Log in to your existing account on the NBI clearance online system',
          tags: ['Valid email address', 'Existing NBI record'],
        },
        {
          title: 'Fill Out the Form',
          description: 'Confirm your details. The system pre-fills them from your prior application',
          tags: ['NBI online account'],
        },
        {
          title: 'Pay the Fee',
          description: 'Pay the clearance fee online or at an accredited outlet',
          tags: ['Payment method', 'Confirmed application'],
        },
        {
          title: 'Check Appearance Requirement',
          description: 'The system tells you if you can skip the branch visit (recent biometrics, no hit) or still need to appear',
          tags: ['Prior biometrics on file'],
        },
        {
          title: 'Receive Clearance',
          description: 'Download online if appearance was waived, or claim at the branch if you had to appear',
          tags: ['Transaction reference', 'Valid ID for claiming'],
        },
      ],
      estimatedCost: '₱130 + minor transaction fee if paid online',
      estimatedTime: 'Same day, often fully online with no branch visit',
    },
  },
}

// Resolves a document type + intent ('application' or 'renewal') to a flat
// playbook object — the same shape every consumer already expects
// (title/overview/requirements/steps/estimatedCost/estimatedTime/lastVerified).
// Falls back to whichever variant actually exists, so a type without a real
// application/renewal distinction (like a birth certificate) still resolves.
export function getPlaybook(docType, intent) {
  const entry = playbooks[docType]
  if (!entry) return null
  const variant = entry.shared || entry[intent] || entry.renewal || entry.application
  if (!variant) return null
  return { ...variant, lastVerified: entry.lastVerified }
}
