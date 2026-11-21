import cv2, numpy as np
src=cv2.imread('/mnt/user-data/uploads/87c95a8f-image.png')[85:695,130:1372].copy()
src[0:230,1160:]=0
src=cv2.fastNlMeansDenoisingColored(src,None,3,3,7,21)
h,w=src.shape[:2]; S=6; OW,OH=w*2,h*2
v=src.max(2).astype(np.float32)
hsv=cv2.cvtColor(src,cv2.COLOR_BGR2HSV); sat=hsv[...,1].astype(np.float32)
# máscara nítida
vu=cv2.resize(v,(w*S,h*S),interpolation=cv2.INTER_CUBIC); vu=cv2.GaussianBlur(vu,(0,0),S*0.45)
m=(vu>90).astype(np.float32); m=(cv2.GaussianBlur(m,(0,0),S*0.35)>0.5).astype(np.uint8)
n,lab,st,_=cv2.connectedComponentsWithStats(m); keep=np.zeros_like(m)
for i in range(1,n):
    if st[i,4]>S*S*60: keep[lab==i]=1
alpha=cv2.resize(keep.astype(np.float32),(OW,OH),interpolation=cv2.INTER_AREA)
# zona do texto EVENTOS (branco)
wy0,wx0,wx1=505,330,910
yy,xx=np.mgrid[0:h,0:w]
white_zone=(yy>wy0)&(xx>wx0)&(xx<wx1)
def row_profile(sel):
    prof=np.full((h,3),np.nan,np.float32)
    for y in range(h):
        p=src[y][sel[y]]
        if len(p)>=4: prof[y]=np.median(p,0)
    ok=~np.isnan(prof[:,0]); ys=np.arange(h)
    for c in range(3): prof[:,c]=np.interp(ys,ys[ok],prof[ok,c])
    return cv2.GaussianBlur(prof[:,None,:],(1,0),sigmaX=0,sigmaY=2.5)[:,0,:]
gold=row_profile((v>150)&(sat>110)&~white_zone)
white=row_profile((v>170)&(sat<80)&white_zone)
# variação horizontal suave do brilho (reflexo metálico), tirada do original
lum=np.where((v>150)&(sat>110)&~white_zone, v, np.nan)
col=np.empty((h,w,3),np.float32)
col[:]=gold[:,None,:]
col[white_zone]=np.broadcast_to(white[:,None,:],(h,w,3))[white_zone]
# leve textura do original por dentro (mantém o brilho/realce), só onde é sólido
inner=((v>150)&(((sat>110)&~white_zone)|((sat<80)&white_zone))).astype(np.float32)
inner=cv2.erode(inner,np.ones((3,3),np.uint8))
inner=cv2.GaussianBlur(inner,(0,0),1.0)[...,None]
col=col*(1-inner*0.35)+src.astype(np.float32)*(inner*0.6)
col=cv2.resize(col,(OW,OH),interpolation=cv2.INTER_CUBIC)
col=np.clip(col,0,255)
rgba=np.dstack([col,alpha*255]).astype(np.uint8)
cv2.imwrite('/home/claude/king-eventos/img/logo-king-eventos.webp',rgba,[cv2.IMWRITE_WEBP_QUALITY,95])
blk=np.clip(col*alpha[...,None],0,255).astype(np.uint8)
cv2.imwrite('/home/claude/king-eventos/img/logo-king-eventos.png',blk)
o=cv2.resize(src,(OW,OH),interpolation=cv2.INTER_CUBIC)
z=lambda im: im[260:860,120:1300]
cv2.imwrite('/home/claude/zz.png',np.vstack([z(o),np.full((10,1180,3),255,np.uint8),z(blk)]))
cv2.imwrite('/home/claude/logo_full2.png',cv2.resize(blk,(1242,610),interpolation=cv2.INTER_AREA))
