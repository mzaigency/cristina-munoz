import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, ImagePlus, RotateCcw, Video, Square } from "lucide-react";
import { MobileStoryEditor } from "./MobileStoryEditor";
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
  const [videoData, setVideoData] = useState<string | null>(null);
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

  const MAX_RECORDING_TIME = 60; // 60 seconds max

  // Hide navigation when open
  useEffect(() => {
    setNavigationHidden(isOpen);
  }, [isOpen, setNavigationHidden]);

  // Start camera with optimized 9:16 resolution
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request high resolution 9:16 video
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1080, min: 720 },
          height: { ideal: 1920, min: 1280 },
          aspectRatio: { ideal: 9 / 16 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: captureMode === "video", // Enable audio for video mode
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to load
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

  // Start/stop camera based on state
  useEffect(() => {
    if (isOpen && step === "capture") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, step, startCamera, stopCamera]);

  // Restart camera when facing mode or capture mode changes
  useEffect(() => {
    if (step === "capture" && isOpen) {
      startCamera();
    }
  }, [facingMode, captureMode, step, isOpen, startCamera]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep("capture");
      setImageData(null);
      setVideoData(null);
      setIsRecording(false);
      setRecordingTime(0);
      stopCamera();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }, [isOpen, stopCamera]);

  // Cleanup recording timer
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

    // Create high-resolution canvas (1080x1920)
    const canvas = document.createElement("canvas");
    const outputWidth = 1080;
    const outputHeight = 1920;
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Flip if front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Draw and scale to output resolution
    ctx.drawImage(
      video, 
      cropX, cropY, cropWidth, cropHeight, 
      0, 0, outputWidth, outputHeight
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setImageData(dataUrl);
    stopCamera();
    setStep("edit");

    haptic.success();
  }, [cameraReady, facingMode, stopCamera, haptic]);

  const startRecording = useCallback(() => {
    if (!streamRef.current || !cameraReady) return;

    chunksRef.current = [];

    // Determine supported MIME type
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];

    let selectedMimeType = "";
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    if (!selectedMimeType) {
      console.error("No supported video MIME type found");
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps for high quality
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        const videoUrl = URL.createObjectURL(blob);
        setVideoData(videoUrl);
        stopCamera();
        setStep("edit");
        
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingTime(0);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Start recording timer
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      haptic.medium();
    } catch (err) {
      console.error("Recording error:", err);
    }
  }, [cameraReady, stopCamera, haptic]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      haptic.success();
    }
  }, [haptic]);

  const handleCaptureOrRecord = useCallback(() => {
    if (captureMode === "photo") {
      capturePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  }, [captureMode, isRecording, capturePhoto, startRecording, stopRecording]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
    haptic.light();
  }, [haptic]);

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith("video/");
      
      if (isVideo) {
        const videoUrl = URL.createObjectURL(file);
        setVideoData(videoUrl);
        stopCamera();
        setStep("edit");
        haptic.selection();
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImageData(ev.target?.result as string);
          stopCamera();
          setStep("edit");
          haptic.selection();
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleStorySuccess = () => {
    if (videoData) {
      URL.revokeObjectURL(videoData);
    }
    onSuccess();
  };

  const handleEditorClose = () => {
    if (videoData) {
      URL.revokeObjectURL(videoData);
    }
    setStep("capture");
    setImageData(null);
    setVideoData(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
            {/* Video preview - full 9:16 aspect ratio */}
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

              {/* Loading state */}
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-white/60 text-center">
                    <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm">Iniciando cámara...</p>
                  </div>
                </div>
              )}

              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500/80 backdrop-blur-sm px-4 py-2 rounded-full">
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  <span className="text-white font-medium text-sm">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}

              {/* Recording progress bar */}
              {isRecording && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
                  <motion.div
                    className="h-full bg-red-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3 z-10">
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center active:scale-90"
                disabled={isRecording}
              >
                <X size={22} className="text-white" />
              </button>
            </div>

            {/* Mode selector */}
            <div className="absolute top-[max(env(safe-area-inset-top),16px)] left-1/2 -translate-x-1/2 flex items-center bg-black/30 backdrop-blur-md rounded-full p-1 z-10">
              <button
                onClick={() => setCaptureMode("photo")}
                disabled={isRecording}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  captureMode === "photo"
                    ? "bg-white text-black"
                    : "text-white/70"
                }`}
              >
                Foto
              </button>
              <button
                onClick={() => setCaptureMode("video")}
                disabled={isRecording}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  captureMode === "video"
                    ? "bg-white text-black"
                    : "text-white/70"
                }`}
              >
                Video
              </button>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 pb-[max(env(safe-area-inset-bottom),24px)] pt-6 px-6 z-10">
              <div className="flex items-center justify-between">
                {/* Gallery button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecording}
                  className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 border border-white/10 disabled:opacity-50"
                >
                  <ImagePlus size={24} className="text-white" />
                </button>

                {/* Capture/Record button */}
                <button
                  onClick={handleCaptureOrRecord}
                  disabled={!cameraReady}
                  className={`w-20 h-20 rounded-full flex items-center justify-center active:scale-95 disabled:opacity-50 transition-all ${
                    captureMode === "video" && isRecording
                      ? "bg-red-500"
                      : "bg-white"
                  }`}
                >
                  {captureMode === "photo" ? (
                    <div className="w-16 h-16 rounded-full border-4 border-black/10" />
                  ) : isRecording ? (
                    <Square size={28} className="text-white" fill="white" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                      <Video size={28} className="text-white" />
                    </div>
                  )}
                </button>

                {/* Switch camera button */}
                <button
                  onClick={switchCamera}
                  disabled={isRecording}
                  className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 border border-white/10 disabled:opacity-50"
                >
                  <RotateCcw size={24} className="text-white" />
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleGallerySelect}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Screen */}
      {step === "edit" && (imageData || videoData) && (
        <MobileStoryEditor
          isOpen={true}
          onClose={handleEditorClose}
          imageData={imageData || undefined}
          videoData={videoData || undefined}
          tenantId={tenantId}
          onSuccess={handleStorySuccess}
        />
      )}
    </>
  );
}