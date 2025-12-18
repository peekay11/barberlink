// Verification system for BarberLink

export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected'

export interface VerificationRequirements {
  // Business Documentation
  businessRegistration: boolean
  taxClearance: boolean
  
  // Contact Verification
  phoneVerified: boolean
  emailVerified: boolean
  addressVerified: boolean
  
  // Professional Standards
  managerQualifications: boolean
  businessInsurance: boolean
  healthCertificate: boolean
  
  // Platform Requirements
  profileComplete: boolean
  imagesUploaded: boolean
  servicesListed: boolean
}

export interface VerificationSubmission {
  shopId: string
  documents: {
    businessRegistration?: string // File URL
    taxClearance?: string
    insurance?: string
    healthCertificate?: string
    managerCertification?: string
  }
  contactVerification: {
    phoneCode?: string
    emailCode?: string
    addressProof?: string
  }
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  rejectionReason?: string
}

// Verification criteria weights
export const VERIFICATION_CRITERIA = {
  // Essential (must have)
  BUSINESS_REGISTRATION: { weight: 25, required: true },
  CONTACT_VERIFICATION: { weight: 20, required: true },
  PROFILE_COMPLETENESS: { weight: 15, required: true },
  
  // Important (recommended)
  TAX_CLEARANCE: { weight: 15, required: false },
  INSURANCE: { weight: 10, required: false },
  HEALTH_CERTIFICATE: { weight: 10, required: false },
  MANAGER_QUALIFICATIONS: { weight: 5, required: false }
}

export function calculateVerificationScore(requirements: VerificationRequirements): number {
  let score = 0
  
  // Essential requirements
  if (requirements.businessRegistration) score += VERIFICATION_CRITERIA.BUSINESS_REGISTRATION.weight
  if (requirements.phoneVerified && requirements.emailVerified) score += VERIFICATION_CRITERIA.CONTACT_VERIFICATION.weight
  if (requirements.profileComplete && requirements.imagesUploaded && requirements.servicesListed) {
    score += VERIFICATION_CRITERIA.PROFILE_COMPLETENESS.weight
  }
  
  // Additional requirements
  if (requirements.taxClearance) score += VERIFICATION_CRITERIA.TAX_CLEARANCE.weight
  if (requirements.businessInsurance) score += VERIFICATION_CRITERIA.INSURANCE.weight
  if (requirements.healthCertificate) score += VERIFICATION_CRITERIA.HEALTH_CERTIFICATE.weight
  if (requirements.managerQualifications) score += VERIFICATION_CRITERIA.MANAGER_QUALIFICATIONS.weight
  
  return Math.min(score, 100)
}

export function canApplyForVerification(requirements: VerificationRequirements): boolean {
  // Must meet all essential requirements
  return requirements.businessRegistration && 
         requirements.phoneVerified && 
         requirements.emailVerified && 
         requirements.profileComplete && 
         requirements.imagesUploaded && 
         requirements.servicesListed
}

export function getVerificationBadgeLevel(score: number): 'bronze' | 'silver' | 'gold' | null {
  if (score >= 90) return 'gold'
  if (score >= 75) return 'silver'
  if (score >= 60) return 'bronze'
  return null
}

// Verification process steps
export const VERIFICATION_STEPS = [
  {
    id: 'profile',
    title: 'Complete Profile',
    description: 'Fill in all required shop information',
    required: true
  },
  {
    id: 'contact',
    title: 'Verify Contact Details',
    description: 'Verify phone number and email address',
    required: true
  },
  {
    id: 'business',
    title: 'Business Registration',
    description: 'Upload valid business registration documents',
    required: true
  },
  {
    id: 'tax',
    title: 'Tax Clearance',
    description: 'Provide tax clearance certificate',
    required: false
  },
  {
    id: 'insurance',
    title: 'Business Insurance',
    description: 'Upload proof of business insurance',
    required: false
  },
  {
    id: 'health',
    title: 'Health Certificate',
    description: 'Health and safety compliance certificate',
    required: false
  }
]