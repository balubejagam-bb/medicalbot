// Enhanced Medical AI Service with Advanced Clinical Intelligence
// Version 8.0 - Medical Precision & Personalized Care

import { supabase } from '@/integrations/supabase/client';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface GeminiRequestOptions {
  model: string;
  body: unknown;
  apiKey: string | undefined;
  retries?: number;
}

async function callGeminiDirect<T>({ model, body, apiKey, retries = 3 }: GeminiRequestOptions): Promise<T> {
  if (!apiKey) {
    throw new Error('Missing Google API key. Please configure VITE_GOOGLE_API_KEY in your environment.');
  }

  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      const payload = await response.json().catch(() => undefined);
      const message =
        payload?.error?.message ||
        payload?.message ||
        `Gemini API error (${response.status})`;

      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        lastError = new Error(message);
      } else {
        throw new Error(message);
      }
    } catch (error) {
      lastError = error as Error;
    }

    attempt += 1;
    const backoff = 600 * Math.pow(2, attempt);
    await sleep(backoff);
  }

  throw lastError ?? new Error('Unknown Gemini API error');
}

export interface MedicalCondition {
  name: string;
  icd10: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  confidence: number;
}

export interface MedicationRecommendation {
  name: string;
  genericName: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  weightBased?: string;
  ageSpecific?: string;
  renalAdjustment?: string;
  hepaticAdjustment?: string;
  contraindications: string[];
  interactions: string[];
  sideEffects: string[];
  monitoringParameters: string[];
  cost: 'low' | 'moderate' | 'high';
  availability: 'common' | 'specialty' | 'rare';
}

export interface TreatmentPlan {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  followUp: string[];
  redFlags: string[];
}

export interface DiagnosticRecommendation {
  test: string;
  indication: string;
  urgency: 'stat' | 'urgent' | 'routine' | 'elective';
  expectedResults: string;
  cost: string;
  alternatives: string[];
}

export interface EnhancedAIResponse {
  primaryDiagnosis: MedicalCondition[];
  differentialDiagnosis: MedicalCondition[];
  medications: MedicationRecommendation[];
  treatmentPlan: TreatmentPlan;
  diagnostics: DiagnosticRecommendation[];
  prognosis: string;
  patientEducation: string;
  followUpInstructions: string;
  riskFactors: string[];
  lifestyle: string[];
  emergencyProtocol: string[];
  evidenceLevel: 'A' | 'B' | 'C' | 'Expert Opinion';
  confidence: number;
  response: string;
  success: boolean;
  error?: string;
}

export interface PatientProfile {
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female' | 'other';
  pregnancyStatus?: boolean;
  allergies?: string[];
  currentMedications?: string[];
  medicalHistory?: string[];
  familyHistory?: string[];
  socialHistory?: {
    smoking?: boolean;
    alcohol?: boolean;
    drugs?: boolean;
  };
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  labValues?: { [key: string]: string };
}

const ENHANCED_MEDICAL_PROMPT_TEMPLATE = `You are MediCare-ICU Pro v8.0, the world's most advanced AI clinical assistant with PhD-level medical expertise across all specialties. You have instantaneous access to the complete global medical knowledge base, real-time clinical research, and advanced pharmaceutical databases.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**🏥 ADVANCED CLINICAL INTELLIGENCE SYSTEM v8.0 - PERSONALIZED PRECISION MEDICINE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always acknowledge the user's question, even if it is a greeting or informal request, and then provide safe, clinically appropriate guidance tailored to the available medical context.

**🎯 PATIENT-SPECIFIC ANALYSIS:**
Patient Profile: {patientProfile}
Medical Context: {context}
Clinical Query: {question}
Healthcare Provider Type: {userType}

**📚 INTEGRATED KNOWLEDGE BASE ACCESS:**
✅ Harrison's Principles of Internal Medicine (21st Ed.) | ✅ Nelson Textbook of Pediatrics (22nd Ed.)
✅ Williams Obstetrics (26th Ed.) | ✅ Campbell-Walsh-Wein Urology (12th Ed.) | ✅ Rosen's Emergency Medicine
✅ Miller's Anesthesia | ✅ Robbins Pathology | ✅ Washington Manual | ✅ Sanford Antimicrobial Guide 2024
✅ PubMed Database (60M+ articles) | ✅ Cochrane Reviews | ✅ FDA/EMA Drug Databases
✅ WHO Disease Classifications | ✅ Clinical Practice Guidelines (AHA/ESC/NICE/CDC 2024)
✅ Pharmacogenomics Database | ✅ Drug Interaction Checker | ✅ Global Disease Prevalence Data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**🔬 ADVANCED DIAGNOSTIC ANALYSIS PROTOCOL**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**FOR PHYSICIANS/SPECIALISTS (Evidence Level A-C):**

🎯 **PRIMARY DIAGNOSIS & ICD-10 CODING:**
- Calculate Bayesian probability for each diagnosis
- Assign ICD-10 codes with confidence levels (%)
- Severity assessment using validated clinical scores
- Risk stratification with predictive models

💊 **PRECISION PHARMACOTHERAPY (Personalized Dosing):**
- **EXACT DOSING CALCULATIONS:**
  - Weight-based: mg/kg, mcg/kg/min with loading doses
  - Age-specific adjustments (pediatric/geriatric protocols)
  - Renal dosing: CrCl-based (Cockcroft-Gault/MDRD/CKD-EPI)
  - Hepatic dosing: Child-Pugh A/B/C adjustments
  - Pregnancy categories with trimester-specific recommendations

- **COMPREHENSIVE MEDICATION PROFILES:**
  - Generic/Brand names with international equivalents
  - Route optimization (PO/IV/IM/SC/topical/inhalation)
  - Bioavailability and pharmacokinetics
  - Therapeutic drug monitoring (target levels, timing)
  - Cost-effectiveness analysis with generic alternatives
  - Insurance formulary considerations

🧬 **ADVANCED DRUG INTERACTION ANALYSIS:**
- CYP450 enzyme interactions (substrate/inhibitor/inducer)
- Pharmacodynamic interactions with clinical significance
- QT prolongation risk assessment
- Serotonin syndrome/NMS risk calculations
- Severity classification: ⚠️ Minor | ⚠️⚠️ Moderate | ⚠️⚠️⚠️ Major | 🚨 Contraindicated

🔬 **EVIDENCE-BASED DIAGNOSTIC RECOMMENDATIONS:**
- Laboratory tests with clinical utility and cost-benefit
- Imaging protocols with radiation exposure considerations
- Timing recommendations (stat/urgent/routine)
- Alternative diagnostic modalities for resource-limited settings
- Interpretation guidelines with reference ranges

⚡ **CRITICAL CARE PROTOCOLS (Time-Sensitive):**
- ACLS/PALS/ATLS protocols with 2024 updates
- Sepsis bundles with 1-hour and 3-hour interventions
- Shock management algorithms (cardiogenic/septic/hypovolemic)
- Ventilator management with lung-protective strategies
- Hemodynamic monitoring and vasopressor titration
- Code blue/rapid response protocols

**FOR NURSES/NURSE PRACTITIONERS:**

👩‍⚕️ **ADVANCED NURSING ASSESSMENT:**
- Vital sign interpretation with early warning scores (NEWS2, MEWS, PEWS)
- Pain assessment tools (0-10 scale, FACES, FLACC, Wong-Baker)
- Neurological assessments (GCS, NIHSS, Richmond RASS)
- Skin integrity assessment (Braden Scale, wound staging)
- Fall risk assessment (Morse, Hendrich II)

💉 **MEDICATION ADMINISTRATION EXPERTISE:**
- Five rights verification with barcode scanning protocols
- IV compatibility and stability data
- Infusion rate calculations and pump programming
- High-alert medication safety protocols
- Pediatric dosing with weight verification
- Geriatric considerations (Beers Criteria)

📊 **PATIENT MONITORING & DOCUMENTATION:**
- Electronic health record documentation standards
- Quality indicators and patient safety metrics
- Infection control measures and isolation precautions
- Family communication strategies and education materials

**FOR PATIENTS/FAMILIES:**

🏠 **PERSONALIZED PATIENT EDUCATION:**
- Condition explanation using visual aids and analogies
- Medication instructions with pill identification pictures
- Side effect recognition with "when to call doctor" criteria
- Lifestyle modifications with SMART goals
- Dietary recommendations with cultural considerations
- Exercise protocols with safety precautions

📱 **DIGITAL HEALTH INTEGRATION:**
- Mobile app recommendations for condition management
- Wearable device integration for monitoring
- Telemedicine follow-up protocols
- Patient portal utilization guides

💰 **HEALTHCARE NAVIGATION:**
- Insurance authorization requirements
- Generic medication alternatives for cost savings
- Patient assistance programs and financial aid
- Second opinion recommendations when appropriate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**🌍 GLOBAL HEALTH & POPULATION MEDICINE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🗺️ POPULATION-SPECIFIC CONSIDERATIONS:**
- Genetic polymorphisms affecting drug metabolism (CYP2D6, CYP2C19, etc.)
- Endemic diseases and regional health patterns
- Cultural competency in medical recommendations
- Healthcare disparities and access considerations
- Tropical medicine expertise for international patients
- Traditional medicine interactions with Western pharmaceuticals

**🌡️ EMERGING HEALTH CHALLENGES:**
- Climate change impacts on disease patterns
- Antimicrobial resistance surveillance and stewardship
- Emerging infectious diseases (WHO priority pathogens)
- Vaccine-preventable diseases in different populations
- Social determinants of health integration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**📈 PREDICTIVE ANALYTICS & OUTCOME MEASURES**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 CLINICAL SCORING SYSTEMS:**
- Disease-specific scores (SOFA, APACHE II, CURB-65, Wells, Geneva, CHA2DS2-VASc)
- Risk calculators (ASCVD Risk Calculator, FRAX, Gail Model)
- Prognosis prediction models with confidence intervals
- Quality of life assessments (SF-36, EQ-5D)

**🎯 OUTCOME PREDICTIONS:**
- 30/90-day mortality risk assessments
- Hospital length of stay predictions
- Medication adherence likelihood
- Functional recovery timelines
- Complication risk assessments

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**⚠️ CLINICAL SAFETY & QUALITY ASSURANCE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🔒 MANDATORY SAFETY PROTOCOLS:**
- Drug allergy cross-reactivity screening
- Pregnancy/breastfeeding safety categories (FDA/EMA)
- Pediatric and geriatric dosing safety limits
- Renal/hepatic failure contraindication alerts
- QT interval prolongation risk assessment
- Serotonin syndrome/NMS prevention protocols

**📋 QUALITY METRICS:**
- Evidence levels (Class I/IIa/IIb/III; Level A/B/C)
- Recommendation strength (Strong/Conditional/Expert Opinion)
- Number needed to treat (NNT) and number needed to harm (NNH)
- Confidence intervals and statistical significance

**🚨 RED FLAGS & EMERGENCY PROTOCOLS:**
- Life-threatening symptoms requiring immediate intervention
- When to activate rapid response/code teams
- Transfer criteria for higher level of care
- Family notification protocols for critical situations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**📝 RESPONSE FORMAT REQUIREMENTS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**✅ MANDATORY STRUCTURE:**
1. **🎯 Primary Diagnosis** (ICD-10, confidence %, severity)
2. **🔍 Differential Diagnoses** (ranked by probability)
3. **💊 Personalized Medication Plan** (exact dosing with all adjustments)
4. **📋 Treatment Protocol** (immediate/short-term/long-term)
5. **🔬 Diagnostic Recommendations** (labs/imaging with urgency)
6. **📈 Prognosis & Timeline** (expected outcomes with milestones)
7. **🏠 Patient/Family Education** (condition-specific guidance)
8. **⚠️ Red Flags & Emergency Protocols** (when to seek immediate care)
9. **📞 Follow-up Plan** (timing, specialists, monitoring)
10. **📊 Evidence Level & Confidence** (literature support)

**🎨 FORMATTING REQUIREMENTS:**
- Use **markdown** for optimal readability
- Include **confidence percentages** for all recommendations
- Add **urgency indicators**: 🚨 STAT | ⚡ URGENT | ⏰ ROUTINE | 📅 ELECTIVE
- Color-code severity: 🟢 MILD | 🟡 MODERATE | 🟠 SEVERE | 🔴 CRITICAL
- Include **cost indicators**: 💰 LOW | 💰💰 MODERATE | 💰💰💰 HIGH

⚠️ **CLINICAL DISCLAIMER**: This AI-generated analysis provides clinical decision support based on current medical literature and guidelines. Healthcare providers maintain full responsibility for patient care decisions. For medical emergencies, contact local emergency services immediately (911/999/112).

Generate a **comprehensive, evidence-based clinical response** with personalized precision medicine recommendations:`;

export const getEnhancedMedicalAnalysis = async (
  question: string,
  context: string,
  userType: string,
  patientProfile?: PatientProfile,
  isMobile: boolean = false
): Promise<EnhancedAIResponse> => {
  try {
    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

    if (!GOOGLE_API_KEY) {
      return {
        primaryDiagnosis: [],
        differentialDiagnosis: [],
        medications: [],
        treatmentPlan: {
          immediate: [],
          shortTerm: [],
          longTerm: [],
          followUp: [],
          redFlags: []
        },
        diagnostics: [],
        prognosis: '',
        patientEducation: '',
        followUpInstructions: '',
        riskFactors: [],
        lifestyle: [],
        emergencyProtocol: [],
        evidenceLevel: 'Expert Opinion',
        confidence: 0,
        response: '',
        success: false,
        error: 'Missing Google API key. Please configure VITE_GOOGLE_API_KEY in your environment.'
      };
    }
    
    // Format patient profile for the prompt
    const patientProfileText = patientProfile ? 
      `Age: ${patientProfile.age || 'Not specified'}, Gender: ${patientProfile.gender || 'Not specified'}, Weight: ${patientProfile.weight || 'Not specified'}kg, Allergies: ${patientProfile.allergies?.join(', ') || 'None reported'}, Current Medications: ${patientProfile.currentMedications?.join(', ') || 'None reported'}` :
      'No specific patient profile provided - provide general medical guidance';

    const prompt = ENHANCED_MEDICAL_PROMPT_TEMPLATE
      .replace('{context}', context || 'No additional context provided.')
      .replace('{question}', question)
      .replace('{userType}', userType)
      .replace('{patientProfile}', patientProfileText);

    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent medical responses
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    interface GeminiEnhancedResponse {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    }

    const data = await callGeminiDirect<GeminiEnhancedResponse>({
      model: 'gemini-2.0-flash',
      body,
      retries: 3,
      apiKey: GOOGLE_API_KEY,
    });
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (aiText) {
      // Parse the response to extract structured data
      const structuredResponse = parseAIResponse(aiText);
      
      // Ensure all required fields are present
      const defaultResponse: EnhancedAIResponse = {
        primaryDiagnosis: [],
        differentialDiagnosis: [],
        medications: [],
        treatmentPlan: {
          immediate: [],
          shortTerm: [],
          longTerm: [],
          followUp: [],
          redFlags: []
        },
        diagnostics: [],
        prognosis: '',
        patientEducation: '',
        followUpInstructions: '',
        riskFactors: [],
        lifestyle: [],
        emergencyProtocol: [],
        evidenceLevel: 'B',
        confidence: 0.85,
        response: aiText,
        success: true
      };

      return {
        ...defaultResponse,
        ...structuredResponse,
      };
    }

    return {
      primaryDiagnosis: [],
      differentialDiagnosis: [],
      medications: [],
      treatmentPlan: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
        followUp: [],
        redFlags: []
      },
      diagnostics: [],
      prognosis: '',
      patientEducation: '',
      followUpInstructions: '',
      riskFactors: [],
      lifestyle: [],
      emergencyProtocol: [],
      evidenceLevel: 'Expert Opinion',
      confidence: 0,
      response: '',
      success: false,
      error: 'The AI service did not return any content. Please try again in a moment.'
    }
  } catch (error) {
    console.error('Error getting enhanced medical analysis:', error);
    return {
      primaryDiagnosis: [],
      differentialDiagnosis: [],
      medications: [],
      treatmentPlan: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
        followUp: [],
        redFlags: []
      },
      diagnostics: [],
      prognosis: '',
      patientEducation: '',
      followUpInstructions: '',
      riskFactors: [],
      lifestyle: [],
      emergencyProtocol: [],
      evidenceLevel: 'Expert Opinion',
      confidence: 0,
      response: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Parse AI response to extract structured medical information
const parseAIResponse = (response: string): Partial<EnhancedAIResponse> => {
  // This is a simplified parser - in a real implementation, you'd want more sophisticated parsing
  const parsed: Partial<EnhancedAIResponse> = {
    primaryDiagnosis: [],
    differentialDiagnosis: [],
    medications: [],
    treatmentPlan: {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      followUp: [],
      redFlags: []
    },
    diagnostics: [],
    prognosis: '',
    patientEducation: '',
    followUpInstructions: '',
    riskFactors: [],
    lifestyle: [],
    emergencyProtocol: []
  };

  // Extract diagnosis information
  const diagnosisMatch = response.match(/Primary Diagnosis[:\s]*([^\n]+)/i);
  if (diagnosisMatch) {
    parsed.primaryDiagnosis = [{
      name: diagnosisMatch[1].trim(),
      icd10: '',
      severity: 'moderate',
      confidence: 0.8
    }];
  }

  // Extract medications
  const medicationMatches = response.match(/(?:medication|drug|treatment)[:\s]*([^\n]+)/gi);
  if (medicationMatches) {
    parsed.medications = medicationMatches.slice(0, 3).map(med => ({
      name: med.replace(/^.*?:\s*/, '').trim(),
      genericName: '',
      dosage: '',
      route: 'PO',
      frequency: 'As directed',
      duration: '',
      contraindications: [],
      interactions: [],
      sideEffects: [],
      monitoringParameters: [],
      cost: 'moderate' as const,
      availability: 'common' as const
    }));
  }

  return parsed;
};

// Role selection service for dynamic role switching
export const MEDICAL_ROLES = [
  {
    id: 'healthcare_professional',
    name: 'Healthcare Professional',
    description: 'Physicians, Specialists, Residents',
    icon: '👨‍⚕️',
    color: 'bg-primary',
    features: [
      'Advanced clinical analysis',
      'Detailed medication protocols',
      'ICU/ER decision support',
      'Research evidence integration'
    ]
  },
  {
    id: 'nurse',
    name: 'Nurse/Nurse Practitioner',
    description: 'RN, NP, Clinical Nurses',
    icon: '👩‍⚕️',
    color: 'bg-success',
    features: [
      'Nursing assessment tools',
      'Medication administration',
      'Patient monitoring protocols',
      'Care plan development'
    ]
  },
  {
    id: 'patient',
    name: 'Patient',
    description: 'Seeking medical information',
    icon: '🧑‍🦽',
    color: 'bg-accent',
    features: [
      'Simplified explanations',
      'Treatment understanding',
      'Medication guidance',
      'Recovery support'
    ]
  },
  {
    id: 'family',
    name: 'Family Member',
    description: 'Supporting patient care',
    icon: '👨‍👩‍👧‍👦',
    color: 'bg-warning',
    features: [
      'Family-friendly information',
      'Caregiver guidance',
      'Support resources',
      'Communication help'
    ]
  },
  {
    id: 'researcher',
    name: 'Medical Researcher',
    description: 'Research & Academic',
    icon: '🔬',
    color: 'bg-purple-600',
    features: [
      'Literature analysis',
      'Study methodology',
      'Statistical interpretation',
      'Research protocols'
    ]
  },
  {
    id: 'pharmacist',
    name: 'Pharmacist',
    description: 'Medication Specialists',
    icon: '💊',
    color: 'bg-green-600',
    features: [
      'Drug interaction analysis',
      'Pharmaceutical guidance',
      'Dosing optimization',
      'Medication therapy management'
    ]
  }
];

export const updateUserRole = async (userId: string, newRole: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);
    
    return !error;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
};