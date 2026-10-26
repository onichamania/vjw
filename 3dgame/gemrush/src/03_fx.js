// ================= 粒子（煙・火花・光） =================
function mkPS(N,additive){const P=new Float32Array(N*3),V=new Float32Array(N*3),C=new Float32Array(N*3),A=new Float32Array(N),Sz=new Float32Array(N),L=new Float32Array(N),LM=new Float32Array(N),GR=new Float32Array(N);let I=0;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('col',new THREE.BufferAttribute(C,3));g.setAttribute('alpha',new THREE.BufferAttribute(A,1));g.setAttribute('size',new THREE.BufferAttribute(Sz,1));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,uniforms:{scale:{value:500}},
    vertexShader:'attribute float alpha,size;attribute vec3 col;uniform float scale;varying float vA;varying vec3 vC;void main(){vA=alpha;vC=col;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*scale/max(.5,-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying float vA;varying vec3 vC;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);if(d>.5)discard;gl_FragColor=vec4(vC,vA*smoothstep(.5,.15,d));}'});
  const pts=new THREE.Points(g,mat);pts.frustumCulled=false;scene.add(pts);
  return{mat,add(x,y,z,vx,vy,vz,s,col,life,grav){const i=I;I=(I+1)%N;P.set([x,y,z],i*3);V.set([vx,vy,vz],i*3);C.set(col,i*3);A[i]=1;Sz[i]=s;L[i]=0;LM[i]=life;GR[i]=grav||0},
    upd(dt){for(let i=0;i<N;i++){if(A[i]<=0)continue;L[i]+=dt;if(L[i]>=LM[i]){A[i]=0;continue}const k=i*3;V[k+1]-=GR[i]*dt;P[k]+=V[k]*dt;P[k+1]+=V[k+1]*dt;P[k+2]+=V[k+2]*dt;if(P[k+1]<.05){P[k+1]=.05;V[k+1]*=-.3;V[k]*=.7;V[k+2]*=.7}
      V[k]*=1-dt*1.5;V[k+2]*=1-dt*1.5;A[i]=1-L[i]/LM[i]}g.attributes.position.needsUpdate=g.attributes.alpha.needsUpdate=g.attributes.col.needsUpdate=g.attributes.size.needsUpdate=true}}}
const FX=mkPS(900,false),GLOW=mkPS(700,true);
function burst(x,y,z,n,col,spd,size,life,glow){const ps=glow?GLOW:FX;for(let i=0;i<n;i++){const a=rr(0,TAU),v=rr(.3,1)*spd;ps.add(x,y,z,Math.cos(a)*v,rr(.5,1.6)*spd*.5,Math.sin(a)*v,size*rr(.6,1.2),col,life*rr(.6,1),glow?0:6)}}
// 爆発のときに広がる輪
const RINGS=[];{const rg=new THREE.RingGeometry(.8,1,40);rg.rotateX(-Math.PI/2);for(let i=0;i<8;i++){const m=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));m.visible=false;scene.add(m);RINGS.push({m,t:1,T:1,r:1})}}
function ring(x,z,r,col,T){const o=RINGS.find(q=>q.t>=q.T)||RINGS[0];o.t=0;o.T=T||.35;o.r=r;o.m.material.color.setHex(col).convertSRGBToLinear();o.m.position.set(x,.08,z);o.m.visible=true}
function updRings(dt){for(const o of RINGS){if(o.t>=o.T){o.m.visible=false;continue}o.t+=dt;const k=Math.min(1,o.t/o.T);o.m.scale.setScalar(o.r*(.3+.7*k));o.m.material.opacity=(1-k)*.8}}

