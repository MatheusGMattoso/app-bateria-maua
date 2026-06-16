from PIL import Image, ImageDraw
import os

OUT = r"c:\Users\arthu\OneDrive\Documentos\Trabalho\Novera\app-bateria-maua\mobile\scripts\_pdf_out"
IMG = r"c:\Users\arthu\OneDrive\Documentos\Trabalho\Novera\app-bateria-maua\mobile\assets\images"
os.makedirs(IMG, exist_ok=True)

RED = (170, 0, 1, 255)  # #AA0001 — campo de cor aprovado para a logo no manual

def trim(im):
    im = im.convert("RGBA")
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im

def circle_mask(im):
    # A logo colorida vem com um quadrado preto opaco atras do emblema circular.
    # Aplicamos uma mascara circular (com leve oversize) para deixar os cantos transparentes.
    im = trim(im).convert("RGBA")
    w, h = im.size
    side = max(w, h)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - w) // 2, (side - h) // 2), im)
    ss = side * 4
    mask = Image.new("L", (ss, ss), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, ss - 1, ss - 1), fill=255)
    mask = mask.resize((side, side), Image.LANCZOS)
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.paste(sq, (0, 0), mask)
    return out

def to_square(im, pad_ratio=0.0):
    im = trim(im)
    w, h = im.size
    side = max(w, h)
    pad = int(side * pad_ratio)
    canvas = Image.new("RGBA", (side + 2 * pad, side + 2 * pad), (0, 0, 0, 0))
    canvas.paste(im, ((canvas.width - w) // 2, (canvas.height - h) // 2), im)
    return canvas

def on_bg(im, color, size, logo_scale=0.82):
    base = Image.new("RGBA", (size, size), color)
    logo = to_square(im)
    target = int(size * logo_scale)
    logo = logo.resize((target, target), Image.LANCZOS)
    off = (size - target) // 2
    base.paste(logo, (off, off), logo)
    return base

colorida = circle_mask(Image.open(os.path.join(OUT, "img_p03_x59_1080x1080.png")))
branca = Image.open(os.path.join(OUT, "img_p06_x72_447x559.png"))

# Logo interna (transparente, recortada)
logo_sq = to_square(colorida)
logo_sq.save(os.path.join(IMG, "logo-bateria-maua.png"))

# Versao branca (fundos escuros)
to_square(branca).save(os.path.join(IMG, "logo-bateria-maua-branca.png"))

# Icone do app (iOS nao suporta transparencia -> fundo vermelho da marca)
on_bg(colorida, RED, 1024).save(os.path.join(IMG, "icon.png"))

# Splash (transparente, com respiro)
to_square(colorida, pad_ratio=0.12).resize((1024, 1024), Image.LANCZOS).save(
    os.path.join(IMG, "splash-icon.png")
)

# Adaptive icon foreground (transparente, dentro da zona segura)
fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
logo = to_square(colorida).resize((int(1024 * 0.68),) * 2, Image.LANCZOS)
off = (1024 - logo.width) // 2
fg.paste(logo, (off, off), logo)
fg.save(os.path.join(IMG, "android-icon-foreground.png"))

# Favicon
on_bg(colorida, RED, 96).save(os.path.join(IMG, "favicon.png"))

print("assets gerados em", IMG)
for f in ["logo-bateria-maua.png", "logo-bateria-maua-branca.png", "icon.png", "splash-icon.png", "android-icon-foreground.png", "favicon.png"]:
    p = os.path.join(IMG, f)
    print(f, Image.open(p).size)
