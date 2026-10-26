from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = 7087 / 1080
W, H = 7087, 10630
SOURCE = "assets/yiranji-office-yoga-dance-poster-address-corrected-v24.png"
BACKGROUND = "assets/yiranji-60x90cm-background-v1.png"
OUTPUT = "assets/yiranji-60x90cm-soft-type-print-v32.png"
FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_MEDIUM = "/System/Library/Fonts/Supplemental/Songti.ttc"


def px(value):
    return round(value * S)


def font(path, size):
    return ImageFont.truetype(path, px(size))


source = Image.open(SOURCE).convert("RGB")
image = Image.open(BACKGROUND).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
draw = ImageDraw.Draw(image)

dark = (25, 43, 30)
olive = (79, 87, 55)
rose = (207, 105, 99)
black = (25, 28, 25)
white = (250, 248, 242)

# Headline.
draw.text((px(65), px(185)), "午休不出楼，", font=font(FONT_MEDIUM, 75), fill=dark)
draw.text((px(65), px(286)), "下班不绕路", font=font(FONT_MEDIUM, 75), fill=dark)
draw.text((px(66), px(407)), "50", font=font(FONT_MEDIUM, 58), fill=rose)
draw.text((px(148), px(421)), "分钟，松开久坐肩颈", font=font(FONT, 36), fill=black)

# Address bar.
draw.rounded_rectangle((px(66), px(535), px(610), px(606)), radius=px(35), fill=olive)
draw.ellipse((px(91), px(551), px(118), px(584)), fill=white)
draw.ellipse((px(99), px(559), px(110), px(570)), fill=olive)
draw.polygon([(px(104), px(592)), (px(94), px(575)), (px(114), px(575))], fill=white)
draw.text((px(144), px(548)), "闻都世界城 17F 1405", font=font(FONT, 31), fill=white)
draw.text((px(67), px(625)), "楼内上班族｜隔壁楼步行可达", font=font(FONT, 29), fill=black)

# Pricing.
draw.text((px(65), px(722)), "不办卡｜按次付费", font=font(FONT_MEDIUM, 52), fill=dark)
draw.text((px(68), px(825)), "单次", font=font(FONT_MEDIUM, 40), fill=black)
draw.text((px(198), px(818)), "¥39.9", font=font(FONT, 66), fill=rose)
draw.rounded_rectangle((px(65), px(930), px(620), px(1005)), radius=px(20), fill=rose)
draw.text((px(95), px(945)), "新用户首次体验  ¥19.9", font=font(FONT, 33), fill=white)


def class_card(y, icon, main, detail):
    draw.rounded_rectangle(
        (px(65), px(y), px(635), px(y + 93)),
        radius=px(18),
        fill=(255, 253, 249),
        outline=(226, 218, 205),
        width=px(2),
    )
    fill = (194, 119, 109) if icon == "午" else olive
    draw.ellipse((px(86), px(y + 22), px(137), px(y + 73)), fill=fill)
    draw.text((px(99), px(y + 27)), icon, font=font(FONT_MEDIUM, 22), fill=white)
    draw.text((px(160), px(y + 20)), main, font=font(FONT, 25), fill=black)
    draw.line((px(425), px(y + 17), px(425), px(y + 77)), fill=rose, width=px(3))
    draw.multiline_text((px(446), px(y + 17)), detail, font=font(FONT, 15), fill=black, spacing=px(3))


class_card(1054, "午", "午间 12:15–13:05", "肩颈舒缓 · 脊柱放松\n呼吸")
class_card(1162, "晚", "晚间 18:10–19:10", "瑜伽 · 舞蹈")

# Booking rules.
draw.ellipse((px(71), px(1304), px(128), px(1361)), fill=olive)
draw.text((px(83), px(1313)), "预", font=font(FONT, 25), fill=white)
draw.text((px(150), px(1309)), "首次到店新用户专享｜需提前预约", font=font(FONT, 27), fill=black)
draw.line((px(280), px(1404), px(610), px(1404)), fill=(208, 199, 188), width=px(2))
draw.text((px(280), px(1422)), "预约制｜5人成班", font=font(FONT, 25), fill=black)
draw.text((px(280), px(1462)), "每班限8人", font=font(FONT, 25), fill=black)

# QR remains pixel-perfect from the supplied card.
qr = source.crop((710, 1365, 930, 1585)).resize((px(180), px(180)), Image.Resampling.NEAREST)
image.paste(qr, (px(65), px(1372)))
image.save(OUTPUT, dpi=(300, 300), compress_level=6)
print(image.size)
