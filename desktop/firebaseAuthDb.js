/**
 * Firebase Auth & Cloud Firestore Database Service for TouchArt Studio
 * Supports User Accounts, Cloud Presets, and Global Community Preset Sharing Hub
 */

const FIREBASE_CONFIG = {
  projectId: "cables-visualizer",
  appId: "1:981929855518:web:66b77f50da5144f9af7c0f",
  storageBucket: "cables-visualizer.firebasestorage.app",
  apiKey: "AIzaSyAQE0Ixkot6sWYGHKD28HKTSZDaSTGH3EU",
  authDomain: "cables-visualizer.firebaseapp.com",
  messagingSenderId: "981929855518"
};

class TouchArtCloudStorage {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.authStateListeners = [];
    this.isInitialized = false;

    this.init();
  }

  init() {
    if (typeof firebase === 'undefined') {
      console.warn('[Cloud Storage] Firebase SDK not loaded yet.');
      return;
    }

    try {
      if (!firebase.apps.length) {
        this.app = firebase.initializeApp(FIREBASE_CONFIG);
      } else {
        this.app = firebase.app();
      }

      this.auth = firebase.auth();
      this.db = firebase.firestore();

      // Enable offline persistence
      this.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('[Cloud Storage] Multiple tabs open, persistence disabled in this tab.');
        } else if (err.code === 'unimplemented') {
          console.warn('[Cloud Storage] Browser does not support offline persistence.');
        }
      });

      // Listen for Auth state changes
      this.auth.onAuthStateChanged(async (user) => {
        this.currentUser = user;
        if (user) {
          await this.ensureUserProfile(user);
        }
        this.notifyAuthListeners(user);
      });

      this.isInitialized = true;
      console.log('[Cloud Storage] Firebase Auth & Firestore initialized successfully.');
    } catch (err) {
      console.error('[Cloud Storage] Firebase init error:', err);
    }
  }

  onAuthStateChanged(cb) {
    this.authStateListeners.push(cb);
    if (this.currentUser !== undefined) {
      cb(this.currentUser);
    }
  }

  notifyAuthListeners(user) {
    this.authStateListeners.forEach((cb) => {
      try { cb(user); } catch (e) {}
    });
  }

  async ensureUserProfile(user) {
    if (!this.db || !user) return;
    try {
      const userRef = this.db.collection('users').doc(user.uid);
      const doc = await userRef.get();
      if (!doc.exists) {
        await userRef.set({
          uid: user.uid,
          displayName: user.displayName || (user.isAnonymous ? 'Guest Artist' : user.email.split('@')[0]),
          email: user.email || null,
          isAnonymous: user.isAnonymous || false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await userRef.update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (err) {
      console.error('[Cloud Storage] Error ensuring user profile:', err);
    }
  }

  // ==========================================
  // Authentication Methods
  // ==========================================

  async signUpWithEmail(email, password, displayName = '') {
    if (!this.auth) throw new Error('Firebase Auth not available');
    const cred = await this.auth.createUserWithEmailAndPassword(email, password);
    if (displayName && cred.user) {
      await cred.user.updateProfile({ displayName });
    }
    await this.ensureUserProfile(cred.user);
    return cred.user;
  }

  async signInWithEmail(email, password) {
    if (!this.auth) throw new Error('Firebase Auth not available');
    const cred = await this.auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  }

  async signInWithGoogle() {
    if (!this.auth) throw new Error('Firebase Auth not available');
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await this.auth.signInWithPopup(provider);
    await this.ensureUserProfile(cred.user);
    return cred.user;
  }

  async signInAnonymously() {
    if (!this.auth) throw new Error('Firebase Auth not available');
    const cred = await this.auth.signInAnonymously();
    await this.ensureUserProfile(cred.user);
    return cred.user;
  }

  async signOut() {
    if (!this.auth) return;
    await this.auth.signOut();
  }

  // ==========================================
  // User Private Cloud Presets
  // ==========================================

  async saveUserPreset(preset) {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.currentUser) throw new Error('Please sign in to save presets to the cloud');

    const presetId = preset.id || `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const presetData = {
      id: presetId,
      name: preset.name || 'Untitled Cloud Preset',
      description: preset.description || '',
      equationKey: preset.equationKey || 'spectral_wave_grid',
      customGlslCode: preset.customGlslCode || null,
      params: preset.params || {},
      postFx: preset.postFx || {},
      audioConfig: preset.audioConfig || {},
      automations: preset.automations || [],
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!preset.id) {
      presetData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    const docRef = this.db.collection('users').doc(this.currentUser.uid).collection('presets').doc(presetId);
    await docRef.set(presetData, { merge: true });

    // If marked for community publication
    if (preset.isPublic) {
      await this.publishToCommunity({ ...presetData, authorId: this.currentUser.uid });
    }

    return presetId;
  }

  async getUserPresets() {
    if (!this.db || !this.currentUser) return [];
    try {
      const snap = await this.db
        .collection('users')
        .doc(this.currentUser.uid)
        .collection('presets')
        .orderBy('updatedAt', 'desc')
        .get();

      return snap.docs.map((doc) => doc.data());
    } catch (err) {
      console.error('[Cloud Storage] Error fetching user presets:', err);
      return [];
    }
  }

  async deleteUserPreset(presetId) {
    if (!this.db || !this.currentUser) return false;
    try {
      await this.db.collection('users').doc(this.currentUser.uid).collection('presets').doc(presetId).delete();
      return true;
    } catch (err) {
      console.error('[Cloud Storage] Error deleting preset:', err);
      return false;
    }
  }

  // ==========================================
  // Global Community Preset Hub
  // ==========================================

  async publishToCommunity(preset) {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.currentUser) throw new Error('Please sign in to publish presets');

    const publicPresetId = preset.id || `pub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const authorName = this.currentUser.displayName || (this.currentUser.isAnonymous ? 'Guest Artist' : this.currentUser.email.split('@')[0]);

    const communityData = {
      id: publicPresetId,
      authorId: this.currentUser.uid,
      authorName: authorName,
      name: preset.name || 'Untitled Community Visual',
      description: preset.description || '',
      tags: preset.tags || ['audio-reactive', 'glsl'],
      equationKey: preset.equationKey || 'spectral_wave_grid',
      customGlslCode: preset.customGlslCode || null,
      params: preset.params || {},
      postFx: preset.postFx || {},
      audioConfig: preset.audioConfig || {},
      automations: preset.automations || [],
      likesCount: preset.likesCount || 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = this.db.collection('public_presets').doc(publicPresetId);
    await docRef.set(communityData, { merge: true });
    return publicPresetId;
  }

  async getCommunityPresets(limit = 50) {
    if (!this.db) return [];
    try {
      const snap = await this.db
        .collection('public_presets')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snap.docs.map((doc) => doc.data());
    } catch (err) {
      console.error('[Cloud Storage] Error fetching community presets:', err);
      return [];
    }
  }

  async likeCommunityPreset(presetId) {
    if (!this.db) return;
    try {
      const docRef = this.db.collection('public_presets').doc(presetId);
      await docRef.update({
        likesCount: firebase.firestore.FieldValue.increment(1)
      });
      return true;
    } catch (err) {
      console.error('[Cloud Storage] Error liking preset:', err);
      return false;
    }
  }

  /**
   * Sync all LocalStorage slider rules to Cloud in 1 click
   */
  async syncLocalPresetsToCloud() {
    if (!this.currentUser) throw new Error('Please sign in to sync presets');
    try {
      const raw = localStorage.getItem('touchart_slider_rules');
      const localRules = raw ? JSON.parse(raw) : {};
      const savedIds = [];

      for (const [name, rule] of Object.entries(localRules)) {
        const id = await this.saveUserPreset({
          name: name,
          equationKey: rule.equationKey || 'spectral_wave_grid',
          params: {
            p1: rule.p1, p2: rule.p2, p3: rule.p3, p4: rule.p4, p5: rule.p5,
            p6: rule.p6, p7: rule.p7, p8: rule.p8, p9: rule.p9, p10: rule.p10
          },
          postFx: {
            bloom: rule.bloom,
            chromatic: rule.chromatic,
            vignette: rule.vignette,
            filmgrain: rule.filmgrain
          },
          audioConfig: {
            masterGain: rule.masterGain,
            bassGain: rule.bassGain,
            midGain: rule.midGain,
            trebleGain: rule.trebleGain
          },
          automations: rule.automations || []
        });
        savedIds.push(id);
      }

      return savedIds.length;
    } catch (err) {
      console.error('[Cloud Storage] Error syncing local rules:', err);
      throw err;
    }
  }
}

if (typeof window !== 'undefined') {
  window.TouchArtCloudStorage = TouchArtCloudStorage;
}
