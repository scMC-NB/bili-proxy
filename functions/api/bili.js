// functions/bili.js

// ====== 纯 JS MD5 ======
function md5(s) {
  var K=[-680876936,-389564586,606105819,-1044525330,-176418897,1200080426,-1473231341,-45705983,1770035416,-1958414417,-42063,-1990404162,1804603682,-40341101,-1502002290,1236535329,-165796510,-1069501632,643717713,-373897302,-701558691,38016083,-660478335,-405537848,568446438,-1019803690,-187363961,1163531501,-1444681467,-51403784,1735328473,-1926607734,-378558,-2022574463,1839030562,-35309556,-1530992060,1272893353,-155497632,-1094730640,681279174,-358537222,-722521979,76029189,-640364487,-421815835,530742520,-995338651,-198630844,1126891415,-1416354905,-57434055,1700485571,-1894986606,-1051523,-2054922799,1873313359,-30611744,-1560198380,1309151649,-145523070,-1120210379,718787259,-343485551];
  var S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  var G=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,6,11,0,5,10,15,4,9,14,3,8,13,2,7,12,5,8,11,14,1,4,7,10,13,0,3,6,9,12,15,2,0,7,14,5,12,3,10,1,8,15,6,13,4,11,2,9];
  function safeAdd(x,y){var l=(x&0xFFFF)+(y&0xFFFF);var m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}
  function rol(x,c){return(x<<c)|(x>>>(32-c));}
  function f(g,x,y,z){return g===0?((x&y)|(~x&z)):g===1?((x&z)|(y&~z)):g===2?(x^y^z):(y^(x|~z));}
  function utf8(str){var u='';for(var i=0;i<str.length;i++){var c=str.charCodeAt(i);if(c<128)u+=String.fromCharCode(c);else if(c<2048){u+=String.fromCharCode((c>>6)|192);u+=String.fromCharCode((c&63)|128);}else{u+=String.fromCharCode((c>>12)|224);u+=String.fromCharCode(((c>>6)&63)|128);u+=String.fromCharCode((c&63)|128);}}return u;}
  function str2binl(t){t=utf8(t);var a=[],m=(1<<8)-1;for(var i=0;i<t.length*8;i+=8)a[i>>5]|=(t.charCodeAt(i/8)&m)<<(i%32);a[t.length*8>>5]|=0x80<<((t.length*8)%32);a[(((t.length+8)>>>6)<<4)+14]=t.length*8;return a;}
  function binl2hex(b){var h='0123456789abcdef',s='';for(var i=0;i<b.length*4;i++)s+=h.charAt((b[i>>2]>>((i%4)*8+4))&0xF)+h.charAt((b[i>>2]>>((i%4)*8))&0xF);return s;}
  var M=str2binl(s);
  var a=1732584193,b=-271733879,c=-1732584194,d=271733878;
  for(var i=0;i<M.length;i+=16){
    var oa=a,ob=b,oc=c,od=d;
    for(var j=0;j<64;j++){
      var g=(j<16)?0:(j<32)?1:(j<48)?2:3;
      var x=M[i+G[j]];
      var tmp=safeAdd(safeAdd(safeAdd(a,f(g,b,c,d)),safeAdd(K[j],x)),0);
      tmp=safeAdd(rol(tmp,S[j]),b);
      a=d;d=c;c=b;b=tmp;
    }
    a=safeAdd(a,oa);b=safeAdd(b,ob);c=safeAdd(c,oc);d=safeAdd(d,od);
  }
  return binl2hex([a,b,c,d]);
}

const MIXIN = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52];
let _mixinKey = '', _mixinTs = 0;

// ====== 新增：安全解析 JSON，失败时直接把 HTML 原文抛出来 ======
async function safeFetchJson(url, headers) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    // 截取前 200 个字符，避免日志太长
    throw new Error(`B站接口返回了非JSON！状态码: ${res.status}，内容片段: ${text.slice(0, 200).replace(/\n/g, ' ')}`);
  }
}

async function getMixinKey(cookie) {
  if (_mixinKey && Date.now() - _mixinTs < 10 * 60 * 1000) return _mixinKey;
  const j = await safeFetchJson('https://api.bilibili.com/x/web-interface/nav', {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.bilibili.com/',
    'Cookie': cookie || ''
  });
  const wbi = j.data.wbi_img;
  const img = wbi.img_url.split('/').pop().split('.')[0];
  const sub = wbi.sub_url.split('/').pop().split('.')[0];
  const raw = img + sub;
  let k = '';
  for (const i of MIXIN) if (i < raw.length) k += raw[i];
  _mixinKey = k.slice(0, 32); _mixinTs = Date.now();
  return _mixinKey;
}

// ====== 处理跨域预检请求 ======
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const keyword = searchParams.get('keyword');
  const page = searchParams.get('page') || 1;
  const cookie = context.env.BILI_COOKIE || '';

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  };

  if (!keyword) {
    return new Response(JSON.stringify({ error: 'Missing keyword' }), { status: 400, headers });
  }

  try {
    const key = await getMixinKey(cookie);
    const params = { keyword, page, page_size: 32, search_type: 'all', wts: Math.floor(Date.now() / 1000) };
    const keys = Object.keys(params).sort();
    const clean = v => encodeURIComponent(String(v)).replace(/[!'()*]/g, '');
    const query = keys.map(k => `${k}=${clean(params[k])}`).join('&');
    const w_rid = md5(query + key);

    const data = await safeFetchJson(`https://api.bilibili.com/x/web-interface/wbi/search/all/v2?${query}&w_rid=${w_rid}`, {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.bilibili.com/',
      'Cookie': cookie
    });

    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (e) {
    // 把真实错误原封不动返回给前端
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}
