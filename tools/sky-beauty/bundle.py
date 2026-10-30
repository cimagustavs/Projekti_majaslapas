# Inline CSS, JS and images into one HTML file that opens anywhere.
import base64, re, sys, pathlib
src = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2])
html = (src / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (src / 'style.css').read_text() + '\n</style>')
for js in ('hair.js', 'script.js', 'heroes.js'):
    html = html.replace(f'<script src="{js}"></script>', '<script>\n' + (src / js).read_text() + '\n</script>')
def data(m):
    p = src / m.group(1)
    return 'src="data:image/webp;base64,' + base64.b64encode(p.read_bytes()).decode() + '"'
html = re.sub(r'src="(img/[^"]+\.webp)"', data, html)
html = html.replace(' loading="lazy"', '')
if len(sys.argv) > 3:
    html = html.replace('<html lang="lv">', f'<html lang="lv" data-hero="{sys.argv[3]}">', 1)
out.parent.mkdir(parents=True, exist_ok=True); out.write_text(html)
print(out, len(html) // 1024, 'KB')
