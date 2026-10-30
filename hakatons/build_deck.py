"""Builds hakatons/buvgruzu-birza.pptx · the 3-minute pitch deck (import into Canva)."""
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn

DARK = RGBColor(0x24, 0x4A, 0x30)
MID = RGBColor(0x5E, 0x8C, 0x5A)
LIGHT = RGBColor(0xEE, 0xF3, 0xEA)
CARD = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x1C, 0x26, 0x1E)
MUTED = RGBColor(0x5B, 0x66, 0x5D)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
PALE = RGBColor(0xCF, 0xE0, 0xC8)
HEAD = "Montserrat"
BODY = "Open Sans"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]


def bg(slide, color):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def rect(slide, x, y, w, h, color, shape=MSO_SHAPE.RECTANGLE, line=None):
    s = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    s.fill.solid()
    s.fill.fore_color.rgb = color
    if line:
        s.line.color.rgb = line
        s.line.width = Pt(1.5)
    else:
        s.line.fill.background()
    s.shadow.inherit = False
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = 0.08
    return s


def text(slide, x, y, w, h, runs, size=18, color=INK, font=BODY, bold=False,
         align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.1):
    """runs: str or list of paragraphs; a paragraph is str or (str, overrides)."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for m in ("margin_left", "margin_right", "margin_top", "margin_bottom"):
        setattr(tf, m, 0)
    paras = [runs] if isinstance(runs, str) else runs
    for i, p in enumerate(paras):
        t, o = (p, {}) if isinstance(p, str) else p
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.alignment = align
        para.line_spacing = spacing
        para.space_after = Pt(o.get("after", 6))
        r = para.add_run()
        r.text = t
        f = r.font
        f.name = o.get("font", font)
        f.size = Pt(o.get("size", size))
        f.bold = o.get("bold", bold)
        f.color.rgb = o.get("color", color)
    return tb


def notes(slide, t):
    slide.notes_slide.notes_text_frame.text = t


def placeholder(slide, x, y, w, h, label):
    rect(slide, x, y, w, h, PALE, MSO_SHAPE.ROUNDED_RECTANGLE)
    text(slide, x, y, w, h, label.split("\n"), size=16, color=DARK, align=PP_ALIGN.CENTER,
         anchor=MSO_ANCHOR.MIDDLE)


def kicker(slide, x, y, t, color=MID):
    text(slide, x, y, 8, 0.4, t.upper(), size=13, color=color, font=HEAD, bold=True)


# 1 · Problēma
s = prs.slides.add_slide(BLANK)
bg(s, DARK)
kicker(s, 0.7, 0.6, "Problēma", PALE)
text(s, 0.7, 1.05, 6.2, 3.0, "Būvgruži mežā ir lētāki nekā būvgruži pārstrādē",
     size=46, color=WHITE, font=HEAD, bold=True, spacing=1.0)
text(s, 0.7, 4.75, 5.5, 1.0, "> ⅓", size=60, color=WHITE, font=HEAD, bold=True)
text(s, 0.7, 5.85, 5.5, 0.8, "no visiem ES atkritumiem ir būvniecības atkritumi", size=18, color=PALE)
photo = s.shapes.add_picture("hakatons/foto-mezs.jpg", Inches(7.35), Inches(0.6), Inches(5.35), Inches(6.3))
photo.auto_shape_type = MSO_SHAPE.ROUNDED_RECTANGLE
photo._element.spPr.prstGeom.get_or_add_avLst().append(
    photo._element.spPr.prstGeom.makeelement(qn("a:gd"), {"name": "adj", "fmla": "val 7000"}))
text(s, 7.35, 6.95, 5.35, 0.2, "Foto: iauto.lv", size=8, color=MID, align=PP_ALIGN.RIGHT)
rect(s, 7.6, 0.85, 2.6, 1.15, DARK, MSO_SHAPE.ROUNDED_RECTANGLE)
text(s, 7.6, 0.85, 2.6, 1.15, [("Izmest mežā", {"size": 14, "color": PALE, "after": 0}),
                               ("0 €", {"size": 34, "bold": True, "font": HEAD})],
     color=WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, spacing=1.0)
rect(s, 7.6, 2.15, 2.6, 1.15, WHITE, MSO_SHAPE.ROUNDED_RECTANGLE)
text(s, 7.6, 2.15, 2.6, 1.15, [("Nodot legāli", {"size": 14, "color": MUTED, "after": 0}),
                               ("līdz 500 €/t", {"size": 26, "bold": True, "font": HEAD})],
     color=DARK, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, spacing=1.0)
notes(s, '0:35. HOOK (lēni, ar pauzi): Izmest šo kaudzi mežā maksā nulle eiro. Nodot to legāli: līdz 500 eiro tonnā. Uzminiet, kurš ceļš uzvar. [pauze] Iedomājieties, ka remontējat māju: veci dēļi, betona lauskas, piekabes nav, kur nodot, nezināt. Internetā sludinājums: "izvedam būvgružus lēti". Viens zvans, un gruži nonāk mežā. Būvgruži ir vairāk nekā trešdaļa no visiem ES atkritumiem. Problēma nav cilvēkos. Nelegālais ceļš vienkārši ir lētāks.'
         "\n\n500 €/t: azbesta šīfera nodošana, LSM 27.11.2023 (avots nr. 17).\nFoto avots: https://iauto.lv/zinas/latvija/49412-izg-atkritumus-me-k-tdus-cilvkus-nosaukt-foto")

# 2 · Risinājums
s = prs.slides.add_slide(BLANK)
bg(s, LIGHT)
kicker(s, 0.7, 0.6, "Risinājums · aprites ekonomikas platforma")
text(s, 0.7, 1.0, 10, 0.9, "Būvgružu birža", size=44, color=DARK, font=HEAD, bold=True)
text(s, 0.7, 1.8, 10.2, 1.0, "Motivē cilvēkus viegli un bez maksas vai pat par atlīdzību šķirot būvgružus, "
     "bet uzņēmumiem ļauj atkārtoti izmantot materiālus jaunu produktu ražošanā.", size=16, color=MUTED)
s.shapes.add_picture("hakatons/logo.png", Inches(11.2), Inches(0.55), Inches(1.45))
cards = [("Cilvēkiem", ["Nodod sašķirotus gružus bez maksas",
                        "Par koksni: nauda",
                        "Par betonu un ķieģeļiem: punkti vai šķembas"]),
         ("Uzņēmumiem", ["Tīrs, sašķirots materiāls",
                         "Bez šķirošanas izmaksām",
                         "Lētāka izejviela nekā jauna"]),
         ("Videi", ["Mazāk izgāztuvju mežos",
                    "Mazāk jaunu izejvielu ieguves",
                    "Pašvaldība ietaupa uz sakopšanu"])]
for i, (h, items) in enumerate(cards):
    x = 0.7 + i * 4.05
    rect(s, x, 3.0, 3.8, 3.8, CARD, MSO_SHAPE.ROUNDED_RECTANGLE)
    rect(s, x, 3.0, 3.8, 0.12, MID)
    text(s, x + 0.35, 3.4, 3.1, 0.6, h, size=24, color=DARK, font=HEAD, bold=True)
    text(s, x + 0.35, 4.2, 3.1, 2.5, [("•  " + t, {"after": 12}) for t in items], size=16)
notes(s, '0:30. Mūsu risinājums ir Būvgružu birža, aprites ekonomikas platforma, kas savieno cilvēkus, kuriem ir būvgruži, ar uzņēmumiem, kas tos pārstrādā. Princips kā pudeļu depozītam: nodod un saņem. Cilvēks nodod gružus bez maksas un saņem atlīdzību: par koksni naudu, par betonu punktus. Uzņēmumiem: tīrs materiāls bez šķirošanas izmaksām. Videi: mazāk izgāztuvju mežos un mazāk jaunu izejvielu ieguves.')

# 3 · Lietotāja ceļš
s = prs.slides.add_slide(BLANK)
bg(s, LIGHT)
kicker(s, 0.7, 0.6, "Lietotāja pieredze")
text(s, 0.7, 1.0, 5.2, 0.9, "Lietotāja ceļš", size=40, color=DARK, font=HEAD, bold=True)
text(s, 0.7, 1.75, 5.2, 0.5, "Bez reģistrācijas, dažos klikšķos", size=17, color=MUTED)
steps = [("Izvēlas materiālu", "Koksne, betons, ķieģeļi, grants"),
         ("Uzreiz redz atlīdzību", "Pēc svara, kvalitātes un pilsētas"),
         ("Izvēlas punktu kartē", "Tuvākie punkti ar attālumu un cenu"),
         ("Atved vai piesaka savākšanu", "Uzņēmums atbrauc pats")]
rect(s, 0.5, 2.55 + 1.08 - 0.14, 5.25, 1.03, PALE, MSO_SHAPE.ROUNDED_RECTANGLE)
text(s, 3.6, 2.55 + 1.08 - 0.07, 2.05, 0.3, "GALVENĀ FUNKCIJA", size=9, color=DARK, font=HEAD,
     bold=True, align=PP_ALIGN.RIGHT)
for i, (h, sub) in enumerate(steps):
    y = 2.55 + i * 1.08
    rect(s, 0.7, y, 0.75, 0.75, DARK, MSO_SHAPE.OVAL)
    text(s, 0.7, y, 0.75, 0.75, str(i + 1), size=22, color=WHITE, font=HEAD, bold=True,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(s, 1.7, y + 0.02, 4.0, 0.5, h, size=19, color=INK, font=HEAD, bold=True)
    text(s, 1.7, y + 0.42, 4.0, 0.4, sub, size=13, color=MUTED)
rect(s, 6.05, 1.55, 6.9, 4.5, DARK, MSO_SHAPE.ROUNDED_RECTANGLE)
s.shapes.add_movie("hakatons/demo-video.mp4", Inches(6.2), Inches(1.7), Inches(6.6), Inches(4.125),
                   poster_frame_image="hakatons/demo-poster.png", mime_type="video/mp4")
text(s, 6.05, 6.15, 6.9, 0.3, "Prototips · demo dati", size=10, color=MUTED, align=PP_ALIGN.RIGHT)
notes(s, "0:15. Paskatīsimies ar lietotāja acīm. Izvēlies materiālu, ieraksti svaru un pilsētu, un uzreiz redzi, "
         "cik saņemsi un kur ir tuvākais punkts. Bez reģistrācijas. Parādīšu."
         "\n\n[VIDEO ~33 s, Gustavs komentē: Izvēlos būvkoksni, 300 kilogrami, Jelgava. Uzreiz redzu: "
         "4 eiro, tuvākais punkts Jelgavā. Kartē redzu, kur tas ir. Ja nevaru atvest pats, piesaku savākšanu: "
         "materiāls, daudzums, pilsēta, kontakts. Nosūtīts, un uzņēmums atbrauks pats.]")

# 4 · Kāpēc tieši mūsu risinājums
s = prs.slides.add_slide(BLANK)
bg(s, LIGHT)
kicker(s, 0.7, 0.6, "Kāpēc tieši mūsu risinājums")
text(s, 0.7, 1.0, 12, 0.9, "Iespējas šodien", size=40, color=DARK, font=HEAD, bold=True)
cols = ["Bez maksas", "Ērti", "Atlīdzība", "Nonāk pārstrādē"]
rows = [("Sludinājums „izvedam lēti”", ["Lēti", "Jā", "Nē", "Bieži mežā"]),
        ("Konteinera noma", ["Dārgi", "Jā", "Nē", "Jā"]),
        ("Šķirošanas laukums", ["Daļēji", "Jāved pašam", "Nē", "Jā"]),
        ("CleanR apmaiņas punkts", ["Jā", "Viens punkts", "Šķembas", "Jā"]),
        ("Būvgružu birža", ["Jā", "Karte + pārvadātājs", "Jā", "Jā"])]
GOOD = {"Jā", "Karte + pārvadātājs"}
BAD = {"Nē", "Dārgi", "Bieži mežā"}
cx = [4.3, 6.4, 8.75, 10.6]
for j, c in enumerate(cols):
    text(s, cx[j], 2.05, 2.1, 0.35, c, size=13, color=MUTED, font=HEAD, bold=True)
for i, (name, vals) in enumerate(rows):
    y = 2.45 + i * 0.74
    ours = i == len(rows) - 1
    rect(s, 0.7, y, 11.95, 0.62, DARK if ours else CARD, MSO_SHAPE.ROUNDED_RECTANGLE)
    text(s, 0.95, y, 3.3, 0.62, name, size=16, color=WHITE if ours else INK, font=HEAD, bold=True,
         anchor=MSO_ANCHOR.MIDDLE)
    for j, v in enumerate(vals):
        col = WHITE if ours else (MID if v in GOOD else RGBColor(0xB0, 0x4A, 0x3A) if v in BAD else MUTED)
        text(s, cx[j], y, 2.2, 0.62, v, size=15, color=col, bold=v in GOOD | BAD or ours,
             anchor=MSO_ANCHOR.MIDDLE)
text(s, 0.7, 6.3, 11.95, 0.3, "Atlīdzība pēc pārstrādātāju cenām: koksne 15 līdz 30 €/t, betons 1 līdz 3 €/t, "
     "ķieģeļi 0,5 līdz 1,5 €/t (aplēses, jāpārbauda pilotprojektā).", size=11, color=MUTED)
notes(s, "0:35. Šodien cilvēkam ir četras iespējas. Sludinājums: lēti, bet gruži bieži nonāk mežā. Konteiners: legāli, bet dārgi. Šķirošanas laukums: jāved pašam, un nekas par to netiek. CleanR apmaiņas punkts Stopiņos jau pieņem tīrus būvgružus bez maksas un dod šķembas, bet tas ir viens punkts, un par to maz kurš zina. Būvgružu birža savieno šādus punktus vienā kartē. Un galvenais: lietotne uzreiz parāda, cik saņemsi un kur ir tuvākais punkts.")

# 5 · Noslēgums
s = prs.slides.add_slide(BLANK)
bg(s, DARK)
s.shapes.add_picture("hakatons/logo.png", Inches(5.92), Inches(0.7), Inches(1.5))
text(s, 0.7, 2.5, 11.9, 2.0, "Lai būvgruži atgrieztos būvniecībā, nevis mežā",
     size=44, color=WHITE, font=HEAD, bold=True, align=PP_ALIGN.CENTER, spacing=1.0)
text(s, 0.7, 4.55, 11.9, 0.7, "Būvgružu birža", size=28, color=PALE, font=HEAD, bold=True,
     align=PP_ALIGN.CENTER)
text(s, 0.7, 5.2, 11.9, 0.5, "Komanda Alanguka", size=18, color=PALE, align=PP_ALIGN.CENTER)
text(s, 0.7, 6.3, 11.9, 0.6, "Paldies! Jautājumi?", size=22, color=WHITE, align=PP_ALIGN.CENTER)
notes(s, '0:10. Būvgružu birža. Lai būvgruži atgrieztos būvniecībā, nevis mežā. Paldies! Labprāt atbildēsim uz jautājumiem.')

# 6 · Avoti (pielikums, netiek prezentēts)
s = prs.slides.add_slide(BLANK)
bg(s, LIGHT)
kicker(s, 0.7, 0.45, "Pielikums")
text(s, 0.7, 0.75, 12, 0.6, "Avoti", size=26, color=DARK, font=HEAD, bold=True)
src = [l.strip() for l in open("hakatons/avoti.txt", encoding="utf-8") if l.strip()]
per = -(-len(src) // 3)
for c in range(3):
    chunk = src[c * per:(c + 1) * per]
    text(s, 0.7 + c * 4.05, 1.5, 3.85, 5.8,
         [(f"{c * per + i + 1}. {t}", {"after": 4}) for i, t in enumerate(chunk)],
         size=7.5, color=INK, spacing=1.0)
notes(s, "Pielikums. Netiek rādīts prezentācijas laikā; atvērt tikai, ja žūrija jautā par avotiem.")

prs.save("hakatons/buvgruzu-birza.pptx")
