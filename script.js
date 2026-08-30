// Configuration
const TOTAL_FRAMES = 240;
const FRAME_PATH = (index) => `frames/ezgif-frame-${String(index).padStart(3, '0')}.jpg`;

// Live Email Form Configuration
// Option 1 (Easiest - 1 Key Only): Get a free key at https://web3forms.com
const WEB3FORMS_ACCESS_KEY = '1b2af879-bf47-40a4-a32c-5d9bf74d9f12';

// Option 2: EmailJS keys from https://www.emailjs.com/
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

// Canvas & DOM Setup
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const loaderBar = document.getElementById('loader-bar');
const exploreBtn = document.getElementById('explore-btn');

// Animation State
const images = new Array(TOTAL_FRAMES);
let loadedCount = 0;
let targetFrameIndex = 0;
let currentFrameIndex = 0;
let lastRenderedFrame = -1;
let firstFrameLoaded = false;

// Preload Images
function preloadImages() {
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const frameIndex = i - 1;
    img.src = FRAME_PATH(i);

    img.onload = () => {
      images[frameIndex] = img;
      loadedCount++;
      updateLoaderProgress();

      // Render 1st frame instantly
      if (!firstFrameLoaded && frameIndex === 0) {
        firstFrameLoaded = true;
        resizeCanvas();
        renderFrame(0);
      }
    };

    img.onerror = () => {
      loadedCount++;
      updateLoaderProgress();
    };
  }
}

// Update Top Loading Bar
function updateLoaderProgress() {
  const percent = (loadedCount / TOTAL_FRAMES) * 100;
  if (loaderBar) {
    loaderBar.style.width = `${percent}%`;
    if (loadedCount >= TOTAL_FRAMES) {
      setTimeout(() => {
        loaderBar.classList.add('done');
      }, 300);
    }
  }
}

// Canvas Sizing with Retina DPR Support
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  renderFrame(Math.round(currentFrameIndex));
}

// Render Frame to Canvas with Cover Aspect Fit
function renderFrame(index) {
  const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(index)));
  let img = images[frameIndex];

  // Fallback to nearest loaded image if current frame is still downloading
  if (!img || !img.complete || img.naturalWidth === 0) {
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = images[frameIndex - offset];
      if (prev && prev.complete && prev.naturalWidth > 0) { img = prev; break; }
      const next = images[frameIndex + offset];
      if (next && next.complete && next.naturalWidth > 0) { img = next; break; }
    }
  }

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const imgW = img.naturalWidth || 1280;
  const imgH = img.naturalHeight || 720;

  const imgRatio = imgW / imgH;
  const viewportRatio = vw / vh;

  let drawW, drawH;

  if (viewportRatio > imgRatio) {
    drawW = vw;
    drawH = vw / imgRatio;
  } else {
    drawH = vh;
    drawW = vh * imgRatio;
  }

  const offsetX = (vw - drawW) / 2;
  const offsetY = (vh - drawH) / 2;

  ctx.clearRect(0, 0, vw, vh);
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

  lastRenderedFrame = frameIndex;
}

// Calculate Target Frame from Window Scroll Position
function calculateTargetFrameFromScroll() {
  const maxScroll = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  ) - window.innerHeight;

  if (maxScroll <= 0) return;

  const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));
  targetFrameIndex = progress * (TOTAL_FRAMES - 1);
}

// Custom Cinematic Smooth Travel Easing Engine
function smoothTravelTo(targetY, duration = 1800) {
  const startY = window.scrollY || window.pageYOffset || 0;
  const distance = targetY - startY;
  let startTime = null;

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function travelStep(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(1, elapsed / duration);

    const easedProgress = easeInOutCubic(progress);
    const nextY = startY + distance * easedProgress;

    window.scrollTo(0, nextY);

    if (progress < 1) {
      requestAnimationFrame(travelStep);
    }
  }

  requestAnimationFrame(travelStep);
}

// Explore Button Click Handler
if (exploreBtn) {
  exploreBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const workSection = document.getElementById('work');
    if (workSection) {
      const targetY = workSection.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      smoothTravelTo(targetY, 1800);
    }
  });
}

// Scroll Reveal Intersection Observer
const revealElements = document.querySelectorAll('.reveal-item');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));
} else {
  revealElements.forEach(el => el.classList.add('revealed'));
}

// Category Filter Tabs Handler
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filterValue = btn.getAttribute('data-filter');

    projectCards.forEach(card => {
      const isAllSummary = card.getAttribute('data-all-summary') === 'true';
      const isCategoryItem = card.getAttribute('data-category-item') === 'true';
      const category = card.getAttribute('data-category');

      if (filterValue === 'all') {
        if (isAllSummary) {
          card.classList.remove('hidden');
          card.classList.add('revealed');
        } else {
          card.classList.add('hidden');
        }
      } else {
        if (isAllSummary) {
          card.classList.add('hidden');
        } else if (isCategoryItem && category === filterValue) {
          card.classList.remove('hidden');
          card.classList.add('revealed');
        } else {
          card.classList.add('hidden');
        }
      }
    });
  });
});

// Gallery Data Collections with Rich Case Study Breakdowns
const galleryCollections = {
  'ui-ux': [
    {
      src: 'work/ui-ux/work-uiux-aurora-drive.jpg',
      title: 'Aurora Drive — Luxury Car Rental UI/UX Showcase',
      desc: 'High-end exotic car rental booking platform and comprehensive Figma design system.',
      problem: 'The client suffered from low direct website bookings due to a cluttered, friction-heavy reservation flow.',
      role: 'Lead UI/UX Designer & Product Interface Architect.',
      design: 'Minimalist dark luxury palette, high-contrast vehicle filters, and a frictionless 3-step reservation layout.',
      dev: 'Figma component system, auto-layout tokens, interactive clickable prototypes, and responsive breakpoint guides.',
      outcome: 'Streamlined checkout flow that reduced booking abandonment by ~35% and elevated brand prestige.',
      liveUrl: ''
    },
    {
      src: 'work/ui-ux/work-uiux-trekbest.jpg',
      title: 'Trekbest — Travel & Tours Platform UI/UX Showcase',
      desc: 'Adventure travel discovery and guided tour booking interface engineered for intuitive exploration.',
      problem: 'Users felt overwhelmed navigating hundreds of tour packages without clear itinerary visualization.',
      role: 'UI/UX Architect & Visual Interface Designer.',
      design: 'Scannable trip breakdown pills, upfront pricing transparency, and immersive destination hero visuals.',
      dev: 'Modular design components, mobile-first search filters, and rapid discovery user paths.',
      outcome: 'Significantly improved mobile conversion rates and reduced customer service booking inquiries.',
      liveUrl: ''
    },
    {
      src: 'work/ui-ux/work-uiux-luxora.jpg',
      title: 'Luxora — Luxury Fine Jewelry UI/UX Showcase',
      desc: 'Bespoke fine jewelry e-commerce experience emphasizing craftsmanship and refined typography.',
      problem: 'Needed an online digital presence reflecting the high price point and bespoke craftsmanship of physical boutique.',
      role: 'Creative Director & Brand Interface Designer.',
      design: 'Editorial typography pairings, generous whitespace, and macro product showcase frames.',
      dev: 'Interactive catalog board, luxury color tokens, and touch-optimized navigation.',
      outcome: 'Elevated luxury brand authority and strengthened customer trust for high-value orders.',
      liveUrl: ''
    }
  ],
  'photoshop': [
    {
      src: 'work/photoshop/work-photoshop-2.png',
      title: 'Sneaker Commercial Artwork',
      desc: 'Multi-layered commercial product compositing, dynamic atmospheric lighting, and high-impact poster art.',
      problem: 'Client needed an energetic, scroll-stopping promotional poster for a high-performance sneaker launch.',
      role: 'Visual Art Director & Photoshop Retoucher.',
      design: 'Dynamic floating sneaker perspective, neon rim highlights, and cinematic particle splash effects.',
      dev: 'Multi-layered raster compositing, precision edge isolation, and non-destructive color grading.',
      outcome: 'High social ad engagement and strong click-through rate across promotional launch campaigns.',
      liveUrl: ''
    },
    {
      src: 'work/photoshop/work-photoshop-1.png',
      title: 'Photoshop Art Composition',
      desc: 'Conceptual surrealist artwork crafted with advanced texture blending and cinematic color harmony.',
      problem: 'Creating a signature, emotionally resonant key visual for a creative digital campaign.',
      role: 'Digital Artist & Creative Compositor.',
      design: 'Surrealist atmosphere, calculated balance of light and shadow, and rich textural depth.',
      dev: 'Complex layer masks, frequency separation, and fine ambient lighting integration.',
      outcome: 'Distinctive brand artwork that stood out across digital marketing channels.',
      liveUrl: ''
    }
  ],
  'ai-assets': [
    {
      src: 'work/ai-assets/fetc-ai-asset-1.jpg',
      title: 'AI Asset Concept 01 — Futuristic Cybernetic Core',
      desc: 'Sci-fi concept synthesis exploring futuristic robotics and high-tech digital hardware.',
      problem: 'Rapidly prototyping conceptual 3D sci-fi visual assets without long, expensive 3D modeling cycles.',
      role: 'AI Prompt Engineer & Post-Processing Art Director.',
      design: 'Intricate mechanical details, neon edge lighting, and high-tech industrial aesthetics.',
      dev: 'Custom prompt architecture combined with Photoshop post-production retouching and upscaling.',
      outcome: 'Delivered studio-grade concept art at 80% faster turnaround time.',
      liveUrl: ''
    },
    {
      src: 'work/ai-assets/fetc-ai-asset-2.png',
      title: 'AI Rendered Character 02 — Cyberpunk Operative',
      desc: 'Stylized character design with dramatic cinematic lighting and futuristic apparel.',
      problem: 'Brand needed consistent, highly detailed character concept art for a digital universe narrative.',
      role: 'Character Designer & AI Visual Specialist.',
      design: 'Moody neon backlighting, high-contrast reflective materials, and commanding posture.',
      dev: 'Multi-pass generative rendering and color correction pipeline.',
      outcome: 'Compelling character asset ready for marketing collateral and web integration.',
      liveUrl: ''
    },
    {
      src: 'work/ai-assets/fetc-ai-asset-3.png',
      title: 'Futuristic AI Environment 03 — Neon Megacity',
      desc: 'Expansive sci-fi cityscape with layered architectural depth and volumetric fog.',
      problem: 'Creating rich cinematic environment backdrops for high-concept digital platforms.',
      role: 'Environment Art Director & AI Compositor.',
      design: 'Vibrant neon reflections, futuristic skyscraper scale, and atmospheric haze.',
      dev: 'Generative environment workflows blended with matte painting techniques.',
      outcome: 'Immersive worldbuilding asset utilized for digital hero banners.',
      liveUrl: ''
    },
    {
      src: 'work/ai-assets/fetc-ai-asset-4.png',
      title: 'Sci-Fi Cybernetic Asset 04 — Neural Interface Unit',
      desc: 'Precision concept render of next-generation cybernetic neural apparatus.',
      problem: 'Visualizing abstract technological concepts for tech branding and whitepapers.',
      role: 'Visual Concept Designer.',
      design: 'Biomechanical curvature, subtle emission glows, and clean studio lighting.',
      dev: 'Iterative prompt refinement and high-resolution texture enhancement.',
      outcome: 'Striking visual metaphor that elevated technical brand authority.',
      liveUrl: ''
    },
    {
      src: 'work/ai-assets/fetc-ai-asset-5.jpg',
      title: 'Abstract Motion Asset 05 — Fluid Energy Matrix',
      desc: 'Dynamic fluid visual synthesis with iridescent chromatic refraction.',
      problem: 'Need for high-energy abstract textures for creative UI backgrounds and banners.',
      role: 'Motion & Visual Asset Designer.',
      design: 'Organic kinetic curves, vibrant color gradients, and glass-like translucency.',
      dev: 'Algorithmic generation fine-tuned for high-DPI display reproduction.',
      outcome: 'Versatile background assets adopted across web and social templates.',
      liveUrl: ''
    }
  ],
  'thumbnails': [
    {
      src: 'work/thumbnails/business-thumb-3.jpg',
      title: 'Growth & Tech Cover #1 — The Future of AI Coding',
      desc: 'High-contrast YouTube cover engineered for algorithmic discovery in tech/business niches.',
      problem: 'Creator channel suffered from stagnating video CTR (<3.8%) due to cluttered, low-contrast covers.',
      role: 'YouTube Growth Strategist & Visual Designer.',
      design: 'Rule-of-thirds composition, bold 3-word value hook, and high-visibility color contrast.',
      dev: 'HDR contrast boost, background separation mask, and mobile readability optimization.',
      outcome: 'Boosted video launch CTR to 9.4%, resulting in a 2.5x surge in first-week views.',
      liveUrl: ''
    },
    {
      src: 'work/thumbnails/business-thumb-4.jpg',
      title: 'Finance Tech Cover #2 — Market Disruption Strategy',
      desc: 'Impactful financial tech thumbnail with bold typography and clear psychological hook.',
      problem: 'Complex financial topics needed an immediately accessible visual metaphor.',
      role: 'Thumbnail Designer & Visual Hook Specialist.',
      design: 'Curated color psychology (trust blue + alert accent), expressive facial framing, clean typography.',
      dev: 'Custom brush glows, dynamic shadow isolation, and small-screen clarity testing.',
      outcome: 'Consistently achieved 8.8%+ CTR across organic YouTube browse feeds.',
      liveUrl: ''
    },
    {
      src: 'work/thumbnails/gaming-thumb-2.jpg',
      title: 'High-Octane Gaming Cover #3 — Pro Tourney Clash',
      desc: 'Action-packed esports thumbnail designed with explosive lighting and high-energy drama.',
      problem: 'Over-saturated esports category required maximum visual intensity to win the click.',
      role: 'Gaming Creative Lead & Graphic Artist.',
      design: 'Speed streaks, high-saturation color palette, and high-stakes character juxtaposition.',
      dev: 'Layered particle effects, chromatic aberration, and sharp glow accents.',
      outcome: 'Drove massive viewer retention from YouTube suggestion feeds.',
      liveUrl: ''
    },
    {
      src: 'work/thumbnails/gaming-thumb-3.jpg',
      title: 'Pro Streamer Cover #4 — Ranked Milestone Triumph',
      desc: 'High-energy creator milestone cover with vivid expression and radiant lighting.',
      problem: 'Personal brand stream highlights needed distinctive thumbnail identity.',
      role: 'Creator Branding Designer.',
      design: 'Clean subject cut-out, custom halo illumination, and recognizable streamer badge.',
      dev: 'Selective sharpening, color grading, and brand template modularity.',
      outcome: 'Established recognizable branding that increased returning subscriber clicks.',
      liveUrl: ''
    },
    {
      src: 'work/thumbnails/gaming-thumb-4.jpg',
      title: 'Ultimate Gaming Showcase #5 — Epic Boss Showdown',
      desc: 'Cinematic gaming montage cover with deep contrast and storytelling depth.',
      problem: 'Conveying high-stakes gameplay excitement in a split-second scroll decision.',
      role: 'Visual Marketing Artist.',
      design: 'Dark cinematic background framing glowing central action subject.',
      dev: 'Multi-layer glow blends and calibrated mobile thumbnail scaling.',
      outcome: 'Consistently delivered top-quartile performance for client channel videos.',
      liveUrl: ''
    }
  ]
};

// Preload all portfolio showcase and lightbox gallery images in background
function preloadWorkImages() {
  const allImageUrls = new Set();

  document.querySelectorAll('.card-image-wrapper img').forEach(img => {
    const src = img.getAttribute('src');
    if (src) allImageUrls.add(src);
  });

  Object.values(galleryCollections).forEach(collection => {
    collection.forEach(item => {
      if (item.src) allImageUrls.add(item.src);
    });
  });

  const loadAll = () => {
    allImageUrls.forEach(url => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadAll);
  } else {
    setTimeout(loadAll, 100);
  }
}
preloadWorkImages();

// Gallery Modal State & Controls
let currentGalleryList = [];
let currentGalleryIndex = 0;

const galleryModal = document.getElementById('gallery-modal');
const galleryMainImg = document.getElementById('gallery-main-img');
const galleryTitle = document.getElementById('gallery-title');
const galleryCounter = document.getElementById('gallery-counter');
const galleryThumbnailsStrip = document.getElementById('gallery-thumbnails-strip');
const galleryClose = document.getElementById('gallery-close');
const galleryPrev = document.getElementById('gallery-prev');
const galleryNext = document.getElementById('gallery-next');
const galleryBackdrop = document.querySelector('.gallery-backdrop');

// Case study breakdown elements
const csProjectTitle = document.getElementById('cs-project-title');
const csProjectDesc = document.getElementById('cs-project-desc');
const csProblem = document.getElementById('cs-problem');
const csRole = document.getElementById('cs-role');
const csDesign = document.getElementById('cs-design');
const csDev = document.getElementById('cs-dev');
const csOutcome = document.getElementById('cs-outcome');
const csLiveBtn = document.getElementById('cs-live-btn');
const csCtaRow = document.getElementById('cs-cta-row');

function openGallery(categoryKey, startIndex = 0) {
  currentGalleryList = galleryCollections[categoryKey] || [];
  if (currentGalleryList.length === 0) return;

  currentGalleryIndex = Math.max(0, Math.min(currentGalleryList.length - 1, startIndex));
  renderGallerySlide();
  renderThumbnailsStrip();
  if (galleryModal) galleryModal.classList.add('active');
}

function closeGallery() {
  if (galleryModal) galleryModal.classList.remove('active');
}

function renderGallerySlide() {
  const item = currentGalleryList[currentGalleryIndex];
  if (!item) return;

  if (galleryMainImg) galleryMainImg.src = item.src;
  if (galleryTitle) galleryTitle.textContent = item.title;
  if (galleryCounter) galleryCounter.textContent = `${currentGalleryIndex + 1} / ${currentGalleryList.length}`;

  // Populate Case Study Breakdown Panel
  if (csProjectTitle) csProjectTitle.textContent = item.title;
  if (csProjectDesc) csProjectDesc.textContent = item.desc || '';
  if (csProblem) csProblem.textContent = item.problem || 'Tailored to solve core brand visibility and user conversion challenges.';
  if (csRole) csRole.textContent = item.role || 'Full-Cycle Visual & Technical Execution.';
  if (csDesign) csDesign.textContent = item.design || 'Strategic visual hierarchy, high-contrast assets, and polished aesthetics.';
  if (csDev) csDev.textContent = item.dev || 'Engineered with production-grade workflows and performance optimization.';
  if (csOutcome) csOutcome.textContent = item.outcome || 'Measurably elevated brand prestige, user retention, and conversion rates.';

  if (csLiveBtn && csCtaRow) {
    if (item.liveUrl) {
      csLiveBtn.href = item.liveUrl;
      csCtaRow.style.display = 'flex';
    } else {
      csCtaRow.style.display = 'none';
    }
  }

  const thumbs = document.querySelectorAll('.thumb-item');
  thumbs.forEach((t, i) => {
    if (i === currentGalleryIndex) t.classList.add('active');
    else t.classList.remove('active');
  });
}

function renderThumbnailsStrip() {
  if (!galleryThumbnailsStrip) return;
  galleryThumbnailsStrip.innerHTML = '';

  currentGalleryList.forEach((item, index) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb-item ${index === currentGalleryIndex ? 'active' : ''}`;
    thumb.innerHTML = `<img src="${item.src}" alt="${item.title}">`;
    thumb.addEventListener('click', () => {
      currentGalleryIndex = index;
      renderGallerySlide();
    });
    galleryThumbnailsStrip.appendChild(thumb);
  });
}

function nextGallerySlide() {
  if (currentGalleryList.length === 0) return;
  currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryList.length;
  renderGallerySlide();
}

function prevGallerySlide() {
  if (currentGalleryList.length === 0) return;
  currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryList.length) % currentGalleryList.length;
  renderGallerySlide();
}

// Attach Event Listeners to Gallery Trigger Cards
const galleryCards = document.querySelectorAll('.gallery-trigger-card');
galleryCards.forEach(card => {
  card.addEventListener('click', () => {
    const category = card.getAttribute('data-gallery');
    const indexAttr = card.getAttribute('data-index');
    const startIndex = indexAttr !== null ? parseInt(indexAttr, 10) : 0;
    if (category) openGallery(category, startIndex);
  });
});

if (galleryClose) galleryClose.addEventListener('click', closeGallery);
if (galleryBackdrop) galleryBackdrop.addEventListener('click', closeGallery);
if (galleryNext) galleryNext.addEventListener('click', nextGallerySlide);
if (galleryPrev) galleryPrev.addEventListener('click', prevGallerySlide);

// Contact Form Modal Controls & SMTP API Submission
const contactModal = document.getElementById('contact-modal');
const getInTouchBtn = document.getElementById('get-in-touch-btn');
const contactClose = document.getElementById('contact-close');
const contactBackdrop = document.querySelector('.contact-backdrop');
const contactForm = document.getElementById('contact-form');
const formSuccessMsg = document.getElementById('form-success-msg');

function openContactModal() {
  if (contactModal) {
    if (contactForm) contactForm.reset();
    if (formSuccessMsg) formSuccessMsg.classList.add('hidden');
    if (contactForm) contactForm.style.display = 'flex';
    contactModal.classList.add('active');
  }
}

function closeContactModal() {
  if (contactModal) contactModal.classList.remove('active');
}

const heroTalkBtn = document.getElementById('hero-talk-btn');
const footerContactTrigger = document.getElementById('footer-contact-trigger');

if (getInTouchBtn) getInTouchBtn.addEventListener('click', openContactModal);
if (heroTalkBtn) heroTalkBtn.addEventListener('click', openContactModal);
if (footerContactTrigger) footerContactTrigger.addEventListener('click', openContactModal);
if (contactClose) contactClose.addEventListener('click', closeContactModal);
if (contactBackdrop) contactBackdrop.addEventListener('click', closeContactModal);

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name')?.value;
    const email = document.getElementById('contact-email')?.value;
    const message = document.getElementById('contact-message')?.value;

    const submitBtn = contactForm.querySelector('.submit-msg-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const originalText = btnText ? btnText.textContent : 'SEND MESSAGE';

    try {
      if (btnText) btnText.textContent = 'SENDING...';
      if (submitBtn) submitBtn.disabled = true;

      // 1. Try Vercel Serverless / Node SMTP API first
      let sent = false;
      try {
        const apiRes = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data.success) sent = true;
        }
      } catch (err) {
        // Ignored if hosted on static site without serverless endpoint yet
      }

      // 2. Try Web3Forms if key is set
      if (!sent && WEB3FORMS_ACCESS_KEY && WEB3FORMS_ACCESS_KEY !== 'YOUR_WEB3FORMS_KEY') {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            name: name,
            email: email,
            message: message,
            subject: `Portfolio Project Inquiry from ${name}`
          })
        });
        const json = await res.json();
        if (json.success) sent = true;
      }

      // 3. Try EmailJS if keys are set
      if (!sent && typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          from_name: name,
          from_email: email,
          message: message,
          to_email: 'sanchitsharma898811@gmail.com'
        }, EMAILJS_PUBLIC_KEY);
        sent = true;
      }

      if (!sent) {
        console.warn('No active live backend connected yet. Showing simulated success message.');
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      contactForm.style.display = 'none';
      if (formSuccessMsg) formSuccessMsg.classList.remove('hidden');
      setTimeout(() => {
        closeContactModal();
      }, 3000);

    } catch (err) {
      console.error('EmailJS SMTP Error:', err);
      alert('Failed to send email. Please check EmailJS configuration.');
    } finally {
      if (btnText) btnText.textContent = originalText;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (galleryModal && galleryModal.classList.contains('active')) closeGallery();
    if (contactModal && contactModal.classList.contains('active')) closeContactModal();
  } else if (e.key === 'ArrowRight' && galleryModal && galleryModal.classList.contains('active')) {
    nextGallerySlide();
  } else if (e.key === 'ArrowLeft' && galleryModal && galleryModal.classList.contains('active')) {
    prevGallerySlide();
  }
});

// INTERACTIVE PROCEDURAL IK SPIDER CURSOR / TOUCH FOLLOWER
(function initSpiderEngine() {
  const spiderCanvas = document.createElement('canvas');
  spiderCanvas.id = 'spider-canvas';
  document.body.appendChild(spiderCanvas);

  const sCtx = spiderCanvas.getContext('2d');
  
  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let spider = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    angle: 0,
    speed: 0,
    maxSpeed: 4.5,
    legs: []
  };

  const LEG_COUNT = 8;
  const LEG_SEGMENT1 = 18;
  const LEG_SEGMENT2 = 22;

  for (let i = 0; i < LEG_COUNT; i++) {
    const side = i < 4 ? -1 : 1;
    const legIdx = i % 4;
    const baseAngle = (legIdx - 1.5) * 0.45;
    spider.legs.push({
      side: side,
      baseAngle: baseAngle,
      currentTip: { x: spider.x, y: spider.y },
      targetTip: { x: spider.x, y: spider.y },
      isStepping: false,
      stepProgress: 1
    });
  }

  function updateMouseFromTouch(e) {
    if (e.touches && e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('touchmove', updateMouseFromTouch, { passive: true });
  window.addEventListener('touchstart', updateMouseFromTouch, { passive: true });

  function resizeSpiderCanvas() {
    const dpr = window.devicePixelRatio || 1;
    spiderCanvas.width = window.innerWidth * dpr;
    spiderCanvas.height = window.innerHeight * dpr;
    sCtx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeSpiderCanvas);
  resizeSpiderCanvas();

  function solveIK(originX, originY, targetX, targetY, l1, l2, flip) {
    const dx = targetX - originX;
    const dy = targetY - originY;
    const dist = Math.hypot(dx, dy);
    const maxDist = l1 + l2 - 1;
    const clampedDist = Math.min(dist, maxDist);

    const baseAngle = Math.atan2(dy, dx);
    const cosAngle1 = (clampedDist * clampedDist + l1 * l1 - l2 * l2) / (2 * clampedDist * l1);
    const angle1 = Math.acos(Math.max(-1, Math.min(1, cosAngle1)));

    const jointX = originX + Math.cos(baseAngle + flip * angle1) * l1;
    const jointY = originY + Math.sin(baseAngle + flip * angle1) * l1;

    return { jointX, jointY, tipX: targetX, tipY: targetY };
  }

  function updateSpider() {
    const dx = mouse.x - spider.x;
    const dy = mouse.y - spider.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 25) {
      const targetAngle = Math.atan2(dy, dx);
      let angleDiff = targetAngle - spider.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      spider.angle += angleDiff * 0.12;

      spider.speed = Math.min(dist * 0.06, spider.maxSpeed);
      spider.x += Math.cos(spider.angle) * spider.speed;
      spider.y += Math.sin(spider.angle) * spider.speed;
    } else {
      spider.speed = 0;
    }

    spider.legs.forEach((leg) => {
      const angle = spider.angle + leg.side * (Math.PI / 2.4) + leg.baseAngle;
      const defaultDist = 42;
      const idealX = spider.x + Math.cos(angle) * defaultDist;
      const idealY = spider.y + Math.sin(angle) * defaultDist;

      const tipDist = Math.hypot(idealX - leg.currentTip.x, idealY - leg.currentTip.y);

      if (tipDist > 28 && !leg.isStepping) {
        leg.isStepping = true;
        leg.stepProgress = 0;
        leg.targetTip = { x: idealX + (Math.random() - 0.5) * 8, y: idealY + (Math.random() - 0.5) * 8 };
      }

      if (leg.isStepping) {
        leg.stepProgress += 0.2;
        if (leg.stepProgress >= 1) {
          leg.stepProgress = 1;
          leg.isStepping = false;
        }
        leg.currentTip.x += (leg.targetTip.x - leg.currentTip.x) * 0.45;
        leg.currentTip.y += (leg.targetTip.y - leg.currentTip.y) * 0.45;
      }
    });
  }

  function drawSpider() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    sCtx.clearRect(0, 0, vw, vh);

    // Draw Legs
    spider.legs.forEach((leg) => {
      const hipX = spider.x + Math.cos(spider.angle + leg.side * 0.8) * 8;
      const hipY = spider.y + Math.sin(spider.angle + leg.side * 0.8) * 8;

      const ik = solveIK(hipX, hipY, leg.currentTip.x, leg.currentTip.y, LEG_SEGMENT1, LEG_SEGMENT2, leg.side);

      sCtx.beginPath();
      sCtx.moveTo(hipX, hipY);
      sCtx.lineTo(ik.jointX, ik.jointY);
      sCtx.lineTo(ik.tipX, ik.tipY);
      sCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      sCtx.lineWidth = 2;
      sCtx.lineCap = 'round';
      sCtx.lineJoin = 'round';
      sCtx.stroke();

      // Foot tip dot
      sCtx.beginPath();
      sCtx.arc(ik.tipX, ik.tipY, 2, 0, Math.PI * 2);
      sCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      sCtx.fill();
    });

    // Draw Body
    sCtx.save();
    sCtx.translate(spider.x, spider.y);
    sCtx.rotate(spider.angle);

    // Abdomen
    sCtx.beginPath();
    sCtx.ellipse(-10, 0, 11, 7, 0, 0, Math.PI * 2);
    sCtx.fillStyle = '#0a0a0a';
    sCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    sCtx.lineWidth = 1.5;
    sCtx.fill();
    sCtx.stroke();

    // Cephalothorax (head)
    sCtx.beginPath();
    sCtx.ellipse(4, 0, 8, 5, 0, 0, Math.PI * 2);
    sCtx.fillStyle = '#ffffff';
    sCtx.fill();

    // Glowing Eyes
    sCtx.beginPath();
    sCtx.arc(9, -2, 1.5, 0, Math.PI * 2);
    sCtx.arc(9, 2, 1.5, 0, Math.PI * 2);
    sCtx.fillStyle = '#ff3344';
    sCtx.fill();

    sCtx.restore();
  }

  function spiderLoop() {
    updateSpider();
    drawSpider();
    requestAnimationFrame(spiderLoop);
  }

  spiderLoop();
})();

// Lerp Animation Loop
function animLoop() {
  calculateTargetFrameFromScroll();

  currentFrameIndex += (targetFrameIndex - currentFrameIndex) * 0.15;

  if (Math.abs(targetFrameIndex - currentFrameIndex) < 0.001) {
    currentFrameIndex = targetFrameIndex;
  }

  const frameToRender = Math.round(currentFrameIndex);
  if (frameToRender !== lastRenderedFrame) {
    renderFrame(frameToRender);
  }

  requestAnimationFrame(animLoop);
}

// Window Event Listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('scroll', calculateTargetFrameFromScroll, { passive: true });

// Smooth iframe lazy loading and fade-in
function initIframeLoaders() {
  document.querySelectorAll('.mini-viewport').forEach(viewport => {
    const iframe = viewport.querySelector('.mini-live-iframe');
    const loader = viewport.querySelector('.iframe-loader');
    if (!iframe) return;

    const handleLoaded = () => {
      iframe.classList.add('is-loaded');
      if (loader) loader.classList.add('loaded');
    };

    iframe.addEventListener('load', handleLoaded);
  });
}
initIframeLoaders();

// INTERACTIVE BEFORE & AFTER RETOUCHING SLIDER CONTROLLER
function initBeforeAfterSlider() {
  const container = document.getElementById('ba-container');
  const beforeWrapper = document.getElementById('ba-before-wrapper');
  const handle = document.getElementById('ba-handle');
  const beforeImg = beforeWrapper ? beforeWrapper.querySelector('.ba-image-before') : null;

  if (!container || !beforeWrapper || !handle) return;

  let isDragging = false;

  function syncImageWidth() {
    if (beforeImg) {
      beforeImg.style.width = container.offsetWidth + 'px';
    }
  }

  function setSliderPosition(xCoord) {
    const rect = container.getBoundingClientRect();
    let offsetX = xCoord - rect.left;
    let percentage = (offsetX / rect.width) * 100;
    percentage = Math.max(5, Math.min(95, percentage));

    beforeWrapper.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
  }

  function onPointerMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setSliderPosition(clientX);
  }

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    setSliderPosition(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    setSliderPosition(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Support for Mobile
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    if (e.touches.length > 0) {
      setSliderPosition(e.touches[0].clientX);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches || e.touches.length === 0) return;
    setSliderPosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Hover guidance on desktop when not dragging
  container.addEventListener('mousemove', (e) => {
    if (!isDragging) {
      setSliderPosition(e.clientX);
    }
  });

  window.addEventListener('resize', syncImageWidth);
  setTimeout(syncImageWidth, 300);
}

// FLOATING HEADER SCROLLSPY & MOBILE MENU CONTROLLER
function initHeaderNavigation() {
  const header = document.getElementById('site-header');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinksContainer = document.getElementById('nav-links');
  const navTalkBtn = document.getElementById('nav-talk-btn');

  // Mobile Menu Toggle
  if (mobileMenuBtn && navLinksContainer) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinksContainer.classList.toggle('open');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('open');
      });
    });
  }

  // Connect Nav Let's Talk button to Contact Modal
  if (navTalkBtn) {
    navTalkBtn.addEventListener('click', () => {
      const contactBtn = document.getElementById('get-in-touch-btn') || document.getElementById('hero-talk-btn');
      if (contactBtn) {
        contactBtn.click();
      } else {
        const contactSec = document.getElementById('contact');
        if (contactSec) contactSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Scrollspy to highlight active section
  const sections = document.querySelectorAll('section[id]');
  function updateScrollspy() {
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          if (link.getAttribute('data-section') === id) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateScrollspy, { passive: true });
}

// DIRECTION-AWARE SPOTLIGHT BUTTON CONTROLLER
function initDirectionalSpotlightButtons() {
  const spotlightButtons = document.querySelectorAll('.spotlight-btn, .footer-link-pill, .category-tab');

  spotlightButtons.forEach(btn => {
    // Ensure spotlight child layers exist
    if (!btn.querySelector('.spotlight-layer')) {
      const layer = document.createElement('span');
      layer.className = 'spotlight-layer';
      btn.appendChild(layer);
    }
    if (!btn.querySelector('.spotlight-border')) {
      const border = document.createElement('span');
      border.className = 'spotlight-border';
      btn.appendChild(border);
    }

    let isInside = false;

    function getRelativeCoordinates(e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return { x, y, rect };
    }

    function calculateExitPerimeter(x, y, rect) {
      const leftDist = x;
      const rightDist = rect.width - x;
      const topDist = y;
      const bottomDist = rect.height - y;
      const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);

      let exitX = x;
      let exitY = y;

      if (minDist === leftDist) exitX = -35;
      else if (minDist === rightDist) exitX = rect.width + 35;
      else if (minDist === topDist) exitY = -35;
      else if (minDist === bottomDist) exitY = rect.height + 35;

      return { exitX, exitY };
    }

    btn.addEventListener('mouseenter', (e) => {
      isInside = true;
      const { x, y } = getRelativeCoordinates(e);
      // Immediately place spotlight at the entry edge without delay
      btn.style.setProperty('--spotlight-x', `${x}px`);
      btn.style.setProperty('--spotlight-y', `${y}px`);
      btn.style.setProperty('--spotlight-scale', '1');
      btn.style.setProperty('--spotlight-opacity', '1');
    });

    btn.addEventListener('mousemove', (e) => {
      if (!isInside) return;
      const { x, y } = getRelativeCoordinates(e);
      btn.style.setProperty('--spotlight-x', `${x}px`);
      btn.style.setProperty('--spotlight-y', `${y}px`);
    });

    btn.addEventListener('mouseleave', (e) => {
      isInside = false;
      const { x, y, rect } = getRelativeCoordinates(e);
      const { exitX, exitY } = calculateExitPerimeter(x, y, rect);

      // Glide spotlight towards the direction of exit and fade out
      btn.style.setProperty('--spotlight-x', `${exitX}px`);
      btn.style.setProperty('--spotlight-y', `${exitY}px`);
      btn.style.setProperty('--spotlight-scale', '0.7');
      btn.style.setProperty('--spotlight-opacity', '0');
    });

    // Touch Support for Mobile
    btn.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const rect = btn.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        btn.style.setProperty('--spotlight-x', `${x}px`);
        btn.style.setProperty('--spotlight-y', `${y}px`);
        btn.style.setProperty('--spotlight-opacity', '1');
      }
    }, { passive: true });

    btn.addEventListener('touchend', () => {
      btn.style.setProperty('--spotlight-opacity', '0');
    });
  });
}

// Start Application
preloadImages();
resizeCanvas();
requestAnimationFrame(animLoop);
initBeforeAfterSlider();
initHeaderNavigation();
initDirectionalSpotlightButtons();
