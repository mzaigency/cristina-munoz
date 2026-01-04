import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, ImagePlus, RotateCcw } from "lucide-react";
import { MobileStoryEditor } from "./MobileStoryEditor";
import { useNavigation } from "@/contexts/NavigationContext";

interface StoryCreatorFlowProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

export function StoryCreatorFlow({
  isOpen,
  onClose,
  tenantId,
  onSuccess,
}: StoryCreatorFlowProps) {
  const [step, setStep] = useState<"capture" | "edit">("capture");
  const [imageData, setImageData] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setNavigationHidden } = useNavigation();

  // Hide navigation when open
  useEffect(() => {
    setNavigationHidden(isOpen);
  }, [isOpen, setNavigationHidden]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          aspectRatio: { ideal: 9 / 16 },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraReady(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Start/stop camera based on state
  useEffect(() => {
    if (isOpen && step === "capture") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, step, startCamera, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (step === "capture" && isOpen) {
      startCamera();
    }
  }, [facingMode, step, isOpen, startCamera]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep("capture");
      setImageData(null);
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !cameraReady) return;

    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Calculate 9:16 crop
    const targetAspect = 9 / 16;
    const videoAspect = videoWidth / videoHeight;

    let cropWidth: number, cropHeight: number, cropX: number, cropY: number;

    if (videoAspect > targetAspect) {
      cropHeight = videoHeight;
      cropWidth = videoHeight * targetAspect;
      cropX = (videoWidth - cropWidth) / 2;
      cropY = 0;
    } else {
      cropWidth = videoWidth;
      cropHeight = videoWidth / targetAspect;
      cropX = 0;
      cropY = (videoHeight - cropHeight) / 2;
    }

    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip if front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImageData(dataUrl);
    stopCamera();
    setStep("edit");

    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  }, [cameraReady, facingMode, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
    if (navigator.vibrate) navigator.vibrate(15);
  }, []);

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageData(ev.target?.result as string);
        stopCamera();
        setStep("edit");
        if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async (finalImageUrl: string) => {
    // TODO: Upload to Supabase storage and create story record
    console.log("Publishing story...", finalImageUrl.substring(0, 50));
    onSuccess();
  };

  const handleEditorClose = () => {
    setStep("capture");
    setImageData(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Camera Capture Screen */}
      <AnimatePresence>
        {step === "capture" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            {/* Video preview */}
            <div className="relative flex-1 overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />

              {/* Loading state */}
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-white/60 text-center">
                    <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm">Iniciando cámara...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3 z-10">
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center active:scale-90"
              >
                <X size={22} className="text-white" />
              </button>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 pb-[max(env(safe-area-inset-bottom),24px)] pt-6 px-6 z-10">
              <div className="flex items-center justify-between">
                {/* Gallery button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 border border-white/10"
                >
                  <ImagePlus size={24} className="text-white" />
                </button>

                {/* Capture button */}
                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-95 disabled:opacity-50 transition-all"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-black/10" />
                </button>

                {/* Switch camera button */}
                <button
                  onClick={switchCamera}
                  className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 border border-white/10"
                >
                  <RotateCcw size={24} className="text-white" />
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleGallerySelect}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Screen */}
      {step === "edit" && imageData && (
        <MobileStoryEditor
          isOpen={true}
          onClose={handleEditorClose}
          imageData={imageData}
          tenantId={tenantId}
          onPublish={handlePublish}
        />
      )}
    </>
  );
}
