import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
import numpy as np, potrace
from PIL import Image, ImageFilter
SRC=ROOT + '/demos/lotes-spots/img/panda/logo-bare@3x.webp'
im=Image.open(SRC).convert('RGBA')
im=im.resize((im.width*2, im.height*2), Image.LANCZOS)
a=np.array(im).astype(float); r,g,b,al=[a[...,i] for i in range(4)]
mx=np.maximum(np.maximum(r,g),b); mn=np.minimum(np.minimum(r,g),b)
H,W=r.shape
# classify tube cores by hue, keeping only the bright core of each tube (not its glow)
import colorsys
hsv=np.array(Image.fromarray(a[...,:3].astype('uint8')).convert('HSV')).astype(float)
hue=hsv[...,0]*360/255; sat=hsv[...,1]/255; val=hsv[...,2]/255
core=(al>120)&(val>0.62)
white=core&(sat<0.28)
red=(al>120)&(sat>=0.5)&((hue<11)|(hue>335))&(val>0.5)
orange=core&(sat>=0.35)&(hue>=18)&(hue<62)&(val>0.88)
green=core&(sat>=0.3)&(hue>=75)&(hue<170)
yy,xx=np.mgrid[0:H,0:W]
box=(xx>W*0.70)&(yy>H*0.34)&(yy<H*0.64)
red_any=red.copy()
red=red_any&~box                                   # mouth stays a filled shape
region=(al>120)&box&(sat>=0.5)&((hue<14)|(hue>335))&(val>0.42)
rimg=Image.fromarray((region*255).astype('uint8')).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))  # close gaps
region=np.array(rimg)>127
inner=np.array(rimg.filter(ImageFilter.MinFilter(15)))>127
box_line=region&~inner                               # an even tube along the cup's edge
box_fill=inner                                       # dim red glass inside
layers={'white':(white,'#fffaf2'),'orange':(orange,'#ff9b1a'),'red':(red,'#ff4040'),'green':(green,'#45e04a')}
def path_d(mask):
    m=Image.fromarray((mask*255).astype('uint8')).filter(ImageFilter.MedianFilter(5))
    bm=potrace.Bitmap(np.array(m)<=127)
    plist=bm.trace(turdsize=20, alphamax=1.1, opticurve=True, opttolerance=0.3)
    parts=[]
    for c in plist:
        s=c.start_point; seg=[f"M{s.x:.1f},{s.y:.1f}"]
        for sg in c.segments:
            if sg.is_corner: seg.append(f"L{sg.c.x:.1f},{sg.c.y:.1f}L{sg.end_point.x:.1f},{sg.end_point.y:.1f}")
            else: seg.append(f"C{sg.c1.x:.1f},{sg.c1.y:.1f} {sg.c2.x:.1f},{sg.c2.y:.1f} {sg.end_point.x:.1f},{sg.end_point.y:.1f}")
        parts.append(''.join(seg)+'Z')
    return ''.join(parts)
out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">']
# Fries cup drawn by hand as clean neon tubes (the source is too small to trace it cleanly).
CUP_FILL='<path class="cup-fill" fill="#d2202e" opacity="0.32" d="M957,505 C975,530 1000,548 1050,562 C1100,570 1150,556 1185,547 L1132,640 L1062,745 L996,740 L960,600 Z"/>'
CUP_LINE=('<g class="cup" fill="none" stroke="#ff4a4a" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">'
  '<path d="M957,505 C975,530 1000,548 1050,562 C1100,570 1150,556 1185,547"/>'
  '<path d="M957,505 L960,600"/>'
  '<path d="M1185,547 L1132,640"/>'
  '<path d="M993,712 C989,724 992,736 1004,740 L1052,745"/>'
  '</g>')
out.append(CUP_FILL)
for name,(mask,col) in layers.items():
    print(name, int(mask.sum()))
    op=' opacity="0.38"' if name=='box_fill' else ''
    out.append(f'<path class="{name}" fill="{col}"{op} fill-rule="evenodd" d="{path_d(mask)}"/>')
out.append(CUP_LINE)
out.append('</svg>')
svg=''.join(out)
open(ROOT + '/demos/lotes-spots/img/panda/logo.svg','w').write(svg)
print('bytes', len(svg), 'size', W, H)
