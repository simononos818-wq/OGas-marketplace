var qrcodegen,__defProp=Object.defineProperty,__getOwnPropSymbols=Object.getOwnPropertySymbols,__hasOwnProp=Object.prototype.hasOwnProperty,__propIsEnum=Object.prototype.propertyIsEnumerable,__defNormalProp=(e,t,n)=>t in e?__defProp(e,t,{
enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,__spreadValues=(e,t)=>{
for(var n in t||(t={}))__hasOwnProp.call(t,n)&&__defNormalProp(e,n,t[n])
;if(__getOwnPropSymbols)for(var n of __getOwnPropSymbols(t))__propIsEnum.call(t,n)&&__defNormalProp(e,n,t[n]);return e
},__objRest=(e,t)=>{var n={};for(var r in e)__hasOwnProp.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r])
;if(null!=e&&__getOwnPropSymbols)for(var r of __getOwnPropSymbols(e))t.indexOf(r)<0&&__propIsEnum.call(e,r)&&(n[r]=e[r])
;return n};import React from"react";(e=>{const t=class t{constructor(e,n,r,i){if(this.version=e,
this.errorCorrectionLevel=n,
this.modules=[],this.isFunction=[],e<t.MIN_VERSION||e>t.MAX_VERSION)throw new RangeError("Version value out of range")
;if(i<-1||i>7)throw new RangeError("Mask value out of range");this.size=4*e+17;let s=[]
;for(let e=0;e<this.size;e++)s.push(!1);for(let e=0;e<this.size;e++)this.modules.push(s.slice()),
this.isFunction.push(s.slice());this.drawFunctionPatterns();const a=this.addEccAndInterleave(r)
;if(this.drawCodewords(a),-1==i){let e=1e9;for(let t=0;t<8;t++){this.applyMask(t),this.drawFormatBits(t)
;const n=this.getPenaltyScore();n<e&&(i=t,e=n),this.applyMask(t)}}o(0<=i&&i<=7),this.mask=i,this.applyMask(i),
this.drawFormatBits(i),this.isFunction=[]}static encodeText(n,r){const o=e.QrSegment.makeSegments(n)
;return t.encodeSegments(o,r)}static encodeBinary(n,r){const o=e.QrSegment.makeBytes(n);return t.encodeSegments([o],r)}
static encodeSegments(e,r,i=1,a=40,l=-1,c=!0){
if(!(t.MIN_VERSION<=i&&i<=a&&a<=t.MAX_VERSION)||l<-1||l>7)throw new RangeError("Invalid value");let u,h;for(u=i;;u++){
const n=8*t.getNumDataCodewords(u,r),o=s.getTotalBits(e,u);if(o<=n){h=o;break}
if(u>=a)throw new RangeError("Data too long")}
for(const e of[t.Ecc.MEDIUM,t.Ecc.QUARTILE,t.Ecc.HIGH])c&&h<=8*t.getNumDataCodewords(u,e)&&(r=e);let d=[]
;for(const t of e){n(t.mode.modeBits,4,d),n(t.numChars,t.mode.numCharCountBits(u),d)
;for(const e of t.getData())d.push(e)}o(d.length==h);const g=8*t.getNumDataCodewords(u,r);o(d.length<=g),
n(0,Math.min(4,g-d.length),d),n(0,(8-d.length%8)%8,d),o(d.length%8==0);for(let e=236;d.length<g;e^=253)n(e,8,d);let f=[]
;for(;8*f.length<d.length;)f.push(0);return d.forEach((e,t)=>f[t>>>3]|=e<<7-(7&t)),new t(u,r,f,l)}getModule(e,t){
return 0<=e&&e<this.size&&0<=t&&t<this.size&&this.modules[t][e]}getModules(){return this.modules}drawFunctionPatterns(){
for(let e=0;e<this.size;e++)this.setFunctionModule(6,e,e%2==0),this.setFunctionModule(e,6,e%2==0)
;this.drawFinderPattern(3,3),this.drawFinderPattern(this.size-4,3),this.drawFinderPattern(3,this.size-4)
;const e=this.getAlignmentPatternPositions(),t=e.length
;for(let n=0;n<t;n++)for(let r=0;r<t;r++)0==n&&0==r||0==n&&r==t-1||n==t-1&&0==r||this.drawAlignmentPattern(e[n],e[r])
;this.drawFormatBits(0),this.drawVersion()}drawFormatBits(e){const t=this.errorCorrectionLevel.formatBits<<3|e;let n=t
;for(let e=0;e<10;e++)n=n<<1^1335*(n>>>9);const i=21522^(t<<10|n);o(i>>>15==0)
;for(let e=0;e<=5;e++)this.setFunctionModule(8,e,r(i,e));this.setFunctionModule(8,7,r(i,6)),
this.setFunctionModule(8,8,r(i,7)),this.setFunctionModule(7,8,r(i,8))
;for(let e=9;e<15;e++)this.setFunctionModule(14-e,8,r(i,e))
;for(let e=0;e<8;e++)this.setFunctionModule(this.size-1-e,8,r(i,e))
;for(let e=8;e<15;e++)this.setFunctionModule(8,this.size-15+e,r(i,e));this.setFunctionModule(8,this.size-8,!0)}
drawVersion(){if(this.version<7)return;let e=this.version;for(let t=0;t<12;t++)e=e<<1^7973*(e>>>11)
;const t=this.version<<12|e;o(t>>>18==0);for(let e=0;e<18;e++){const n=r(t,e),o=this.size-11+e%3,i=Math.floor(e/3)
;this.setFunctionModule(o,i,n),this.setFunctionModule(i,o,n)}}drawFinderPattern(e,t){
for(let n=-4;n<=4;n++)for(let r=-4;r<=4;r++){const o=Math.max(Math.abs(r),Math.abs(n)),i=e+r,s=t+n
;0<=i&&i<this.size&&0<=s&&s<this.size&&this.setFunctionModule(i,s,2!=o&&4!=o)}}drawAlignmentPattern(e,t){
for(let n=-2;n<=2;n++)for(let r=-2;r<=2;r++)this.setFunctionModule(e+r,t+n,1!=Math.max(Math.abs(r),Math.abs(n)))}
setFunctionModule(e,t,n){this.modules[t][e]=n,this.isFunction[t][e]=!0}addEccAndInterleave(e){
const n=this.version,r=this.errorCorrectionLevel
;if(e.length!=t.getNumDataCodewords(n,r))throw new RangeError("Invalid argument")
;const i=t.NUM_ERROR_CORRECTION_BLOCKS[r.ordinal][n],s=t.ECC_CODEWORDS_PER_BLOCK[r.ordinal][n],a=Math.floor(t.getNumRawDataModules(n)/8),l=i-a%i,c=Math.floor(a/i)
;let u=[];const h=t.reedSolomonComputeDivisor(s);for(let n=0,r=0;n<i;n++){let o=e.slice(r,r+c-s+(n<l?0:1));r+=o.length
;const i=t.reedSolomonComputeRemainder(o,h);n<l&&o.push(0),u.push(o.concat(i))}let d=[]
;for(let e=0;e<u[0].length;e++)u.forEach((t,n)=>{(e!=c-s||n>=l)&&d.push(t[e])});return o(d.length==a),d}
drawCodewords(e){
if(e.length!=Math.floor(t.getNumRawDataModules(this.version)/8))throw new RangeError("Invalid argument");let n=0
;for(let t=this.size-1;t>=1;t-=2){6==t&&(t=5);for(let o=0;o<this.size;o++)for(let i=0;i<2;i++){
const s=t-i,a=!(t+1&2)?this.size-1-o:o;!this.isFunction[a][s]&&n<8*e.length&&(this.modules[a][s]=r(e[n>>>3],7-(7&n)),
n++)}}o(n==8*e.length)}applyMask(e){if(e<0||e>7)throw new RangeError("Mask value out of range")
;for(let t=0;t<this.size;t++)for(let n=0;n<this.size;n++){let r;switch(e){case 0:r=(n+t)%2==0;break;case 1:r=t%2==0
;break;case 2:r=n%3==0;break;case 3:r=(n+t)%3==0;break;case 4:r=(Math.floor(n/3)+Math.floor(t/2))%2==0;break;case 5:
r=n*t%2+n*t%3==0;break;case 6:r=(n*t%2+n*t%3)%2==0;break;case 7:r=((n+t)%2+n*t%3)%2==0;break;default:
throw new Error("Unreachable")}!this.isFunction[t][n]&&r&&(this.modules[t][n]=!this.modules[t][n])}}getPenaltyScore(){
let e=0;for(let n=0;n<this.size;n++){let r=!1,o=0,i=[0,0,0,0,0,0,0]
;for(let s=0;s<this.size;s++)this.modules[n][s]==r?(o++,
5==o?e+=t.PENALTY_N1:o>5&&e++):(this.finderPenaltyAddHistory(o,i),
r||(e+=this.finderPenaltyCountPatterns(i)*t.PENALTY_N3),r=this.modules[n][s],o=1)
;e+=this.finderPenaltyTerminateAndCount(r,o,i)*t.PENALTY_N3}for(let n=0;n<this.size;n++){let r=!1,o=0,i=[0,0,0,0,0,0,0]
;for(let s=0;s<this.size;s++)this.modules[s][n]==r?(o++,
5==o?e+=t.PENALTY_N1:o>5&&e++):(this.finderPenaltyAddHistory(o,i),
r||(e+=this.finderPenaltyCountPatterns(i)*t.PENALTY_N3),r=this.modules[s][n],o=1)
;e+=this.finderPenaltyTerminateAndCount(r,o,i)*t.PENALTY_N3}
for(let n=0;n<this.size-1;n++)for(let r=0;r<this.size-1;r++){const o=this.modules[n][r]
;o==this.modules[n][r+1]&&o==this.modules[n+1][r]&&o==this.modules[n+1][r+1]&&(e+=t.PENALTY_N2)}let n=0
;for(const e of this.modules)n=e.reduce((e,t)=>e+(t?1:0),n)
;const r=this.size*this.size,i=Math.ceil(Math.abs(20*n-10*r)/r)-1;return o(0<=i&&i<=9),e+=i*t.PENALTY_N4,
o(0<=e&&e<=2568888),e}getAlignmentPatternPositions(){if(1==this.version)return[];{
const e=Math.floor(this.version/7)+2,t=32==this.version?26:2*Math.ceil((4*this.version+4)/(2*e-2));let n=[6]
;for(let r=this.size-7;n.length<e;r-=t)n.splice(1,0,r);return n}}static getNumRawDataModules(e){
if(e<t.MIN_VERSION||e>t.MAX_VERSION)throw new RangeError("Version number out of range");let n=(16*e+128)*e+64;if(e>=2){
const t=Math.floor(e/7)+2;n-=(25*t-10)*t-55,e>=7&&(n-=36)}return o(208<=n&&n<=29648),n}static getNumDataCodewords(e,n){
return Math.floor(t.getNumRawDataModules(e)/8)-t.ECC_CODEWORDS_PER_BLOCK[n.ordinal][e]*t.NUM_ERROR_CORRECTION_BLOCKS[n.ordinal][e]
}static reedSolomonComputeDivisor(e){if(e<1||e>255)throw new RangeError("Degree out of range");let n=[]
;for(let t=0;t<e-1;t++)n.push(0);n.push(1);let r=1;for(let o=0;o<e;o++){
for(let e=0;e<n.length;e++)n[e]=t.reedSolomonMultiply(n[e],r),e+1<n.length&&(n[e]^=n[e+1]);r=t.reedSolomonMultiply(r,2)}
return n}static reedSolomonComputeRemainder(e,n){let r=n.map(e=>0);for(const o of e){const e=o^r.shift();r.push(0),
n.forEach((n,o)=>r[o]^=t.reedSolomonMultiply(n,e))}return r}static reedSolomonMultiply(e,t){
if(e>>>8!=0||t>>>8!=0)throw new RangeError("Byte out of range");let n=0;for(let r=7;r>=0;r--)n=n<<1^285*(n>>>7),
n^=(t>>>r&1)*e;return o(n>>>8==0),n}finderPenaltyCountPatterns(e){const t=e[1];o(t<=3*this.size)
;const n=t>0&&e[2]==t&&e[3]==3*t&&e[4]==t&&e[5]==t;return(n&&e[0]>=4*t&&e[6]>=t?1:0)+(n&&e[6]>=4*t&&e[0]>=t?1:0)}
finderPenaltyTerminateAndCount(e,t,n){return e&&(this.finderPenaltyAddHistory(t,n),t=0),t+=this.size,
this.finderPenaltyAddHistory(t,n),this.finderPenaltyCountPatterns(n)}finderPenaltyAddHistory(e,t){
0==t[0]&&(e+=this.size),t.pop(),t.unshift(e)}};t.MIN_VERSION=1,t.MAX_VERSION=40,t.PENALTY_N1=3,t.PENALTY_N2=3,
t.PENALTY_N3=40,
t.PENALTY_N4=10,t.ECC_CODEWORDS_PER_BLOCK=[[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],[-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],[-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]],
t.NUM_ERROR_CORRECTION_BLOCKS=[[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],[-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],[-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]]
;function n(e,t,n){if(t<0||t>31||e>>>t!=0)throw new RangeError("Value out of range")
;for(let r=t-1;r>=0;r--)n.push(e>>>r&1)}function r(e,t){return!!(e>>>t&1)}function o(e){
if(!e)throw new Error("Assertion error")}e.QrCode=t;const i=class e{constructor(e,t,n){if(this.mode=e,this.numChars=t,
this.bitData=n,t<0)throw new RangeError("Invalid argument");this.bitData=n.slice()}static makeBytes(t){let r=[]
;for(const e of t)n(e,8,r);return new e(e.Mode.BYTE,t.length,r)}static makeNumeric(t){
if(!e.isNumeric(t))throw new RangeError("String contains non-numeric characters");let r=[];for(let e=0;e<t.length;){
const o=Math.min(t.length-e,3);n(parseInt(t.substring(e,e+o),10),3*o+1,r),e+=o}return new e(e.Mode.NUMERIC,t.length,r)}
static makeAlphanumeric(t){
if(!e.isAlphanumeric(t))throw new RangeError("String contains unencodable characters in alphanumeric mode");let r,o=[]
;for(r=0;r+2<=t.length;r+=2){let i=45*e.ALPHANUMERIC_CHARSET.indexOf(t.charAt(r))
;i+=e.ALPHANUMERIC_CHARSET.indexOf(t.charAt(r+1)),n(i,11,o)}
return r<t.length&&n(e.ALPHANUMERIC_CHARSET.indexOf(t.charAt(r)),6,o),new e(e.Mode.ALPHANUMERIC,t.length,o)}
static makeSegments(t){
return""==t?[]:e.isNumeric(t)?[e.makeNumeric(t)]:e.isAlphanumeric(t)?[e.makeAlphanumeric(t)]:[e.makeBytes(e.toUtf8ByteArray(t))]
}static makeEci(t){let r=[];if(t<0)throw new RangeError("ECI assignment value out of range")
;if(t<128)n(t,8,r);else if(t<16384)n(2,2,r),n(t,14,r);else{
if(!(t<1e6))throw new RangeError("ECI assignment value out of range");n(6,3,r),n(t,21,r)}return new e(e.Mode.ECI,0,r)}
static isNumeric(t){return e.NUMERIC_REGEX.test(t)}static isAlphanumeric(t){return e.ALPHANUMERIC_REGEX.test(t)}
getData(){return this.bitData.slice()}static getTotalBits(e,t){let n=0;for(const r of e){
const e=r.mode.numCharCountBits(t);if(r.numChars>=1<<e)return 1/0;n+=4+e+r.bitData.length}return n}
static toUtf8ByteArray(e){e=encodeURI(e);let t=[]
;for(let n=0;n<e.length;n++)"%"!=e.charAt(n)?t.push(e.charCodeAt(n)):(t.push(parseInt(e.substring(n+1,n+3),16)),n+=2)
;return t}};i.NUMERIC_REGEX=/^[0-9]*$/,i.ALPHANUMERIC_REGEX=/^[A-Z0-9 $%*+.\/:-]*$/,
i.ALPHANUMERIC_CHARSET="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";let s=i;e.QrSegment=i
})(qrcodegen||(qrcodegen={})),(e=>{let t;(e=>{const t=class{constructor(e,t){this.ordinal=e,this.formatBits=t}}
;t.LOW=new t(0,1),t.MEDIUM=new t(1,0),t.QUARTILE=new t(2,3),t.HIGH=new t(3,2);e.Ecc=t})(t=e.QrCode||(e.QrCode={}))
})(qrcodegen||(qrcodegen={})),(e=>{let t;(e=>{const t=class{constructor(e,t){this.modeBits=e,this.numBitsCharCount=t}
numCharCountBits(e){return this.numBitsCharCount[Math.floor((e+7)/17)]}};t.NUMERIC=new t(1,[10,12,14]),
t.ALPHANUMERIC=new t(2,[9,11,13]),t.BYTE=new t(4,[8,16,16]),t.KANJI=new t(8,[8,10,12]),t.ECI=new t(7,[0,0,0]);e.Mode=t
})(t=e.QrSegment||(e.QrSegment={}))})(qrcodegen||(qrcodegen={}));var qrcodegen_default=qrcodegen,ERROR_LEVEL_MAP={
L:qrcodegen_default.QrCode.Ecc.LOW,M:qrcodegen_default.QrCode.Ecc.MEDIUM,Q:qrcodegen_default.QrCode.Ecc.QUARTILE,
H:qrcodegen_default.QrCode.Ecc.HIGH
},DEFAULT_SIZE=128,DEFAULT_LEVEL="L",DEFAULT_BGCOLOR="#FFFFFF",DEFAULT_FGCOLOR="#000000",DEFAULT_INCLUDEMARGIN=!1,DEFAULT_MINVERSION=1,SPEC_MARGIN_SIZE=4,DEFAULT_MARGIN_SIZE=0,DEFAULT_IMG_SCALE=.1;
/**
 * @license qrcode.react
 * Copyright (c) Paul O'Shannessy
 * SPDX-License-Identifier: ISC
 */function generatePath(e,t=0){const n=[];return e.forEach(function(e,r){let o=null;e.forEach(function(i,s){
if(!i&&null!==o)return n.push(`M${o+t} ${r+t}h${s-o}v1H${o+t}z`),void(o=null);if(s!==e.length-1)i&&null===o&&(o=s);else{
if(!i)return;null===o?n.push(`M${s+t},${r+t} h1v1H${s+t}z`):n.push(`M${o+t},${r+t} h${s+1-o}v1H${o+t}z`)}})}),n.join("")
}function excavateModules(e,t){return e.slice().map((e,n)=>n<t.y||n>=t.y+t.h?e:e.map((e,n)=>(n<t.x||n>=t.x+t.w)&&e))}
function getImageSettings(e,t,n,r){if(null==r)return null
;const o=e.length+2*n,i=Math.floor(t*DEFAULT_IMG_SCALE),s=o/t,a=(r.width||i)*s,l=(r.height||i)*s,c=null==r.x?e.length/2-a/2:r.x*s,u=null==r.y?e.length/2-l/2:r.y*s,h=null==r.opacity?1:r.opacity
;let d=null;if(r.excavate){let e=Math.floor(c),t=Math.floor(u);d={x:e,y:t,w:Math.ceil(a+c-e),h:Math.ceil(l+u-t)}}return{
x:c,y:u,h:l,w:a,excavation:d,opacity:h,crossOrigin:r.crossOrigin}}function getMarginSize(e,t){
return null!=t?Math.max(Math.floor(t),0):e?SPEC_MARGIN_SIZE:DEFAULT_MARGIN_SIZE}
function useQRCode({value:e,level:t,minVersion:n,includeMargin:r,marginSize:o,imageSettings:i,size:s,boostLevel:a}){
let l=React.useMemo(()=>{
const r=(Array.isArray(e)?e:[e]).reduce((e,t)=>(e.push(...qrcodegen_default.QrSegment.makeSegments(t)),e),[])
;return qrcodegen_default.QrCode.encodeSegments(r,ERROR_LEVEL_MAP[t],n,void 0,void 0,a)},[e,t,n,a])
;const{cells:c,margin:u,numCells:h,calculatedImageSettings:d}=React.useMemo(()=>{let e=l.getModules()
;const t=getMarginSize(r,o);return{cells:e,margin:t,numCells:e.length+2*t,
calculatedImageSettings:getImageSettings(e,s,t,i)}},[l,s,i,r,o]);return{qrcode:l,margin:u,cells:c,numCells:h,
calculatedImageSettings:d}}var SUPPORTS_PATH2D=function(){try{(new Path2D).addPath(new Path2D)}catch(e){return!1}
return!0}(),QRCodeCanvas=React.forwardRef(function(e,t){
const n=e,{value:r,size:o=DEFAULT_SIZE,level:i=DEFAULT_LEVEL,bgColor:s=DEFAULT_BGCOLOR,fgColor:a=DEFAULT_FGCOLOR,includeMargin:l=DEFAULT_INCLUDEMARGIN,minVersion:c=DEFAULT_MINVERSION,boostLevel:u,marginSize:h,imageSettings:d}=n,g=__objRest(n,["value","size","level","bgColor","fgColor","includeMargin","minVersion","boostLevel","marginSize","imageSettings"]),{style:f}=g,m=__objRest(g,["style"]),E=null==d?void 0:d.src,R=React.useRef(null),_=React.useRef(null),C=React.useCallback(e=>{
R.current=e,"function"==typeof t?t(e):t&&(t.current=e)
},[t]),[M,w]=React.useState(!1),{margin:A,cells:p,numCells:S,calculatedImageSettings:N}=useQRCode({value:r,level:i,
minVersion:c,boostLevel:u,includeMargin:l,marginSize:h,imageSettings:d,size:o});React.useEffect(()=>{
if(null!=R.current){const e=R.current,t=e.getContext("2d");if(!t)return;let n=p
;const r=_.current,i=null!=N&&null!==r&&r.complete&&0!==r.naturalHeight&&0!==r.naturalWidth
;i&&null!=N.excavation&&(n=excavateModules(p,N.excavation));const l=window.devicePixelRatio||1;e.height=e.width=o*l
;const c=o/S*l
;t.scale(c,c),t.fillStyle=s,t.fillRect(0,0,S,S),t.fillStyle=a,SUPPORTS_PATH2D?t.fill(new Path2D(generatePath(n,A))):p.forEach(function(e,n){
e.forEach(function(e,r){e&&t.fillRect(r+A,n+A,1,1)})}),N&&(t.globalAlpha=N.opacity),
i&&t.drawImage(r,N.x+A,N.y+A,N.w,N.h)}}),React.useEffect(()=>{w(!1)},[E]);const I=__spreadValues({height:o,width:o},f)
;let L=null;return null!=E&&(L=React.createElement("img",{src:E,key:E,style:{display:"none"},onLoad:()=>{w(!0)},ref:_,
crossOrigin:null==N?void 0:N.crossOrigin
})),React.createElement(React.Fragment,null,React.createElement("canvas",__spreadValues({style:I,height:o,width:o,ref:C,
role:"img"},m)),L)});QRCodeCanvas.displayName="QRCodeCanvas";var QRCodeSVG=React.forwardRef(function(e,t){
const n=e,{value:r,size:o=DEFAULT_SIZE,level:i=DEFAULT_LEVEL,bgColor:s=DEFAULT_BGCOLOR,fgColor:a=DEFAULT_FGCOLOR,includeMargin:l=DEFAULT_INCLUDEMARGIN,minVersion:c=DEFAULT_MINVERSION,boostLevel:u,title:h,marginSize:d,imageSettings:g}=n,f=__objRest(n,["value","size","level","bgColor","fgColor","includeMargin","minVersion","boostLevel","title","marginSize","imageSettings"]),{margin:m,cells:E,numCells:R,calculatedImageSettings:_}=useQRCode({
value:r,level:i,minVersion:c,boostLevel:u,includeMargin:l,marginSize:d,imageSettings:g,size:o});let C=E,M=null
;null!=g&&null!=_&&(null!=_.excavation&&(C=excavateModules(E,_.excavation)),M=React.createElement("image",{href:g.src,
height:_.h,width:_.w,x:_.x+m,y:_.y+m,preserveAspectRatio:"none",opacity:_.opacity,crossOrigin:_.crossOrigin}))
;const w=generatePath(C,m);return React.createElement("svg",__spreadValues({height:o,width:o,viewBox:`0 0 ${R} ${R}`,
ref:t,role:"img"},f),!!h&&React.createElement("title",null,h),React.createElement("path",{fill:s,d:`M0,0 h${R}v${R}H0z`,
shapeRendering:"crispEdges"}),React.createElement("path",{fill:a,d:w,shapeRendering:"crispEdges"}),M)})
;QRCodeSVG.displayName="QRCodeSVG";export{QRCodeCanvas,QRCodeSVG};
