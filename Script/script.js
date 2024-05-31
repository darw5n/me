console.clear();

gsap.registerPlugin(ScrollTrigger);

// Using Locomotive Scroll from Locomotive https://github.com/locomotivemtl/locomotive-scroll

const locoScroll = new LocomotiveScroll({
    el: document.querySelector(".smooth-scroll"),
    smooth: true,
    lerp: 0.05, // Linear Interpolation, 0 > 1 // Try 0.01
    multiplier: 1, // Effect Multiplier 1.4
    reloadOnContextChange: true,
    touchMultiplier: 3, //2
    smoothMobile: 0,
    smartphone: {
        smooth: !0,
        breakpoint: 767
    },
    tablet: {
        smooth: !0,//1
        breakpoint: 1024
    },
});


// each time Locomotive Scroll updates, tell ScrollTrigger to update too (sync positioning)
locoScroll.on("scroll", ScrollTrigger.update);

// tell ScrollTrigger to use these proxy methods for the ".smooth-scroll" element since Locomotive Scroll is hijacking things
ScrollTrigger.scrollerProxy(".smooth-scroll", {
    scrollTop(value) {
        return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
    }, // we don't have to define a scrollLeft because we're only scrolling vertically.
    getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
    // LocomotiveScroll handles things completely differently on mobile devices
    // - it doesn't even transform the container at all! So to get the correct behavior and avoid jitters, 
    // we should pin things with position: fixed on mobile. We sense it by checking to see if there's a transform applied 
    // to the container (the LocomotiveScroll-controlled element).
    pinType: document.querySelector(".smooth-scroll").style.transform ? "transform" : "fixed"
});

  // Crea i trigger per le sezioni
  const sections = gsap.utils.toArray('section');

  sections.forEach(function (section) {
      const inner = section.classList.contains('sectionLeftAndRight') ? section.querySelector('.leftText') : section.querySelector('.section-inner');

      if (!section.classList.contains('horizontalScrolling')) {
          ScrollTrigger.create({
              scroller: '.smooth-scroll',
              trigger: section,
              start: section.scrollHeight <= window.innerHeight ? 'top top' : 'bottom bottom',
              end: '+=100%',
              pin: inner,
              pinSpacing: false,
              pinType: 'transform'
          });
      } else {

          const scroll = section.querySelector('[data-scroll-in-section]');

          ScrollTrigger.create({
              scroller: '.smooth-scroll',
              trigger: section,
              start: 'center center',
              // end: () => `+=${(section.scrollWidth + window.innerWidth) / 1.15}`, //<----------- modificato qui
              end: () => `+=${(section.scrollWidth + window.innerWidth)}`, 
              pin: inner,
              pinSpacing: true,
              pinType: 'transform',
              anticipatePin: 1
          });

          gsap.to(scroll, {
              x: () => `${-(section.scrollWidth - document.documentElement.clientWidth)}px`,
              ease: 'none',
              scrollTrigger: {
                  trigger: scroll,
                  scroller: '.smooth-scroll',
                  start: 'center center',
                  end: () => `+=${section.scrollWidth}`,
                  // markers: true,
                  scrub: true
              }
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