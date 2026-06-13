import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import {
  Eye, EyeOff, Loader2, Lock, Mail, BookOpen,
  CheckCircle, Wifi, Users, FileText, Globe,
  Shield, Zap, TrendingUp, ChevronRight
} from 'lucide-react';

const API_BASE_URL = 'https://upsc-hub-master.onrender.com';     

/* ═══════════════════════════════════════════════════
   3D SCENE COMPONENTS
═══════════════════════════════════════════════════ */

function FloatingOrb({ position, color, scale = 1, speed = 1 }) {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 * speed;
    }
  });
  return (
    <Float speed={speed * 1.5} rotationIntensity={0.5} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.1}
          metalness={0.8}
          distort={0.3}
          speed={2}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  );
}

function NetworkNode({ position, color = '#4f9eff' }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.3;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        roughness={0}
        metalness={1}
      />
    </mesh>
  );
}

function ConnectionLine({ start, end }) {
  const ref = useRef();
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <line ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#4f9eff" transparent opacity={0.4} />
    </line>
  );
}

function BookMesh({ position }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.4;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6 + position[0] * 2) * 0.4;
    }
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={1}>
      <mesh ref={ref} position={position}>
        <boxGeometry args={[0.4, 0.55, 0.08]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#4f1fad"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const ref = useRef();
  const count = 200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#4f9eff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function SceneCamera() {
  const { camera } = useThree();
  useFrame((state) => {
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.5;
    camera.position.y = Math.cos(state.clock.elapsedTime * 0.08) * 0.3;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

const nodes = [
  [-3, 2, 0], [3, 1, -1], [0, 3, -1], [-2, -1, 0],
  [2, -2, -1], [-1, 0.5, 1], [1, 2.5, 0.5], [-3.5, -0.5, -0.5],
];
const connections = [
  [nodes[0], nodes[2]], [nodes[1], nodes[2]], [nodes[2], nodes[6]],
  [nodes[3], nodes[0]], [nodes[4], nodes[1]], [nodes[5], nodes[3]],
  [nodes[6], nodes[1]], [nodes[7], nodes[3]],
];
const books = [[-4, 1, -2], [4, -1, -2], [-1.5, 3.5, -1.5], [2.5, 2, -2]];

function Scene3D() {
  return (
    <>
      <SceneCamera />
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#4f9eff" />
      <pointLight position={[-5, -3, 3]} intensity={1} color="#a855f7" />
      <pointLight position={[0, 0, 8]} intensity={0.5} color="#ffffff" />

      <Stars radius={80} depth={50} count={3000} factor={3} fade speed={0.5} />
      <ParticleField />

      <FloatingOrb position={[-1.5, 0.5, 0]} color="#4f9eff" scale={1.2} speed={0.8} />
      <FloatingOrb position={[2, -0.5, -2]} color="#a855f7" scale={0.8} speed={1.2} />
      <FloatingOrb position={[0, 2, -1]} color="#06b6d4" scale={0.6} speed={1.5} />

      {nodes.map((pos, i) => (
        <NetworkNode key={i} position={pos} color={i % 2 === 0 ? '#4f9eff' : '#a855f7'} />
      ))}
      {connections.map(([s, e], i) => (
        <ConnectionLine key={i} start={s} end={e} />
      ))}
      {books.map((pos, i) => (
        <BookMesh key={i} position={pos} />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   SOCIAL BUTTON ICON SVGS
═══════════════════════════════════════════════════ */

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.777L1.24 17.35C3.198 21.302 7.27 24 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
    <path fill="#FBBC05" d="M5.277 14.314A7.13 7.13 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.24 5.35l4.037-3.036Z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12Z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z"/>
  </svg>
);

/* ═══════════════════════════════════════════════════
   MAIN LOGIN PAGE COMPONENT
═══════════════════════════════════════════════════ */

const LoginPage = ({ onLogin, onSwitchToSignup, notification, showNotification }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [cardParallax, setCardParallax] = useState({ x: 0, y: 0 });
  const [ripple, setRipple] = useState(null);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const containerRef = useRef(null);
  const btnRef = useRef(null);

  /* ── Mouse glow + parallax ────────────────── */
  const handleMouseMove = useCallback((e) => {
    const x = e.clientX;
    const y = e.clientY;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setCardParallax({
      x: ((x - cx) / cx) * 6,
      y: ((y - cy) / cy) * 4,
    });
    if (containerRef.current) {
      containerRef.current.style.setProperty('--gx', `${x}px`);
      containerRef.current.style.setProperty('--gy', `${y}px`);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  /* ── Real-time validation ─────────────────── */
  const validate = useCallback((field, value) => {
    const errs = {};
    if (field === 'username' || field === 'all') {
      if (!value && field === 'all') errs.username = 'Username or email is required';
      else if (field === 'username' && !value) errs.username = 'Username or email is required';
    }
    if (field === 'password' || field === 'all') {
      const pwd = field === 'password' ? value : password;
      if (!pwd) errs.password = 'Password is required';
      else if (pwd.length < 6) errs.password = 'Password must be at least 6 characters';
    }
    return errs;
  }, [password]);

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    const v = field === 'username' ? username : password;
    setErrors(prev => ({ ...prev, ...validate(field, v) }));
  };

  /* ── Ripple effect ────────────────────────── */
  const createRipple = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 700);
  };

  /* ── Submit ───────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    createRipple(e);
    setTouched({ username: true, password: true });
    const allErrors = validate('all', username);
    if (Object.keys(allErrors).length) {
      setErrors(allErrors);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setSuccess(true);
        showNotification('Login successful!', 'success');
        setTimeout(() => onLogin(data.user), 1200);
      } else {
        showNotification(data.message || 'Login failed', 'error');
      }
    } catch {
      showNotification('Failed to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    showNotification('Continuing as Guest', 'success');
    onLogin({ username: 'guest', role: 'guest' });
  };

  /* ── Stats data ───────────────────────────── */
  const stats = [
    { icon: <Users size={14} />, label: 'Active Users', value: '12,400+' },
    { icon: <FileText size={14} />, label: 'Articles', value: '85,000+' },
    { icon: <Globe size={14} />, label: 'Topics', value: '340+' },
  ];

  const features = [
    { icon: <Zap size={14} />, text: 'Daily current affairs curated by experts' },
    { icon: <Shield size={14} />, text: 'Trusted by IAS, IPS, IFS aspirants' },
    { icon: <TrendingUp size={14} />, text: 'AI-powered relevance ranking for UPSC' },
  ];

  return (
    <div ref={containerRef} style={styles.pageWrapper}>
      {/* Global styles injected */}
      <style>{globalCSS}</style>

      {/* Mouse glow overlay */}
      <div style={styles.mouseGlow} />

      {/* ── LEFT PANEL: 3D Scene ── */}
      <div style={styles.leftPanel}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene3D />
          </Suspense>
        </Canvas>

        {/* Overlay content on top of canvas */}
        <div style={styles.leftOverlay}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={styles.brandBox}
          >
            <div style={styles.brandIcon}>
              <BookOpen size={32} color="#4f9eff" strokeWidth={2} />
            </div>
            <h2 style={styles.brandTitle}>UPSC News Hub</h2>
            <p style={styles.brandSubtitle}>
              Your intelligent gateway to UPSC preparation — curated news, daily analysis, and expert insights.
            </p>
          </motion.div>

          {/* Stats card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={styles.statsCard}
          >
            <div style={styles.statsHeader}>
              <span style={styles.statusDot} />
              <span style={styles.statusText}>Platform Online</span>
            </div>
            <div style={styles.statsRow}>
              {stats.map((s, i) => (
                <div key={i} style={styles.statItem}>
                  <span style={styles.statIcon}>{s.icon}</span>
                  <span style={styles.statValue}>{s.value}</span>
                  <span style={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            style={styles.featuresBox}
          >
            {features.map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login card ── */}
      <div style={styles.rightPanel}>
        <motion.div
          style={{
            ...styles.loginCard,
            transform: `perspective(1000px) rotateY(${cardParallax.x * 0.4}deg) rotateX(${-cardParallax.y * 0.4}deg)`,
          }}
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Success overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                style={styles.successOverlay}
                initial={{ opacity: 0, scale: 0.8 }}
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
                <p style={styles.successText}>Welcome back!</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card header */}
          <div style={styles.cardHeader}>
            <div style={styles.cardLogo}>
              <BookOpen size={24} color="#4f9eff" />
            </div>
            <div>
              <h1 style={styles.cardTitle}>Welcome Back</h1>
              <p style={styles.cardSubtitle}>Sign in to your UPSC Hub account</p>
            </div>
          </div>

          {/* Social logins */}
          <div style={styles.socialRow}>
            {[
              { icon: <GoogleIcon />, label: 'Google', id: 'btn-google' },
              { icon: <GitHubIcon />, label: 'GitHub', id: 'btn-github' },
              { icon: <LinkedInIcon />, label: 'LinkedIn', id: 'btn-linkedin' },
            ].map((s) => (
              <motion.button
                key={s.id}
                id={s.id}
                style={styles.socialBtn}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.96 }}
                onClick={() => showNotification(`${s.label} login coming soon`, 'error')}
              >
                {s.icon}
                <span>{s.label}</span>
              </motion.button>
            ))}
          </div>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or continue with email</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* Username / Email */}
            <div style={styles.fieldWrapper}>
              <div style={{
                ...styles.inputContainer,
                ...(usernameFocused ? styles.inputContainerFocused : {}),
                ...(touched.username && errors.username ? styles.inputContainerError : {}),
              }}>
                <Mail size={16} style={styles.inputIcon} color={usernameFocused ? '#4f9eff' : '#6b7280'} />
                <input
                  id="input-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (touched.username) setErrors(p => ({ ...p, ...validate('username', e.target.value) }));
                  }}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => { setUsernameFocused(false); handleBlur('username'); }}
                  placeholder="Username or Email"
                  style={styles.input}
                  disabled={loading || success}
                  autoComplete="username"
                />
                <motion.label
                  style={{
                    ...styles.floatingLabel,
                    ...(usernameFocused || username ? styles.floatingLabelActive : {}),
                    color: usernameFocused ? '#4f9eff' : '#9ca3af',
                  }}
                >
                  Username or Email
                </motion.label>
              </div>
              <AnimatePresence>
                {touched.username && errors.username && (
                  <motion.p
                    style={styles.errorText}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {errors.username}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div style={styles.fieldWrapper}>
              <div style={{
                ...styles.inputContainer,
                ...(passwordFocused ? styles.inputContainerFocused : {}),
                ...(touched.password && errors.password ? styles.inputContainerError : {}),
              }}>
                <Lock size={16} style={styles.inputIcon} color={passwordFocused ? '#4f9eff' : '#6b7280'} />
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) setErrors(p => ({ ...p, ...validate('password', e.target.value) }));
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => { setPasswordFocused(false); handleBlur('password'); }}
                  placeholder="Password"
                  style={styles.input}
                  disabled={loading || success}
                  autoComplete="current-password"
                />
                <motion.label
                  style={{
                    ...styles.floatingLabel,
                    right: '2.5rem',
                    ...(passwordFocused || password ? styles.floatingLabelActive : {}),
                    color: passwordFocused ? '#4f9eff' : '#9ca3af',
                  }}
                >
                  Password
                </motion.label>
                <button
                  id="btn-toggle-password"
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPassword(s => !s)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} color="#6b7280" /> : <Eye size={16} color="#6b7280" />}
                </button>
              </div>
              <AnimatePresence>
                {touched.password && errors.password && (
                  <motion.p
                    style={styles.errorText}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Remember me + Forgot */}
            <div style={styles.rememberRow}>
              <label id="label-remember-me" style={styles.checkboxLabel}>
                <input
                  id="cb-remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxCustom}>
                  {rememberMe && <CheckCircle size={10} color="#4f9eff" />}
                </span>
                <span style={styles.rememberText}>Remember me</span>
              </label>
              <motion.button
                id="btn-forgot-password"
                type="button"
                style={styles.forgotBtn}
                whileHover={{ color: '#4f9eff', x: 2 }}
                onClick={() => showNotification('Password reset coming soon', 'error')}
              >
                Forgot password?
              </motion.button>
            </div>

            {/* Submit button */}
            <motion.button
              id="btn-sign-in"
              ref={btnRef}
              type="submit"
              disabled={loading || success}
              style={{
                ...styles.submitBtn,
                opacity: loading || success ? 0.8 : 1,
                cursor: loading || success ? 'not-allowed' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              whileHover={!loading && !success ? { scale: 1.02, boxShadow: '0 8px 30px rgba(79,158,255,0.5)' } : {}}
              whileTap={!loading && !success ? { scale: 0.98 } : {}}
            >
              {ripple && (
                <span
                  style={{
                    position: 'absolute',
                    left: ripple.x - 50,
                    top: ripple.y - 50,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.3)',
                    animation: 'ripple 0.7s ease-out forwards',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {loading ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /><span>Signing in...</span></>
              ) : success ? (
                <><CheckCircle size={18} /><span>Signed in!</span></>
              ) : (
                <><span>Sign In</span><ChevronRight size={18} /></>
              )}
            </motion.button>
          </form>

          {/* Guest access */}
          <motion.button
            id="btn-guest"
            style={styles.guestBtn}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)', scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGuestLogin}
          >
            Continue as Guest
          </motion.button>

          {/* Trust badges */}
          <div style={styles.trustRow}>
            <span style={styles.trustBadge}><Shield size={12} /> SSL Secured</span>
            <span style={styles.trustBadge}><Wifi size={12} /> Live Updates</span>
            <span style={styles.trustBadge}><Zap size={12} /> Fast & Reliable</span>
          </div>

          {/* Switch to signup */}
          <div style={styles.switchRow}>
            <span style={styles.switchText}>Don't have an account?</span>
            <motion.button
              id="btn-go-signup"
              style={styles.switchBtn}
              whileHover={{ color: '#60b4ff', x: 2 }}
              onClick={onSwitchToSignup}
            >
              Sign Up Free →
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════ */

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    background: 'radial-gradient(ellipse 80% 80% at 20% 50%, #0d1b3e 0%, #050b1a 60%, #0a0519 100%)',
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
    background: 'radial-gradient(400px circle at var(--gx, 50%) var(--gy, 50%), rgba(79,158,255,0.06), transparent 60%)',
  },
  leftPanel: {
    flex: '1 1 55%',
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
  },
  leftOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '2.5rem',
    gap: '1.25rem',
    pointerEvents: 'none',
    background: 'linear-gradient(to top, rgba(5,11,26,0.95) 0%, rgba(5,11,26,0.4) 50%, transparent 100%)',
  },
  brandBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  brandIcon: {
    width: 52, height: 52,
    borderRadius: 14,
    background: 'rgba(79,158,255,0.12)',
    border: '1px solid rgba(79,158,255,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    marginBottom: '0.5rem',
  },
  brandTitle: {
    fontSize: '2rem', fontWeight: 700, margin: 0,
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  brandSubtitle: {
    fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)',
    margin: 0, lineHeight: 1.6, maxWidth: 380,
  },
  statsCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '1rem 1.25rem',
    backdropFilter: 'blur(20px)',
    pointerEvents: 'auto',
  },
  statsHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem',
  },
  statusDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 8px #22c55e',
    animation: 'pulse-dot 2s ease-in-out infinite',
  },
  statusText: {
    fontSize: '0.75rem', color: '#22c55e', fontWeight: 600, letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  statsRow: {
    display: 'flex', gap: '1.5rem',
  },
  statItem: {
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  statIcon: {
    color: '#4f9eff', display: 'flex',
  },
  statValue: {
    fontSize: '1.1rem', fontWeight: 700, color: '#fff',
  },
  statLabel: {
    fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  featuresBox: {
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
  },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
  },
  featureIcon: {
    color: '#a855f7', display: 'flex', flexShrink: 0,
  },
  featureText: {
    fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)',
  },

  /* Right panel */
  rightPanel: {
    flex: '0 0 auto',
    width: '460px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    zIndex: 10,
  },
  loginCard: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 24,
    padding: '2rem',
    backdropFilter: 'blur(40px)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
    position: 'relative',
    transformStyle: 'preserve-3d',
    willChange: 'transform',
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
  successText: {
    color: '#22c55e', fontSize: '1.25rem', fontWeight: 700, margin: 0,
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem',
  },
  cardLogo: {
    width: 44, height: 44, borderRadius: 12,
    background: 'rgba(79,158,255,0.1)',
    border: '1px solid rgba(79,158,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: '1.35rem', fontWeight: 700, color: '#fff',
    margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em',
  },
  cardSubtitle: {
    fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0,
  },

  /* Social */
  socialRow: {
    display: 'flex', gap: '0.6rem', marginBottom: '1.25rem',
  },
  socialBtn: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '0.6rem 0.5rem',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    color: '#d1d5db',
    fontSize: '0.78rem', fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem',
  },
  dividerLine: {
    flex: 1, height: 1, background: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)',
    whiteSpace: 'nowrap', letterSpacing: '0.03em',
  },

  /* Form */
  form: {
    display: 'flex', flexDirection: 'column', gap: '0.9rem',
  },
  fieldWrapper: {
    display: 'flex', flexDirection: 'column', gap: '0.3rem',
  },
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
    border: '1px solid rgba(79,158,255,0.6)',
    boxShadow: '0 0 0 3px rgba(79,158,255,0.12)',
    background: 'rgba(79,158,255,0.04)',
  },
  inputContainerError: {
    border: '1px solid rgba(239,68,68,0.6)',
    boxShadow: '0 0 0 3px rgba(239,68,68,0.10)',
  },
  inputIcon: {
    position: 'absolute', left: '0.9rem', flexShrink: 0, zIndex: 2,
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
  floatingLabel: {
    position: 'absolute', left: '2.6rem',
    fontSize: '0.85rem',
    pointerEvents: 'none',
    transition: 'all 0.2s ease',
    zIndex: 1,
    opacity: 0,
  },
  floatingLabelActive: {
    opacity: 0,
  },
  eyeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '0 0.75rem',
    display: 'flex', alignItems: 'center',
    flexShrink: 0,
  },
  errorText: {
    fontSize: '0.75rem', color: '#f87171', margin: 0, paddingLeft: '0.25rem',
  },

  /* Remember + forgot */
  rememberRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: '0.1rem',
  },
  checkboxLabel: {
    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
  },
  checkbox: { display: 'none' },
  checkboxCustom: {
    width: 16, height: 16, borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.20)',
    background: 'rgba(255,255,255,0.05)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  rememberText: {
    fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)',
  },
  forgotBtn: {
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.8rem', cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
    transition: 'color 0.2s',
  },

  /* Submit */
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.9rem 1.5rem',
    borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #4f9eff 100%)',
    color: '#fff',
    fontSize: '0.95rem', fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '0.4rem',
    letterSpacing: '-0.01em',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 20px rgba(79,158,255,0.3)',
  },

  /* Guest */
  guestBtn: {
    width: '100%',
    marginTop: '0.75rem',
    padding: '0.7rem',
    borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },

  /* Trust */
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

  /* Switch */
  switchRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.4rem', marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255,255,255,0.07)',
  },
  switchText: {
    fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)',
  },
  switchBtn: {
    background: 'none', border: 'none',
    color: '#4f9eff',
    fontSize: '0.82rem', fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
    transition: 'all 0.2s',
  },
};

/* ═══════════════════════════════════════════════════
   GLOBAL CSS (keyframes, fonts, responsive)
═══════════════════════════════════════════════════ */

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; overflow-x: hidden; }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ripple {
    0%   { transform: scale(0); opacity: 1; }
    100% { transform: scale(4); opacity: 0; }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px #22c55e; }
    50%       { opacity: 0.6; box-shadow: 0 0 14px #22c55e; }
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }

  /* Hide number input arrows */
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }

  /* Placeholder color */
  input::placeholder { color: rgba(255,255,255,0.2); }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-text-fill-color: #f9fafb;
    -webkit-box-shadow: 0 0 0px 1000px rgba(13,27,62,0.9) inset;
    transition: background-color 5000s ease-in-out 0s;
  }

  /* Responsive: hide 3D panel on small screens */
  @media (max-width: 768px) {
    .left-panel-3d { display: none !important; }
    .right-panel-login {
      width: 100vw !important;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: radial-gradient(ellipse 120% 80% at 50% 0%, #0d1b3e 0%, #050b1a 100%);
    }
  }
`;

export default LoginPage;
