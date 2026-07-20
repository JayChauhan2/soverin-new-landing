/* ==========================================
   GRU Space Clone JS Logic
   ========================================== */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";


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
  // 5. Three.js 3D Hotel Viewer
  // ==========================================
  const MODEL_URL = isMobile 
    ? "https://webflow-resources.b-cdn.net/GRU_Hotel_0001_26_mob.glb"
    : "https://webflow-resources.b-cdn.net/GRU_Hotel_0001_26.glb";

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

      this.animate = this.animate.bind(this);
      this.onResize = this.onResize.bind(this);

      window.addEventListener("resize", this.onResize, { passive: true });
      this.ro = new ResizeObserver(this.onResize);
      this.ro.observe(this.container);

      this.installDragRotate();
      this.onResize();
      this.animate();
    }

    animate() {
      requestAnimationFrame(this.animate);
      if (this.pivot) {
        // Slow constant rotation when not dragged
        if (!this.isDragging) {
          this.pivot.rotation.y += 0.003;
        }
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
      this.camera.position.z = this.baseCamZ * factor;
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
      this.camera.position.y = center.y;
      this.camera.lookAt(center);
    }

    installDragRotate() {
      this.isDragging = false;
      let lastX = 0;
      let lastY = 0;

      this.canvas.style.cursor = "grab";

      this.canvas.addEventListener("pointerdown", (e) => {
        if (!this.pivot) return;
        this.isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        this.canvas.style.cursor = "grabbing";
      });

      this.canvas.addEventListener("pointermove", (e) => {
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
      };

      this.canvas.addEventListener("pointerup", stopDrag);
      this.canvas.addEventListener("pointercancel", stopDrag);
      this.canvas.addEventListener("pointerleave", stopDrag);
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
      MODEL_URL,
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
  // 8. Animated Image-Based Dither Overlay
  // ==========================================
  const ditherCanvas = document.getElementById("dither-canvas");
  if (ditherCanvas) {
    const ditherCtx = ditherCanvas.getContext("2d");
    const scale = 3; // Match the 3x nearest-neighbor upscaled image pixel ratio
    let w = 0;
    let h = 0;
    
    // Offscreen canvas to analyze background image pixel brightness
    const offCanvas = document.createElement("canvas");
    const offCtx = offCanvas.getContext("2d");
    
    const bgImg = new Image();
    bgImg.src = "assets/nature_bg.jpg";
    
    let imgPixels = null;
    let ditherInitialized = false;
    
    bgImg.onload = () => {
      initDither();
    };
    
    if (bgImg.complete) {
      initDither();
    }
    
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
      
      offCanvas.width = w;
      offCanvas.height = h;
      
      // Calculate cover-fit dimensions to perfectly align canvas with object-fit: cover image
      const imgW = bgImg.naturalWidth;
      const imgH = bgImg.naturalHeight;
      if (imgW && imgH) {
        const s = Math.max(w / imgW, h / imgH);
        const renderW = imgW * s;
        const renderH = imgH * s;
        const dx = (w - renderW) / 2;
        const dy = (h - renderH) / 2;
        
        offCtx.clearRect(0, 0, w, h);
        offCtx.drawImage(bgImg, dx, dy, renderW, renderH);
        
        try {
          const imgData = offCtx.getImageData(0, 0, w, h);
          imgPixels = imgData.data;
        } catch (e) {
          console.error("Dither pixel extraction error:", e);
        }
      }
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
      
      if (!imgPixels) return;
      if (timestamp - lastTime < fpsInterval) return;
      lastTime = timestamp;
      
      ditherCtx.clearRect(0, 0, w, h);
      
      const outImgData = ditherCtx.createImageData(w, h);
      const outData = outImgData.data;
      
      frame = (frame + 1) % 8;
      
      for (let y = 0; y < h; y++) {
        const matrixY = y % 4;
        for (let x = 0; x < w; x++) {
          const matrixX = x % 4;
          const idx = (y * w + x) * 4;
          
          const r = imgPixels[idx];
          const g = imgPixels[idx + 1];
          const b = imgPixels[idx + 2];
          const a = imgPixels[idx + 3];
          
          if (a === 0) continue;
          
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          const bayerVal = bayerMatrix[matrixY][matrixX];
          
          // Wave-based shimmer animating only in midtones
          const wave = Math.sin(x * 0.1 + y * 0.1 + frame * 0.8) * 0.12;
          const animBayer = (bayerVal + wave + 1.0) % 1.0;
          
          let drawDither = false;
          let color = [0, 0, 0, 0];
          
          // Classify the local color of the background image
          const isBlue = (b > r && b > g * 0.9);
          const isGreen = (g > b && g > r * 0.9) && (y > h * 0.55); // Grass dither pushed lower (starts at 55% screen height)
          const isWarm = (r > b && r > g * 0.8); // Sunset tones (orange, peach, pink, red)
          
          if (isBlue && brightness >= 0.12 && brightness < 0.55) {
            // Specialized glistening water/lake shader to generate cyan highlight and navy shadow ripples
            if (brightness < animBayer * 0.72) {
              drawDither = true;
              color = [10, 25, 75, 45]; // Deep navy shadow ripple
            } else if (brightness > animBayer * 0.88) {
              drawDither = true;
              color = [90, 215, 255, 70]; // Glistening light blue/cyan highlight ripple
            }
          } else {
            // Standard shadow & highlight dither for land, grass, sky
            // Draw dark dither pixels in dark midtones to enhance shadow textures
            if (brightness >= 0.15 && brightness < 0.5) {
              if (brightness < animBayer * 0.85) {
                drawDither = true;
                if (isGreen) {
                  color = [5, 40, 15, 60]; // Deep forest green shadow dither in grass
                } else if (isWarm) {
                  color = [60, 20, 40, 50]; // Deep purple/rust shadow dither in sunset regions
                } else {
                  color = [2, 2, 4, 35]; // Default dark shadow
                }
              }
            }
            // Draw light dither pixels in light midtones to simulate glistening light
            else if (brightness >= 0.5 && brightness < 0.85) {
              if (brightness > animBayer * 1.05) {
                drawDither = true;
                if (isGreen) {
                  color = [220, 255, 100, 70]; // Bright light green/yellow dither in grass
                } else if (isWarm) {
                  color = [255, 200, 150, 60]; // Soft peach/coral dither in sunset clouds and peaks
                } else {
                  color = [255, 235, 205, 25]; // Default warm highlight
                }
              }
            }
          }
          
          if (drawDither) {
            outData[idx] = color[0];
            outData[idx + 1] = color[1];
            outData[idx + 2] = color[2];
            outData[idx + 3] = color[3];
          } else {
            outData[idx + 3] = 0;
          }
        }
      }
      
      ditherCtx.putImageData(outImgData, 0, 0);
    }
  }

});
