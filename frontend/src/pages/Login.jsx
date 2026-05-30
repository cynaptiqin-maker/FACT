import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import {
  Eye, EyeOff, Lock, User, Building2,
  Fingerprint, Phone, ArrowLeft, Loader2, KeyRound,
} from 'lucide-react';
import toast from 'react-hot-toast';

const NILE  = '#1C3741';
const PEARL = '#FFF7E6';

const FP_MOBILE = 'mobile';
const FP_OTP    = 'otp';
const FP_RESET  = 'reset';

/* ── shared styles ─────────────────────────────────────────────────────────── */
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.75rem 1rem',
  fontSize: 14, fontFamily: "'Open Sans', sans-serif",
  border: '1.5px solid rgba(28,55,65,0.15)', borderRadius: 10,
  color: NILE, background: 'rgba(28,55,65,0.03)', outline: 'none',
};

const primaryBtn = {
  background: NILE, color: PEARL, border: 'none', borderRadius: 10,
  padding: '0.8rem 1rem', fontSize: 14, fontWeight: 700,
  fontFamily: "'Open Sans', sans-serif", cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, width: '100%',
};

const outlineBtn = {
  border: '1.5px solid rgba(28,55,65,0.15)', background: 'transparent',
  borderRadius: 10, padding: '0.75rem 1rem',
  fontSize: 13, fontWeight: 600, color: NILE,
  fontFamily: "'Open Sans', sans-serif", cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, width: '100%',
};

function Field({ icon, label, children }) {
  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 700, color: 'rgba(28,55,65,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: 6, fontFamily: "'Open Sans', sans-serif",
      }}>
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

/* ── Left logo panel ───────────────────────────────────────────────────────── */
function LogoPanel() {
  const logoUrl = localStorage.getItem('fact_logo_url') || '';
  return (
    <div style={{
      width: '50%', background: NILE, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {logoUrl ? (
        <img
          src={logoUrl} alt="Company Logo"
          style={{ maxWidth: 240, maxHeight: 180, objectFit: 'contain' }}
        />
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 88, height: 88, borderRadius: 20,
            background: 'rgba(255,247,230,0.1)',
            border: '2px dashed rgba(255,247,230,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: PEARL, fontFamily: "'Open Sans', sans-serif" }}>F</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: PEARL, fontWeight: 700, fontSize: 16, margin: 0, fontFamily: "'Open Sans', sans-serif" }}>FACT FinOS</p>
            <p style={{ color: 'rgba(255,247,230,0.35)', fontSize: 11, margin: '4px 0 0', fontFamily: "'Open Sans', sans-serif" }}>
              Finance Accounting with Complete Transparency
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  const from = location.state?.from?.pathname || '/';

  /* login state */
  const [username, setUsername] = useState('');
  const [company,  setCompany]  = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  /* forgot password state */
  const [fpMode,    setFpMode]    = useState(false);
  const [fpStep,    setFpStep]    = useState(FP_MOBILE);
  const [mobile,    setMobile]    = useState('');
  const [otp,       setOtp]       = useState('');
  const [newPwd,    setNewPwd]    = useState('');
  const [newPwd2,   setNewPwd2]   = useState('');
  const [showNP,    setShowNP]    = useState(false);
  const [showNP2,   setShowNP2]   = useState(false);
  const [fpLoading, setFpLoading] = useState(false);

  /* ── handlers ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !company || !password) {
      toast.error('Please fill in all fields.'); return;
    }
    try {
      await login({ email: username, password, tenantId: '00000000-0000-0000-0000-000000000001' });
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Invalid credentials.');
    }
  };

  const handlePasskey = async () => {
    if (!window.PublicKeyCredential) {
      toast.error('Passkey not supported on this device.'); return;
    }
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: window.location.hostname,
          userVerification: 'required',
          timeout: 60000,
        },
      });
      if (credential) {
        toast.success('Passkey verified — signing in…');
        navigate(from, { replace: true });
      }
    } catch (err) {
      if (err.name !== 'NotAllowedError') toast.error('Passkey authentication failed.');
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!mobile || mobile.replace(/\D/g, '').length < 10) {
      toast.error('Enter a valid 10-digit mobile number.'); return;
    }
    setFpLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setFpLoading(false);
    toast.success(`OTP sent to ${mobile}`);
    setFpStep(FP_OTP);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error('Enter the 6-digit OTP.'); return; }
    setFpLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setFpLoading(false);
    setFpStep(FP_RESET);
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (newPwd !== newPwd2) { toast.error('Passwords do not match.'); return; }
    setFpLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setFpLoading(false);
    toast.success('Password reset successfully. Please sign in.');
    resetFp();
  };

  const resetFp = () => {
    setFpMode(false); setFpStep(FP_MOBILE);
    setMobile(''); setOtp(''); setNewPwd(''); setNewPwd2('');
  };

  /* ── render ── */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Open Sans', sans-serif" }}>

      {/* LEFT — logo */}
      <LogoPanel />

      {/* RIGHT — form */}
      <div style={{
        width: '50%', background: PEARL,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2.5rem 2rem',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {!fpMode ? (
            /* ══ SIGN IN ══ */
            <>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: NILE, margin: '0 0 6px', fontFamily: "'Open Sans', sans-serif" }}>
                Sign In
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(28,55,65,0.45)', margin: '0 0 32px', fontFamily: "'Open Sans', sans-serif" }}>
                Access your financial operating system
              </p>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Field icon={<User size={14} color="rgba(28,55,65,0.5)" />} label="Username">
                  <input
                    value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username" autoComplete="username" style={inputStyle}
                  />
                </Field>

                <Field icon={<Building2 size={14} color="rgba(28,55,65,0.5)" />} label="Company">
                  <input
                    value={company} onChange={e => setCompany(e.target.value)}
                    placeholder="Enter company name" autoComplete="organization" style={inputStyle}
                  />
                </Field>

                <Field icon={<Lock size={14} color="rgba(28,55,65,0.5)" />} label="Password">
                  <>
                    <div style={{ position: 'relative' }}>
                      <input
                        value={password} onChange={e => setPassword(e.target.value)}
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••" autoComplete="current-password"
                        style={{ ...inputStyle, paddingRight: '2.75rem' }}
                      />
                      <button
                        type="button" onClick={() => setShowPwd(s => !s)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}
                      >
                        {showPwd
                          ? <EyeOff size={15} color="rgba(28,55,65,0.35)" />
                          : <Eye    size={15} color="rgba(28,55,65,0.35)" />}
                      </button>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 6 }}>
                      <button
                        type="button" onClick={() => setFpMode(true)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: NILE, textDecoration: 'underline', fontFamily: "'Open Sans', sans-serif" }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </>
                </Field>

                <button
                  type="submit" disabled={isLoading}
                  style={{ ...primaryBtn, marginTop: 4, opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                >
                  {isLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Sign In
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(28,55,65,0.1)' }} />
                <span style={{ fontSize: 11, color: 'rgba(28,55,65,0.3)', fontFamily: "'Open Sans', sans-serif" }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(28,55,65,0.1)' }} />
              </div>

              <button type="button" onClick={handlePasskey} style={outlineBtn}>
                <Fingerprint size={16} />
                Use Biometric / Device Passkey
              </button>
            </>

          ) : (
            /* ══ FORGOT PASSWORD ══ */
            <>
              <button
                type="button" onClick={resetFp}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(28,55,65,0.45)', marginBottom: 28, padding: 0, fontFamily: "'Open Sans', sans-serif" }}
              >
                <ArrowLeft size={13} /> Back to sign in
              </button>

              {fpStep === FP_MOBILE && (
                <>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: NILE, margin: '0 0 6px', fontFamily: "'Open Sans', sans-serif" }}>
                    Forgot Password
                  </h2>
                  <p style={{ fontSize: 13, color: 'rgba(28,55,65,0.45)', margin: '0 0 28px', fontFamily: "'Open Sans', sans-serif" }}>
                    We'll send an OTP to your registered mobile number.
                  </p>
                  <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <Field icon={<Phone size={14} color="rgba(28,55,65,0.5)" />} label="Registered Mobile Number">
                      <input
                        value={mobile} onChange={e => setMobile(e.target.value)}
                        type="tel" placeholder="+91 98765 43210" maxLength={15} style={inputStyle}
                      />
                    </Field>
                    <button
                      type="submit" disabled={fpLoading}
                      style={{ ...primaryBtn, opacity: fpLoading ? 0.7 : 1, cursor: fpLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {fpLoading ? <Loader2 size={15} /> : null} Send OTP
                    </button>
                  </form>
                </>
              )}

              {fpStep === FP_OTP && (
                <>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: NILE, margin: '0 0 6px', fontFamily: "'Open Sans', sans-serif" }}>
                    Enter OTP
                  </h2>
                  <p style={{ fontSize: 13, color: 'rgba(28,55,65,0.45)', margin: '0 0 28px', fontFamily: "'Open Sans', sans-serif" }}>
                    OTP sent to <strong style={{ color: NILE }}>{mobile}</strong>
                  </p>
                  <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <Field icon={<KeyRound size={14} color="rgba(28,55,65,0.5)" />} label="One-Time Password">
                      <input
                        value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        type="text" inputMode="numeric" placeholder="000000"
                        maxLength={6}
                        style={{ ...inputStyle, letterSpacing: '0.5em', textAlign: 'center', fontSize: 22, fontWeight: 700 }}
                      />
                    </Field>
                    <button
                      type="submit" disabled={fpLoading}
                      style={{ ...primaryBtn, opacity: fpLoading ? 0.7 : 1, cursor: fpLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {fpLoading ? <Loader2 size={15} /> : null} Verify OTP
                    </button>
                    <button
                      type="button" onClick={() => { setFpStep(FP_MOBILE); setOtp(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(28,55,65,0.4)', textDecoration: 'underline', fontFamily: "'Open Sans', sans-serif" }}
                    >
                      Resend OTP
                    </button>
                  </form>
                </>
              )}

              {fpStep === FP_RESET && (
                <>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: NILE, margin: '0 0 6px', fontFamily: "'Open Sans', sans-serif" }}>
                    Reset Password
                  </h2>
                  <p style={{ fontSize: 13, color: 'rgba(28,55,65,0.45)', margin: '0 0 28px', fontFamily: "'Open Sans', sans-serif" }}>
                    Choose a new password for your account.
                  </p>
                  <form onSubmit={resetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <Field icon={<Lock size={14} color="rgba(28,55,65,0.5)" />} label="New Password">
                      <div style={{ position: 'relative' }}>
                        <input
                          value={newPwd} onChange={e => setNewPwd(e.target.value)}
                          type={showNP ? 'text' : 'password'} placeholder="Min 6 characters"
                          style={{ ...inputStyle, paddingRight: '2.75rem' }}
                        />
                        <button type="button" onClick={() => setShowNP(s => !s)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}>
                          {showNP ? <EyeOff size={15} color="rgba(28,55,65,0.35)" /> : <Eye size={15} color="rgba(28,55,65,0.35)" />}
                        </button>
                      </div>
                    </Field>
                    <Field icon={<Lock size={14} color="rgba(28,55,65,0.5)" />} label="Re-enter New Password">
                      <div style={{ position: 'relative' }}>
                        <input
                          value={newPwd2} onChange={e => setNewPwd2(e.target.value)}
                          type={showNP2 ? 'text' : 'password'} placeholder="Confirm password"
                          style={{ ...inputStyle, paddingRight: '2.75rem' }}
                        />
                        <button type="button" onClick={() => setShowNP2(s => !s)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}>
                          {showNP2 ? <EyeOff size={15} color="rgba(28,55,65,0.35)" /> : <Eye size={15} color="rgba(28,55,65,0.35)" />}
                        </button>
                      </div>
                    </Field>
                    <button
                      type="submit" disabled={fpLoading}
                      style={{ ...primaryBtn, marginTop: 4, opacity: fpLoading ? 0.7 : 1, cursor: fpLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {fpLoading ? <Loader2 size={15} /> : null} Submit
                    </button>
                  </form>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
