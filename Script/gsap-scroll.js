gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

//animazione scroll
gsap.to(".b",{
  scrollTrigger:{
    trigger: ".b",
    start: "top bottom", // inizia quando è top center alla view
    markers: true, //vedere controlli
    toggleActions:"restart pause reverse pause"
  },
  x: 400,
  rotation: 360,
  duration: 3
});


//smooth scroll
let smoother = ScrollSmoother.create({
  wrapper: "#smooth-wrapper",
  content: "#smooth-content",
  smooth:1.5,
  smoothTouch:0.1
})