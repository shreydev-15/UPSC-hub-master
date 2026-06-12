import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Loader2, User, Lock, Mail, CheckCircle, ChevronRight, Eye, EyeOff, Shield, Zap } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

const SignupPage = ({ onSignup, onSwitchToLogin, showNotification }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const containerRef = useRef(null);

  /* ── Mouse glow ───────────────────────────────── */
  const handleMouseMove = useCallback((e) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--gx', `${e.clientX}px`);
      containerRef.current.style.setProperty('--gy', `${e.clientY}px`);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      showNotification('Please fill in all fields', 'error'); return;
    }
    if (username.trim().length < 3) {
      showNotification('Username must be at least 3 characters', 'error'); return;
    }
    if (password.length < 6) {
      showNotification('Password must be at least 6 characters', 'error'); return;
    }
    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error'); return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      showNotification('Please enter a valid email address', 'error'); return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setSuccess(true);
        showNotification('Account created successfully!', 'success');
        setTimeout(() => { onSignup && onSignup(); onSwitchToLogin(); }, 1500);
      } else {
        showNotification(data.message || 'Signup failed', 'error');
      }
    } catch {
      showNotification('Failed to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      id: 'su-username', label: 'Username', type: 'text', icon: <User size={16} />,
      value: username, onChange: setUsername,
      focused: usernameFocused, setFocused: setUsernameFocused,
      placeholder: 'Choose a username (min 3 chars)',
    },
    {
      id: 'su-email', label: 'Email', type: 'email', icon: <Mail size={16} />,
      value: email, onChange: setEmail,
      focused: emailFocused, setFocused: setEmailFocused,
      placeholder: 'your@email.com',
    },
    {
      id: 'su-password', label: 'Password', type: showPassword ? 'text' : 'password', icon: <Lock size={16} />,
      value: password, onChange: setPassword,
      focused: passwordFocused, setFocused: setPasswordFocused,
      placeholder: 'Create a password (min 6 chars)',
      toggle: () => setShowPassword(s => !s),
      showToggle: true,
      showValue: showPassword,
    },
    {
      id: 'su-confirm', label: 'Confirm Password', type: showConfirm ? 'text' : 'password', icon: <Lock size={16} />,
      value: confirmPassword, onChange: setConfirmPassword,
      focused: confirmFocused, setFocused: setConfirmFocused,
      placeholder: 'Repeat your password',
      toggle: () => setShowConfirm(s => !s),
      showToggle: true,
      showValue: showConfirm,
    },
  ];

  return (
    <div ref={containerRef} style={styles.pageWrapper}>
      <style>{globalCSS}</style>
      <div style={styles.mouseGlow} />

      <div style={styles.centerPanel}>
        <motion.div
          style={styles.card}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Success overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                style={styles.successOverlay}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                >
                  <CheckCircle size={64} color="#22c55e" strokeWidth={1.5} />
                </motion.div>
                <p style={styles.successText}>Account Created!</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div style={styles.cardHeader}>
            <div style={styles.cardLogo}>
              <BookOpen size={22} color="#a855f7" />
            </div>
            <div>
              <h1 style={styles.cardTitle}>Create Account</h1>
              <p style={styles.cardSubtitle}>Join UPSC News Hub — start your prep journey</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {fields.map((f) => (
              <div key={f.id} style={styles.fieldWrapper}>
                <div style={{
                  ...styles.inputContainer,
                  ...(f.focused ? styles.inputContainerFocused : {}),
                }}>
                  <span style={styles.inputIcon} className={f.focused ? 'icon-focused' : ''}>
                    {React.cloneElement(f.icon, { color: f.focused ? '#a855f7' : '#6b7280' })}
                  </span>
                  <input
                    id={f.id}
                    type={f.type}
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    onFocus={() => f.setFocused(true)}
                    onBlur={() => f.setFocused(false)}
                    placeholder={f.placeholder}
                    style={styles.input}
                    disabled={loading || success}
                    autoComplete={f.id}
                  />
                  {f.showToggle && (
                    <button
                      type="button"
                      style={styles.eyeBtn}
                      onClick={f.toggle}
                      tabIndex={-1}
                    >
                      {f.showValue
                        ? <EyeOff size={15} color="#6b7280" />
                        : <Eye size={15} color="#6b7280" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || success}
              style={{
                ...styles.submitBtn,
                opacity: loading || success ? 0.75 : 1,
                cursor: loading || success ? 'not-allowed' : 'pointer',
              }}
              whileHover={!loading && !success ? { scale: 1.02, boxShadow: '0 8px 30px rgba(168,85,247,0.5)' } : {}}
              whileTap={!loading && !success ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /><span>Creating account…</span></>
              ) : success ? (
                <><CheckCircle size={18} /><span>Done!</span></>
              ) : (
                <><span>Create Account</span><ChevronRight size={18} /></>
              )}
            </motion.button>
          </form>

          {/* Trust badges */}
          <div style={styles.trustRow}>
            <span style={styles.trustBadge}><Shield size={12} /> Secure Signup</span>
            <span style={styles.trustBadge}><Zap size={12} /> Instant Access</span>
          </div>

          {/* Switch to login */}
          <div style={styles.switchRow}>
            <span style={styles.switchText}>Already have an account?</span>
            <motion.button
              style={styles.switchBtn}
              whileHover={{ color: '#c084fc', x: 2 }}
              onClick={onSwitchToLogin}
            >
              Sign In →
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   STYLES — matches LoginPage dark glassmorphism
═══════════════════════════════════════════════════ */

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse 80% 80% at 80% 50%, #0d1b3e 0%, #050b1a 60%, #0a0519 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  mouseGlow: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
    background: 'radial-gradient(400px circle at var(--gx, 50%) var(--gy, 50%), rgba(168,85,247,0.07), transparent 60%)',
  },
  centerPanel: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: 460,
    padding: '2rem',
  },
  card: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 24,
    padding: '2rem',
    backdropFilter: 'blur(40px)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
    position: 'relative',
  },

  successOverlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 24,
    background: 'rgba(5,11,26,0.96)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    zIndex: 20,
    backdropFilter: 'blur(10px)',
  },
  successText: { color: '#22c55e', fontSize: '1.25rem', fontWeight: 700, margin: 0 },

  cardHeader: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem',
  },
  cardLogo: {
    width: 44, height: 44, borderRadius: 12,
    background: 'rgba(168,85,247,0.1)',
    border: '1px solid rgba(168,85,247,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: { fontSize: '1.35rem', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' },
  cardSubtitle: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0 },

  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  fieldWrapper: { display: 'flex', flexDirection: 'column' },

  inputContainer: {
    position: 'relative',
    display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  },
  inputContainerFocused: {
    border: '1px solid rgba(168,85,247,0.6)',
    boxShadow: '0 0 0 3px rgba(168,85,247,0.12)',
    background: 'rgba(168,85,247,0.04)',
  },
  inputIcon: {
    position: 'absolute', left: '0.9rem', flexShrink: 0, zIndex: 2, display: 'flex',
  },
  input: {
    flex: 1,
    padding: '0.9rem 0.75rem 0.9rem 2.6rem',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f9fafb',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    width: '100%',
  },
  eyeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '0 0.75rem',
    display: 'flex', alignItems: 'center', flexShrink: 0,
  },

  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.9rem 1.5rem',
    borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    color: '#fff',
    fontSize: '0.95rem', fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '0.4rem',
    letterSpacing: '-0.01em',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
  },

  trustRow: {
    display: 'flex', gap: '0.75rem', justifyContent: 'center',
    marginTop: '1rem', flexWrap: 'wrap',
  },
  trustBadge: {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)',
    padding: '3px 8px',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.03)',
  },

  switchRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.4rem', marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255,255,255,0.07)',
  },
  switchText: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)' },
  switchBtn: {
    background: 'none', border: 'none',
    color: '#a855f7',
    fontSize: '0.82rem', fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
    transition: 'all 0.2s',
  },
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; overflow-x: hidden; }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
  input::placeholder { color: rgba(255,255,255,0.2); }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-text-fill-color: #f9fafb;
    -webkit-box-shadow: 0 0 0px 1000px rgba(13,27,62,0.95) inset;
    transition: background-color 5000s ease-in-out 0s;
  }
`;

export default SignupPage;
