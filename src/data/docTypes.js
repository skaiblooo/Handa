// Every Philippine government (and common supporting) document Orbit knows
// about, plus the issuing agency each one belongs to. Centralizing agencies
// here means every document from the same office shares one badge color and
// one ID-card gradient, instead of each document type picking its own.
//
// Badge/gradient values are complete, literal Tailwind class strings (never
// built with template interpolation) so Tailwind's build-time class scanner
// can actually find and generate them — a computed class name like
// `bg-${color}-600` would silently produce no CSS.
const AGENCIES = {
  PSA: { name: 'Philippine Statistics Authority', gov: true, badge: 'bg-orange-600', gradient: 'from-orange-600 to-orange-900' },
  LCRO: { name: 'Local Civil Registry Office', gov: true, badge: 'bg-orange-700', gradient: 'from-orange-800 to-orange-950' },
  COURT: { name: 'Philippine Courts', gov: true, badge: 'bg-zinc-600', gradient: 'from-zinc-700 to-zinc-950' },
  DSWD: { name: 'Department of Social Welfare and Development', gov: true, badge: 'bg-pink-600', gradient: 'from-pink-700 to-pink-950' },
  DFA: { name: 'Department of Foreign Affairs', gov: true, badge: 'bg-teal-600', gradient: 'from-teal-700 to-teal-950' },
  BI: { name: 'Bureau of Immigration', gov: true, badge: 'bg-cyan-600', gradient: 'from-cyan-700 to-cyan-950' },
  PRA: { name: 'Philippine Retirement Authority', gov: true, badge: 'bg-sky-600', gradient: 'from-sky-700 to-sky-950' },
  LTO: { name: 'Land Transportation Office', gov: true, badge: 'bg-blue-600', gradient: 'from-blue-700 to-blue-950' },
  SSS: { name: 'Social Security System', gov: true, badge: 'bg-emerald-600', gradient: 'from-emerald-700 to-emerald-950' },
  GSIS: { name: 'Government Service Insurance System', gov: true, badge: 'bg-green-600', gradient: 'from-green-700 to-green-950' },
  PH: { name: 'PhilHealth', gov: true, badge: 'bg-red-600', gradient: 'from-red-700 to-red-950' },
  HDMF: { name: 'Pag-IBIG Fund', gov: true, badge: 'bg-yellow-600', gradient: 'from-yellow-600 to-yellow-900' },
  OWWA: { name: 'Overseas Workers Welfare Administration', gov: true, badge: 'bg-violet-600', gradient: 'from-violet-700 to-violet-950' },
  BIR: { name: 'Bureau of Internal Revenue', gov: true, badge: 'bg-slate-600', gradient: 'from-slate-700 to-slate-950' },
  PRC: { name: 'Professional Regulation Commission', gov: true, badge: 'bg-indigo-600', gradient: 'from-indigo-700 to-indigo-950' },
  IBP: { name: 'Integrated Bar of the Philippines', gov: false, badge: 'bg-fuchsia-600', gradient: 'from-fuchsia-700 to-fuchsia-950' },
  CSC: { name: 'Civil Service Commission', gov: true, badge: 'bg-blue-800', gradient: 'from-blue-800 to-blue-950' },
  MARINA: { name: 'Maritime Industry Authority', gov: true, badge: 'bg-cyan-800', gradient: 'from-cyan-800 to-cyan-950' },
  NBI: { name: 'National Bureau of Investigation', gov: true, badge: 'bg-purple-600', gradient: 'from-purple-700 to-purple-950' },
  PNP: { name: 'Philippine National Police', gov: true, badge: 'bg-blue-900', gradient: 'from-blue-900 to-slate-950' },
  BRGY: { name: 'Barangay', gov: true, badge: 'bg-lime-600', gradient: 'from-lime-700 to-lime-950' },
  BJMP: { name: 'Bureau of Jail Management and Penology', gov: true, badge: 'bg-neutral-600', gradient: 'from-neutral-700 to-neutral-950' },
  BUCOR: { name: 'Bureau of Corrections', gov: true, badge: 'bg-stone-700', gradient: 'from-stone-800 to-stone-950' },
  LGU: { name: 'Local Government Unit', gov: true, badge: 'bg-amber-700', gradient: 'from-amber-700 to-amber-950' },
  OSCA: { name: 'Office for Senior Citizens Affairs', gov: true, badge: 'bg-purple-800', gradient: 'from-purple-800 to-purple-950' },
  EMP: { name: 'Employer', gov: false, badge: 'bg-neutral-500', gradient: 'from-neutral-600 to-neutral-800' },
  GOVT: { name: 'Government Agency', gov: true, badge: 'bg-slate-700', gradient: 'from-slate-800 to-slate-950' },
  SCH: { name: 'School / University', gov: false, badge: 'bg-yellow-800', gradient: 'from-yellow-800 to-yellow-950' },
  BANK: { name: 'Bank', gov: false, badge: 'bg-emerald-800', gradient: 'from-emerald-800 to-emerald-950' },
  UTIL: { name: 'Utility Provider', gov: false, badge: 'bg-rose-600', gradient: 'from-rose-700 to-rose-950' },
  RD: { name: 'Registry of Deeds', gov: true, badge: 'bg-orange-800', gradient: 'from-orange-800 to-stone-950' },
  NOTARY: { name: 'Notary Public', gov: false, badge: 'bg-zinc-700', gradient: 'from-zinc-800 to-zinc-950' },
  POST: { name: 'PhilPost', gov: true, badge: 'bg-red-800', gradient: 'from-red-800 to-red-950' },
  COMELEC: { name: 'Commission on Elections', gov: true, badge: 'bg-sky-800', gradient: 'from-sky-800 to-sky-950' },
  AFP: { name: 'Armed Forces of the Philippines', gov: true, badge: 'bg-green-800', gradient: 'from-green-800 to-green-950' },
  PCG: { name: 'Philippine Coast Guard', gov: true, badge: 'bg-cyan-700', gradient: 'from-cyan-800 to-slate-950' },
  PVAO: { name: 'Philippine Veterans Affairs Office', gov: true, badge: 'bg-green-900', gradient: 'from-green-900 to-slate-950' },
  NCIP: { name: 'National Commission on Indigenous Peoples', gov: true, badge: 'bg-amber-900', gradient: 'from-amber-900 to-stone-950' },
  NCMF: { name: 'National Commission on Muslim Filipinos', gov: true, badge: 'bg-emerald-900', gradient: 'from-emerald-900 to-slate-950' },
  CHURCH: { name: 'Church', gov: false, badge: 'bg-purple-900', gradient: 'from-purple-900 to-stone-950' },
  PRIVATE: { name: 'Private Individual', gov: false, badge: 'bg-neutral-700', gradient: 'from-neutral-800 to-neutral-950' },
  FEO: { name: 'PNP Firearms and Explosives Office', gov: true, badge: 'bg-slate-900', gradient: 'from-slate-900 to-black' },
}

export const AGENCY_NAMES = Object.fromEntries(Object.entries(AGENCIES).map(([code, a]) => [code, a.name]))

// Keyed by agency code (LTO, PSA, ...) rather than by document type — used
// wherever an agency mark is shown on its own, like the category picker's
// bubble row.
export const AGENCY_BADGE_COLOR = Object.fromEntries(Object.entries(AGENCIES).map(([code, a]) => [code, a.badge]))

// category: one of the 8 featured categories below, or 'other'.
// schema: optional card-front field list (falls back to a generic one).
// themeOverride: optional { gradient } for documents whose real-world look
// doesn't match their issuing agency's default color (e.g. a passport's
// red cover vs. DFA's teal badge).
const DOC_TYPES = [
  // Civil Registry
  { id: 'psa_birth_certificate', label: 'PSA Birth Certificate', agency: 'PSA', category: 'civil_registry', themeOverride: { gradient: 'from-amber-600 to-orange-900' },
    schema: [
      { key: 'fullName', label: 'Full Name', span: 2 },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'placeOfBirth', label: 'Place of Birth' },
      { key: 'motherName', label: "Mother's Maiden Name", span: 2 },
      { key: 'registryNo', label: 'Registry No.' },
    ] },
  { id: 'psa_marriage_certificate', label: 'PSA Marriage Certificate', agency: 'PSA', category: 'civil_registry' },
  { id: 'psa_death_certificate', label: 'PSA Death Certificate', agency: 'PSA', category: 'civil_registry' },
  { id: 'cenomar', label: 'Certificate of No Marriage (CENOMAR)', agency: 'PSA', category: 'civil_registry' },
  { id: 'certificate_no_death_record', label: 'Certificate of No Death Record', agency: 'PSA', category: 'civil_registry' },
  { id: 'report_of_birth', label: 'Report of Birth', agency: 'PSA', category: 'civil_registry' },
  { id: 'certificate_of_foundling', label: 'Certificate of Foundling', agency: 'PSA', category: 'civil_registry' },
  { id: 'lcro_birth_certificate', label: 'Local Civil Registry Birth Certificate', agency: 'LCRO', category: 'civil_registry' },
  { id: 'adoption_papers', label: 'Adoption Papers', agency: 'COURT', category: 'civil_registry' },
  { id: 'court_order_name_change', label: 'Court Order for Name Change', agency: 'COURT', category: 'civil_registry' },
  { id: 'court_order_correction_entry', label: 'Court Order for Correction of Entry', agency: 'COURT', category: 'civil_registry' },

  // Local Government
  { id: 'barangay_id', label: 'Barangay ID', agency: 'BRGY', category: 'local_gov' },
  { id: 'barangay_clearance', label: 'Barangay Clearance', agency: 'BRGY', category: 'local_gov' },
  { id: 'barangay_certificate', label: 'Barangay Certificate', agency: 'BRGY', category: 'local_gov' },
  { id: 'cedula', label: 'Cedula (Community Tax Certificate)', agency: 'LGU', category: 'local_gov' },
  { id: 'city_id', label: 'City ID', agency: 'LGU', category: 'local_gov' },
  { id: 'municipal_id', label: 'Municipal ID', agency: 'LGU', category: 'local_gov' },
  { id: 'residence_certificate', label: 'Residence Certificate', agency: 'LGU', category: 'local_gov' },

  // Identification
  { id: 'national_id', label: 'National ID (PhilSys)', agency: 'PSA', category: 'identification',
    schema: [
      { key: 'fullName', label: 'Full Name', span: 2 },
      { key: 'sex', label: 'Sex' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'address', label: 'Address', span: 2 },
      { key: 'pcn', label: 'PhilSys Card Number' },
    ] },
  { id: 'ephil_id', label: 'ePhilID', agency: 'PSA', category: 'identification' },

  // Social Security & Government Benefits
  { id: 'sss', label: 'SSS', agency: 'SSS', category: 'social_security',
    schema: [
      { key: 'fullName', label: 'Full Name', span: 2 },
      { key: 'sssNo', label: 'SSS No.' },
      { key: 'dob', label: 'Date of Birth' },
    ] },
  { id: 'philhealth', label: 'PhilHealth', agency: 'PH', category: 'social_security',
    schema: [
      { key: 'fullName', label: 'Full Name', span: 2 },
      { key: 'philhealthNo', label: 'PhilHealth No.' },
      { key: 'dob', label: 'Date of Birth' },
    ] },
  { id: 'pagibig', label: 'Pag-IBIG', agency: 'HDMF', category: 'social_security',
    schema: [
      { key: 'fullName', label: 'Full Name', span: 2 },
      { key: 'midNo', label: 'Pag-IBIG MID No.' },
      { key: 'dob', label: 'Date of Birth' },
    ] },
  { id: 'umid', label: 'UMID Card', agency: 'SSS', category: 'social_security' },
  { id: 'gsis_id', label: 'GSIS ID', agency: 'GSIS', category: 'social_security' },
  { id: 'philhealth_mdr', label: 'PhilHealth Member Data Record (MDR)', agency: 'PH', category: 'social_security' },
  { id: 'pagibig_loyalty_card', label: 'Pag-IBIG Loyalty Card Plus', agency: 'HDMF', category: 'social_security' },
  { id: 'pagibig_membership_record', label: 'Pag-IBIG Membership Record', agency: 'HDMF', category: 'social_security' },
  { id: 'owwa_ecard', label: 'OWWA e-Card', agency: 'OWWA', category: 'social_security' },
  { id: 'fourps_id', label: '4Ps ID', agency: 'DSWD', category: 'social_security' },

  // Background Checks & Clearances
  { id: 'nbi_clearance', label: 'NBI Clearance', agency: 'NBI', category: 'background_checks',
    schema: [
      { key: 'fullName', label: 'Full Name', span: 2 },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'address', label: 'Address', span: 2 },
      { key: 'nbiNo', label: 'NBI No.' },
    ] },
  { id: 'police_clearance', label: 'Police Clearance', agency: 'PNP', category: 'background_checks' },
  { id: 'court_clearance', label: 'Court Clearance', agency: 'COURT', category: 'background_checks' },
  { id: 'certificate_of_detention', label: 'Certificate of Detention', agency: 'BJMP', category: 'background_checks' },
  { id: 'prison_record', label: 'Prison Record', agency: 'BUCOR', category: 'background_checks' },

  // Taxation
  { id: 'tin_bir', label: 'TIN / BIR', agency: 'BIR', category: 'taxation',
    schema: [
      { key: 'fullName', label: 'Full Name', span: 2 },
      { key: 'tin', label: 'TIN' },
      { key: 'address', label: 'Address', span: 2 },
    ] },
  { id: 'bir_cor_2303', label: 'Certificate of Registration (BIR Form 2303)', agency: 'BIR', category: 'taxation' },
  { id: 'bir_2316', label: 'BIR Form 2316', agency: 'BIR', category: 'taxation' },
  { id: 'tax_clearance', label: 'Tax Clearance', agency: 'BIR', category: 'taxation' },
  { id: 'itr', label: 'Income Tax Return (ITR)', agency: 'BIR', category: 'taxation' },

  // Transportation
  { id: 'drivers_license', label: "Driver's License", agency: 'LTO', category: 'transportation',
    schema: [
      { key: 'fullName', label: 'Last Name, First Name, Middle Name', span: 2 },
      { key: 'sex', label: 'Sex' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'address', label: 'Address', span: 2 },
      { key: 'licenseNo', label: 'License No.' },
      { key: 'bloodType', label: 'Blood Type' },
    ] },
  { id: 'student_permit', label: "Student Driver's Permit", agency: 'LTO', category: 'transportation' },
  { id: 'professional_drivers_license', label: "Professional Driver's License", agency: 'LTO', category: 'transportation' },
  { id: 'conductors_license', label: "Conductor's License", agency: 'LTO', category: 'transportation' },
  { id: 'vehicle_cr', label: 'Certificate of Registration (CR)', agency: 'LTO', category: 'transportation' },
  { id: 'vehicle_or', label: 'Official Receipt (OR)', agency: 'LTO', category: 'transportation' },
  { id: 'vehicle_registration_record', label: 'Vehicle Registration Record', agency: 'LTO', category: 'transportation' },

  // Travel & Immigration
  { id: 'passport', label: 'Passport', agency: 'DFA', category: 'travel', themeOverride: { gradient: 'from-red-900 to-stone-950' },
    schema: [
      { key: 'fullName', label: 'Surname, Given Names', span: 2 },
      { key: 'nationality', label: 'Nationality', default: 'FILIPINO' },
      { key: 'sex', label: 'Sex' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'passportNo', label: 'Passport No.' },
    ] },
  { id: 'epassport', label: 'ePassport', agency: 'DFA', category: 'travel' },
  { id: 'visa', label: 'Visa', agency: 'BI', category: 'travel' },
  { id: 'acr_icard', label: 'Alien Certificate of Registration (ACR I-Card)', agency: 'BI', category: 'travel' },
  { id: 'srrv', label: "Special Resident Retiree's Visa (SRRV)", agency: 'PRA', category: 'travel' },
  { id: 'residence_permit', label: 'Residence Permit', agency: 'BI', category: 'travel' },
  { id: 'reentry_permit', label: 'Re-entry Permit', agency: 'BI', category: 'travel' },

  // Other — Professional Licenses
  { id: 'prc_id', label: 'PRC ID', agency: 'PRC', category: 'other' },
  { id: 'prc_board_certificate', label: 'PRC Board Certificate', agency: 'PRC', category: 'other' },
  { id: 'prc_board_rating', label: 'PRC Board Rating', agency: 'PRC', category: 'other' },
  { id: 'ibp_id', label: 'IBP ID', agency: 'IBP', category: 'other' },
  { id: 'csc_eligibility', label: 'Civil Service Eligibility Card', agency: 'CSC', category: 'other' },
  { id: 'marina_professional_id', label: 'MARINA Professional ID', agency: 'MARINA', category: 'other' },

  // Other — Social Welfare IDs
  { id: 'senior_citizen_id', label: 'Senior Citizen ID', agency: 'OSCA', category: 'other' },
  { id: 'pwd_id', label: 'PWD ID', agency: 'LGU', category: 'other' },
  { id: 'solo_parent_id', label: 'Solo Parent ID', agency: 'DSWD', category: 'other' },

  // Other — Employment Documents
  { id: 'employee_id', label: 'Employee ID', agency: 'EMP', category: 'other' },
  { id: 'certificate_of_employment', label: 'Certificate of Employment (COE)', agency: 'EMP', category: 'other' },
  { id: 'employment_contract', label: 'Employment Contract', agency: 'EMP', category: 'other' },
  { id: 'payslip', label: 'Payslip', agency: 'EMP', category: 'other' },
  { id: 'service_record', label: 'Service Record', agency: 'GOVT', category: 'other' },
  { id: 'appointment_paper', label: 'Appointment Paper', agency: 'GOVT', category: 'other' },

  // Other — Education Documents
  { id: 'school_id', label: 'School ID', agency: 'SCH', category: 'other' },
  { id: 'diploma', label: 'Diploma', agency: 'SCH', category: 'other' },
  { id: 'transcript_of_records', label: 'Transcript of Records (TOR)', agency: 'SCH', category: 'other' },
  { id: 'form_137', label: 'Form 137', agency: 'SCH', category: 'other' },
  { id: 'form_138', label: 'Form 138 / Report Card', agency: 'SCH', category: 'other' },
  { id: 'cor_school', label: 'Certificate of Registration (COR)', agency: 'SCH', category: 'other' },
  { id: 'certificate_of_graduation', label: 'Certificate of Graduation', agency: 'SCH', category: 'other' },
  { id: 'good_moral_certificate', label: 'Good Moral Certificate', agency: 'SCH', category: 'other' },
  { id: 'enrollment_record', label: 'Enrollment Record', agency: 'SCH', category: 'other' },
  { id: 'alumni_id', label: 'Alumni ID', agency: 'SCH', category: 'other' },

  // Other — Banking & Financial Documents
  { id: 'atm_card', label: 'ATM Card', agency: 'BANK', category: 'other' },
  { id: 'debit_card', label: 'Debit Card', agency: 'BANK', category: 'other' },
  { id: 'credit_card', label: 'Credit Card', agency: 'BANK', category: 'other' },
  { id: 'bank_passbook', label: 'Bank Passbook', agency: 'BANK', category: 'other' },
  { id: 'bank_statement', label: 'Bank Statement', agency: 'BANK', category: 'other' },
  { id: 'bank_certificate', label: 'Bank Certificate', agency: 'BANK', category: 'other' },
  { id: 'loan_documents', label: 'Loan Documents', agency: 'BANK', category: 'other' },
  { id: 'proof_of_billing', label: 'Proof of Billing', agency: 'UTIL', category: 'other' },

  // Other — Property & Real Estate
  { id: 'tct', label: 'Transfer Certificate of Title (TCT)', agency: 'RD', category: 'other' },
  { id: 'oct', label: 'Original Certificate of Title (OCT)', agency: 'RD', category: 'other' },
  { id: 'tax_declaration', label: 'Tax Declaration', agency: 'LGU', category: 'other' },
  { id: 'real_property_tax_receipt', label: 'Real Property Tax Receipt', agency: 'LGU', category: 'other' },
  { id: 'deed_of_sale', label: 'Deed of Sale', agency: 'NOTARY', category: 'other' },
  { id: 'lease_contract', label: 'Lease Contract', agency: 'NOTARY', category: 'other' },

  // Other — Postal & Communications
  { id: 'postal_id', label: 'Postal ID', agency: 'POST', category: 'other' },

  // Other — Election Documents
  { id: 'voters_id_legacy', label: "Voter's ID (legacy)", agency: 'COMELEC', category: 'other' },
  { id: 'voters_certificate', label: "Voter's Certificate", agency: 'COMELEC', category: 'other' },
  { id: 'voter_registration_record', label: 'Voter Registration Record', agency: 'COMELEC', category: 'other' },

  // Other — Military & Law Enforcement
  { id: 'afp_id', label: 'AFP ID', agency: 'AFP', category: 'other' },
  { id: 'afp_dependent_id', label: 'AFP Dependent ID', agency: 'AFP', category: 'other' },
  { id: 'afp_retiree_id', label: 'AFP Retiree ID', agency: 'AFP', category: 'other' },
  { id: 'pnp_id', label: 'PNP ID', agency: 'PNP', category: 'other' },
  { id: 'pnp_dependent_id', label: 'PNP Dependent ID', agency: 'PNP', category: 'other' },
  { id: 'pnp_retiree_id', label: 'PNP Retiree ID', agency: 'PNP', category: 'other' },
  { id: 'pcg_retiree_id', label: 'PCG Retiree ID', agency: 'PCG', category: 'other' },
  { id: 'pvao_pensioner_id', label: 'PVAO Pensioner ID', agency: 'PVAO', category: 'other' },

  // Other — Maritime Documents
  { id: 'seamans_book', label: "Seaman's Book (Seafarer's Record Book)", agency: 'MARINA', category: 'other' },
  { id: 'seafarer_id', label: "Seafarer's Identity Document (SID)", agency: 'MARINA', category: 'other' },

  // Other — Firearms
  { id: 'ltopf', label: 'License to Own and Possess Firearms (LTOPF)', agency: 'FEO', category: 'other' },
  { id: 'firearm_registration_certificate', label: 'Firearm Registration Certificate', agency: 'FEO', category: 'other' },
  { id: 'ptcfor', label: 'Permit to Carry Firearm Outside Residence (PTCFOR)', agency: 'FEO', category: 'other' },

  // Other — Indigenous / Special Groups
  { id: 'ncip_certificate', label: 'NCIP Certificate of Confirmation', agency: 'NCIP', category: 'other' },
  { id: 'cipm', label: 'Certificate of Indigenous Peoples Membership (CIPM)', agency: 'NCIP', category: 'other' },
  { id: 'tribal_id', label: 'Tribal ID', agency: 'LGU', category: 'other' },
  { id: 'ncmf_membership_certificate', label: 'NCMF Membership Certificate', agency: 'NCMF', category: 'other' },

  // Other — Common Supporting Documents of Identity
  { id: 'baptismal_certificate', label: 'Baptismal Certificate', agency: 'CHURCH', category: 'other' },
  { id: 'utility_bill', label: 'Utility Bill', agency: 'UTIL', category: 'other' },
  { id: 'proof_of_address', label: 'Proof of Address', agency: 'UTIL', category: 'other' },
  { id: 'affidavit_of_loss', label: 'Affidavit of Loss', agency: 'NOTARY', category: 'other' },
  { id: 'affidavit_of_support', label: 'Affidavit of Support', agency: 'NOTARY', category: 'other' },
  { id: 'spa', label: 'Special Power of Attorney (SPA)', agency: 'NOTARY', category: 'other' },
  { id: 'authorization_letter', label: 'Authorization Letter', agency: 'PRIVATE', category: 'other' },
]

const GENERIC_SCHEMA = [
  { key: 'fullName', label: 'Full Name', span: 2 },
  { key: 'refNo', label: 'Reference / ID No.' },
  { key: 'dateIssued', label: 'Date Issued' },
]

export const DOC_TYPE_LABELS = Object.fromEntries(DOC_TYPES.map((d) => [d.id, d.label]))

export const AGENCY_BADGE = Object.fromEntries(
  DOC_TYPES.map((d) => [d.id, { label: d.agency, color: AGENCIES[d.agency].badge }])
)

export const CARD_THEME = Object.fromEntries(
  DOC_TYPES.map((d) => {
    const agency = AGENCIES[d.agency]
    return [d.id, {
      gradient: d.themeOverride?.gradient || agency.gradient,
      agency: agency.gov ? 'REPUBLIC OF THE PHILIPPINES' : agency.name.toUpperCase(),
      office: agency.gov ? agency.name.toUpperCase() : '',
      docName: d.label.toUpperCase(),
    }]
  })
)

export const CARD_FIELD_SCHEMAS = Object.fromEntries(
  DOC_TYPES.map((d) => [d.id, d.schema || GENERIC_SCHEMA])
)

// Categories shown as the first step of "what are you adding" — ordered
// roughly by how many Filipinos of any age are likely to hold at least one
// document from that category (civil registry and barangay paperwork cover
// nearly everyone; a passport or driver's license doesn't).
const CATEGORY_ORDER = [
  { id: 'civil_registry', label: 'Civil Registry' },
  { id: 'local_gov', label: 'Local Government' },
  { id: 'identification', label: 'Identification' },
  { id: 'social_security', label: 'Social Security & Benefits' },
  { id: 'background_checks', label: 'Background Checks & Clearances' },
  { id: 'taxation', label: 'Taxation' },
  { id: 'transportation', label: 'Transportation' },
  { id: 'travel', label: 'Travel & Immigration' },
]

function topAgenciesFor(docTypeIds) {
  const counts = {}
  for (const id of docTypeIds) {
    const agency = AGENCY_BADGE[id].label
    counts[agency] = (counts[agency] || 0) + 1
  }
  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  return { top: sorted.slice(0, 2), otherCount: Math.max(0, sorted.length - 2) }
}

export const DOC_CATEGORIES = [
  ...CATEGORY_ORDER.map((cat) => {
    const docTypeIds = DOC_TYPES.filter((d) => d.category === cat.id).map((d) => d.id)
    const { top, otherCount } = topAgenciesFor(docTypeIds)
    return { ...cat, docTypeIds, topAgencies: top, otherAgencyCount: otherCount }
  }),
  (() => {
    const docTypeIds = DOC_TYPES.filter((d) => d.category === 'other').map((d) => d.id)
    const { top, otherCount } = topAgenciesFor(docTypeIds)
    return { id: 'other', label: 'Other', docTypeIds, topAgencies: top, otherAgencyCount: otherCount }
  })(),
]

export const URGENCY_META = {
  expired: { label: 'Expired', dot: 'bg-red-400', bar: 'bg-red-400', badgeDark: 'bg-red-400/10 text-red-300', badgeLight: 'bg-red-100 text-red-700', fill: 100 },
  critical: { label: 'Due Soon', dot: 'bg-red-400', bar: 'bg-red-400', badgeDark: 'bg-red-500/15 text-red-300', badgeLight: 'bg-red-100 text-red-700', fill: 90, pulse: true },
  urgent: { label: 'Active', dot: 'bg-amber-400', bar: 'bg-amber-400', badgeDark: 'bg-amber-400/10 text-amber-300', badgeLight: 'bg-amber-100 text-amber-800', fill: 80 },
  upcoming: { label: 'Active', dot: 'bg-blue-400', bar: 'bg-blue-400', badgeDark: 'bg-blue-400/10 text-blue-300', badgeLight: 'bg-blue-100 text-blue-700', fill: 50 },
  safe: { label: 'Active', dot: 'bg-emerald-400', bar: 'bg-emerald-400', badgeDark: 'bg-emerald-400/10 text-emerald-300', badgeLight: 'bg-emerald-100 text-emerald-700', fill: 20 },
  // A document being applied for isn't "expiring" — it doesn't exist yet —
  // so it gets its own neutral status instead of being forced into the
  // expiry-driven scale.
  ongoing: { label: 'Ongoing', dot: 'bg-blue-400', bar: 'bg-blue-400', badgeDark: 'bg-blue-400/10 text-blue-300', badgeLight: 'bg-blue-100 text-blue-700', fill: 30 },
}

// Only document types with a well-established, fixed official validity
// period get a smart-default expiry date — inventing a number for types
// without one (e.g. National ID, SSS) would just be a guess dressed up as
// fact. Shared between the "add a document" smart defaults and the
// "renew this document" flow, since both need the same answer to "how far
// out should the next expiry date default to."
export const TYPICAL_VALIDITY_YEARS = {
  drivers_license: 10,
  passport: 10,
  nbi_clearance: 1,
}
