import React, { useState, useRef } from 'react';
import { Upload, Trash2, Image, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const NILE  = '#1C3741';
const PEARL = '#FFF7E6';

export default function SystemSettings() {
  const [logoUrl,   setLogoUrl]   = useState(localStorage.getItem('fact_logo_url') || '');
  const [dragging,  setDragging]  = useState(false);
  const fileRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      localStorage.setItem('fact_logo_url', dataUrl);
      setLogoUrl(dataUrl);
      toast.success('Logo saved successfully.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const removeLogo = () => {
    localStorage.removeItem('fact_logo_url');
    setLogoUrl('');
    toast.success('Logo removed.');
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Open Sans', sans-serif" }}>
          System Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1" style={{ fontFamily: "'Open Sans', sans-serif" }}>
          Configure branding and application-wide settings
        </p>
      </div>

      {/* Logo section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold" style={{ color: NILE, fontFamily: "'Open Sans', sans-serif" }}>
            Application Logo
          </h2>
          <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            Displayed on the login page. Recommended: PNG or SVG, transparent background, max 2 MB.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Current logo preview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              Current Logo
            </p>
            <div style={{
              width: '100%', height: 140, borderRadius: 12,
              background: NILE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(28,55,65,0.1)',
            }}>
              {logoUrl ? (
                <img
                  src={logoUrl} alt="Company Logo"
                  style={{ maxWidth: 200, maxHeight: 100, objectFit: 'contain' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'rgba(255,247,230,0.3)' }}>
                  <Image size={32} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12, fontFamily: "'Open Sans', sans-serif" }}>No logo uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload area */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              Upload New Logo
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragging ? NILE : 'rgba(28,55,65,0.2)'}`,
                borderRadius: 12, padding: '2rem 1.5rem',
                textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(28,55,65,0.04)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Upload size={24} style={{ color: 'rgba(28,55,65,0.3)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: NILE, fontFamily: "'Open Sans', sans-serif", margin: '0 0 4px' }}>
                Click to upload or drag & drop
              </p>
              <p style={{ fontSize: 11, color: 'rgba(28,55,65,0.4)', fontFamily: "'Open Sans', sans-serif", margin: 0 }}>
                PNG, JPG, SVG, WebP · Max 2 MB
              </p>
              <input
                ref={fileRef} type="file" accept="image/*"
                onChange={handleFileChange} style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '0.6rem 1.2rem', borderRadius: 8,
                background: NILE, color: PEARL, border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              <Upload size={14} /> Upload Logo
            </button>

            {logoUrl && (
              <button
                onClick={removeLogo}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0.6rem 1.2rem', borderRadius: 8,
                  background: 'transparent', color: '#ef4444',
                  border: '1.5px solid #fca5a5',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Open Sans', sans-serif",
                }}
              >
                <Trash2 size={14} /> Remove Logo
              </button>
            )}
          </div>

          {logoUrl && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0.6rem 0.9rem', borderRadius: 8,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
            }}>
              <CheckCircle2 size={14} color="#16a34a" />
              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, fontFamily: "'Open Sans', sans-serif" }}>
                Logo active — will appear on the login page
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
