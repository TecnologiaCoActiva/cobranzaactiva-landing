const day = new Date();

const inputDocument = document.getElementById("document");
const errorElement = document.getElementById("error");
const loadingElement = document.getElementById("loading");
const phoneElement = document.getElementById("phone");
let currentCode = "";

const randomNumber = () => {
  currentCode = parseInt(Math.random() * (999999 - 100000) + 100000);
  return currentCode;
};

const sendSecurityCode = async (message, phone, data) => {
  return await fetch(
    `https://masivos.colombiared.com.co/Api/get/send.php?text=${message}&to=${phone}&from=CA&username=cobranzaactiva&password=Activapp&coding=gsm`,
    {
      method: "GET",
      mode: "no-cors",
    }
  );
};

const getUserData = async (document) => {
  return await fetch(`http://localhost:3000/api/data/document/${document}`)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      loadingElement.innerHTML = "";
      return data[0];
    })
    .catch((err) => {
      loadingElement.innerHTML = "";
      errorElement.innerHTML = "No se encontró el usuario";
      console.log(err);
    });
};

const searchDeudor = async (event) => {
  event.preventDefault();
  loadingElement.innerHTML = "Buscando...";
  const document = inputDocument.value;
  const data = await getUserData(document);
  if (data) {
    phoneElement.innerHTML = `Se envio un codigo de seguridad al numero terminado en *******${data.celular.slice(
      7,
      10
    )}`;
    await sendSecurityCode(
      `Cobraza Activa le informa que su Codigo de Seguridad es ${randomNumber()} - Hora: ${day.getHours()}:${day.getMinutes()}`,
      "573128805228",
      data
    );
  }
};
