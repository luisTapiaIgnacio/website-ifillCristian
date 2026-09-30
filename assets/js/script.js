/* ==========================================================================
   DURAMEZ · script.js
   --------------------------------------------------------------------------
   01. Configuración
   02. Scrollspy: indicador amarillo del menú
   03. Scroll: navbar compacto + botón volver arriba
   04. Videos de fondo
   05. Cifras animadas
   06. Carrusel infinito de opiniones (marquee)
   07. Galería + lightbox
   08. Preselección del servicio
   09. Formularios
   ========================================================================== */
(() => {
  "use strict";

  /* 01. CONFIGURACIÓN ------------------------------------------------------ */
  const CONFIG = {
    endpoint: "assets/php/enviar.php",
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 02. SCROLLSPY: INDICADOR AMARILLO DEL MENÚ ---------------------------- */
  (function initNavIndicator() {
    const navPill = document.querySelector(".nav-pill");
    const indicator = document.querySelector(".nav-indicator");
    if (!navPill || !indicator) return;

    const links = Array.from(
      navPill.querySelectorAll('.nav-link[href^="#"]')
    );
    if (!links.length) return;

    // Mapeamos links → secciones por su id
    const sections = [];
    links.forEach((link) => {
      const id = link.getAttribute("href").slice(1);
      const section = document.getElementById(id);
      if (section) sections.push({ link, section });
    });

    let currentIndex = -1;

    // Mueve la píldora debajo del link correspondiente
    function moveIndicatorTo(link) {
      const pillRect = navPill.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();

      const offsetLeft = linkRect.left - pillRect.left;
      const width = linkRect.width;

      indicator.style.width = `${width}px`;
      indicator.style.transform = `translate(${offsetLeft}px, -50%)`;
    }

    function setActive(index) {
      if (index === currentIndex) return;
      currentIndex = index;

      links.forEach((l) => {
        l.classList.remove("active");
        l.removeAttribute("aria-current");
      });
      links[index].classList.add("active");
      links[index].setAttribute("aria-current", "true");

      moveIndicatorTo(links[index]);
      navPill.classList.add("has-active");
    }

    function updateActiveSection() {
      const scrollY = window.scrollY;
      const viewportMid = scrollY + window.innerHeight * 0.35;

      let active = 0;
      sections.forEach(({ section }, i) => {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        if (viewportMid >= top && viewportMid < bottom) {
          active = i;
        }
      });

      // Si estamos hasta arriba, forzamos "Inicio"
      if (scrollY < 80) active = 0;

      setActive(active);
    }

    function reposition() {
      if (currentIndex >= 0) {
        moveIndicatorTo(links[currentIndex]);
      }
    }

    // Scroll con rAF (rendimiento)
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateActiveSection();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    window.addEventListener("resize", reposition);
    window.addEventListener("load", () => {
      updateActiveSection();
      setTimeout(reposition, 200);
    });

    // Click: activa inmediatamente (feedback visual)
    links.forEach((link, i) => {
      link.addEventListener("click", () => setActive(i));
    });

    // Estado inicial
    updateActiveSection();
  })();

  /* 03. SCROLL: NAVBAR COMPACTO + VOLVER ARRIBA --------------------------- */
  const nav = $("#navPrincipal");
  const menu = $("#menuPrincipal");
  const btnTop = $("#btnTop");

  function updateOnScroll() {
    const y = window.scrollY;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    // Navbar compacto al bajar
    if (nav) nav.classList.toggle("is-scrolled", y > 24);

    // Botón volver arriba + anillo de progreso
    if (btnTop) {
      btnTop.classList.toggle("is-visible", y > 480);
      btnTop.style.setProperty(
        "--p",
        maxScroll > 0 ? Math.min(100, (y / maxScroll) * 100).toFixed(1) : 0
      );
    }
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateOnScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", updateOnScroll);
  updateOnScroll();

  // En móvil, cerrar el menú al elegir una opción
  if (menu) {
    menu.addEventListener("click", (e) => {
      if (
        e.target.closest("a") &&
        menu.classList.contains("show") &&
        window.bootstrap
      ) {
        window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
      }
    });
  }

  if (btnTop) {
    btnTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* 04. VIDEOS DE FONDO --------------------------------------------------- */
  $$(".bg-video").forEach((video) => {
    if (reduceMotion) {
      video.removeAttribute("autoplay");
      video.pause();
    } else {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  });

/*sobre nosotros++++++++++++ */



  /* 05. CIFRAS ANIMADAS --------------------------------------------------- */
  const counters = $$("[data-count]");
  const fmt = (el, n) =>
    `${el.dataset.prefix || ""}${n}${el.dataset.suffix || ""}`;

  function runCounter(el) {
    const end = Number(el.dataset.count);
    if (reduceMotion) return (el.textContent = fmt(el, end));
    const duration = 1600;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(el, Math.round(end * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          runCounter(en.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => {
      el.textContent = fmt(el, 0);
      io.observe(el);
    });
  }

  /* 06. CARRUSEL INFINITO DE OPINIONES ------------------------------------ */
  function initReviewsMarquee() {
    const track = document.querySelector(".reviews-marquee__track");
    if (!track) return;

    const originalItems = Array.from(track.children);
    if (originalItems.length < 2) return;

    // Duplicamos las cards una vez para tener 2 mitades idénticas.
    // La animación CSS mueve el track al -50% y al reiniciar empalma sin salto.
    const fragment = document.createDocumentFragment();
    originalItems.forEach((item) => {
      const copy = item.cloneNode(true);
      copy.setAttribute("aria-hidden", "true"); // no duplicar lecturas
      copy.querySelectorAll("a, button").forEach((el) => {
        el.tabIndex = -1; // no duplicar foco
      });
      fragment.appendChild(copy);
    });
    track.appendChild(fragment);

    // Ajustamos duración en función del ancho real:
    // así la velocidad se siente constante sin importar el tamaño de pantalla.
    function setDuration() {
      const halfWidth = track.scrollWidth / 2;
      const pixelsPerSecond = 60; // velocidad deseada
      const seconds = Math.max(20, halfWidth / pixelsPerSecond);
      track.style.animationDuration = `${seconds}s`;
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setDuration);
    }
    window.addEventListener("load", setDuration);
    window.addEventListener("resize", setDuration);
    setDuration();
  }
  initReviewsMarquee();

  /* 07. GALERÍA + LIGHTBOX ------------------------------------------------ */
  const grid = $("#galeriaGrid");
  const items = $$(".gallery__item", grid || document);

  // Si una imagen no existe, se conserva el recuadro oscuro con la cámara
  const dropBrokenImg = (img) => img.remove();
  $$(".gallery__item img").forEach((img) => {
    img.addEventListener("error", () => dropBrokenImg(img));
    if (img.complete && img.naturalWidth === 0) dropBrokenImg(img);
  });

  // «Ver más / Ver menos»
  const btnMore = $("#verMas");
  if (btnMore && grid) {
    const extras = items.filter((it) => it.hasAttribute("data-extra"));
    const label = $(".ver-mas__txt", btnMore);
    if (!extras.length) btnMore.hidden = true;

    btnMore.addEventListener("click", () => {
      const expand = btnMore.getAttribute("aria-expanded") !== "true";
      extras.forEach((it) => (it.hidden = !expand));
      grid.classList.toggle("is-expanded", expand);
      btnMore.setAttribute("aria-expanded", String(expand));
      if (label) label.textContent = expand ? "Ver menos" : "Ver más";
      if (expand) {
        extras[0].scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "nearest",
        });
      }
    });
  }

  // Lightbox (Bootstrap modal)
  const lb = $("#lightbox");
  if (lb) {
    const lbImg = $("#lightboxImg");
    const lbPh = $("#lightboxPh");
    const lbTitle = $("#lightboxTitle");
    let list = [];
    let pos = 0;

    const show = (i) => {
      pos = (i + list.length) % list.length;
      const it = list[pos];
      lbTitle.textContent = it.dataset.title || "Trabajo";
      lbImg.hidden = false;
      lbPh.hidden = true;
      lbImg.alt = it.dataset.title || "";
      lbImg.src = it.dataset.src;
    };

    lbImg.addEventListener("error", () => {
      lbImg.hidden = true;
      lbPh.hidden = false;
    });

    lb.addEventListener("show.bs.modal", (e) => {
      list = $$(".gallery__item:not([hidden])");
      show(Math.max(0, list.indexOf(e.relatedTarget)));
    });
    lb.addEventListener("hidden.bs.modal", () =>
      lbImg.removeAttribute("src")
    );

    $("#lbPrev").addEventListener("click", () => show(pos - 1));
    $("#lbNext").addEventListener("click", () => show(pos + 1));
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(pos - 1);
      if (e.key === "ArrowRight") show(pos + 1);
    });
  }

  /* 08. PRESELECCIÓN DEL SERVICIO ----------------------------------------- */

  /* 09. FORMULARIOS ------------------------------------------------------- */
  function showAlert(box, type, message) {
    if (!box) return;
    box.innerHTML = "";
    const div = document.createElement("div");
    div.className = `alert alert-${type}`;
    div.textContent = message;
    box.appendChild(div);
  }

  $$("form[data-mail-form]").forEach((form) => {
    const alertBox = $("[data-alert]", form);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (alertBox) alertBox.innerHTML = "";

      form.classList.add("was-validated");
      if (!form.checkValidity()) {
        const firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      form.classList.add("is-loading");
      try {
        const res = await fetch(CONFIG.endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          throw new Error(
            data.message || "El servidor no pudo enviar el mensaje."
          );
        }
        showAlert(
          alertBox,
          "success",
          data.message || "Mensaje enviado. Te responderemos pronto."
        );
        form.reset();
        form.classList.remove("was-validated");
      } catch (err) {
        const detail =
          err instanceof TypeError
            ? "No hay conexión con el servidor."
            : err.message;
        showAlert(
          alertBox,
          "danger",
          `${detail} Revisa los datos e inténtalo de nuevo, o escríbenos por correo.`
        );
      } finally {
        form.classList.remove("is-loading");
      }
    });
  });

  /* Año del footer */
  const year = $("#anio");
  if (year) year.textContent = new Date().getFullYear();
})();