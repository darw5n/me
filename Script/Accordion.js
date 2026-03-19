function accordion() {
  // Aggiorna Locomotive durante e dopo l'animazione, poi ricalcola ScrollTrigger.
  // Il doppio rAF garantisce che Locomotive abbia propagato i nuovi valori
  // prima che ScrollTrigger ricalcoli il pin dello scroll orizzontale.
  const refreshSmoothScroll = () => {
    if (typeof locoScroll !== "undefined" && locoScroll && typeof locoScroll.update === "function") {
      requestAnimationFrame(() => {
        locoScroll.update();
        requestAnimationFrame(() => {
          if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
          }
        });
      });
    }
  };

  // Aggiorna Locomotive ad ogni frame della animazione height,
  // così lo scroll rimane funzionante mentre l'accordion si apre/chiude.
  const onUpdateLoco = () => {
    if (typeof locoScroll !== "undefined" && locoScroll && typeof locoScroll.update === "function") {
      locoScroll.update();
    }
  };

  document.querySelectorAll(".acnav__label").forEach((acnav) => {
    acnav.addEventListener("click", function () {
      var label = this;
      var parent = label.closest(".has-children");
      var list = label.parentElement.querySelector(".acnav__list");
      var animlist = list.querySelectorAll(".animlist");

      var Q = gsap.timeline({ paused: true });

      Q.fromTo(
        animlist,
        {
          opacity: 0,
          y: 0,
        },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.2,
        },
        0.2
      );

      if (parent.classList.contains("is-open")) {
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
          onUpdate: onUpdateLoco,
          onComplete: function () {
            parent.classList.remove("is-open");
            refreshSmoothScroll();
          },
        });
      } else {
        gsap.set(list, {
          height: 0,
        });

        gsap.to(list, {
          height: "auto",
          duration: 0.7,
          ease: "expo.inOut",
          immediateRender: false,
          onUpdate: onUpdateLoco,
          onComplete: function () {
            refreshSmoothScroll();
          },
        });

        parent.classList.add("is-open");
        Q.play();
      }
    });
  });
}

accordion();
