    /* --- Scroll text right to left --- */

        // console.clear();

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


        // Seleziona la sezione specifica
        const section = document.querySelector('.horizontalScrolling');

        if (section) {
            const inner = section.querySelector('.section-inner');
            const scroll = section.querySelector('[data-scroll-in-section]');

            // Configura ScrollTrigger per l'intera sezione
            ScrollTrigger.create({
                scroller: '.smooth-scroll',
                trigger: section,
                start: 'center center',
                end: () => `+=${section.scrollWidth + window.innerHeight}`,
                pin: inner,
                pinSpacing: true,
                pinType: 'transform',
                anticipatePin: 1,
            });

            // Anima l'elemento all'interno della sezione
            gsap.to(scroll, {
                x: () => `${-(section.scrollWidth - document.documentElement.clientWidth)}px`,
                ease: 'none',
                scrollTrigger: {
                    trigger: scroll,
                    scroller: '.smooth-scroll',
                    start: 'center top',
                    end: () => `+=${section.scrollWidth}`,
                    // markers: true,
                    scrub: true,
                }
            });
        }


        const contentDivs = document.querySelectorAll('.sticky-titles-section .content');

        contentDivs.forEach(contentDiv => {
            const elements = contentDiv.querySelectorAll('p, ul, li, h6');

            elements.forEach(element => {
                // Suddividi il contenuto in parole
                Splitting({ target: element, by: 'words' });

                // Seleziona tutte le parole suddivise
                const words = element.querySelectorAll('.word');

                words.forEach((word, index) => {
                    // Controlla se non è l'ultima parola e aggiungi uno spazio
                    if (index < words.length - 1) {
                        word.insertAdjacentHTML('afterend', ' ');
                    }

                    // Applica l'animazione di dissolvenza a ciascuna parola con easing
                    gsap.to(word, {
                        opacity: 0,
                        // ease: 'power2.out', // Cambia la curva dell'animazione qui
                        scrollTrigger: {
                            trigger: word,
                            scroller: '.smooth-scroll',
                            start: 'top 50%',
                            end: 'top 25%',
                            scrub: true
                        }
                    });
                });
            });
        });

        // each time the window updates, we should refresh ScrollTrigger and then update LocomotiveScroll. 
        ScrollTrigger.addEventListener("refresh", () => locoScroll.update());

        // after everything is set up, refresh() ScrollTrigger and update LocomotiveScroll because padding may have been added for pinning, etc.
        ScrollTrigger.refresh();

        // Add event listener for window resize
        window.addEventListener('resize', () => {
            ScrollTrigger.refresh();
            locoScroll.update();
        });


        //split
        Splitting();

        // document.addEventListener("DOMContentLoaded", function() {
        //     var lastModified = new Date(document.lastModified);
        //     var day = lastModified.getDate();
        //     var month = lastModified.toLocaleString('default', { month: 'short' });
        //     var year = lastModified.getFullYear().toString().slice(-2);
        //     var formattedDate = `(Last edit: ${day} ${month} ${year}) `;
        //     document.getElementById("lastModified").innerText = formattedDate;
        // });
