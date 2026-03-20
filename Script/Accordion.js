function accordion() {
  const refreshSmoothScroll = () => {
    if (typeof locoScroll !== "undefined" && locoScroll && typeof locoScroll.update === "function") {
      requestAnimationFrame(() => locoScroll.update());
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
        { opacity: 0 },
        { opacity: 1, stagger: 0.1, duration: 0.2 },
        0.2
      );

      if (parent.classList.contains("is-open")) {
        gsap.to(animlist, {
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
        // classList.add prima di gsap.set: l'elemento diventa display:block
        // e height:0 vengono applicati nello stesso tick JS sincrono —
        // il browser non fa paint nel mezzo, nessun flash visivo.
        parent.classList.add("is-open");
        gsap.set(list, { height: 0 });

        gsap.to(list, {
          height: "auto",
          duration: 0.7,
          ease: "expo.inOut",
          immediateRender: false,
          onComplete: function () {
            refreshSmoothScroll();
          },
        });

        Q.play();
      }
    });
  });
}

accordion();
