/*
 * Cobranza Activa · chat del portal del deudor
 *
 * Se pega en el portal (Google Apps Script) con una sola línea antes de </body>:
 *   <script src="https://www.cobranzaactiva.com/assets/chat-portal.js"></script>
 *
 * Si el portal ya sabe quién es el deudor, puede decírselo al chat para no pedirle la cédula:
 *   CobranzaChat.identificar({ cedula: "1130456789", obligacion: "8821", nombre: "Carlos" })
 *
 * El mensaje llega a la plataforma por /api/publico/portal-chat y entra a «Soporte portal»:
 * el agentive del deudor (o la mesa de soporte) le responde por SMS y correo.
 */
(function () {
  if (window.CobranzaChat) return
  var API = "https://app.cobranzaactiva.com/api/publico/portal-chat"
  var SITIO = "https://app.cobranzaactiva.com/api/publico/sitio"
  var deudor = { cedula: "", obligacion: "", nombre: "" }
  // El portal guarda la cédula del deudor verificado en window._cedula: si ya ingresó, no se le vuelve a pedir
  var cedulaConocida = function () {
    return deudor.cedula || String(window._cedula || "").replace(/\D/g, "")
  }
  var atencion = { horario: "1-5 08:00-17:30" }

  var css =
    ".cap{position:fixed;right:16px;bottom:16px;z-index:2147483000;font-family:Montserrat,system-ui,-apple-system,'Segoe UI',sans-serif;display:flex;flex-direction:column;align-items:flex-end;gap:10px;color:#18231B}" +
    ".cap *{box-sizing:border-box}" +
    ".cap-btn{border:0;cursor:pointer;background:#1E6325;color:#fff;border-radius:999px;padding:13px 18px;font:inherit;font-weight:800;font-size:15px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 12px 28px -10px rgba(15,58,20,.6)}" +
    ".cap-btn svg{width:20px;height:20px}" +
    ".cap-panel{width:min(360px,calc(100vw - 24px));height:min(560px,calc(100vh - 96px));background:#fff;border:1px solid #DBE4D8;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 60px -24px rgba(15,58,20,.55)}" +
    ".cap-cab{background:#0F3A14;color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}" +
    ".cap-av{width:36px;height:36px;border-radius:50%;background:#8FCF57;color:#0F3A14;display:grid;place-items:center;font-weight:800;font-size:13px;flex:none}" +
    ".cap-cab b{display:block;font-size:14px}.cap-cab small{font-size:11px;opacity:.85}" +
    ".cap-panel[hidden]{display:none}" + // el panel arranca cerrado: el deudor lo abre con «¿Necesita ayuda?»
    ".cap-x{margin-left:auto;border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:16px}" +
    ".cap-msj{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:9px;background:#F7F9F6}" +
    ".cap-b{margin:0;max-width:86%;padding:9px 11px;font-size:14px;line-height:1.45;white-space:pre-line}" +
    ".cap-bot{align-self:flex-start;background:#fff;border-radius:14px 14px 14px 4px;box-shadow:0 1px 0 #DBE4D8}" +
    ".cap-yo{align-self:flex-end;background:#1E6325;color:#fff;border-radius:14px 14px 4px 14px}" +
    ".cap-op{display:flex;flex-wrap:wrap;gap:7px}" +
    ".cap-op button{font:inherit;font-size:13px;font-weight:700;color:#1E6325;background:#fff;border:1.5px solid #1E6325;border-radius:999px;padding:7px 11px;cursor:pointer}" +
    ".cap-op button:hover{background:#EEF7E6}" +
    ".cap-f{background:#fff;border:1px solid #DBE4D8;border-radius:14px;padding:12px;display:grid;gap:7px}" +
    ".cap-f label{font-size:12px;font-weight:700}" +
    ".cap-f input,.cap-f textarea{font:inherit;font-size:14px;border:1px solid #C8D3C4;border-radius:8px;padding:8px 10px;width:100%}" +
    ".cap-f textarea{min-height:70px;resize:vertical}" +
    ".cap-f [aria-invalid=true]{border-color:#C62828}" +
    ".cap-f button{font:inherit;border:0;background:#1E6325;color:#fff;border-radius:999px;padding:10px;font-weight:800;font-size:14px;cursor:pointer}" +
    ".cap-f button[disabled]{opacity:.6}" +
    ".cap-err{font-size:12px;color:#C62828;margin:0}" +
    ".cap-pie{border-top:1px solid #DBE4D8;padding:8px 12px;font-size:11px;color:#56625A;text-align:center;background:#fff}" +
    "@media (max-width:560px){.cap.abierto .cap-btn{display:none}.cap-panel{height:calc(100vh - 24px)}}"

  var el = function (tag, clase, texto) {
    var e = document.createElement(tag)
    if (clase) e.className = clase
    if (texto !== undefined) e.textContent = texto
    return e
  }

  var DIAS = ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
  var h12 = function (h, m) {
    h = Number(h)
    return (h % 12 === 0 ? 12 : h % 12) + ":" + m + (h < 12 ? " a. m." : " p. m.")
  }
  var estadoHorario = function () {
    var m = String(atencion.horario || "").match(/^(\d)-(\d)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/)
    if (!m) return { abierto: true, texto: "" }
    var ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }))
    var dia = ahora.getDay() === 0 ? 7 : ahora.getDay()
    var min = ahora.getHours() * 60 + ahora.getMinutes()
    return {
      abierto: dia >= +m[1] && dia <= +m[2] && min >= +m[3] * 60 + +m[4] && min < +m[5] * 60 + +m[6],
      texto: "Atendemos de " + DIAS[+m[1]] + " a " + DIAS[+m[2]] + ", " + h12(m[3], m[4]) + " a " + h12(m[5], m[6]),
    }
  }

  var RESP = {
    acuerdo: "Puede hacer su acuerdo aquí mismo en el portal: elija la opción de acuerdo de pago, escoja cómo pagar y confírmelo. Si ninguna opción le sirve, escríbanos y le ayudamos.",
    pago: "Si ya pagó, use la opción para reportar su pago en este portal y suba la foto del comprobante. Su entidad lo ve y lo valida. Si tiene problemas para subirlo, escríbanos.",
    saldo: "El saldo que ve en el portal lo actualiza su entidad. Si cree que no está bien o necesita su paz y salvo, escríbanos y lo revisamos con la entidad.",
    otro: "Cuéntenos su caso y la mesa de soporte le responde por mensaje de texto y correo.",
  }

  var montar = function () {
    var estilo = el("style")
    estilo.textContent = css
    document.head.appendChild(estilo)

    var raiz = el("div", "cap")
    var panel = el("section", "cap-panel")
    panel.setAttribute("role", "dialog")
    panel.setAttribute("aria-label", "Chat con soporte de Cobranza Activa")
    panel.hidden = true
    var cab = el("header", "cap-cab")
    cab.appendChild(el("span", "cap-av", "CA"))
    var quien = el("div")
    quien.appendChild(el("b", "", "Soporte Cobranza Activa"))
    var est = el("small", "", "")
    quien.appendChild(est)
    cab.appendChild(quien)
    var x = el("button", "cap-x", "×")
    x.type = "button"
    x.setAttribute("aria-label", "Cerrar el chat")
    cab.appendChild(x)
    var lista = el("div", "cap-msj")
    lista.setAttribute("aria-live", "polite")
    var pie = el("p", "cap-pie", "")
    panel.appendChild(cab)
    panel.appendChild(lista)
    panel.appendChild(pie)
    var btn = el("button", "cap-btn")
    btn.type = "button"
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>¿Necesita ayuda?</span>'
    raiz.appendChild(panel)
    raiz.appendChild(btn)
    document.body.appendChild(raiz)

    var historial = []
    var bot = function (t) {
      historial.push({ de: "bot", t: t })
    }
    var yo = function (t) {
      historial.push({ de: "yo", t: t })
    }

    var pintar = function (paso) {
      lista.innerHTML = ""
      historial.forEach(function (m) {
        lista.appendChild(el("p", "cap-b " + (m.de === "bot" ? "cap-bot" : "cap-yo"), m.t))
      })
      if (paso === "form") lista.appendChild(formulario())
      else {
        var op = el("div", "cap-op")
        var opciones =
          paso === "fin"
            ? [["Escribir otro mensaje", function () { bot("Cuéntenos."); pintar("form") }]]
            : paso === "inicio"
            ? [
                ["Quiero hacer un acuerdo", function () { yo("Quiero hacer un acuerdo"); bot(RESP.acuerdo); pintar("despues") }],
                ["Ya pagué", function () { yo("Ya pagué"); bot(RESP.pago); pintar("despues") }],
                ["Mi saldo o paz y salvo", function () { yo("Mi saldo o paz y salvo"); bot(RESP.saldo); pintar("despues") }],
                ["Otra pregunta", function () { yo("Otra pregunta"); bot(RESP.otro); pintar("form") }],
              ]
            : [
                ["Escribir a soporte", function () { yo("Escribir a soporte"); bot(RESP.otro); pintar("form") }],
                ["Volver", function () { pintar("inicio") }],
              ]
        opciones.forEach(function (o) {
          var b = el("button", "", o[0])
          b.type = "button"
          b.addEventListener("click", o[1])
          op.appendChild(b)
        })
        lista.appendChild(op)
      }
      lista.scrollTop = lista.scrollHeight
    }

    var campo = function (f, id, etiqueta, tipo, valor) {
      var l = el("label", "", etiqueta)
      l.setAttribute("for", id)
      var i = tipo === "textarea" ? el("textarea") : el("input")
      i.id = id
      if (tipo !== "textarea") i.type = tipo
      if (valor) i.value = valor
      f.appendChild(l)
      f.appendChild(i)
      return i
    }

    var formulario = function () {
      var f = el("form", "cap-f")
      f.noValidate = true
      var ced = cedulaConocida().length >= 5 ? null : campo(f, "cap-ced", "Número de cédula", "text")
      if (ced) ced.setAttribute("inputmode", "numeric")
      var cel = campo(f, "cap-cel", "Celular para responderle (opcional)", "tel")
      var msj = campo(f, "cap-txt", "Su mensaje", "textarea")
      var err = el("p", "cap-err")
      err.setAttribute("role", "alert")
      var b = el("button", "", "Enviar a soporte")
      b.type = "submit"
      f.appendChild(err)
      f.appendChild(b)
      f.addEventListener("submit", function (e) {
        e.preventDefault()
        var cedula = ced ? ced.value.replace(/\D/g, "") : cedulaConocida()
        if (ced) ced.setAttribute("aria-invalid", cedula.length < 5 ? "true" : "false")
        msj.setAttribute("aria-invalid", msj.value.trim().length < 3 ? "true" : "false")
        if (cedula.length < 5) return (err.textContent = "Revise el número de cédula.")
        if (msj.value.trim().length < 3) return (err.textContent = "Escriba su mensaje.")
        err.textContent = ""
        b.disabled = true
        b.textContent = "Enviando…"
        fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cedula: cedula, obligacion: deudor.obligacion, nombre: deudor.nombre, celular: cel.value, mensaje: msj.value, sitio_web: "" }),
        })
          .then(function (r) {
            return r.json().then(function (j) {
              if (!r.ok) throw new Error(j.error || "error")
              return j
            })
          })
          .then(function (j) {
            yo(msj.value.trim())
            // Obligación que ya no está activa: el aviso de la plataforma reemplaza la confirmación
            if (j && j.aviso) {
              bot(j.aviso)
              return pintar("fin")
            }
            var h = estadoHorario()
            bot(
              h.abierto
                ? "Recibimos su mensaje. Le respondemos por mensaje de texto y correo en breve."
                : "Recibimos su mensaje. Estamos fuera del horario de atención: le respondemos por mensaje de texto y correo al volver."
            )
            pintar("fin")
          })
          .catch(function (e2) {
            err.textContent = e2 && e2.message && e2.message !== "error" && e2.name !== "TypeError" ? e2.message : "No pudimos enviar su mensaje. Intente de nuevo."
            b.disabled = false
            b.textContent = "Enviar a soporte"
          })
      })
      setTimeout(function () {
        ;(ced || msj).focus()
      }, 50)
      return f
    }

    var abrir = function (si) {
      panel.hidden = !si
      raiz.classList.toggle("abierto", si)
      btn.querySelector("span").textContent = si ? "Cerrar" : "¿Necesita ayuda?"
      if (si) {
        var h = estadoHorario()
        est.textContent = h.abierto ? "En horario de atención" : "Fuera de horario: le respondemos al volver"
        pie.textContent = h.texto
        if (!historial.length) {
          bot("Hola" + (deudor.nombre ? ", " + deudor.nombre : "") + ". Somos el equipo de soporte de Cobranza Activa. ¿En qué le ayudamos?")
          pintar("inicio")
        }
      }
    }
    btn.addEventListener("click", function () {
      abrir(panel.hidden)
    })
    x.addEventListener("click", function () {
      abrir(false)
    })
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") abrir(false)
    })

    if (window.fetch)
      fetch(SITIO, { credentials: "omit" })
        .then(function (r) {
          return r.ok ? r.json() : null
        })
        .then(function (d) {
          if (d && d.atencion) atencion = d.atencion
        })
        .catch(function () {})
  }

  window.CobranzaChat = {
    identificar: function (d) {
      d = d || {}
      deudor.cedula = String(d.cedula || "").replace(/\D/g, "")
      deudor.obligacion = String(d.obligacion || "").trim()
      deudor.nombre = String(d.nombre || "").trim().split(" ")[0]
    },
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar)
  else montar()
})()
