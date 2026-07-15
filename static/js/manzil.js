/* ============================================================
   manzil.js — Main application JavaScript for Manzil / Aceron
   Vanilla JS only, no jQuery, no React
   ============================================================ */

'use strict';

// ── CSRF helper for Django ──
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

async function apiPost(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken'),
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// ── Debounce utility ──
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ── Show message helper ──
function showMessage(container, message, type = 'error') {
  if (!container) return;
  container.textContent = message;
  container.className = `form-message form-message--${type}`;
  container.classList.add('visible');
  container.setAttribute('role', 'alert');
  // Auto-hide success messages after 4 s
  if (type === 'success') {
    setTimeout(() => {
      container.classList.remove('visible');
    }, 4000);
  }
}

// ── Email validation ──
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ============================================================
   AUTH PAGE
   ============================================================ */
function initAuth() {
  const tabSignIn = document.querySelector('[data-tab="signin"]');
  const tabSignUp = document.querySelector('[data-tab="signup"]');
  const formSignIn = document.getElementById('form-signin');
  const formSignUp = document.getElementById('form-signup');
  const messageEl = document.querySelector('.form-message');

  // ── Tab switching ──
  function activateTab(tab) {
    if (tab === 'signin') {
      tabSignIn?.classList.add('active');
      tabSignUp?.classList.remove('active');
      formSignIn?.classList.add('active');
      formSignUp?.classList.remove('active');
    } else {
      tabSignUp?.classList.add('active');
      tabSignIn?.classList.remove('active');
      formSignUp?.classList.add('active');
      formSignIn?.classList.remove('active');
    }
    if (messageEl) {
      messageEl.classList.remove('visible');
      messageEl.textContent = '';
    }
  }

  tabSignIn?.addEventListener('click', () => activateTab('signin'));
  tabSignUp?.addEventListener('click', () => activateTab('signup'));

  // ── Show/hide password toggle ──
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling || btn.closest('.input-wrapper')?.querySelector('input[type]');
      const targetId = btn.dataset.target;
      const targetInput = targetId ? document.getElementById(targetId) : input;
      if (!targetInput) return;
      const isHidden = targetInput.type === 'password';
      targetInput.type = isHidden ? 'text' : 'password';
      // Toggle eye icon state
      btn.classList.toggle('showing', isHidden);
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  });

  // ── Sign-In form submission ──
  formSignIn?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = formSignIn.querySelector('input[type="email"], input[name="email"]');
    const passwordInput = formSignIn.querySelector('input[type="password"], input[name="password"]');
    const submitBtn = formSignIn.querySelector('[type="submit"]');

    const email = emailInput?.value.trim() || '';
    const password = passwordInput?.value || '';

    if (!email) {
      showMessage(messageEl, 'Please enter your email address.', 'error');
      emailInput?.focus();
      return;
    }
    if (!isValidEmail(email)) {
      showMessage(messageEl, 'Please enter a valid email address.', 'error');
      emailInput?.focus();
      return;
    }
    if (!password) {
      showMessage(messageEl, 'Please enter your password.', 'error');
      passwordInput?.focus();
      return;
    }

    submitBtn && (submitBtn.disabled = true);
    submitBtn && (submitBtn.textContent = 'Signing in…');

    try {
      const result = await apiPost('/auth/signin/', { email, password });
      if (result.success) {
        showMessage(messageEl, 'Signed in successfully! Redirecting…', 'success');
        setTimeout(() => {
          window.location.href = result.redirect || '/';
        }, 800);
      } else {
        showMessage(messageEl, result.error || 'Invalid email or password.', 'error');
        submitBtn && (submitBtn.disabled = false);
        submitBtn && (submitBtn.textContent = 'Sign In');
      }
    } catch (err) {
      showMessage(messageEl, 'Network error. Please try again.', 'error');
      submitBtn && (submitBtn.disabled = false);
      submitBtn && (submitBtn.textContent = 'Sign In');
    }
  });

  // ── Sign-Up form submission ──
  formSignUp?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = formSignUp.querySelector('input[name="name"], input[type="text"]');
    const emailInput = formSignUp.querySelector('input[type="email"], input[name="email"]');
    const passwordInput = formSignUp.querySelector('input[name="password"]');
    const confirmInput = formSignUp.querySelector('input[name="confirm_password"], input[name="password2"]');
    const submitBtn = formSignUp.querySelector('[type="submit"]');

    const name = nameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const password = passwordInput?.value || '';
    const confirm = confirmInput?.value || '';

    if (!name) {
      showMessage(messageEl, 'Please enter your name.', 'error');
      nameInput?.focus();
      return;
    }
    if (!email || !isValidEmail(email)) {
      showMessage(messageEl, 'Please enter a valid email address.', 'error');
      emailInput?.focus();
      return;
    }
    if (password.length < 8) {
      showMessage(messageEl, 'Password must be at least 8 characters.', 'error');
      passwordInput?.focus();
      return;
    }
    if (confirmInput && password !== confirm) {
      showMessage(messageEl, 'Passwords do not match.', 'error');
      confirmInput?.focus();
      return;
    }

    submitBtn && (submitBtn.disabled = true);
    submitBtn && (submitBtn.textContent = 'Creating account…');

    try {
      const result = await apiPost('/auth/signup/', { name, email, password });
      if (result.success) {
        showMessage(messageEl, 'Account created! Redirecting…', 'success');
        setTimeout(() => {
          window.location.href = result.redirect || '/';
        }, 800);
      } else {
        showMessage(messageEl, result.error || 'Could not create account. Please try again.', 'error');
        submitBtn && (submitBtn.disabled = false);
        submitBtn && (submitBtn.textContent = 'Sign Up');
      }
    } catch (err) {
      showMessage(messageEl, 'Network error. Please try again.', 'error');
      submitBtn && (submitBtn.disabled = false);
      submitBtn && (submitBtn.textContent = 'Sign Up');
    }
  });
}

/* ============================================================
   PORTFOLIO — Auto-save helper
   ============================================================ */
async function saveSection(section, data) {
  try {
    await apiPost('/portfolio/save/', { section, data });
  } catch (err) {
    console.warn('Auto-save failed for section:', section, err);
  }
}

/* ============================================================
   PORTFOLIO — Academic Form
   ============================================================ */
function initAcademicForm() {
  const form = document.getElementById('academic-form') || document.querySelector('[data-section="academic"]');
  if (!form) return;

  // ── SAT section ──
  const satMath = form.querySelector('[name="sat_math"]');
  const satErw = form.querySelector('[name="sat_erw"]');
  const satTotal = form.querySelector('.sat-total');

  function updateSATTotal() {
    const math = parseInt(satMath?.value) || 0;
    const erw = parseInt(satErw?.value) || 0;
    if (satTotal) {
      satTotal.textContent = math + erw > 0 ? `SAT Total: ${math + erw}` : 'SAT Total: —';
    }
  }

  function clampSATField(input, min, max) {
    if (!input) return;
    input.addEventListener('input', () => {
      let val = parseInt(input.value);
      if (!isNaN(val)) {
        // Round to nearest 10
        val = Math.round(val / 10) * 10;
        val = Math.min(Math.max(val, min), max);
        input.value = val;
      }
      updateSATTotal();
      debouncedSave();
    });
  }

  clampSATField(satMath, 200, 800);
  clampSATField(satErw, 200, 800);
  updateSATTotal();

  // ── IELTS section ──
  const ieltsListening = form.querySelector('[name="ielts_listening"]');
  const ieltsReading = form.querySelector('[name="ielts_reading"]');
  const ieltsWriting = form.querySelector('[name="ielts_writing"]');
  const ieltsSpeaking = form.querySelector('[name="ielts_speaking"]');
  const ieltsBand = form.querySelector('.ielts-band');

  function updateIELTSBand() {
    const l = parseFloat(ieltsListening?.value) || 0;
    const r = parseFloat(ieltsReading?.value) || 0;
    const w = parseFloat(ieltsWriting?.value) || 0;
    const s = parseFloat(ieltsSpeaking?.value) || 0;

    if (l + r + w + s > 0) {
      const avg = (l + r + w + s) / 4;
      // Round to nearest 0.5
      const band = Math.round(avg * 2) / 2;
      if (ieltsBand) ieltsBand.textContent = `Overall Band: ${band.toFixed(1)}`;
    } else {
      if (ieltsBand) ieltsBand.textContent = 'Overall Band: —';
    }
  }

  function clampIELTSField(input) {
    if (!input) return;
    input.addEventListener('input', () => {
      let val = parseFloat(input.value);
      if (!isNaN(val)) {
        val = Math.min(Math.max(val, 0), 9);
        // Round to nearest 0.5
        val = Math.round(val * 2) / 2;
        input.value = val;
      }
      updateIELTSBand();
      debouncedSave();
    });
  }

  clampIELTSField(ieltsListening);
  clampIELTSField(ieltsReading);
  clampIELTSField(ieltsWriting);
  clampIELTSField(ieltsSpeaking);
  updateIELTSBand();

  // ── Add Certificate button ──
  const certList = form.querySelector('.certificate-list');
  const addCertBtn = form.querySelector('.add-certificate-btn');

  function createCertificateField(value = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'certificate-item';
    wrapper.innerHTML = `
      <textarea class="form-textarea" name="certificate[]" rows="2" placeholder="e.g. Cambridge B2 First — Score 178, June 2024">${value}</textarea>
      <button type="button" class="delete-field-btn" aria-label="Remove certificate">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    wrapper.querySelector('.delete-field-btn').addEventListener('click', () => {
      wrapper.remove();
      debouncedSave();
    });
    wrapper.querySelector('textarea').addEventListener('input', debouncedSave);
    return wrapper;
  }

  addCertBtn?.addEventListener('click', () => {
    if (!certList) return;
    certList.appendChild(createCertificateField());
    certList.lastElementChild?.querySelector('textarea')?.focus();
  });

  // Init existing certificate fields
  certList?.querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', debouncedSave);
  });

  // ── Debounced auto-save ──
  const debouncedSave = debounce(() => {
    const certs = [];
    certList?.querySelectorAll('textarea').forEach(ta => {
      if (ta.value.trim()) certs.push(ta.value.trim());
    });

    saveSection('academic', {
      sat_math: satMath?.value || '',
      sat_erw: satErw?.value || '',
      ielts_listening: ieltsListening?.value || '',
      ielts_reading: ieltsReading?.value || '',
      ielts_writing: ieltsWriting?.value || '',
      ielts_speaking: ieltsSpeaking?.value || '',
      certificates: certs,
    });
  }, 1000);

  // Wire remaining inputs
  [satMath, satErw, ieltsListening, ieltsReading, ieltsWriting, ieltsSpeaking].forEach(el => {
    if (el && !el._manzilBound) {
      el._manzilBound = true;
      el.addEventListener('input', debouncedSave);
    }
  });

  // Form-level submit handling
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn && (submitBtn.disabled = true);
    submitBtn && (submitBtn.textContent = 'Saving…');
    // Trigger an immediate save then navigate
    const certs = [];
    certList?.querySelectorAll('textarea').forEach(ta => {
      if (ta.value.trim()) certs.push(ta.value.trim());
    });
    try {
      const result = await apiPost('/portfolio/save/', {
        section: 'academic',
        data: {
          sat_math: satMath?.value || '',
          sat_erw: satErw?.value || '',
          ielts_listening: ieltsListening?.value || '',
          ielts_reading: ieltsReading?.value || '',
          ielts_writing: ieltsWriting?.value || '',
          ielts_speaking: ieltsSpeaking?.value || '',
          certificates: certs,
        }
      });
      if (result.redirect) window.location.href = result.redirect;
    } catch (err) {
      submitBtn && (submitBtn.disabled = false);
      submitBtn && (submitBtn.textContent = 'Save & Continue');
    }
  });
}

/* ============================================================
   PORTFOLIO — Extracurricular Form
   ============================================================ */
function initExtracurricularForm() {
  const form = document.getElementById('extracurricular-form') || document.querySelector('[data-section="extracurricular"]');
  if (!form) return;

  const activityList = form.querySelector('.activity-list');
  const addBtn = form.querySelector('.add-activity-btn');

  const debouncedSave = debounce(() => {
    const activities = [];
    activityList?.querySelectorAll('textarea').forEach(ta => {
      if (ta.value.trim()) activities.push(ta.value.trim());
    });
    saveSection('extracurricular', { activities });
  }, 1000);

  function createActivityField(value = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'activity-item';
    wrapper.innerHTML = `
      <textarea class="form-textarea" name="activity[]" rows="2" placeholder="e.g. Debate Club President — 2 years, regional finalist 2023">${value}</textarea>
      <button type="button" class="delete-field-btn" aria-label="Remove activity">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    wrapper.querySelector('.delete-field-btn').addEventListener('click', () => {
      wrapper.remove();
      debouncedSave();
    });
    wrapper.querySelector('textarea').addEventListener('input', debouncedSave);
    return wrapper;
  }

  // Init existing fields
  activityList?.querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', debouncedSave);
    // Attach delete button if the wrapper already has one (server-rendered)
    const delBtn = ta.closest('.activity-item')?.querySelector('.delete-field-btn');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        ta.closest('.activity-item')?.remove();
        debouncedSave();
      });
    }
  });

  addBtn?.addEventListener('click', () => {
    if (!activityList) return;
    activityList.appendChild(createActivityField());
    activityList.lastElementChild?.querySelector('textarea')?.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn && (submitBtn.disabled = true);
    submitBtn && (submitBtn.textContent = 'Saving…');
    const activities = [];
    activityList?.querySelectorAll('textarea').forEach(ta => {
      if (ta.value.trim()) activities.push(ta.value.trim());
    });
    try {
      const result = await apiPost('/portfolio/save/', { section: 'extracurricular', data: { activities } });
      if (result.redirect) window.location.href = result.redirect;
    } catch (err) {
      submitBtn && (submitBtn.disabled = false);
      submitBtn && (submitBtn.textContent = 'Save & Continue');
    }
  });
}

/* ============================================================
   PORTFOLIO — Awards Form
   ============================================================ */
function initAwardsForm() {
  const form = document.getElementById('awards-form') || document.querySelector('[data-section="awards"]');
  if (!form) return;

  const awardList = form.querySelector('.award-list');
  const addBtn = form.querySelector('.add-award-btn');

  const debouncedSave = debounce(() => {
    const awards = [];
    awardList?.querySelectorAll('textarea').forEach(ta => {
      if (ta.value.trim()) awards.push(ta.value.trim());
    });
    saveSection('awards', { awards });
  }, 1000);

  function createAwardField(value = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'award-item';
    wrapper.innerHTML = `
      <textarea class="form-textarea" name="award[]" rows="2" placeholder="e.g. National Physics Olympiad — 2nd place, 2023">${value}</textarea>
      <button type="button" class="delete-field-btn" aria-label="Remove award">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    wrapper.querySelector('.delete-field-btn').addEventListener('click', () => {
      wrapper.remove();
      debouncedSave();
    });
    wrapper.querySelector('textarea').addEventListener('input', debouncedSave);
    return wrapper;
  }

  // Init existing fields
  awardList?.querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', debouncedSave);
    const delBtn = ta.closest('.award-item')?.querySelector('.delete-field-btn');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        ta.closest('.award-item')?.remove();
        debouncedSave();
      });
    }
  });

  addBtn?.addEventListener('click', () => {
    if (!awardList) return;
    awardList.appendChild(createAwardField());
    awardList.lastElementChild?.querySelector('textarea')?.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn && (submitBtn.disabled = true);
    submitBtn && (submitBtn.textContent = 'Saving…');
    const awards = [];
    awardList?.querySelectorAll('textarea').forEach(ta => {
      if (ta.value.trim()) awards.push(ta.value.trim());
    });
    try {
      const result = await apiPost('/portfolio/save/', { section: 'awards', data: { awards } });
      if (result.redirect) window.location.href = result.redirect;
    } catch (err) {
      submitBtn && (submitBtn.disabled = false);
      submitBtn && (submitBtn.textContent = 'Save & Continue');
    }
  });
}

/* ============================================================
   PORTFOLIO — Subject & Grade Selection
   ============================================================ */
function initSubjectSelect() {
  const subjectChips = document.querySelectorAll('.subject-chip');
  const gradeButtons = document.querySelectorAll('.grade-btn');

  let selectedSubject = null;
  let selectedGrade = null;

  const debouncedSave = debounce(() => {
    saveSection('subject', { subject: selectedSubject, grade: selectedGrade });
  }, 1000);

  // ── Subject chips — radio behaviour ──
  subjectChips.forEach(chip => {
    chip.addEventListener('click', () => {
      subjectChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedSubject = chip.dataset.subject || chip.textContent.trim();
      debouncedSave();
    });
  });

  // ── Grade buttons — radio behaviour ──
  gradeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      gradeButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedGrade = btn.dataset.grade || btn.textContent.trim();
      debouncedSave();
    });
  });

  // Restore pre-selected state from data attributes if present
  subjectChips.forEach(chip => {
    if (chip.dataset.selected === 'true' || chip.classList.contains('selected')) {
      selectedSubject = chip.dataset.subject || chip.textContent.trim();
    }
  });
  gradeButtons.forEach(btn => {
    if (btn.dataset.selected === 'true' || btn.classList.contains('selected')) {
      selectedGrade = btn.dataset.grade || btn.textContent.trim();
    }
  });

  // Form submit
  const form = document.getElementById('subject-form') || document.querySelector('[data-section="subject"]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn && (submitBtn.disabled = true);
    submitBtn && (submitBtn.textContent = 'Saving…');
    try {
      const result = await apiPost('/portfolio/save/', { section: 'subject', data: { subject: selectedSubject, grade: selectedGrade } });
      if (result.redirect) window.location.href = result.redirect;
    } catch (err) {
      submitBtn && (submitBtn.disabled = false);
      submitBtn && (submitBtn.textContent = 'Save & Continue');
    }
  });
}

/* ============================================================
   PORTFOLIO COMPLETE — loading animation
   ============================================================ */
function initPortfolioComplete() {
  const circle = document.querySelector('.loading-circle');
  const text = document.querySelector('.complete-text');
  const analyzeBtn = document.querySelector('.analyze-btn');

  // 1.5 s spinning, then morph to checkmark, then show text and button
  setTimeout(() => {
    circle?.classList.add('done');
  }, 1500);

  setTimeout(() => {
    text?.classList.add('visible');
  }, 2200);

  setTimeout(() => {
    analyzeBtn?.classList.add('visible');
  }, 3000);
}

/* ============================================================
   DELETE PORTFOLIO
   ============================================================ */
async function deletePortfolio() {
  if (!confirm('Delete your current portfolio? This will clear your university selection and roadmap.')) return;
  const result = await apiPost('/portfolio/delete/', {});
  if (result.success) window.location.href = result.redirect;
}

/* ============================================================
   ROADMAP — Checkboxes + Progress
   ============================================================ */
function initRoadmap() {
  const checkboxes = document.querySelectorAll('.task-checkbox');
  const savedState = JSON.parse(localStorage.getItem('manzil_roadmap') || '{}');

  checkboxes.forEach(cb => {
    const taskId = cb.dataset.taskId;
    if (savedState[taskId]) {
      cb.checked = true;
      cb.closest('.task-item')?.classList.add('completed');
    }

    cb.addEventListener('change', () => {
      savedState[taskId] = cb.checked;
      localStorage.setItem('manzil_roadmap', JSON.stringify(savedState));
      cb.closest('.task-item')?.classList.toggle('completed', cb.checked);
      updateProgress();
    });
  });

  updateProgress();

  // ── Category filter tabs ──
  const filterBtns = document.querySelectorAll('.roadmap-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.dataset.category;
      const taskItems = document.querySelectorAll('.task-item');
      taskItems.forEach(item => {
        if (!category || category === 'all') {
          item.hidden = false;
        } else {
          item.hidden = item.dataset.category !== category;
        }
      });
    });
  });
}

function updateProgress() {
  const total = document.querySelectorAll('.task-checkbox').length;
  const done = document.querySelectorAll('.task-checkbox:checked').length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const bar = document.querySelector('.progress-fill');
  const label = document.querySelector('.progress-label');
  const pctLabel = document.querySelector('.progress-pct');

  if (bar) bar.style.width = pct + '%';
  if (label) label.textContent = `${done} / ${total} tasks completed`;
  if (pctLabel) pctLabel.textContent = `${pct}%`;
}

/* ============================================================
   DOM READY — Route by page
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (page === 'auth') initAuth();
  if (page === 'portfolio-academic') initAcademicForm();
  if (page === 'portfolio-extracurricular') initExtracurricularForm();
  if (page === 'portfolio-awards') initAwardsForm();
  if (page === 'portfolio-subject') initSubjectSelect();
  if (page === 'portfolio-complete') initPortfolioComplete();
  if (page === 'roadmap') initRoadmap();

  // Expose delete helper globally so inline onclick handlers can reach it
  window.deletePortfolio = deletePortfolio;
});
