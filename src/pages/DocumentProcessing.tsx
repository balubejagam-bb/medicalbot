import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Camera, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface ProcessedFile {
  name: string;
  type: string;
  text: string;
  success: boolean;
  error?: string;
}

const DocumentProcessing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { processFile, processing, progress } = useDocumentProcessing();
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      setCurrentFile(file);
      
      try {
        const result = await processFile(file);
        
        const processedFile: ProcessedFile = {
          name: result.filename,
          type: file.type,
          text: result.text,
          success: result.success,
          error: result.error,
        };

        setProcessedFiles(prev => [...prev, processedFile]);

        if (result.success && user) {
          // Save to database
          const { error } = await supabase
            .from('document_sessions')
            .insert([
              {
                user_id: user.id,
                original_filename: result.filename,
                raw_text: result.text,
              }
            ]);

          if (error) {
            console.error('Error saving document session:', error);
          } else {
            toast({
              title: 'Document processed successfully',
              description: `${result.filename} has been analyzed and saved.`,
            });
          }
        }
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          title: 'Processing failed',
          description: `Failed to process ${file.name}`,
          variant: 'destructive',
        });
      } finally {
        setCurrentFile(null);
      }
    }
  }, [processFile, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
      'application/pdf': ['.pdf'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return Image;
    if (type.includes('video')) return Video;
    return FileText;
  };

  // Analyze all processed files together
  const proceedToGroupChat = () => {
    const successfulFiles = processedFiles.filter(f => f.success);
    if (successfulFiles.length === 0) {
      toast({
        title: 'No documents to analyze',
        description: 'Please upload and process at least one document first.',
        variant: 'destructive',
      });
      return;
    }
    
    const allText = successfulFiles.map(f => f.text).join('\n\n');
    const allNames = successfulFiles.map(f => f.name).join(', ');
    
    navigate('/chat', {
      state: {
        initialContext: allText,
        filename: successfulFiles.length > 1 ? `Group: ${allNames}` : allNames,
      }
    });
  };

  // Analyze single file
  const proceedToChat = (text: string, filename: string) => {
    navigate('/chat', { 
      state: { 
        initialContext: text,
        filename: filename
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <div className="bg-card shadow-medical border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground p-2 sm:p-3"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                Document Processing
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Upload and process medical documents for AI analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Upload Section */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="shadow-medical border-0">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <span>Upload Documents</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Drag and drop your medical documents or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center transition-colors cursor-pointer
                    ${isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary hover:bg-primary/5'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  {isDragActive ? (
                    <p className="text-sm sm:text-base lg:text-lg text-primary">Drop files here...</p>
                  ) : (
                    <div>
                      <p className="text-sm sm:text-base lg:text-lg text-foreground mb-2">
                        Drop files here, or <span className="text-primary">browse</span>
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Supports: PDF, Images, Videos, PowerPoint (Max 50MB each)
                      </p>
                    </div>
                  )}
                </div>

                {/* Alternative Actions */}
                <div className="mt-4 sm:mt-6 flex flex-col space-y-2 sm:space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/camera')}
                    className="w-full text-sm sm:text-base"
                    size="sm"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Use Camera Instead
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                    className="w-full text-sm sm:text-base"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Processing Status */}
            {processing && currentFile && (
              <Card className="shadow-card border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary" />
                    <span className="truncate">Processing {currentFile.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    {progress.toFixed(0)}% complete
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="shadow-medical border-0">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Processing Results</CardTitle>
                <CardDescription className="text-sm">
                  Review processed documents and start AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {processedFiles.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No documents processed yet. Upload a file to get started.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 sm:space-y-4">
                      {processedFiles.map((file, index) => {
                        const FileIcon = getFileIcon(file.type);
                        return (
                          <div
                            key={index}
                            className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-shrink-0">
                              <div className={`p-1.5 sm:p-2 rounded-lg ${
                                file.success ? 'bg-success/10' : 'bg-destructive/10'
                              }`}>
                                <FileIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                  file.success ? 'text-success' : 'text-destructive'
                                }`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <h4 className="text-xs sm:text-sm font-medium text-foreground truncate flex-1">
                                  {file.name}
                                </h4>
                                {file.success ? (
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-success flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-destructive flex-shrink-0" />
                                )}
                              </div>
                              {file.success ? (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {file.text.length} characters extracted
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={() => proceedToChat(file.text, file.name)}
                                    className="bg-gradient-to-r from-primary to-accent text-white text-xs sm:text-sm"
                                  >
                                    <span className="hidden sm:inline">Start AI Analysis</span>
                                    <span className="sm:hidden">Analyze</span>
                                  </Button>
                                </div>
                              ) : (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertDescription className="text-xs">
                                    {file.error}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Group Analysis Button */}
                    <div className="mt-4 sm:mt-6">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-sm sm:text-base shadow-medical transition-all duration-300 transform hover:scale-105"
                        onClick={proceedToGroupChat}
                        disabled={processedFiles.filter(f => f.success).length === 0}
                      >
                        {processedFiles.filter(f => f.success).length > 1 ? (
                          <>
                            <span className="hidden sm:inline">Analyze All Documents Together ({processedFiles.filter(f => f.success).length} files)</span>
                            <span className="sm:hidden">Analyze All ({processedFiles.filter(f => f.success).length})</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Start Document Analysis</span>
                            <span className="sm:hidden">Analyze</span>
                          </>
                        )}
                      </Button>
                      {processedFiles.filter(f => f.success).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Upload documents to enable analysis
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentProcessing;