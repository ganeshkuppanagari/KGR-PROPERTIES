/* ============================
   KGR PROPERTIES – Main JS
   ============================ */

// ===== DATA STORE (localStorage-backed) =====
const DEFAULT_PROPERTIES = [
  {
    id: 1, title: "Prime Residential Plot – Tirupati East",
    type: "Land", location: "tirupati", area: "240 sq.yd.", price: "₹18 Lakhs",
    priceNum: 18, description: "Corner plot with 40ft road access near Balaji Nagar, fully residential approved, NALA conversion done, immediate registration.",
    image: "images/property_land1_1773396717189.png", mapLink: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30720.5!2d79.41!3d13.63!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4d!2sTirupati!5e0!3m2!1sen!2sin!4v16000000",
    contact: "8790283230", featured: true
  },
  {
    id: 2, title: "Modern 3BHK Villa – Alipiri Road",
    type: "House", location: "tirupati", area: "2200 sq.ft.", price: "₹72 Lakhs",
    priceNum: 72, description: "Fully furnished 3BHK villa with modular kitchen, terrace garden and 2-car parking. 500m from Alipiri Steps. Gated community.",
    image: "images/property_house1_1773396735129.png", mapLink: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30720.5!2d79.38!3d13.64!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4d!2sTirupati!5e0!3m2!1sen!2sin!4v16000001",
    contact: "8790283230", featured: true
  },
  {
    id: 3, title: "Commercial Building – Renigunta NH",
    type: "Building", location: "renigunta", area: "4500 sq.ft.", price: "₹1.2 Crore",
    priceNum: 120, description: "G+3 commercial complex on National Highway 716, suitable for showroom, office or hotel. High visibility frontage of 60 feet.",
    image: "images/property_building1_1773396752928.png", mapLink: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30720.5!2d79.50!3d13.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4d!2sRenigunta!5e0!3m2!1sen!2sin!4v16000002",
    contact: "8790283230", featured: true
  },
  {
    id: 4, title: "Agricultural Land – Srikalahasti",
    type: "Land", location: "srikalahasti", area: "3 Acres", price: "₹24 Lakhs",
    priceNum: 24, description: "Fertile red soil agricultural land with borewell, electricity connection and year-round water access. Suitable for farming or layout development.",
    image: "images/tirupati_hero_1773396591802.png", mapLink: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30720.5!2d79.70!3d13.64!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4d!2sSrikalahasti!5e0!3m2!1sen!2sin!4v16000003",
    contact: "8790283230", featured: true
  },
  {
    id: 5, title: "Residential Plot – Chandragiri",
    type: "Land", location: "chandragiri", area: "150 sq.yd.", price: "₹8 Lakhs",
    priceNum: 8, description: "DTCP approved gated community plot near Chandragiri Fort. Peaceful environment, ready for construction with water and electricity available.",
    image: "images/chandragiri_img_1773396680370.png", mapLink: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30720.5!2d79.31!3d13.58!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4d!2sChandragiri!5e0!3m2!1sen!2sin!4v16000004",
    contact: "8790283230", featured: false
  },
  {
    id: 6, title: "Budget Plot – Yerpedu Highway",
    type: "Land", location: "yerpedu", area: "100 sq.yd.", price: "₹5.5 Lakhs",
    priceNum: 5.5, description: "Fast-appreciating plot on Tirupati-Chennai highway side. Perfect investment opportunity. DTCP approved, clear title, paved road access.",
    image: "images/yerpedu_img_1773396696716.png", mapLink: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30720.5!2d79.42!3d13.69!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4d!2sYerpedu!5e0!3m2!1sen!2sin!4v16000005",
    contact: "8790283230", featured: false
  }
];

function getProperties() {
  const stored = localStorage.getItem('kgr_properties');
  if (!stored) {
    localStorage.setItem('kgr_properties', JSON.stringify(DEFAULT_PROPERTIES));
    return DEFAULT_PROPERTIES;
  }
  return JSON.parse(stored);
}

function saveProperties(props) {
  localStorage.setItem('kgr_properties', JSON.stringify(props));
}

// ===== INTRO ANIMATION =====
function runIntroAnimation() {
  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;
  const from = document.getElementById('intro-from');
  const to = document.getElementById('intro-to');
  const tagline = document.getElementById('intro-tagline');
  const barFill = document.getElementById('intro-bar-fill');

  if (sessionStorage.getItem('kgr_intro_done')) {
    overlay.classList.add('hidden');
    initPage();
    return;
  }

  // Start progress bar
  setTimeout(() => { if (barFill) barFill.style.width = '100%'; }, 100);
  // Show tagline
  setTimeout(() => { if (tagline) tagline.classList.add('visible'); }, 600);
  // Morph from "Land & Buildings" → "KGR PROPERTIES"
  setTimeout(() => {
    if (from) from.classList.add('morph-out');
    setTimeout(() => {
      if (to) to.classList.add('morph-in');
    }, 400);
  }, 1200);
  // Hide overlay
  setTimeout(() => {
    overlay.classList.add('hidden');
    sessionStorage.setItem('kgr_intro_done', '1');
    initPage();
  }, 3200);
}

// ===== YOUTUBE PLAYER =====
let ytPlayer;
function onYouTubeIframeAPIReady() {
  const container = document.getElementById('yt-player');
  if (!container) return;
  ytPlayer = new YT.Player('yt-player', {
    videoId: 'sCkUYyYtqRI',
    playerVars: {
      autoplay: 1, mute: 1, loop: 1,
      playlist: 'sCkUYyYtqRI',
      controls: 0, showinfo: 0, rel: 0,
      modestbranding: 1, iv_load_policy: 3,
      start: 60 // starts at 1 minute
    },
    events: {
      onReady: (e) => {
        e.target.mute();
        e.target.playVideo();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          e.target.seekTo(60);
          e.target.playVideo();
        }
      }
    }
  });
}

// ===== NAVBAR =====
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
  }
}

// ===== COUNTER ANIMATION =====
function animateCounters() {
  const counters = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.done) return;
      entry.target.dataset.done = 1;
      const target = parseInt(entry.target.dataset.target);
      const duration = 1800;
      const step = target / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        entry.target.textContent = Math.floor(current);
      }, 16);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  elements.forEach(el => observer.observe(el));
}

// ===== FEATURED PROPERTIES (async – Supabase or localStorage) =====
async function renderFeaturedProperties() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.4);"><i class="fa fa-spinner fa-spin" style="font-size:24px;"></i></div>';
  try {
    let props;
    if (typeof fetchProperties === 'function') {
      props = await fetchProperties({ featured: true });
    } else {
      props = getProperties().filter(p => p.featured);
    }
    const featured = props.filter(p => p.featured).slice(0, 3);
    grid.innerHTML = featured.length
      ? featured.map(p => propCardHTML(p, true)).join('')
      : '<p style="text-align:center;color:rgba(255,255,255,0.4);">No featured properties yet.</p>';
    initScrollAnimations();
  } catch(e) {
    const props = getProperties().filter(p => p.featured).slice(0, 3);
    grid.innerHTML = props.map(p => propCardHTML(p, true)).join('');
  }
}

function propCardHTML(p, dark = false) {
  const typeBadgeClass = {
    Land: 'badge-land', House: 'badge-house',
    Building: 'badge-building', Commercial: 'badge-commercial'
  }[p.type] || 'badge-land';
  return `
  <div class="prop-card animate-on-scroll" onclick="openModal(${p.id})">
    <div class="prop-img-wrap">
      <img src="${p.image}" alt="${p.title}" loading="lazy" />
      <span class="prop-type-badge ${typeBadgeClass}">${p.type}</span>
      <span class="prop-price-badge">${p.price}</span>
    </div>
    <div class="prop-body">
      <div class="prop-title">${p.title}</div>
      <div class="prop-loc"><i class="fa fa-map-marker-alt"></i> ${locationLabel(p.location)}</div>
      <div class="prop-details">
        <span class="prop-detail"><i class="fa fa-vector-square"></i> ${p.area}</span>
        <span class="prop-detail"><i class="fa fa-home"></i> ${p.type}</span>
      </div>
      <div class="prop-actions">
        <button class="btn-contact" onclick="event.stopPropagation(); callAgent('${p.contact}')"><i class="fa fa-phone"></i> Call Agent</button>
        <button class="btn-wa" onclick="event.stopPropagation(); waContact('${p.contact}','${p.title}')" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>
      </div>
    </div>
  </div>`;
}

function locationLabel(loc) {
  const labels = {
    tirupati: 'Tirupati', srikalahasti: 'Srikalahasti',
    venkatagiri: 'Venkatagiri', renigunta: 'Renigunta',
    chandragiri: 'Chandragiri', yerpedu: 'Yerpedu'
  };
  return labels[loc] || loc;
}

// ===== MODAL =====
let modalOverlay;
async function openModal(id) {
  // Try Supabase first, fall back to localStorage
  let p;
  if (typeof fetchProperties === 'function') {
    const props = await fetchProperties();
    p = props.find(x => String(x.id) === String(id));
  } else {
    p = getProperties().find(x => x.id === id);
  }
  if (!p) return;
  if (!modalOverlay) buildModal();
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hero">
      <img src="${p.image}" alt="${p.title}" />
      <span class="modal-type prop-type-badge ${getBadgeClass(p.type)}">${p.type}</span>
      <button class="modal-close" onclick="closeModal()"><i class="fa fa-times"></i></button>
    </div>
    <div class="modal-body">
      <h2>${p.title}</h2>
      <div class="modal-price">${p.price}</div>
      <div class="modal-details">
        <div class="modal-detail"><div class="label">Location</div><div class="value">${locationLabel(p.location)}</div></div>
        <div class="modal-detail"><div class="label">Type</div><div class="value">${p.type}</div></div>
        <div class="modal-detail"><div class="label">Area</div><div class="value">${p.area}</div></div>
        <div class="modal-detail"><div class="label">Contact</div><div class="value">${p.contact}</div></div>
      </div>
      <p class="modal-desc">${p.description}</p>
      ${p.mapLink ? `<div class="modal-map"><iframe src="${p.mapLink}" allowfullscreen loading="lazy"></iframe></div>` : ''}
      <div class="modal-actions">
        <a href="tel:${p.contact.replace(/\s/g,'')}" class="btn-gold" style="flex:1;justify-content:center"><i class="fa fa-phone"></i> Call Agent</a>
        <a href="https://wa.me/${p.contact.replace(/[^\d]/g,'')}?text=I'm interested in: ${encodeURIComponent(p.title)}" target="_blank" class="btn-whatsapp" style="justify-content:center"><i class="fab fa-whatsapp"></i> WhatsApp</a>
      </div>
    </div>`;
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function buildModal() {
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.innerHTML = '<div class="modal" id="modal-inner"></div>';
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  document.body.appendChild(modalOverlay);
}

function closeModal() {
  if (modalOverlay) modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function getBadgeClass(type) {
  return { Land: 'badge-land', House: 'badge-house', Building: 'badge-building', Commercial: 'badge-commercial' }[type] || 'badge-land';
}

// ===== HERO SEARCH =====
function heroSearch() {
  const loc = document.getElementById('hero-location')?.value || '';
  const type = document.getElementById('hero-type')?.value || '';
  const budget = document.getElementById('hero-budget')?.value || '';
  const params = new URLSearchParams();
  if (loc) params.set('loc', loc);
  if (type) params.set('type', type);
  if (budget) params.set('budget', budget);
  window.location.href = 'properties.html?' + params.toString();
}

// ===== NAVIGATE TO LOCATION =====
function goToLocation(loc) {
  window.location.href = `location-detail.html?loc=${loc}`;
}

// ===== CONTACT HELPERS =====
function callAgent(phone) { window.location.href = `tel:${phone.replace(/\s/g, '')}`; }
function waContact(phone, title) {
  const num = phone.replace(/[^\d]/g, '');
  window.open(`https://wa.me/${num}?text=I'm interested in: ${encodeURIComponent(title)}`, '_blank');
}

// ===== TESTIMONIAL SLIDER =====
let testIndex = 0;
function updateTestSlider() {
  const track = document.getElementById('test-track');
  if (!track) return;
  const cards = track.querySelectorAll('.testimonial-card');
  const maxIndex = Math.max(0, cards.length - (window.innerWidth > 768 ? 3 : 1));
  testIndex = Math.max(0, Math.min(testIndex, maxIndex));
  const cardW = cards[0]?.offsetWidth + 28 || 0;
  track.style.transform = `translateX(-${testIndex * cardW}px)`;
}
function nextTest() { testIndex++; updateTestSlider(); }
function prevTest() { testIndex--; updateTestSlider(); }

// ===== INIT PAGE =====
async function initPage() {
  initNavbar();
  animateCounters();
  initScrollAnimations();
  await renderFeaturedProperties();

  // Auto-start slider
  setInterval(() => { nextTest(); }, 5000);
  window.addEventListener('resize', updateTestSlider);
}

// ===== START =====
document.addEventListener('DOMContentLoaded', () => {
  runIntroAnimation();
});
