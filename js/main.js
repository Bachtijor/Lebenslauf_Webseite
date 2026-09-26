(function () {
  "use strict";

  const FORM_ENDPOINT = "https://formsubmit.co/ajax/nuraliev@yahoo.com";
  const THEME_KEY = "bn-theme";

  /* Lovable-Logo, -Name und injiziertes Badge entfernen */
  const LOVABLE_SELECTOR = [
    "#lovable-badge",
    '[id*="lovable" i]',
    '[class*="lovable" i]',
    "[data-lovable]",
    'iframe[src*="lovable" i]',
    'a[href*="lovable.dev" i]',
    'a[href*="gptengineer" i]',
    'script[src*="lovable" i]',
    'script[src*="_flock"]'
  ].join(",");

  function isLovableBranding(el) {
    if (!el || el.nodeType !== 1) return false;
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (/edit with lovable/i.test(text) || /^lovable$/i.test(text)) return true;
    const href = (el.getAttribute && el.getAttribute("href")) || "";
    const src = (el.getAttribute && el.getAttribute("src")) || "";
    return /lovable\.(dev|app|so)|gptengineer/i.test(href + " " + src);
  }

  function stripLovableBranding(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(LOVABLE_SELECTOR).forEach((el) => el.remove());
    if (root && root.nodeType === 1 && root.matches && root.matches(LOVABLE_SELECTOR)) {
      root.remove();
      return;
    }
    (root && root.querySelectorAll ? root : document)
      .querySelectorAll("a, button, div, span")
      .forEach((el) => {
        if (!isLovableBranding(el)) return;
        const target = el.closest("a, button") || el;
        if (target && target !== document.body && target !== document.documentElement) {
          target.remove();
        }
      });
  }

  stripLovableBranding();
  const lovableObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) stripLovableBranding(node);
      });
    }
  });
  lovableObserver.observe(document.documentElement, { childList: true, subtree: true });

  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  const themeToggle = document.querySelector(".theme-toggle");
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  const navLinks = document.querySelectorAll("[data-nav]");

  /* Theme */
  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "dark" ? "Helles Design aktivieren" : "Dunkles Design aktivieren");
    }
  }

  applyTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }

  /* Header scroll */
  function onScroll() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }
    updateActiveNav();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  function closeMobileNav() {
    if (!mobileNav || !menuToggle) return;
    mobileNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function openMobileNav() {
    if (!mobileNav || !menuToggle) return;
    mobileNav.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.contains("is-open");
      isOpen ? closeMobileNav() : openMobileNav();
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileNav);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileNav();
    });
  }

  /* Active nav highlight */
  const sections = [...document.querySelectorAll("section[id]")];

  function updateActiveNav() {
    const scrollPos = window.scrollY + 120;
    let current = "home";

    for (const section of sections) {
      if (section.offsetTop <= scrollPos) {
        current = section.id;
      }
    }

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("is-active", href === `#${current}`);
    });
  }

  /* Scroll reveal */
  const revealEls = document.querySelectorAll(".reveal");

  function showAllReveals() {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* Hero sofort sichtbar, bevor Animationen aktiv werden */
  document.querySelectorAll("#home .reveal").forEach((el) => {
    el.classList.add("is-visible");
  });

  document.documentElement.classList.add("js-anim");

  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));

    /* Fallback: alles einblenden falls Observer nicht feuert (z. B. file://) */
    window.setTimeout(showAllReveals, 1200);
  } else {
    showAllReveals();
  }

  /* Stat counter animation */
  const statValues = document.querySelectorAll("[data-count]");

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const duration = 1200;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  if (statValues.length && "IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    statValues.forEach((el) => countObserver.observe(el));
  }

  /* Form validation & submit */
  function showStatus(type, message) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = `form-status is-visible form-status--${type}`;
  }

  function hideStatus() {
    if (!formStatus) return;
    formStatus.className = "form-status";
    formStatus.textContent = "";
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateField(input) {
    const errorEl = input.closest(".form-group")?.querySelector(".form-error");
    let message = "";

    if (input.required && !input.value.trim()) {
      message = "Dieses Feld ist erforderlich.";
    } else if (input.type === "email" && input.value.trim() && !validateEmail(input.value.trim())) {
      message = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    } else if (input.id === "message" && input.value.trim().length < 10) {
      message = "Die Nachricht sollte mindestens 10 Zeichen enthalten.";
    }

    input.classList.toggle("is-invalid", Boolean(message));
    if (errorEl) errorEl.textContent = message;
    return !message;
  }

  if (contactForm) {
    contactForm.querySelectorAll("input, textarea").forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.classList.contains("is-invalid")) validateField(field);
      });
    });

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideStatus();

      const fields = [...contactForm.querySelectorAll("input, textarea")];
      const isValid = fields.every((field) => validateField(field));
      if (!isValid) {
        showStatus("error", "Bitte korrigieren Sie die markierten Felder.");
        return;
      }

      const submitBtn = contactForm.querySelector('[type="submit"]');
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Wird gesendet…';

      const payload = {
        name: contactForm.name.value.trim(),
        email: contactForm.email.value.trim(),
        message: contactForm.message.value.trim(),
        _subject: "Neue Anfrage – Bakhtiyor Nuraliev Lebenslauf",
        _template: "table",
        _captcha: "false"
      };

      try {
        const response = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && (data.success === "true" || data.success === true || response.status === 200)) {
          showStatus("success", "Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet. Ich melde mich in Kürze.");
          contactForm.reset();
          fields.forEach((f) => f.classList.remove("is-invalid"));
        } else {
          throw new Error(data.message || "Senden fehlgeschlagen");
        }
      } catch {
        showStatus("error", "Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie direkt an nuraliev@yahoo.com.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  }
})();
