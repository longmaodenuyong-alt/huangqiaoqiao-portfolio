const root = document.documentElement;
const body = document.body;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

body.classList.add("is-locked");

const loaderCount = document.querySelector(".loader__count");
const loaderBar = document.querySelector(".loader__bar span");
let loadProgress = 0;

const loadingTimer = window.setInterval(() => {
  loadProgress = Math.min(loadProgress + Math.ceil(Math.random() * 11), 96);
  loaderCount.textContent = String(loadProgress).padStart(2, "0");
  loaderBar.style.width = `${loadProgress}%`;
}, 55);

const finishLoading = () => {
  window.clearInterval(loadingTimer);
  loaderCount.textContent = "100";
  loaderBar.style.width = "100%";
  window.setTimeout(() => {
    root.classList.add("is-ready");
    body.classList.remove("is-locked");
    startReveals();
  }, reducedMotion ? 0 : 280);
};

if (document.readyState === "complete") {
  finishLoading();
} else {
  window.addEventListener("load", finishLoading, { once: true });
  window.setTimeout(finishLoading, 2200);
}

let revealObserver;

function startReveals() {
  if (revealObserver) return;

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.055, rootMargin: "0px 0px -4% 0px" }
  );

  document.querySelectorAll("[data-reveal]").forEach((element) => {
    revealObserver.observe(element);
  });
}

const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");
const mobileLinks = mobileMenu.querySelectorAll("a");

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  mobileMenu.setAttribute("aria-hidden", String(!open));
  mobileMenu.classList.toggle("is-open", open);
  body.classList.toggle("is-locked", open);
}

menuButton.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

mobileLinks.forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 820 && mobileMenu.classList.contains("is-open")) {
    setMenu(false);
  }
});

const spaceGallery = document.querySelector("[data-space-gallery]");

if (spaceGallery) {
  const stage = spaceGallery.querySelector(".space-stage");
  const cards = Array.from(spaceGallery.querySelectorAll(".space-card"));
  const previousButton = spaceGallery.querySelector(".space-nav--prev");
  const nextButton = spaceGallery.querySelector(".space-nav--next");
  const counter = spaceGallery.querySelector(".space-counter");
  const bigIndex = spaceGallery.querySelector(".space-big-index");
  const currentCaption = spaceGallery.querySelector(".space-current-caption");
  const progress = spaceGallery.querySelector(".space-progress span");
  const total = cards.length;
  let position = 0;
  let dragStartX = 0;
  let dragStartPosition = 0;
  let dragging = false;
  let didDrag = false;
  let activePointerId = null;

  const getStep = () => Math.max(cards[0].offsetWidth * 0.34, 72);
  const normalizeIndex = (value) => ((Math.round(value) % total) + total) % total;

  const renderSpace = (nextPosition = position) => {
    const step = getStep();
    const depth = Math.min(Math.max(stage.clientWidth * 0.07, 58), 118);
    const activeIndex = normalizeIndex(nextPosition);

    cards.forEach((card, index) => {
      let offset = index - nextPosition;
      offset = ((offset + total / 2) % total + total) % total - total / 2;
      const distance = Math.abs(offset);
      const visible = distance <= 5;
      const x = offset * step;
      const z = -Math.min(distance, 6) * depth;
      const rotation = offset * -8;
      const scale = 1 - Math.min(distance * 0.035, 0.24);

      card.style.transform = `translate3d(calc(-50% + ${x}px), -50%, ${z}px) rotateY(${rotation}deg) scale(${scale})`;
      card.style.opacity = visible ? String(Math.max(0.16, 1 - distance * 0.15)) : "0";
      card.style.zIndex = String(200 - Math.round(distance * 10));
      card.style.pointerEvents = visible ? "auto" : "none";
      card.classList.toggle("is-active", distance < 0.5);
    });

    const currentCard = cards[activeIndex];
    counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} — ${String(total).padStart(2, "0")}`;
    bigIndex.textContent = String(activeIndex + 1).padStart(2, "0");
    currentCaption.textContent = currentCard.dataset.caption;
    progress.style.transform = `scaleX(${(activeIndex + 1) / total})`;
  };

  const rotateSpace = (direction) => {
    position = Math.round(position) + direction;
    renderSpace(position);
  };

  previousButton.addEventListener("click", () => rotateSpace(-1));
  nextButton.addEventListener("click", () => rotateSpace(1));

  stage.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    rotateSpace(event.key === "ArrowRight" ? 1 : -1);
  });

  stage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    didDrag = false;
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartPosition = position;
  });

  window.addEventListener(
    "pointermove",
    (event) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      const distance = event.clientX - dragStartX;
      if (Math.abs(distance) > 5) {
        didDrag = true;
        stage.classList.add("is-dragging");
      }
      if (!didDrag) return;
      event.preventDefault();
      position = dragStartPosition - distance / getStep() * 0.78;
      renderSpace(position);
    },
    { passive: false }
  );

  const finishSpaceDrag = () => {
    if (!dragging) return;
    dragging = false;
    activePointerId = null;
    stage.classList.remove("is-dragging");
    position = Math.round(position);
    renderSpace(position);
  };

  window.addEventListener("pointerup", finishSpaceDrag);
  window.addEventListener("pointercancel", finishSpaceDrag);

  stage.addEventListener(
    "click",
    (event) => {
      if (!didDrag) return;
      event.preventDefault();
      event.stopPropagation();
      didDrag = false;
    },
    true
  );

  stage.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      rotateSpace(event.deltaX > 0 ? 1 : -1);
    },
    { passive: false }
  );

  window.addEventListener("resize", () => renderSpace(position));
  window.requestAnimationFrame(() => renderSpace(position));
}

const lightbox = document.querySelector(".lightbox");
const lightboxViewport = lightbox.querySelector("[data-lightbox-viewport]");
const lightboxImage = lightbox.querySelector(".lightbox__stage img");
const lightboxCounter = lightbox.querySelector(".lightbox__counter");
const lightboxCaption = lightbox.querySelector(".lightbox__caption");
const lightboxClose = lightbox.querySelector(".lightbox__close");
const lightboxPrev = lightbox.querySelector(".lightbox__nav--prev");
const lightboxNext = lightbox.querySelector(".lightbox__nav--next");
const galleryButtons = Array.from(document.querySelectorAll(".media[data-gallery]"));
let activeGallery = [];
let activeImageIndex = 0;
let lastFocusedElement = null;
let lightboxZoom = 1;
let lightboxPanX = 0;
let lightboxPanY = 0;
let lightboxBaseWidth = 0;
let lightboxBaseHeight = 0;
let lightboxPointerId = null;
let lightboxDragStartX = 0;
let lightboxDragStartY = 0;
let lightboxDragStartPanX = 0;
let lightboxDragStartPanY = 0;

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

function applyLightboxTransform() {
  lightboxImage.style.transform = `translate3d(${lightboxPanX}px, ${lightboxPanY}px, 0) scale(${lightboxZoom})`;
  lightboxViewport.classList.toggle("is-zoomed", lightboxZoom > 1.01);
}

function constrainLightboxPan() {
  const maxX = Math.max(0, (lightboxBaseWidth * lightboxZoom - lightboxViewport.clientWidth) / 2);
  const maxY = Math.max(0, (lightboxBaseHeight * lightboxZoom - lightboxViewport.clientHeight) / 2);
  lightboxPanX = clampValue(lightboxPanX, -maxX, maxX);
  lightboxPanY = clampValue(lightboxPanY, -maxY, maxY);
}

function setLightboxZoom(nextZoom) {
  lightboxZoom = clampValue(nextZoom, 1, 4);
  if (lightboxZoom <= 1.01) {
    lightboxZoom = 1;
    lightboxPanX = 0;
    lightboxPanY = 0;
  }
  constrainLightboxPan();
  applyLightboxTransform();
}

function resetLightboxView() {
  const naturalWidth = lightboxImage.naturalWidth;
  const naturalHeight = lightboxImage.naturalHeight;
  const availableWidth = lightboxViewport.clientWidth;
  const availableHeight = lightboxViewport.clientHeight;
  if (!naturalWidth || !naturalHeight || !availableWidth || !availableHeight) return;

  const fitScale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight);
  lightboxBaseWidth = naturalWidth * fitScale;
  lightboxBaseHeight = naturalHeight * fitScale;
  lightboxImage.style.width = `${lightboxBaseWidth}px`;
  lightboxImage.style.height = `${lightboxBaseHeight}px`;
  lightboxZoom = 1;
  lightboxPanX = 0;
  lightboxPanY = 0;
  lightboxViewport.classList.remove("is-panning");
  applyLightboxTransform();
}

function preloadAdjacentImages() {
  if (activeGallery.length < 2) return;
  [activeImageIndex - 1, activeImageIndex + 1].forEach((index) => {
    const normalized = (index + activeGallery.length) % activeGallery.length;
    const image = activeGallery[normalized].querySelector("img");
    const preload = new Image();
    preload.src = image.currentSrc || image.src;
  });
}

function renderLightboxImage() {
  const button = activeGallery[activeImageIndex];
  const image = button.querySelector("img");
  lightboxZoom = 1;
  lightboxPanX = 0;
  lightboxPanY = 0;
  lightboxImage.style.opacity = "0";
  lightboxImage.style.width = "auto";
  lightboxImage.style.height = "auto";
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightboxCounter.textContent = `${String(activeImageIndex + 1).padStart(2, "0")} / ${String(activeGallery.length).padStart(2, "0")}`;
  lightboxCaption.textContent = button.dataset.caption || image.alt;
  lightboxImage.onload = () => {
    lightboxImage.style.opacity = "1";
    resetLightboxView();
  };
  if (lightboxImage.complete && lightboxImage.naturalWidth) {
    lightboxImage.style.opacity = "1";
    resetLightboxView();
  }
  preloadAdjacentImages();
}

function openLightbox(button) {
  lastFocusedElement = document.activeElement;
  const galleryName = button.dataset.gallery;
  activeGallery = galleryButtons.filter((item) => item.dataset.gallery === galleryName);
  activeImageIndex = activeGallery.indexOf(button);
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  body.classList.add("is-locked");
  renderLightboxImage();
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  body.classList.remove("is-locked");
  if (lastFocusedElement) lastFocusedElement.focus();
}

function stepLightbox(direction) {
  activeImageIndex = (activeImageIndex + direction + activeGallery.length) % activeGallery.length;
  renderLightboxImage();
}

galleryButtons.forEach((button) => {
  button.addEventListener("click", () => openLightbox(button));
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", () => stepLightbox(-1));
lightboxNext.addEventListener("click", () => stepLightbox(1));

lightboxViewport.addEventListener("dblclick", () => {
  setLightboxZoom(lightboxZoom > 1.01 ? 1 : 2);
});

lightboxViewport.addEventListener(
  "wheel",
  (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.18 : 1 / 1.18;
    setLightboxZoom(lightboxZoom * zoomFactor);
  },
  { passive: false }
);

lightboxViewport.addEventListener("pointerdown", (event) => {
  if (lightboxZoom <= 1.01 || event.button !== 0) return;
  lightboxPointerId = event.pointerId;
  lightboxDragStartX = event.clientX;
  lightboxDragStartY = event.clientY;
  lightboxDragStartPanX = lightboxPanX;
  lightboxDragStartPanY = lightboxPanY;
  lightboxViewport.classList.add("is-panning");
  lightboxViewport.setPointerCapture(event.pointerId);
  event.preventDefault();
});

lightboxViewport.addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerId !== lightboxPointerId) return;
    lightboxPanX = lightboxDragStartPanX + event.clientX - lightboxDragStartX;
    lightboxPanY = lightboxDragStartPanY + event.clientY - lightboxDragStartY;
    constrainLightboxPan();
    applyLightboxTransform();
    event.preventDefault();
  },
  { passive: false }
);

const finishLightboxDrag = (event) => {
  if (event.pointerId !== lightboxPointerId) return;
  if (lightboxViewport.hasPointerCapture(event.pointerId)) {
    lightboxViewport.releasePointerCapture(event.pointerId);
  }
  lightboxPointerId = null;
  lightboxViewport.classList.remove("is-panning");
};

lightboxViewport.addEventListener("pointerup", finishLightboxDrag);
lightboxViewport.addEventListener("pointercancel", finishLightboxDrag);

window.addEventListener("resize", () => {
  if (lightbox.classList.contains("is-open")) resetLightboxView();
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox || event.target.classList.contains("lightbox__stage")) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (lightbox.classList.contains("is-open")) {
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
    return;
  }

  if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
    setMenu(false);
    menuButton.focus();
  }
});

const siteHeader = document.querySelector(".site-header");
const homeIndex = document.querySelector(".home-index");

if (siteHeader && homeIndex) {
  let headerTicking = false;

  const updateHeaderTheme = () => {
    const threshold = homeIndex.offsetTop + homeIndex.offsetHeight - siteHeader.offsetHeight;
    siteHeader.classList.toggle("is-on-dark", window.scrollY < threshold);
    headerTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!headerTicking) {
        window.requestAnimationFrame(updateHeaderTheme);
        headerTicking = true;
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", updateHeaderTheme);
  updateHeaderTheme();
}
