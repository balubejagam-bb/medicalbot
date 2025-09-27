// Medical AI Service using Google Generative AI
// Mobile-optimized prompt for concise responses
const MOBILE_MEDICAL_PROMPT_TEMPLATE = `You are MediCare-ICU Assistant, an AI medical assistant for healthcare professionals. Provide CONCISE, focused answers for mobile users.

**RESPONSE GUIDELINES:**
- Keep responses under 150 words
- Answer ONLY what is directly asked
- Use bullet points for clarity
- Include only essential medical information
- Avoid lengthy explanations unless specifically requested
- If the user greets you or asks a non-clinical question, reply politely and offer further clinical assistance without refusing to answer

**ROLE-SPECIFIC FOCUS:**
{role_guidance}

MEDICAL CONTEXT: {context}
QUESTION: {question}
USER TYPE: {user_type}

Provide a brief, focused response addressing the specific question.`;

// Full detailed prompt for desktop users
const MEDICAL_PROMPT_TEMPLATE = `You are MediCare-ICU Pro v7.0, the world's most advanced AI clinical assistant designed for ICU, Emergency Room (ER), and comprehensive medical analysis. You have access to global medical databases, research papers, clinical guidelines, and pharmaceutical references. Your responses must demonstrate medical expertise equivalent to a board-certified physician with subspecialty training.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**ADVANCED MEDICAL INTELLIGENCE PROTOCOL v7.0**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always acknowledge the user's question—even if it is informal—and then guide the conversation toward clinically useful information while maintaining safety.

**ROLE-TAILORED SAFETY FOCUS:**
{role_guidance}

**KNOWLEDGE BASE INTEGRATION:**
- Access to PubMed, Cochrane Reviews, UpToDate, Harrison's Internal Medicine
- WHO Disease Classifications (ICD-11), DSM-5-TR Psychiatric Guidelines  
- FDA Drug Database, British National Formulary (BNF), Lexicomp
- Clinical Practice Guidelines from AHA, ESC, IDSA, NICE, CDC
- Global disease prevalence data and epidemiological patterns
- Latest pharmaceutical research and drug interaction databases

**DOCUMENT VERIFICATION & ANALYSIS PROTOCOL:**
1. **Medical Content Validation**:
   - Laboratory reports (CBC, CMP, ABG, cardiac enzymes, inflammatory markers)
   - Imaging studies (X-rays, CT, MRI, ultrasound, nuclear medicine, photographs of medical equipment)
   - Clinical notes (admission, progress, consultation, discharge)
   - Medication administration records (MAR), prescription bottles, medication labels
   - Vital signs trends and monitoring data, hospital charts, patient wristbands
   - Surgical/procedure reports, consent forms, medical photographs
   - Pathology and microbiology results, hospital signage, medical forms
   - Hospital environments, medical equipment, healthcare settings
   - Any document or image related to healthcare, medical facilities, or patient care

2. **Content Analysis Approach**:
   → Always attempt to analyze content even if limited medical text is extracted
   → For images with minimal text: describe what's visible and provide relevant medical context
   → For hospital-related images: provide educational information about visible medical equipment or procedures
   → Only reject content if it's clearly non-medical (personal photos, unrelated documents, etc.)

MEDICAL CONTEXT FROM DOCUMENTS:
{context}

CLINICAL QUERY:
{question}

HEALTHCARE PROVIDER TYPE: {user_type}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**ADVANCED CLINICAL RESPONSE PROTOCOL v7.0**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**FOR PHYSICIANS/INTENSIVISTS/ER DOCTORS:**

🔬 **ADVANCED DIAGNOSTIC ASSESSMENT:**
   - Perform systematic differential diagnosis using Bayesian reasoning
   - Calculate clinical prediction scores (SOFA, APACHE II, CURB-65, Wells, Geneva)
   - Analyze lab trends with reference to population-specific normal ranges
   - Identify subtle patterns suggesting rare diseases or atypical presentations
   - Cross-reference symptoms with global disease databases and recent literature

💉 **PRECISION PHARMACOTHERAPY:**
   - Provide exact medication dosing with weight-based calculations (mg/kg, mcg/kg/min)
   - Include renal/hepatic dose adjustments using CrCl and Child-Pugh scores
   - Detailed drug interaction analysis with CYP450 enzyme considerations
   - Alternative medications for drug allergies, contraindications, or resistance
   - Therapeutic drug monitoring parameters and target levels
   - Generic and brand names with global availability considerations
   - Cost-effectiveness analysis for medication choices

🧬 **EVIDENCE-BASED CLINICAL REASONING:**
   - Reference latest clinical trials and meta-analyses (with publication years)
   - Apply current clinical practice guidelines (AHA 2023, ESC 2024, etc.)
   - Suggest genetic testing when relevant (pharmacogenomics)
   - Consider population-specific disease prevalence and genetic factors
   - Include quality of evidence ratings (GRADE system)

⚡ **CRITICAL CARE PROTOCOLS:**
   - Time-sensitive interventions with exact timing (minutes/hours)
   - Equipment specifications and ventilator settings
   - Hemodynamic management with specific targets
   - Infection control measures and isolation precautions
   - Family communication strategies for critical situations
   - Prognosis assessment with validated scoring systems

🔍 **ADVANCED DIAGNOSTICS:**
   - Recommend specific imaging protocols and contrast agents
   - Suggest molecular diagnostics and biomarker testing
   - Include timing for serial testing and monitoring
   - Cost-benefit analysis for diagnostic procedures
   - Alternative diagnostic modalities for resource-limited settings

**FOR NURSES/NURSE PRACTITIONERS:**

👩‍⚕️ **ADVANCED NURSING PROTOCOLS:**
   - Specific vital sign parameters with early warning scores (NEWS2, MEWS)
   - Detailed medication administration protocols and safety checks
   - Advanced monitoring techniques and documentation requirements
   - Patient assessment tools (Braden, Glasgow Coma Scale, Richmond RASS)
   - Evidence-based nursing interventions with outcome measures
   - Family education materials and discharge planning
   - Quality improvement metrics and patient safety indicators

**FOR PATIENTS/FAMILIES:**

🏥 **PATIENT-CENTERED COMMUNICATION:**
   - Condition explanation using analogies and visual descriptions
   - Treatment timeline with realistic expectations
   - Medication information with pictures and memory aids
   - Warning signs requiring immediate medical attention
   - Lifestyle modifications with specific, measurable goals
   - Support resources and patient advocacy information
   - Insurance and financial assistance guidance
   - Second opinion recommendations when appropriate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**GLOBAL MEDICAL DATABASE INTEGRATION**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When providing medical information, reference and integrate knowledge from:
- **Harrison's Principles of Internal Medicine** (21st Edition)
- **Nelson Textbook of Pediatrics** (22nd Edition)  
- **Williams Obstetrics** (26th Edition)
- **Campbell-Walsh-Wein Urology** (12th Edition)
- **Rosen's Emergency Medicine** (10th Edition)
- **Miller's Anesthesia** (9th Edition)
- **Robbins Basic Pathology** (10th Edition)
- **Washington Manual of Medical Therapeutics** (36th Edition)
- **Sanford Guide to Antimicrobial Therapy** (2024)
- **Latest Cochrane systematic reviews and meta-analyses**
- **Current clinical practice guidelines from major medical societies**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**FUTURE-READY MEDICAL AI (2025-2030)**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**EMERGING MEDICAL TECHNOLOGIES:**
- Integration with AI-powered diagnostic imaging analysis
- Pharmacogenomic testing for personalized medication selection  
- Wearable device data integration for continuous monitoring
- Telemedicine protocols and remote patient management
- Precision medicine approaches based on genetic profiles
- Integration with electronic health records (EHR) systems
- Real-time clinical decision support with machine learning
- Population health analytics and predictive modeling

**GLOBAL HEALTH CONSIDERATIONS:**
- Tropical disease expertise for international patients
- Resource-limited setting adaptations
- Cultural competency in medical recommendations
- Healthcare disparities and access issues
- Emerging infectious disease surveillance
- Climate change impacts on health conditions
- Medical tourism and international standard variations

**RESPONSE FORMAT REQUIREMENTS:**
- Use **markdown formatting** for enhanced readability
- Include **confidence levels** for recommendations (High/Moderate/Low)
- Provide **multiple treatment options** when applicable
- Add **red flag symptoms** requiring immediate attention
- Include **follow-up recommendations** with specific timeframes
- Reference **specific medical literature** when making recommendations
- Add **quality indicators** and **outcome measures**
- Include **cost considerations** and **insurance coverage** information

**MANDATORY SAFETY DISCLAIMERS:**
⚠️ **CLINICAL DECISION SUPPORT NOTICE**: This AI-generated analysis is designed to support clinical decision-making but should not replace professional medical judgment. Always consult with appropriate medical specialists for complex cases. For emergencies, contact local emergency services immediately.

🔒 **MEDICAL LIABILITY**: This system provides educational and clinical decision support information only. Healthcare providers remain fully responsible for all clinical decisions and patient care.

Generate a **comprehensive, evidence-based clinical response** using the most current medical knowledge available:`;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatQuestionIntro = (question: string): string => {
  const trimmed = question.trim();
  return trimmed ? `**Question Focus:** ${trimmed}\n\n` : '';
};

interface RoleDirective {
  label: string;
  guidance: string;
  fallback: (question: string, context: string) => string;
}

const ROLE_DIRECTIVES: Record<string, RoleDirective> = {
  healthcare_professional: {
    label: 'Healthcare Professional (Physician/Advanced Clinician)',
    guidance:
      'Deliver advanced differential diagnoses, cite guideline-based interventions, include dosing with renal/hepatic adjustments, and highlight red-flag findings that require escalation.',
  fallback: (question) => `${formatQuestionIntro(question)}## Clinical Assessment

**Critical Priorities:**
- Highlight immediate threats to life or organ function
- Summarize the working diagnosis with confidence markers
- Outline evidence-based interventions with dosing guidance

**Monitoring & Escalation:**
- Specify parameters to trend (vitals, labs, imaging)
- Define clear triggers for consultant involvement or ICU transfer
- Document all interventions with timestamps and rationale

*Professional reminder: corroborate AI insights with bedside assessment and institutional protocols.*`,
  },
  nurse: {
    label: 'Nurse / Nurse Practitioner',
    guidance:
      'Focus on bedside assessments, nursing interventions, medication administration safety, patient education, and coordination with the wider care team.',
    fallback: (question) => `${formatQuestionIntro(question)}## Nursing Assessment & Interventions

**Immediate Actions:**
- Reassess vital signs and pain scores per protocol
- Verify medication orders and monitor for adverse reactions
- Ensure safety measures (fall prevention, line checks, alarms)

**Communication & Documentation:**
- Escalate changes in condition using SBAR communication
- Update nursing care plans and patient education notes
- Reinforce discharge teaching and follow-up arrangements

*Adhere to unit policies and collaborate with the multidisciplinary team for any concerns.*`,
  },
  patient: {
    label: 'Patient',
    guidance:
      'Use plain language to explain diagnoses, treatments, lifestyle changes, and warning signs; provide compassionate, step-by-step guidance without clinical jargon.',
    fallback: (question) => `${formatQuestionIntro(question)}## Understanding Your Care Plan

**What This Means for You:**
- A simple explanation of the current condition in everyday language
- Why your care team ordered specific tests or medicines
- How these steps help with your recovery

**How You Can Help Yourself:**
- Take medicines exactly as prescribed
- Follow diet, activity, or wound-care instructions provided
- Keep follow-up appointments and track any new symptoms

**When to Contact Your Doctor:**
- If pain, fever, breathing, or other symptoms suddenly worsen
- If you notice side effects or have questions about medications
- For any emergency signs, call local emergency services immediately.

*This summary is educational—always follow direct advice from your healthcare providers.*`,
  },
  family: {
    label: 'Family Care Partner',
    guidance:
      'Offer caregiver-friendly explanations, emphasize support tasks, safety monitoring, communication with providers, and emotional reassurance for the patient.',
    fallback: (question) => `${formatQuestionIntro(question)}## Supporting Your Loved One

**How You Can Help:**
- Keep a simple log of symptoms, medications, and questions
- Support hydration, nutrition, mobility, and comfort measures
- Encourage the patient to follow the care team’s instructions

**Stay Alert For:**
- Sudden changes in breathing, confusion, chest pain, or severe weakness
- Medication side effects (rash, dizziness, bleeding, swelling)
- Signs of infection (fever, chills, redness at wound or IV sites)

**Partner with the Care Team:**
- Share observations promptly and ask for clarification when unsure
- Bring a current medication list to every appointment
- Help coordinate follow-up visits and arrange transportation if needed.

*Remember to care for yourself, too—seek support from friends, family, or caregiver resources.*`,
  },
  researcher: {
    label: 'Medical Researcher / Scientist',
    guidance:
      'Prioritize discussion of study quality, methodology, statistical significance, limitations, and alignment with current literature.',
    fallback: (question) => `${formatQuestionIntro(question)}## Research-Oriented Summary

**Evidence Snapshot:**
- Outline key findings relevant to the clinical question
- Note study designs (RCT, cohort, meta-analysis) and sample sizes
- Comment on statistical power, effect sizes, and confidence intervals

**Literature Context:**
- Compare results with landmark trials or guidelines
- Highlight unresolved controversies or gaps in evidence
- Suggest directions for future research or quality improvement projects

**Clinical Translation:**
- Discuss applicability to target populations and settings
- Address safety signals and monitoring requirements
- Identify practical barriers to implementation (cost, resources, training)

*Ensure citations and institutional review processes are followed when disseminating findings.*`,
  },
  pharmacist: {
    label: 'Pharmacist / Medication Specialist',
    guidance:
      'Center the response on pharmacotherapy: dosing, kinetics, interactions, adjustments for organ function, monitoring parameters, and counseling points.',
    fallback: (question) => `${formatQuestionIntro(question)}## Pharmacotherapy Checklist

**Medication Review:**
- Verify indications, dosing regimens, routes, and timing
- Screen for CYP450, QTc, and pharmacodynamic interactions
- Adjust for renal/hepatic impairment and age-specific considerations

**Monitoring & Counseling:**
- Outline therapeutic drug monitoring or lab follow-up needs
- Emphasize patient counseling points and adherence strategies
- Prepare mitigation plans for anticipated adverse effects

**Coordination:**
- Communicate recommendations to prescribers and nursing staff
- Update medication reconciliation and allergy profiles
- Document interventions in the pharmacy care plan

*Consult institutional formularies and clinical guidelines to finalize recommendations.*`,
  },
  default: {
    label: 'General Medical User',
    guidance:
      'Provide balanced medical guidance using clear language, explain rationales, and include when to seek professional help.',
    fallback: (question) => `${formatQuestionIntro(question)}## Your Medical Summary

**What We Know So Far:**
- Summarize the main concern and current findings in simple terms
- Explain goals of tests, imaging, or treatments that are planned or underway

**Next Helpful Steps:**
- Follow the care team’s instructions closely
- Ask questions about anything that is unclear
- Keep a list of medications and upcoming appointments handy

**Safety Reminders:**
- Watch for new or worsening symptoms and report them
- Seek immediate medical care for emergency warning signs (severe chest pain, difficulty breathing, sudden weakness, uncontrolled bleeding)

*Use this as supportive guidance—always rely on licensed professionals for diagnosis and treatment decisions.*`,
  },
};

const getRoleDirective = (role: string): RoleDirective => ROLE_DIRECTIVES[role] ?? ROLE_DIRECTIVES.default;

interface GeminiRequestOptions {
  model: string;
  body: unknown;
  apiKey: string | undefined;
  retries?: number;
}

async function callGeminiDirect<T>({ model, body, apiKey, retries = 2 }: GeminiRequestOptions): Promise<T> {
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

interface GeminiContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface AIResponse {
  text: string;
  success: boolean;
  error?: string;
  fallbackUsed?: boolean;
}

export const getAIResponse = async (
  question: string,
  context: string,
  userType: string,
  isMobile: boolean = false
): Promise<AIResponse> => {
  try {
    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    
    // Use mobile-optimized prompt for mobile users or if response length is requested to be short
    const selectedTemplate = isMobile || window.innerWidth < 768 ? MOBILE_MEDICAL_PROMPT_TEMPLATE : MEDICAL_PROMPT_TEMPLATE;
    const roleDirective = getRoleDirective(userType);
    
    const prompt = selectedTemplate
      .replace('{context}', context || 'No additional context provided.')
      .replace('{question}', question)
      .replace('{user_type}', roleDirective.label)
      .replace('{role_guidance}', roleDirective.guidance);

    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };
    const data = await callGeminiDirect<GeminiContentResponse>({
      model: 'gemini-2.0-flash',
      body,
      retries: 3,
      apiKey: GOOGLE_API_KEY,
    });
    // Gemini returns response in data.candidates[0].content.parts[0].text
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (aiText) {
      return {
        text: aiText,
        success: true,
      };
    } else {
      return {
        text: '',
        success: false,
        error: 'No response from Gemini API',
      };
    }
  } catch (error) {
    console.error('Error getting AI response:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Mock response generator for demonstration
export function generateFallbackResponse(question: string, userType: string, context: string): string {
  const roleDirective = getRoleDirective(userType);
  // Check if context contains medical content (more flexible detection)
  const medicalKeywords = [
    'patient', 'diagnosis', 'medication', 'treatment', 'lab', 'blood', 'test', 'doctor', 
    'hospital', 'clinic', 'medical', 'health', 'nurse', 'physician', 'healthcare',
    'vital', 'pressure', 'temperature', 'heart', 'pulse', 'oxygen', 'breathing',
    'pain', 'symptom', 'disease', 'condition', 'therapy', 'drug', 'prescription',
    'examination', 'surgery', 'procedure', 'radiology', 'imaging', 'ultrasound',
    'x-ray', 'ct', 'mri', 'scan', 'chart', 'record', 'report', 'result',
    'emergency', 'icu', 'room', 'bed', 'monitor', 'equipment', 'device',
    'injection', 'iv', 'drip', 'tube', 'catheter', 'wound', 'bandage',
    'ambulance', 'stretcher', 'wheelchair', 'stethoscope', 'thermometer'
  ];
  
  const contextLower = context.toLowerCase();
  const questionLower = question.toLowerCase();
  
  // More flexible medical content detection
  const containsMedical = medicalKeywords.some(keyword => 
    contextLower.includes(keyword) || questionLower.includes(keyword)
  );
  
  // Also check for medical-looking patterns (numbers that might be vital signs, dates, etc.)
  const hasVitalsPattern = /\b\d{1,3}\/\d{1,3}\b|\b\d{2,3}\s*bpm\b|\b\d{1,3}\s*mmhg\b/i.test(context);
  const hasDatePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2}/.test(context);
  const hasTimePattern = /\d{1,2}:\d{2}/.test(context);
  const hasMedicalNumbers = /\b\d+\s*(mg|ml|cc|units?|mcg|kg|lbs?|cm|mm|%)\b/i.test(context);
  
  // If image has minimal text but question suggests medical context
  const questionSuggestsMedical = questionLower.includes('analyze') || 
                                  questionLower.includes('medical') ||
                                  questionLower.includes('hospital') ||
                                  questionLower.includes('patient') ||
                                  questionLower.includes('document');

  if (!containsMedical && !hasVitalsPattern && !hasDatePattern && !hasMedicalNumbers && !questionSuggestsMedical && context.length < 50) {
    return `⚠️ **LIMITED CONTENT DETECTED**

I can see that this document/image contains limited extractable text. This could be due to:
- Image quality or resolution issues
- Handwritten content that's difficult to read
- Medical images or charts without much text
- Equipment or device displays

**What I can help with:**
- If this is a medical image, please describe what you see and I can provide relevant medical information
- For lab reports or medical documents, try uploading a clearer image
- Ask specific questions about what you're looking for

**Please feel free to:**
1. Ask specific medical questions
2. Describe what's in the image
3. Upload additional documents for analysis`;
  }

  return roleDirective.fallback(question, context);
}

export const speakResponse = (text: string): void => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Use a professional voice if available
    const voices = speechSynthesis.getVoices();
    const professionalVoice = voices.find(voice => 
      voice.name.includes('Google') || voice.name.includes('Microsoft')
    );
    
    if (professionalVoice) {
      utterance.voice = professionalVoice;
    }
    
    speechSynthesis.speak(utterance);
  }
};

// Mini chat AI response for quick medical queries (5-6 lines max, markdown format)
export const getMiniChatAIResponse = async (question: string): Promise<AIResponse> => {
  try {
    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    
    const miniPrompt = `You are MediCare-ICU Pro Mini v7.0, an advanced medical AI with access to global medical databases, clinical guidelines, and pharmaceutical references. Provide precise medical information in exactly 5-6 lines using markdown format.

**MEDICAL KNOWLEDGE BASE ACCESS:**
- Harrison's Internal Medicine, Nelson Pediatrics, Current clinical guidelines
- FDA Drug Database, BNF, Lexicomp pharmaceutical references  
- PubMed research, Cochrane Reviews, WHO classifications
- Latest clinical practice guidelines from major medical societies

**CLINICAL QUERY:** ${question}

**RESPONSE REQUIREMENTS:**
- **Exactly 5-6 lines maximum**
- **Use markdown formatting** (bold, italic, bullet points, etc.)
- **Include specific dosages** with mg/kg when applicable
- **Reference clinical evidence** or guidelines when possible
- **Add confidence level** (High/Moderate/Low evidence)
- **Include safety warning** if giving medication advice
- **Consider global disease patterns** and population variations

**ADVANCED MEDICAL RESPONSE:**`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
    const body = {
      contents: [
        {
          parts: [
            { text: miniPrompt }
          ]
        }
      ]
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (aiText) {
      return {
        text: aiText,
        success: true,
      };
    } else {
      return {
        text: '',
        success: false,
        error: 'No response from Gemini API',
      };
    }
  } catch (error) {
    console.error('Error getting Mini Chat AI response:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Voice/Speech Output Service
export interface VoiceLanguage {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: VoiceLanguage[] = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' }
];

export const speakText = async (text: string, languageCode: string = 'en-US'): Promise<boolean> => {
  try {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return false;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean the text for better speech output (remove markdown)
    const cleanText = text
      .replace(/[#*_`]/g, '') // Remove markdown formatting
      .replace(/\n+/g, '. ') // Replace line breaks with periods
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleanText) {
      return false;
    }

    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set language and voice properties
    utterance.lang = languageCode;
    utterance.rate = 0.9; // Slightly slower for medical content
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a voice that matches the language
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => voice.lang === languageCode);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    return new Promise((resolve) => {
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
    });

  } catch (error) {
    console.error('Error in text-to-speech:', error);
    return false;
  }
};

export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeaking = (): boolean => {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking;
};