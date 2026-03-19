function accordion() {
  // Dopo la fine dell'animazione: ScrollTrigger.refresh() ricalcola i pin
  // (scroll orizzontale) e triggera internamente locoScroll.update().
  // Il timeout lascia al browser il tempo di stabilizzare il layout.
  const refreshSmoothScroll = () => {
    setTimeout(() => {
      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh();
      } else if (typeof locoScroll !== "undefined" && locoScroll && typeof locoScroll.update === "function") {
        locoScroll.update();
      }
    }, 50);
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
