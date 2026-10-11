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

  // Simulador de honorarios: misma regla que la plataforma (lib/honorarios.js)
  var simulador = document.getElementById("form-simulador")
  if (simulador) {
    var IVA = 0.19
    var tramos = [
      { hasta: 60, tarifa: 0.1 },
      { hasta: 120, tarifa: 0.12 },
      { hasta: 360, tarifa: 0.15 },
      { hasta: Infinity, tarifa: 0.2 },
    ]
    var sServicio = document.getElementById("s-servicio")
    var sDias = document.getElementById("s-dias")
    var sValor = document.getElementById("s-valor")
    var campoDias = document.getElementById("s-campo-dias")
    var pesos = function (n) {
      return "$" + Math.round(n).toLocaleString("es-CO")
    }
    var calcular = function () {
      var servicio = sServicio.value
      var porDias = servicio === "pro" || servicio === "plus"
      campoDias.hidden = !porDias
      var dias = Math.max(0, parseInt(sDias.value, 10) || 0)
      var t =
        servicio === "rescate" ? 0.4 : servicio === "juridico" ? 0.2 : tramos.filter(function (x) { return dias <= x.hasta })[0].tarifa
      var valor = Number(String(sValor.value).replace(/\D/g, "")) || 0
      var abono = Math.round(valor / (1 + t * (1 + IVA)))
      document.getElementById("r-tarifa").textContent = Math.round(t * 100) + "% + IVA"
      document.getElementById("r-honorarios").textContent = pesos(valor - abono)
      document.getElementById("r-recibe").textContent = pesos(abono)
    }
    sValor.addEventListener("input", function () {
      var d = sValor.value.replace(/\D/g, "").slice(0, 12)
      sValor.value = d ? Number(d).toLocaleString("es-CO") : ""
      calcular()
    })
    sServicio.addEventListener("change", calcular)
    sDias.addEventListener("input", calcular)
    simulador.addEventListener("submit", function (e) {
      e.preventDefault()
    })
    calcular()
  }

  // Recorrido de la plataforma: pestañas accesibles
  var pestanas = document.querySelectorAll('.tour__pestanas [role="tab"]')
  if (pestanas.length) {
    var menuApp = document.querySelectorAll(".app__menu li[data-pantalla]")
    var activar = function (tab, enfocar, desplazar) {
      pestanas.forEach(function (t) {
        var sel = t === tab
        t.setAttribute("aria-selected", sel ? "true" : "false")
        t.tabIndex = sel ? 0 : -1
        document.getElementById(t.getAttribute("aria-controls")).hidden = !sel
      })
      var clave = tab.id.replace("t-", "")
      var app = document.querySelector(".app")
      if (app) app.classList.toggle("app--deudor", clave === "deudor")
      var url = document.querySelector(".navegador p")
      if (url) url.textContent = clave === "deudor" ? "Portal de autogestión del deudor" : "app.cobranzaactiva.com"
      menuApp.forEach(function (li) {
        li.classList.toggle("activo", li.getAttribute("data-pantalla") === clave)
      })
      if (enfocar) tab.focus()
      if (desplazar && window.matchMedia("(max-width: 1000px)").matches) {
        var lista = tab.parentElement
        lista.scrollTo({ left: tab.offsetLeft - (lista.clientWidth - tab.clientWidth) / 2, behavior: "smooth" })
      }
    }
    pestanas.forEach(function (t, i) {
      t.addEventListener("click", function () {
        activar(t, false, true)
      })
      t.addEventListener("keydown", function (e) {
        var sig = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
        if (sig) {
          e.preventDefault()
          activar(pestanas[(i + sig + pestanas.length) % pestanas.length], true, true)
        } else if (e.key === "Home") {
          e.preventDefault()
          activar(pestanas[0], true)
        } else if (e.key === "End") {
          e.preventDefault()
          activar(pestanas[pestanas.length - 1], true)
        }
      })
    })
    activar(pestanas[0])
  }

  // Agenda: cuenta como conversión
  document.querySelectorAll(".js-agenda").forEach(function (a) {
    a.addEventListener("click", registrarConversion)
  })

  // Botones "Empezar con…" preseleccionan el servicio en el formulario
  var selector = document.getElementById("f-producto")
  document.querySelectorAll("[data-producto]").forEach(function (a) {
    a.addEventListener("click", function () {
      // Si el botón ya lleva al registro de la plataforma, no se toca el formulario
      if ((a.getAttribute("href") || "").charAt(0) !== "#") return
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
