import React, { useCallback, useState } from 'react';

export default function ImageDropzone({ onFileSelected, preview, disabled }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a JPG or PNG image.');
      return;
    }
    onFileSelected(file);
  }, [onFileSelected]);

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <label
      htmlFor="leaf-upload"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        display: 'block',
        border: `2px dashed ${dragging ? 'var(--green-600)' : 'var(--green-300, #6abf8a)'}`,
        borderRadius: 'var(--radius-lg)',
        background: dragging ? 'var(--green-50)' : 'var(--gray-50)',
        padding: preview ? '0' : 'var(--space-12) var(--space-8)',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        overflow: 'hidden',
        minHeight: 200,
        position: 'relative',
      }}
    >
      <input
        id="leaf-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={onInputChange}
        disabled={disabled}
      />

      {preview ? (
        <div style={{ position: 'relative' }}>
          <img
            src={preview}
            alt="Leaf preview"
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }}
          />
          {!disabled && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
            >
              <span style={{ color: 'white', fontWeight: 600, opacity: 0, transition: 'opacity 0.2s',
                padding: '8px 20px', background: 'rgba(0,0,0,0.5)', borderRadius: 30 }}
                className="change-label">
                Click to change image
              </span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 48 }}>🌿</div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--green-800)', fontSize: '1rem' }}>
              Drop a leaf image here
            </p>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginTop: 4 }}>
              or click to browse · JPG, PNG, WEBP
            </p>
          </div>
        </div>
      )}
    </label>
  );
}
