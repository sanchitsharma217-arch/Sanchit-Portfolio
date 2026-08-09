// Configuration
const TOTAL_FRAMES = 240;
const FRAME_PATH = (index) => `frames/ezgif-frame-${String(index).padStart(3, '0')}.jpg`;

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
      const category = card.getAttribute('data-category');
      if (filterValue === 'all' || category === filterValue) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// Gallery Data Collections
const galleryCollections = {
  'photoshop': [
    { src: 'work/photoshop/work-photoshop-2.png', title: 'Sneaker Commercial Artwork' },
    { src: 'work/photoshop/work-photoshop-1.png', title: 'Photoshop Art Composition' }
  ],
  'ai-assets': [
    { src: 'work/ai-assets/fetc-ai-asset-1.jpg', title: 'AI Asset Concept 01' },
    { src: 'work/ai-assets/fetc-ai-asset-2.png', title: 'AI Rendered Character 02' },
    { src: 'work/ai-assets/fetc-ai-asset-3.png', title: 'Futuristic AI Environment 03' },
    { src: 'work/ai-assets/fetc-ai-asset-4.png', title: 'Sci-Fi Cybernetic Asset 04' },
    { src: 'work/ai-assets/fetc-ai-asset-5.jpg', title: 'Abstract Motion Asset 05' }
  ],
  'thumbnails': [
    { src: 'work/thumbnails/business-thumb-3.jpg', title: 'Growth & Tech Cover #1' },
    { src: 'work/thumbnails/business-thumb-4.jpg', title: 'Finance Tech Cover #2' },
    { src: 'work/thumbnails/gaming-thumb-2.jpg', title: 'High-Octane Gaming Cover #3' },
    { src: 'work/thumbnails/gaming-thumb-3.jpg', title: 'Pro Streamer Cover #4' },
    { src: 'work/thumbnails/gaming-thumb-4.jpg', title: 'Ultimate Gaming Showcase #5' }
  ]
};

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

function openGallery(categoryKey) {
  currentGalleryList = galleryCollections[categoryKey] || [];
  if (currentGalleryList.length === 0) return;

  currentGalleryIndex = 0;
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
    if (category) openGallery(category);
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

if (getInTouchBtn) getInTouchBtn.addEventListener('click', openContactModal);
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

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        contactForm.style.display = 'none';
        if (formSuccessMsg) formSuccessMsg.classList.remove('hidden');
        setTimeout(() => {
          closeContactModal();
        }, 3000);
      } else {
        alert(data.error || 'Failed to send message via SMTP. Please try again.');
      }
    } catch (err) {
      console.error('SMTP Submit Error:', err);
      contactForm.style.display = 'none';
      if (formSuccessMsg) formSuccessMsg.classList.remove('hidden');
      setTimeout(() => {
        closeContactModal();
      }, 3000);
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

// Start Application
preloadImages();
resizeCanvas();
requestAnimationFrame(animLoop);
