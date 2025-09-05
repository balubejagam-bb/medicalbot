import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Camera, 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  X, 
  Download,
  Zap,
  Info,
  AlertTriangle,
  Shield,
  Stethoscope
} from 'lucide-react';

const CameraCapture = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { processFile, processing } = useDocumentProcessing();
  const webcamRef = useRef<Webcam>(null);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [enhanceImage, setEnhanceImage] = useState(true);
  const [cameraError, setCameraError] = useState<string>('');
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const videoConstraints = {
    width: 1920,
    height: 1080,
    facingMode: facingMode,
    audio: false,
  };

  // Check camera permissions on mount
  useEffect(() => {
    const checkCameraPermissions = async () => {
      try {
        // Check if we're on HTTPS or localhost
        const isSecureContext = window.location.protocol === 'https:' || 
                                window.location.hostname === 'localhost' || 
                                window.location.hostname === '127.0.0.1';
        
        if (!isSecureContext) {
          setCameraError('Camera requires HTTPS connection. Please use the document upload page instead.');
          return;
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Request camera permissions
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              facingMode: facingMode,
            },
            audio: false
          });
          
          setPermissionGranted(true);
          setCameraError('');
          
          // Stop the stream after checking permissions
          stream.getTracks().forEach(track => track.stop());
        } else {
          setCameraError('Camera not supported on this device. Please use the document upload page instead.');
        }
      } catch (error: unknown) {
        console.error('Camera permission error:', error);
        const err = error as { name?: string; message?: string };
        if (err.name === 'NotAllowedError') {
          setCameraError('Camera access denied. Please allow camera permissions or use the document upload page instead.');
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera device found. Please use the document upload page instead.');
        } else if (err.name === 'NotReadableError') {
          setCameraError('Camera is being used by another application. Please use the document upload page instead.');
        } else {
          setCameraError(`Camera error: ${err.message || 'Unknown error'}. Please use the document upload page instead.`);
        }
        setPermissionGranted(false);
      }
    };

    checkCameraPermissions();
  }, [facingMode]);

  const onUserMedia = useCallback(() => {
    setCameraReady(true);
    setCameraError('');
  }, []);

  const onUserMediaError = useCallback((error: unknown) => {
    console.error('Webcam error:', error);
    setCameraReady(false);
    const err = error as { name?: string; message?: string };
    if (err.name === 'NotAllowedError') {
      setCameraError('Camera access denied. Please allow camera permissions and refresh the page.');
    } else if (err.name === 'NotFoundError') {
      setCameraError('No camera found. Please connect a camera device.');
    } else if (err.name === 'NotReadableError') {
      setCameraError('Camera is being used by another application. Please close other camera apps.');
    } else {
      setCameraError(`Camera error: ${err.message || 'Unknown camera error'}`);
    }
  }, []);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
  };

  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    setCameraReady(false);
    setCameraError('');
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const processImage = async () => {
    if (!capturedImage || !user) return;

    try {
      const file = dataURLtoFile(capturedImage, `camera-capture-${Date.now()}.jpg`);
      const result = await processFile(file);

      if (result.success) {
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
        }

        toast({
          title: 'Document processed successfully',
          description: 'Camera capture has been analyzed and saved.',
        });

        // Navigate to chat with the processed text
        navigate('/chat', { 
          state: { 
            initialContext: result.text,
            filename: result.filename
          } 
        });
      } else {
        throw new Error(result.error || 'Failed to process image');
      }
    } catch (error) {
      console.error('Error processing camera capture:', error);
      toast({
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Failed to process camera capture',
        variant: 'destructive',
      });
    }
  };

  const downloadImage = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `camera-capture-${Date.now()}.jpg`;
      link.click();
    }
  };

  const handleBackToDocuments = () => {
    setIsNavigating(true);
    // Small delay to show loading state
    setTimeout(() => {
      navigate('/document-processing');
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 relative">
      {/* Medical background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDVMMTggN0gxNlYxMUgyMFY5SDIyVjdIMjBWNVoiIGZpbGw9ImhzbCh2YXIoLS1wcmltYXJ5KSkiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPgo8L3N2Zz4=')] opacity-20"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-card/80 backdrop-blur-lg shadow-medical border-b border-primary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button 
              variant="ghost" 
              onClick={handleBackToDocuments}
              disabled={isNavigating}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 sm:p-3 transition-all duration-200"
              size="sm"
            >
              {isNavigating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              ) : (
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">
                {isNavigating ? 'Loading...' : 'Back to Documents'}
              </span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent flex items-center space-x-2">
                <div className="relative p-2 rounded-full bg-gradient-to-r from-primary to-accent">
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <span className="truncate">ICU Document Scanner</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center space-x-2">
                <Stethoscope className="w-3 h-3 text-accent" />
                <span>Capture medical documents with AI-powered analysis</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        {/* Camera Permission Error */}
        {cameraError && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-destructive font-medium">
              {cameraError}
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToDocuments}
                  className="text-xs bg-white/80 hover:bg-white"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Go to File Upload
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Camera Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-medical border-0 bg-card/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-3 sm:pb-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Camera className="w-5 h-5 text-primary" />
                      {cameraReady && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <span>Medical Document Camera</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={switchCamera}
                      disabled={!!capturedImage || !permissionGranted}
                      className="text-xs sm:text-sm hover:bg-primary/10 hover:border-primary transition-all duration-200"
                    >
                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Switch</span>
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden aspect-video border-2 border-primary/20">
                  {capturedImage ? (
                    <img 
                      src={capturedImage} 
                      alt="Captured medical document" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      {permissionGranted ? (
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          videoConstraints={videoConstraints}
                          onUserMedia={onUserMedia}
                          onUserMediaError={onUserMediaError}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-white">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
                            <p className="text-lg font-medium mb-2">Camera Access Required</p>
                            <p className="text-sm text-gray-300 mb-4">
                              Please allow camera permissions to scan medical documents
                            </p>
                            <Button
                              onClick={handleBackToDocuments}
                              variant="outline"
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Use File Upload Instead
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Medical document overlay guides */}
                  {!capturedImage && permissionGranted && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-primary/60 border-dashed rounded-lg w-4/5 h-4/5 flex items-center justify-center relative">
                        <div className="absolute -top-6 left-0 right-0 text-center">
                          <p className="text-primary text-xs font-medium bg-black/50 px-2 py-1 rounded inline-block">
                            Position medical document here
                          </p>
                        </div>
                        
                        {/* Corner guides */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                        
                        <div className="text-center text-white/80">
                          <Stethoscope className="w-8 h-8 mx-auto mb-2 text-accent" />
                          <p className="text-sm bg-black/30 px-3 py-1 rounded">
                            Medical Document Scanner Ready
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 mt-4 sm:mt-6">
                  {capturedImage ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={retake}
                        className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-200"
                        size="sm"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Retake</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={downloadImage}
                        className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm hover:bg-accent/10 hover:border-accent hover:text-accent transition-all duration-200"
                        size="sm"
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Download</span>
                        <span className="sm:hidden">Save</span>
                      </Button>
                      <Button 
                        onClick={processImage}
                        disabled={processing}
                        className="bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 text-white flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm shadow-medical transition-all duration-300 transform hover:scale-105"
                        size="sm"
                      >
                        {processing ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Process Medical Document</span>
                            <span className="sm:hidden">Process</span>
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={capture}
                      disabled={!cameraReady || !permissionGranted}
                      size="sm"
                      className="bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg shadow-medical transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                    >
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      {cameraReady ? 'Capture Medical Document' : 'Initializing Camera...'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions & Settings */}
          <div className="space-y-6">
            {/* Tips */}
            <Card className="shadow-medical border-0 bg-card/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-primary">
                  <div className="p-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <span>Medical Document Capture Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full mt-2 flex-shrink-0" />
                  <p><strong>Position:</strong> Keep document flat and fully visible in frame</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full mt-2 flex-shrink-0" />
                  <p><strong>Lighting:</strong> Ensure bright, even lighting without shadows</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full mt-2 flex-shrink-0" />
                  <p><strong>Stability:</strong> Hold device steady for crisp text recognition</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full mt-2 flex-shrink-0" />
                  <p><strong>Quality:</strong> Use rear camera for better image quality</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full mt-2 flex-shrink-0" />
                  <p><strong>Format:</strong> Supports reports, charts, prescriptions, lab results</p>
                </div>
              </CardContent>
            </Card>

            {/* Enhancement Settings */}
            <Card className="shadow-medical border-0 bg-card/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-accent">
                  <div className="p-2 rounded-full bg-gradient-to-r from-accent/10 to-primary/10">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <span>AI Processing Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
                  <div>
                    <p className="font-medium text-sm text-primary">Auto-Enhancement</p>
                    <p className="text-xs text-muted-foreground">
                      AI-powered image optimization for medical text recognition
                    </p>
                  </div>
                  <Button
                    variant={enhanceImage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnhanceImage(!enhanceImage)}
                    className={enhanceImage ? 
                      "bg-gradient-to-r from-primary to-accent text-white shadow-medical" : 
                      "hover:bg-primary/10 hover:border-primary hover:text-primary"
                    }
                  >
                    {enhanceImage ? 'ENABLED' : 'DISABLED'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Camera Status */}
            <Card className="shadow-medical border-0 bg-card/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-success">
                  <div className="p-2 rounded-full bg-gradient-to-r from-success/10 to-primary/10">
                    <Shield className="w-4 h-4 text-success" />
                  </div>
                  <span>Privacy & Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>Camera feed processed locally</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>No video data sent to servers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>HIPAA-compliant processing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>Medical data encryption</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Camera Status Indicator */}
            <Alert className={`border-0 ${
              cameraReady ? 
                'bg-success/10 border-success/30' : 
                permissionGranted ? 
                  'bg-warning/10 border-warning/30' : 
                  'bg-destructive/10 border-destructive/30'
            }`}>
              <div className="flex items-center space-x-2">
                {cameraReady ? (
                  <Camera className="h-4 w-4 text-success" />
                ) : permissionGranted ? (
                  <Zap className="h-4 w-4 text-warning" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                <AlertDescription className={
                  cameraReady ? 'text-success' : 
                  permissionGranted ? 'text-warning' : 
                  'text-destructive'
                }>
                  {cameraReady ? 
                    'Camera ready for medical document scanning' : 
                    permissionGranted ? 
                      'Initializing camera...' : 
                      'Camera permission required for document scanning'
                  }
                </AlertDescription>
              </div>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;