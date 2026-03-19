/**
 * DiseaseDetection — upload a crop image and get AI pathology results.
 *
 * Integration flow:
 *   User picks image → preview renders → "Analyze" button calls predictDisease()
 *   → loading state → result (or fallback) populates the result panel
 */

import React, { useState, useRef, useCallback } from "react";
import { predictDisease } from "../services/api";
import ConfidenceBar from "../components/ConfidenceBar";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Drag-and-drop / click upload zone */
function UploadZone({ onFileSelect, preview, disabled }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
        flex flex-col items-center justify-center min-h-[260px] overflow-hidden
        ${isDragging
          ? "border-primary bg-primary/5"
          : "border-outline-variant bg-surface-container-low hover:border-primary/50"
        }
        ${disabled ? "opacity-60 pointer-events-none" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {preview ? (
        <>
          <img
            src={preview}
            alt="Selected crop sample"
            className="w-full h-full object-cover absolute inset-0"
          />
          {/* Overlay badge */}
          <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
            <span className="text-white text-[10px] font-bold uppercase tracking-widest">
              Tap to change
            </span>
          </div>
        </>
      ) : (
        <div className="text-center px-8 py-12">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-emerald-700">
              add_photo_alternate
            </span>
          </div>
          <p className="font-bold text-emerald-900 mb-1">Drop your image here</p>
          <p className="text-sm text-on-surface-variant">
            or <span className="text-emerald-700 font-semibold">browse</span> to upload
          </p>
          <p className="text-xs text-on-surface-variant mt-3 opacity-70">
            JPG, PNG, WEBP · max 20 MB
          </p>
        </div>
      )}
    </div>
  );
}

/** Skeleton placeholder while results are loading */
function ResultSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[100, 70, 85, 60].map((w, i) => (
        <div
          key={i}
          className="h-4 bg-surface-container-high rounded-full"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

/** Full result panel once analysis is complete */
function ResultPanel({ result, originalPreview }) {
  const hasBothImages = originalPreview && result.heatmap_full_url;

  return (
    <div className="space-y-6">
      {/* Disease + confidence */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Identification Result
            </p>
            <h3 className="text-2xl font-black text-emerald-900 tracking-tight leading-tight">
              {result.disease}
            </h3>
          </div>
          {result._isFallback && (
            <span className="shrink-0 px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-full tracking-widest">
              Demo data
            </span>
          )}
        </div>
        <ConfidenceBar value={result.confidence} label="Diagnostic Confidence" />
      </div>

      {/* Side-by-side image comparison */}
      {hasBothImages && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
              Original Sample
            </p>
            <div className="rounded-xl overflow-hidden aspect-square bg-surface-container-high">
              <img
                src={originalPreview}
                alt="Original crop sample"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
              Pathogen Heatmap
            </p>
            <div className="rounded-xl overflow-hidden aspect-square bg-surface-container-high">
              <img
                src={result.heatmap_full_url}
                alt="AI pathogen heatmap"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Treatment protocols */}
      {result.treatment?.length > 0 && (
        <div className="bg-surface-container-low rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-emerald-700 text-lg">
              medical_services
            </span>
            <h4 className="font-bold text-emerald-900 text-sm uppercase tracking-wider">
              Treatment Protocols
            </h4>
          </div>
          <ul className="space-y-2.5">
            {result.treatment.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                <span className="w-5 h-5 rounded-full bg-primary-container text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * @param {{ toast: { success, error, info } }} props
 */
export default function DiseaseDetection({ toast }) {
  const [selectedFile, setSelectedFile]   = useState(null);
  const [preview, setPreview]             = useState(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [result, setResult]               = useState(null);
  const [hasAnalyzed, setHasAnalyzed]     = useState(false);

  // Handle file selection from the upload zone
  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    setResult(null);
    setHasAnalyzed(false);

    // Create an object URL for immediate preview (revoke previous one)
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  // Trigger AI analysis
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const data = await predictDisease(selectedFile);
      setResult(data);
      setHasAnalyzed(true);

      if (data._isFallback) {
        toast?.error("Backend unavailable — showing demo results.");
      } else {
        toast?.success(`Disease identified: ${data.disease}`);
      }
    } catch (err) {
      // This branch only fires if predictDisease re-throws (useFallback=false)
      toast?.error("Analysis failed. Please try again.");
      console.error("[DiseaseDetection] Unhandled error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, isLoading, toast]);

  // Reset everything
  const handleReset = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setResult(null);
    setHasAnalyzed(false);
  }, [preview]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-20">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-emerald-900 tracking-tighter mb-2">
          Leaf Pathogen Analysis
        </h1>
        <p className="text-on-surface-variant text-lg">
          Upload a crop image for instant AI-powered disease identification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: upload panel ── */}
        <div className="space-y-5">
          <UploadZone
            onFileSelect={handleFileSelect}
            preview={preview}
            disabled={isLoading}
          />

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || isLoading}
              className={`
                flex-1 flex items-center justify-center gap-3 px-6 py-4
                font-headline font-bold rounded-xl transition-all duration-300
                ${selectedFile && !isLoading
                  ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                  : "bg-surface-container text-on-surface-variant cursor-not-allowed"
                }
              `}
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing with AI…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">biotech</span>
                  Analyze Sample
                </>
              )}
            </button>

            {(preview || hasAnalyzed) && (
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="px-5 py-4 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-semibold"
                aria-label="Reset"
              >
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Right: results panel ── */}
        <div className="bg-surface-container-lowest rounded-xl p-7 shadow-[0_40px_40px_-15px_rgba(23,68,19,0.05)] min-h-[300px] flex flex-col justify-center">
          {isLoading && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-6">
                Analyzing with AI…
              </p>
              <ResultSkeleton />
            </div>
          )}

          {!isLoading && result && (
            <ResultPanel result={result} originalPreview={preview} />
          )}

          {!isLoading && !result && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-outline-variant block mb-3">
                center_focus_weak
              </span>
              <p className="text-on-surface-variant font-medium">
                {selectedFile
                  ? "Ready — click Analyze Sample"
                  : "Upload an image to begin"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
