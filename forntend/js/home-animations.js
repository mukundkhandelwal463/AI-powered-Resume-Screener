document.addEventListener("DOMContentLoaded", () => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initial Hero Animations
    const heroTl = gsap.timeline();
    
    // Navbar Animation
    heroTl.from(".navbar", {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    })
    // Hero Text
    .from(".hero-copy > *", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
    }, "-=0.4")
    // Hero Cards (right side panel)
    .from(".hero-panel", {
        x: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.6")
    .from([".hero-card-main", ".hero-card-accent"], {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
    }, "-=0.4")
    .from(".panel-glow", {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: "power2.out"
    }, "-=0.8");

    // Scroll Animations
    
    // Intro Grid Cards
    gsap.from(".intro-grid .spotlight-card", {
        scrollTrigger: {
            trigger: ".intro-grid",
            start: "top 80%",
            toggleActions: "play none none reverse"
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
    });

    // Workflows Header
    gsap.from("#workflows .section-heading", {
        scrollTrigger: {
            trigger: "#workflows",
            start: "top 85%",
            toggleActions: "play none none reverse"
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    });

    // Workflows Cards
    gsap.from("#workflows .workflow-card", {
        scrollTrigger: {
            trigger: "#workflows",
            start: "top 80%",
            toggleActions: "play none none reverse"
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
    });

    // Features Section
    gsap.from("#features .section-heading", {
        scrollTrigger: {
            trigger: "#features",
            start: "top 85%",
            toggleActions: "play none none reverse"
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    });

    // Feature Cards
    gsap.from(".feature-card", {
        scrollTrigger: {
            trigger: ".feature-grid",
            start: "top 80%",
            toggleActions: "play none none reverse"
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
    });

    // Architecture Stack
    gsap.from("#stack .section-heading", {
        scrollTrigger: {
            trigger: "#stack",
            start: "top 85%",
            toggleActions: "play none none reverse"
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    });

    gsap.from("#stack .stack-card", {
        scrollTrigger: {
            trigger: ".stack-grid",
            start: "top 80%",
            toggleActions: "play none none reverse"
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
    });

    // Process Steps
    gsap.from(".steps-section .section-heading", {
        scrollTrigger: {
            trigger: ".steps-section",
            start: "top 85%",
            toggleActions: "play none none reverse"
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    });

    gsap.from(".steps-section .step-card", {
        scrollTrigger: {
            trigger: ".steps-grid",
            start: "top 80%",
            toggleActions: "play none none reverse"
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
    });

    // CTA Section
    gsap.from(".cta-card", {
        scrollTrigger: {
            trigger: ".cta-section",
            start: "top 85%",
            toggleActions: "play none none reverse" // re-trigger if they scroll up and down
        },
        scale: 0.95,
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    });
});
