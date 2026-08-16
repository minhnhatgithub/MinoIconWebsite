/**
 * MinoIcon - Main Web Engine & Interactive Icon Explorer
 * Extracted from MinoIcon C# WPF Desktop Engine (.NET 8.0)
 * Real-time search across 19+ styles, customizable color palette, SVG/JSX copy & PNG/ICO downloads.
 * Includes Full Dark Mode system & Dynamic Screenshot Switcher.
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeMode();
  initNavbarScroll();
  initMobileMenu();
  initIconSearchEngine();
  initFreeKeySection();
  initDownloadModal();
  initDonateModal();
  initFloatingWidgets();
  initSmoothScroll();
});

/* ==========================================================================
   1. DARK / LIGHT THEME MODE ENGINE & SCREENSHOT SWITCHER
   ========================================================================== */
function initThemeMode() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const screenshotImg = document.getElementById('appScreenshotImg');
  const themeModeLabel = document.getElementById('currentThemeLabel');

  // Check saved theme or system preference
  const savedTheme = localStorage.getItem('mino_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  let currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      showToast(nextTheme === 'dark' ? '🌙 Đã chuyển sang giao diện Dark Mode' : '☀️ Đã chuyển sang giao diện Light Mode');
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mino_theme', theme);

    // Update Toggle Button Icon
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      themeToggleBtn.title = theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối';
    }

    // Update Screenshot Image based on theme
    if (screenshotImg) {
      screenshotImg.style.opacity = '0.5';
      const targetSrc = theme === 'dark' ? 'assets/user_images/minoicon_app_dark.png' : 'assets/user_images/minoicon_app_light.png';
      
      const newImg = new Image();
      newImg.src = targetSrc;
      newImg.onload = () => {
        screenshotImg.src = targetSrc;
        screenshotImg.style.opacity = '1';
      };
      newImg.onerror = () => {
        screenshotImg.style.opacity = '1';
      };
    }

    // Update Theme Label Badge
    if (themeModeLabel) {
      themeModeLabel.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }
  }
}

/* ==========================================================================
   2. NAVBAR SCROLL
   ========================================================================== */
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar-wrapper');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* ==========================================================================
   2B. MOBILE MENU (HAMBURGER)
   ========================================================================== */
function initMobileMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenuDrawer = document.getElementById('mobileMenuDrawer');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (!hamburgerBtn || !mobileMenuDrawer) return;

  hamburgerBtn.addEventListener('click', () => {
    mobileMenuDrawer.classList.toggle('active');
    hamburgerBtn.classList.toggle('active');
  });

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuDrawer.classList.remove('active');
      hamburgerBtn.classList.remove('active');
    });
  });
}

/* ==========================================================================
   3. REAL-TIME ICON SEARCH ENGINE (SYNCED WITH MINOICON DESKTOP)
   ========================================================================== */

// Curated Fallback Demo Icons matching MinoIcon default launch
const DEFAULT_DEMO_ICONS = [
  { id: '118497', name: 'Sparkling Star', commonName: 'sparkling', platform: 'fluent', isColor: true },
  { id: '98957', name: 'User Profile', commonName: 'user', platform: 'ios7', isColor: false },
  { id: '114322', name: 'Smart Home', commonName: 'home', platform: 'fluent', isColor: true },
  { id: '98964', name: 'Search Lens', commonName: 'search', platform: 'ios7', isColor: false },
  { id: '117145', name: 'Cloud Vector', commonName: 'cloud', platform: 'nolan', isColor: true },
  { id: '111487', name: 'Shield Security', commonName: 'shield', platform: 'color', isColor: true },
  { id: '102558', name: 'Lightning Bolt', commonName: 'flash-on', platform: 'material', isColor: false },
  { id: '113840', name: 'Heart Favorite', commonName: 'heart', platform: 'fluent', isColor: true },
  { id: '100413', name: 'Settings Gear', commonName: 'settings', platform: 'ios7', isColor: false },
  { id: '115340', name: 'Folder Assets', commonName: 'folder', platform: 'office40', isColor: true },
  { id: '114872', name: 'Shopping Cart', commonName: 'shopping-cart', platform: 'color', isColor: true },
  { id: '116982', name: 'Palette Colors', commonName: 'paint-palette', platform: 'fluent', isColor: true },
  { id: '101412', name: 'Code Brackets', commonName: 'code', platform: 'm_outlined', isColor: false },
  { id: '112450', name: 'Camera Photo', commonName: 'camera', platform: 'color', isColor: true },
  { id: '117890', name: 'Music Note', commonName: 'musical-notes', platform: 'nolan', isColor: true },
  { id: '114560', name: 'Rocket Launch', commonName: 'rocket', platform: 'fluent', isColor: true }
];

let currentSearchTerm = 'home';
let currentPlatform = 'all';
let currentCategory = 'all';
let currentColorHex = '2563EB';
let searchDebounceTimer = null;

function initIconSearchEngine() {
  const container = document.getElementById('iconsGridContainer');
  const searchInput = document.getElementById('iconSearchInput');
  const styleSelect = document.getElementById('styleSelectDropdown');
  const colorInput = document.getElementById('recolorInput');
  const filterButtons = document.querySelectorAll('.filter-btn');

  if (!container) return;

  // Initial fetch
  fetchLiveIcons(currentSearchTerm, currentPlatform);

  // Search input with debounce
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        const query = e.target.value.trim();
        currentSearchTerm = query || 'home';
        fetchLiveIcons(currentSearchTerm, currentPlatform);
      }, 350);
    });
  }

  // Style selector change
  if (styleSelect) {
    styleSelect.addEventListener('change', (e) => {
      currentPlatform = e.target.value;
      fetchLiveIcons(currentSearchTerm, currentPlatform);
    });
  }

  // Color picker change
  if (colorInput) {
    colorInput.addEventListener('input', (e) => {
      currentColorHex = e.target.value.replace('#', '');
      recolorMonochromeIcons();
    });
  }

  // Category filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter') || 'all';
      currentCategory = cat;
      if (cat !== 'all') {
        currentSearchTerm = cat;
        if (searchInput) searchInput.value = cat;
      } else {
        currentSearchTerm = 'home';
        if (searchInput) searchInput.value = '';
      }
      fetchLiveIcons(currentSearchTerm, currentPlatform);
    });
  });
}

async function fetchLiveIcons(term, platform) {
  const container = document.getElementById('iconsGridContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b;">
      <div style="font-size: 2rem; animation: spin 1s linear infinite; display: inline-block;">⏳</div>
      <p style="margin-top: 8px; font-weight: 600;">Đang kết nối kho 500,000+ Icon...</p>
    </div>
  `;

  try {
    const platformParam = platform === 'all' ? 'all' : platform;
    const url = `https://search.icons8.com/api/iconsets/v5/search?term=${encodeURIComponent(term)}&amount=36&offset=0&platform=${platformParam}&isAnimated=false&language=en`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('API Network Response was not ok');
    const data = await response.json();

    if (data.icons && data.icons.length > 0) {
      renderIconList(data.icons);
    } else {
      renderEmptyState(term);
    }
  } catch (err) {
    console.warn('Using offline/cached demo icons:', err);
    // Fallback to demo items
    const filtered = DEFAULT_DEMO_ICONS.filter(i => 
      (platform === 'all' || i.platform === platform) &&
      (term === 'home' || i.name.toLowerCase().includes(term.toLowerCase()) || i.commonName.toLowerCase().includes(term.toLowerCase()))
    );
    renderIconList(filtered.length > 0 ? filtered : DEFAULT_DEMO_ICONS);
  }
}

function renderIconList(icons) {
  const container = document.getElementById('iconsGridContainer');
  if (!container) return;

  container.innerHTML = '';

  icons.forEach(icon => {
    const isColor = icon.isColor !== undefined ? icon.isColor : true;
    const colorParam = (!isColor && currentColorHex) ? `&color=${currentColorHex}` : '';
    const imgUrl = `https://img.icons8.com/?size=96&id=${icon.id}&format=png${colorParam}`;
    const svgUrl = `https://img.icons8.com/${icon.platform}/${icon.commonName || icon.name}.svg`;

    const tile = document.createElement('div');
    tile.className = 'icon-tile-item';
    tile.setAttribute('data-id', icon.id);
    tile.setAttribute('data-name', icon.name || icon.commonName);
    tile.setAttribute('data-platform', icon.platform || 'vector');
    tile.setAttribute('data-iscolor', isColor);

    tile.innerHTML = `
      <img class="icon-tile-img" src="${imgUrl}" alt="${icon.name}" loading="lazy" onerror="this.src='https://img.icons8.com/color/96/${icon.commonName || 'star'}.png'">
      <span class="icon-tile-name">${icon.name || icon.commonName}</span>
      <span class="icon-tile-style-tag">${(icon.platform || 'vector').toUpperCase()}</span>
      <div class="tile-action-overlay">
        <button class="tile-action-btn" data-action="copy-svg">Copy SVG</button>
        <button class="tile-action-btn" data-action="copy-jsx">Copy JSX</button>
        <button class="tile-action-btn" data-action="download-png">Tải PNG (96px)</button>
      </div>
    `;

    // Button interactions
    tile.querySelectorAll('.tile-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        handleIconAction(icon, action, imgUrl, svgUrl);
      });
    });

    container.appendChild(tile);
  });
}

function renderEmptyState(term) {
  const container = document.getElementById('iconsGridContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: #64748b;">
      <p style="font-weight: 700; font-size: 1.15rem; color: #0f172a;">Không tìm thấy icon nào với từ khóa "${term}"</p>
      <p style="font-size: 0.875rem; margin-top: 6px;">Thử tìm kiếm với các từ khóa phổ biến: <em>user, star, heart, search, settings, chart, cloud, code</em>...</p>
    </div>
  `;
}

function recolorMonochromeIcons() {
  document.querySelectorAll('.icon-tile-item').forEach(tile => {
    const isColor = tile.getAttribute('data-iscolor') === 'true';
    if (!isColor) {
      const id = tile.getAttribute('data-id');
      const img = tile.querySelector('.icon-tile-img');
      if (img && id) {
        img.src = `https://img.icons8.com/?size=96&id=${id}&format=png&color=${currentColorHex}`;
      }
    }
  });
}

async function handleIconAction(icon, action, imgUrl, svgUrl) {
  const name = icon.name || icon.commonName || 'Icon';

  if (action === 'copy-svg') {
    try {
      const resp = await fetch(svgUrl);
      if (resp.ok) {
        const svgCode = await resp.text();
        await navigator.clipboard.writeText(svgCode);
        showToast(`✨ Đã sao chép mã SVG của "${name}"!`);
        return;
      }
    } catch { }

    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><image width="48" height="48" href="${imgUrl}"/></svg>`;
    await navigator.clipboard.writeText(fallbackSvg);
    showToast(`✨ Đã sao chép mã nhúng SVG của "${name}"!`);
  } else if (action === 'copy-jsx') {
    const cleanCompName = name.replace(/[^a-zA-Z0-9]/g, '') + 'Icon';
    const jsxCode = `import React from 'react';\n\nexport const ${cleanCompName} = ({ size = 24, className = "" }) => (\n  <img src="${imgUrl}" width={size} height={size} alt="${name}" className={className} />\n);`;
    await navigator.clipboard.writeText(jsxCode);
    showToast(`⚡ Đã sao chép React / Next.js JSX Component của "${name}"!`);
  } else if (action === 'download-png') {
    const link = document.createElement('a');
    link.href = imgUrl;
    link.download = `MinoIcon_${name}_${icon.platform || 'icon'}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`🚀 Đang tải icon PNG "${name}" về máy...`);
  }
}

/* ==========================================================================
   4. TOAST NOTIFICATION
   ========================================================================== */
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-alert';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => { toast.classList.add('show'); }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 400);
  }, 3200);
}

/* ==========================================================================
   5. DOWNLOAD MODAL & REAL DESKTOP PACKAGE
   ========================================================================== */
function initDownloadModal() {
  const modal = document.getElementById('downloadModal');
  const openButtons = document.querySelectorAll('.trigger-download-modal');
  const closeBtn = modal?.querySelector('.modal-close-btn');
  const osOptions = document.querySelectorAll('.os-option-card');
  const startDownloadBtn = document.getElementById('startDownloadBtn');

  if (!modal) return;

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  osOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      osOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const osName = opt.getAttribute('data-os');
      if (startDownloadBtn) {
        startDownloadBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Tải MinoIcon cho ${osName} (v1.0.0 Portable)
        `;
      }
    });
  });

  if (startDownloadBtn) {
    startDownloadBtn.addEventListener('click', () => {
      showToast('🎉 Đang tải gói cài đặt MinoIcon Desktop v1.0...');
      
      const link = document.createElement('a');
      link.href = 'downloads/MinoIcon-Desktop-v1.0.zip';
      link.download = 'MinoIcon-Desktop-v1.0.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        modal.classList.remove('active');
        showToast('✅ Tải xuống hoàn tất! Hãy giải nén và mở MinoIcon.exe.');
      }, 1500);
    });
  }
}

/* ==========================================================================
   6. DONATE MODAL
   ========================================================================== */
function initDonateModal() {
  const donateModal = document.getElementById('donateModal');
  const donateBtns = document.querySelectorAll('.trigger-donate-modal');
  const closeBtn = donateModal?.querySelector('.modal-close-btn');

  if (!donateModal) return;

  donateBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      donateModal.classList.add('active');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      donateModal.classList.remove('active');
    });
  }

  donateModal.addEventListener('click', (e) => {
    if (e.target === donateModal) {
      donateModal.classList.remove('active');
    }
  });

  const copyBankBtn = document.getElementById('copyBankBtn');
  if (copyBankBtn) {
    copyBankBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('5966866868').then(() => {
        showToast('✅ Đã sao chép STK: 5966866868 (MB Bank - LE PHAM MINH NHAT)!');
      });
    });
  }
}

/* ==========================================================================
   7. FREE KEY ENGINE (COUNTDOWN & COPY)
   ========================================================================== */
function initFreeKeySection() {
  const copyKeyBtn = document.getElementById('copyKeyBtn');
  const keyCodeElement = document.getElementById('keyCodeText');
  const countdownElement = document.getElementById('keyCountdownVal');
  const expiryDateElement = document.getElementById('keyExpiryDateText');

  // Key Expiry: 7-day cycle (1 week) based on current epoch
  const CYCLE_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const currentWeekEpoch = Math.floor(now / CYCLE_MS);
  const nextExpiry = (currentWeekEpoch + 1) * CYCLE_MS;

  // Generate deterministic random key based on current week
  function generateWeeklyKey(weekNumber) {
    let seed = weekNumber * 9876543; // Salt
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'MINO-';
    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        seed = (1664525 * seed + 1013904223) % 4294967296;
        const randomIdx = Math.floor((seed / 4294967296) * chars.length);
        segment += chars[randomIdx];
      }
      key += segment + (i < 2 ? '-' : '');
    }
    return key;
  }

  if (keyCodeElement) {
    keyCodeElement.textContent = generateWeeklyKey(currentWeekEpoch);
  }

  // Format Expiry Date (DD/MM/YYYY)
  if (expiryDateElement) {
    const expDate = new Date(nextExpiry);
    const day = String(expDate.getDate()).padStart(2, '0');
    const month = String(expDate.getMonth() + 1).padStart(2, '0');
    const year = expDate.getFullYear();
    expiryDateElement.textContent = `Hiệu lực đến ${day}/${month}/${year} • Đổi mỗi tuần (7 ngày) • Miễn phí hoàn toàn`;
  }

  // Live Real-Time Countdown Timer (Every Second)
  function updateCountdown() {
    if (!countdownElement) return;
    const diff = Math.max(0, nextExpiry - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
    const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

    countdownElement.textContent = `${days} ngày ${hours}:${minutes}:${seconds}`;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Copy Key Button
  if (copyKeyBtn && keyCodeElement) {
    copyKeyBtn.addEventListener('click', () => {
      const keyCode = keyCodeElement.textContent.trim();
      navigator.clipboard.writeText(keyCode).then(() => {
        showToast(`🔑 Đã sao chép Key: ${keyCode}`);
        const originalText = copyKeyBtn.innerHTML;
        copyKeyBtn.innerHTML = `✅ Đã sao chép!`;
        setTimeout(() => {
          copyKeyBtn.innerHTML = originalText;
        }, 2000);
      });
    });
  }
}

/* ==========================================================================
   8. FLOATING WIDGETS (BACK TO TOP)
   ========================================================================== */
function initFloatingWidgets() {
  const backToTopBtn = document.getElementById('backToTopBtn');

  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   8. SMOOTH SCROLL
   ========================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
