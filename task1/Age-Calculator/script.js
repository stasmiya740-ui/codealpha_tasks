const dobInput = document.getElementById('dob');
const ageForm = document.getElementById('ageForm');
const yearsEl = document.getElementById('years');
const monthsEl = document.getElementById('months');
const daysEl = document.getElementById('days');
const totalDaysEl = document.getElementById('totalDays');
const nextBirthdayEl = document.getElementById('nextBirthday');
const ageSummary = document.getElementById('ageSummary');
const toastContainer = document.getElementById('toastContainer');
const themeToggle = document.getElementById('themeToggle');
const currentDateEl = document.getElementById('currentDate');
const currentTimeEl = document.getElementById('currentTime');
const resetBtn = document.getElementById('resetBtn');
const loader = document.getElementById('loader');
const customCursor = document.getElementById('customCursor');

const storageKey = 'ageCalculatorDarkMode';

let audioContext;

function initializeTheme() {
  const userPref = localStorage.getItem(storageKey);
  const isDark = userPref === 'dark' || (!userPref && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.body.classList.add('dark-mode');
  }
}

function playClickSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.18);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem(storageKey, isDark ? 'dark' : 'light');
  createToast(`Switched to ${isDark ? 'Dark' : 'Light'} mode`, 'success');
}

function createToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(24px)';
  }, 2600);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function getFormattedDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function getFormattedTime(date) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });
}

function refreshClock() {
  const now = new Date();
  currentDateEl.textContent = getFormattedDate(now);
  currentTimeEl.textContent = getFormattedTime(now);
}

function resetResults() {
  yearsEl.textContent = '0';
  monthsEl.textContent = '0';
  daysEl.textContent = '0';
  totalDaysEl.textContent = '🗓 Total Days Lived: --';
  nextBirthdayEl.textContent = '🎉 Next Birthday in: -- days';
  ageSummary.textContent = 'Complete details are shown below.';
}

function setLoading(loading) {
  if (loading) {
    loader.classList.add('visible');
    dobInput.disabled = true;
    resetBtn.disabled = true;
  } else {
    loader.classList.remove('visible');
    dobInput.disabled = false;
    resetBtn.disabled = false;
  }
}

let targetX = window.innerWidth / 2;
let targetY = window.innerHeight / 2;
let currentX = targetX;
let currentY = targetY;

function initCustomCursor() {
  if (!customCursor) return;

  window.addEventListener('mousemove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  document.querySelectorAll('button, a, input, .toggle-btn').forEach((element) => {
    element.addEventListener('mouseenter', () => customCursor.classList.add('cursor-active'));
    element.addEventListener('mouseleave', () => customCursor.classList.remove('cursor-active'));
  });

  function animateCursor() {
    currentX += (targetX - currentX) * 0.18;
    currentY += (targetY - currentY) * 0.18;
    customCursor.style.left = `${currentX}px`;
    customCursor.style.top = `${currentY}px`;
    requestAnimationFrame(animateCursor);
  }

  animateCursor();
}

function calculateAge() {
  setLoading(true);
  playClickSound();

  setTimeout(() => {
    const dob = dobInput.value;
    if (!dob) {
      setLoading(false);
      createToast('Please select your date of birth.', 'error');
      dobInput.focus();
      return;
    }

    const birthDate = new Date(dob);
    const today = new Date();

    if (birthDate > today) {
      setLoading(false);
      createToast('Birth date cannot be in the future.', 'error');
      return;
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += previousMonth;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    yearsEl.textContent = years;
    monthsEl.textContent = months;
    daysEl.textContent = days;

    const diffTime = today - birthDate;
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    totalDaysEl.textContent = `🗓 Total Days Lived: ${totalDays.toLocaleString()}`;

    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (today > nextBirthday) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffBirthday = nextBirthday - today;
    const daysLeft = Math.ceil(diffBirthday / (1000 * 60 * 60 * 24));
    nextBirthdayEl.textContent = `🎉 Next Birthday in: ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;

    ageSummary.textContent = `You are ${years} year${years === 1 ? '' : 's'}, ${months} month${months === 1 ? '' : 's'}, and ${days} day${days === 1 ? '' : 's'}.`;
    createToast('Age calculated successfully!', 'success');
    setLoading(false);
  }, 600);
}

ageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  playClickSound();
  calculateAge();
});

resetBtn.addEventListener('click', () => {
  playClickSound();
  dobInput.value = '';
  resetResults();
  createToast('Form cleared.', 'success');
});

themeToggle.addEventListener('click', () => {
  playClickSound();
  toggleTheme();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && document.activeElement === dobInput) {
    event.preventDefault();
    calculateAge();
  }

  if (event.key === 'Escape') {
    dobInput.value = '';
    resetResults();
  }
});

initializeTheme();
initFloatingParticles();
refreshClock();
setInterval(refreshClock, 1000);

function initFloatingParticles() {
  const field = document.getElementById('particleField');
  const count = 30;
  const sizes = ['small', 'medium', 'large'];

  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('div');
    const sizeClass = sizes[Math.floor(Math.random() * sizes.length)];
    dot.className = `particle ${sizeClass}`;

    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = Math.random() * -18;
    const hue = 180 + Math.random() * 60;
    const alpha = 0.18 + Math.random() * 0.35;

    dot.style.left = `${left}%`;
    dot.style.top = `${top}%`;
    dot.style.animationDelay = `${delay}s`;
    dot.style.background = `hsla(${hue}, 98%, 88%, ${alpha})`;

    field.appendChild(dot);
  }
}
