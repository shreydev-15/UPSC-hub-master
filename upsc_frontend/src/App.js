import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, RefreshCw, BookOpen, Calendar, ExternalLink,
  TrendingUp, Loader2, AlertCircle, X, ChevronDown, LogOut,
  User as UserIcon, Pause, Play, Zap, FileText, Globe, Newspaper,
  Sparkles, AlignLeft, BarChart2, Wifi, Filter, Tag
} from 'lucide-react';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';

const API_BASE_URL = 'http://localhost:5000';

/* ═══════════════════════════════════════════════════
   APP COMPONENT
═══════════════════════════════════════════════════ */

const App = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login');

  // App state
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [audioLoading, setAudioLoading] = useState({});
  const [audioObjects, setAudioObjects] = useState({});
  const [audioUrls, setAudioUrls] = useState({});
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioObjectsRef = useRef({});
  const audioUrlsRef = useRef({});
  const [fetchingNews, setFetchingNews] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedArticles, setExpandedArticles] = useState({});
  const [crispSummaries, setCrispSummaries] = useState({});
  const [crispLoading, setCrispLoading] = useState({});
  const [activeView, setActiveView] = useState('news');
  const [customText, setCustomText] = useState('');
  const [customSummary, setCustomSummary] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const containerRef = useRef(null);

  /* ── UPSC topic filter options ─────────────────── */
  const FILTER_TOPICS = [
    { label: 'All',            emoji: '🌐' },
    { label: 'Polity',         emoji: '⚖️' },
    { label: 'Economy',        emoji: '📈' },
    { label: 'Science & Tech', emoji: '🔬' },
    { label: 'Environment',    emoji: '🌿' },
    { label: 'History',        emoji: '🏛️' },
    { label: 'Geography',      emoji: '🗺️' },
    { label: 'International',  emoji: '🌍' },
    { label: 'Defence',        emoji: '🛡️' },
    { label: 'Social',         emoji: '👥' },
    { label: 'General',        emoji: '📰' },
  ];

  const filteredArticles = activeFilter === 'All'
    ? articles
    : articles.filter(a => {
        const topic = (a.topic || '').toLowerCase();
        const filter = activeFilter.toLowerCase();
        return topic.includes(filter) || filter.includes(topic);
      });

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

  /* ── Auth ─────────────────────────────────────── */
  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { if (isAuthenticated) fetchArticles(); }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check`, { credentials: 'include' });
      const data = await response.json();
      if (data.status === 'authenticated' && data.user) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch {
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setAuthView('login');
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
      setIsAuthenticated(false);
      setCurrentUser(null);
      showNotification('Logged out successfully', 'success');
    } catch {
      showNotification('Logout failed', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  /* ── Articles ─────────────────────────────────── */
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/news`);
      const data = await response.json();
      setArticles(data.articles || []);
      showNotification('Articles loaded successfully!');
    } catch {
      setError("Failed to connect to backend. Make sure it's running on port 5000.");
      showNotification('Failed to load articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewArticles = async () => {
    try {
      setFetchingNews(true);
      const response = await fetch(`${API_BASE_URL}/fetch`, { method: 'POST' });
      const data = await response.json();
      showNotification(`Fetched ${data.new_articles} new articles!`);
      await fetchArticles();
    } catch {
      showNotification('Failed to fetch new articles', 'error');
    } finally {
      setFetchingNews(false);
    }
  };

  const searchArticles = async () => {
    if (!searchQuery.trim()) { fetchArticles(); return; }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/news/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setArticles(data.results || []);
      showNotification(`Found ${data.count} articles`);
    } catch {
      showNotification('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Audio ────────────────────────────────────── */
  const playAudio = async (articleId) => {
    try {
      if (audioObjects[articleId] && audioObjects[articleId].paused) {
        audioObjects[articleId].play();
        setPlayingAudioId(articleId);
        showNotification('Resuming audio summary');
        return;
      }
      if (playingAudioId && playingAudioId !== articleId && audioObjects[playingAudioId]) {
        audioObjects[playingAudioId].pause();
        setPlayingAudioId(null);
      }
      setAudioLoading(prev => ({ ...prev, [articleId]: true }));
      const response = await fetch(`${API_BASE_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      });
      if (!response.ok) throw new Error('Failed to generate audio');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setAudioObjects(prev => ({ ...prev, [articleId]: audio }));
      setAudioUrls(prev => ({ ...prev, [articleId]: audioUrl }));
      audioObjectsRef.current[articleId] = audio;
      audioUrlsRef.current[articleId] = audioUrl;
      audio.onended = () => {
        setPlayingAudioId(null);
        URL.revokeObjectURL(audioUrl);
        setAudioObjects(prev => { const n = { ...prev }; delete n[articleId]; return n; });
        setAudioUrls(prev => { const n = { ...prev }; delete n[articleId]; return n; });
        delete audioObjectsRef.current[articleId];
        delete audioUrlsRef.current[articleId];
      };
      audio.onerror = () => { showNotification('Error playing audio', 'error'); setPlayingAudioId(null); URL.revokeObjectURL(audioUrl); };
      await audio.play();
      setPlayingAudioId(articleId);
      showNotification('Playing audio summary');
    } catch {
      showNotification('Failed to play audio', 'error');
    } finally {
      setAudioLoading(prev => ({ ...prev, [articleId]: false }));
    }
  };

  const pauseAudio = (articleId) => {
    if (audioObjects[articleId] && !audioObjects[articleId].paused) {
      audioObjects[articleId].pause();
      setPlayingAudioId(null);
      showNotification('Audio paused');
    }
  };

  const toggleAudio = (articleId) => {
    if (playingAudioId === articleId) pauseAudio(articleId);
    else playAudio(articleId);
  };

  useEffect(() => {
    return () => {
      Object.values(audioObjectsRef.current).forEach(audio => { if (audio) { audio.pause(); audio.src = ''; } });
      Object.values(audioUrlsRef.current).forEach(url => { if (url) URL.revokeObjectURL(url); });
    };
  }, []);

  /* ── Summarizer ───────────────────────────────── */
  const generateCrispSummary = async (articleId) => {
    try {
      setCrispLoading(prev => ({ ...prev, [articleId]: true }));
      const response = await fetch(`${API_BASE_URL}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, mode: 'crisp' }),
      });
      const data = await response.json();
      if (!response.ok || data.status !== 'success') throw new Error(data.message || 'Failed');
      setCrispSummaries(prev => ({ ...prev, [articleId]: { text: data.summary, stats: data.stats || null } }));
      showNotification('Crisp summary generated');
    } catch {
      showNotification('Failed to generate crisp summary', 'error');
    } finally {
      setCrispLoading(prev => ({ ...prev, [articleId]: false }));
    }
  };

  const toggleExpand = (articleId) => {
    setExpandedArticles(prev => ({ ...prev, [articleId]: !prev[articleId] }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const summarizeCustomText = async () => {
    const text = customText.trim();
    if (!text) { showNotification('Please enter some text to summarize', 'error'); return; }
    try {
      setCustomLoading(true);
      setCustomSummary('');
      const response = await fetch(`${API_BASE_URL}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode: 'crisp' }),
      });
      const data = await response.json();
      if (!response.ok || data.status !== 'success') throw new Error(data.message || 'Failed');
      setCustomSummary(data.summary);
      showNotification('Summary generated');
    } catch {
      showNotification('Failed to generate summary', 'error');
    } finally {
      setCustomLoading(false);
    }
  };

  /* ── Auth loading screen ──────────────────────── */
  if (authLoading) {
    return (
      <div style={styles.pageWrapper}>
        <style>{globalCSS}</style>
        <div style={styles.mouseGlow} />
        <div style={styles.splashScreen}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={styles.splashContent}
          >
            <div style={styles.splashIcon}>
              <BookOpen size={36} color="#4f9eff" strokeWidth={2} />
            </div>
            <h1 style={styles.splashTitle}>UPSC News Hub</h1>
            <Loader2 size={28} color="#4f9eff" style={{ animation: 'spin 1s linear infinite', marginTop: '1.5rem' }} />
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Auth pages ───────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div>
        {authView === 'login' ? (
          <LoginPage
            onLogin={handleLogin}
            onSwitchToSignup={() => setAuthView('signup')}
            notification={notification}
            showNotification={showNotification}
          />
        ) : (
          <SignupPage
            onSignup={() => {
              showNotification('Account created! Please login.', 'success');
              setTimeout(() => setAuthView('login'), 1500);
            }}
            onSwitchToLogin={() => setAuthView('login')}
            notification={notification}
            showNotification={showNotification}
          />
        )}
        <AnimatePresence>
          {notification && (
            <motion.div
              style={{ ...styles.notification, background: notification.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(34,197,94,0.95)' }}
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── Main app ─────────────────────────────────── */
  return (
    <div ref={containerRef} style={styles.pageWrapper}>
      <style>{globalCSS}</style>
      <div style={styles.mouseGlow} />

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            style={{ ...styles.notification, background: notification.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(34,197,94,0.95)' }}
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            transition={{ duration: 0.3 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        style={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div style={styles.headerContainer}>
          {/* Logo */}
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>
              <BookOpen size={22} color="#4f9eff" strokeWidth={2} />
            </div>
            <span style={styles.logoText}>UPSC News Hub</span>
          </div>

          {/* Nav */}
          <nav style={styles.nav}>
            {[
              { key: 'news', label: 'News', icon: <Newspaper size={15} /> },
              { key: 'summarizer', label: 'Summarizer', icon: <AlignLeft size={15} /> },
            ].map(({ key, label, icon }) => (
              <motion.button
                key={key}
                onClick={() => setActiveView(key)}
                style={{
                  ...styles.navBtn,
                  ...(activeView === key ? styles.navBtnActive : {}),
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {icon}
                <span>{label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Header actions */}
          <div style={styles.headerActions}>
            {activeView === 'news' && (
              <motion.button
                onClick={fetchNewArticles}
                disabled={fetchingNews}
                style={{ ...styles.fetchBtn, opacity: fetchingNews ? 0.6 : 1 }}
                whileHover={!fetchingNews ? { scale: 1.04, boxShadow: '0 4px 20px rgba(79,158,255,0.3)' } : {}}
                whileTap={!fetchingNews ? { scale: 0.97 } : {}}
              >
                <RefreshCw size={15} style={{ animation: fetchingNews ? 'spin 1s linear infinite' : 'none' }} />
                <span>{fetchingNews ? 'Fetching…' : 'Fetch Latest'}</span>
              </motion.button>
            )}

            <div style={styles.userChip}>
              <UserIcon size={14} color="#4f9eff" />
              <span style={styles.usernameText}>{currentUser?.username}</span>
            </div>

            <motion.button
              onClick={handleLogout}
              style={styles.logoutBtn}
              whileHover={{ scale: 1.08, backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' }}
              whileTap={{ scale: 0.95 }}
              title="Logout"
            >
              <LogOut size={16} color="#f87171" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.container}>

          {/* ── NEWS VIEW ── */}
          {activeView === 'news' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {/* Search bar */}
              <motion.div
                style={styles.searchContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div style={{
                  ...styles.searchWrapper,
                  ...(searchFocused ? styles.searchWrapperFocused : {}),
                }}>
                  <Search size={18} color={searchFocused ? '#4f9eff' : '#6b7280'} style={styles.searchIcon} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchArticles()}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search articles, topics, keywords…"
                    style={styles.searchInput}
                  />
                  <motion.button
                    onClick={searchArticles}
                    style={styles.searchBtn}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Search
                  </motion.button>
                </div>
              </motion.div>

              {/* Filter bar */}
              <motion.div
                style={styles.filterBar}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <div style={styles.filterLabel}>
                  <Filter size={13} color="rgba(255,255,255,0.4)" />
                  <span style={styles.filterLabelText}>Filter by topic</span>
                </div>
                <div style={styles.filterPills}>
                  {FILTER_TOPICS.map(({ label, emoji }) => {
                    const isActive = activeFilter === label;
                    return (
                      <motion.button
                        key={label}
                        onClick={() => setActiveFilter(label)}
                        style={{
                          ...styles.filterPill,
                          ...(isActive ? styles.filterPillActive : {}),
                        }}
                        whileHover={{ scale: 1.06, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span style={styles.filterEmoji}>{emoji}</span>
                        <span>{label}</span>
                        {isActive && (
                          <motion.span
                            style={styles.filterPillDot}
                            layoutId="active-filter-dot"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Stats bar */}
              {!loading && !error && (
                <motion.div
                  style={styles.statsBar}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div style={styles.statChip}>
                    <span style={styles.statusDot} />
                    <span style={styles.statusLabel}>Platform Online</span>
                  </div>
                  <div style={styles.statChip}>
                    <FileText size={13} color="#4f9eff" />
                    <span style={styles.statChipText}>
                      <strong style={{ color: '#fff' }}>{filteredArticles.length}</strong>
                      {activeFilter !== 'All' ? ` of ${articles.length}` : ''} Articles
                      {activeFilter !== 'All' && (
                        <span style={styles.activeFilterTag}>
                          &nbsp;· {activeFilter}
                          <button
                            style={styles.clearFilterBtn}
                            onClick={() => setActiveFilter('All')}
                            title="Clear filter"
                          >✕</button>
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={styles.statChip}>
                    <TrendingUp size={13} color="#a855f7" />
                    <span style={styles.statChipText}>Live Feed</span>
                  </div>
                </motion.div>
              )}

              {/* Loading */}
              {loading && (
                <div style={styles.centerState}>
                  <Loader2 size={44} color="#4f9eff" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={styles.stateText}>Loading articles…</p>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <motion.div
                  style={styles.errorCard}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <AlertCircle size={44} color="#f87171" />
                  <h3 style={styles.errorTitle}>Connection Error</h3>
                  <p style={styles.errorMsg}>{error}</p>
                  <motion.button
                    onClick={fetchArticles}
                    style={styles.retryBtn}
                    whileHover={{ scale: 1.04, boxShadow: '0 4px 20px rgba(79,158,255,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Try Again
                  </motion.button>
                </motion.div>
              )}

              {/* Empty state */}
              {!loading && !error && articles.length === 0 && (
                <div style={styles.centerState}>
                  <BookOpen size={56} color="rgba(79,158,255,0.3)" />
                  <h3 style={{ ...styles.stateText, fontSize: '1.2rem', fontWeight: 600 }}>No articles found</h3>
                  <p style={{ ...styles.stateText, fontSize: '0.9rem', marginTop: 0, opacity: 0.5 }}>Try fetching the latest news or adjusting your search</p>
                </div>
              )}

              {/* Empty filter state */}
              {!loading && !error && articles.length > 0 && filteredArticles.length === 0 && (
                <motion.div
                  style={styles.centerState}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Tag size={48} color="rgba(168,85,247,0.35)" />
                  <h3 style={{ ...styles.stateText, fontSize: '1.1rem', fontWeight: 600 }}>
                    No articles for "{activeFilter}"
                  </h3>
                  <p style={{ ...styles.stateText, fontSize: '0.88rem', marginTop: 0, opacity: 0.45 }}>
                    Try a different topic or fetch the latest news
                  </p>
                  <motion.button
                    style={styles.retryBtn}
                    onClick={() => setActiveFilter('All')}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Show All Articles
                  </motion.button>
                </motion.div>
              )}

              {/* Articles grid */}
              {!loading && !error && filteredArticles.length > 0 && (
                <div style={styles.articlesGrid}>
                  {filteredArticles.map((article, idx) => (
                    <motion.article
                      key={article.id}
                      style={styles.card}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.5) }}
                      whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(79,158,255,0.15)' }}
                    >
                      {/* Card header */}
                      <div style={styles.cardTop}>
                        <h2 style={styles.cardTitle}>{article.title}</h2>
                        <div style={styles.cardMeta}>
                          <Calendar size={12} color="rgba(255,255,255,0.3)" />
                          <span style={styles.metaText}>{formatDate(article.date)}</span>
                        </div>
                        {article.topic && (
                          <span style={styles.topicBadge}>{article.topic}</span>
                        )}
                      </div>

                      {/* Card body */}
                      <div style={styles.cardBody}>
                        {article.summary && (
                          <p style={{
                            ...styles.summary,
                            maxHeight: expandedArticles[article.id] ? 'none' : '4.5em',
                            overflow: 'hidden',
                          }}>
                            {article.summary}
                          </p>
                        )}
                        {article.summary && article.summary.length > 200 && (
                          <button onClick={() => toggleExpand(article.id)} style={styles.expandBtn}>
                            {expandedArticles[article.id] ? 'Show Less' : 'Read More'}
                            <ChevronDown size={14} style={{
                              transform: expandedArticles[article.id] ? 'rotate(180deg)' : 'rotate(0)',
                              transition: 'transform 0.3s ease',
                            }} />
                          </button>
                        )}

                        {/* Crisp summary result */}
                        <AnimatePresence>
                          {crispSummaries[article.id] && (
                            <motion.div
                              style={styles.crispContainer}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <div style={styles.crispHeader}>
                                <span style={styles.crispLabel}>
                                  <Sparkles size={11} /> Crisp Summary
                                </span>
                                {crispSummaries[article.id].stats && (
                                  <span style={styles.crispStats}>
                                    {crispSummaries[article.id].stats.compression_ratio}% shorter
                                  </span>
                                )}
                              </div>
                              <p style={styles.crispText}>{crispSummaries[article.id].text}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Card actions */}
                      <div style={styles.cardActions}>
                        <motion.button
                          onClick={() => toggleAudio(article.id)}
                          disabled={audioLoading[article.id]}
                          style={{ ...styles.actionBtn, ...styles.audioBtnStyle, opacity: audioLoading[article.id] ? 0.5 : 1 }}
                          whileHover={!audioLoading[article.id] ? { scale: 1.03, backgroundColor: 'rgba(79,158,255,0.15)' } : {}}
                          whileTap={!audioLoading[article.id] ? { scale: 0.97 } : {}}
                        >
                          {audioLoading[article.id] ? (
                            <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Loading…</span></>
                          ) : playingAudioId === article.id ? (
                            <><Pause size={14} /><span>Pause</span></>
                          ) : (
                            <><Play size={14} /><span>Listen</span></>
                          )}
                        </motion.button>

                        <motion.a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...styles.actionBtn, ...styles.readBtnStyle }}
                          whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.06)' }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <ExternalLink size={14} />
                          <span>Read Full</span>
                        </motion.a>

                        <motion.button
                          onClick={() => generateCrispSummary(article.id)}
                          disabled={crispLoading[article.id]}
                          style={{ ...styles.actionBtn, ...styles.crispBtnStyle, opacity: crispLoading[article.id] ? 0.5 : 1 }}
                          whileHover={!crispLoading[article.id] ? { scale: 1.03, backgroundColor: 'rgba(168,85,247,0.15)' } : {}}
                          whileTap={!crispLoading[article.id] ? { scale: 0.97 } : {}}
                        >
                          {crispLoading[article.id] ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Sparkles size={14} />
                          )}
                          <span>{crispLoading[article.id] ? 'Summarizing…' : 'AI Summary'}</span>
                        </motion.button>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── SUMMARIZER VIEW ── */}
          {activeView === 'summarizer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={styles.summarizerWrapper}
            >
              {/* Header */}
              <div style={styles.summarizerHeader}>
                <div style={styles.summarizerIconBox}>
                  <AlignLeft size={22} color="#a855f7" />
                </div>
                <div>
                  <h2 style={styles.summarizerTitle}>Text Summarizer</h2>
                  <p style={styles.summarizerSubtitle}>Paste any article or notes and get a concise UPSC-friendly summary.</p>
                </div>
              </div>

              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste your article or notes here…"
                style={styles.summarizerTextarea}
                rows={10}
              />

              <div style={styles.summarizerActions}>
                <motion.button
                  onClick={summarizeCustomText}
                  disabled={customLoading}
                  style={{ ...styles.summarizerBtn, opacity: customLoading ? 0.7 : 1 }}
                  whileHover={!customLoading ? { scale: 1.03, boxShadow: '0 8px 30px rgba(168,85,247,0.4)' } : {}}
                  whileTap={!customLoading ? { scale: 0.97 } : {}}
                >
                  {customLoading ? (
                    <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /><span>Summarizing…</span></>
                  ) : (
                    <><Sparkles size={17} /><span>Generate Summary</span></>
                  )}
                </motion.button>
              </div>

              <AnimatePresence>
                {customSummary && (
                  <motion.div
                    style={styles.summarizerResult}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div style={styles.crispHeader}>
                      <span style={styles.crispLabel}><Sparkles size={11} /> Summary</span>
                    </div>
                    <p style={styles.summarizerResultText}>{customSummary}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   STYLES — dark glassmorphism theme matching LoginPage
═══════════════════════════════════════════════════ */

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    width: '100vw',
    background: 'radial-gradient(ellipse 80% 80% at 20% 20%, #0d1b3e 0%, #050b1a 60%, #0a0519 100%)',
    position: 'relative',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: 'hidden',
  },
  mouseGlow: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
    background: 'radial-gradient(500px circle at var(--gx, 50%) var(--gy, 50%), rgba(79,158,255,0.055), transparent 60%)',
  },

  /* Splash */
  splashScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
  },
  splashContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  splashIcon: {
    width: 64, height: 64,
    borderRadius: 18,
    background: 'rgba(79,158,255,0.1)',
    border: '1px solid rgba(79,158,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    marginBottom: '0.5rem',
  },
  splashTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.02em',
    margin: 0,
  },

  /* Notification */
  notification: {
    position: 'fixed',
    top: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.75rem 1.5rem',
    borderRadius: 12,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.9rem',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
    zIndex: 9999,
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    whiteSpace: 'nowrap',
  },

  /* Header */
  header: {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(30px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContainer: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
  },
  logoIcon: {
    width: 38, height: 38,
    borderRadius: 10,
    background: 'rgba(79,158,255,0.1)',
    border: '1px solid rgba(79,158,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.02em',
  },

  nav: {
    display: 'flex',
    gap: '0.4rem',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.55rem 1rem',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  navBtnActive: {
    background: 'rgba(79,158,255,0.12)',
    border: '1px solid rgba(79,158,255,0.35)',
    color: '#4f9eff',
    fontWeight: 600,
  },

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexShrink: 0,
  },
  fetchBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.55rem 1rem',
    borderRadius: 10,
    border: '1px solid rgba(79,158,255,0.3)',
    background: 'rgba(79,158,255,0.1)',
    color: '#4f9eff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.45rem 0.9rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 999,
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.82rem',
    fontWeight: 600,
  },
  usernameText: { color: 'rgba(255,255,255,0.8)' },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36, height: 36,
    borderRadius: 9,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  /* Main */
  main: { position: 'relative', zIndex: 1, padding: '0 0 4rem' },
  container: { maxWidth: 1400, margin: '0 auto', padding: '0 2rem' },

  /* Search */
  searchContainer: { padding: '2rem 0 1.5rem' },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
    backdropFilter: 'blur(20px)',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  searchWrapperFocused: {
    border: '1px solid rgba(79,158,255,0.5)',
    boxShadow: '0 0 0 3px rgba(79,158,255,0.1)',
    background: 'rgba(79,158,255,0.04)',
  },
  searchIcon: { marginLeft: '1.1rem', flexShrink: 0 },
  searchInput: {
    flex: 1,
    padding: '0.9rem 1rem',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f9fafb',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
  },
  searchBtn: {
    padding: '0.85rem 1.5rem',
    background: 'linear-gradient(135deg, #2563eb 0%, #4f9eff 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },

  /* Filter bar */
  filterBar: {
    marginBottom: '1rem',
    padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    flexWrap: 'wrap',
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    flexShrink: 0,
  },
  filterLabelText: {
    fontSize: '0.73rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  },
  filterPills: {
    display: 'flex',
    gap: '0.45rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.35rem 0.75rem',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.09)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  filterPillActive: {
    background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(79,158,255,0.2) 100%)',
    border: '1px solid rgba(79,158,255,0.55)',
    color: '#60b4ff',
    fontWeight: 700,
    boxShadow: '0 0 12px rgba(79,158,255,0.2)',
  },
  filterEmoji: {
    fontSize: '0.85rem',
    lineHeight: 1,
  },
  filterPillDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#4f9eff',
    boxShadow: '0 0 6px #4f9eff',
    display: 'inline-block',
    marginLeft: 2,
  },
  activeFilterTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
    color: '#60b4ff',
    fontWeight: 600,
  },
  clearFilterBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.35)',
    fontSize: '0.7rem',
    cursor: 'pointer',
    padding: '0 0 0 0.1rem',
    lineHeight: 1,
    fontFamily: 'inherit',
    transition: 'color 0.2s',
  },

  /* Stats bar */
  statsBar: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.75rem',
    flexWrap: 'wrap',
  },
  statChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.85rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 999,
    backdropFilter: 'blur(10px)',
  },
  statusDot: {
    width: 7, height: 7,
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 6px #22c55e',
    animation: 'pulse-dot 2s ease-in-out infinite',
  },
  statusLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#22c55e', letterSpacing: '0.04em', textTransform: 'uppercase' },
  statChipText: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' },

  /* Center states */
  centerState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem 2rem',
    gap: '1rem',
  },
  stateText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '1rem',
    fontWeight: 500,
    margin: 0,
  },

  /* Error card */
  errorCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '3rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 20,
    textAlign: 'center',
    backdropFilter: 'blur(20px)',
  },
  errorTitle: { fontSize: '1.35rem', fontWeight: 700, color: '#f87171', margin: 0 },
  errorMsg: { fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: 500 },
  retryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.75rem 1.75rem',
    borderRadius: 12,
    border: '1px solid rgba(79,158,255,0.3)',
    background: 'rgba(79,158,255,0.1)',
    color: '#4f9eff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },

  /* Articles grid */
  articlesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.25rem',
  },

  /* Article card — glassmorphism */
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: '1.5rem',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
    cursor: 'default',
  },
  cardTop: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  cardTitle: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#f9fafb',
    lineHeight: 1.45,
    margin: 0,
    letterSpacing: '-0.01em',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  metaText: {
    fontSize: '0.78rem',
    color: 'rgba(255,255,255,0.3)',
  },
  topicBadge: {
    alignSelf: 'flex-start',
    padding: '0.2rem 0.65rem',
    borderRadius: 999,
    background: 'rgba(168,85,247,0.15)',
    border: '1px solid rgba(168,85,247,0.3)',
    color: '#c084fc',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardBody: { flex: 1 },
  summary: {
    fontSize: '0.88rem',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.65,
    margin: 0,
    transition: 'max-height 0.3s ease',
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginTop: '0.5rem',
    padding: '0.35rem 0',
    background: 'none',
    border: 'none',
    color: '#4f9eff',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  /* Crisp summary */
  crispContainer: {
    marginTop: '0.75rem',
    padding: '0.85rem',
    borderRadius: 12,
    background: 'rgba(168,85,247,0.07)',
    border: '1px solid rgba(168,85,247,0.2)',
    overflow: 'hidden',
  },
  crispHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.4rem',
  },
  crispLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#c084fc',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  crispStats: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.3)',
  },
  crispText: {
    fontSize: '0.87rem',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.6,
    margin: 0,
  },

  /* Card actions */
  cardActions: {
    display: 'flex',
    gap: '0.6rem',
    marginTop: 'auto',
  },
  actionBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    padding: '0.6rem 0.5rem',
    borderRadius: 10,
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    border: '1px solid',
  },
  audioBtnStyle: {
    borderColor: 'rgba(79,158,255,0.3)',
    background: 'rgba(79,158,255,0.08)',
    color: '#60b4ff',
  },
  readBtnStyle: {
    borderColor: 'rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.55)',
  },
  crispBtnStyle: {
    borderColor: 'rgba(168,85,247,0.3)',
    background: 'rgba(168,85,247,0.08)',
    color: '#c084fc',
  },

  /* Summarizer view */
  summarizerWrapper: {
    marginTop: '2rem',
    padding: '2rem',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
    maxWidth: 860,
  },
  summarizerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  summarizerIconBox: {
    width: 48, height: 48,
    borderRadius: 13,
    background: 'rgba(168,85,247,0.1)',
    border: '1px solid rgba(168,85,247,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  summarizerTitle: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  summarizerSubtitle: {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.4)',
    margin: '0.25rem 0 0',
  },
  summarizerTextarea: {
    width: '100%',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    padding: '1rem',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    resize: 'vertical',
    minHeight: 200,
    outline: 'none',
    color: '#f9fafb',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  },
  summarizerActions: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  summarizerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.85rem 1.75rem',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 20px rgba(168,85,247,0.25)',
  },
  summarizerResult: {
    marginTop: '1.5rem',
    padding: '1rem 1.25rem',
    borderRadius: 14,
    background: 'rgba(168,85,247,0.07)',
    border: '1px solid rgba(168,85,247,0.2)',
  },
  summarizerResultText: {
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.65,
    margin: 0,
  },
};

/* ═══════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════ */

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; overflow-x: hidden; }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px #22c55e; }
    50%       { opacity: 0.6; box-shadow: 0 0 14px #22c55e; }
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }

  input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-text-fill-color: #f9fafb;
    -webkit-box-shadow: 0 0 0px 1000px rgba(13,27,62,0.95) inset;
    transition: background-color 5000s ease-in-out 0s;
  }
  textarea:focus {
    border-color: rgba(168,85,247,0.5) !important;
    box-shadow: 0 0 0 3px rgba(168,85,247,0.1);
  }
`;

export default App;
