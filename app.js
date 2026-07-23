/* ==========================================
   GRU Space Clone JS Logic
   ========================================== */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";
import { BG_WIDTH, BG_HEIGHT, BG_PALETTE, BG_PIXELS } from "./assets/nature_bg_data.js";


document.addEventListener("DOMContentLoaded", () => {
  
  // ==========================================
  // 1. Devices & Resizing Triggers
  // ==========================================
  let isMobile = window.matchMedia("(max-width: 568px)").matches;
  const desktopVideo = document.querySelector(".video-desktop");
  const mobileVideo = document.querySelector(".video-mobile");
  let heroVideo = isMobile ? mobileVideo : desktopVideo;

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newIsMobile = window.matchMedia("(max-width: 568px)").matches;
      if (isMobile !== newIsMobile) {
        location.reload();
      }
    }, 250);
  });


  // ==========================================
  // 2. Background Video Play & Mute Controls
  // ==========================================
  function ensureVideoSrc(video) {
    if (!video) return;
    const source = video.querySelector("source");
    if (!source) return;
    const url = source.getAttribute("src");
    if (url && !video.getAttribute("src")) {
      video.load();
    }
  }

  function playHeroVideo() {
    if (!heroVideo || typeof heroVideo.play !== "function") return;
    ensureVideoSrc(heroVideo);
    heroVideo.muted = true;
    heroVideo.playsInline = true;
    heroVideo.play().catch(() => {});
  }

  // Play immediately
  playHeroVideo();

  // Mute control click handler
  const muteBtn = document.getElementById("mute-btn-wrap");
  const iconMuted = document.getElementById("icon-muted");
  const iconUnmuted = document.getElementById("icon-unmuted");
  const muteText = document.getElementById("mute-status-text");

  if (muteBtn && heroVideo) {
    muteBtn.addEventListener("click", () => {
      heroVideo.muted = !heroVideo.muted;
      if (heroVideo.muted) {
        iconMuted.style.display = "block";
        iconUnmuted.style.display = "none";
        muteText.textContent = "Off ";
      } else {
        iconMuted.style.display = "none";
        iconUnmuted.style.display = "block";
        muteText.textContent = "On ";
      }
    });
  }


  // ==========================================
  // 3. Scroll Scrub Image Sequence (Canvas)
  // ==========================================
  const canvas = document.querySelector(".scroll-canvas");
  const context = canvas?.getContext("2d");
  const frameCount = 160;
  const images = [];
  let videoFrames = { frame: 0 };

  const currentFrame = (index) =>
    `https://webflow-resources.b-cdn.net/framers_avif/${(index + 1).toString().padStart(3, "0")}.avif`;

  const currentFrameMob = (index) =>
    `https://webflow-resources.b-cdn.net/framers_avif_mob/${(index + 1).toString().padStart(3, "0")}.avif`;

  const setCanvasSize = () => {
    if (!canvas) return;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * pixelRatio;
    canvas.height = window.innerHeight * pixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const render = () => {
    if (!canvas || !context) return;
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const img = images[videoFrames.frame];
    if (img && img.complete && img.naturalWidth > 0) {
      const imageAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = canvasWidth / canvasHeight;

      let drawWidth, drawHeight, drawX, drawY;

      if (imageAspect > canvasAspect) {
        drawHeight = canvasHeight;
        drawWidth = drawHeight * imageAspect;
        drawX = (canvasWidth - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = canvasWidth;
        drawHeight = drawWidth / imageAspect;
        drawX = 0;
        drawY = (canvasHeight - drawHeight) / 2;
      }

      context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }
  };

  function preloadFrames() {
    return new Promise((resolve) => {
      let loaded = 0;
      const frameGetter = isMobile ? currentFrameMob : currentFrame;
      
      for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.onload = img.onerror = () => {
          loaded++;
          if (loaded === frameCount) resolve();
        };
        img.src = frameGetter(i);
        images.push(img);
      }
    });
  }

  const setupScrollTrigger = () => {
    if (!canvas) return;
    gsap.to(videoFrames, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger: ".s_roadmap_trigger",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
      },
      onUpdate: render
    });
    ScrollTrigger.refresh();
  };

  // Initialize Canvas scroll
  preloadFrames().then(() => {
    setCanvasSize();
    render();
    setupScrollTrigger();
  });

  window.addEventListener("resize", () => {
    if (canvas) {
      setCanvasSize();
      render();
    }
  });


  // ==========================================
  // 4. Roadmap Timeline Text Active Toggles
  // ==========================================
  const trigger = document.querySelector(".s_step_trigger");
  const cards = gsap.utils.toArray(".s_roadmap_card_wrap");
  const items = gsap.utils.toArray(".s_roadmap_progress_item");
  const progressWrap = document.querySelector(".s_roadmap_progress_wrap");
  const textProgressWrap = document.querySelector(".s_roadmap_tag_wrap");

  if (trigger && cards.length) {
    const cardsCount = cards.length;          
    const progressCount = cardsCount - 1;    
    const bars = items.map((it) => it.querySelector(".s_roadmap_progress_bar"));

    // Pre-set layouts
    gsap.set(cards, { opacity: 0, y: 20 });
    gsap.set(cards[0], { opacity: 1, y: 0 });

    const setActiveCard = (index) => {
      cards.forEach((c, i) => {
        if (i === index) {
          c.classList.add("is-active");
          gsap.to(c, { opacity: 1, y: 0, duration: 0.5 });
        } else {
          c.classList.remove("is-active");
          gsap.to(c, { opacity: 0, y: -20, duration: 0.5 });
        }
      });
    };

    const setActiveProgress = (index) => {
      items.forEach((it, i) => it.classList.toggle("is-active", i === index));
    };

    const setBars = (stepIndex, progress01) => {
      bars.forEach((bar, i) => {
        if (!bar) return;
        if (i < stepIndex) bar.style.width = "100%";
        else if (i === stepIndex) bar.style.width = `${Math.round(progress01 * 100)}%`;
        else bar.style.width = "0%";
      });
    };

    ScrollTrigger.create({
      trigger,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const total = self.progress * cardsCount;
        let cardIndex = Math.floor(total);
        if (cardIndex >= cardsCount) cardIndex = cardsCount - 1;

        const sectionProgress = total - cardIndex;

        setActiveCard(cardIndex);

        if (progressWrap && textProgressWrap) {
          progressWrap.style.display = (cardIndex === cardsCount - 1) ? "none" : "";
          textProgressWrap.style.display = (cardIndex === cardsCount - 1) ? "none" : "";
        }

        if (cardIndex < progressCount) {
          setActiveProgress(cardIndex);
          setBars(cardIndex, sectionProgress);
        } else {
          setBars(progressCount - 1, 1);
        }
      }
    });
  }


  // ==========================================
  // 5. Three.js Canyon Viewer
  // ==========================================
  const SCENE_URL = "assets/models/cyn.glb";

  class ModelApp {
    constructor() {
      this.canvas = document.querySelector("#sketch");
      this.container = document.querySelector(".s_model_content");

      if (!this.canvas || !this.container) return;

      this.scene = new THREE.Scene();
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: !isMobile,
        alpha: true,
        powerPreference: isMobile ? "low-power" : "high-performance"
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = isMobile ? 0.9 : 1.0;

      this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
      this.camera.position.set(0, 0, 6);
      this.baseCamZ = 6;

      this.model = null;
      this.pivot = null;
      this.cameraTarget = new THREE.Vector3();
      this.cameraViewDirection = new THREE.Vector3(0.72, 0.56, 1).normalize();
      this.isFramed = false;

      this.animate = this.animate.bind(this);
      this.onResize = this.onResize.bind(this);

      window.addEventListener("resize", this.onResize, { passive: true });
      this.ro = new ResizeObserver(this.onResize);
      this.ro.observe(this.container);

      this.onResize();
      this.animate();
    }

    animate() {
      requestAnimationFrame(this.animate);
      if (this.pivot) {
        this.pivot.rotation.y += 0.003;
      }
      this.renderer.render(this.scene, this.camera);
    }

    onResize() {
      const rect = this.container.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();

      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
      this.renderer.setSize(w, h, false);

      const baseW = 1200;
      const scale = baseW / w;
      const factor = Math.min(Math.max(scale, 1), 2.2);
      if (this.isFramed) {
        this.camera.position.copy(this.cameraTarget).addScaledVector(this.cameraViewDirection, this.baseCamZ * factor);
        this.camera.lookAt(this.cameraTarget);
      } else {
        this.camera.position.z = this.baseCamZ * factor;
      }
    }

    fitCameraToObject(object3D, offset = 1.1) {
      object3D.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(object3D);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      const fov = this.camera.fov * (Math.PI / 180);
      let camZ = (maxDim / 2) / Math.tan(fov / 2);
      camZ *= offset;

      this.baseCamZ = camZ;
      this.onResize();
    }

    frameAndLookAt(object3D) {
      object3D.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(object3D);
      const center = box.getCenter(new THREE.Vector3());
      this.cameraTarget.copy(center);
      this.isFramed = true;
      this.onResize();
    }

    installDragRotate() {
      this.isDragging = false;
      let lastX = 0;
      let lastY = 0;
      const controlSurface = this.container;

      this.canvas.style.cursor = "grab";
      controlSurface.style.cursor = "grab";

      controlSurface.addEventListener("pointerdown", (e) => {
        if (!this.pivot) return;
        this.canvas.focus({ preventScroll: true });
        this.isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        this.canvas.style.cursor = "grabbing";
        controlSurface.style.cursor = "grabbing";
      });

      controlSurface.addEventListener("pointermove", (e) => {
        if (!this.pivot || !this.isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        this.pivot.rotation.y += dx * 0.007;
        this.pivot.rotation.x += dy * 0.005;
        this.pivot.rotation.x = Math.max(-0.6, Math.min(0.6, this.pivot.rotation.x));
      });

      const stopDrag = () => {
        this.isDragging = false;
        this.canvas.style.cursor = "grab";
        controlSurface.style.cursor = "grab";
      };

      controlSurface.addEventListener("pointerup", stopDrag);
      controlSurface.addEventListener("pointercancel", stopDrag);
      controlSurface.addEventListener("pointerleave", stopDrag);

      controlSurface.addEventListener("wheel", (event) => {
        event.preventDefault();
        this.zoomCamera(event.deltaY);
      }, { passive: false });
    }

    installKeyboardMove() {
      this.canvas.tabIndex = 0;
      this.canvas.style.outline = "none";
      window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        if (!this.controlsActive || !['w', 'a', 's', 'd'].includes(key)) return;
        this.keys.add(key);
        event.preventDefault();
      });
      window.addEventListener("keyup", (event) => {
        const key = event.key.toLowerCase();
        if (!['w', 'a', 's', 'd'].includes(key)) return;
        this.keys.delete(key);
        event.preventDefault();
      });
      window.addEventListener("blur", () => this.keys.clear());
    }

    moveCamera() {
      if (!this.keys.size) return;
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
      const speed = Math.max(0.012, this.baseCamZ * 0.004);
      if (this.keys.has('w')) this.camera.position.addScaledVector(forward, speed);
      if (this.keys.has('s')) this.camera.position.addScaledVector(forward, -speed);
      if (this.keys.has('a')) this.camera.position.addScaledVector(right, -speed);
      if (this.keys.has('d')) this.camera.position.addScaledVector(right, speed);
    }

    zoomCamera(wheelDelta) {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      const zoomStep = this.baseCamZ * 0.0018 * wheelDelta;
      const nextPosition = this.camera.position.clone().addScaledVector(forward, -zoomStep);
      const nextDistance = nextPosition.distanceTo(this.cameraTarget);
      const minDistance = this.baseCamZ * 0.32;
      const maxDistance = this.baseCamZ * 4.2;
      if (nextDistance >= minDistance && nextDistance <= maxDistance) {
        this.camera.position.copy(nextPosition);
      }
    }
  }

  const modelSection = document.querySelector(".s-model");
  const loaderEl = document.querySelector(".loader-model");
  const canvasEl = document.querySelector("#sketch");

  let modelAppInstance = null;
  let started = false;

  function startModelLoad() {
    if (started) return;
    started = true;

    modelAppInstance = new ModelApp();
    if (!modelAppInstance.canvas) return;

    loaderEl.style.opacity = "1";
    canvasEl.style.opacity = "0";

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.5/");

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.setCrossOrigin("anonymous");

    gltfLoader.load(
      SCENE_URL,
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(0.85);

        const pivot = new THREE.Group();
        modelAppInstance.scene.add(pivot);
        pivot.add(model);

        model.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.z -= center.z;

        model.updateWorldMatrix(true, true);
        const box2 = new THREE.Box3().setFromObject(model);
        model.position.y -= box2.min.y;

        model.updateWorldMatrix(true, true);
        modelAppInstance.model = model;
        modelAppInstance.pivot = pivot;

        // Lighting
        modelAppInstance.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(3, 5, 2);
        modelAppInstance.scene.add(dirLight);

        modelAppInstance.fitCameraToObject(pivot, 0.95);
        modelAppInstance.frameAndLookAt(pivot);

        // Hide loader & show canvas
        gsap.to(loaderEl, { opacity: 0, duration: 0.35, onComplete: () => loaderEl.style.display = "none" });
        gsap.to(canvasEl, { opacity: 1, duration: 0.35 });
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          const progressTxt = loaderEl.querySelector(".loader-progress");
          if (progressTxt) progressTxt.textContent = `${percent}%`;
        }
      },
      (err) => {
        console.error("Error loading model:", err);
      }
    );
  }

  // Trigger 3D load on scroll
  if (modelSection) {
    ScrollTrigger.create({
      trigger: modelSection,
      start: "top 80%",
      once: true,
      onEnter: startModelLoad
    });
  }


  // ==========================================
  // 6. Mobile Collapsible Navigation Menu
  // ==========================================
  const mobMenuBtn = document.getElementById("mob-menu-btn");
  const menuNav = document.querySelector(".menu_nav");
  const burgerIcon = document.querySelector(".burger_menu");
  const closeIcon = document.querySelector(".close_menu");
  const navLinks = document.querySelectorAll(".link_nav");

  if (mobMenuBtn && menuNav) {
    mobMenuBtn.addEventListener("click", () => {
      menuNav.classList.toggle("open");
      if (menuNav.classList.contains("open")) {
        burgerIcon.style.display = "none";
        closeIcon.style.display = "block";
      } else {
        burgerIcon.style.display = "block";
        closeIcon.style.display = "none";
      }
    });

    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        menuNav.classList.remove("open");
        burgerIcon.style.display = "block";
        closeIcon.style.display = "none";
      });
    });
  }


  // ==========================================
  // 7. Interactive Form Submissions
  // ==========================================
  const subForm = document.getElementById("subscribe-form");
  const emailInput = document.getElementById("form-email");
  const successBox = document.getElementById("form-success");

  if (subForm && successBox) {
    subForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailVal = emailInput.value.trim();
      if (!emailVal) return;

      const submitBtn = subForm.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;

      // Mock subscription delays
      setTimeout(() => {
        subForm.style.display = "none";
        successBox.style.display = "block";
        gsap.from(successBox, { opacity: 0, y: 10, duration: 0.4 });
      }, 1000);
    });
  }

  // ==========================================
  // 8. Animated Image-Based Dither Overlay (Code-Only Pixel Canvas)
  // ==========================================
  const ditherCanvas = document.getElementById("dither-canvas");
  if (ditherCanvas && typeof BG_PIXELS !== "undefined") {
    const ditherCtx = ditherCanvas.getContext("2d");
    const scale = 2; // Match the 2x nearest-neighbor upscaled image pixel ratio
    let w = 0;
    let h = 0;
    
    // Unpack BG_PIXELS and BG_PALETTE into a flat RGBA memory grid at load time
    const imgPixels = new Uint8ClampedArray(BG_WIDTH * BG_HEIGHT * 4);
    for (let i = 0; i < BG_WIDTH * BG_HEIGHT; i++) {
      const hex = BG_PIXELS.substring(i * 2, i * 2 + 2);
      const paletteIdx = parseInt(hex, 16);
      const color = BG_PALETTE[paletteIdx] || [0, 0, 0];
      const offset = i * 4;
      imgPixels[offset] = color[0];
      imgPixels[offset + 1] = color[1];
      imgPixels[offset + 2] = color[2];
      imgPixels[offset + 3] = 255; // Fully opaque
    }
    
    let ditherInitialized = false;
    
    initDither();
    
    function initDither() {
      if (ditherInitialized) return;
      ditherInitialized = true;
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      requestAnimationFrame(renderLoop);
    }
    
    function resizeCanvas() {
      w = Math.ceil(window.innerWidth / scale);
      h = Math.ceil(window.innerHeight / scale);
      
      ditherCanvas.width = w;
      ditherCanvas.height = h;
    }
    
    const bayerMatrix = [
      [0.0625, 0.5625, 0.1875, 0.6875],
      [0.8125, 0.3125, 0.9375, 0.4375],
      [0.2500, 0.7500, 0.1250, 0.6250],
      [1.0000, 0.5000, 0.8750, 0.3750]
    ];
    
    let frame = 0;
    let lastTime = 0;
    const fpsInterval = 1000 / 12; // 12 FPS for classic retro look
    
    function renderLoop(timestamp) {
      requestAnimationFrame(renderLoop);
      
      if (timestamp - lastTime < fpsInterval) return;
      lastTime = timestamp;
      
      ditherCtx.clearRect(0, 0, w, h);
      
      const outImgData = ditherCtx.createImageData(w, h);
      const outData = outImgData.data;
      
      frame = (frame + 1) % 360;
      
      // Calculate cover-fit dimensions to map screen coordinates to 256x144 memory grid
      const s = Math.max(w / BG_WIDTH, h / BG_HEIGHT);
      const offsetX = (w - BG_WIDTH * s) / 2;
      // Shift crop window down to show more of the bottom lake and mountain reflections instead of top sky
      const offsetY = (h - BG_HEIGHT * s) * 0.75;
      
      for (let y = 0; y < h; y++) {
        const matrixY = y % 4;
        for (let x = 0; x < w; x++) {
          const matrixX = x % 4;
          const idx = (y * w + x) * 4;
          
          let dx = 0;
          let dy = 0;
          
          // Mathematically seamless base time step (wraps perfectly at frame 360)
          const base_t = frame * (2 * Math.PI / 360);
          
          // Calculate brightness of source pixel BEFORE warp to isolate tree/sky
          const rawSrcX = Math.max(0, Math.min(BG_WIDTH - 1, Math.floor((x - offsetX) / s)));
          const rawSrcY = Math.max(0, Math.min(BG_HEIGHT - 1, Math.floor((y - offsetY) / s)));
          const rawSrcIdx = (rawSrcY * BG_WIDTH + rawSrcX) * 4;
          
          const rawR = imgPixels[rawSrcIdx];
          const rawG = imgPixels[rawSrcIdx + 1];
          const rawB = imgPixels[rawSrcIdx + 2];
          const rawBrightness = (rawR * 0.299 + rawG * 0.587 + rawB * 0.114) / 255;
          
          const isForegroundPlant = ((rawSrcX < BG_WIDTH * 0.30 && rawSrcY > BG_HEIGHT * 0.68) || (rawSrcX > BG_WIDTH * 0.72 && rawSrcY > BG_HEIGHT * 0.70)) && (rawBrightness < 0.48);
          
          if (isForegroundPlant) {
            // Keep foreground plants completely static (no sway)
          } else if (rawSrcY > BG_HEIGHT * 0.55) {
            // Grass hill subtle sway
            const baseFactor = (rawSrcY - BG_HEIGHT * 0.55) / (BG_HEIGHT * 0.45);
            const factor = Math.pow(baseFactor, 2.8);
            const grass_t = frame * (2 * Math.PI / 360) * 2;
            dx += Math.sin(grass_t) * 1.8 * factor;
          }
          
          // Lake ripples (bottom-right water area)
          const isLakeArea = (rawSrcY > BG_HEIGHT * 0.60) && (rawSrcX > BG_WIDTH * 0.32);
          if (isLakeArea) {
            const lake_t = frame * (2 * Math.PI / 360) * 3;
            dx += Math.sin(rawSrcY * 0.15 - lake_t) * 0.6;
            dy += Math.cos(rawSrcX * 0.1 + lake_t) * 0.4;
          }
          
          // Map warped coordinate back to low-res source grid space
          const warpX = x + dx;
          const warpY = y + dy;
          const srcX = Math.max(0, Math.min(BG_WIDTH - 1, Math.floor((warpX - offsetX) / s)));
          const srcY = Math.max(0, Math.min(BG_HEIGHT - 1, Math.floor((warpY - offsetY) / s)));
          const srcIdx = (srcY * BG_WIDTH + srcX) * 4;
          
          const r = imgPixels[srcIdx];
          const g = imgPixels[srcIdx + 1];
          const b = imgPixels[srcIdx + 2];
          const a = imgPixels[srcIdx + 3];
          
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          const bayerVal = bayerMatrix[matrixY][matrixX];
          
          // Slow loop-friendly wave shimmer (loops 2 times per 360 frames)
          const shimmer_t = base_t * 2;
          const wave = Math.sin(x * 0.1 + y * 0.1 + shimmer_t) * 0.12;
          const animBayer = (bayerVal + wave + 1.0) % 1.0;
          
          let drawDither = false;
          let color = [0, 0, 0, 0];
          
          // Classify the local color of the background image
          const isBlue = (b > r && b > g * 0.9);
          const isGreen = (g > b && g > r * 0.9) && (y > h * 0.55); // Grass dither pushed lower (starts at 55% screen height)
          const isWarm = (r > b && r > g * 0.8); // Sunset tones (orange, peach, pink, red)
          
          // Only draw light dither highlights (no dark shadow dither overlays to keep the image bright and clean)
          if (brightness >= 0.5 && brightness < 0.85) {
            if (isGreen) {
              // Static bayer threshold (no wave/shimmer) to prevent flickering/flashing on the grass hill
              // Higher threshold (1.24) for extremely sparse and subtle highlights
              if (brightness > bayerVal * 1.24) {
                drawDither = true;
                color = [220, 255, 100, 255]; // Fully opaque bright light green/yellow dither
              }
            } else if (isWarm) {
              // High threshold (1.26) and slow shimmer to make cloud dither extremely sparse and subtle on the left side
              if (brightness > animBayer * 1.26) {
                drawDither = true;
                color = [255, 200, 150, 255]; // Fully opaque soft peach/coral dither in clouds
              }
            }
          }
          
          if (drawDither) {
            outData[idx] = color[0];
            outData[idx + 1] = color[1];
            outData[idx + 2] = color[2];
            outData[idx + 3] = color[3];
          } else {
            // Draw the background pixel (warped) directly onto the canvas
            outData[idx] = r;
            outData[idx + 1] = g;
            outData[idx + 2] = b;
            outData[idx + 3] = a;
          }
        }
      }
      
      ditherCtx.putImageData(outImgData, 0, 0);
    }
  }

  // ==========================================
  // 9. Animated dither treatment for the Waitlist artwork
  // ==========================================
  const waitlistCanvas = document.querySelector(".waitlist-dither-canvas");
  if (waitlistCanvas) {
    const waitlistPanel = waitlistCanvas.closest(".s_cta_newsletter_content_wrap");
    const waitlistCtx = waitlistCanvas.getContext("2d", { willReadFrequently: true });
    const waitlistSampleCanvas = document.createElement("canvas");
    const waitlistSampleCtx = waitlistSampleCanvas.getContext("2d", { willReadFrequently: true });
    const waitlistImage = new Image();
    let waitlistWidth = 0;
    let waitlistHeight = 0;
    let waitlistFrame = 0;
    let lastWaitlistFrame = 0;

    const resizeWaitlistCanvas = () => {
      const rect = waitlistPanel.getBoundingClientRect();
      // Render at half-resolution then scale crisply for the site's pixel look.
      waitlistWidth = Math.max(1, Math.round(rect.width / 2));
      waitlistHeight = Math.max(1, Math.round(rect.height / 2));
      waitlistCanvas.width = waitlistWidth;
      waitlistCanvas.height = waitlistHeight;
      waitlistSampleCanvas.width = waitlistWidth;
      waitlistSampleCanvas.height = waitlistHeight;
      waitlistCtx.imageSmoothingEnabled = false;
      waitlistSampleCtx.imageSmoothingEnabled = false;
    };

    const drawWaitlistDither = (timestamp) => {
      requestAnimationFrame(drawWaitlistDither);
      if (!waitlistImage.complete || !waitlistImage.naturalWidth || timestamp - lastWaitlistFrame < 83) return;
      lastWaitlistFrame = timestamp;
      waitlistFrame++;

      const imageAspect = waitlistImage.naturalWidth / waitlistImage.naturalHeight;
      const canvasAspect = waitlistWidth / waitlistHeight;
      let drawWidth = waitlistWidth;
      let drawHeight = waitlistHeight;
      let drawX = 0;
      let drawY = 0;
      if (imageAspect > canvasAspect) {
        drawWidth = waitlistHeight * imageAspect;
        drawX = (waitlistWidth - drawWidth) / 2;
      } else {
        drawHeight = waitlistWidth / imageAspect;
        drawY = (waitlistHeight - drawHeight) / 2;
      }

      // Sample the artwork offscreen. The visible canvas stays transparent except
      // for dither pixels belonging to the artwork's light-blue/aqua regions.
      waitlistSampleCtx.clearRect(0, 0, waitlistWidth, waitlistHeight);
      waitlistSampleCtx.drawImage(waitlistImage, drawX, drawY, drawWidth, drawHeight);
      const pixels = waitlistSampleCtx.getImageData(0, 0, waitlistWidth, waitlistHeight);
      const data = pixels.data;
      waitlistCtx.clearRect(0, 0, waitlistWidth, waitlistHeight);
      for (let y = 0; y < waitlistHeight; y += 2) {
        for (let x = 0; x < waitlistWidth; x += 2) {
          const index = (y * waitlistWidth + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const brightness = (r * .299 + g * .587 + b * .114) / 255;
          const isLightBlue = b > r * 1.08 && g > r * .98 && brightness > .56;
          const isAqua = g > r * 1.08 && b > r * 1.08 && brightness > .48;
          const xRatio = x / waitlistWidth;
          const yRatio = y / waitlistHeight;
          // These masks follow the two distinct blue formations in this artwork,
          // so the dither stays compositional instead of becoming a full overlay.
          const inBlueFormation =
            (xRatio > .39 && xRatio < .66 && yRatio > .38 && yRatio < .92) ||
            (xRatio > .71 && xRatio < .91 && yRatio > .08 && yRatio < .37);
          // A deterministic seed means every dither cell is anchored to this
          // exact part of the image. It does not sweep or respawn elsewhere.
          const fixedSeed = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
          const isDitherCell = Math.abs(fixedSeed) > .935;
          if (inBlueFormation && (isLightBlue || isAqua) && isDitherCell) {
            const phase = waitlistFrame * .09 + x * .17 + y * .13;
            // Each cell has its own small orbit. The pixel field stays in its
            // source formation while visibly rippling and blinking in place.
            const localX = Math.sin(phase) * 2.8 + Math.sin(waitlistFrame * .045 + y * .31) * 1.1;
            const localY = Math.cos(phase * 1.18) * 1.7;
            const pulse = .62 + (Math.sin(waitlistFrame * .13 + x * .23 - y * .16) + 1) * .19;
            const opacity = (isAqua ? .46 : .32) * pulse;
            waitlistCtx.fillStyle = `rgba(183, 229, 255, ${opacity})`;
            waitlistCtx.fillRect(x + localX, y + localY, 1, 1);
          }
        }
      }
    };

    waitlistImage.src = "assets/waitlist-background.png";
    resizeWaitlistCanvas();
    window.addEventListener("resize", resizeWaitlistCanvas, { passive: true });
    requestAnimationFrame(drawWaitlistDither);
  }

  // ==========================================
  // 10. Interactive Pixel Trail on Hover
  // ==========================================
  const visionSection = document.getElementById("vision");
  if (visionSection) {
    let lastSnappedLeft = -1;
    let lastSnappedTop = -1;
    
    visionSection.style.position = "relative";
    visionSection.style.overflow = "hidden";
    
    visionSection.addEventListener("mousemove", (e) => {
      const rect = visionSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const gridSpacing = 16; // 16px grid spacing for a clean look
      const snappedLeft = Math.floor(x / gridSpacing) * gridSpacing;
      const snappedTop = Math.floor(y / gridSpacing) * gridSpacing;
      
      // Avoid spawning multiple pixels in the same grid spot
      if (snappedLeft === lastSnappedLeft && snappedTop === lastSnappedTop) return;
      
      lastSnappedLeft = snappedLeft;
      lastSnappedTop = snappedTop;
      
      const pixelSize = 16;
      const pixel = document.createElement("div");
      pixel.style.position = "absolute";
      pixel.style.width = `${pixelSize}px`;
      pixel.style.height = `${pixelSize}px`;
      pixel.style.backgroundColor = "#006400"; // Dark green pixel color
      pixel.style.left = `${snappedLeft}px`;
      pixel.style.top = `${snappedTop}px`;
      pixel.style.pointerEvents = "none";
      pixel.style.zIndex = "10";
      pixel.style.opacity = "1";
      pixel.style.transition = "opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
      
      visionSection.appendChild(pixel);
      
      // Request frame to trigger smooth opacity transition
      requestAnimationFrame(() => {
        pixel.style.opacity = "0";
      });
      
      // Clean up the pixel after transition completes
      setTimeout(() => {
        pixel.remove();
      }, 800);
    });
  }

  // ==========================================
  // Navbar dark/light theme toggle on white section (#vision)
  // ==========================================
  const navbar = document.querySelector(".nav_bar");
  const visionSec = document.getElementById("vision");
  if (navbar && visionSec) {
    const handleNavbarTheme = () => {
      const rect = visionSec.getBoundingClientRect();
      const navbarHeight = navbar.offsetHeight || 80;
      // If the top of the vision section has reached the navbar,
      // and the bottom of the vision section is still below the navbar:
      if (rect.top <= navbarHeight && rect.bottom >= 0) {
        navbar.classList.add("nav-dark");
      } else {
        navbar.classList.remove("nav-dark");
      }
    };
    window.addEventListener("scroll", handleNavbarTheme, { passive: true });
    window.addEventListener("resize", handleNavbarTheme, { passive: true });
    handleNavbarTheme(); // Run initially
  }

});
