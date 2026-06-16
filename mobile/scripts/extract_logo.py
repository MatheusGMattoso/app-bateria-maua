import fitz
import os

PDF = r"c:\Users\arthu\Downloads\MANUAL DE IDENTIDADE - CLUBE DA MANGA.pdf"
OUT = r"c:\Users\arthu\OneDrive\Documentos\Trabalho\Novera\app-bateria-maua\mobile\scripts\_pdf_out"
os.makedirs(OUT, exist_ok=True)

doc = fitz.open(PDF)
print("paginas:", doc.page_count)

# Renderiza cada pagina para PNG (para inspecao visual)
for i, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    pix.save(os.path.join(OUT, f"page_{i+1:02d}.png"))

# Extrai imagens embarcadas
seen = set()
for i, page in enumerate(doc):
    for img in page.get_images(full=True):
        xref = img[0]
        if xref in seen:
            continue
        seen.add(xref)
        base = doc.extract_image(xref)
        ext = base["image"]
        w = base.get("width")
        h = base.get("height")
        fn = os.path.join(OUT, f"img_p{i+1:02d}_x{xref}_{w}x{h}.{base['ext']}")
        with open(fn, "wb") as f:
            f.write(ext)
        print("img", fn, w, h)

print("done")
