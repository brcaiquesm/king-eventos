import cv2, numpy as np
SRC='/home/claude/src/'; OUT='/home/claude/king-eventos/img/fotos/'
P=lambda pts,w,h: np.array([[int(x/100*w),int(y/100*h)] for x,y in pts],np.int32)

def rect(m,w,h,x0,y0,x1,y1): cv2.rectangle(m,(int(x0/100*w),int(y0/100*h)),(int(x1/100*w),int(y1/100*h)),255,-1)
def poly(m,w,h,pts): cv2.fillPoly(m,[P(pts,w,h)],255)
def line(m,w,h,pts,t): cv2.polylines(m,[P(pts,w,h)],False,255,t)

def dark_in(img,w,h,roi,thr=70,grow=7,smax=256):
    r=np.zeros((h,w),np.uint8); poly(r,w,h,roi)
    hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV); v=hsv[...,2]
    m=((v<thr)&(hsv[...,1]<smax)&(r>0)).astype(np.uint8)*255
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    return cv2.dilate(m,np.ones((grow,grow),np.uint8))

def inpaint(img,m,r=9):
    if m.max()==0: return img
    m=cv2.dilate(m,np.ones((5,5),np.uint8))
    return cv2.inpaint(img,m,r,cv2.INPAINT_TELEA)

def burn(img,w,h,cx,cy,rx,ry,amt):
    yy,xx=np.mgrid[0:h,0:w]; d=((xx-cx/100*w)/(rx/100*w))**2+((yy-cy/100*h)/(ry/100*h))**2
    f=1-amt*np.clip(1-d,0,1)**1.5
    return (img*f[...,None]).astype(np.uint8)

def grade(img,night,spot=None,sky=0):
    h,w=img.shape[:2]
    if night: img=cv2.fastNlMeansDenoisingColored(img,None,5,5,7,21)
    f=img.astype(np.float32)/255
    if not night:  # balanço de branco suave
        m=f.reshape(-1,3).mean(0); f=f*(0.65+0.35*m.mean()/m)
    # clareza (contraste local)
    L=cv2.cvtColor(np.clip(f,0,1),cv2.COLOR_BGR2LAB)
    l=L[...,0]/100; bl=cv2.GaussianBlur(l,(0,0),max(w,h)/60)
    l=np.clip(l+0.35*(l-bl),0,1)
    # curva em S + preto mais profundo
    l=np.clip((l-0.03)/0.97,0,1); l=l+0.18*(l-0.5)*(1-np.abs(2*l-1))*2*0.5
    if night: l=np.clip(l**0.9,0,1)
    L[...,0]=np.clip(l,0,1)*100
    f=cv2.cvtColor(L,cv2.COLOR_LAB2BGR)
    # vibrance
    hsv=cv2.cvtColor(np.clip(f,0,1),cv2.COLOR_BGR2HSV); s=hsv[...,1]
    hsv[...,1]=np.clip(s+0.35*s*(1-s),0,1); f=cv2.cvtColor(hsv,cv2.COLOR_HSV2BGR)
    # split tone: sombras levemente frias, luzes douradas
    lum=f.mean(2,keepdims=True)
    hi=np.clip((lum-0.55)/0.45,0,1); lo=np.clip((0.4-lum)/0.4,0,1)
    f=f+hi*np.array([-0.035,0.005,0.04])+lo*np.array([0.025,0.01,-0.015])
    # céu mais intenso (gradiente graduado no topo)
    if sky:
        g=np.clip(1-np.linspace(0,1,h)/(sky/100),0,1)[:,None,None]
        f=f*(1-0.22*g)
    # luz de destaque
    yy,xx=np.mgrid[0:h,0:w]
    if spot:
        cx,cy,r,a=spot; d=np.sqrt(((xx-cx/100*w)/(w))**2+((yy-cy/100*h)/(h))**2)/(r/100)
        f=f*(1+a*np.clip(1-d,0,1)[...,None]**2)
    # vinheta
    d=np.sqrt(((xx-w/2)/(w/2))**2+((yy-h/2)/(h/2))**2)/1.414
    f=f*(1-0.38*np.clip(d-0.35,0,1)[...,None]**1.6/0.42)
    img=(np.clip(f,0,1)*255).astype(np.uint8)
    bl=cv2.GaussianBlur(img,(0,0),1.2); img=cv2.addWeighted(img,1.5,bl,-.5,0)
    return grain(img,4)

def crop(img,x0,y0,x1,y1):
    h,w=img.shape[:2]; return img[int(y0*h):int(y1*h),int(x0*w):int(x1*w)]

def job(name,src,c,night,clean=None,post=None,spot=None,sky=0):
    im=crop(cv2.imread(SRC+src+'.jpg'),*c); h,w=im.shape[:2]
    before=im.copy()
    if clean: im=clean(im,w,h)
    if post: im=crop(im,*post); before=crop(before,*post)
    im=grade(im,night,spot,sky)
    H,W=im.shape[:2]; sc=min(1,1600/max(H,W))
    if sc<1: im=cv2.resize(im,(int(W*sc),int(H*sc)),interpolation=cv2.INTER_AREA); before=cv2.resize(before,(int(W*sc),int(H*sc)))
    cv2.imwrite(OUT+name+'.webp',im,[cv2.IMWRITE_WEBP_QUALITY,82])
    cv2.imwrite(f'/tmp/b2_{name}_b.jpg',before); cv2.imwrite(f'/tmp/b2_{name}_a.jpg',im)
    print(name,im.shape[1],im.shape[0])



def clone(img,w,h,x0,y0,x1,y1,dx,dy=0):
    X0,Y0,X1,Y1=[int(v/100*s) for v,s in [(x0,w),(y0,h),(x1,w),(y1,h)]]
    DX,DY=int(dx/100*w),int(dy/100*h)
    src=img[Y0+DY:Y1+DY, X0+DX:X1+DX].copy()
    out=img.copy(); out[Y0:Y1,X0:X1]=src
    # costura suave
    m=np.zeros((h,w),np.float32); m[Y0:Y1,X0:X1]=1
    k=max(5,int(min(X1-X0,Y1-Y0)*.25))|1
    m=cv2.GaussianBlur(m,(k,k),0)[...,None]
    return (out*m+img*(1-m)).astype(np.uint8)

def grain(img,amt=5):
    n=np.random.default_rng(7).normal(0,amt,img.shape[:2]).astype(np.float32)[...,None]
    return np.clip(img.astype(np.float32)+n,0,255).astype(np.uint8)

def lowsat_bright(img,w,h,roi,smax=60,vmin=110,grow=7):
    r=np.zeros((h,w),np.uint8); poly(r,w,h,roi)
    hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)
    m=((hsv[...,1]<smax)&(hsv[...,2]>vmin)&(r>0)).astype(np.uint8)*255
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    return cv2.dilate(m,np.ones((grow,grow),np.uint8))

def c_hero(im,w,h):
    m=np.zeros((h,w),np.uint8)
    rect(m,w,h,61.8,36.5,65.6,73.5)     # escada
    rect(m,w,h,43.8,68,47.2,76.5)       # tábuas
    rect(m,w,h,61,71.5,71,75.5)         # entulho no deck
    im=inpaint(im,m,7)
    im=burn(im,w,h,90,63,16,17,.95)     # carro e moto
    im=burn(im,w,h,82,70,7,6,.7)
    im=burn(im,w,h,40,93,26,11,.45)
    return im
def c_cozinha(im,w,h):
    im=clone(im,w,h,42.5,76.5,50.5,84.5,-9)      # pano azul <- bancada à esquerda
    im=clone(im,w,h,30.5,70.5,38.5,82.5,9)       # balde e potes <- direita
    im=clone(im,w,h,40.3,77.5,43.3,84.5,17)
    im=clone(im,w,h,17,74,23.5,80.5,0,-6)        # sacola <- acima (backsplash)
    im=clone(im,w,h,22.5,80.5,27,88,6)           # garrafas
    im=clone(im,w,h,55.3,77,58,82,4)
    im=clone(im,w,h,74.5,70.5,83,75.5,-10)       # lixeira roxa e potes
    m=np.zeros((h,w),np.uint8)
    line(m,w,h,[(52.3,75),(55,100)],int(w*.011)); line(m,w,h,[(86.2,70),(88.6,100)],int(w*.011))
    return inpaint(im,m,7)
def c_salao(im,w,h):
    m=np.zeros((h,w),np.uint8)
    rect(m,w,h,72.5,46,82.2,71)          # saco preto + reflexo
    rect(m,w,h,47.6,42,55,65)            # lixeira + reflexo
    rect(m,w,h,0,49,6.5,70)              # cadeira
    rect(m,w,h,21.2,39.5,24.8,50.5)      # escada
    return inpaint(im,m,15)
def c_mural(im,w,h):
    m=np.zeros((h,w),np.uint8); rect(m,w,h,16,25,27,31)
    return inpaint(im,m,9)
def c_play(im,w,h):
    m=dark_in(im,w,h,[(0,48),(58,48),(80,100),(0,100)],thr=55,grow=9)
    rect(m,w,h,67,88,70,93)
    return inpaint(im,m,9)
def c_corredor(im,w,h):
    m=dark_in(im,w,h,[(24,73),(30,73),(22,100),(9,100)],thr=90,grow=11)
    return inpaint(im,m,9)
def c_campinho(im,w,h):
    m=np.zeros((h,w),np.uint8); t=int(w*.014)
    line(m,w,h,[(61,62),(57,65),(54,69),(52,73),(48,78),(42,82),(37,87),(30,93),(22,100)],t)
    line(m,w,h,[(52,72.7),(58,72.4),(63,73.4),(65,75.8),(64.4,80.5),(62.8,87),(61,93.8),(60,100)],t)
    m|=lowsat_bright(im,w,h,[(0,64),(38,64),(38,71),(0,82)],smax=45,vmin=120,grow=9)
    return inpaint(im,m,9)
def c_noite(im,w,h):
    m=np.zeros((h,w),np.uint8)
    rect(m,w,h,38,29,58,36); rect(m,w,h,63,3,70,30)
    return inpaint(im,m,9)

job('hero-noite','f29',(0,0,.68,1),True,c_hero,spot=(55,45,45,.18))
job('fachada','f10',(0,.04,1,.76),False,post=(0,0,1,.77),spot=(55,45,40,.12),sky=40)
job('sinuca','f08',(0,.08,1,.80),False,post=(.2,.12,1,1),spot=(52,45,45,.22))
job('piscina-mural','f18',(0,.14,1,1),False,c_mural,spot=(50,55,50,.12),sky=20)
job('cozinha','f07',(.04,.18,1,.60),False,c_cozinha,post=(0,0,1,.93),spot=(55,55,45,.12))
job('salao','f22',(0,.18,1,.78),False,c_salao,spot=(60,45,50,.1))
job('playground','f17',(0,.28,1,.80),False,c_play,spot=(68,45,35,.15),sky=20)
job('corredor','f11',(0,.18,1,.88),False,c_corredor,post=(0,0,.9,1),spot=(55,35,40,.12),sky=25)
job('campinho','f33',(0,.08,1,.74),False,c_campinho,spot=(50,55,40,.1),sky=40)
job('piscina-noite','f30',(0,.30,.70,.95),True,c_noite,post=(0,0,.86,1),spot=(40,55,45,.15))
job('piscina-deck','f26',(0,.22,1,.95),False,post=(.2,0,1,1),spot=(65,45,45,.12),sky=15)
job('piscina-fachada','f34',(0,.30,1,.82),False,spot=(45,35,45,.12),sky=12)
