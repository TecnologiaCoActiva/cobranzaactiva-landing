/*
 * Cobranza Activa · comportamiento del sitio
 * Menú de Soluciones, chat de la página, pestañas, simulador de honorarios,
 * recorrido de la plataforma y formulario de contacto.
 */
(function () {
  var API_CONTACTO = "https://app.cobranzaactiva.com/api/publico/contacto"
  var CONVERSION = "AW-11016912602/gXl7CMavjYQYENr9ooUp"
  var REGISTRO = "https://app.cobranzaactiva.com/registro"

  var registrarConversion = function () {
    if (typeof window.gtag === "function") window.gtag("event", "conversion", { send_to: CONVERSION })
  }
  var $ = function (sel, raiz) {
    return (raiz || document).querySelector(sel)
  }
  var $$ = function (sel, raiz) {
    return Array.prototype.slice.call((raiz || document).querySelectorAll(sel))
  }
  var guardar = function (clave, valor) {
    try {
      sessionStorage.setItem(clave, JSON.stringify(valor))
    } catch (e) {}
  }
  var leer = function (clave) {
    try {
      return JSON.parse(sessionStorage.getItem(clave) || "null")
    } catch (e) {
      return null
    }
  }

  // Datos vivos (sitio-datos.js los deja en window.CA_DATOS y avisa con "ca:datos")
  var datos = function () {
    return window.CA_DATOS || {}
  }
  var dato = function (clave, respaldo) {
    var d = datos()
    var v = (d.contacto && d.contacto[clave]) || (d.tarifas && d.tarifas[clave])
    return v === undefined || v === null || String(v).trim() === "" ? respaldo : v
  }

  /* ---------- Menú de Soluciones ---------- */

  var botonMega = $(".cab__soluciones")
  var mega = $("#mega")
  if (botonMega && mega) {
    var abrirMega = function (abrir) {
      botonMega.setAttribute("aria-expanded", abrir ? "true" : "false")
      mega.hidden = !abrir
    }
    botonMega.addEventListener("click", function (e) {
      e.stopPropagation()
      abrirMega(mega.hidden)
    })
    document.addEventListener("click", function (e) {
      if (!mega.hidden && !mega.contains(e.target)) abrirMega(false)
    })
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mega.hidden) {
        abrirMega(false)
        botonMega.focus()
      }
    })
  }

  /* ---------- Pestañas genéricas (bloque de la plataforma del inicio) ---------- */

  $$("[data-pestanas]").forEach(function (grupo) {
    var tabs = $$('[role="tab"]', grupo)
    var activar = function (tab, enfocar) {
      tabs.forEach(function (t) {
        var sel = t === tab
        t.setAttribute("aria-selected", sel ? "true" : "false")
        t.tabIndex = sel ? 0 : -1
        var panel = document.getElementById(t.getAttribute("aria-controls"))
        if (panel) panel.hidden = !sel
      })
      if (enfocar) tab.focus()
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        activar(t)
      })
      t.addEventListener("keydown", function (e) {
        var sig = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
        if (sig) {
          e.preventDefault()
          activar(tabs[(i + sig + tabs.length) % tabs.length], true)
        }
      })
    })
  })

  /* ---------- Simulador de honorarios (misma regla que la plataforma, lib/honorarios.js) ---------- */

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
        servicio === "rescate"
          ? 0.4
          : servicio === "juridico" || servicio === "insolvencia"
          ? 0.2
          : tramos.filter(function (x) {
              return dias <= x.hasta
            })[0].tarifa
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

  /* ---------- Recorrido de la plataforma ---------- */

  var pestanas = $$('.tour__pestanas [role="tab"]')
  if (pestanas.length) {
    var menuApp = $$(".app__menu li[data-pantalla]")
    var activarTour = function (tab, enfocar, desplazar) {
      pestanas.forEach(function (t) {
        var sel = t === tab
        t.setAttribute("aria-selected", sel ? "true" : "false")
        t.tabIndex = sel ? 0 : -1
        document.getElementById(t.getAttribute("aria-controls")).hidden = !sel
      })
      var clave = tab.id.replace("t-", "")
      var app = $(".app")
      if (app) app.classList.toggle("app--deudor", clave === "deudor")
      var url = $(".navegador p")
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
        activarTour(t, false, true)
      })
      t.addEventListener("keydown", function (e) {
        var sig = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
        if (sig) {
          e.preventDefault()
          activarTour(pestanas[(i + sig + pestanas.length) % pestanas.length], true, true)
        } else if (e.key === "Home") {
          e.preventDefault()
          activarTour(pestanas[0], true)
        } else if (e.key === "End") {
          e.preventDefault()
          activarTour(pestanas[pestanas.length - 1], true)
        }
      })
    })
    activarTour(pestanas[0])
  }

  // Registro y agenda: cuentan como conversión
  $$(".js-agenda").forEach(function (a) {
    a.addEventListener("click", registrarConversion)
  })

  /* ---------- Envío a la plataforma (formulario y chat) ---------- */

  var enviar = function (datosEnvio) {
    return fetch(API_CONTACTO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosEnvio),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j }
        })
      })
      .then(function (res) {
        if (!res.ok) throw new Error((res.j && res.j.error) || "error")
        return true
      })
      .catch(function (err) {
        // Errores de red del navegador ("Load failed", "Failed to fetch"…): mensaje claro en español
        var red = !err || err.name === "TypeError" || err.name === "SyntaxError" || err.message === "error"
        throw new Error(red ? "No pudimos enviar su mensaje. Revise su conexión o escríbanos por WhatsApp." : err.message)
      })
  }
  var correoValido = function (v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
  }

  /* ---------- Formulario de contacto ---------- */

  var form = document.getElementById("formulario-contacto")
  if (form) {
    var estado = $(".formulario__estado", form)
    var boton = $('button[type="submit"]', form)
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
      marcar("f-correo", !correoValido(v("f-correo")), "Revise el correo.")
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
      var d = {}
      new FormData(form).forEach(function (valor, clave) {
        d[clave] = valor
      })
      if (d.tipo_entidad) {
        d.mensaje = "Tipo de entidad: " + d.tipo_entidad + (d.mensaje ? "\n" + d.mensaje : "")
        delete d.tipo_entidad
      }
      d.tipo = "entidad"
      d.canal = "formulario"
      boton.disabled = true
      mostrar("Enviando…")
      enviar(d)
        .then(function () {
          form.reset()
          mostrar("Recibimos sus datos. Un asesor lo contactará pronto.", "ok")
          registrarConversion()
        })
        .catch(function (err) {
          mostrar(err.message, "error")
        })
        .then(function () {
          boton.disabled = false
        })
    })
  }

  /* ---------- Chat de la página ---------- */

  var raiz = document.getElementById("asistente")
  if (!raiz) return

  var abrirBtn = $(".asistente__boton", raiz)
  var panel = $(".asistente__panel", raiz)
  var lista = $(".asistente__mensajes", raiz)
  var entrada = $(".asistente__escribir input", raiz)
  var formEscribir = $(".asistente__escribir", raiz)
  var estadoEl = $(".asistente__estado", raiz)
  var horarioEl = $(".asistente__horario span", raiz)
  var CLAVE = "ca-chat"

  var estadoChat = leer(CLAVE) || { paso: "inicio", historial: [], abierto: false, pendiente: "" }

  var DIAS = ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
  var hora12 = function (h, m) {
    var hh = Number(h)
    var sufijo = hh < 12 ? "a. m." : "p. m."
    var h12 = hh % 12 === 0 ? 12 : hh % 12
    return h12 + ":" + m + " " + sufijo
  }
  var horario = function () {
    var a = datos().atencion || {}
    var texto = a.horario || "1-5 08:00-17:30"
    var m = String(texto).match(/^(\d)-(\d)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/)
    if (!m) return { abierto: true, texto: "" }
    var ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }))
    var dia = ahora.getDay() === 0 ? 7 : ahora.getDay()
    var min = ahora.getHours() * 60 + ahora.getMinutes()
    var desde = Number(m[3]) * 60 + Number(m[4])
    var hasta = Number(m[5]) * 60 + Number(m[6])
    var abierto = dia >= Number(m[1]) && dia <= Number(m[2]) && min >= desde && min < hasta
    return {
      abierto: abierto,
      texto:
        "Atendemos de " + DIAS[Number(m[1])] + " a " + DIAS[Number(m[2])] + ", " + hora12(m[3], m[4]) + " a " + hora12(m[5], m[6]),
    }
  }
  var pintarHorario = function () {
    var h = horario()
    estadoEl.classList.toggle("fuera", !h.abierto)
    $("span", estadoEl).textContent = h.abierto ? "En horario de atención" : "Fuera de horario: le respondemos al volver"
    if (h.texto) horarioEl.textContent = h.texto
  }

  var bot = function (texto) {
    return { de: "bot", texto: texto }
  }
  var yo = function (texto) {
    return { de: "yo", texto: texto }
  }
  var persistir = function () {
    guardar(CLAVE, estadoChat)
  }

  var precioDesde = function () {
    var v = Number(dato("SUSCRIPCION_RECAUDO_PRO", 3000))
    return "$" + (Number.isFinite(v) ? v : 3000).toLocaleString("es-CO")
  }

  // Cada paso: qué opciones se muestran y qué formulario
  var PASOS = {
    inicio: function () {
      return [
        { t: "Soy una entidad", ir: "entidad", dice: "¡Bienvenido! ¿Qué le gustaría saber?" },
        {
          t: "Tengo una deuda",
          ir: "deudor",
          dice:
            "En su portal puede consultar su saldo, hacer un acuerdo de pago y reportar pagos, solo con su cédula. Si prefiere, escríbanos y la mesa de soporte le responde.",
        },
        {
          t: "Ya soy cliente",
          ir: "cliente",
          dice: "Ingrese a la plataforma: allí tiene el chat directo con la mesa de soporte, sus informes y sus facturas.",
        },
      ]
    },
    entidad: function () {
      return [
        {
          t: "¿Cuánto cuesta?",
          ir: "entidad",
          dice:
            "Una suscripción mensual por crédito vencido (desde " +
            precioDesde() +
            ") y honorarios solo cuando hay recaudo. Rescate Master no tiene suscripción.",
          enlace: { t: "Ver precios", href: "/precios/" },
        },
        {
          t: "¿Hay permanencia?",
          ir: "entidad",
          dice:
            "No hay cláusula de permanencia. Puede retirar cuentas cuando quiera, salvo las que tengan acuerdo de pago, retención por nómina o proceso judicial activos.",
        },
        { t: "¿Qué servicio me sirve?", ir: "servicio", dice: "Depende de su cartera. ¿Cómo está la mayoría de sus créditos?" },
        {
          t: "¿Cómo empiezo?",
          ir: "entidad",
          dice: "Registre su entidad en la plataforma (2 minutos) y elija la hora de su reunión virtual con un asesor.",
          enlace: { t: "Regístrese y agende su cita", href: REGISTRO, externo: true, agenda: true },
        },
        { t: "Hablar con una persona", ir: "formEntidad", dice: "Con gusto. Déjenos sus datos y un asesor le responde por celular o correo." },
      ]
    },
    servicio: function () {
      return [
        { t: "Mora de 31 a 360 días", ir: "entidad", dice: "Le sirve Recaudo Pro: mensajes, portal del deudor y acuerdos de pago.", enlace: { t: "Ver Recaudo Pro", href: "/servicios/recaudo-pro/" } },
        { t: "El deudor tiene empleo", ir: "entidad", dice: "Le sirve Recupera Plus+: solicitamos la retención salarial al empleador, sin demanda.", enlace: { t: "Ver Recupera Plus+", href: "/servicios/recupera-plus/" } },
        { t: "Hay garantía o bienes", ir: "entidad", dice: "Le sirve Resuelve Jurídico: proceso ejecutivo con medidas cautelares.", enlace: { t: "Ver Resuelve Jurídico", href: "/servicios/resuelve-juridico/" } },
        { t: "Cartera castigada", ir: "entidad", dice: "Le sirve Rescate Master: sin suscripción, solo paga si recuperamos.", enlace: { t: "Ver Rescate Master", href: "/servicios/rescate-master/" } },
        { t: "Deudor en insolvencia", ir: "entidad", dice: "Le sirve Respaldo Insolvencia: representamos a su entidad en las audiencias.", enlace: { t: "Ver Respaldo Insolvencia", href: "/servicios/respaldo-insolvencia/" } },
      ]
    },
    deudor: function () {
      return [
        { t: "Ir a mi portal", accion: "portal" },
        { t: "Escribir a soporte", ir: "formDeudor", dice: "Escriba su cédula, su celular y su mensaje. Llega a la mesa de soporte." },
      ]
    },
    cliente: function () {
      return [
        { t: "Ingresar a la plataforma", accion: "plataforma" },
        { t: "Pagar una factura por PSE", accion: "pse" },
        { t: "Hablar con una persona", ir: "formEntidad", dice: "Con gusto. Déjenos sus datos y la mesa de soporte le responde." },
      ]
    },
    enviado: function () {
      return [{ t: "Volver al inicio", accion: "reiniciar" }]
    },
  }

  var abrirEnlace = function (href) {
    window.open(href, "_blank", "noopener")
  }
  var ACCIONES = {
    portal: function () {
      abrirEnlace(dato("URL_PORTAL_DEUDOR", "https://www.cobranzaactiva.com/deudores/"))
      return "Abrimos su portal en una pestaña nueva. Necesita su número de cédula."
    },
    plataforma: function () {
      abrirEnlace(dato("URL_PLATAFORMA", "https://app.cobranzaactiva.com"))
      return "Abrimos la plataforma en una pestaña nueva."
    },
    pse: function () {
      abrirEnlace(dato("URL_PAGOS_PSE", "https://portalpagos.davivienda.com/#/comercio/7132/COBRANZA%20ACTIVA%20SAS"))
      return "Abrimos el pago por PSE de las facturas de Cobranza Activa en una pestaña nueva."
    },
  }

  var crearEl = function (tag, clase, texto) {
    var el = document.createElement(tag)
    if (clase) el.className = clase
    if (texto !== undefined) el.textContent = texto
    return el
  }

  var campo = function (id, etiqueta, tipo, extra) {
    var f = document.createDocumentFragment()
    var l = crearEl("label", "", etiqueta)
    l.setAttribute("for", id)
    var i = tipo === "textarea" ? crearEl("textarea") : crearEl("input")
    i.id = id
    if (tipo !== "textarea") i.type = tipo
    Object.keys(extra || {}).forEach(function (k) {
      i.setAttribute(k, extra[k])
    })
    f.appendChild(l)
    f.appendChild(i)
    return f
  }

  var formularioChat = function (tipo) {
    var f = crearEl("form", "form-chat")
    f.noValidate = true
    if (tipo === "deudor") {
      f.appendChild(campo("ch-cedula", "Número de cédula", "text", { inputmode: "numeric", autocomplete: "off" }))
      f.appendChild(campo("ch-celular", "Celular", "tel", { autocomplete: "tel", inputmode: "tel" }))
      f.appendChild(campo("ch-correo", "Correo (opcional)", "email", { autocomplete: "email" }))
    } else {
      f.appendChild(campo("ch-nombre", "Nombre", "text", { autocomplete: "name" }))
      f.appendChild(campo("ch-entidad", "Entidad", "text", { autocomplete: "organization" }))
      f.appendChild(campo("ch-correo", "Correo", "email", { autocomplete: "email" }))
      f.appendChild(campo("ch-celular", "Celular", "tel", { autocomplete: "tel", inputmode: "tel" }))
    }
    f.appendChild(campo("ch-mensaje", "Mensaje", "textarea", { rows: "2" }))
    var legal = crearEl("p", "form-chat__legal")
    legal.innerHTML =
      'Al enviar acepta nuestra <a href="https://docs.google.com/document/d/1drH7IzBOHxf9505DIOFEqLwyQt9Wmsi8" target="_blank" rel="noopener">política de tratamiento de datos</a>.'
    var error = crearEl("p", "form-chat__error")
    error.setAttribute("role", "alert")
    var b = crearEl("button", "", tipo === "deudor" ? "Enviar a soporte" : "Enviar a un asesor")
    b.type = "submit"
    f.appendChild(legal)
    f.appendChild(error)
    f.appendChild(b)
    var msj = $("#ch-mensaje", f)
    if (estadoChat.pendiente) msj.value = estadoChat.pendiente

    f.addEventListener("submit", function (e) {
      e.preventDefault()
      var v = function (id) {
        var el = $("#" + id, f)
        return el ? el.value.trim() : ""
      }
      var malo = null
      var marcar = function (id, condicion, texto) {
        var el = $("#" + id, f)
        if (!el) return
        el.setAttribute("aria-invalid", condicion ? "true" : "false")
        if (condicion && !malo) malo = { el: el, texto: texto }
      }
      var d = { canal: "chat", tipo: tipo, mensaje: v("ch-mensaje"), sitio_web: "" }
      if (tipo === "deudor") {
        d.cedula = v("ch-cedula")
        d.celular = v("ch-celular")
        d.correo = v("ch-correo")
        marcar("ch-cedula", d.cedula.replace(/\D/g, "").length < 5, "Revise el número de cédula.")
        marcar("ch-celular", d.celular.replace(/\D/g, "").length < 7, "Revise el número de celular.")
        marcar("ch-correo", d.correo !== "" && !correoValido(d.correo), "Revise el correo.")
      } else {
        d.nombre = v("ch-nombre")
        d.entidad = v("ch-entidad")
        d.correo = v("ch-correo")
        d.celular = v("ch-celular")
        d.producto = "Chat de la página"
        marcar("ch-nombre", d.nombre.length < 3, "Escriba su nombre.")
        marcar("ch-correo", !correoValido(d.correo), "Revise el correo.")
        marcar("ch-celular", d.celular.replace(/\D/g, "").length < 7, "Revise el número de celular.")
      }
      if (malo) {
        error.textContent = malo.texto
        malo.el.focus()
        return
      }
      error.textContent = ""
      b.disabled = true
      b.textContent = "Enviando…"
      enviar(d)
        .then(function () {
          if (tipo !== "deudor") registrarConversion()
          var h = horario()
          // Si el mensaje ya se ve en la conversación (lo escribió antes), no se repite
          var yaDicho = estadoChat.pendiente && d.mensaje === estadoChat.pendiente.trim()
          estadoChat.pendiente = ""
          avanzar("enviado", [
            yo(yaDicho || !d.mensaje ? "Le dejé mis datos." : d.mensaje),
            bot(
              h.abierto
                ? "¡Recibido! La mesa de soporte le responde por celular o correo en breve."
                : (datos().atencion && datos().atencion.mensaje_fuera) ||
                    "Recibimos su mensaje. Estamos fuera del horario de atención: le respondemos al volver."
            ),
          ])
        })
        .catch(function (err) {
          error.textContent = err.message
          b.disabled = false
          b.textContent = tipo === "deudor" ? "Enviar a soporte" : "Enviar a un asesor"
        })
    })
    return f
  }

  var pintar = function () {
    lista.innerHTML = ""
    var mensajes = [bot("Hola, somos Cobranza Activa. Para orientarle mejor, ¿usted es…?")].concat(estadoChat.historial)
    mensajes.forEach(function (m) {
      var p = crearEl("p", "burbuja burbuja--" + m.de, m.texto)
      if (m.enlace) {
        p.appendChild(document.createTextNode(" "))
        var a = crearEl("a", m.enlace.agenda ? "js-agenda" : "", m.enlace.t)
        a.href = m.enlace.href
        if (m.enlace.externo) {
          a.target = "_blank"
          a.rel = "noopener"
        }
        if (m.enlace.agenda) a.addEventListener("click", registrarConversion)
        p.appendChild(a)
      }
      lista.appendChild(p)
    })
    var paso = estadoChat.paso
    if (paso === "formEntidad" || paso === "formDeudor") {
      lista.appendChild(formularioChat(paso === "formDeudor" ? "deudor" : "entidad"))
      var opcionesForm = crearEl("div", "opciones-chat")
      var volver = crearEl("button", "", "Volver")
      volver.type = "button"
      volver.addEventListener("click", function () {
        avanzar(paso === "formDeudor" ? "deudor" : "entidad", [])
      })
      opcionesForm.appendChild(volver)
      lista.appendChild(opcionesForm)
    } else if (PASOS[paso]) {
      var cont = crearEl("div", "opciones-chat")
      PASOS[paso]().forEach(function (o) {
        var b = crearEl("button", "", o.t)
        b.type = "button"
        b.addEventListener("click", function () {
          if (o.accion === "reiniciar") return reiniciar()
          if (o.accion) return avanzar(paso, [yo(o.t), bot(ACCIONES[o.accion]())])
          var respuesta = bot(o.dice)
          if (o.enlace) respuesta.enlace = o.enlace
          avanzar(o.ir, [yo(o.t), respuesta])
        })
        cont.appendChild(b)
      })
      lista.appendChild(cont)
    }
    lista.scrollTop = lista.scrollHeight
  }

  var avanzar = function (paso, nuevos) {
    estadoChat.paso = paso
    estadoChat.historial = estadoChat.historial.concat(nuevos).slice(-40)
    persistir()
    pintar()
    var primero = $("input, textarea", lista)
    if (primero && (paso === "formEntidad" || paso === "formDeudor")) primero.focus()
  }
  var reiniciar = function () {
    estadoChat = { paso: "inicio", historial: [], abierto: true, pendiente: "" }
    persistir()
    pintar()
  }

  var abrir = function (si) {
    estadoChat.abierto = si
    persistir()
    panel.hidden = !si
    raiz.classList.toggle("abierto", si)
    abrirBtn.setAttribute("aria-expanded", si ? "true" : "false")
    $("span", abrirBtn).textContent = si ? "Cerrar" : "¿En qué le ayudamos?"
    if (si) {
      pintarHorario()
      pintar()
      entrada.focus({ preventScroll: true })
    } else {
      abrirBtn.focus({ preventScroll: true })
    }
  }

  abrirBtn.addEventListener("click", function () {
    abrir(panel.hidden)
  })
  $(".asistente__cerrar", raiz).addEventListener("click", function () {
    abrir(false)
  })
  $(".asistente__reiniciar", raiz).addEventListener("click", reiniciar)
  panel.addEventListener("keydown", function (e) {
    if (e.key === "Escape") abrir(false)
  })
  $$("[data-abrir-chat]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault()
      abrir(true)
    })
  })

  // Lo que el visitante escribe libremente: se lleva al formulario para que soporte le responda
  formEscribir.addEventListener("submit", function (e) {
    e.preventDefault()
    var texto = entrada.value.trim()
    if (!texto) return
    entrada.value = ""
    var paso = estadoChat.paso
    if (paso === "formEntidad" || paso === "formDeudor") {
      var msj = $("#ch-mensaje", lista)
      if (msj) {
        msj.value = (msj.value ? msj.value + "\n" : "") + texto
        msj.focus()
      }
      return
    }
    estadoChat.pendiente = (estadoChat.pendiente ? estadoChat.pendiente + "\n" : "") + texto
    if (paso === "deudor") return avanzar("formDeudor", [yo(texto), bot("Para que la mesa de soporte le responda, déjenos su cédula y su celular.")])
    if (paso === "entidad" || paso === "servicio" || paso === "cliente")
      return avanzar("formEntidad", [yo(texto), bot("Para que un asesor le responda, déjenos sus datos.")])
    avanzar("inicio", [yo(texto), bot("Gracias. Para que la persona indicada le responda, cuéntenos: ¿usted es…?")])
  })

  document.addEventListener("ca:datos", function () {
    pintarHorario()
    if (!panel.hidden) pintar()
  })

  pintarHorario()
  if (estadoChat.abierto && !window.matchMedia("(max-width: 560px)").matches) abrir(true)
})()
