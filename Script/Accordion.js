function accordion() {
  document.querySelectorAll(".acnav__label").forEach(acnav => {
    $(acnav).click(function () {
      var label = $(this);
      var parent = label.parent('.has-children');
      var list = label.siblings('.acnav__list');
      var animlist = list.find('.animlist');

      var Q = gsap.timeline({ paused: true });

      Q.fromTo(animlist, {
        opacity: 0,
        y: 0,
      }, {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.2,
      }, 0.2);

      if (parent.hasClass('is-open')) {
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
            parent.removeClass('is-open');
            ScrollTrigger.refresh();
            locoScroll.update();
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
            ScrollTrigger.refresh();
            locoScroll.update();
          },
        });

        parent.addClass('is-open');
        Q.play();
      }
    });
  });
}

accordion();