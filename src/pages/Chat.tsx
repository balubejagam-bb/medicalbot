import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getAIResponse, speakText, stopSpeaking, isSpeaking, SUPPORTED_LANGUAGES, VoiceLanguage } from '@/services/aiService';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
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
  FileSpreadsheet
} from 'lucide-react';
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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileDetailsRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
          ? `🏥 **Welcome to MediCare-ICU Assistant!** 

I've successfully analyzed **${files.length} medical documents**:
${files.map((file, index) => `${index + 1}. ${file}`).join('\n')}

I'm ready to provide comprehensive medical insights across all your documents. What would you like to know?

*Available analysis: Drug interactions, diagnostic insights, treatment recommendations, and clinical correlations.*`
          : `🏥 **Welcome to MediCare-ICU Assistant!**

I've successfully analyzed your medical document: **${filename}**

I'm ready to answer questions about the medical content. What specific information would you like to know?

*Available analysis: Medical terminology, diagnostic insights, treatment recommendations, and clinical interpretations.*`,
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
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Detect if user is on mobile device
      const isMobile = window.innerWidth < 768;
      
      const response = await getAIResponse(
        input.trim(),
        context,
        user?.role || 'patient',
        isMobile
      );

      if (response.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Save to database
        if (user) {
          await supabase
            .from('chat_history')
            .insert([
              {
                user_id: user.id,
                question: userMessage.content,
                answer: response.text,
                user_type: user.role || 'patient',
              }
            ]);
        }

        // Speak response if enabled
        if (speechEnabled) {
          await speakText(response.text, selectedLanguage);
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

  const getUserTypeColor = () => {
    switch (user?.role) {
      case 'healthcare_professional':
        return 'bg-primary';
      case 'nurse':
        return 'bg-success';
      case 'patient':
        return 'bg-accent';
      case 'family':
        return 'bg-warning';
      default:
        return 'bg-muted';
    }
  };

  const getUserTypeLabel = () => {
    switch (user?.role) {
      case 'healthcare_professional':
        return 'Doctor';
      case 'nurse':
        return 'Nurse';
      case 'patient':
        return 'Patient';
      case 'family':
        return 'Family';
      default:
        return 'User';
    }
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

  return (
    <div className="h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 flex flex-col relative">
      {/* Medical background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDVMMTggN0gxNlYxMUgyMFY5SDIyVjdIMjBWNVoiIGZpbGw9ImhzbCh2YXIoLS1wcmltYXJ5KSkiIGZpbGwtb3BhY2l0eT0iMC4wMyIvPgo8L3N2Zz4=')] opacity-30"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-card/90 backdrop-blur-lg shadow-medical border-b border-primary/20 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 sm:p-3 transition-all duration-200"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent flex items-center space-x-2">
                  <div className="relative p-2 rounded-full bg-gradient-to-r from-primary to-accent">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <span className="truncate">ICU-AI Assistant</span>
                </h1>
                <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                  <Badge className={`${getUserTypeColor()} text-xs flex-shrink-0 shadow-sm`}>
                    {getUserTypeLabel()}
                  </Badge>
                  
                  {/* File Display Section */}
                  {filename && (
                    <div className="flex items-center space-x-1 max-w-full relative">
                      {isGroupAnalysis ? (
                        <div className="flex items-center space-x-1 relative" ref={fileDetailsRef}>
                          <Badge 
                            variant="outline" 
                            className="flex items-center space-x-1 text-xs bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={() => setShowFileDetails(!showFileDetails)}
                          >
                            <Files className="w-3 h-3 flex-shrink-0" />
                            <span>{filesList.length} files</span>
                            {showFileDetails ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Badge>
                          
                          {/* Expandable file list */}
                          {showFileDetails && (
                            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-xl p-3 min-w-72 max-w-96 z-50">
                              <div className="text-xs font-semibold text-foreground mb-2 border-b border-border pb-1">
                                Analyzed Documents ({filesList.length})
                              </div>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {filesList.map((file, index) => {
                                  const FileIcon = getFileIcon(file);
                                  return (
                                    <div 
                                      key={index}
                                      className={`flex items-center space-x-2 p-2 rounded-md border shadow-sm text-xs ${getFileTypeColor(file)} hover:shadow-md transition-shadow`}
                                    >
                                      <FileIcon className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate font-medium" title={file}>{file}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className={`flex items-center space-x-1 text-xs max-w-40 sm:max-w-60 md:max-w-80 shadow-sm hover:shadow-md transition-shadow ${getFileTypeColor(filename)}`}
                        >
                          {(() => {
                            const FileIcon = getFileIcon(filename);
                            return <FileIcon className="w-3 h-3 flex-shrink-0" />;
                          })()}
                          <span className="truncate font-medium" title={filename}>{filename}</span>
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 sm:px-3"
                  >
                    <Languages className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Voice Language</DialogTitle>
                    <DialogDescription>
                      Choose the language for voice output
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((language) => (
                      <Button
                        key={language.code}
                        variant={selectedLanguage === language.code ? "default" : "outline"}
                        className="justify-start h-auto p-3"
                        onClick={() => handleLanguageSelect(language.code)}
                      >
                        <span className="text-lg mr-3">{language.flag}</span>
                        <span className="text-sm">{language.name}</span>
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className={speechEnabled ? 'bg-primary text-primary-foreground' : ''}
              >
                {speechEnabled ? <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 flex flex-col min-h-0">
        <ScrollArea className="flex-1 py-4 sm:py-6">
          <div className="space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 sm:space-x-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8 bg-primary flex-shrink-0">
                    <AvatarFallback>
                      <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <Card className={`max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%] shadow-card border-0 ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground' 
                    : 'bg-gradient-to-r from-card to-card/95 border border-border/50'
                }`}>
                  <CardContent className="p-3 sm:p-4 overflow-hidden">
                    <div className="whitespace-pre-wrap text-xs sm:text-sm break-words">
                      {message.role === 'assistant' ? (
                        <div className="prose prose-xs sm:prose-sm max-w-none dark:prose-invert overflow-hidden">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="mb-2 pl-4">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-2 pl-4">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                              em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                              code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                              h1: ({ children }) => <h1 className="text-base sm:text-lg font-bold mb-2 text-primary">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm sm:text-base font-semibold mb-2 text-primary">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-foreground">{children}</h3>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="overflow-hidden">
                          {message.content}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center justify-between text-xs mt-2 ${
                      message.role === 'user' 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoiceOutput(message.content, message.id)}
                          className={`h-6 w-6 p-0 hover:bg-muted ${
                            currentSpeaking === message.id ? 'text-primary' : 'text-muted-foreground'
                          }`}
                          disabled={currentSpeaking !== null && currentSpeaking !== message.id}
                        >
                          {currentSpeaking === message.id ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <VolumeIcon className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {message.role === 'user' && (
                  <Avatar className={`w-6 h-6 sm:w-8 sm:h-8 ${getUserTypeColor()} flex-shrink-0`}>
                    <AvatarFallback>
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start space-x-2 sm:space-x-3">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 bg-primary flex-shrink-0">
                  <AvatarFallback>
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground animate-pulse" />
                  </AvatarFallback>
                </Avatar>
                <Card className="shadow-card border-0 max-w-[90%] sm:max-w-[85%] bg-gradient-to-r from-card to-card/95 border border-border/50">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3 text-muted-foreground">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      </div>
                      <div className="animate-pulse text-xs sm:text-sm">
                        🏥 MediCare-ICU is analyzing your medical query...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex-shrink-0 py-3 sm:py-4 border-t border-border">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <div className="flex-1 relative min-w-0">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your medical documents..."
                disabled={loading}
                className="pr-10 text-sm sm:text-base"
              />
              {recognitionRef.current && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={listening ? stopListening : startListening}
                  disabled={loading}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 ${
                    listening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-primary to-accent text-white px-3 sm:px-4 flex-shrink-0"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-2 text-center px-2">
            MediCare-ICU Assistant provides medical information for educational purposes only. 
            Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;