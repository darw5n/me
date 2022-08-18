
gsap.registerPlugin(ScrollTrigger);

// Using Locomotive Scroll from Locomotive https://github.com/locomotivemtl/locomotive-scroll
const locoScroll = new LocomotiveScroll({
    el: document.querySelector(".smooth-scroll"),
    smooth: true
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
    // LocomotiveScroll handles things completely differently on mobile devices - it doesn't even transform the container at all! So to get the correct behavior and avoid jitters, we should pin things with position: fixed on mobile. We sense it by checking to see if there's a transform applied to the container (the LocomotiveScroll-controlled element).
    pinType: document.querySelector(".smooth-scroll").style.transform ? "transform" : "fixed"
});

ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
ScrollTrigger.refresh();

class Page {
    constructor() {

        this.elements = {
            trigger: document.querySelector('.pin-trigger'),
            scrollHolder: document.querySelector('.tt-scroll'),
            scrollHeader: document.querySelector('.tt-scroll__header'),
            scrollTitle: document.querySelector('.tt-scroll__title'),
            scrollContent: document.querySelector('.tt-scroll__content')
        }

        this.titleWidth = document.querySelector('.tt-scroll__title').offsetWidth;

        this.addEventListeners()
        this.create();

    }

    create() {
        this.scrollContent = new SplitText(this.elements.scrollContent, {
            type: "lines,",
            linesClass: "tt-scroll__line",
        });

        this.scrollContent.lines.forEach((element) => {
            this.lineInner = new SplitText(element, {
                type: "lines,",
                linesClass: "tt-scroll__line__inner",
            });
        });

        gsap.set(".tt-scroll__line__inner", {
            y: 0,
            yPercent: 100
        })

        gsap.to(this.elements.scrollTitle, {
            scrollTrigger: {
                trigger: this.elements.trigger,
                scrub: 1,
                scroller: ".smooth-scroll",
                start: "center center",
                //markers: true,
                invalidateOnRefresh: true,
                //pin: true,
                end: () => this.titleWidth + window.innerWidth,
            },
            //alpha:0,
            x: () => -this.titleWidth,
            ease: "none",
        });

        gsap.to(this.elements.scrollTitle, {
            scrollTrigger: {
                trigger: this.elements.scrollHolder,
                scrub: 1,
                scroller: ".smooth-scroll",
                start: "top top",
                markers: true,
                invalidateOnRefresh: true,
                pin: true,
                end: () => this.titleWidth + window.innerWidth * 2,
                // end: "bottom center",
            },
            //alpha:0,
            //x: -this.titleWidth,
            ease: "none",
        });


        gsap.to(".tt-scroll__line__inner", {
            scrollTrigger: {
                trigger: this.elements.trigger,
                scrub: 1,
                scroller: ".smooth-scroll",
                start: () => this.titleWidth + window.innerWidth / 2,
                //markers: true,
                invalidateOnRefresh: true,
                //pin: true,
                end: () => this.titleWidth + window.innerWidth * 2,
            },
            //alpha:0,
            yPercent: 0,
            ease: "none",
        });
    }

    onResize() {
        this.titleWidth = this.elements.scrollTitle.offsetWidth;
        console.log(this.titleWidth)
    }

    addEventListeners() {
        window.addEventListener("resize", this.onResize.bind(this));
    }
}

new Page();