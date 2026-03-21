import React, { useState, useCallback } from 'react';
import ImageDropzone  from '../components/ImageDropzone';
import DiseaseResult  from '../components/DiseaseResult';
import LoadingSpinner from '../components/LoadingSpinner';
import { predictDisease, getRemedy, DEMO_DISEASE, DEMO_REMEDY } from '../services/api';

export default function Detection() {
  const [file,          setFile]          = useState(null);
  const [preview,       setPreview]       = useState(null);
  const [detection,     setDetection]     = useState(null);
  const [remedy,        setRemedy]        = useState(null);
  const [detecting,     setDetecting]     = useState(false);
  const [remedyLoading, setRemedyLoading] = useState(false);
  const [error,         setError]         = useState(null);

  const handleFileSelected = useCallback((selectedFile) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setDetection(null);
    setRemedy(null);
    setError(null);
  }, []);

  const handleAnalyse = async () => {
    if (!file) return;
    setDetecting(true);
    setError(null);
    setDetection(null);
    setRemedy(null);

    let result;
    try {
      result = await predictDisease(file);
    } catch {
      // Graceful fallback to demo data
      result = DEMO_DISEASE;
      setError('⚠️  Backend unreachable — showing demo result.');
    }
    setDetection(result);
    setDetecting(false);

    // Fetch remedy immediately after detection
    setRemedyLoading(true);
    try {
      const conf = typeof result.confidence === 'number'
        ? `${Math.round(result.confidence * 100)}%`
        : result.confidence;
      const remedyData = await getRemedy(result.disease, conf);
      setRemedy(remedyData);
    } catch {
      setRemedy(DEMO_REMEDY);
    } finally {
      setRemedyLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setDetection(null);
    setRemedy(null);
    setError(null);
  };

  return (
    <div style={{ padding: 'var(--space-12) var(--space-6)' }}>
      <div className="container" style={{ maxWidth: 900 }}>

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div className="badge badge-green" style={{ marginBottom: 'var(--space-3)' }}>Disease Detection</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--green-900)', marginBottom: 'var(--space-3)' }}>
            Crop Disease Detector
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '1rem', maxWidth: 560 }}>
            Upload a clear photo of an infected leaf. Our AI model will identify the disease and suggest a treatment plan.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>

          {/* Left: Upload panel */}
          <div>
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: 'var(--space-4)' }}>
                Upload Leaf Image
              </h2>
              <ImageDropzone
                onFileSelected={handleFileSelected}
                preview={preview}
                disabled={detecting}
              />

              {file && (
                <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={handleAnalyse}
                    disabled={detecting}
                  >
                    {detecting ? (
                      <>
                        <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                        Analysing…
                      </>
                    ) : (
                      '🔬 Analyse Disease'
                    )}
                  </button>
                  <button className="btn btn-outline" onClick={handleReset} disabled={detecting}>
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Tips */}
            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)', background: 'var(--amber-100)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--amber-400)' }}>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--amber-600)', marginBottom: 4 }}>📸 Tips for best results</p>
              <ul style={{ fontSize: '0.83rem', color: 'var(--gray-700)', paddingLeft: 16, lineHeight: 1.8 }}>
                <li>Good lighting — avoid shadows</li>
                <li>Fill the frame with the leaf</li>
                <li>Capture both healthy and infected areas</li>
              </ul>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {error && (
              <div style={{ padding: 'var(--space-4)', background: 'var(--amber-100)', border: '1px solid var(--amber-400)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: '0.88rem', color: 'var(--amber-600)' }}>
                {error}
              </div>
            )}

            {detecting && (
              <div className="card">
                <LoadingSpinner text="Running disease model…" />
              </div>
            )}

            {!detecting && !detection && !file && (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-8)', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🍃</div>
                <p style={{ fontWeight: 500 }}>Upload a leaf image to get started</p>
                <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Results will appear here</p>
              </div>
            )}

            {!detecting && !detection && file && (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-8)', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👆</div>
                <p style={{ fontWeight: 500 }}>Click "Analyse Disease" to run the model</p>
              </div>
            )}

            {!detecting && detection && (
              <DiseaseResult
                detection={detection}
                remedy={remedy}
                remedyLoading={remedyLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
