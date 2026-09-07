import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Camera,
  X,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Occasion, StyleVibe } from '../types';
import { OCCASIONS, STYLE_VIBES, SAMPLE_OUTFITS, SampleOutfit } from '../data/sampleOutfits';
import { fileToBase64, urlToBase64 } from '../utils/imageUtils';

interface UploadScreenProps {
  onAnalyze: (payload: { image: string; mimeType: string; occasion: Occasion; styleVibe: StyleVibe }) => void;
  initialSample?: SampleOutfit | null;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onAnalyze, initialSample }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(initialSample?.imageUrl || null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [occasion, setOccasion] = useState<Occasion>(initialSample?.occasion || 'Casual');
  const [styleVibe, setStyleVibe] = useState<StyleVibe>(initialSample?.styleVibe || 'Minimal');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Initialize sample if passed
  React.useEffect(() => {
    if (initialSample) {
      setSelectedImage(initialSample.imageUrl);
      setOccasion(initialSample.occasion);
      setStyleVibe(initialSample.styleVibe);
      loadUrlAsBase64(initialSample.imageUrl);
    }
  }, [initialSample]);

  const loadUrlAsBase64 = async (url: string) => {
    setIsProcessingFile(true);
    setErrorMsg(null);
    try {
      const res = await urlToBase64(url);
      setBase64Data(res.base64);
      setMimeType(res.mimeType);
    } catch (err: any) {
      console.error('Failed to convert sample image:', err);
      // Even if cross-origin canvas fails, keep image URL; server can also handle direct or standard fallback
      setErrorMsg('Could not process sample image. Please upload a local file directly.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 20MB. Please choose a smaller photo.');
      return;
    }

    setErrorMsg(null);
    setIsProcessingFile(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      setSelectedImage(objectUrl);
      const res = await fileToBase64(file);
      setBase64Data(res.base64);
      setMimeType(res.mimeType);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg('Failed to process image. Please try another file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setBase64Data(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSelectSample = (sample: SampleOutfit) => {
    setSelectedImage(sample.imageUrl);
    setOccasion(sample.occasion);
    setStyleVibe(sample.styleVibe);
    loadUrlAsBase64(sample.imageUrl);
  };

  const handleSubmit = () => {
    if (!selectedImage || !base64Data) {
      setErrorMsg('Please upload an outfit photo first.');
      return;
    }

    onAnalyze({
      image: base64Data,
      mimeType,
      occasion,
      styleVibe,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Title & Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="font-editorial text-3xl sm:text-5xl font-bold text-neutral-900 tracking-tight mb-3">
          Configure Your Fit Check
        </h2>
        <p className="text-sm sm:text-base text-neutral-600">
          Upload an outfit photo, select the setting, and choose the aesthetic vibe for your AI stylist critique.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <p className="flex-1">{errorMsg}</p>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-800 text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
        {/* Left: Image Upload Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <span>Outfit Photograph</span>
              <span className="text-red-500">*</span>
            </label>
            {selectedImage && (
              <button
                id="btn-remove-image"
                onClick={handleRemoveImage}
                className="text-xs text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 font-medium transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Upload Dropzone / Image Preview */}
          <div
            id="outfit-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative rounded-2xl overflow-hidden transition duration-200 border-2 ${
              isDragging
                ? 'border-neutral-900 bg-neutral-100/80 scale-[1.01]'
                : selectedImage
                ? 'border-neutral-200 bg-neutral-950'
                : 'border-dashed border-neutral-300 hover:border-neutral-400 bg-white'
            } aspect-[3/4] flex flex-col items-center justify-center text-center p-6 shadow-xs`}
          >
            {selectedImage ? (
              <div className="relative w-full h-full group">
                <img
                  src={selectedImage}
                  alt="Outfit Preview"
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center gap-3 p-4 rounded-xl">
                  <button
                    id="btn-change-image"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-full bg-white text-neutral-900 text-xs font-semibold shadow-md hover:bg-neutral-100 transition"
                  >
                    Change Image
                  </button>
                  <button
                    id="btn-delete-image"
                    onClick={handleRemoveImage}
                    className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-semibold shadow-md hover:bg-red-700 transition"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 h-full">
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center mb-4 shadow-2xs">
                  <UploadCloud className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className="font-editorial text-2xl font-bold text-neutral-900 mb-1">
                  Upload your fit
                </h4>
                <p className="text-xs text-neutral-500 max-w-[220px] mb-6 leading-relaxed">
                  Drag and drop your outfit photo, or select from your device. Full-body or waist-up.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
                  <button
                    id="btn-browse-files"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Browse Photos</span>
                  </button>

                  <button
                    id="btn-camera-capture"
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-semibold hover:bg-neutral-200 transition border border-neutral-200"
                    title="Take photo with camera"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>
                </div>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Quick Sample Selector */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Or pick a sample outfit:
              </span>
              <span className="text-[10px] text-neutral-400">1-click test</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_OUTFITS.map((sample) => (
                <button
                  key={sample.id}
                  id={`quick-sample-${sample.id}`}
                  onClick={() => handleSelectSample(sample)}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden border transition group ${
                    selectedImage === sample.imageUrl
                      ? 'ring-2 ring-neutral-900 border-transparent'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <img
                    src={sample.imageUrl}
                    alt={sample.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-1">
                    <span className="text-[9px] font-medium text-white truncate w-full text-left">
                      {sample.styleVibe}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selectors & CTA (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-8 bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
          {/* Occasion Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                1. Select Occasion
              </label>
              <span className="text-xs text-neutral-500 font-medium">
                Current: <strong className="text-neutral-900">{occasion}</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {OCCASIONS.map((occ) => {
                const isActive = occasion === occ.id;
                return (
                  <button
                    key={occ.id}
                    id={`occasion-${occ.id}`}
                    type="button"
                    onClick={() => setOccasion(occ.id)}
                    className={`py-3 px-3.5 rounded-xl text-left transition flex flex-col justify-between border ${
                      isActive
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                        : 'bg-neutral-50/70 hover:bg-neutral-100 text-neutral-800 border-neutral-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold">{occ.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span
                      className={`text-[10px] leading-tight ${
                        isActive ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {occ.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style / Vibe Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                2. Select Style / Vibe
              </label>
              <span className="text-xs text-neutral-500 font-medium">
                Current: <strong className="text-neutral-900">{styleVibe}</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STYLE_VIBES.map((vibe) => {
                const isActive = styleVibe === vibe.id;
                return (
                  <button
                    key={vibe.id}
                    id={`vibe-${vibe.id}`}
                    type="button"
                    onClick={() => setStyleVibe(vibe.id)}
                    className={`py-3 px-3.5 rounded-xl text-left transition flex flex-col justify-between border ${
                      isActive
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                        : 'bg-neutral-50/70 hover:bg-neutral-100 text-neutral-800 border-neutral-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold">{vibe.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span
                      className={`text-[10px] leading-tight line-clamp-2 ${
                        isActive ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {vibe.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selection Summary Pill */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
                Stylist Target Calibration
              </p>
              <p className="text-sm font-semibold text-neutral-900 mt-0.5">
                {occasion} &bull; {styleVibe} Aesthetic
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="btn-analyze-my-fit"
            type="button"
            disabled={!selectedImage || isProcessingFile}
            onClick={handleSubmit}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-2.5 transition duration-200 shadow-md ${
              !selectedImage || isProcessingFile
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-950 hover:bg-neutral-800 text-white hover:shadow-lg active:scale-[0.99]'
            }`}
          >
            {isProcessingFile ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Processing Image...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Analyze My Fit</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {!selectedImage && (
            <p className="text-xs text-neutral-400 text-center -mt-4">
              * Please upload an outfit photo or pick a sample look above to begin analysis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
