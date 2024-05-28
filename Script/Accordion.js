function accordion() {
  // Seleziona tutti gli elementi con la classe "acnav__label" e itera su ciascuno di essi
  document.querySelectorAll(".acnav__label").forEach((acnav) => {
    $(acnav).click(function () {
      var label = $(this); // L'etichetta cliccata
      var parent = label.parent(".has-children"); // Il genitore dell'etichetta con la classe "has-children"
      var list = label.siblings(".acnav__list"); // Lista associata all'etichetta
      var animlist = list.find(".animlist"); // Elementi all'interno della lista che hanno la classe "animlist"

      // Definisce una timeline GSAP per animazioni che sono inizialmente in pausa
      var Q = gsap.timeline({ paused: true });

      // Definisce l'animazione per gli elementi con la classe "animlist"
      Q.fromTo(
        animlist,
        {
          opacity: 0,
          y: 0,
        },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1, // Ritardo tra le animazioni degli elementi
          duration: 0.2, // Durata dell'animazione
        },
        0.2 // Ritardo iniziale
      );

      // Se il genitore ha la classe "is-open" (la sezione è aperta)
      if (parent.hasClass("is-open")) {
        // Animazione di chiusura degli elementi "animlist"
        gsap.to(animlist, {
          y: 0,
          opacity: 0,
          stagger: -0.02, // Ritardo negativo per animazioni inverse
          duration: 0.2,
        });

        // Riduce l'altezza della lista a 0 per nasconderla
        gsap.to(list, {
          height: 0,
          duration: 0.4,
          immediateRender: false,
          ease: "expo.inOut",
          onComplete: function () {
            parent.removeClass("is-open"); // Rimuove la classe "is-open" dal genitore
            // ScrollTrigger.refresh();
            // locoScroll.update();
            // ScrollTrigger.refresh();
          },
        });
      } else {
        // Imposta l'altezza della lista a 0 prima dell'animazione di apertura
        gsap.set(list, {
          height: 0,
        });

        // Anima l'apertura della lista espandendo la sua altezza
        gsap.to(list, {
          height: "auto", // Altezza automatica per adattarsi al contenuto
          duration: 0.7,
          ease: "expo.inOut",
          immediateRender: false,
          onComplete: function () {
            parent.addClass("is-open"); // Aggiunge la classe "is-open" al genitore
            Q.play(); // Esegue l'animazione degli elementi "animlist"
            // ScrollTrigger.refresh(); // Il problema del lag potrebbe essere qui
            // locoScroll.update();
            // ScrollTrigger.refresh();
          },
        });

        parent.addClass("is-open"); // Aggiunge la classe "is-open" al genitore
        Q.play(); // Esegue l'animazione degli elementi "animlist"
      }
    });
  });
}

// Esegue la funzione accordion per inizializzare il comportamento del menu
accordion();
