const menu = document.getElementById("menu");
const menuInfo = document.getElementById("menu_info");
const modal = document.querySelector(".modal");

const handleMenu = () => {
  menu.classList.toggle("show");
  menuInfo.classList.toggle("show");
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
  setTimeout(() => {
    showModal();
  }, 2000);
}
