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

const randomNumber = () => {
  return parseInt(Math.random() * (999999 - 100000) + 100000);
};

const sendSecurityCode = async (message, phone) => {
  return await fetch(
    `https://masivos.colombiared.com.co/Api/get/send.php?text=${message}&to=${phone}&from=CA&username=cobranzaactiva&password=Activapp&coding=gsm`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        cors: "no-cors",
      },
    }
  );
};

if (window.innerWidth > 768) {
  setTimeout(async () => {
    showModal();
  }, 2000);
}

// await sendSecurityCode(
//   `Tu numero de seguridad es ${randomNumber()}`,
//   "573128805228"
// );
