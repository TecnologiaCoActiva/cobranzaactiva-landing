gtag("config", "AW-11016912602");

const menu = document.getElementById("menu");
const menuOverlay = document.querySelector(".header_overlay");
const modal = document.querySelector(".modal");

const formatter = new Intl.NumberFormat("es-CO", {
  currency: "COP",
  maximumFractionDigits: 0,
});

const handleMenu = () => {
  menu.classList.toggle("show");
  menuOverlay.classList.toggle("show");
};

const showModal = () => {
  if (sessionStorage.getItem("modal") === null && modal) {
    modal.classList.add("is-active");
    sessionStorage.setItem("modal", "true");
  }
};

const closeModal = () => {
  modal.classList.remove("is-active");
};

if (window.innerWidth > 768) {
  setTimeout(async () => {
    showModal();
  }, 2000);
}

const stats = document.querySelectorAll(".stats span");
let tresMil = 0;
let cuatroMil = 0;

if (stats.length > 0) {
  const handler = (en) => {
    if (en[0].isIntersecting) {
      const counter = setInterval(() => {
        if (tresMil != 3000) {
          tresMil += 10;
          stats[0].innerText = `+ $${formatter.format(tresMil)}`;
        }
        if (cuatroMil != 4000) {
          cuatroMil += 10;
          stats[1].innerText = `+ $${formatter.format(cuatroMil)}`;
        } else {
          clearInterval(counter);
        }
      }, 10);
    }
  };

  const observer = new window.IntersectionObserver(handler);
  observer.observe(document.querySelector(".stats span"));
}

if (document.querySelector(".swiper-container")) {
  const slider = () => {
    new Swiper(".swiper-container", {
      breakpoints: {
        320: {
          slidesPerView: 2.5,
          spaceBetween: 15,
        },
        600: {
          slidesPerView: 3.5,
          spaceBetween: 15,
        },
        993: {
          slidesPerView: 4.5,
          spaceBetween: 15,
        },
        1400: {
          slidesPerView: 5.3,
          spaceBetween: 15,
        },
      },
      freeMode: true,
      loop: true,
      autoplay: {
        delay: 2000,
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      mousewheel: {
        forceToAxis: true,
      },
      pagination: {
        el: ".swiper-container .swiper-pagination",
        type: "bullets",
        clickable: true,
      },
      spaceBetween: 20,
      watchOverflow: true,
      centerInsufficientSlides: true,
      centerSlides: true,
    });
  };

  slider();
}
