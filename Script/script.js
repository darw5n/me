//console.clear();

// Inizializza ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Inizializza Locomotive Scroll
const locoScroll = new LocomotiveScroll({
  el: document.querySelector(".smooth-scroll"),
  smooth: true,
  lerp: 0.05,
  multiplier: 1,
  reloadOnContextChange: true,
  touchMultiplier: 3,
  smoothMobile: 0,
  smartphone: {
    smooth: true,
    breakpoint: 767,
  },
  tablet: {
    smooth: true,
    breakpoint: 1024,
  },
});

// Aggiorna ScrollTrigger con ogni scroll
locoScroll.on("scroll", ScrollTrigger.update);

// tell ScrollTrigger to use these proxy methods for the ".smooth-scroll" element since Locomotive Scroll is hijacking things
ScrollTrigger.scrollerProxy(".smooth-scroll", {
  scrollTop(value) {
    return arguments.length
      ? locoScroll.scrollTo(value, 200, 0)
      : locoScroll.scroll.instance.scroll.y;
  }, // we don't have to define a scrollLeft because we're only scrolling vertically.
  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },
  // LocomotiveScroll handles things completely differently on mobile devices
  // - it doesn't even transform the container at all! So to get the correct behavior and avoid jitters,
  // we should pin things with position: fixed on mobile. We sense it by checking to see if there's a transform applied
  // to the container (the LocomotiveScroll-controlled element).
  pinType: document.querySelector(".smooth-scroll").style.transform
    ? "transform"
    : "fixed",
});

// Crea i trigger per le sezioni
const sections = gsap.utils.toArray("section");

// Itera su ciascuna sezione nell'array 'sections'
sections.forEach(function (section) {
  // Seleziona l'elemento interno della sezione in base alla classe
  const inner = section.classList.contains("sectionLeftAndRight")
    ? section.querySelector(".leftText")
    : section.querySelector(".section-inner");

  // Se la sezione non ha la classe 'horizontalScrolling'
  if (!section.classList.contains("horizontalScrolling")) {
    // Crea un trigger ScrollTrigger per la sezione
    ScrollTrigger.create({
      scroller: ".smooth-scroll", // Specifica lo scroller
      trigger: section, // Specifica l'elemento trigger
      start:
        section.scrollHeight <= window.innerHeight
          ? "top top"
          : "bottom bottom", // Imposta il punto di inizio
      end: "+=100%", // Imposta il punto di fine
      pin: inner, // Specifica l'elemento da fissare
      pinSpacing: false, // Disabilita lo spaziamento del pin
      pinType: "transform", // Imposta il tipo di pin
    });
  } else {
    // Se la sezione ha la classe 'horizontalScrolling'

    // Seleziona l'elemento di trigger per lo scroll orizzontale
    const scroll = section.querySelector("[data-scroll-in-section]");

    // Crea un trigger ScrollTrigger per la sezione
    ScrollTrigger.create({
      scroller: ".smooth-scroll", // Specifica lo scroller
      trigger: section, // Specifica l'elemento trigger
      start: "center center", // Imposta il punto di inizio
      // Calcola il punto di fine in base alla larghezza della finestra e della sezione
      end: () => {
        if (window.matchMedia("(min-width: 992px)").matches) {
          return `+=${(section.scrollWidth + window.innerWidth) / 1.15}`;
        } else {
          return `+=${section.scrollWidth + window.innerWidth}`;
        }
      },
      pin: inner, // Specifica l'elemento da fissare
      pinSpacing: true, // Abilita lo spaziamento del pin
      pinType: "transform", // Imposta il tipo di pin
      anticipatePin: 1, // Specifica il valore di anticipazione del pin
    });

    // Anima lo scroll orizzontale per l'elemento di trigger
    gsap.to(scroll, {
      x: () =>
        `${-(section.scrollWidth - document.documentElement.clientWidth)}px`, // Calcola la posizione di scroll
      ease: "none", // Imposta l'ease
      scrollTrigger: {
        trigger: scroll, // Specifica l'elemento trigger
        scroller: ".smooth-scroll", // Specifica lo scroller
        start: "center center", // Imposta il punto di inizio
        end: () => `+=${section.scrollWidth}`, // Imposta il punto di fine
        markers: false, // Imposta la visualizzazione dei marker
        scrub: true, // Abilita lo scrubbing
      },
    });
  }
});

// Aggiorna ScrollTrigger e Locomotive Scroll
ScrollTrigger.addEventListener("refresh", () => {
  ScrollTrigger.update();
  locoScroll.update();
});

//EventListener per il ridimensionamento della finestra che aggiorna ScrollTrigger e Locomotive Scroll
// window.addEventListener('resize', function() {
//     ScrollTrigger.refresh();
//     locoScroll.update();
// });

// Esegui il refresh iniziale
ScrollTrigger.update();

//split
Splitting();
