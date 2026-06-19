/**
 * Rasoi Raja Garam Masala - Premium Scroll Animation Engine
 * Handles image preloading, lerp-based smooth rendering on canvas, and narrative transitions.
 */

// Configuration
const frameCount = 296;
const images = [];
let targetFrame = 0;
let smoothFrame = 0;
const lerpFactor = 0.08; // Smoothness factor (lower = smoother/slower, higher = faster response)

// DOM Elements
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvas-container');

// Path Generator (ezgif-frame-001.jpg to ezgif-frame-296.jpg)
const getFramePath = (index) => {
    const paddedIndex = String(index).padStart(3, '0');
    return `./ezgif-frame-${paddedIndex}.jpg`;
};

// 1. Image Preloader
function preloadImages() {
    return new Promise((resolve) => {
        let loadedCount = 0;
        
        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            img.src = getFramePath(i);
            
            img.onload = () => {
                loadedCount++;
                updateLoadingProgress(loadedCount);
                if (loadedCount === frameCount) {
                    onPreloadComplete(resolve);
                }
            };
            
            img.onerror = () => {
                // If a frame fails to load, count it anyway to avoid hanging
                loadedCount++;
                updateLoadingProgress(loadedCount);
                if (loadedCount === frameCount) {
                    onPreloadComplete(resolve);
                }
            };
            
            images.push(img);
        }
    });
}

// Update loading bar and percentage text
function updateLoadingProgress(loadedCount) {
    const percent = Math.round((loadedCount / frameCount) * 100);
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
}

// Fade out preloader and run canvas
function onPreloadComplete(resolve) {
    // Elegant fade out of preloader
    setTimeout(() => {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        
        // Initial draw and loop startup
        resizeCanvas();
        requestAnimationFrame(animateLoop);
        
        // Initial fade calculations
        handleScroll();
        
        resolve();
    }, 600);
}

// 2. Canvas Rendering with Aspect Ratio (Object-Fit Cover)
function drawFrame(index) {
    const img = images[index];
    if (!img) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Fallbacks if image not fully loaded yet
    const imgWidth = img.naturalWidth || img.width || 1280;
    const imgHeight = img.naturalHeight || img.height || 720;
    
    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    // Scale image to cover canvas (like CSS object-fit: cover)
    if (imgRatio > canvasRatio) {
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imgRatio;
        drawX = (canvasWidth - drawWidth) / 2;
        drawY = 0;
    } else {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgRatio;
        drawX = 0;
        drawY = (canvasHeight - drawHeight) / 2;
    }
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// Handle Canvas Resize and DPI Adjustment
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    // Redraw immediately after resize
    const currentFrameIndex = Math.min(frameCount - 1, Math.max(0, Math.round(smoothFrame)));
    drawFrame(currentFrameIndex);
}

// 3. Animation Loop (Lerp Calculation)
function animateLoop() {
    // Standard linear interpolation: smoothFrame moves towards targetFrame by a percentage of the distance
    smoothFrame += (targetFrame - smoothFrame) * lerpFactor;
    
    // Bound and draw
    const frameIndexToDraw = Math.min(frameCount - 1, Math.max(0, Math.round(smoothFrame)));
    drawFrame(frameIndexToDraw);
    
    requestAnimationFrame(animateLoop);
}

// 4. Scroll Tracking & Text Fade Logic
function handleScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    
    // Scroll height available for the animation (first 4 narrative sections)
    // 0vh to 300vh (Hero, Sourcing, Blend, Reveal triggers)
    const animationScrollRange = viewportHeight * 3.2; 
    
    // Map scroll position to target frame (0 to 295)
    let scrollPercent = scrollTop / animationScrollRange;
    scrollPercent = Math.min(1, Math.max(0, scrollPercent));
    
    // Update target frame for the lerp loop
    targetFrame = scrollPercent * (frameCount - 1);
    
    // Nav Bar Header styling
    const header = document.querySelector('.main-header');
    if (scrollTop > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    // Fade out background canvas when scrolling into showcase section
    const fadeTrigger = viewportHeight * 3.4;
    if (scrollTop > fadeTrigger) {
        const opacity = 1 - Math.min(1, (scrollTop - fadeTrigger) / (viewportHeight * 0.6));
        canvasContainer.style.opacity = opacity;
    } else {
        canvasContainer.style.opacity = 1;
    }
    
    // Fade text content cards in and out based on proximity to section trigger
    const textSections = document.querySelectorAll('.scroll-section .section-content');
    textSections.forEach((content, index) => {
        const sectionCenter = index * viewportHeight;
        const distanceFromCenter = Math.abs(scrollTop - sectionCenter);
        const fadeRange = viewportHeight * 0.6; // Transition padding
        
        if (distanceFromCenter < fadeRange) {
            const opacity = 1 - (distanceFromCenter / fadeRange);
            content.style.opacity = opacity;
            // Add slight slide effect
            content.style.transform = `translateY(${(1 - opacity) * 30}px)`;
            content.classList.add('visible');
        } else {
            content.style.opacity = 0;
            content.style.transform = 'translateY(30px)';
            content.classList.remove('visible');
        }
    });
    
    // Update active nav links
    updateNavigation(scrollTop, viewportHeight);
}

// Update menu highlighting based on position
function updateNavigation(scrollTop, viewportHeight) {
    const showcase = document.getElementById('showcase-trigger');
    const order = document.getElementById('order-trigger');
    
    const showcaseTop = showcase ? showcase.offsetTop : 9999;
    const orderTop = order ? order.offsetTop : 9999;
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    if (scrollTop >= orderTop - viewportHeight / 2) {
        document.getElementById('nav-order').classList.add('active');
    } else if (scrollTop >= showcaseTop - viewportHeight / 2) {
        document.getElementById('nav-spices').classList.add('active');
    } else {
        document.getElementById('nav-home').classList.add('active');
    }
}

// 5. Event Listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('scroll', handleScroll);

// Smooth scroll to anchors (handling header offset)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;
        
        // Calculate offset (nav header height)
        const headerOffset = 70;
        const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    });
});

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    preloadImages();
});
