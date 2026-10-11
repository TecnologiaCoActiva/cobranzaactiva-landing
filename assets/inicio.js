(function () {
  var API_CONTACTO = "https://app.cobranzaactiva.com/api/publico/contacto"
  var CONVERSION = "AW-11016912602/gXl7CMavjYQYENr9ooUp"

  var registrarConversion = function () {
    if (typeof window.gtag === "function") window.gtag("event", "conversion", { send_to: CONVERSION })
  }

  // Menú de clientes: se cierra al hacer clic fuera o con Escape
  var clientes = document.querySelector(".menu-clientes")
  if (clientes) {
    document.addEventListener("click", function (e) {
      if (clientes.open && !clientes.contains(e.target)) clientes.open = false
    })
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && clientes.open) {
        clientes.open = false
        clientes.querySelector("summary").focus()
      }
    })
  }

  // Seguimiento de la obligación en la portada: se anima una sola vez
  var rastreo = document.querySelector(".rastreo")
  if (rastreo) rastreo.classList.add("rastreo--animar")

  // Agenda: cuenta como conversión
  document.querySelectorAll(".js-agenda").forEach(function (a) {
    a.addEventListener("click", registrarConversion)
  })

  // Botones "Empezar con…" preseleccionan el servicio en el formulario
  var selector = document.getElementById("f-producto")
  document.querySelectorAll("[data-producto]").forEach(function (a) {
    a.addEventListener("click", function () {
      if (selector) selector.value = a.getAttribute("data-producto")
      setTimeout(function () {
        var nombre = document.getElementById("f-nombre")
        if (nombre) nombre.focus({ preventScroll: true })
      }, 450)
    })
  })

  // Formulario de contacto
  var form = document.getElementById("formulario-contacto")
  if (!form) return
  var estado = form.querySelector(".formulario__estado")
  var boton = form.querySelector('button[type="submit"]')

  var mostrar = function (texto, tipo) {
    estado.textContent = texto
    estado.className = "formulario__estado" + (tipo ? " formulario__estado--" + tipo : "")
  }

  var validar = function () {
    var errores = []
    var marcar = function (id, malo, msj) {
      var el = document.getElementById(id)
      el.setAttribute("aria-invalid", malo ? "true" : "false")
      if (malo) errores.push({ el: el, msj: msj })
    }
    var v = function (id) {
      return document.getElementById(id).value.trim()
    }
    marcar("f-nombre", v("f-nombre").length < 3, "Escriba su nombre.")
    marcar("f-correo", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("f-correo")), "Revise el correo.")
    marcar("f-celular", v("f-celular").replace(/\D/g, "").length < 7, "Revise el número de celular.")
    return errores
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault()
    var errores = validar()
    if (errores.length) {
      mostrar(errores[0].msj, "error")
      errores[0].el.focus()
      return
    }
    var datos = {}
    new FormData(form).forEach(function (valor, clave) {
      datos[clave] = valor
    })
    boton.disabled = true
    mostrar("Enviando…")
    fetch(API_CONTACTO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j }
        })
      })
      .then(function (res) {
        if (!res.ok) throw new Error((res.j && res.j.error) || "error")
        form.reset()
        mostrar("Recibimos sus datos. Un asesor lo contactará pronto.", "ok")
        registrarConversion()
      })
      .catch(function (err) {
        var msj = err && err.message && err.message !== "error" && err.message !== "Failed to fetch"
          ? err.message
          : "No pudimos enviar su solicitud. Escríbanos por WhatsApp o agende una cita."
        mostrar(msj, "error")
      })
      .then(function () {
        boton.disabled = false
      })
  })
})()
