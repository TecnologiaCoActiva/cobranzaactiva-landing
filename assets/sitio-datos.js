/*
 * Datos vivos de la página web.
 * Teléfonos, WhatsApp, correos, enlaces, precios y cifras se editan en la
 * plataforma (app.cobranzaactiva.com → Administración → "Página web" y
 * "Canales"). Esta página los toma de ahí al cargar.
 *
 * Si la plataforma no responde, se quedan los valores escritos en el HTML.
 *
 * Uso en el HTML:
 *   data-ca-texto="PBX" data-ca-formato="telefono"   → reemplaza el texto
 *   data-ca-href="WHATSAPP_COMERCIAL" data-ca-tipo="whatsapp" → reemplaza el enlace
 *   data-ca-precio="SUSCRIPCION_RECUPERA_PLUS"         → precio en pesos
 *   data-ca-cifra="WEB_CIFRA_RECAUDOS"                 → número con separador de miles
 */
(function () {
  var API = "https://app.cobranzaactiva.com/api/publico/sitio"

  var miles = function (n) {
    return Math.round(Number(n)).toLocaleString("es-CO")
  }

  var telefono = function (v) {
    var d = String(v).replace(/\D/g, "")
    if (d.length === 12 && d.indexOf("57") === 0) d = d.slice(2)
    if (d.length === 10) return "+57 " + d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6)
    return String(v)
  }

  var formatear = function (valor, formato) {
    if (formato === "telefono") return telefono(valor)
    if (formato === "moneda") return "$" + miles(valor)
    if (formato === "numero") return miles(valor)
    return String(valor)
  }

  var enlace = function (valor, tipo) {
    var v = String(valor).trim()
    var d = v.replace(/\D/g, "")
    if (tipo === "whatsapp") return "https://wa.me/" + d
    if (tipo === "tel") return "tel:+" + (d.length === 10 ? "57" + d : d)
    if (tipo === "mailto") return "mailto:" + v
    return /^https?:\/\//.test(v) ? v : null
  }

  var aplicar = function (datos) {
    var todo = {}
    ;["contacto", "tarifas", "cifras"].forEach(function (g) {
      var bloque = datos[g] || {}
      Object.keys(bloque).forEach(function (k) {
        todo[k] = bloque[k]
      })
    })
    var tiene = function (k) {
      return todo[k] !== undefined && todo[k] !== null && String(todo[k]).trim() !== ""
    }

    document.querySelectorAll("[data-ca-texto]").forEach(function (el) {
      var k = el.getAttribute("data-ca-texto")
      if (tiene(k)) el.textContent = formatear(todo[k], el.getAttribute("data-ca-formato"))
    })
    document.querySelectorAll("[data-ca-href]").forEach(function (el) {
      var k = el.getAttribute("data-ca-href")
      if (!tiene(k)) return
      var url = enlace(todo[k], el.getAttribute("data-ca-tipo"))
      if (url) el.setAttribute("href", url)
    })
    document.querySelectorAll("[data-ca-precio]").forEach(function (el) {
      var k = el.getAttribute("data-ca-precio")
      if (tiene(k) && Number.isFinite(Number(todo[k]))) el.textContent = "$" + miles(todo[k])
    })
    document.querySelectorAll("[data-ca-cifra]").forEach(function (el) {
      var k = el.getAttribute("data-ca-cifra")
      if (tiene(k) && Number.isFinite(Number(todo[k]))) el.textContent = miles(todo[k])
    })
    document.documentElement.setAttribute("data-ca-datos", datos.fuente || "plataforma")
  }

  var cargar = function () {
    if (!window.fetch) return
    var control = window.AbortController ? new AbortController() : null
    var tiempo = setTimeout(function () {
      if (control) control.abort()
    }, 6000)
    fetch(API, { signal: control ? control.signal : undefined, credentials: "omit" })
      .then(function (r) {
        return r.ok ? r.json() : null
      })
      .then(function (datos) {
        clearTimeout(tiempo)
        if (datos) aplicar(datos)
      })
      .catch(function () {
        clearTimeout(tiempo)
      })
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cargar)
  else cargar()
})()
