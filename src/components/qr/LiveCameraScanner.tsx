import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Zap, ZapOff, Upload, AlertCircle, CheckCircle2, VideoOff } from 'lucide-react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LiveCameraScannerProps {
  onScan: (decodedText: string) => void;
  autoStopOnScan?: boolean;
}

export function LiveCameraScanner({ onScan, autoStopOnScan = true }: LiveCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          const raw = code.data.trim();
          setLastScanned(raw);
          onScan(raw);
          if (autoStopOnScan) {
            stopCamera();
            return;
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [onScan, autoStopOnScan, stopCamera]);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopCamera();
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setErrorMessage('Your browser does not support camera access. Please use the file upload option or enter the Pet ID manually.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);
      setIsScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Auto play error:', playErr);
        }
        animFrameRef.current = requestAnimationFrame(scanFrame);
      }

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        setTorchAvailable(Boolean(capabilities?.torch));
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera found on this device. You can upload a photo of the QR code instead.');
      } else {
        setErrorMessage('Unable to initialize camera video stream: ' + (err.message || 'Unknown error'));
      }
    }
  }, [scanFrame, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current || !torchAvailable) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextTorch = !torchOn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchOn(nextTorch);
      } catch (e) {
        console.warn('Could not toggle torch:', e);
      }
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) {
            setLastScanned(code.data);
            onScan(code.data);
          } else {
            setErrorMessage('No valid QR code detected in the uploaded image. Please try another photo or enter the Pet ID manually.');
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      {/* Hidden canvas for decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder Card */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-black/95 text-white">
        <CardContent className="p-0 relative">
          <div className="relative aspect-[4/3] w-full flex items-center justify-center bg-zinc-950 overflow-hidden">
            {/* Always mounted video element ensures videoRef.current is ready before stream attachment */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
              autoPlay
              muted
              playsInline
            />

            {isScanning ? (
              <>
                {/* Live Camera Badge */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-green-500/40 text-[11px] text-green-400 font-medium shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>LIVE CAMERA FEED</span>
                </div>

                {/* Target Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="relative w-56 h-56 border-2 border-primary/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                    {/* Corner Reticles */}
                    <span className="absolute -top-1.5 -left-1.5 w-7 h-7 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <span className="absolute -top-1.5 -right-1.5 w-7 h-7 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <span className="absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-4 border-r-4 border-primary rounded-br-lg" />
                    {/* Animated Scanning Laser */}
                    <div className="absolute inset-x-2 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-xs font-medium text-white/95 bg-black/70 px-3.5 py-1 rounded-full backdrop-blur-sm shadow border border-white/10">
                    Align pet collar QR tag inside the frame
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="h-14 w-14 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
                  <Camera className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">Camera Viewfinder Ready</p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                    Activate camera to scan pet collar tag in real-time, or upload an image.
                  </p>
                </div>
                <Button
                  onClick={() => startCamera(facingMode)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-md"
                >
                  <Camera className="h-4 w-4 mr-2" /> Start Camera Scan
                </Button>
              </div>
            )}
          </div>

          {/* Scanner Controls Bar */}
          {isScanning && (
            <div className="flex items-center justify-between p-3 bg-zinc-900 border-t border-zinc-800 text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={switchCamera}
                className="text-zinc-200 hover:text-white hover:bg-zinc-800"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Flip ({facingMode === 'environment' ? 'Rear' : 'Front'})
              </Button>

              {torchAvailable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTorch}
                  className={`text-zinc-200 hover:text-white hover:bg-zinc-800 ${torchOn ? 'text-yellow-400 font-bold' : ''}`}
                >
                  {torchOn ? <Zap className="h-4 w-4 mr-1.5 text-yellow-400" /> : <ZapOff className="h-4 w-4 mr-1.5" />}
                  {torchOn ? 'Torch On' : 'Torch Off'}
                </Button>
              )}

              <Button
                variant="destructive"
                size="sm"
                onClick={stopCamera}
                className="h-8"
              >
                <VideoOff className="h-4 w-4 mr-1.5" /> Stop
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Notice */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Camera Notice</p>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Fallback Image Picker & Quick Test Simulator */}
      <div className="flex flex-col gap-2 pt-1">
        <label className="w-full cursor-pointer">
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors shadow-sm">
            <Upload className="h-4 w-4 text-primary" />
            <span>Upload QR Code Photo</span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        {/* Quick Collar Tag Simulation Chips */}
        <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs">
          <p className="font-medium text-muted-foreground mb-2 flex items-center justify-between">
            <span>Test with Registered Pet Collar Tag:</span>
            <span className="text-[10px] text-muted-foreground">One-click scan test</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'PET001', name: 'Bantay (Dog)' },
              { id: 'PET002', name: 'Muning (Cat)' },
              { id: 'PET003', name: 'Rocky (Dog)' },
              { id: 'PET005', name: 'Brownie (Dog)' },
              { id: 'PET010', name: 'Bruno (Dog)' },
            ].map(sample => (
              <Button
                key={sample.id}
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background hover:bg-primary/10 hover:border-primary/50 text-primary font-medium"
                onClick={() => {
                  setLastScanned(sample.id);
                  onScan(sample.id);
                  if (autoStopOnScan) stopCamera();
                }}
              >
                🏷️ {sample.id} · {sample.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {lastScanned && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-900 rounded-lg text-xs">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">QR Code Recognized:</p>
            <p className="font-mono truncate">{lastScanned}</p>
          </div>
        </div>
      )}
    </div>
  );
}
