import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getAIResponse, speakText, stopSpeaking, isSpeaking, SUPPORTED_LANGUAGES, generateFallbackResponse } from '@/services/aiService';
import { getEnhancedMedicalAnalysis, MEDICAL_ROLES, PatientProfile, updateUserRole, EnhancedAIResponse } from '@/services/enhancedMedicalAI';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  ArrowLeft,
  Bot,
  User,
  Volume2,
  VolumeX,
  FileText,
  Mic,
  MicOff,
  VolumeIcon,
  Languages,
  ChevronDown,
  ChevronUp,
  Files,
  File,
  Image,
  Video,
  FileSpreadsheet,
  UserCheck,
  Settings,
  Brain,
  Stethoscope,
  Activity,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  History,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';

interface BrowserSpeechRecognitionEvent {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  enhanced?: EnhancedAIResponse; // Enhanced medical analysis results
  fallback?: boolean;
}

interface ChatHistoryItem {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

const GREETING_PATTERNS = [
  /^(hi|hii+|hello|helo|hey+|hlo|hola|yo|sup|whats?\s*up)[!.\s]*$/i,
  /^(good\s+(morning|afternoon|evening|night|day))(?:\s+[a-z]+)?[!.\s]*$/i,
  /^(thank\s+you|thanks|ty|thank\s+u)[!.\s]*$/i,
  /^(ok|okay|cool|sure|noted)[!.\s]*$/i,
];

const MEDICAL_KEYWORDS = [
  'pain',
  'symptom',
  'diagnosis',
  'report',
  'reports',
  'analysis',
  'scan',
  'x-ray',
  'ct',
  'mri',
  'lab',
  'labs',
  'blood',
  'cbc',
  'glucose',
  'hba1c',
  'bp',
  'pressure',
  'heart',
  'fever',
  'cough',
  'medication',
  'medications',
  'medicine',
  'drug',
  'dose',
  'therapy',
  'treatment',
  'plan',
  'follow-up',
  'followup',
  'injury',
  'fracture',
  'infect',
  'antibiotic',
  'prescription',
  'clinical',
  'patient',
  'symptoms',
  'side effect',
  'allergy',
  'allergies',
];

const shouldBypassEnhancedAnalysis = (prompt: string): boolean => {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return true;

  if (GREETING_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const containsMedicalKeyword = MEDICAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const containsQuestion = normalized.includes('?');
  const words = normalized.split(/\s+/).filter(Boolean);

  if (!containsMedicalKeyword && words.length <= 2 && !containsQuestion) {
    return true;
  }

  if (!containsMedicalKeyword && normalized.length <= 6) {
    return true;
  }

  return false;
};

const prepareContextForModel = (context: string): string => {
  if (!context) return '';

  const trimmed = context.trim();
  return trimmed || '';
};

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [currentSpeaking, setCurrentSpeaking] = useState<string | null>(null);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [filesList, setFilesList] = useState<string[]>([]);
  const [isGroupAnalysis, setIsGroupAnalysis] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [enhancedMode, setEnhancedMode] = useState(true);
  const [patientProfile, setPatientProfile] = useState<PatientProfile>({});
  const [activeRole, setActiveRole] = useState<string>(user?.role ?? 'patient');
  const [storedNonEnhancedRole, setStoredNonEnhancedRole] = useState<string | null>(
    user?.role && user.role !== 'healthcare_professional' ? user.role : null
  );
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileDetailsRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messageTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }),
    []
  );

  const userInitials = useMemo(() => {
    if (user?.first_name || user?.last_name) {
      const first = user?.first_name?.[0] ?? '';
      const last = user?.last_name?.[0] ?? '';
      return `${first}${last}`.toUpperCase() || 'ME';
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'ME';
  }, [user?.first_name, user?.last_name, user?.email]);

  useEffect(() => {
    if (!user?.role) {
      return;
    }

    if (enhancedMode) {
      if (user.role !== 'healthcare_professional') {
        setStoredNonEnhancedRole((prev) => prev ?? user.role);
      }
      if (activeRole !== 'healthcare_professional') {
        setActiveRole('healthcare_professional');
      }
    } else {
      if (activeRole !== user.role) {
        setActiveRole(user.role);
      }
      if (user.role !== 'healthcare_professional') {
        setStoredNonEnhancedRole(user.role);
      } else {
        setStoredNonEnhancedRole(null);
      }
    }
  }, [user?.role, enhancedMode, activeRole]);

  useEffect(() => {
    if (enhancedMode && activeRole !== 'healthcare_professional') {
      setStoredNonEnhancedRole((prev) => prev ?? activeRole);
      setActiveRole('healthcare_professional');
    }
  }, [enhancedMode, activeRole]);

  const loadChatHistory = useCallback(
    async (notify = false) => {
      if (!user?.id) {
        setChatHistory([]);
        return;
      }

      setHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_history')
          .select('id, question, answer, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(25);

        if (error) {
          throw error;
        }

        const parsedHistory: ChatHistoryItem[] = (data || []).map((item) => ({
          id: String(item.id ?? item.created_at ?? `${Date.now()}-${Math.random()}`),
          question: item.question ?? 'Untitled query',
          answer: item.answer ?? '',
          createdAt: item.created_at ?? new Date().toISOString(),
        }));

        setChatHistory(parsedHistory);

        if (notify) {
          toast({
            title: 'History updated',
            description: 'Latest conversations loaded successfully.',
          });
        }
      } catch (error) {
        console.error('Failed to load chat history', error);
        toast({
          title: 'History unavailable',
          description: 'We could not load your previous questions just now.',
          variant: 'destructive',
        });
      } finally {
        setHistoryLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    void loadChatHistory();
  }, [loadChatHistory]);

  const handleEnhancedModeToggle = useCallback(
    async (checked: boolean) => {
      if (checked) {
        setEnhancedMode(true);

        if (activeRole !== 'healthcare_professional') {
          setStoredNonEnhancedRole((prev) => prev ?? activeRole);
          setActiveRole('healthcare_professional');

          if (user?.id) {
            const success = await updateUserRole(user.id, 'healthcare_professional');
            if (!success) {
              toast({
                title: 'Role sync failed',
                description:
                  'We could not update your account role to Healthcare Professional. Enhanced tools will still run locally.',
                variant: 'destructive',
              });
            }
          }
        }

        toast({
          title: 'Enhanced mode enabled',
          description: 'Advanced clinical analysis is now running in the Healthcare Professional workspace.',
        });

        return;
      }

      setEnhancedMode(false);

      const restoreRole =
        storedNonEnhancedRole && storedNonEnhancedRole !== 'healthcare_professional'
          ? storedNonEnhancedRole
          : user?.role && user.role !== 'healthcare_professional'
            ? user.role
            : 'patient';

      setActiveRole(restoreRole);

      if (user?.id) {
        const success = await updateUserRole(user.id, restoreRole);
        if (!success) {
          toast({
            title: 'Role sync failed',
            description: 'We could not restore your previous workspace role. You can switch it manually if needed.',
            variant: 'destructive',
          });
        }
      }

      setStoredNonEnhancedRole(restoreRole !== 'healthcare_professional' ? restoreRole : null);

      const restoredRoleLabel =
        MEDICAL_ROLES.find((role) => role.id === restoreRole)?.name ?? 'Patient';

      toast({
        title: 'Enhanced mode disabled',
        description: `Reverted to the ${restoredRoleLabel} workspace.`,
      });
    },
    [activeRole, storedNonEnhancedRole, user?.id, user?.role]
  );

  const formatMessageTime = (timestamp: Date) => messageTimeFormatter.format(timestamp);

  const formatHistoryTimestamp = (createdAt: string) =>
    formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  // Initialize from location state (document processing)
  useEffect(() => {
    if (location.state?.initialContext) {
      setContext(location.state.initialContext);
      const filename = location.state.filename || 'Uploaded Document';
      setFilename(filename);
      
      let isGroup = false;
      let files: string[] = [];
      
      // Check if it's a group analysis
      if (filename.startsWith('Group: ')) {
        isGroup = true;
        files = filename.replace('Group: ', '').split(', ');
        setIsGroupAnalysis(true);
        setFilesList(files);
      } else {
        isGroup = false;
        files = [filename];
        setIsGroupAnalysis(false);
        setFilesList([filename]);
      }
      
      // Add initial system message
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: isGroup 
          ? `🏥 **Welcome to MediCare-ICU Pro v8.0!** 

I've successfully analyzed **${files.length} medical documents** with advanced AI:
${files.map((file, index) => `${index + 1}. ${file}`).join('\n')}

**🎯 Enhanced Features Active:**
- ⚡ **Precision Medicine**: Personalized dosing & treatment plans
- 🧬 **Drug Interaction Analysis**: Real-time pharmaceutical screening
- 📊 **Clinical Scoring**: SOFA, APACHE II, risk calculators
- 🔬 **Evidence-Based**: Latest research & guidelines integration
- 🌍 **Global Health**: Population-specific recommendations

*Ready for advanced clinical analysis across all documents!*`
          : `🏥 **Welcome to MediCare-ICU Pro v8.0!**

I've successfully analyzed your medical document: **${filename}**

**🎯 Advanced AI Features:**
- 💊 **Precision Pharmacotherapy**: Exact dosing with adjustments
- 🔬 **Evidence-Based Analysis**: Latest medical literature
- ⚡ **Critical Care Protocols**: ICU/ER decision support
- 📈 **Predictive Analytics**: Risk assessment & outcomes

*What specific medical insights would you like?*`,
        timestamp: new Date(),
      };
      setMessages([systemMessage]);
    }
  }, [location.state]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle click outside to close file details
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileDetailsRef.current && !fileDetailsRef.current.contains(event.target as Node)) {
        setShowFileDetails(false);
      }
    };

    if (showFileDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFileDetails]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition ?? window.SpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
      }

      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: BrowserSpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setListening(false);
        };

        recognitionRef.current.onerror = () => {
          setListening(false);
          toast({
            title: 'Speech recognition error',
            description: 'Could not recognize speech. Please try again.',
            variant: 'destructive',
          });
        };

        recognitionRef.current.onend = () => {
          setListening(false);
        };
      }
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleHistorySelect = (entry: ChatHistoryItem) => {
    setInput(entry.question);
    setHistoryOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const bypassEnhanced = enhancedMode && activeRole !== 'patient' && shouldBypassEnhancedAnalysis(trimmedInput);
    const preparedContext = prepareContextForModel(context);
    const contextForPrompt = bypassEnhanced ? '' : preparedContext;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
  let response: { success: boolean; text: string; error?: string; fallbackUsed?: boolean } | undefined;
      let enhancedData: EnhancedAIResponse | null = null;
      let encounteredError: string | null = null;
  let fallbackReason: string | null = null;

      if (enhancedMode && activeRole !== 'patient' && !bypassEnhanced) {
        const enhancedResponse = await getEnhancedMedicalAnalysis(
          trimmedInput,
          contextForPrompt,
          activeRole,
          patientProfile,
          window.innerWidth < 768
        );

        if (enhancedResponse.success) {
          response = { success: true, text: enhancedResponse.response };
          enhancedData = enhancedResponse;
        } else {
          encounteredError = enhancedResponse.error || 'Enhanced mode is temporarily unavailable.';

          toast({
            title: 'Enhanced mode unavailable',
            description: encounteredError,
            variant: 'destructive',
          });

          response = await getAIResponse(
            trimmedInput,
            contextForPrompt,
            activeRole,
            window.innerWidth < 768
          );

          if (!response.success) {
            fallbackReason = response.error || 'Standard AI response unavailable.';
            const fallbackText = generateFallbackResponse(trimmedInput, activeRole, contextForPrompt);
            response = { success: true, text: fallbackText, fallbackUsed: true, error: fallbackReason };
          }
        }
      } else {
        response = await getAIResponse(
          trimmedInput,
          contextForPrompt,
          activeRole,
          window.innerWidth < 768
        );

        if (!response.success) {
          fallbackReason = response.error || 'Standard AI response unavailable.';
          const fallbackText = generateFallbackResponse(trimmedInput, activeRole, contextForPrompt);
          response = { success: true, text: fallbackText, fallbackUsed: true, error: fallbackReason };
        }
      }

      if (response.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text,
          timestamp: new Date(),
          enhanced: enhancedData || undefined,
          fallback: response.fallbackUsed || undefined,
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (encounteredError) {
          const systemMessage: ChatMessage = {
            id: `${Date.now()}-warning`,
            role: 'assistant',
            content: `⚠️ Enhanced analysis could not be completed: ${encounteredError}. A standard medical summary is shown instead.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, systemMessage]);
        }

        if (response.fallbackUsed && fallbackReason) {
          toast({
            title: 'Showing offline medical summary',
            description: fallbackReason,
            variant: 'default',
          });

          const fallbackNotice: ChatMessage = {
            id: `${Date.now()}-fallback`,
            role: 'assistant',
            content: `ℹ️ Gemini service is temporarily unavailable (${fallbackReason}). The latest question has been restored in the input so you can retry once the service recovers.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, fallbackNotice]);

          setInput(userMessage.content);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 150);
        }

        // Save to database
        if (user) {
          void (async () => {
            const { error: historyError } = await supabase.from('chat_history').insert([
              {
                user_id: user.id,
                question: userMessage.content,
                answer: response.text,
                user_type: activeRole,
              },
            ]);

            if (historyError) {
              console.error('Failed to store chat history:', historyError);
              toast({
                title: 'History save failed',
                description: 'We could not save this conversation to your history.',
                variant: 'destructive',
              });
            }
          })();
        }

        // Speak response if enabled (do not block user input while speech plays)
        if (speechEnabled) {
          void speakText(response.text, selectedLanguage);
        }
      } else {
        throw new Error(response.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Chat error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!user?.id) return;

    if (newRole === activeRole) {
      setShowRoleSelector(false);
      return;
    }

    if (enhancedMode && newRole !== 'healthcare_professional') {
      await handleEnhancedModeToggle(false);
    }

    const success = await updateUserRole(user.id, newRole);
    if (success) {
      setActiveRole(newRole);
      setShowRoleSelector(false);
      setStoredNonEnhancedRole(newRole !== 'healthcare_professional' ? newRole : null);
      toast({
        title: 'Role updated successfully',
        description: `You are now using the ${MEDICAL_ROLES.find(r => r.id === newRole)?.name} workspace.`,
      });
    } else {
      toast({
        title: 'Role update failed',
        description: 'Unable to update your role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getCurrentRole = () => {
    return MEDICAL_ROLES.find(role => role.id === activeRole) || MEDICAL_ROLES[2];
  };

  const getUserTypeColor = () => {
    return getCurrentRole().color;
  };

  const getUserTypeLabel = () => {
    return getCurrentRole().name;
  };

  // Helper function to get file icon based on extension
  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return FileText;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return Image;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return Video;
      case 'xls':
      case 'xlsx':
        return FileSpreadsheet;
      default:
        return File;
    }
  };

  // Helper function to get file type color
  const getFileTypeColor = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'xls':
      case 'xlsx':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Voice control functions
  const handleVoiceOutput = async (text: string, messageId: string) => {
    if (isSpeaking()) {
      stopSpeaking();
      setCurrentSpeaking(null);
      return;
    }

    setCurrentSpeaking(messageId);
    const success = await speakText(text, selectedLanguage);
    if (!success) {
      toast({
        title: 'Voice output failed',
        description: 'Unable to play voice output. Please check your device settings.',
        variant: 'destructive',
      });
    }
    setCurrentSpeaking(null);
  };

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setShowLanguageDialog(false);
    toast({
      title: 'Language updated',
      description: `Voice output will now use ${SUPPORTED_LANGUAGES.find(l => l.code === languageCode)?.name}`,
    });
  };

  const PatientProfileSection = () => (
    <Collapsible open={showPatientProfile} onOpenChange={setShowPatientProfile}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between">
          <span className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Patient Profile</span>
          </span>
          {showPatientProfile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="Age in years"
              value={patientProfile.age || ''}
              onChange={(e) => setPatientProfile(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="Weight in kg"
              value={patientProfile.weight || ''}
              onChange={(e) => setPatientProfile(prev => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={patientProfile.gender}
            onValueChange={(value: 'male' | 'female' | 'other') =>
              setPatientProfile(prev => ({ ...prev, gender: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="allergies">Known Allergies</Label>
          <Textarea
            id="allergies"
            placeholder="e.g., Penicillin, Sulfa drugs, Latex..."
            value={patientProfile.allergies?.join(', ') || ''}
            onChange={(e) => setPatientProfile(prev => ({ 
              ...prev, 
              allergies: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
            }))}
          />
        </div>
        <div>
          <Label htmlFor="medications">Current Medications</Label>
          <Textarea
            id="medications"
            placeholder="e.g., Metformin 500mg BID, Lisinopril 10mg daily..."
            value={patientProfile.currentMedications?.join(', ') || ''}
            onChange={(e) => setPatientProfile(prev => ({ 
              ...prev, 
              currentMedications: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
            }))}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  const HistoryPanel = ({ inSheet = false }: { inSheet?: boolean }) => (
    <div className="flex h-full flex-col">
      <div
        className={
          inSheet
            ? 'flex items-center justify-between'
            : 'flex items-center justify-between border-b border-border px-4 py-4'
        }
      >
        <div>
          <p className="text-sm font-semibold">Conversation history</p>
          <p className="text-xs text-muted-foreground">
            Your latest medical questions are saved here.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void loadChatHistory(true)}
          disabled={historyLoading}
          className="h-8 w-8"
        >
          {historyLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className={`${inSheet ? 'max-h-[60vh]' : 'flex-1'} px-2 pb-4 pt-2`}>
        {historyLoading && chatHistory.length === 0 ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, index) => (
              <div
                key={`history-skeleton-${index}`}
                className="h-16 animate-pulse rounded-lg border border-dashed border-border/60 bg-muted/40"
              ></div>
            ))}
          </div>
        ) : chatHistory.length > 0 ? (
          <div className="space-y-2">
            {chatHistory.map((entry) => (
              <Button
                key={entry.id}
                variant="ghost"
                className="flex w-full flex-col items-start gap-1 rounded-lg border border-transparent bg-background/50 px-3 py-3 text-left transition hover:border-border hover:bg-background"
                onClick={() => handleHistorySelect(entry)}
              >
                <span className="text-sm font-medium leading-snug text-foreground">
                  {entry.question}
                </span>
                <span className="w-full truncate text-xs text-muted-foreground">
                  {entry.answer || 'Tap to reuse this prompt'}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  {formatHistoryTimestamp(entry.createdAt)}
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-center">
            <History className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground/80">
              Start by asking a question or uploading a document.
            </p>
          </div>
        )}
      </ScrollArea>

      <div className={`${inSheet ? 'mt-4' : 'border-t border-border bg-background/60 px-4 py-4'}`}>
        <Button
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={() => {
            setHistoryOpen(false);
            navigate('/document-processing');
          }}
        >
          <Plus className="h-4 w-4" />
          Upload new medical file
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <aside className="hidden flex-shrink-0 flex-col border-r border-border/70 bg-background/70 backdrop-blur xl:flex xl:w-72">
        <HistoryPanel />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="h-9 w-9 rounded-full border border-border/80 text-muted-foreground hover:border-primary hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
                        MediCare-ICU Pro v8.0
                      </h1>
                      {enhancedMode && (
                        <Badge variant="secondary" className="flex items-center gap-1 border-primary/30 bg-primary/10 text-primary">
                          <Zap className="h-3.5 w-3.5" />
                          Enhanced
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Precision clinical guidance tailored to your role.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Dialog open={showRoleSelector} onOpenChange={setShowRoleSelector}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-full border-border/70 bg-background/80 text-foreground hover:border-primary/40"
                      >
                        <span>{getCurrentRole().icon}</span>
                        {getUserTypeLabel()}
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5" />
                          Choose your clinical workspace
                        </DialogTitle>
                        <DialogDescription>
                          Switching roles adjusts the level of detail and clinical tooling you see.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-3 max-h-[70vh] overflow-y-auto">
                        {MEDICAL_ROLES.map((role) => (
                          <Button
                            key={role.id}
                            variant={activeRole === role.id ? 'default' : 'outline'}
                            className="h-auto justify-start gap-3 rounded-xl border-border/70 px-4 py-3 text-left"
                            onClick={() => handleRoleChange(role.id)}
                          >
                            <span className="text-2xl leading-none">{role.icon}</span>
                            <div className="space-y-1">
                              <div className="font-semibold text-foreground">{role.name}</div>
                              <p className="text-sm text-muted-foreground">{role.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {role.features.map((feature, index) => (
                                  <Badge key={index} variant="secondary" className="text-[10px]">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {filename && (
                    <div className="relative" ref={fileDetailsRef}>
                      {isGroupAnalysis ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 rounded-full border-border/70 bg-background/80 text-foreground hover:border-primary/40"
                          onClick={() => setShowFileDetails((prev) => !prev)}
                        >
                          <Files className="h-4 w-4" />
                          {filesList.length} documents
                          {showFileDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-2 rounded-full border-border/60 bg-background/80 ${getFileTypeColor(filename)}`}
                        >
                          {(() => {
                            const FileIcon = getFileIcon(filename);
                            return <FileIcon className="h-3.5 w-3.5" />;
                          })()}
                          <span className="max-w-[180px] truncate" title={filename}>
                            {filename}
                          </span>
                        </Badge>
                      )}

                      {showFileDetails && isGroupAnalysis && (
                        <div className="absolute z-50 mt-2 w-72 rounded-xl border border-border/70 bg-background/95 p-3 shadow-lg">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Analyzed documents
                          </p>
                          <div className="space-y-2">
                            {filesList.map((file, index) => {
                              const FileIcon = getFileIcon(file);
                              return (
                                <div
                                  key={`${file}-${index}`}
                                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${getFileTypeColor(file)}`}
                                >
                                  <FileIcon className="h-4 w-4" />
                                  <span className="truncate" title={file}>
                                    {file}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 xl:hidden">
                    <History className="h-4 w-4" />
                    History
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[90vw] max-w-sm border-border/70 p-0">
                  <SheetHeader className="border-b border-border/70 px-6 py-4 text-left">
                    <SheetTitle>Conversation history</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 py-4">
                    <HistoryPanel inSheet />
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate('/document-processing')}
              >
                <Plus className="h-4 w-4" />
                Upload
              </Button>

              <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9 rounded-full">
                    <Languages className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select voice language</DialogTitle>
                    <DialogDescription>
                      Choose the language used for spoken responses.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid max-h-64 gap-2 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((language) => (
                      <Button
                        key={language.code}
                        variant={selectedLanguage === language.code ? 'default' : 'outline'}
                        className="h-auto justify-start gap-3 px-3 py-2"
                        onClick={() => handleLanguageSelect(language.code)}
                      >
                        <span className="text-xl leading-none">{language.flag}</span>
                        <span className="text-sm">{language.name}</span>
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                className={`h-9 w-9 rounded-full ${speechEnabled ? 'border-primary text-primary' : ''}`}
                onClick={() => setSpeechEnabled((prev) => !prev)}
              >
                {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1">
                <span className="text-xs font-medium text-muted-foreground">Enhanced</span>
                <Switch
                  id="enhanced-mode"
                  checked={enhancedMode}
                  onCheckedChange={(value) => {
                    void handleEnhancedModeToggle(value);
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex flex-1 flex-col">
            <ScrollArea className="flex-1 px-4 py-6 sm:px-6">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
                {messages.map((message) => {
                  const isUser = message.role === 'user';
                  const bubbleClasses = isUser
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : message.fallback
                      ? 'bg-card/80 backdrop-blur border-amber-300/70 dark:border-amber-500/60'
                      : 'bg-card/80 backdrop-blur border-border/60';
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isUser ? 'flex-row-reverse text-right' : ''}`}
                    >
                      <Avatar
                        className={`h-10 w-10 border border-border/70 text-sm font-semibold ${
                          isUser
                            ? `${getUserTypeColor()} text-white`
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <AvatarFallback>
                          {isUser ? (
                            <span>{userInitials}</span>
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={`flex max-w-full flex-col gap-3 rounded-2xl border px-4 py-3 shadow-sm ${bubbleClasses}`}
                      >
                        <div className={`${!isUser ? 'prose prose-sm max-w-none dark:prose-invert' : ''}`}>
                          {isUser ? (
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          ) : (
                            <>
                              {!isUser && message.fallback && (
                                <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-100">
                                  <AlertTriangle className="h-4 w-4 shrink-0" />
                                  <span>
                                    Offline insight while Gemini reconnects. Expect a simplified summary.
                                  </span>
                                </div>
                              )}
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
                                  ul: ({ children }) => <ul className="mb-3 list-disc pl-5 last:mb-0">{children}</ul>,
                                  ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 last:mb-0">{children}</ol>,
                                  li: ({ children }) => <li className="mb-1">{children}</li>,
                                  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                                  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                                  code: ({ children }) => (
                                    <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                                      {children}
                                    </code>
                                  ),
                                  h1: ({ children }) => <h1 className="mb-3 text-lg font-semibold text-primary">{children}</h1>,
                                  h2: ({ children }) => <h2 className="mb-2 text-base font-semibold text-primary">{children}</h2>,
                                  h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold text-foreground">{children}</h3>,
                                  table: ({ children }) => (
                                    <div className="mb-3 overflow-hidden rounded-lg border border-border/70">
                                      <table className="w-full border-collapse text-sm">{children}</table>
                                    </div>
                                  ),
                                  th: ({ children }) => (
                                    <th className="bg-muted/70 px-3 py-2 text-left font-semibold uppercase tracking-wide text-xs">
                                      {children}
                                    </th>
                                  ),
                                  td: ({ children }) => <td className="px-3 py-2 text-left text-sm">{children}</td>,
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </>
                          )}
                        </div>

                        {message.enhanced && enhancedMode && (
                          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-left">
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
                              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                                Confidence {Math.round(message.enhanced.confidence * 100)}%
                              </Badge>
                              <Badge variant="outline" className="border-primary/30 text-primary">
                                Evidence level {message.enhanced.evidenceLevel}
                              </Badge>
                            </div>

                            {message.enhanced.medications?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Key medications
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {message.enhanced.medications.slice(0, 4).map((med, index) => (
                                    <Badge key={`${med.name}-${index}`} variant="outline" className="text-[11px]">
                                      {med.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {message.enhanced.treatmentPlan?.redFlags?.length ? (
                              <div className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                                <div className="mb-1 flex items-center gap-1 font-semibold">
                                  <AlertTriangle className="h-3.5 w-3.5" /> Critical alerts
                                </div>
                                <p className="text-destructive/80">
                                  {message.enhanced.treatmentPlan.redFlags.slice(0, 3).join('; ')}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        )}

                        <div
                          className={`flex items-center justify-between text-xs ${
                            isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}
                        >
                          <span>{formatMessageTime(message.timestamp)}</span>
                          {!isUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVoiceOutput(message.content, message.id)}
                              className={`h-7 w-7 rounded-full p-0 ${
                                currentSpeaking === message.id ? 'text-primary' : 'text-muted-foreground'
                              }`}
                              disabled={currentSpeaking !== null && currentSpeaking !== message.id}
                            >
                              {currentSpeaking === message.id ? (
                                <VolumeX className="h-3.5 w-3.5" />
                              ) : (
                                <VolumeIcon className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-primary/10 text-primary">
                      <AvatarFallback>
                        <Bot className="h-4 w-4 animate-pulse" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        MediCare-ICU is analyzing your medical query…
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border/60 bg-background/85 px-4 py-4 sm:px-6">
              <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex w-full flex-1 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/document-processing')}
                    className="h-11 w-11 flex-shrink-0 rounded-full border-dashed border-primary/60 text-primary hover:border-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Upload new document</span>
                  </Button>

                  <div className="relative flex-1">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about your patient, treatment plans, or documents…"
                      disabled={loading}
                      className="h-11 pr-12"
                    />
                    {recognitionRef.current && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={listening ? stopListening : startListening}
                        disabled={loading}
                        className={`absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full ${
                          listening ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="h-11 flex-shrink-0 gap-2 bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </form>
              <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-muted-foreground">
                {enhancedMode
                  ? 'MediCare-ICU Pro delivers evidence-based clinical decision support tailored for healthcare professionals.'
                  : 'MediCare-ICU Assistant shares educational medical information. Always confirm decisions with your care team.'}
              </p>
            </div>
          </main>

          {enhancedMode && activeRole !== 'patient' && (
            <aside className="hidden w-80 flex-shrink-0 flex-col border-l border-border/70 bg-background/70 backdrop-blur lg:flex">
              <div className="px-5 py-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Stethoscope className="h-4 w-4" /> Clinical workspace
                </h3>
                <div className="space-y-5">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <User className="h-4 w-4" /> Patient profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <PatientProfileSection />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Activity className="h-4 w-4" /> Quick actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <Target className="h-4 w-4" /> Calculate dosing
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <TrendingUp className="h-4 w-4" /> Risk assessment
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <AlertTriangle className="h-4 w-4" /> Drug interactions
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <Clock className="h-4 w-4" /> Treatment timeline
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;