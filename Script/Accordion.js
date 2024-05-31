  // Definizione di una funzione chiamata 'accordion'
  function accordion() {
    // Selezione di tutti gli elementi con classe CSS ".acnav__label"
    document.querySelectorAll(".acnav__label").forEach(acnav => {
      // Aggiunta di un gestore di eventi "click" a ciascun elemento con classe ".acnav__label"
      $(acnav).click(function () {
        // Cattura dell'elemento corrente come 'label'
        var label = $(this);
        // Trova il genitore (parent) con classe ".has-children" dell'elemento 'label'
        var parent = label.parent('.has-children');
        // Trova gli elementi fratelli (siblings) con classe ".acnav__list" dell'elemento 'label'
        var list = label.siblings('.acnav__list');
        // Trova gli elementi con classe ".animlist" all'interno dell'elemento 'list'
        var animlist = list.find('.animlist');
  
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
        if (parent.hasClass('is-open')) {
          // Se è aperto, esegue l'animazione di chiusura
          gsap.to(animlist, {
            y: 0,
            opacity: 0,
            stagger: -0.02, // Inverte l'ordine dell'animazione di chiusura
            duration: 0.2, // Durata dell'animazione di chiusura
          });
  
          gsap.to(list, {
            height: 0, // Riduce l'altezza dell'elemento 'list' a 0
            duration: 0.4, // Durata dell'animazione di chiusura
            immediateRender: false,
            ease: "expo.inOut", // Tipo di animazione
            onComplete: function () {
              parent.removeClass('is-open'); // Rimuove la classe "is-open" dal genitore
              // ScrollTrigger.refresh();
              locoScroll.update();
            },
          });
        }else {
            // Se è chiuso, esegue l'animazione di apertura
            gsap.set(list, {
              height: 0, // Imposta l'altezza dell'elemento 'list' a 0 (iniziale)
            });
          
            gsap.to(list, {
              height: "auto", // Espande l'altezza dell'elemento 'list' automaticamente
              duration: 0.7, // Durata dell'animazione di apertura
              ease: "expo.inOut", // Tipo di animazione
              immediateRender: false,
              onComplete: function () {
                // ScrollTrigger.refresh();
                locoScroll.update();
              },
            });
          
            parent.addClass('is-open'); // Aggiunge la classe "is-open" al genitore
            Q.play(); // Riproduce la sequenza di animazioni 'Q'
    
          } 
      });
    });
  }
  
  // Chiamata alla funzione 'accordion' per attivarla
  accordion();