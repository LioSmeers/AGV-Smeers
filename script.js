(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");
  const backdrop = document.querySelector(".nav-backdrop");
  const mobileQuery = window.matchMedia("(max-width: 820px)");
  let menuOpen = false;

  const updateHeader = () => {
    header?.classList.toggle("header--scrolled", window.scrollY > 24);
  };

  const setMenu = (open, returnFocus = false) => {
    if (!header || !menuButton || !navigation) return;

    menuOpen = Boolean(open && mobileQuery.matches);
    header.classList.toggle("menu-active", menuOpen);
    document.body.classList.toggle("menu-open", menuOpen);
    menuButton.setAttribute("aria-expanded", String(menuOpen));
    menuButton.setAttribute("aria-label", menuOpen ? "Menu sluiten" : "Menu openen");
    navigation.inert = mobileQuery.matches && !menuOpen;

    if (menuOpen) {
      requestAnimationFrame(() => navigation.querySelector("a")?.focus());
    } else if (returnFocus) {
      menuButton.focus();
    }
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  menuButton?.addEventListener("click", () => setMenu(!menuOpen, menuOpen));
  backdrop?.addEventListener("click", () => setMenu(false, true));

  navigation?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  const syncNavigation = () => {
    if (!mobileQuery.matches) {
      setMenu(false);
      if (navigation) navigation.inert = false;
    } else if (navigation) {
      navigation.inert = !menuOpen;
    }
  };

  mobileQuery.addEventListener?.("change", syncNavigation);
  syncNavigation();

  document.addEventListener("keydown", (event) => {
    if (!menuOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(false, true);
      return;
    }

    if (event.key === "Tab" && menuButton && navigation) {
      const focusable = [menuButton, ...navigation.querySelectorAll("a[href], button:not([disabled])")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveal-ready");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

    document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));
  }

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-comparison]").forEach((comparison) => {
    const range = comparison.querySelector(".comparison__range");
    if (!range) return;

    const updateComparison = () => {
      const position = `${range.value}%`;
      comparison.style.setProperty("--comparison-position", position);
      range.setAttribute("aria-valuetext", `${range.value} procent werkfase zichtbaar`);
    };

    range.addEventListener("input", updateComparison);
    range.addEventListener("change", updateComparison);
    updateComparison();
  });

  const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
  const lightbox = document.querySelector(".lightbox");
  const lightboxImage = lightbox?.querySelector("figure img");
  const lightboxCaption = lightbox?.querySelector("figcaption");
  const closeButton = lightbox?.querySelector(".lightbox-close");
  const previousButton = lightbox?.querySelector(".lightbox-prev");
  const nextButton = lightbox?.querySelector(".lightbox-next");
  let activeImage = 0;
  let galleryTrigger = null;

  const updateLightbox = (index) => {
    if (!lightboxImage || !lightboxCaption || galleryItems.length === 0) return;

    activeImage = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[activeImage];
    lightboxImage.src = item.dataset.src;
    lightboxImage.alt = item.dataset.alt || "Realisatie van AGV Smeers";
    lightboxCaption.textContent = `${item.dataset.caption || "Realisatie"} · ${activeImage + 1} van ${galleryItems.length}`;

    const nextIndex = (activeImage + 1) % galleryItems.length;
    const preload = new Image();
    preload.src = galleryItems[nextIndex].dataset.src;
  };

  const openLightbox = (index, trigger) => {
    if (!lightbox || typeof lightbox.showModal !== "function") return;
    galleryTrigger = trigger;
    updateLightbox(index);
    lightbox.showModal();
    closeButton?.focus();
  };

  const closeLightbox = () => {
    if (!lightbox?.open) return;
    lightbox.close();
    galleryTrigger?.focus();
  };

  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => openLightbox(index, item));
  });

  closeButton?.addEventListener("click", closeLightbox);
  previousButton?.addEventListener("click", () => updateLightbox(activeImage - 1));
  nextButton?.addEventListener("click", () => updateLightbox(activeImage + 1));

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  lightbox?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateLightbox(activeImage - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      updateLightbox(activeImage + 1);
    }
  });

  const form = document.querySelector("#offerteformulier");

  const validationMessage = (field) => {
    if (field.validity.valueMissing) {
      if (field.type === "checkbox") return "Vink dit vakje aan om verder te gaan.";
      if (field.tagName === "SELECT") return "Kies een dienst.";
      return "Vul dit verplichte veld in.";
    }
    if (field.validity.typeMismatch) return "Vul een geldig e-mailadres in.";
    if (field.validity.patternMismatch) return "Vul een geldig telefoonnummer in.";
    return "Controleer dit veld.";
  };

  const validateField = (field) => {
    const error = document.querySelector(`#${field.id}-error`);
    const valid = field.checkValidity();
    field.setAttribute("aria-invalid", String(!valid));
    if (error) error.textContent = valid ? "" : validationMessage(field);
    return valid;
  };

  if (form) {
    const fields = Array.from(form.querySelectorAll("input[required], select[required], textarea[required]"));

    fields.forEach((field) => {
      field.addEventListener(field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input", () => {
        if (field.getAttribute("aria-invalid") === "true" || field.value) validateField(field);
      });
      field.addEventListener("blur", () => validateField(field));
    });

    form.addEventListener("submit", (event) => {
      const invalidFields = fields.filter((field) => !validateField(field));
      if (invalidFields.length > 0) {
        event.preventDefault();
        invalidFields[0].focus();
      }
    });
  }
})();
