// Definizione di una funzione chiamata 'accordion'
function accordion() {
  // Selezione di tutti gli elementi con classe CSS ".acnav__label"
  document.querySelectorAll(".acnav__label").forEach(acnav => {
    // Aggiunta di un gestore di eventi "click" a ciascun elemento con classe ".acnav__label"
    acnav.addEventListener('click', function () {
      // Cattura dell'elemento corrente come 'label'
      var label = this;
      // Trova il genitore (parent) con classe ".has-children" dell'elemento 'label'
      var parent = label.closest('.has-children');
      // Trova gli elementi fratelli (siblings) con classe ".acnav__list" dell'elemento 'label'
      var list = parent.querySelector('.acnav__list--level2');
      // Trova gli elementi con classe ".animlist" all'interno dell'elemento 'list'
      var animlist = list.querySelectorAll('.animlist');
  
      // Creazione di una sequenza di animazioni GSAP chiamata 'Q' (timeline)
      var Q = gsap.timeline({ paused: true });
  
      // Animazione: Da 0 opacità e nessuna traslazione a opacità 1 con una lieve dissolvenza (stagger)
      Q.fromTo(animlist, {
        opacity: 0,
        y: 0,
      }, {
        y: 0,
        opacity: 1,
        stagger: 0.1, // Aggiunge una leggera pausa tra gli elementi durante l'animazione
        duration: 0.2, // Durata complessiva dell'animazione
      }, 0.2); // Inizia dopo 0.2 secondi dall'inizio della timeline
  
      // Verifica se l'elemento 'parent' ha la classe "is-open"
      if (parent.classList.contains('is-open')) {
        // Chiusura dell'elemento padre
        gsap.to(animlist, {
          y: 0,
          opacity: 0,
          stagger: -0.02,
          duration: 0.2,
        });
  
        gsap.to(list, {
          height: 0,
          duration: 0.4,
          immediateRender: false,
          ease: "expo.inOut",
          onComplete: function () {
            // Rimuovi la classe "is-open" dai figli
            list.querySelectorAll('.has-children').forEach(child => child.classList.remove('is-open'));
            parent.classList.remove('is-open');
            ScrollTrigger.refresh();
            locoScroll.update();
          },
        });
      } else {
        // Scorrere la pagina verso l'alto per portare il titolo in vista
        locoScroll.scrollTo(label, {
          duration: 600, // Durata dello scroll in millisecondi
          offset: -20, // Offset per posizionare leggermente sopra il titolo
          callback: function () {
            ScrollTrigger.refresh();
            locoScroll.update();
          },
        });

        // Apertura dell'elemento padre
        gsap.set(list, {
          height: "auto",
        });
        
        const listHeight = list.scrollHeight; // Calcola l'altezza dell'accordion aperto
        gsap.from(list, {
          height: 0,
          duration: 0.7,
          ease: "expo.inOut",
          immediateRender: false,
          onComplete: function () {
            // Funzione ricorsiva per applicare la classe "is-open" ai figli con un ritardo
            function openChildrenWithDelay(index) {
              var children = list.querySelectorAll('.has-children');
              if (index < children.length) {
                setTimeout(function () {
                  children[index].classList.add('is-open');
                  openChildrenWithDelay(index + 1); // Richiama la funzione per il prossimo figlio
                }, (index + 1) * 100); // Delay incrementato per ogni figlio
              } else {
                // Quando tutti i figli sono stati aperti, aggiorna il trigger di scorrimento e locoScroll
                ScrollTrigger.refresh();
                locoScroll.update();
              }
            }
  
            openChildrenWithDelay(0); // Avvia la funzione per il primo figlio
          },
        });
  
        parent.classList.add('is-open');
        Q.play();
      }
    });
  });
}

// Chiamata alla funzione 'accordion' per attivarla
accordion();

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
  },
  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },
  pinType: document.querySelector(".smooth-scroll").style.transform
    ? "transform"
    : "fixed",
});

// Crea i trigger per le sezioni
const sections = gsap.utils.toArray("section");

sections.forEach(function (section) {
  const inner = section.classList.contains("sectionLeftAndRight")
    ? section.querySelector(".leftText")
    : section.querySelector(".section-inner");

  if (!section.classList.contains("horizontalScrolling")) {
    ScrollTrigger.create({
      scroller: ".smooth-scroll",
      trigger: section,
      start:
        section.scrollHeight <= window.innerHeight
          ? "top top"
          : "bottom bottom",
      end: "+=100%",
      pin: inner,
      pinSpacing: false,
      pinType: "transform",
    });
  } else {
    const scroll = section.querySelector("[data-scroll-in-section]");

    ScrollTrigger.create({
      scroller: ".smooth-scroll",
      trigger: section,
      start: "50% 50%",
      end: () => `+=${(section.scrollWidth + window.innerWidth)}`,
      pin: inner,
      pinSpacing: true,
      pinType: "transform",
      anticipatePin: 1,
    });

    gsap.to(scroll, {
      x: () =>
        `${-(section.scrollWidth - document.documentElement.clientWidth)}px`,
      ease: "none",
      scrollTrigger: {
        trigger: scroll,
        scroller: ".smooth-scroll",
        start: "center center",
        end: () => `+=${section.scrollWidth}`,
        markers: false,
        scrub: true,
      },
    });
  }
});

// Aggiorna ScrollTrigger e Locomotive Scroll
ScrollTrigger.addEventListener("refresh", () => {
  ScrollTrigger.update();
  locoScroll.update();
});

// EventListener per il ridimensionamento della finestra che aggiorna ScrollTrigger e Locomotive Scroll
window.addEventListener('resize', function() {
    ScrollTrigger.refresh();
    locoScroll.update();
});

// Esegui il refresh iniziale
ScrollTrigger.update();

//split
Splitting();
