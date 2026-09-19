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
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    header?.style.setProperty("--page-progress", String(scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0));
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
  window.addEventListener("resize", updateHeader, { passive: true });

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
    const updateComparison = (progress) => {
      comparison.style.setProperty("--comparison-position", `${progress}%`);
    };

    const track = comparison.closest(".before-after");
    const stage = track?.querySelector(".before-after__stage");
    if (!track || !stage || reduceMotion) return;

    let frame = 0;
    const syncScroll = () => {
      frame = 0;
      if (!track.classList.contains("before-after--scroll")) {
        updateComparison(50);
        return;
      }
      const padding = parseFloat(getComputedStyle(track).paddingTop);
      const top = parseFloat(getComputedStyle(stage).top);
      const distance = track.offsetHeight - padding - stage.offsetHeight;
      const progress = (top - track.getBoundingClientRect().top - padding) / Math.max(1, distance);
      updateComparison(Math.max(0, Math.min(1, (progress - 0.08) / 0.84)) * 100);
    };
    const scheduleScroll = () => {
      if (!frame) frame = requestAnimationFrame(syncScroll);
    };
    const measureStage = () => {
      const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height"));
      track.style.setProperty("--stage-height", `${stage.offsetHeight}px`);
      track.classList.toggle("before-after--scroll", stage.offsetHeight <= window.innerHeight - headerHeight - 40);
      scheduleScroll();
    };
    window.addEventListener("scroll", scheduleScroll, { passive: true });
    window.addEventListener("resize", measureStage, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(measureStage).observe(stage);
    measureStage();
  });

  const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
  const gallery = document.querySelector(".gallery");
  const galleryToggle = document.querySelector(".gallery-toggle");
  const extraProjects = gallery ? Array.from(gallery.children).slice(4) : [];

  if (galleryToggle && extraProjects.length) {
    extraProjects.forEach((item) => { item.hidden = true; });
    galleryToggle.hidden = false;
    galleryToggle.addEventListener("click", () => {
      const expanded = galleryToggle.getAttribute("aria-expanded") !== "true";
      extraProjects.forEach((item) => { item.hidden = !expanded; });
      galleryToggle.setAttribute("aria-expanded", String(expanded));
      galleryToggle.innerHTML = expanded
        ? 'Minder realisaties <span aria-hidden="true">−</span>'
        : 'Meer realisaties <span aria-hidden="true">+</span>';
      if (!expanded) galleryToggle.scrollIntoView({ block: "center", behavior: "instant" });
    });
  }

  if ("IntersectionObserver" in window) {
    const navLinks = Array.from(navigation?.querySelectorAll('a[href^="#"]') || []);
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    document.querySelectorAll("main > section[id]").forEach((section) => sectionObserver.observe(section));

    const services = Array.from(document.querySelectorAll(".service-line"));
    const serviceObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        services.forEach((service) => service.classList.toggle("is-current", service === entry.target));
      });
    }, { rootMargin: "-35% 0px -45% 0px", threshold: 0 });
    services.forEach((service) => serviceObserver.observe(service));
  }

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
  lightbox?.querySelector(".lightbox-contact")?.addEventListener("click", () => {
    closeLightbox();
  });
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
    const submitButton = form.querySelector(".button--submit");
    const statusMessage = form.querySelector("[data-form-status]");

    const setFormStatus = (message, type = "success") => {
      if (!statusMessage) return;

      statusMessage.textContent = message;
      statusMessage.hidden = false;
      statusMessage.classList.toggle("form-status--success", type === "success");
      statusMessage.classList.toggle("form-status--error", type === "error");
    };

    const clearFormStatus = () => {
      if (!statusMessage) return;

      statusMessage.textContent = "";
      statusMessage.hidden = true;
      statusMessage.classList.remove("form-status--success", "form-status--error");
    };

    const formSubmitEndpoint = () => {
      const action = form.getAttribute("action") || "";
      return action.replace("https://formsubmit.co/", "https://formsubmit.co/ajax/");
    };

    fields.forEach((field) => {
      field.addEventListener(field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input", () => {
        if (field.getAttribute("aria-invalid") === "true" || field.value) validateField(field);
        if (!statusMessage?.hidden) clearFormStatus();
      });
      field.addEventListener("blur", () => validateField(field));
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFormStatus();

      const invalidFields = fields.filter((field) => !validateField(field));
      if (invalidFields.length > 0) {
        invalidFields[0].focus();
        return;
      }

      if (!submitButton) return;

      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = "Aanvraag wordt verstuurd...";

      try {
        const response = await fetch(formSubmitEndpoint(), {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });
        const responseText = await response.text();
        let result = {};

        try {
          result = responseText ? JSON.parse(responseText) : {};
        } catch {
          result = { message: responseText };
        }

        if (!response.ok || result.success === false || result.success === "false") {
          throw new Error(result.message || "De aanvraag kon niet worden verstuurd.");
        }

        form.reset();
        fields.forEach((field) => field.setAttribute("aria-invalid", "false"));
        setFormStatus("Aanvraag verstuurd. Bedankt, we nemen zo snel mogelijk contact met u op.");
      } catch (error) {
        const activationMessage = error.message.includes("needs Activation")
          ? "Het formulier moet nog geactiveerd worden via de activatiemail van FormSubmit."
          : "Er ging iets mis bij het versturen. Probeer opnieuw of neem telefonisch contact op.";

        setFormStatus(activationMessage, "error");
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    });
  }
})();
