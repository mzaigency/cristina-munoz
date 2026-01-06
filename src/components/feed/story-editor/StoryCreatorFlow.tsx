import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, ImagePlus, RotateCcw, Video, Square } from "lucide-react";
import { StoryEditor } from "./StoryEditor";
import { useNavigation } from "@/contexts/NavigationContext";
import { useHaptic } from "@/hooks/useHaptic";

interface StoryCreatorFlowProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

type CaptureMode = "photo" | "video";

export function StoryCreatorFlow({
  isOpen,
  onClose,
  tenantId,
  onSuccess,
}: StoryCreatorFlowProps) {
  const [step, setStep] = useState<"capture" | "edit">("capture");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("photo");
  const [imageData, setImageData] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const { setNavigationHidden } = useNavigation();
  const haptic = useHaptic();

  const MAX_RECORDING_TIME = 60;

  useEffect(() => {
    setNavigationHidden(isOpen);
  }, [isOpen, setNavigationHidden]);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1080, min: 720 },
          height: { ideal: 1920, min: 1280 },
          aspectRatio: { ideal: 9 / 16 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: captureMode === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraReady(false);
    }
  }, [facingMode, captureMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (isOpen && step === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, step, startCamera, stopCamera]);

  useEffect(() => {
    if (step === "capture" && isOpen) {
      startCamera();
    }
  }, [facingMode, captureMode, step, isOpen, startCamera]);

  useEffect(() => {
    if (!isOpen) {
      setStep("capture");
      setImageData(null);
      setIsRecording(false);
      setRecordingTime(0);
      stopCamera();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }, [isOpen, stopCamera]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !cameraReady) return;

    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

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
    const outputWidth = 1080;
    const outputHeight = 1920;
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setImageData(dataUrl);
    stopCamera();
    setStep("edit");

    haptic.success();
  }, [cameraReady, facingMode, stopCamera, haptic]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
    haptic.light();
  }, [haptic]);

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageData(ev.target?.result as string);
        stopCamera();
        setStep("edit");
        haptic.selection();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStorySuccess = () => {
    onSuccess();
  };

  const handleEditorClose = () => {
    setStep("capture");
    setImageData(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {step === "capture" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            <div className="relative flex-1 overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-auto max-w-none object-cover"
                style={{ 
                  transform: facingMode === "user" ? "scaleX(-1)" : "none",
                  aspectRatio: "9/16",
                }}
              />

              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-white/60 text-center">
                    <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm">Iniciando cámara...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3 z-10">
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center active:scale-90"
              >
                <X size={22} className="text-white" />
              </button>
            </div>

            <div className="absolute top-[max(env(safe-area-inset-top),16px)] left-1/2 -translate-x-1/2 flex items-center bg-black/30 backdrop-blur-md rounded-full p-1 z-10">
              <button
                onClick={() => setCaptureMode("photo")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  captureMode === "photo" ? "bg-white text-black" : "text-white/70"
                }`}
              >
                Foto
              </button>
              <button
                onClick={() => setCaptureMode("video")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  captureMode === "video" ? "bg-white text-black" : "text-white/70"
                }`}
              >
                Video
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 pb-[max(env(safe-area-inset-bottom),24px)] pt-6 px-6 z-10">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 border border-white/10"
                >
                  <ImagePlus size={24} className="text-white" />
                </button>

                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 disabled:opacity-50 bg-white"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-black/10" />
                </button>

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

      {step === "edit" && imageData && (
        <StoryEditor
          isOpen={true}
          onClose={handleEditorClose}
          backgroundImage={imageData}
          tenantId={tenantId}
          onSuccess={handleStorySuccess}
        />
      )}
    </>
  );
}
