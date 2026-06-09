import { useState, useEffect, useRef } from "react";

/* ─── FONTS & GLOBAL CSS ────────────────────────────────────────────────────── */
(() => {
  const l = document.createElement("link");
  l.href = "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&display=swap";
  l.rel = "stylesheet"; document.head.appendChild(l);
  const s = document.createElement("style");
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:#fff;font-family:'Inter',sans-serif;}
    ::-webkit-scrollbar{width:2px;}
    ::-webkit-scrollbar-thumb{background:#009640;}

    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes popIn{0%{transform:scale(0.7);opacity:0}65%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
    @keyframes trophy{0%{transform:scale(0) rotate(-15deg);opacity:0}70%{transform:scale(1.1) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
    @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(600deg);opacity:0}}
    @keyframes goalSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
    @keyframes rerollSpin{0%{opacity:1;transform:scale(1) rotate(0)}40%{opacity:0;transform:scale(0.7) rotate(180deg)}60%{opacity:0;transform:scale(0.7) rotate(180deg)}100%{opacity:1;transform:scale(1) rotate(360deg)}}

    .fadeUp  { animation: fadeUp  .3s ease both; }
    .popIn   { animation: popIn   .35s cubic-bezier(.34,1.56,.64,1) both; }
    .trophy  { animation: trophy  .55s cubic-bezier(.34,1.56,.64,1) both; }
    .goalSlide { animation: goalSlide .25s ease both; }
    .rerollSpin { animation: rerollSpin .5s ease both; }

    .t-display { font-family:'Archivo Black',sans-serif; }
    .t-body    { font-family:'Inter',sans-serif; }
  `;
  document.head.appendChild(s);
})();

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────────── */
const C = {
  white:   "#FFFFFF",
  bg:      "#FFFFFF",
  surface: "#F5F5F5",
  border:  "#E8E8E8",
  // Primary brand: verde/amarelo Brasil
  green:   "#009640",
  greenHov:"#007A33",
  greenDk: "#1E4A26",
  stripe:  "#1A7A38",
  gold:    "#FFD700",
  yellow:  "#E5A200",
  black:   "#0A0A0A",
  ink:     "#111111",
  muted:   "#888888",
  faint:   "#CCCCCC",
  red:     "#CC0000",
};

const F = {
  display: "'Archivo Black', sans-serif",
  body:    "'Inter', sans-serif",
};

/* ─── FORMATIONS ─────────────────────────────────────────────────────────────── */
const FORMATIONS = {
  "4-3-3":[
    {slot:"GOL",group:"GOL",x:50,y:87},{slot:"LD",group:"DEF",x:80,y:72},{slot:"ZAG",group:"DEF",x:62,y:74},
    {slot:"ZAG",group:"DEF",x:38,y:74},{slot:"LE",group:"DEF",x:20,y:72},{slot:"MD",group:"MID",x:76,y:52},
    {slot:"VOL",group:"MID",x:50,y:50},{slot:"ME",group:"MID",x:24,y:52},{slot:"CA",group:"ATK",x:76,y:26},
    {slot:"CA",group:"ATK",x:50,y:23},{slot:"CA",group:"ATK",x:24,y:26},
  ],
  "4-4-2":[
    {slot:"GOL",group:"GOL",x:50,y:87},{slot:"LD",group:"DEF",x:82,y:72},{slot:"ZAG",group:"DEF",x:62,y:74},
    {slot:"ZAG",group:"DEF",x:38,y:74},{slot:"LE",group:"DEF",x:18,y:72},{slot:"MD",group:"MID",x:82,y:52},
    {slot:"MC",group:"MID",x:62,y:50},{slot:"MC",group:"MID",x:38,y:50},{slot:"ME",group:"MID",x:18,y:52},
    {slot:"CA",group:"ATK",x:62,y:26},{slot:"CA",group:"ATK",x:38,y:26},
  ],
  "3-5-2":[
    {slot:"GOL",group:"GOL",x:50,y:87},{slot:"ZAG",group:"DEF",x:70,y:74},{slot:"ZAG",group:"DEF",x:50,y:76},
    {slot:"ZAG",group:"DEF",x:30,y:74},{slot:"MD",group:"MID",x:88,y:52},{slot:"VOL",group:"MID",x:68,y:52},
    {slot:"VOL",group:"MID",x:50,y:50},{slot:"VOL",group:"MID",x:32,y:52},{slot:"ME",group:"MID",x:12,y:52},
    {slot:"CA",group:"ATK",x:62,y:26},{slot:"CA",group:"ATK",x:38,y:26},
  ],
  "4-2-3-1":[
    {slot:"GOL",group:"GOL",x:50,y:87},{slot:"LD",group:"DEF",x:82,y:72},{slot:"ZAG",group:"DEF",x:62,y:74},
    {slot:"ZAG",group:"DEF",x:38,y:74},{slot:"LE",group:"DEF",x:18,y:72},{slot:"VOL",group:"MID",x:63,y:60},
    {slot:"VOL",group:"MID",x:37,y:60},{slot:"MD",group:"MID",x:80,y:40},{slot:"MC",group:"MID",x:50,y:37},
    {slot:"ME",group:"MID",x:20,y:40},{slot:"CA",group:"ATK",x:50,y:20},
  ],
};
const SLOT_ACCEPTS = {
  GOL:["GOL"],LD:["LD","ZAG"],LE:["LE","ZAG"],ZAG:["ZAG","LD","LE"],
  VOL:["VOL","MC"],MC:["MC","VOL","MD","ME"],MD:["MD","MC","CA","ME"],ME:["ME","MC","CA","MD"],CA:["CA","ME","MD"],
};
function groupColor(g){if(g==="GOL")return C.yellow;if(g==="DEF")return C.green;if(g==="MID")return"#1A5FAA";return"#CC0000";}
function posToGroup(p){if(p==="GOL")return"GOL";if(["ZAG","LD","LE"].includes(p))return"DEF";if(["VOL","MC","MD","ME"].includes(p))return"MID";return"ATK";}
function assignToSlots(fm,players){
  const slots=FORMATIONS[fm]||FORMATIONS["4-3-3"];
  const res=Array(slots.length).fill(null);const used=new Set();
  for(let pass=0;pass<3;pass++){
    slots.forEach((slot,si)=>{
      if(res[si])return;
      const ok=SLOT_ACCEPTS[slot.slot]||[slot.slot];
      for(let pi=0;pi<players.length;pi++){
        if(used.has(pi))continue;
        const match=pass===0?ok[0]===players[pi].pos:pass===1?ok.includes(players[pi].pos):true;
        if(match){res[si]=players[pi];used.add(pi);break;}
      }
    });
  }
  return res;
}
function openGroups(fm,team){
  const slots=FORMATIONS[fm]||FORMATIONS["4-3-3"];
  const assigned=assignToSlots(fm,team);
  const open=new Set();
  slots.forEach((slot,i)=>{if(!assigned[i])open.add(slot.group);});
  return open;
}

/* ─── SQUADS DATABASE ────────────────────────────────────────────────────────── */
// ════════════════════════════════════════════════════════════════════════════════
// 📌 COMO PERSONALIZAR:
//   Cada objeto em SQUADS representa um elenco histórico de um clube.
//   Campos:
//     year    — ano (número único, usado como ID)
//     club    — nome do clube
//     ed      — nome da edição (ex: "Brasileirão 2019")
//     champion — true se esse time venceu o torneio naquele ano
//     color   — cor primária do clube (para o banner no draft)
//     players — lista de 11 jogadores:
//       name   — nome do jogador
//       shirt  — número da camisa
//       pos    — posição: GOL | LD | ZAG | LE | VOL | MC | MD | ME | CA
//       rating — força (60-99)
// ════════════════════════════════════════════════════════════════════════════════
const SQUADS = [
  // ── FLAMENGO ──
  {year:2019,club:"Flamengo",ed:"Brasileirão 2019",champion:true,color:"#CC0000",players:[
    {name:"Diego Alves",shirt:1,pos:"GOL",rating:86},
    {name:"Rafinha",shirt:2,pos:"LD",rating:83},
    {name:"Rodrigo Caio",shirt:4,pos:"ZAG",rating:85},
    {name:"Pablo Marí",shirt:5,pos:"ZAG",rating:82},
    {name:"Filipe Luís",shirt:6,pos:"LE",rating:88},
    {name:"Willian Arão",shirt:5,pos:"VOL",rating:84},
    {name:"Gerson",shirt:8,pos:"MC",rating:86},
    {name:"Éverton Ribeiro",shirt:7,pos:"MD",rating:88},
    {name:"Bruno Henrique",shirt:27,pos:"ME",rating:89},
    {name:"Arrascaeta",shirt:14,pos:"ME",rating:90},
    {name:"Gabigol",shirt:9,pos:"CA",rating:92},
  ]},
  {year:2022,club:"Flamengo",ed:"Brasileirão 2022",champion:true,color:"#CC0000",players:[
    {name:"Santos",shirt:1,pos:"GOL",rating:83},
    {name:"Rodinei",shirt:2,pos:"LD",rating:80},
    {name:"David Luiz",shirt:23,pos:"ZAG",rating:84},
    {name:"Léo Pereira",shirt:5,pos:"ZAG",rating:82},
    {name:"Filipe Luís",shirt:6,pos:"LE",rating:85},
    {name:"João Gomes",shirt:8,pos:"VOL",rating:83},
    {name:"Thiago Maia",shirt:30,pos:"VOL",rating:82},
    {name:"Éverton Ribeiro",shirt:7,pos:"MD",rating:86},
    {name:"Arrascaeta",shirt:14,pos:"ME",rating:89},
    {name:"Pedro",shirt:21,pos:"CA",rating:88},
    {name:"Gabigol",shirt:9,pos:"CA",rating:90},
  ]},
  {year:1983,club:"Flamengo",ed:"Brasileiro 1983",champion:true,color:"#CC0000",players:[
    {name:"Raul",shirt:1,pos:"GOL",rating:82},
    {name:"Leandro",shirt:2,pos:"LD",rating:88},
    {name:"Mozer",shirt:4,pos:"ZAG",rating:84},
    {name:"Fio Maravilha",shirt:5,pos:"ZAG",rating:82},
    {name:"Júnior",shirt:6,pos:"LE",rating:91},
    {name:"Andrade",shirt:8,pos:"VOL",rating:85},
    {name:"Adílio",shirt:10,pos:"MC",rating:88},
    {name:"Tita",shirt:7,pos:"MD",rating:84},
    {name:"Zico",shirt:11,pos:"ME",rating:99},
    {name:"Bebeto",shirt:9,pos:"CA",rating:91},
    {name:"Nunes",shirt:3,pos:"CA",rating:84},
  ]},

  // ── SANTOS ──
  {year:1962,club:"Santos",ed:"Brasileiro 1962",champion:true,color:"#1C1C1C",players:[
    {name:"Gilmar",shirt:1,pos:"GOL",rating:89},
    {name:"Olívio",shirt:2,pos:"LD",rating:78},
    {name:"Mauro",shirt:4,pos:"ZAG",rating:84},
    {name:"Calvet",shirt:5,pos:"ZAG",rating:80},
    {name:"Dalmo",shirt:3,pos:"LE",rating:81},
    {name:"Zito",shirt:6,pos:"VOL",rating:88},
    {name:"Lima",shirt:8,pos:"MC",rating:82},
    {name:"Dorval",shirt:7,pos:"MD",rating:85},
    {name:"Pagão",shirt:11,pos:"ME",rating:80},
    {name:"Pelé",shirt:10,pos:"CA",rating:99},
    {name:"Pepe",shirt:9,pos:"CA",rating:92},
  ]},
  {year:2010,club:"Santos",ed:"Brasileirão 2010",champion:false,color:"#1C1C1C",players:[
    {name:"Rafael",shirt:1,pos:"GOL",rating:83},
    {name:"Leo",shirt:2,pos:"LD",rating:80},
    {name:"Edu Dracena",shirt:4,pos:"ZAG",rating:82},
    {name:"Durval",shirt:5,pos:"ZAG",rating:80},
    {name:"Dani Alves (empr.)",shirt:6,pos:"LE",rating:84},
    {name:"Arouca",shirt:8,pos:"VOL",rating:81},
    {name:"Chicão",shirt:5,pos:"MC",rating:80},
    {name:"Ganso",shirt:10,pos:"MC",rating:88},
    {name:"Elano",shirt:7,pos:"MD",rating:85},
    {name:"Robinho",shirt:11,pos:"ME",rating:88},
    {name:"Neymar",shirt:11,pos:"CA",rating:93},
  ]},

  // ── PALMEIRAS ──
  {year:1994,club:"Palmeiras",ed:"Brasileiro 1994",champion:true,color:"#006437",players:[
    {name:"Marcos",shirt:12,pos:"GOL",rating:88},
    {name:"Cafu",shirt:2,pos:"LD",rating:91},
    {name:"Antônio Carlos",shirt:4,pos:"ZAG",rating:83},
    {name:"Cléber",shirt:5,pos:"ZAG",rating:80},
    {name:"Arce",shirt:3,pos:"LE",rating:80},
    {name:"Márcio Bispo",shirt:6,pos:"VOL",rating:80},
    {name:"Zinho",shirt:10,pos:"MC",rating:91},
    {name:"Luís Henrique",shirt:7,pos:"MD",rating:80},
    {name:"Rivaldo",shirt:11,pos:"ME",rating:95},
    {name:"Evair",shirt:9,pos:"CA",rating:89},
    {name:"Edmundo",shirt:11,pos:"CA",rating:91},
  ]},
  {year:2018,club:"Palmeiras",ed:"Brasileirão 2018",champion:true,color:"#006437",players:[
    {name:"Weverton",shirt:21,pos:"GOL",rating:86},
    {name:"Mayke",shirt:12,pos:"LD",rating:82},
    {name:"Luan",shirt:4,pos:"ZAG",rating:83},
    {name:"Edu Dracena",shirt:3,pos:"ZAG",rating:81},
    {name:"Diogo Barbosa",shirt:6,pos:"LE",rating:82},
    {name:"Felipe Melo",shirt:30,pos:"VOL",rating:84},
    {name:"Bruno Henrique",shirt:5,pos:"VOL",rating:83},
    {name:"Lucas Lima",shirt:10,pos:"MC",rating:83},
    {name:"Willian",shirt:7,pos:"MD",rating:87},
    {name:"Dudu",shirt:7,pos:"ME",rating:88},
    {name:"Borja",shirt:9,pos:"CA",rating:82},
  ]},
  {year:2022,club:"Palmeiras",ed:"Brasileirão 2022",champion:false,color:"#006437",players:[
    {name:"Weverton",shirt:21,pos:"GOL",rating:87},
    {name:"Marcos Rocha",shirt:2,pos:"LD",rating:83},
    {name:"Gustavo Gómez",shirt:15,pos:"ZAG",rating:87},
    {name:"Murilo",shirt:25,pos:"ZAG",rating:84},
    {name:"Piquerez",shirt:22,pos:"LE",rating:84},
    {name:"Danilo",shirt:28,pos:"VOL",rating:86},
    {name:"Zé Rafael",shirt:8,pos:"VOL",rating:83},
    {name:"Raphael Veiga",shirt:23,pos:"MC",rating:88},
    {name:"Gustavo Scarpa",shirt:14,pos:"ME",rating:86},
    {name:"Dudu",shirt:7,pos:"MD",rating:86},
    {name:"Rony",shirt:11,pos:"CA",rating:85},
  ]},

  // ── SÃO PAULO ──
  {year:1992,club:"São Paulo",ed:"Brasileiro 1992",champion:true,color:"#CC0000",players:[
    {name:"Zetti",shirt:1,pos:"GOL",rating:84},
    {name:"Vítor",shirt:2,pos:"LD",rating:78},
    {name:"Adilson",shirt:4,pos:"ZAG",rating:82},
    {name:"Ronaldão",shirt:5,pos:"ZAG",rating:80},
    {name:"Cafu",shirt:13,pos:"LE",rating:88},
    {name:"Pintado",shirt:8,pos:"VOL",rating:79},
    {name:"Toninho Cerezo",shirt:6,pos:"VOL",rating:82},
    {name:"Raí",shirt:10,pos:"MC",rating:91},
    {name:"Müller",shirt:9,pos:"CA",rating:84},
    {name:"Elivélton",shirt:11,pos:"ME",rating:77},
    {name:"Palhinha",shirt:7,pos:"MD",rating:80},
  ]},
  {year:2008,club:"São Paulo",ed:"Brasileiro 2008",champion:true,color:"#CC0000",players:[
    {name:"Rogério Ceni",shirt:1,pos:"GOL",rating:88},
    {name:"Zé Luis",shirt:2,pos:"LD",rating:79},
    {name:"Miranda",shirt:5,pos:"ZAG",rating:84},
    {name:"Rodrigo",shirt:4,pos:"ZAG",rating:80},
    {name:"Jorge Wagner",shirt:3,pos:"LE",rating:80},
    {name:"Jean",shirt:8,pos:"VOL",rating:80},
    {name:"Hernanes",shirt:10,pos:"MC",rating:86},
    {name:"Hugo",shirt:6,pos:"MC",rating:78},
    {name:"Dagoberto",shirt:11,pos:"ME",rating:80},
    {name:"Borges",shirt:9,pos:"CA",rating:82},
    {name:"André Dias",shirt:7,pos:"MD",rating:79},
  ]},

  // ── CRUZEIRO ──
  {year:2003,club:"Cruzeiro",ed:"Brasileiro 2003",champion:true,color:"#003DA5",players:[
    {name:"Dida",shirt:1,pos:"GOL",rating:89},
    {name:"Léo",shirt:2,pos:"LD",rating:83},
    {name:"Cris",shirt:4,pos:"ZAG",rating:82},
    {name:"Brochet",shirt:5,pos:"ZAG",rating:80},
    {name:"Júnior César",shirt:3,pos:"LE",rating:80},
    {name:"Ricardinho",shirt:8,pos:"VOL",rating:83},
    {name:"Claudinho",shirt:6,pos:"VOL",rating:81},
    {name:"Alex",shirt:10,pos:"MC",rating:90},
    {name:"Rodrigo Faria",shirt:7,pos:"MD",rating:80},
    {name:"Deivid",shirt:9,pos:"CA",rating:83},
    {name:"Marcelo Ramos",shirt:11,pos:"ME",rating:79},
  ]},

  // ── INTERNACIONAL ──
  {year:1979,club:"Internacional",ed:"Brasileiro 1979",champion:true,color:"#E30613",players:[
    {name:"Claudio",shirt:1,pos:"GOL",rating:83},
    {name:"Mauro Galvão",shirt:2,pos:"LD",rating:82},
    {name:"Batista",shirt:4,pos:"ZAG",rating:84},
    {name:"Amarildo",shirt:5,pos:"ZAG",rating:81},
    {name:"Índio",shirt:3,pos:"LE",rating:83},
    {name:"Duarte",shirt:8,pos:"VOL",rating:82},
    {name:"Falcão",shirt:10,pos:"MC",rating:97},
    {name:"Escurinho",shirt:6,pos:"MC",rating:80},
    {name:"Tarciso",shirt:7,pos:"MD",rating:80},
    {name:"Alvinho",shirt:9,pos:"CA",rating:81},
    {name:"Valdomiro",shirt:11,pos:"ME",rating:84},
  ]},
  {year:2009,club:"Internacional",ed:"Brasileiro 2009",champion:true,color:"#E30613",players:[
    {name:"Renan",shirt:1,pos:"GOL",rating:82},
    {name:"Bolívar",shirt:2,pos:"LD",rating:80},
    {name:"Índio",shirt:4,pos:"ZAG",rating:80},
    {name:"Indio",shirt:5,pos:"ZAG",rating:79},
    {name:"Kleber Gladiador",shirt:3,pos:"LE",rating:79},
    {name:"Tinga",shirt:8,pos:"VOL",rating:82},
    {name:"Índio",shirt:6,pos:"VOL",rating:81},
    {name:"D'Alessandro",shirt:10,pos:"MC",rating:88},
    {name:"Giuliano",shirt:7,pos:"MD",rating:82},
    {name:"Alecsandro",shirt:9,pos:"CA",rating:83},
    {name:"Nilmar",shirt:11,pos:"ME",rating:85},
  ]},

  // ── CORINTHIANS ──
  {year:1999,club:"Corinthians",ed:"Brasileiro 1999",champion:true,color:"#000000",players:[
    {name:"Dida",shirt:1,pos:"GOL",rating:88},
    {name:"Rogério",shirt:2,pos:"LD",rating:79},
    {name:"Gamarra",shirt:4,pos:"ZAG",rating:86},
    {name:"Rincón",shirt:5,pos:"ZAG",rating:84},
    {name:"Silvinho",shirt:3,pos:"LE",rating:82},
    {name:"Vampeta",shirt:8,pos:"VOL",rating:84},
    {name:"Jairzinho",shirt:6,pos:"VOL",rating:79},
    {name:"Marcelinho Carioca",shirt:10,pos:"MC",rating:89},
    {name:"Freddy Rincón",shirt:7,pos:"MD",rating:86},
    {name:"Edilson",shirt:11,pos:"ME",rating:83},
    {name:"Luizão",shirt:9,pos:"CA",rating:85},
  ]},
  {year:2017,club:"Corinthians",ed:"Brasileirão 2017",champion:true,color:"#000000",players:[
    {name:"Cássio",shirt:12,pos:"GOL",rating:88},
    {name:"Fágner",shirt:23,pos:"LD",rating:82},
    {name:"Pablo",shirt:4,pos:"ZAG",rating:83},
    {name:"Balbuena",shirt:3,pos:"ZAG",rating:83},
    {name:"Guilherme Arana",shirt:6,pos:"LE",rating:81},
    {name:"Gabriel",shirt:8,pos:"VOL",rating:82},
    {name:"Maycon",shirt:5,pos:"VOL",rating:82},
    {name:"Rodriguinho",shirt:10,pos:"MC",rating:84},
    {name:"Romero",shirt:7,pos:"MD",rating:82},
    {name:"Jadson",shirt:14,pos:"ME",rating:83},
    {name:"Jo",shirt:9,pos:"CA",rating:83},
  ]},

  // ── GRÊMIO ──
  {year:1996,club:"Grêmio",ed:"Brasileiro 1996",champion:true,color:"#0F4C8A",players:[
    {name:"Dida",shirt:1,pos:"GOL",rating:86},
    {name:"Mauro Galvão",shirt:2,pos:"LD",rating:82},
    {name:"Roger",shirt:4,pos:"ZAG",rating:82},
    {name:"Arce",shirt:5,pos:"ZAG",rating:80},
    {name:"Gilberto",shirt:3,pos:"LE",rating:80},
    {name:"Dinho",shirt:8,pos:"VOL",rating:83},
    {name:"Jardel",shirt:10,pos:"MC",rating:88},
    {name:"Marinho",shirt:6,pos:"MC",rating:80},
    {name:"Paulo Nunes",shirt:9,pos:"CA",rating:85},
    {name:"Arce",shirt:11,pos:"ME",rating:79},
    {name:"Renato Gaúcho",shirt:7,pos:"MD",rating:88},
  ]},

  // ── VASCO ──
  {year:1997,club:"Vasco",ed:"Brasileiro 1997",champion:true,color:"#0A0A0A",players:[
    {name:"Carlos Germano",shirt:1,pos:"GOL",rating:83},
    {name:"Odvan",shirt:2,pos:"LD",rating:79},
    {name:"Mauro Galvão",shirt:5,pos:"ZAG",rating:83},
    {name:"Andrade",shirt:4,pos:"ZAG",rating:82},
    {name:"Pedrinho",shirt:3,pos:"LE",rating:80},
    {name:"Donizete",shirt:8,pos:"VOL",rating:83},
    {name:"Sávio",shirt:10,pos:"MC",rating:87},
    {name:"Juninho P.N.",shirt:6,pos:"MC",rating:91},
    {name:"Ramón",shirt:11,pos:"ME",rating:82},
    {name:"Romário",shirt:11,pos:"CA",rating:97},
    {name:"Edmundo",shirt:9,pos:"CA",rating:91},
  ]},

  // ── ATLÉTICO-MG ──
  {year:1971,club:"Atlético-MG",ed:"Brasileiro 1971",champion:true,color:"#1C1C1C",players:[
    {name:"Piazza GOL",shirt:1,pos:"GOL",rating:82},
    {name:"Humberto",shirt:2,pos:"LD",rating:79},
    {name:"Servílio",shirt:4,pos:"ZAG",rating:82},
    {name:"Eduardo",shirt:5,pos:"ZAG",rating:80},
    {name:"Reinaldo",shirt:3,pos:"LE",rating:90},
    {name:"Toninho",shirt:8,pos:"VOL",rating:82},
    {name:"Piazza",shirt:6,pos:"MC",rating:86},
    {name:"Dario",shirt:10,pos:"MC",rating:84},
    {name:"Dadá Maravilha",shirt:9,pos:"CA",rating:91},
    {name:"Oldair",shirt:7,pos:"MD",rating:81},
    {name:"Dirceu Lopes",shirt:11,pos:"ME",rating:87},
  ]},
  {year:2021,club:"Atlético-MG",ed:"Brasileirão 2021",champion:true,color:"#1C1C1C",players:[
    {name:"Éverson",shirt:22,pos:"GOL",rating:85},
    {name:"Mariano",shirt:2,pos:"LD",rating:80},
    {name:"Nathan Silva",shirt:5,pos:"ZAG",rating:82},
    {name:"Junior Alonso",shirt:13,pos:"ZAG",rating:83},
    {name:"Guilherme Arana",shirt:6,pos:"LE",rating:84},
    {name:"Jair",shirt:18,pos:"VOL",rating:81},
    {name:"Allan",shirt:8,pos:"VOL",rating:82},
    {name:"Nacho Fernández",shirt:10,pos:"MC",rating:85},
    {name:"Savarino",shirt:11,pos:"MD",rating:83},
    {name:"Hulk",shirt:7,pos:"CA",rating:88},
    {name:"Diego Costa",shirt:9,pos:"CA",rating:83},
  ]},

  // ── FLUMINENSE ──
  {year:2023,club:"Fluminense",ed:"Brasileirão 2023",champion:false,color:"#8A1538",players:[
    {name:"Fábio",shirt:12,pos:"GOL",rating:88},
    {name:"Samuel Xavier",shirt:2,pos:"LD",rating:81},
    {name:"Nino",shirt:3,pos:"ZAG",rating:83},
    {name:"Felipe Melo",shirt:30,pos:"ZAG",rating:80},
    {name:"Marcelo",shirt:12,pos:"LE",rating:88},
    {name:"André",shirt:14,pos:"VOL",rating:86},
    {name:"Martinelli",shirt:8,pos:"VOL",rating:82},
    {name:"Ganso",shirt:10,pos:"MC",rating:85},
    {name:"Arias",shirt:11,pos:"MD",rating:85},
    {name:"Jhon Arias",shirt:7,pos:"ME",rating:84},
    {name:"Cano",shirt:14,pos:"CA",rating:87},
  ]},

  // ── BOTAFOGO ──
  {year:2024,club:"Botafogo",ed:"Brasileirão 2024",champion:true,color:"#0A0A0A",players:[
    {name:"John",shirt:1,pos:"GOL",rating:84},
    {name:"Damián Suárez",shirt:2,pos:"LD",rating:82},
    {name:"Bastos",shirt:4,pos:"ZAG",rating:83},
    {name:"Alexander Barboza",shirt:25,pos:"ZAG",rating:83},
    {name:"Cuiabano",shirt:3,pos:"LE",rating:81},
    {name:"Marlon Freitas",shirt:8,pos:"VOL",rating:84},
    {name:"Gregore",shirt:5,pos:"VOL",rating:82},
    {name:"Savarino",shirt:10,pos:"MC",rating:86},
    {name:"Luiz Henrique",shirt:7,pos:"MD",rating:87},
    {name:"Thiago Almada",shirt:20,pos:"ME",rating:85},
    {name:"Tiquinho Soares",shirt:9,pos:"CA",rating:86},
  ]},

  // ── BAHIA ──
  {year:1988,club:"Bahia",ed:"Brasileiro 1988",champion:true,color:"#003DA5",players:[
    {name:"Nenê",shirt:1,pos:"GOL",rating:81},
    {name:"Mauro Galvão",shirt:2,pos:"LD",rating:83},
    {name:"Lúcio Flávio",shirt:4,pos:"ZAG",rating:82},
    {name:"Careca",shirt:5,pos:"ZAG",rating:80},
    {name:"Luís Cláudio",shirt:3,pos:"LE",rating:80},
    {name:"Zé Carlos",shirt:8,pos:"VOL",rating:81},
    {name:"Jandir",shirt:6,pos:"MC",rating:80},
    {name:"Bobô",shirt:10,pos:"MC",rating:84},
    {name:"Márcio",shirt:7,pos:"MD",rating:80},
    {name:"Márcio Araújo",shirt:11,pos:"ME",rating:79},
    {name:"Geová",shirt:9,pos:"CA",rating:84},
  ]},
];

/* ─── OPPONENTS — Copa do Brasil / Copa Libertadores ─────────────────────────── */
const ALL_OPPONENTS = [
  {name:"Boca Juniors",year:2000,country:"ARG",flag:"🇦🇷",rating:91,scorers:["Palermo","Riquelme","Bermúdez","Delgado","Córdoba"]},
  {name:"River Plate",year:2018,country:"ARG",flag:"🇦🇷",rating:91,scorers:["Borré","Quintero","Pratto","De La Cruz","Palacios"]},
  {name:"Flamengo",year:2019,country:"BRA",flag:"🇧🇷",rating:91,scorers:["Gabigol","Bruno Henrique","Arrascaeta","Éverton R.","Filipe Luís"]},
  {name:"Palmeiras",year:2021,country:"BRA",flag:"🇧🇷",rating:90,scorers:["Veiga","Rony","Breno Lopes","Dudu","Willian"]},
  {name:"River Plate",year:1986,country:"ARG",flag:"🇦🇷",rating:90,scorers:["Alzamendi","Funes","Burruchaga","Rambert","Ortega"]},
  {name:"Atletico Nacional",year:1989,country:"COL",flag:"🇨🇴",rating:86,scorers:["Higuita","Escobar","Álvarez","Leonel Á.","Ómar Pérez"]},
  {name:"Grêmio",year:2017,country:"BRA",flag:"🇧🇷",rating:88,scorers:["Everton","Luan","Fernandinho","Jael","Ramiro"]},
  {name:"Santos",year:1962,country:"BRA",flag:"🇧🇷",rating:96,scorers:["Pelé","Pepe","Pagão","Lima","Dorval"]},
  {name:"Colo-Colo",year:1991,country:"CHI",flag:"🇨🇱",rating:86,scorers:["Zamorano","Basay","Vera","Fournier","Reyes"]},
  {name:"Vélez Sársfield",year:1994,country:"ARG",flag:"🇦🇷",rating:86,scorers:["Asad","Chilavert","Trotta","Gomez","Bassedas"]},
  {name:"Olimpia",year:2002,country:"PAR",flag:"🇵🇾",rating:80,scorers:["Cardozo","Enciso","Villarreal","Salcedo","Rojas"]},
  {name:"LDU Quito",year:2008,country:"ECU",flag:"🇪🇨",rating:83,scorers:["Bolaños","Bieler","Urrutia","Alcívar","Arroyo"]},
  {name:"Estudiantes",year:2009,country:"ARG",flag:"🇦🇷",rating:85,scorers:["Boselli","Verón","Fernández","Braña","Piatti"]},
  {name:"San Lorenzo",year:2014,country:"ARG",flag:"🇦🇷",rating:84,scorers:["Cauteruccio","Ortigoza","Blanco","Cerutti","Villar"]},
  {name:"Atletico Nacional",year:2016,country:"COL",flag:"🇨🇴",rating:84,scorers:["Uribe","Boateng","Arias","Moreno","Ibargüen"]},
  {name:"Independiente",year:1984,country:"ARG",flag:"🇦🇷",rating:85,scorers:["Burruchaga","Insúa","Commisso","Percudani","Acosta"]},
  {name:"Peñarol",year:1987,country:"URU",flag:"🇺🇾",rating:85,scorers:["Paz","Aguilera","Revelez","Ribas","Saralegui"]},
  {name:"Barcelona SC",year:2021,country:"ECU",flag:"🇪🇨",rating:80,scorers:["Morales","Sarmiento","Jonny Uchuari","Minda","Blanco"]},
  {name:"Bolivar",year:2012,country:"BOL",flag:"🇧🇴",rating:78,scorers:["Morales","Algarañaz","Vaca","Chávez","Bejarano"]},
  {name:"Atlético-MG",year:2013,country:"BRA",flag:"🇧🇷",rating:88,scorers:["Ronaldinho","Jô","Bernard","Luan","Tardelli"]},
];

function oppLabel(opp){return `${opp.name} ${opp.year}`;}
function oppScorer(opp){const l=opp.scorers||["Jogador"];return l[0|Math.random()*l.length];}

const KO_ROUNDS = ["Oitavas","Quartas","Semifinal","Final"];

/* ─── HELPERS ────────────────────────────────────────────────────────────────── */
const shuffle = a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
const rand = (a,b)=>a+(0|Math.random()*(b-a+1));
const avgR = ps=>ps.reduce((s,p)=>s+p.rating,0)/Math.max(ps.length,1);

/* ─── MATCH ENGINE ───────────────────────────────────────────────────────────── */
function buildMatchEvents(players,myR,oppR,opp){
  const diff=(myR-oppR)/12;
  const myG=Math.max(0,Math.round(2.4+diff+(Math.random()*2.4-1)));
  const oppG=Math.max(0,Math.round(2.0-diff+(Math.random()*2.4-1.1)));
  const pool=[...players.filter(p=>["CA","ME","MD"].includes(p.pos)),
              ...players.filter(p=>["CA","ME","MD"].includes(p.pos)),
              ...players.filter(p=>["MC","VOL"].includes(p.pos))];
  const used=new Set();
  const getMin=()=>{let m;do{m=rand(1,90);}while(used.has(m));used.add(m);return m;};
  const evs=[];
  for(let i=0;i<myG;i++){
    const sc=pool[0|Math.random()*pool.length]||players[0|Math.random()*players.length];
    evs.push({min:getMin(),team:"my",name:sc.name,pos:sc.pos,type:"goal"});
  }
  for(let i=0;i<oppG;i++){
    evs.push({min:getMin(),team:"opp",name:oppScorer(opp),club:oppLabel(opp),type:"goal"});
  }
  const yellowCount=rand(1,3);
  for(let i=0;i<yellowCount;i++){
    if(Math.random()<0.55){
      const p=players[0|Math.random()*players.length];
      evs.push({min:getMin(),team:"my",name:p.name,type:"yellow"});
    } else {
      evs.push({min:getMin(),team:"opp",name:oppScorer(opp),club:oppLabel(opp),type:"yellow"});
    }
  }
  if(Math.random()<0.12){
    if(Math.random()<0.35){
      const p=players[0|Math.random()*players.length];
      evs.push({min:getMin(),team:"my",name:p.name,type:"red"});
    } else {
      evs.push({min:getMin(),team:"opp",name:oppScorer(opp),club:oppLabel(opp),type:"red"});
    }
  }
  evs.sort((a,b)=>a.min-b.min);
  return{myG,oppG,win:myG>oppG,draw:myG===oppG,evs};
}

function buildPenalties(players,opp){
  const takers=shuffle([...players.filter(p=>["CA","ME","MD"].includes(p.pos)),
                        ...players.filter(p=>["MC","VOL","LD","LE"].includes(p.pos))]).slice(0,5);
  const oppTakers=(opp.scorers||["Cobrador 1","Cobrador 2","Cobrador 3","Cobrador 4","Cobrador 5"]).slice(0,5);
  const kicks=[];let spScore=0,oppScore=0;
  for(let i=0;i<5;i++){
    const spC=Math.random()<0.76;const oppC=Math.random()<0.74;
    if(spC)spScore++;if(oppC)oppScore++;
    kicks.push({idx:i,round:"normal",spName:takers[i]?.name||`Jogador ${i+1}`,spConvert:spC,
      oppName:oppTakers[i]||`Cobrador ${i+1}`,oppConvert:oppC,spScore,oppScore});
    const rem=4-i;
    if(spScore-oppScore>rem)return{kicks,spWin:true,suddenDeath:false};
    if(oppScore-spScore>rem)return{kicks,spWin:false,suddenDeath:false};
  }
  if(spScore===oppScore){
    const sdPool=shuffle([...players]);
    for(let round=0;round<10;round++){
      const spC=Math.random()<0.76;const oppC=Math.random()<0.74;
      const spName=sdPool[round%sdPool.length]?.name||`Jogador ${round+6}`;
      const oppName=opp.scorers?.[round%opp.scorers.length]||`Cobrador ${round+6}`;
      if(spC)spScore++;if(oppC)oppScore++;
      kicks.push({idx:5+round,round:"sudden",spName,spConvert:spC,oppName,oppConvert:oppC,spScore,oppScore});
      if(spC!==oppC)return{kicks,spWin:spC,suddenDeath:true};
    }
  }
  return{kicks,spWin:spScore>=oppScore,suddenDeath:spScore===oppScore};
}

function buildTournament(team){
  const r=avgR(team);
  const opps=shuffle(ALL_OPPONENTS);
  const groupOpps=opps.slice(0,3);
  const koOpps=opps.slice(3,7);
  const groupMatches=groupOpps.map((opp,i)=>({
    phase:"group",matchNum:i+1,label:`Grupo — Jogo ${i+1}`,opp,
    ...buildMatchEvents(team,r,opp.rating,opp),
  }));
  function simPts(a,b){
    const d=(a.rating-b.rating)/15;const rv=Math.random();
    if(rv<0.1+d*0.2)return[3,0];if(rv<0.35)return[1,1];return[0,3];
  }
  const oppStats=groupOpps.map(o=>({...o,pts:0,w:0,d:0,l:0,gf:0,ga:0}));
  [[0,1],[0,2],[1,2]].forEach(([ai,bi])=>{
    const[pa,pb]=simPts(groupOpps[ai],groupOpps[bi]);
    oppStats[ai].pts+=pa;oppStats[bi].pts+=pb;
    if(pa===3){oppStats[ai].w++;oppStats[bi].l++;}
    else if(pa===1){oppStats[ai].d++;oppStats[bi].d++;}
    else{oppStats[bi].w++;oppStats[ai].l++;}
    const ga=rand(0,3),gb=rand(0,2);
    oppStats[ai].gf+=ga;oppStats[ai].ga+=gb;oppStats[bi].gf+=gb;oppStats[bi].ga+=ga;
  });
  const spW=groupMatches.filter(m=>m.win).length;
  const spD=groupMatches.filter(m=>m.draw).length;
  const spL=groupMatches.filter(m=>!m.win&&!m.draw).length;
  const spPts=spW*3+spD;
  const spGF=groupMatches.reduce((s,m)=>s+m.myG,0);
  const spGA=groupMatches.reduce((s,m)=>s+m.oppG,0);
  const spGD=spGF-spGA;
  groupMatches.forEach((m,i)=>{
    oppStats[i].pts+=(m.win?0:m.draw?1:3);
    oppStats[i].gf+=m.oppG;oppStats[i].ga+=m.myG;
    if(!m.win&&!m.draw)oppStats[i].w++;else if(m.draw)oppStats[i].d++;else oppStats[i].l++;
  });
  const allRows=[
    {name:"Seu Time",flag:"⚽",pts:spPts,w:spW,d:spD,l:spL,gf:spGF,ga:spGA,gd:spGD,isMy:true},
    ...oppStats.map(o=>({name:oppLabel(o),flag:o.flag,pts:o.pts,w:o.w,d:o.d,l:o.l,gf:o.gf,ga:o.ga,gd:o.gf-o.ga,isMy:false})),
  ].sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
  const qualified=allRows.findIndex(r=>r.isMy)<2;
  const koMatches=KO_ROUNDS.map((round,i)=>({
    phase:"ko",round,label:round,opp:koOpps[i],
    ...buildMatchEvents(team,r,koOpps[i].rating,koOpps[i]),
  }));
  return{groupMatches,pts:spPts,gd:spGD,qualified,koMatches,groupTable:allRows};
}

/* ─── COMMENTARY ─────────────────────────────────────────────────────────────── */
function generateMatchCommentary(match,myG,oppG,evs){
  const opp=oppLabel(match.opp);
  const scorers=evs.filter(e=>e.type==="goal"&&e.team==="my").map(e=>e.name);
  const first=scorers[0];
  const diff=myG-oppG;
  const r=()=>Math.random();
  if(myG>oppG){
    if(diff>=3){
      const opts=[
        `Goleada! ${first||"O time"} foi fenomenal e o ${opp} saiu destruído.`,
        `${myG} a ${oppG} e sem discussão. Isso é futebol de raça!`,
        `${first?first+" fez a festa, ":""}o ${opp} não soube o que aconteceu.`,
      ];
      return opts[0|r()*opts.length];
    } else if(diff===2){
      const opts=[
        `Vitória convincente! ${first||"O time"} fez a diferença.`,
        `Dois a mais pro ${opp}. Jogou bonito, podia matar mais cedo.`,
        `${first?first+" brilhou. ":""}Controlou e venceu bem.`,
      ];
      return opts[0|r()*opts.length];
    } else {
      const opts=[
        `Sofrido, mas nos três pontos! ${first||"Alguém"} decidiu quando precisava.`,
        `Que sufoco. ${first?first+" apareceu na hora certa.":""}`,
        `A vitória veio difícil, mas veio. Vale ouro.`,
      ];
      return opts[0|r()*opts.length];
    }
  } else if(myG===oppG){
    if(myG===0){
      return ["Zero a zero. Pelo menos não perdeu.",
              "Nenhum gol, mas um ponto no bolso.",
              `O ${opp} tampou tudo e saiu com o empate.`][0|r()*3];
    }
    return [`${myG} a ${oppG}. Ia ganhar, tomou o gol de bobeira.`,
            `Empate com gols, mas dói. ${first?first+" marcou mas não foi suficiente.":""}`,
            `Deixou o ${opp} empatar. Faltou eficiência.`][0|r()*3];
  } else {
    if(oppG-myG>=3){
      return [`Tragédia total. O ${opp} goleou e o time sumiu.`,
              "Vexame completo. Que vergonha!",
              `O ${opp} foi superior em tudo. Dia pra esquecer.`][0|r()*3];
    }
    return [`Derrota por ${oppG-myG} gol(s). Deu para brigar, mas não deu.`,
            `O ${opp} levou. ${first?first+" marcou mas não salvou.":"Não foi o dia."}`,
            `Perdeu. Próxima rodada é diferente.`][0|r()*3];
  }
}

/* ─── PITCH ──────────────────────────────────────────────────────────────────── */
function Pitch({formation,players,compact=false}){
  const slots=FORMATIONS[formation]||FORMATIONS["4-3-3"];
  const assigned=assignToSlots(formation,players);
  return(
    <div style={{width:"100%",position:"relative"}}>
      <div style={{width:"100%",paddingBottom:compact?"130%":"155%",
        background:`repeating-linear-gradient(180deg,${C.greenDk} 0,${C.greenDk} 36px,${C.stripe} 36px,${C.stripe} 72px)`,
        borderRadius:8,border:`1.5px solid #0d3d1e`,position:"relative",overflow:"hidden"}}>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 100 155" preserveAspectRatio="none">
          <rect x="3" y="3" width="94" height="149" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth=".7"/>
          <line x1="3" y1="77.5" x2="97" y2="77.5" stroke="rgba(255,255,255,.28)" strokeWidth=".7"/>
          <circle cx="50" cy="77.5" r="13" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".7"/>
          <circle cx="50" cy="77.5" r="1.2" fill="rgba(255,255,255,.5)"/>
          <rect x="22" y="3" width="56" height="22" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".6"/>
          <rect x="32" y="3" width="36" height="11" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth=".5"/>
          <rect x="22" y="130" width="56" height="22" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".6"/>
          <rect x="32" y="141" width="36" height="11" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth=".5"/>
          <path d="M32 25 A13 13 0 0 0 68 25" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/>
          <path d="M32 130 A13 13 0 0 1 68 130" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/>
        </svg>
        {slots.map((slot,i)=>{
          const p=assigned[i];const col=groupColor(slot.group);const sz=compact?28:34;
          return(
            <div key={i} style={{position:"absolute",left:`${slot.x}%`,top:`${slot.y}%`,transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",zIndex:5}}>
              {p?(
                <div className="popIn" style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:sz,height:sz,borderRadius:"50%",background:col,border:"2px solid rgba(255,255,255,.92)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:compact?7:8,fontWeight:900,color:"#fff",fontFamily:F.display,boxShadow:"0 2px 8px rgba(0,0,0,.45)"}}>{p.shirt}</div>
                  <div style={{marginTop:2,background:"rgba(0,0,0,.78)",borderRadius:3,padding:"1px 4px",fontSize:compact?6:7.5,color:"#fff",fontWeight:700,whiteSpace:"nowrap",maxWidth:56,overflow:"hidden",textOverflow:"ellipsis",textAlign:"center"}}>
                    {p.name.split(" ").slice(-1)[0]}{p._year?` '${String(p._year).slice(-2)}`:""}
                  </div>
                </div>
              ):(
                <div style={{width:compact?26:34,height:compact?26:34,borderRadius:"50%",border:"1.5px dashed rgba(255,255,255,.45)",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.14)"}}>
                  <span style={{fontSize:compact?6:7.5,color:"rgba(255,255,255,.6)",fontWeight:700}}>{slot.slot}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── CONFETTI ───────────────────────────────────────────────────────────────── */
function Confetti(){
  const ps=Array.from({length:32},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*2,dur:1.8+Math.random()*1.5,color:[C.green,C.gold,C.black,C.white,"#FFD700","#009640"][i%6],size:5+Math.random()*8}));
  return(<div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:999}}>{ps.map(p=><div key={p.id} style={{position:"absolute",left:`${p.left}%`,top:-20,width:p.size,height:p.size,background:p.color,borderRadius:Math.random()>.5?"50%":"2px",animation:`confettiFall ${p.dur}s ease-in ${p.delay}s both`}}/>)}</div>);
}

/* ─── SLOT MACHINE ───────────────────────────────────────────────────────────── */
function SlotMachine({squads,onDone}){
  const IH=56,DUR=1400,CENTER=2;
  const initRef=useRef(null);
  if(!initRef.current){
    const chosen=squads[0|Math.random()*squads.length];
    const prefix=[...shuffle(squads),...shuffle(squads)];
    const landingIdx=prefix.length;
    const list=[...prefix,chosen,...shuffle(squads),...shuffle(squads)];
    const targetOffset=(landingIdx-CENTER)*IH;
    const extraSpin=Math.round(squads.length*2+Math.random()*squads.length)*IH;
    initRef.current={chosen,list,landingIdx,targetOffset,totalTravel:extraSpin+targetOffset};
  }
  const{chosen,list,targetOffset,totalTravel}=initRef.current;
  const[done,setDone]=useState(false);
  const listRef=useRef(null);
  const rafRef=useRef();
  useEffect(()=>{
    const t0=performance.now();
    const ease=t=>t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    const tick=now=>{
      const p=Math.min((now-t0)/DUR,1);
      if(listRef.current)listRef.current.style.transform=`translateY(-${ease(p)*totalTravel}px)`;
      if(p<1){rafRef.current=requestAnimationFrame(tick);}
      else{
        if(listRef.current)listRef.current.style.transform=`translateY(-${targetOffset}px)`;
        setDone(true);setTimeout(()=>onDone(chosen),600);
      }
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 20px",gap:14}}>
      <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:700}}>SORTEANDO ELENCO…</div>
      <div style={{width:"100%",maxWidth:300,height:IH*5,overflow:"hidden",
        border:`2px solid ${done?C.green:C.border}`,background:C.white,
        position:"relative",boxShadow:done?`0 0 0 3px ${C.green}28`:"none",transition:"border-color .4s,box-shadow .4s"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:64,background:"linear-gradient(to bottom,rgba(255,255,255,.97),transparent)",zIndex:3,pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:64,background:"linear-gradient(to top,rgba(255,255,255,.97),transparent)",zIndex:3,pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:IH*CENTER,left:0,right:0,height:IH,
          background:done?"rgba(0,150,64,0.06)":"rgba(0,0,0,0.025)",
          borderTop:`1.5px solid ${done?C.green:C.border}`,borderBottom:`1.5px solid ${done?C.green:C.border}`,
          zIndex:2,pointerEvents:"none",transition:"all .4s"}}/>
        <div ref={listRef} style={{willChange:"transform"}}>
          {list.map((sq,i)=>(
            <div key={i} style={{height:IH,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 18px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontFamily:F.display,fontSize:20,color:C.ink,letterSpacing:1,lineHeight:1}}>{sq.club}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2,fontWeight:500}}>{sq.year} · {sq.ed}</div>
            </div>
          ))}
        </div>
      </div>
      {done&&(
        <div className="fadeUp" style={{textAlign:"center"}}>
          {chosen.champion&&<div style={{fontSize:10,color:C.green,fontWeight:800,letterSpacing:2,marginBottom:3}}>🏆 ANO CAMPEÃO</div>}
          <div style={{fontFamily:F.display,fontSize:16,color:C.ink}}>{chosen.club} — {chosen.ed}</div>
        </div>
      )}
    </div>
  );
}

/* ─── REROLL ANIM ────────────────────────────────────────────────────────────── */
function RerollAnim({onDone}){
  useEffect(()=>{const t=setTimeout(onDone,600);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.94)",zIndex:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,borderRadius:8}}>
      <div className="rerollSpin" style={{fontSize:36}}>🎲</div>
      <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:700}}>SORTEANDO…</div>
    </div>
  );
}

/* ─── POS ORDER ──────────────────────────────────────────────────────────────── */
const POS_ORDER={GOL:0,ZAG:1,LD:2,LE:3,VOL:4,MC:5,MD:6,ME:7,CA:8};
function sortByPosition(team){return[...team].sort((a,b)=>(POS_ORDER[a.pos]??5)-(POS_ORDER[b.pos]??5));}

/* ─── HEADER ─────────────────────────────────────────────────────────────────── */
function Header({left=null,right=null,dark=false}){
  return(
    <div style={{background:dark?C.black:C.white,borderBottom:dark?"none":`1px solid ${C.border}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div style={{minWidth:56}}>{left}</div>
      <div style={{textAlign:"center"}}>
        <span style={{fontFamily:F.display,fontSize:18,color:dark?C.white:C.ink,letterSpacing:1,lineHeight:1}}>
          <span style={{color:C.green}}>BRASILEIRÃO</span> DRAFT
        </span>
      </div>
      <div style={{minWidth:56,textAlign:"right"}}>{right}</div>
    </div>
  );
}

/* ─── INTRO ──────────────────────────────────────────────────────────────────── */
function IntroScreen({onStart,history}){
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.white}}>
      <div style={{background:C.green,padding:"52px 28px 44px",position:"relative",overflow:"hidden"}}>
        <div style={{fontFamily:F.display,fontSize:64,color:C.white,lineHeight:.9,letterSpacing:-2}}>
          BRASILEIRÃO<br/>DRAFT
        </div>
        <div style={{marginTop:16,fontSize:13,color:"rgba(255,255,255,0.7)",fontFamily:F.body,lineHeight:1.5,maxWidth:280}}>
          Monte o time dos sonhos com os maiores craques da história do futebol brasileiro.
        </div>
        <div style={{position:"absolute",right:-10,bottom:-20,fontSize:120,opacity:.12,pointerEvents:"none",userSelect:"none"}}>⚽</div>
      </div>
      <div style={{flex:1,padding:"32px 24px",display:"flex",flexDirection:"column",gap:0}}>
        {[
          ["⚽","Sorteie elencos históricos dos grandes clubes do Brasil."],
          ["🏆","Dispute a Copa do Brasil virtual com seu time."],
          ["🎲","A força dos jogadores é o que vai te fazer campeão — ou não."],
        ].map(([icon,text],i,arr)=>(
          <div key={text} style={{display:"flex",gap:16,alignItems:"flex-start",padding:"20px 0",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
            <span style={{fontSize:20,lineHeight:1,marginTop:1,flexShrink:0}}>{icon}</span>
            <span style={{fontSize:15,color:C.ink,lineHeight:1.5,fontFamily:F.body,fontWeight:500}}>{text}</span>
          </div>
        ))}
        <button onClick={onStart} style={{
          marginTop:32,background:C.black,color:C.white,border:"none",
          padding:"18px 0",width:"100%",cursor:"pointer",
          fontFamily:F.display,fontSize:16,letterSpacing:2,transition:"background .15s",
        }}
          onMouseEnter={e=>e.currentTarget.style.background=C.green}
          onMouseLeave={e=>e.currentTarget.style.background=C.black}
        >ROLAR 🎲</button>
        {history.length>0&&(
          <div style={{marginTop:36}}>
            <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,marginBottom:12,fontFamily:F.body}}>HISTÓRICO</div>
            {history.slice(0,4).map((h,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,fontWeight:600,color:h.champ?C.green:C.ink,fontFamily:F.body}}>
                  {h.champ?"🏆 Campeão":h.phase?`❌ ${h.phase}`:"❌ Eliminado"}
                </span>
                <span style={{fontSize:11,color:C.muted,fontFamily:F.body}}>{h.date} · {h.formation}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── FORMATION PICK ─────────────────────────────────────────────────────────── */
function FormationPickScreen({onConfirm}){
  const[selected,setSelected]=useState("4-3-3");
  const descriptions={"4-3-3":"Três atacantes, domínio das laterais.","4-4-2":"Clássico e equilibrado. Dois pontas.","3-5-2":"Três zagueiros, cinco meios. Posse.","4-2-3-1":"Dois volantes, meia atrás do centroavante."};
  const slots=FORMATIONS[selected]||FORMATIONS["4-3-3"];
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.white}}>
      <Header/>
      <div style={{padding:"28px 24px 0",flexShrink:0}}>
        <div style={{fontFamily:F.display,fontSize:28,color:C.ink,lineHeight:1,letterSpacing:-0.5}}>
          Escolha sua<br/><span style={{color:C.green}}>formação</span>
        </div>
        <div style={{fontSize:13,color:C.muted,marginTop:8,fontFamily:F.body}}>Defina o esquema antes de montar o elenco.</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px 24px 120px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:28}}>
          {Object.keys(FORMATIONS).map(f=>(
            <div key={f} onClick={()=>setSelected(f)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
              <div>
                <div style={{fontFamily:F.display,fontSize:22,color:selected===f?C.green:C.ink,letterSpacing:-.5,lineHeight:1}}>{f}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:4,fontFamily:F.body}}>{descriptions[f]}</div>
              </div>
              <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${selected===f?C.green:C.faint}`,background:selected===f?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {selected===f&&<div style={{width:8,height:8,borderRadius:"50%",background:C.white}}/>}
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,marginBottom:12,fontFamily:F.body}}>PRÉVIA</div>
        <div style={{position:"relative",width:"100%"}}>
          <div style={{width:"100%",paddingBottom:"125%",background:`repeating-linear-gradient(180deg,${C.greenDk} 0,${C.greenDk} 36px,${C.stripe} 36px,${C.stripe} 72px)`,position:"relative",overflow:"hidden"}}>
            <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 100 125" preserveAspectRatio="none">
              <rect x="2" y="2" width="96" height="121" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".7"/>
              <line x1="2" y1="62.5" x2="98" y2="62.5" stroke="rgba(255,255,255,.22)" strokeWidth=".7"/>
              <circle cx="50" cy="62.5" r="12" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".6"/>
              <rect x="22" y="2" width="56" height="19" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/>
              <rect x="22" y="104" width="56" height="19" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/>
            </svg>
            {slots.map((slot,i)=>{const y=slot.y*(125/155);return(
              <div key={i} style={{position:"absolute",left:`${slot.x}%`,top:`${y}%`,transform:"translate(-50%,-50%)",zIndex:5}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:groupColor(slot.group),border:"2px solid rgba(255,255,255,.9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"#fff",fontFamily:F.body,boxShadow:"0 1px 6px rgba(0,0,0,.35)"}}>{slot.slot}</div>
              </div>
            );})}
          </div>
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"16px 24px",background:C.white,borderTop:`1px solid ${C.border}`,zIndex:50}}>
        <button onClick={()=>onConfirm(selected)} style={{
          background:C.black,color:C.white,border:"none",padding:"18px 0",width:"100%",cursor:"pointer",
          fontFamily:F.display,fontSize:15,letterSpacing:2,transition:"background .15s",
        }}
          onMouseEnter={e=>e.currentTarget.style.background=C.green}
          onMouseLeave={e=>e.currentTarget.style.background=C.black}
        >JOGAR COM {selected}</button>
      </div>
    </div>
  );
}

/* ─── DRAFT SCREEN ───────────────────────────────────────────────────────────── */
function DraftScreen({showSlot,squad,drawIdx,team,formation,rerolls,showReroll,onSlotDone,onPick,onReroll,afterReroll,usedYrs}){
  const avail=SQUADS.filter(s=>!usedYrs.includes(s.year)&&s.year!==squad?.year);
  const open=openGroups(formation,team);
  const progressDots=(
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      {Array.from({length:11}).map((_,i)=>(
        <div key={i} style={{width:i<drawIdx?20:i===drawIdx?8:6,height:6,background:i<drawIdx?C.green:i===drawIdx?C.ink:C.faint,transition:"all .3s"}}/>
      ))}
    </div>
  );
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.white}}>
      <Header left={progressDots} right={<span style={{fontFamily:F.display,fontSize:13,color:C.green,letterSpacing:1}}>{drawIdx+1}/11</span>}/>
      {showSlot?(
        <SlotMachine squads={avail.length>3?avail:SQUADS} onDone={onSlotDone}/>
      ):squad?(
        <>
          <div style={{background:squad.champion?C.green:C.black,padding:"20px 24px",flexShrink:0,position:"relative",overflow:"hidden"}}>
            {squad.champion&&<div style={{position:"absolute",right:20,top:"50%",transform:"translateY(-50%)",fontSize:48,opacity:.15,pointerEvents:"none"}}>🏆</div>}
            <div style={{fontSize:11,letterSpacing:3,color:"rgba(255,255,255,.5)",fontFamily:F.body,fontWeight:600,marginBottom:4}}>
              {squad.champion?"ANO CAMPEÃO · ":""}{squad.club.toUpperCase()} — {squad.year}
            </div>
            <div style={{fontFamily:F.display,fontSize:22,color:C.white,lineHeight:1,letterSpacing:-.5}}>{squad.ed}</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 16px 140px"}}>
            <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,marginBottom:12,fontFamily:F.body}}>
              ESCOLHA 1 JOGADOR
            </div>
            <div style={{position:"relative"}}>
              {showReroll&&<RerollAnim onDone={afterReroll}/>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {squad.players.map((p,i)=>{
                  const isOpen=true;
                  const grpCol=groupColor(posToGroup(p.pos));
                  return(
                    <div key={i} onClick={()=>isOpen&&onPick(p)}
                      style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"14px 14px",cursor:"pointer",
                        background:C.white,transition:"border-color .15s,transform .12s",position:"relative",
                        opacity:isOpen?1:0.4}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.green;e.currentTarget.style.transform="scale(1.01)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="scale(1)";}}>
                      <div style={{position:"absolute",top:10,right:10,fontFamily:F.display,fontSize:22,color:p.rating>=88?C.green:C.ink}}>{p.rating}</div>
                      <div style={{display:"inline-block",background:grpCol,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4,marginBottom:6,fontFamily:F.body}}>{p.pos}</div>
                      <div style={{fontWeight:600,fontSize:14,color:C.ink,fontFamily:F.body,lineHeight:1.2,paddingRight:32}}>{p.name}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:3,fontFamily:F.body}}>#{p.shirt} · {squad.year}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {rerolls>0&&(
              <button onClick={onReroll} style={{
                marginTop:16,width:"100%",background:"transparent",border:`1px solid ${C.border}`,
                padding:"12px 0",cursor:"pointer",fontFamily:F.body,fontSize:13,fontWeight:600,color:C.muted,borderRadius:4,transition:"border-color .15s",
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.ink}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
              >🎲 Rolar outro elenco ({rerolls} restantes)</button>
            )}
            {team.length>0&&(
              <div style={{marginTop:24}}>
                <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,marginBottom:10,fontFamily:F.body}}>ELENCO ATÉ AGORA</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {sortByPosition(team).map((p,i)=>{
                    const gc=groupColor(posToGroup(p.pos));
                    return(<div key={i} style={{fontSize:11,fontFamily:F.body,fontWeight:600,color:"#fff",background:gc,padding:"3px 8px",borderRadius:4}}>{p.name.split(" ").slice(-1)[0]}</div>);
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      ):null}
    </div>
  );
}

/* ─── LINEUP SCREEN ──────────────────────────────────────────────────────────── */
function LineupScreen({team,formation,setFormation,onSim}){
  const[tab,setTab]=useState("list");
  const sorted=sortByPosition(team);
  const overall=avgR(team).toFixed(1);
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.white}}>
      <Header/>
      <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{fontFamily:F.display,fontSize:26,color:C.ink,lineHeight:1,letterSpacing:-.5}}>
          Seu time <span style={{color:C.green}}>• {overall}</span>
        </div>
        <div style={{fontSize:13,color:C.muted,marginTop:6,fontFamily:F.body}}>{formation}</div>
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        {["list","pitch"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:"12px 0",background:"transparent",border:"none",cursor:"pointer",
            fontFamily:F.body,fontSize:12,fontWeight:700,letterSpacing:2,
            color:tab===t?C.ink:C.muted,borderBottom:tab===t?`2px solid ${C.green}`:"2px solid transparent",
          }}>{t==="list"?"ELENCO":"CAMPO"}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 0 110px"}}>
        {tab==="list"&&sorted.map((p,i)=>{
          const gc=groupColor(posToGroup(p.pos));
          return(
            <div key={i} style={{display:"flex",alignItems:"center",padding:"14px 24px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{background:gc,color:"#fff",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:4,minWidth:36,textAlign:"center",marginRight:14,fontFamily:F.body}}>{p.pos}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:C.ink,fontFamily:F.body}}>{p.name}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:F.body}}>{p._year&&`${p._club||""} ${p._year}`}{p._champion?" · 🏆":""}</div>
              </div>
              <div style={{fontFamily:F.display,fontSize:24,color:p.rating>=88?C.green:C.ink}}>{p.rating}</div>
            </div>
          );
        })}
        {tab==="pitch"&&<div style={{padding:"16px"}}><Pitch formation={formation} players={team}/></div>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"16px 24px",background:C.white,borderTop:`1px solid ${C.border}`,display:"flex",gap:10,zIndex:50}}>
        <button onClick={onSim} style={{
          flex:1,background:C.black,color:C.white,border:"none",
          padding:"16px 0",cursor:"pointer",fontFamily:F.display,fontSize:14,letterSpacing:2,transition:"background .15s",
        }}
          onMouseEnter={e=>e.currentTarget.style.background=C.green}
          onMouseLeave={e=>e.currentTarget.style.background=C.black}
        >DISPUTAR A COPA</button>
      </div>
    </div>
  );
}

/* ─── GROUP RESULT ───────────────────────────────────────────────────────────── */
function GroupResultCard({tournament,onContinue}){
  const{groupMatches,pts,gd,qualified,groupTable}=tournament;
  return(
    <div style={{padding:"24px"}}>
      <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body,marginBottom:20}}>FASE DE GRUPOS — CLASSIFICAÇÃO</div>
      <div style={{marginBottom:20}}>
        {groupTable.map((row,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`,background:row.isMy?"rgba(0,150,64,.04)":"transparent"}}>
            <div style={{width:20,fontFamily:F.display,fontSize:14,color:i<2?C.green:C.muted,marginRight:10}}>{i+1}</div>
            <div style={{flex:1,fontSize:13,fontWeight:600,color:row.isMy?C.green:C.ink,fontFamily:F.body}}>{row.flag} {row.name}</div>
            <div style={{display:"flex",gap:12,fontSize:12,color:C.muted,fontFamily:F.body}}>
              <span>{row.w}V {row.d}E {row.l}D</span>
              <span style={{fontWeight:700,color:C.ink}}>{row.pts}pts</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"16px",background:qualified?"rgba(0,150,64,.06)":"rgba(204,0,0,.06)",borderRadius:8,marginBottom:20,textAlign:"center"}}>
        <div style={{fontFamily:F.display,fontSize:18,color:qualified?C.green:C.red,letterSpacing:-.3}}>
          {qualified?"✅ CLASSIFICADO":"❌ ELIMINADO"}
        </div>
        <div style={{fontSize:12,color:C.muted,marginTop:4,fontFamily:F.body}}>
          {qualified?"Avançou para as oitavas de final.":"Não passou da fase de grupos."}
        </div>
      </div>
      <button onClick={onContinue} style={{
        background:C.black,color:C.white,border:"none",padding:"16px 0",width:"100%",cursor:"pointer",
        fontFamily:F.display,fontSize:14,letterSpacing:2,transition:"background .15s",
      }}
        onMouseEnter={e=>e.currentTarget.style.background=qualified?C.green:C.red}
        onMouseLeave={e=>e.currentTarget.style.background=C.black}
      >{qualified?"OITAVAS →":"VER RESULTADO"}</button>
    </div>
  );
}

/* ─── PENALTY SCREEN ─────────────────────────────────────────────────────────── */
function PenaltyScreen({penalties,opp,onContinue}){
  const{kicks,spWin,suddenDeath}=penalties;
  return(
    <div style={{padding:"24px"}}>
      <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body,marginBottom:16}}>DISPUTA DE PÊNALTIS</div>
      {kicks.map((k,i)=>(
        <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
          <span style={{minWidth:18,fontWeight:600,color:C.muted,fontFamily:F.body}}>{i+1}.</span>
          <span style={{flex:1,fontFamily:F.body,color:C.ink}}>{k.spName}</span>
          <span style={{fontSize:16}}>{k.spConvert?"✅":"❌"}</span>
          <span style={{fontSize:11,color:C.muted,fontFamily:F.body,minWidth:30,textAlign:"center"}}>{k.spScore}–{k.oppScore}</span>
          <span style={{fontSize:16}}>{k.oppConvert?"❌":"✅"}</span>
          <span style={{flex:1,textAlign:"right",fontFamily:F.body,color:C.muted,fontSize:12}}>{k.oppName}</span>
        </div>
      ))}
      <div style={{marginTop:20,textAlign:"center"}}>
        <div style={{fontFamily:F.display,fontSize:20,color:spWin?C.green:C.red}}>{spWin?"Passou nos pênaltis! ✅":"Eliminado nos pênaltis ❌"}</div>
        {suddenDeath&&<div style={{fontSize:12,color:C.muted,marginTop:4,fontFamily:F.body}}>Morte súbita</div>}
      </div>
      <button onClick={onContinue} style={{
        marginTop:20,background:C.black,color:C.white,border:"none",padding:"16px 0",width:"100%",cursor:"pointer",
        fontFamily:F.display,fontSize:14,letterSpacing:2,transition:"background .15s",
      }}
        onMouseEnter={e=>e.currentTarget.style.background=spWin?C.green:C.red}
        onMouseLeave={e=>e.currentTarget.style.background=C.black}
      >{spWin?"CONTINUAR →":"VER RESULTADO"}</button>
    </div>
  );
}

/* ─── SIM SCREEN ─────────────────────────────────────────────────────────────── */
function SimScreen({allMatches,matchIdx,livePhase,minute,spG,oppG,events,flash,tournament,penalties,onKickoff,onAdvance}){
  const m=allMatches[matchIdx];if(!m)return null;
  const isIdle=livePhase==="idle";
  const isLive=livePhase==="live";
  const isDone=livePhase==="done";
  const isGroup=m.phase==="group";
  const isKO=m.phase==="ko";
  const isGroupResult=livePhase==="groupResult";
  const isPenalties=livePhase==="penalties";
  const min2=String(minute).padStart(2,"0");
  const scoreBg=flash?"#004d20":C.black;
  function doneLabel(){
    if(isKO&&m.draw)return"PÊNALTIS →";
    if(!m.win&&isKO)return"VER RESULTADO";
    if(matchIdx>=6&&m.win)return"🏆 CAMPEÃO!";
    if(isGroup&&matchIdx<2)return"PRÓXIMO JOGO →";
    if(isGroup&&matchIdx===2)return"CLASSIFICAÇÃO →";
    return"CONTINUAR →";
  }
  const doneBg=(!m.win&&isKO&&!m.draw)?C.red:C.green;
  const doneFg=C.white;
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.white}}>
      <Header dark/>
      {matchIdx>0&&(
        <div style={{borderBottom:`1px solid ${C.border}`,padding:"8px 24px",display:"flex",gap:12,overflowX:"auto",flexShrink:0}}>
          {allMatches.slice(0,matchIdx).map((prev,i)=>(
            <div key={i} style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
              <span style={{fontSize:10,color:C.muted,fontWeight:600,fontFamily:F.body}}>{prev.phase==="group"?`G${i+1}`:prev.round?.slice(0,3).toUpperCase()}</span>
              <span style={{fontFamily:F.display,fontSize:14,color:prev.win?C.green:C.ink}}>{prev.myG}–{prev.oppG}</span>
              <span style={{fontSize:12}}>{prev.opp.flag}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{background:scoreBg,padding:"24px",transition:"background .5s",flexShrink:0}}>
        <div style={{textAlign:"center",marginBottom:12}}>
          <span style={{fontSize:10,letterSpacing:3,color:"rgba(255,255,255,.35)",fontFamily:F.body,fontWeight:600}}>
            {m.label?.toUpperCase()}
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:6}}>⚽</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.5)",fontWeight:600,fontFamily:F.body,letterSpacing:1}}>SEU TIME</div>
          </div>
          <div style={{textAlign:"center",minWidth:120}}>
            {isIdle
              ?<div style={{fontFamily:F.display,fontSize:44,color:"rgba(255,255,255,.2)",letterSpacing:4}}>–  –</div>
              :<div style={{fontFamily:F.display,fontSize:56,color:C.white,letterSpacing:6,lineHeight:1}}>{spG}  {oppG}</div>
            }
            {isLive&&(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:6}}>
                <div style={{width:6,height:6,background:C.green,animation:"pulse 1s infinite"}}/>
                <span style={{fontFamily:F.body,fontSize:12,color:"rgba(255,255,255,.5)",fontWeight:600,letterSpacing:2}}>{min2}'</span>
              </div>
            )}
            {isDone&&<div style={{fontSize:10,color:"rgba(255,255,255,.4)",fontWeight:600,fontFamily:F.body,letterSpacing:2,marginTop:6}}>{m.win?"VITÓRIA":m.draw&&isKO?"EMPATE":m.draw?"EMPATE":"DERROTA"}</div>}
          </div>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:6}}>{m.opp.flag}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.5)",fontWeight:600,fontFamily:F.body}}>{oppLabel(m.opp)}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.25)",marginTop:2,fontFamily:F.body}}>{m.opp.country}</div>
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 0 110px"}}>
        {isIdle&&(
          <div style={{padding:"48px 24px",textAlign:"center"}}>
            <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body,marginBottom:20}}>
              {isGroup?"FASE DE GRUPOS":m.round?.toUpperCase()}
            </div>
            <div style={{fontFamily:F.display,fontSize:26,color:C.ink,lineHeight:1.1,marginBottom:8,letterSpacing:-.5}}>
              ⚽ Seu Time<br/>×<br/>{m.opp.flag} {oppLabel(m.opp)}
            </div>
            <div style={{marginTop:32}}>
              <button onClick={onKickoff} style={{
                background:C.black,color:C.white,border:"none",
                padding:"18px 56px",cursor:"pointer",
                fontFamily:F.display,fontSize:15,letterSpacing:2,transition:"background .15s",
              }}
                onMouseEnter={e=>e.currentTarget.style.background=C.green}
                onMouseLeave={e=>e.currentTarget.style.background=C.black}
              >APITAR ▶</button>
            </div>
          </div>
        )}
        {isGroupResult&&<GroupResultCard tournament={tournament} onContinue={()=>onAdvance("groupResult")}/>}
        {isPenalties&&penalties&&<PenaltyScreen penalties={penalties} opp={m.opp} onContinue={()=>onAdvance("penalties")}/>}
        {(isLive||isDone)&&(
          <div>
            <div style={{padding:"12px 24px",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body}}>LANCES</span>
            </div>
            {events.length===0&&isLive&&(
              <div style={{padding:"32px 24px",textAlign:"center",color:C.muted,fontSize:13,fontFamily:F.body,animation:"pulse 2s infinite"}}>
                Aguardando lance…
              </div>
            )}
            {events.map((ev,i)=>{
              const isGoal=ev.type==="goal";const isCard=ev.type==="yellow"||ev.type==="red";
              const icon=isGoal?"⚽":ev.type==="yellow"?"🟨":"🟥";
              const nameColor=ev.type==="yellow"?C.yellow:ev.type==="red"?C.red:(ev.team==="my"?C.green:C.ink);
              return(
                <div key={i} className={i===0?"goalSlide":""} style={{
                  display:"flex",alignItems:"center",gap:isCard?10:14,
                  padding:isCard?"7px 24px":"13px 24px",
                  borderBottom:`1px solid ${C.border}`,
                  background:ev.team==="my"?(isCard?"rgba(0,150,64,.015)":"rgba(0,150,64,.03)"):C.white,
                  opacity:isCard?0.85:1,
                }}>
                  <span style={{fontFamily:F.body,fontSize:isCard?10:12,color:C.muted,fontWeight:600,minWidth:28}}>{ev.min}'</span>
                  <span style={{fontSize:isCard?12:16}}>{icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:isCard?11:14,fontWeight:600,color:nameColor,fontFamily:F.body}}>{ev.name}</div>
                    {!isCard&&<div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:F.body}}>{ev.team==="my"?ev.pos:ev.club}</div>}
                    {isCard&&<div style={{fontSize:10,color:C.muted,fontFamily:F.body}}>{ev.type==="yellow"?"Cartão Amarelo":"Cartão Vermelho"}</div>}
                  </div>
                  <span style={{fontSize:isCard?13:18}}>{ev.team==="my"?"⚽":m.opp.flag}</span>
                </div>
              );
            })}
            {isLive&&(
              <div style={{padding:"14px 24px",display:"flex",gap:8,alignItems:"center"}}>
                <div style={{width:6,height:6,background:C.green,animation:"pulse 1s infinite",flexShrink:0}}/>
                <span style={{fontSize:12,color:C.muted,fontWeight:500,fontFamily:F.body}}>{min2}' em andamento</span>
              </div>
            )}
            {isDone&&!isGroupResult&&!isPenalties&&(
              <div className="fadeUp" style={{padding:"16px 24px",borderTop:`2px solid ${C.border}`,background:"#FAFAFA"}}>
                <div style={{fontSize:9,letterSpacing:2,color:C.muted,fontWeight:700,marginBottom:6,fontFamily:F.body}}>ANÁLISE DA PARTIDA</div>
                <div style={{fontSize:13,color:C.ink,fontFamily:F.body,lineHeight:1.55,fontStyle:"italic"}}>
                  "{generateMatchCommentary(m,m.myG,m.oppG,m.evs)}"
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {isDone&&!isGroupResult&&!isPenalties&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"16px 24px",background:C.white,borderTop:`1px solid ${C.border}`,zIndex:50}}>
          <button onClick={()=>onAdvance("done")} style={{
            background:doneBg,color:doneFg,border:"none",
            padding:"18px 0",width:"100%",cursor:"pointer",
            fontFamily:F.display,fontSize:15,letterSpacing:2,
          }}>{doneLabel()}</button>
        </div>
      )}
    </div>
  );
}

/* ─── RESULT SCREEN ──────────────────────────────────────────────────────────── */
function ResultScreen({champ,elimPhase,allMatches,team,formation,tournament,onRestart,onHome}){
  const[tab,setTab]=useState("camp");
  const sorted=sortByPosition(team);
  const overall=avgR(team).toFixed(1);
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.white}}>
      {champ&&<Confetti/>}
      <div style={{background:champ?C.green:C.black,padding:"36px 24px",flexShrink:0,position:"relative"}}>
        {champ?(
          <>
            <div className="trophy" style={{fontSize:52,textAlign:"center",display:"block",marginBottom:8}}>🏆</div>
            <div style={{fontFamily:F.display,fontSize:36,color:C.white,textAlign:"center",letterSpacing:-1}}>CAMPEÃO!</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.6)",textAlign:"center",marginTop:6,fontFamily:F.body}}>Seu time conquistou a Copa do Brasil.</div>
          </>
        ):(
          <>
            <div style={{fontFamily:F.display,fontSize:28,color:C.white,letterSpacing:-1}}>😤 ELIMINADO</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.5)",marginTop:6,fontFamily:F.body}}>Caiu {elimPhase?"nas "+elimPhase:"na fase de grupos"}.</div>
          </>
        )}
        <div style={{textAlign:"center",marginTop:12,fontSize:12,color:"rgba(255,255,255,.4)",fontFamily:F.body}}>
          {formation} · Média {overall}
        </div>
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        {["camp","squad","pitch"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:"12px 0",background:"transparent",border:"none",cursor:"pointer",
            fontFamily:F.body,fontSize:11,fontWeight:700,letterSpacing:2,
            color:tab===t?C.ink:C.muted,borderBottom:tab===t?`2px solid ${C.green}`:"2px solid transparent",
          }}>{t==="camp"?"CAMPANHA":t==="squad"?"ELENCO":"CAMPO"}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 0 110px"}}>
        {tab==="camp"&&allMatches.map((m,i)=>(
          <div key={i} style={{borderBottom:`1px solid ${C.border}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2,fontWeight:600,fontFamily:F.body,marginBottom:4}}>{m.phase==="group"?`GRUPO — JOGO ${i+1}`:m.round?.toUpperCase()}</div>
              <div style={{fontSize:14,fontWeight:600,color:C.ink,fontFamily:F.body}}>{m.opp.flag} {oppLabel(m.opp)}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:F.body}}>{m.opp.country}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:F.display,fontSize:28,color:m.win?C.green:C.ink,letterSpacing:1}}>{m.myG}–{m.oppG}</div>
              <div style={{fontSize:10,fontWeight:700,color:m.win?C.green:m.draw?C.muted:C.red,fontFamily:F.body,letterSpacing:1}}>{m.win?"VITÓRIA":m.draw?"EMPATE":"DERROTA"}</div>
            </div>
          </div>
        ))}
        {tab==="squad"&&sorted.map((p,i)=>{
          const gc=groupColor(posToGroup(p.pos));
          return(
            <div key={i} style={{display:"flex",alignItems:"center",padding:"14px 24px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{background:gc,color:"#fff",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:4,minWidth:36,textAlign:"center",marginRight:14,fontFamily:F.body}}>{p.pos}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:C.ink,fontFamily:F.body}}>{p.name}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:F.body}}>{p._year}{p._champion?" · 🏆":""}</div>
              </div>
              <div style={{fontFamily:F.display,fontSize:24,color:p.rating>=88?C.green:C.ink}}>{p.rating}</div>
            </div>
          );
        })}
        {tab==="pitch"&&<div style={{padding:"16px"}}><Pitch formation={formation} players={team}/></div>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"16px 24px",background:C.white,borderTop:`1px solid ${C.border}`,display:"flex",gap:10,zIndex:50}}>
        <button onClick={onRestart} style={{
          flex:1,background:C.black,color:C.white,border:"none",
          padding:"16px 0",cursor:"pointer",fontFamily:F.display,fontSize:14,letterSpacing:2,transition:"background .15s",
        }}
          onMouseEnter={e=>e.currentTarget.style.background=C.green}
          onMouseLeave={e=>e.currentTarget.style.background=C.black}
        >ROLAR DE NOVO</button>
        <button onClick={onHome} style={{flex:.45,background:"transparent",color:C.muted,border:`1px solid ${C.border}`,padding:"16px 0",cursor:"pointer",fontFamily:F.body,fontSize:12,fontWeight:600}}>Início</button>
      </div>
    </div>
  );
}

/* ─── HISTORY HELPERS ────────────────────────────────────────────────────────── */
function loadHistory(){try{return JSON.parse(localStorage.getItem("brasileirao_draft_hist")||"[]");}catch{return[];}}
function saveHist(entry){try{const h=loadHistory();h.unshift(entry);localStorage.setItem("brasileirao_draft_hist",JSON.stringify(h.slice(0,10)));}catch{}}

/* ─── ROOT APP ───────────────────────────────────────────────────────────────── */
export default function App(){
  const[phase,setPhase]=useState("intro");
  const[formation,setFormation]=useState("4-3-3");
  const[squad,setSquad]=useState(null);
  const[team,setTeam]=useState([]);
  const[drawIdx,setDrawIdx]=useState(0);
  const[usedYrs,setUsedYrs]=useState([]);
  const[rerolls,setRerolls]=useState(2);
  const[showSlot,setShowSlot]=useState(false);
  const[showReroll,setShowReroll]=useState(false);
  const[tournament,setTournament]=useState(null);
  const[matchIdx,setMatchIdx]=useState(0);
  const[livePhase,setLivePhase]=useState("idle");
  const[minute,setMinute]=useState(0);
  const[spG,setSpG]=useState(0);
  const[oppG,setOppG]=useState(0);
  const[events,setEvents]=useState([]);
  const[flash,setFlash]=useState(false);
  const[penalties,setPenalties]=useState(null);
  const[champ,setChamp]=useState(false);
  const[eliminated,setEliminated]=useState(false);
  const[elimPhaseState,setElimPhaseState]=useState("");
  const[history,setHistory]=useState(()=>loadHistory());

  function newGame(){
    setPhase("formation-pick");
    setTeam([]);setDrawIdx(0);setUsedYrs([]);setRerolls(2);
    setSquad(null);setShowSlot(false);setShowReroll(false);
    setTournament(null);setMatchIdx(0);setLivePhase("idle");
    setMinute(0);setSpG(0);setOppG(0);setEvents([]);setFlash(false);
    setPenalties(null);setChamp(false);setEliminated(false);setElimPhaseState("");
  }
  function confirmFormation(f){setFormation(f);setPhase("draft");setShowSlot(true);}
  function handleSlotDone(chosen){setSquad(chosen);setShowSlot(false);}
  function pickPlayer(p){
    const e={...p,_year:squad.year,_club:squad.club,_edition:squad.ed,_champion:squad.champion};
    const next=[...team,e];setTeam(next);
    const ni=drawIdx+1;setDrawIdx(ni);
    if(ni>=11){setPhase("lineup");}
    else{setUsedYrs(u=>[...u,squad.year]);setSquad(null);setShowSlot(true);}
  }
  function doReroll(){if(rerolls<=0)return;setRerolls(r=>r-1);setShowReroll(true);}
  function afterReroll(){
    setShowReroll(false);
    const avail=SQUADS.filter(s=>!usedYrs.includes(s.year)&&s.year!==squad?.year);
    if(!avail.length)return;
    setSquad(avail[0|Math.random()*avail.length]);
  }
  function startSim(){const t=buildTournament(team);setTournament(t);setMatchIdx(0);setLivePhase("idle");setPhase("sim");}

  const allMatches=tournament?[...tournament.groupMatches,...tournament.koMatches]:[];
  const currentMatch=allMatches[matchIdx]||null;

  useEffect(()=>{
    if(phase!=="sim"||livePhase!=="live"||!currentMatch)return;
    const timer=setInterval(()=>{
      setMinute(m=>{
        const nx=m+1;
        currentMatch.evs.filter(e=>e.min===nx).forEach(ev=>{
          if(ev.type==="goal"){
            if(ev.team==="my")setSpG(g=>g+1);else setOppG(g=>g+1);
            setFlash(true);setTimeout(()=>setFlash(false),600);
          }
          setEvents(prev=>[ev,...prev]);
        });
        if(nx>=90){clearInterval(timer);setTimeout(()=>setLivePhase("done"),700);}
        return nx;
      });
    },50);
    return()=>clearInterval(timer);
  },[livePhase,matchIdx,currentMatch,phase]);

  function kickoff(){setMinute(0);setSpG(0);setOppG(0);setEvents([]);setFlash(false);setPenalties(null);setLivePhase("live");}

  function advance(currentPhase){
    const m=currentMatch;if(!m)return;
    if(currentPhase==="groupResult"){
      if(!tournament.qualified){
        setEliminated(true);setElimPhaseState("Fase de Grupos");
        const h={date:new Date().toLocaleDateString("pt-BR"),champ:false,phase:"Grupos",formation};
        saveHist(h);setHistory(loadHistory());setPhase("result");
      } else {setMatchIdx(3);setLivePhase("idle");}
      return;
    }
    if(currentPhase==="penalties"){
      const pen=penalties;
      if(!pen?.spWin){
        setEliminated(true);setElimPhaseState(m.round||"");
        const h={date:new Date().toLocaleDateString("pt-BR"),champ:false,phase:m.round,formation};
        saveHist(h);setHistory(loadHistory());setPhase("result");
      } else if(matchIdx>=6){
        setChamp(true);
        const h={date:new Date().toLocaleDateString("pt-BR"),champ:true,phase:"Campeão",formation};
        saveHist(h);setHistory(loadHistory());setPhase("result");
      } else {setMatchIdx(i=>i+1);setLivePhase("idle");}
      return;
    }
    const isGroup=m.phase==="group";const isLastGrp=isGroup&&matchIdx===2;
    const isKO=m.phase==="ko";const isLastKO=isKO&&matchIdx===6;
    if(isGroup&&!isLastGrp){setMatchIdx(i=>i+1);setLivePhase("idle");}
    else if(isLastGrp){setLivePhase("groupResult");}
    else if(isKO){
      if(m.draw){const pen=buildPenalties(team,m.opp);setPenalties(pen);setLivePhase("penalties");return;}
      if(!m.win){
        setEliminated(true);setElimPhaseState(m.round||"");
        const h={date:new Date().toLocaleDateString("pt-BR"),champ:false,phase:m.round,formation};
        saveHist(h);setHistory(loadHistory());setPhase("result");
      } else if(isLastKO){
        setChamp(true);
        const h={date:new Date().toLocaleDateString("pt-BR"),champ:true,phase:"Campeão",formation};
        saveHist(h);setHistory(loadHistory());setPhase("result");
      } else {setMatchIdx(i=>i+1);setLivePhase("idle");}
    }
  }

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:F.body,maxWidth:480,margin:"0 auto"}}>
      {phase==="intro"&&<IntroScreen onStart={newGame} history={history}/>}
      {phase==="formation-pick"&&<FormationPickScreen onConfirm={confirmFormation}/>}
      {phase==="draft"&&<DraftScreen showSlot={showSlot} squad={squad} drawIdx={drawIdx} team={team} formation={formation} rerolls={rerolls} showReroll={showReroll} onSlotDone={handleSlotDone} onPick={pickPlayer} onReroll={doReroll} afterReroll={afterReroll} usedYrs={usedYrs}/>}
      {phase==="lineup"&&<LineupScreen team={team} formation={formation} setFormation={setFormation} onSim={startSim}/>}
      {phase==="sim"&&tournament&&<SimScreen allMatches={allMatches} matchIdx={matchIdx} livePhase={livePhase} minute={minute} spG={spG} oppG={oppG} events={events} flash={flash} tournament={tournament} penalties={penalties} onKickoff={kickoff} onAdvance={(ph)=>advance(ph)}/>}
      {phase==="result"&&<ResultScreen champ={champ} elimPhase={elimPhaseState} allMatches={allMatches.slice(0,matchIdx+1)} team={team} formation={formation} tournament={tournament} onRestart={newGame} onHome={()=>setPhase("intro")}/>}
    </div>
  );
}
