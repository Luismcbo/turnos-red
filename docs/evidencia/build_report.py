# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER

BASE = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(BASE, "informe-tecnico-turnosred.pdf")

# Prepare a temp dir with all source images; the socket.io screenshot gets
# cropped to isolate the browser pane from the surrounding app chrome.
import tempfile  # noqa: E402
from PIL import Image as PILImage  # noqa: E402

CROPPED = tempfile.mkdtemp(prefix="turnosred_report_")
_socket_src = os.path.join(BASE, "12-socketio-eventos-tiempo-real.png")
PILImage.open(_socket_src).crop((575, 37, 1280, 765)).save(
    os.path.join(CROPPED, "12-socketio-eventos-tiempo-real.png")
)
for _fname in [
    "01-debug-breakpoint.png",
    "02-debug-step-over.png",
    "03-postman-get-turnos.png",
    "04-postman-get-turno-id.png",
    "05-postman-get-turno-404.png",
    "06-postman-post-turnos-201.png",
    "07-postman-post-turnos-400.png",
    "08-postman-put-turnos-200.png",
    "09-postman-put-turnos-404.png",
    "10-postman-delete-turnos-200.png",
    "11-postman-delete-turnos-404.png",
]:
    PILImage.open(os.path.join(BASE, _fname)).save(os.path.join(CROPPED, _fname))

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "TitleCustom", parent=styles["Title"], fontSize=20, spaceAfter=4, textColor=colors.HexColor("#0f172a")
)
subtitle_style = ParagraphStyle(
    "Subtitle", parent=styles["Normal"], fontSize=11, textColor=colors.HexColor("#475569"), spaceAfter=14
)
h1 = ParagraphStyle(
    "H1", parent=styles["Heading1"], fontSize=14, spaceBefore=6, spaceAfter=8, textColor=colors.HexColor("#0f172a")
)
h2 = ParagraphStyle(
    "H2", parent=styles["Heading2"], fontSize=11.5, spaceBefore=4, spaceAfter=4, textColor=colors.HexColor("#1e293b")
)
body = ParagraphStyle("BodyCustom", parent=styles["Normal"], fontSize=9.5, leading=13, spaceAfter=6)
caption = ParagraphStyle(
    "Caption", parent=styles["Normal"], fontSize=8.5, leading=11, textColor=colors.HexColor("#475569"),
    alignment=TA_CENTER, spaceAfter=10,
)
small = ParagraphStyle("Small", parent=styles["Normal"], fontSize=8.5, leading=12, textColor=colors.HexColor("#334155"))

PAGE_W, PAGE_H = letter
MARGIN = 0.5 * inch
CONTENT_W = PAGE_W - 2 * MARGIN


def img_flowable(fname, width):
    path = os.path.join(CROPPED, fname)
    pil = PILImage.open(path)
    w, h = pil.size
    height = width * h / w
    return Image(path, width=width, height=height)


def two_up(fname_l, cap_l, fname_r, cap_r, col_w):
    img_l = img_flowable(fname_l, col_w)
    img_r = img_flowable(fname_r, col_w)
    data = [
        [img_l, img_r],
        [Paragraph(cap_l, caption), Paragraph(cap_r, caption)],
    ]
    t = Table(data, colWidths=[col_w + 4, col_w + 4])
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 2),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    return t


def one_up(fname, cap, width):
    img = img_flowable(fname, width)
    return [img, Paragraph(cap, caption)]


story = []

# ---------------------------------------------------------------- Page 1
story.append(Paragraph("TurnosRed &mdash; Informe t&eacute;cnico", title_style))
story.append(
    Paragraph(
        "Evidencia de depuraci&oacute;n, pruebas de API y eventos en tiempo real &middot; "
        "Actividad de Integraciones Web",
        subtitle_style,
    )
)
story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#cbd5e1"), spaceAfter=10))

story.append(
    Paragraph(
        "<b>Repositorio:</b> "
        "<link href='https://github.com/Luismcbo/turnos-red' color='#2563eb'>"
        "github.com/Luismcbo/turnos-red</link> &nbsp;&middot;&nbsp; "
        "<b>Stack:</b> Node.js + TypeScript + Express + Socket.IO &nbsp;&middot;&nbsp; "
        "<b>Autor:</b> Luis Valenzuela",
        body,
    )
)
story.append(
    Paragraph(
        "Este informe documenta tres piezas de evidencia sobre el backend TurnosRed: una sesi&oacute;n de "
        "depuraci&oacute;n en VS Code sobre el endpoint <b>POST /turnos</b>, las pruebas de los 5 endpoints "
        "REST en Postman (200/201/400/404), y la recepci&oacute;n en vivo de eventos por Socket.IO al "
        "disparar operaciones desde Postman/curl, sin polling.",
        body,
    )
)

story.append(Spacer(1, 6))
story.append(Paragraph("1. Sesi&oacute;n de depuraci&oacute;n (VS Code)", h1))
story.append(
    Paragraph(
        "Se coloc&oacute; un breakpoint en <font face='Courier'>src/controllers/turno.controller.ts:59</font>, "
        "dentro de <font face='Courier'>crearTurno</font>, justo antes de persistir el turno normalizado. "
        "Al enviar un POST /turnos, la ejecuci&oacute;n se detiene ah&iacute; y el panel de Variables muestra "
        "el body recibido (<font face='Courier'>bodyValido</font>) y el Call Stack confirma "
        "&ldquo;Paused On Breakpoint&rdquo;. Con Step Over (F10) se avanza a la l&iacute;nea siguiente, donde "
        "ya existe <font face='Courier'>turnoCreado</font> antes de responder con 201.",
        body,
    )
)
story.append(Spacer(1, 4))

col_w = (CONTENT_W - 8) / 2
story.append(
    two_up(
        "01-debug-breakpoint.png",
        "Fig. 1 &mdash; Breakpoint alcanzado en crearTurno (linea 59). Variables: bodyValido expandido.",
        "02-debug-step-over.png",
        "Fig. 2 &mdash; Step Over (F10): avance a la linea 60 con turnoCreado ya disponible.",
        col_w,
    )
)

story.append(PageBreak())

# ---------------------------------------------------------------- Page 2
story.append(Paragraph("2. Pruebas de los 5 endpoints en Postman", h1))
story.append(
    Paragraph(
        "Colecci&oacute;n <b>TurnosRed API</b> contra <font face='Courier'>http://localhost:3000</font>. "
        "A continuaci&oacute;n, <b>GET /turnos</b> (200, lista completa), <b>GET /turnos/:id</b> (200, un "
        "turno) y <b>GET /turnos/:id</b> con id inexistente (404).",
        body,
    )
)
story.append(Spacer(1, 4))
col_w3 = (CONTENT_W - 16) / 3
img1 = img_flowable("03-postman-get-turnos.png", col_w3)
img2 = img_flowable("04-postman-get-turno-id.png", col_w3)
img3 = img_flowable("05-postman-get-turno-404.png", col_w3)
data = [
    [img1, img2, img3],
    [
        Paragraph("Fig. 3 &mdash; GET /turnos &rarr; 200 OK", caption),
        Paragraph("Fig. 4 &mdash; GET /turnos/102 &rarr; 200 OK", caption),
        Paragraph("Fig. 5 &mdash; GET /turnos/999 &rarr; 404", caption),
    ],
]
t3 = Table(data, colWidths=[col_w3 + 4] * 3)
t3.setStyle(
    TableStyle(
        [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 2),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ]
    )
)
story.append(t3)

story.append(Spacer(1, 10))
story.append(
    Paragraph(
        "<b>POST /turnos:</b> creaci&oacute;n exitosa (201, con normalizaci&oacute;n de fecha/hora/confirmado) "
        "y body inv&aacute;lido (400, falta un campo requerido).",
        body,
    )
)
story.append(Spacer(1, 4))
story.append(
    two_up(
        "06-postman-post-turnos-201.png",
        "Fig. 6 &mdash; POST /turnos &rarr; 201 Created",
        "07-postman-post-turnos-400.png",
        "Fig. 7 &mdash; POST /turnos (body incompleto) &rarr; 400 Bad Request",
        col_w,
    )
)

story.append(PageBreak())

# ---------------------------------------------------------------- Page 3
story.append(Paragraph("2. Pruebas de los 5 endpoints en Postman (cont.)", h1))
story.append(
    Paragraph(
        "<b>PUT /turnos/:id:</b> actualizaci&oacute;n exitosa (200) e id inexistente (404).",
        body,
    )
)
story.append(Spacer(1, 4))
story.append(
    two_up(
        "08-postman-put-turnos-200.png",
        "Fig. 8 &mdash; PUT /turnos/107 &rarr; 200 OK",
        "09-postman-put-turnos-404.png",
        "Fig. 9 &mdash; PUT /turnos/9999 &rarr; 404 Not Found",
        col_w,
    )
)
story.append(Spacer(1, 8))
story.append(
    Paragraph(
        "<b>DELETE /turnos/:id:</b> eliminaci&oacute;n exitosa (200, devuelve el turno eliminado) y "
        "segunda eliminaci&oacute;n del mismo id (404).",
        body,
    )
)
story.append(Spacer(1, 4))
story.append(
    two_up(
        "10-postman-delete-turnos-200.png",
        "Fig. 10 &mdash; DELETE /turnos/107 &rarr; 200 OK",
        "11-postman-delete-turnos-404.png",
        "Fig. 11 &mdash; DELETE /turnos/107 (repetido) &rarr; 404 Not Found",
        col_w,
    )
)

story.append(PageBreak())

# ---------------------------------------------------------------- Page 4
story.append(Paragraph("3. Eventos en tiempo real (Socket.IO)", h1))
story.append(
    Paragraph(
        "Cada operaci&oacute;n exitosa del servicio de turnos emite un evento por un "
        "<font face='Courier'>EventEmitter</font> interno "
        "(<font face='Courier'>turno:creado</font>, <font face='Courier'>turno:actualizado</font>, "
        "<font face='Courier'>turno:eliminado</font>). Socket.IO est&aacute; suscripto a ese bus y "
        "retransmite <font face='Courier'>turno:nuevo</font>, <font face='Courier'>turno:actualizado</font> y "
        "<font face='Courier'>turno:eliminado</font> a todos los clientes conectados. El cliente de prueba "
        "(<font face='Courier'>public/index.html</font>) abre el WebSocket una sola vez y muestra cada evento "
        "apenas ocurre en el servidor &mdash; <b>sin polling</b>. La captura muestra los tres eventos recibidos "
        "en vivo tras un POST, un PUT y un DELETE consecutivos contra <font face='Courier'>/turnos</font>.",
        body,
    )
)
story.append(Spacer(1, 4))

sock_w = 3.4 * inch
sock_img = img_flowable("12-socketio-eventos-tiempo-real.png", sock_w)
sock_table = Table(
    [[sock_img], [Paragraph("Fig. 12 &mdash; Cliente Socket.IO recibiendo turno:actualizado, turno:eliminado y turno:nuevo en vivo, sin recargar la pagina.", caption)]],
    colWidths=[sock_w + 4],
)
sock_table.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
story.append(sock_table)

story.append(Spacer(1, 14))
story.append(Paragraph("4. Resumen de endpoints verificados", h1))

table_data = [
    ["Metodo", "Ruta", "Casos probados", "Resultado"],
    ["GET", "/turnos", "Listado completo", "200 OK"],
    ["GET", "/turnos/:id", "Existente / inexistente", "200 OK / 404 Not Found"],
    ["POST", "/turnos", "Body valido / incompleto", "201 Created / 400 Bad Request"],
    ["PUT", "/turnos/:id", "Existente / inexistente", "200 OK / 404 Not Found"],
    ["DELETE", "/turnos/:id", "Existente / ya eliminado", "200 OK / 404 Not Found"],
]
summary = Table(table_data, colWidths=[0.7 * inch, 1.1 * inch, 2.1 * inch, 2.2 * inch])
summary.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ]
    )
)
story.append(summary)

story.append(Spacer(1, 10))
story.append(
    Paragraph(
        "Los errores no controlados responden <b>500</b> con "
        "<font face='Courier'>{ \"error\": \"Error interno del servidor\" }</font> "
        "desde el middleware centralizado en <font face='Courier'>src/middlewares/errorHandler.ts</font>.",
        body,
    )
)
story.append(Spacer(1, 4))
story.append(
    Paragraph(
        "<b>Conclusi&oacute;n:</b> los cinco endpoints REST de TurnosRed responden con los c&oacute;digos de "
        "estado esperados en sus casos de &eacute;xito y de error, la normalizaci&oacute;n de datos "
        "heterog&eacute;neos funciona correctamente (verificado en debugging), y la notificaci&oacute;n en "
        "tiempo real por Socket.IO llega a los clientes conectados inmediatamente despu&eacute;s de cada "
        "operaci&oacute;n exitosa, sin necesidad de polling.",
        body,
    )
)

doc = SimpleDocTemplate(
    OUT_PDF,
    pagesize=letter,
    leftMargin=MARGIN,
    rightMargin=MARGIN,
    topMargin=MARGIN,
    bottomMargin=MARGIN,
    title="TurnosRed - Informe tecnico",
    author="Luis Valenzuela",
)
doc.build(story)
print("PDF generado:", OUT_PDF)
