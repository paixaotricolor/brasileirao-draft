import { useState, useEffect, useRef } from "react";

/* ─── FONTS & GLOBAL CSS ─────────────────────────────────────────────────── */
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
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes popIn{0%{transform:scale(.75);opacity:0}65%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes trophy{0%{transform:scale(0) rotate(-12deg);opacity:0}70%{transform:scale(1.1) rotate(2deg)}100%{transform:scale(1) rotate(0);opacity:1}}
    @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(540deg);opacity:0}}
    @keyframes slideIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
    .fadeUp{animation:fadeUp .28s ease both}
    .popIn{animation:popIn .32s cubic-bezier(.34,1.56,.64,1) both}
    .trophy{animation:trophy .5s cubic-bezier(.34,1.56,.64,1) both}
    .slideIn{animation:slideIn .22s ease both}
  `;
  document.head.appendChild(s);
})();

/* ─── TOKENS ─────────────────────────────────────────────────────────────── */
const C = {
  bg:"#FFFFFF", border:"#E8E8E8", surface:"#F6F6F4",
  green:"#009640", greenDk:"#1E4A26", stripe:"#1A7A38",
  gold:"#FFD700", yellow:"#E5A200",
  black:"#0A0A0A", ink:"#111111", muted:"#888888", faint:"#CCCCCC",
  red:"#CC0000",
};
const F = { display:"'Archivo Black',sans-serif", body:"'Inter',sans-serif" };

/* ─── POSIÇÕES ───────────────────────────────────────────────────────────── */
// Grupos para cores no campo
const POS_GROUP = p => {
  if(p==="GOL") return "GOL";
  if(["ZAG","LD","LE"].includes(p)) return "DEF";
  if(["VOL","MC","MD","ME"].includes(p)) return "MID";
  return "ATK";
};
const GROUP_COLOR = g => g==="GOL"?C.yellow:g==="DEF"?C.green:g==="MID"?"#1A5FAA":"#CC0000";

// Quais posições cada slot aceita (por compatibilidade tática)
const SLOT_ACCEPTS = {
  GOL:["GOL"],
  LD: ["LD","ZAG"],
  LE: ["LE","ZAG"],
  ZAG:["ZAG","LD","LE"],
  VOL:["VOL","MC"],
  MC: ["MC","VOL","MD","ME"],
  MD: ["MD","MC","CA","ME"],
  ME: ["ME","MC","CA","MD"],
  CA: ["CA","ME","MD"],
};

/* ─── FORMAÇÕES ──────────────────────────────────────────────────────────── */
// Cada slot: { slot, group, x(%), y(%) } — y=0 é ataque, y=100 é gol
const FORMATIONS = {
  "4-3-3":[
    {slot:"GOL",group:"GOL",x:50,y:87},
    {slot:"LD",group:"DEF",x:80,y:72},{slot:"ZAG",group:"DEF",x:62,y:74},
    {slot:"ZAG",group:"DEF",x:38,y:74},{slot:"LE",group:"DEF",x:20,y:72},
    {slot:"VOL",group:"MID",x:50,y:54},{slot:"MD",group:"MID",x:76,y:48},{slot:"ME",group:"MID",x:24,y:48},
    {slot:"CA",group:"ATK",x:76,y:26},{slot:"CA",group:"ATK",x:50,y:23},{slot:"CA",group:"ATK",x:24,y:26},
  ],
  "4-4-2":[
    {slot:"GOL",group:"GOL",x:50,y:87},
    {slot:"LD",group:"DEF",x:82,y:72},{slot:"ZAG",group:"DEF",x:62,y:74},
    {slot:"ZAG",group:"DEF",x:38,y:74},{slot:"LE",group:"DEF",x:18,y:72},
    {slot:"MD",group:"MID",x:82,y:50},{slot:"MC",group:"MID",x:60,y:50},
    {slot:"MC",group:"MID",x:40,y:50},{slot:"ME",group:"MID",x:18,y:50},
    {slot:"CA",group:"ATK",x:62,y:26},{slot:"CA",group:"ATK",x:38,y:26},
  ],
  "3-5-2":[
    {slot:"GOL",group:"GOL",x:50,y:87},
    {slot:"ZAG",group:"DEF",x:70,y:74},{slot:"ZAG",group:"DEF",x:50,y:76},{slot:"ZAG",group:"DEF",x:30,y:74},
    {slot:"MD",group:"MID",x:88,y:52},{slot:"VOL",group:"MID",x:68,y:52},
    {slot:"VOL",group:"MID",x:50,y:50},{slot:"VOL",group:"MID",x:32,y:52},{slot:"ME",group:"MID",x:12,y:52},
    {slot:"CA",group:"ATK",x:62,y:26},{slot:"CA",group:"ATK",x:38,y:26},
  ],
  "4-2-3-1":[
    {slot:"GOL",group:"GOL",x:50,y:87},
    {slot:"LD",group:"DEF",x:82,y:72},{slot:"ZAG",group:"DEF",x:62,y:74},
    {slot:"ZAG",group:"DEF",x:38,y:74},{slot:"LE",group:"DEF",x:18,y:72},
    {slot:"VOL",group:"MID",x:63,y:60},{slot:"VOL",group:"MID",x:37,y:60},
    {slot:"MD",group:"MID",x:80,y:40},{slot:"MC",group:"MID",x:50,y:38},{slot:"ME",group:"MID",x:20,y:40},
    {slot:"CA",group:"ATK",x:50,y:20},
  ],
};

/* ─── BANCO DE LENDAS ────────────────────────────────────────────────────── */
// Cada jogador: { id, name, positions[], rating, years }
// positions[] = todas as posições onde pode ser escalado
// ════════════════════════════════════════════════════════════════
// 📌 CUSTOMIZAÇÃO: adicione/remova jogadores aqui.
//    rating: 60–99  |  positions: array de siglas válidas
// ════════════════════════════════════════════════════════════════
const CLUBS = {
  // ── SÃO PAULO ──────────────────────────────────────────────
  "São Paulo": {
    fullName: "São Paulo Futebol Clube",
    color: "#CC0000",
    badge: "⚪🔴",
    legends: [
      {id:"sp01", name:"Rogério Ceni",    positions:["GOL"],          rating:90, years:"1990–2015"},
      {id:"sp02", name:"Zetti",           positions:["GOL"],          rating:83, years:"1988–1999"},
      {id:"sp03", name:"Cafu",            positions:["LD"],           rating:92, years:"1989–1994"},
      {id:"sp04", name:"Lúcio",           positions:["ZAG"],          rating:88, years:"2011–2012"},
      {id:"sp05", name:"Adílson",         positions:["ZAG"],          rating:81, years:"1988–1995"},
      {id:"sp06", name:"Ronaldão",        positions:["ZAG"],          rating:80, years:"1988–1994"},
      {id:"sp07", name:"Belletti",        positions:["LD","ZAG"],     rating:82, years:"2000–2004"},
      {id:"sp08", name:"Jorge Wagner",    positions:["LE","LD"],      rating:79, years:"2003–2009"},
      {id:"sp09", name:"Toninho Cerezo",  positions:["VOL","MC"],     rating:85, years:"1978–1985"},
      {id:"sp10", name:"Pintado",         positions:["VOL","MC"],     rating:80, years:"1989–1996"},
      {id:"sp11", name:"Jean",            positions:["VOL"],          rating:79, years:"2005–2010"},
      {id:"sp12", name:"Sócrates",        positions:["MC","CA"],      rating:95, years:"1978–1984"},
      {id:"sp13", name:"Raí",             positions:["MC","ME"],      rating:92, years:"1986–1993"},
      {id:"sp14", name:"Kaká",            positions:["MC","MD"],      rating:94, years:"2001–2003"},
      {id:"sp15", name:"Hernanes",        positions:["MC","ME"],      rating:86, years:"2006–2013"},
      {id:"sp16", name:"Danilo",          positions:["MC","VOL"],     rating:80, years:"2004–2009"},
      {id:"sp17", name:"Müller",          positions:["CA","MD"],      rating:86, years:"1985–1994"},
      {id:"sp18", name:"Luís Fabiano",    positions:["CA"],           rating:89, years:"2006–2013"},
      {id:"sp19", name:"Serginho",        positions:["ME","MD"],      rating:82, years:"1991–1997"},
      {id:"sp20", name:"Palhinha (SPFC)", positions:["MD","ME"],      rating:79, years:"1989–1995"},
      {id:"sp21", name:"Miranda",         positions:["ZAG"],          rating:85, years:"2011–2014"},
      {id:"sp22", name:"Dagoberto",       positions:["CA","ME"],      rating:80, years:"2007–2010"},
    ],
  },

  // ── PALMEIRAS ──────────────────────────────────────────────
  "Palmeiras": {
    fullName: "Sociedade Esportiva Palmeiras",
    color: "#006437",
    badge: "🟢⚪",
    legends: [
      {id:"pal01", name:"Marcos",         positions:["GOL"],          rating:90, years:"1993–2012"},
      {id:"pal02", name:"Weverton",       positions:["GOL"],          rating:87, years:"2017–hoje"},
      {id:"pal03", name:"Cafu",           positions:["LD"],           rating:91, years:"1989–1994"},
      {id:"pal04", name:"Mayke",          positions:["LD","ZAG"],     rating:81, years:"2017–hoje"},
      {id:"pal05", name:"Antônio Carlos", positions:["ZAG"],          rating:83, years:"2017–2020"},
      {id:"pal06", name:"Gustavo Gómez",  positions:["ZAG"],          rating:87, years:"2019–hoje"},
      {id:"pal07", name:"Cléber (Pal.)",  positions:["ZAG"],          rating:80, years:"1992–1995"},
      {id:"pal08", name:"Arce (Pal.)",    positions:["LE","ZAG"],     rating:80, years:"1994–1996"},
      {id:"pal09", name:"Piquerez",       positions:["LE"],           rating:84, years:"2021–hoje"},
      {id:"pal10", name:"Zinho (Pal.)",   positions:["MC","VOL"],     rating:91, years:"1991–1994"},
      {id:"pal11", name:"Felipe Melo",    positions:["VOL","MC"],     rating:84, years:"2017–2022"},
      {id:"pal12", name:"Danilo (Pal.)",  positions:["VOL","MC"],     rating:85, years:"2021–hoje"},
      {id:"pal13", name:"Raphael Veiga",  positions:["MC","ME"],      rating:88, years:"2019–hoje"},
      {id:"pal14", name:"Zé Rafael",      positions:["MC","VOL"],     rating:83, years:"2019–hoje"},
      {id:"pal15", name:"Rivaldo",        positions:["ME","MC"],      rating:96, years:"1993–1994"},
      {id:"pal16", name:"Dudu",           positions:["MD","ME","CA"], rating:86, years:"2015–hoje"},
      {id:"pal17", name:"Willian (Pal.)", positions:["MD","ME"],      rating:87, years:"2016–2019"},
      {id:"pal18", name:"Gustavo Scarpa", positions:["ME","MC"],      rating:85, years:"2021–2022"},
      {id:"pal19", name:"Evair",          positions:["CA"],           rating:89, years:"1992–1995"},
      {id:"pal20", name:"Edmundo",        positions:["CA","ME"],      rating:92, years:"1992–1995"},
      {id:"pal21", name:"Rony",           positions:["CA","ME"],      rating:84, years:"2020–hoje"},
    ],
  },

  // ── CORINTHIANS ────────────────────────────────────────────
  "Corinthians": {
    fullName: "Sport Club Corinthians Paulista",
    color: "#000000",
    badge: "⚫⚪",
    legends: [
      {id:"cor01", name:"Cássio",             positions:["GOL"],          rating:88, years:"2012–2023"},
      {id:"cor02", name:"Dida (Cor.)",         positions:["GOL"],          rating:87, years:"1995–1999"},
      {id:"cor03", name:"Fágner",             positions:["LD"],           rating:82, years:"2012–2023"},
      {id:"cor04", name:"Rogério (Cor.)",     positions:["LD","ZAG"],     rating:79, years:"1997–2001"},
      {id:"cor05", name:"Gamarra",            positions:["ZAG"],          rating:86, years:"1997–2001"},
      {id:"cor06", name:"Pablo (Cor.)",       positions:["ZAG"],          rating:82, years:"2017–2020"},
      {id:"cor07", name:"Balbuena",           positions:["ZAG"],          rating:83, years:"2016–2018"},
      {id:"cor08", name:"Guilherme Arana",    positions:["LE","MD"],      rating:81, years:"2016–2018"},
      {id:"cor09", name:"Silvinho (Cor.)",    positions:["LE"],           rating:82, years:"1997–2001"},
      {id:"cor10", name:"Vampeta",            positions:["VOL","MC"],     rating:85, years:"1997–2001"},
      {id:"cor11", name:"Maycon",             positions:["VOL","MC"],     rating:82, years:"2017–2019"},
      {id:"cor12", name:"Gabriel (Cor.)",     positions:["VOL","MC"],     rating:82, years:"2017–2023"},
      {id:"cor13", name:"Sócrates (Cor.)",    positions:["MC","CA"],      rating:95, years:"1978–1984"},
      {id:"cor14", name:"Marcelinho Carioca", positions:["MC","MD"],      rating:89, years:"1995–1999"},
      {id:"cor15", name:"Freddy Rincón",      positions:["MC","VOL"],     rating:86, years:"1995–1996"},
      {id:"cor16", name:"Rodriguinho",        positions:["MC","ME"],      rating:84, years:"2016–2018"},
      {id:"cor17", name:"Edilson (Cor.)",     positions:["MD","ME"],      rating:83, years:"1997–2001"},
      {id:"cor18", name:"Romero",             positions:["MD","CA"],      rating:82, years:"2015–2019"},
      {id:"cor19", name:"Tevez",              positions:["CA","ME"],      rating:89, years:"2005–2006"},
      {id:"cor20", name:"Ronaldo (1998)",     positions:["CA"],           rating:98, years:"1998"},
      {id:"cor21", name:"Luizão",             positions:["CA"],           rating:85, years:"1997–2001"},
    ],
  },

  // ── FLAMENGO ───────────────────────────────────────────────
  "Flamengo": {
    fullName: "Clube de Regatas do Flamengo",
    color: "#CC0000",
    badge: "🔴⚫",
    legends: [
      {id:"fla01", name:"Diego Alves",    positions:["GOL"],          rating:86, years:"2016–2021"},
      {id:"fla02", name:"Alisson (Fla.)", positions:["GOL"],          rating:88, years:"2013–2015"},
      {id:"fla03", name:"Leandro",        positions:["LD"],           rating:88, years:"1975–1990"},
      {id:"fla04", name:"Rafinha (Fla.)", positions:["LD"],           rating:83, years:"2019–2020"},
      {id:"fla05", name:"Leo Moura",      positions:["LD","ZAG"],     rating:81, years:"2003–2014"},
      {id:"fla06", name:"David Luiz",     positions:["ZAG"],          rating:84, years:"2021–2022"},
      {id:"fla07", name:"Rodrigo Caio",   positions:["ZAG"],          rating:85, years:"2019–2022"},
      {id:"fla08", name:"Mozer",          positions:["ZAG"],          rating:84, years:"1980–1991"},
      {id:"fla09", name:"Júnior",         positions:["LE","MD"],      rating:92, years:"1972–1991"},
      {id:"fla10", name:"Filipe Luís",    positions:["LE"],           rating:88, years:"2019–2022"},
      {id:"fla11", name:"Willian Arão",   positions:["VOL","MC"],     rating:84, years:"2017–2022"},
      {id:"fla12", name:"Andrade (Fla.)", positions:["VOL","MC"],     rating:84, years:"1978–1989"},
      {id:"fla13", name:"Adílio",         positions:["MC","ME"],      rating:88, years:"1977–1988"},
      {id:"fla14", name:"Gerson (Fla.)",  positions:["MC","VOL"],     rating:86, years:"2019–2022"},
      {id:"fla15", name:"Zico",           positions:["MC","CA"],      rating:99, years:"1971–1989"},
      {id:"fla16", name:"Diego Ribas",    positions:["MC","ME"],      rating:83, years:"2017–2021"},
      {id:"fla17", name:"Éverton Ribeiro",positions:["MD","MC","ME"], rating:88, years:"2017–2022"},
      {id:"fla18", name:"Arrascaeta",     positions:["ME","MC"],      rating:90, years:"2019–hoje"},
      {id:"fla19", name:"Bruno Henrique", positions:["ME","CA"],      rating:89, years:"2019–2022"},
      {id:"fla20", name:"Romário (Fla.)", positions:["CA"],           rating:96, years:"1987–1988"},
      {id:"fla21", name:"Adriano Imp.",   positions:["CA"],           rating:91, years:"2009–2010"},
      {id:"fla22", name:"Gabigol",        positions:["CA","ME"],      rating:91, years:"2019–2023"},
      {id:"fla23", name:"Pedro (Fla.)",   positions:["CA"],           rating:87, years:"2021–hoje"},
    ],
  },

  // ── SANTOS ─────────────────────────────────────────────────
  "Santos": {
    fullName: "Santos Futebol Clube",
    color: "#1C1C1C",
    badge: "⚪⚫",
    legends: [
      {id:"san01", name:"Gilmar",         positions:["GOL"],          rating:90, years:"1953–1969"},
      {id:"san02", name:"Vanderlei",      positions:["GOL"],          rating:83, years:"1994–2004"},
      {id:"san03", name:"Ruy (Santos)",   positions:["LD","ZAG"],     rating:80, years:"1960–1972"},
      {id:"san04", name:"Edu (LD)",       positions:["LD"],           rating:80, years:"1958–1973"},
      {id:"san05", name:"Mauro (Santos)", positions:["ZAG"],          rating:85, years:"1955–1968"},
      {id:"san06", name:"Edu Dracena",    positions:["ZAG"],          rating:82, years:"2009–2013"},
      {id:"san07", name:"Dalmo",          positions:["LE","ZAG"],     rating:81, years:"1957–1970"},
      {id:"san08", name:"Zito",           positions:["VOL","MC"],     rating:89, years:"1956–1971"},
      {id:"san09", name:"Clodoaldo",      positions:["VOL","MC"],     rating:88, years:"1964–1977"},
      {id:"san10", name:"Arouca",         positions:["VOL","MC"],     rating:82, years:"2010–2014"},
      {id:"san11", name:"Ganso",          positions:["MC","ME"],      rating:87, years:"2007–2014"},
      {id:"san12", name:"Lima (Santos)",  positions:["MC","MD"],      rating:83, years:"1958–1970"},
      {id:"san13", name:"Dorval",         positions:["MD","CA"],      rating:86, years:"1956–1968"},
      {id:"san14", name:"Elano",          positions:["MD","MC"],      rating:86, years:"2009–2011"},
      {id:"san15", name:"Pagão",          positions:["ME","MD"],      rating:81, years:"1958–1970"},
      {id:"san16", name:"Robinho",        positions:["ME","CA"],      rating:88, years:"2002–2010"},
      {id:"san17", name:"Pelé",           positions:["CA","ME"],      rating:99, years:"1956–1974"},
      {id:"san18", name:"Pepe (Santos)",  positions:["CA"],           rating:92, years:"1955–1972"},
      {id:"san19", name:"Neymar",         positions:["CA","ME"],      rating:95, years:"2009–2013"},
    ],
  },

  // ── GRÊMIO ─────────────────────────────────────────────────
  "Grêmio": {
    fullName: "Grêmio Foot-Ball Porto Alegrense",
    color: "#0F4C8A",
    badge: "🔵⚫",
    legends: [
      {id:"gre01", name:"Dida (Grê.)",        positions:["GOL"],          rating:86, years:"1993–1997"},
      {id:"gre02", name:"Tarcísio Burle",     positions:["GOL"],          rating:81, years:"1981–1986"},
      {id:"gre03", name:"Mauro Galvão",       positions:["LD","ZAG"],     rating:84, years:"1980–1988"},
      {id:"gre04", name:"Gilberto (Grê.)",    positions:["LD","ZAG"],     rating:80, years:"1994–2000"},
      {id:"gre05", name:"Péricles",           positions:["ZAG"],          rating:84, years:"1981–1989"},
      {id:"gre06", name:"Roger (Grê.)",       positions:["ZAG"],          rating:82, years:"1992–1997"},
      {id:"gre07", name:"Kannemann",          positions:["ZAG"],          rating:83, years:"2016–hoje"},
      {id:"gre08", name:"Bressan",            positions:["ZAG","LE"],     rating:80, years:"2016–2018"},
      {id:"gre09", name:"Dinho (Grê.)",       positions:["VOL","MC"],     rating:83, years:"1992–1997"},
      {id:"gre10", name:"Lúcio (Grê.)",       positions:["VOL","ZAG"],    rating:82, years:"1997–2000"},
      {id:"gre11", name:"Arthur (Grê.)",      positions:["MC","VOL"],     rating:86, years:"2017–2018"},
      {id:"gre12", name:"Renato Gaúcho",      positions:["MC","ME"],      rating:88, years:"1985–1995"},
      {id:"gre13", name:"Jardel",             positions:["CA"],           rating:89, years:"1992–1996"},
      {id:"gre14", name:"Paulo Nunes",        positions:["CA","ME"],      rating:85, years:"1993–1997"},
      {id:"gre15", name:"Everton Cebolinha",  positions:["ME","CA"],      rating:87, years:"2016–2019"},
      {id:"gre16", name:"Luan (Grê.)",        positions:["ME","MC"],      rating:86, years:"2012–2018"},
      {id:"gre17", name:"Ramiro",             positions:["MD","MC"],      rating:80, years:"2015–2019"},
      {id:"gre18", name:"Claudiomiro",        positions:["CA","MD"],      rating:82, years:"1982–1985"},
    ],
  },

  // ── INTERNACIONAL ──────────────────────────────────────────
  "Internacional": {
    fullName: "Sport Club Internacional",
    color: "#E30613",
    badge: "🔴⚪",
    legends: [
      {id:"int01", name:"Clemer",             positions:["GOL"],          rating:83, years:"2002–2008"},
      {id:"int02", name:"Cláudio (Int.)",     positions:["GOL"],          rating:82, years:"1976–1983"},
      {id:"int03", name:"Mauro Galvão (Int.)",positions:["LD","ZAG"],     rating:83, years:"1983–1986"},
      {id:"int04", name:"Bolívar (Int.)",     positions:["LD","ZAG"],     rating:81, years:"2003–2010"},
      {id:"int05", name:"Índio (Int.)",       positions:["LE","ZAG"],     rating:83, years:"1975–1987"},
      {id:"int06", name:"Amarildo (Int.)",    positions:["ZAG"],          rating:81, years:"1977–1983"},
      {id:"int07", name:"Fábio Aurélio",      positions:["LE"],           rating:82, years:"2005–2007"},
      {id:"int08", name:"Tinga (Int.)",       positions:["VOL","MC"],     rating:82, years:"2004–2008"},
      {id:"int09", name:"Falcão",             positions:["MC","VOL"],     rating:97, years:"1975–1980"},
      {id:"int10", name:"Duarte (Int.)",      positions:["VOL","MC"],     rating:82, years:"1977–1982"},
      {id:"int11", name:"D'Alessandro",       positions:["MC","ME"],      rating:88, years:"2008–2018"},
      {id:"int12", name:"Giuliano (Int.)",    positions:["MD","MC"],      rating:82, years:"2008–2012"},
      {id:"int13", name:"Valdomiro",          positions:["ME","MD"],      rating:84, years:"1976–1982"},
      {id:"int14", name:"Escurinho",          positions:["MC","ME"],      rating:80, years:"1975–1980"},
      {id:"int15", name:"Fernandão",          positions:["CA"],           rating:88, years:"2005–2010"},
      {id:"int16", name:"Nilmar (Int.)",      positions:["CA","ME"],      rating:85, years:"2008–2011"},
      {id:"int17", name:"Alecsandro",         positions:["CA"],           rating:82, years:"2008–2011"},
    ],
  },

  // ── CRUZEIRO ───────────────────────────────────────────────
  "Cruzeiro": {
    fullName: "Cruzeiro Esporte Clube",
    color: "#003DA5",
    badge: "🔵⚪",
    legends: [
      {id:"cru01", name:"Dida (Cru.)",        positions:["GOL"],          rating:89, years:"1999–2004"},
      {id:"cru02", name:"Fábio (Cru.)",       positions:["GOL"],          rating:88, years:"2005–2022"},
      {id:"cru03", name:"Léo (Cru.)",         positions:["LD"],           rating:83, years:"2001–2014"},
      {id:"cru04", name:"Cesinha (Cru.)",     positions:["LD","ZAG"],     rating:79, years:"2001–2006"},
      {id:"cru05", name:"Cris (Cru.)",        positions:["ZAG"],          rating:83, years:"1999–2006"},
      {id:"cru06", name:"Brochet",            positions:["ZAG"],          rating:80, years:"2001–2005"},
      {id:"cru07", name:"Júnior César",       positions:["LE"],           rating:80, years:"2000–2007"},
      {id:"cru08", name:"Tostão",             positions:["CA","MC"],      rating:93, years:"1964–1973"},
      {id:"cru09", name:"Ricardinho (Cru.)",  positions:["VOL","MC"],     rating:83, years:"2000–2008"},
      {id:"cru10", name:"Claudinho (Cru.)",   positions:["VOL","MC"],     rating:81, years:"2000–2004"},
      {id:"cru11", name:"Gilberto Silva",     positions:["VOL"],          rating:86, years:"1998–2001"},
      {id:"cru12", name:"Alex (Cru.)",        positions:["MC","ME"],      rating:90, years:"1997–2004"},
      {id:"cru13", name:"Cléber Santana",     positions:["MC","MD"],      rating:80, years:"2005–2010"},
      {id:"cru14", name:"Ronaldo (Cru.)",     positions:["CA"],           rating:99, years:"1993–1994"},
      {id:"cru15", name:"Deivid (Cru.)",      positions:["CA"],           rating:83, years:"2002–2005"},
      {id:"cru16", name:"Rodrigo Faria",      positions:["MD","ME"],      rating:80, years:"2001–2005"},
      {id:"cru17", name:"Marcelo Ramos",      positions:["ME","CA"],      rating:79, years:"2001–2004"},
    ],
  },

  // ── VASCO ──────────────────────────────────────────────────
  "Vasco": {
    fullName: "Club de Regatas Vasco da Gama",
    color: "#0A0A0A",
    badge: "⚫⚪",
    legends: [
      {id:"vas01", name:"Carlos Germano",     positions:["GOL"],          rating:83, years:"1994–2003"},
      {id:"vas02", name:"Felipe (Vas.)",      positions:["GOL"],          rating:84, years:"1995–1998"},
      {id:"vas03", name:"Odvan",              positions:["LD"],           rating:79, years:"1995–2000"},
      {id:"vas04", name:"Pedrinho (Vas.)",    positions:["LD","ZAG"],     rating:80, years:"1994–2001"},
      {id:"vas05", name:"Mauro Galvão (Vas.)",positions:["ZAG"],          rating:83, years:"1994–1997"},
      {id:"vas06", name:"Andrade (Vas.)",     positions:["ZAG"],          rating:82, years:"1993–1999"},
      {id:"vas07", name:"Donizete (Vas.)",    positions:["VOL","MC"],     rating:83, years:"1994–1999"},
      {id:"vas08", name:"Juninho P. Novo",    positions:["MC","ME"],      rating:92, years:"1992–2000"},
      {id:"vas09", name:"Sávio",              positions:["MD","ME","CA"], rating:87, years:"1994–1999"},
      {id:"vas10", name:"Ramón (Vas.)",       positions:["ME","MD"],      rating:82, years:"1996–1999"},
      {id:"vas11", name:"Romário (Vas.)",     positions:["CA"],           rating:97, years:"1993–2002"},
      {id:"vas12", name:"Edmundo (Vas.)",     positions:["CA","ME"],      rating:91, years:"1993–1997"},
      {id:"vas13", name:"Luizão (Vas.)",      positions:["CA"],           rating:85, years:"1996–1998"},
      {id:"vas14", name:"Éverton (Vas.)",     positions:["CA","ME"],      rating:79, years:"1994–1997"},
    ],
  },

  // ── ATLÉTICO-MG ────────────────────────────────────────────
  "Atlético-MG": {
    fullName: "Clube Atlético Mineiro",
    color: "#1C1C1C",
    badge: "🖤⚪",
    legends: [
      {id:"atm01", name:"Éverson",            positions:["GOL"],          rating:85, years:"2020–hoje"},
      {id:"atm02", name:"Victor (ATM)",       positions:["GOL"],          rating:84, years:"2010–2019"},
      {id:"atm03", name:"Guilherme Arana",    positions:["LE","MD"],      rating:84, years:"2020–hoje"},
      {id:"atm04", name:"Mariano (ATM)",      positions:["LD"],           rating:80, years:"2019–2022"},
      {id:"atm05", name:"Nathan Silva",       positions:["ZAG"],          rating:82, years:"2021–hoje"},
      {id:"atm06", name:"Junior Alonso",      positions:["ZAG"],          rating:83, years:"2020–2022"},
      {id:"atm07", name:"Reinaldo (ATM)",     positions:["LE","ME"],      rating:91, years:"1971–1980"},
      {id:"atm08", name:"Jair (ATM)",         positions:["VOL","MC"],     rating:81, years:"2018–hoje"},
      {id:"atm09", name:"Allan (ATM)",        positions:["VOL","MC"],     rating:82, years:"2020–2022"},
      {id:"atm10", name:"Piazza (ATM)",       positions:["MC","VOL"],     rating:86, years:"1965–1975"},
      {id:"atm11", name:"Nacho Fernández",    positions:["MC","MD"],      rating:85, years:"2021–2022"},
      {id:"atm12", name:"Ronaldinho Gaúcho",  positions:["MC","ME","CA"], rating:95, years:"2012–2013"},
      {id:"atm13", name:"Bernard",            positions:["ME","MD"],      rating:84, years:"2011–2013"},
      {id:"atm14", name:"Savarino",           positions:["ME","CA"],      rating:83, years:"2020–2022"},
      {id:"atm15", name:"Dirceu Lopes",       positions:["ME","MC"],      rating:87, years:"1965–1977"},
      {id:"atm16", name:"Hulk",               positions:["CA","MD"],      rating:88, years:"2021–hoje"},
      {id:"atm17", name:"Diego Costa (ATM)",  positions:["CA"],           rating:83, years:"2021–2022"},
      {id:"atm18", name:"Dadá Maravilha",     positions:["CA"],           rating:91, years:"1965–1975"},
    ],
  },

  // ── FLUMINENSE ─────────────────────────────────────────────
  "Fluminense": {
    fullName: "Fluminense Football Club",
    color: "#8A1538",
    badge: "🔴🟢",
    legends: [
      {id:"flu01", name:"Fábio (Flu.)",       positions:["GOL"],          rating:88, years:"2005–2023"},
      {id:"flu02", name:"Marcos (Flu.)",      positions:["GOL"],          rating:81, years:"1997–2004"},
      {id:"flu03", name:"Samuel Xavier",      positions:["LD"],           rating:81, years:"2021–hoje"},
      {id:"flu04", name:"Assis (Flu.)",       positions:["LD","ZAG"],     rating:83, years:"1978–1987"},
      {id:"flu05", name:"Nino",               positions:["ZAG"],          rating:83, years:"2019–2023"},
      {id:"flu06", name:"Thiago Silva",       positions:["ZAG"],          rating:90, years:"2006–2008"},
      {id:"flu07", name:"Marcelo",            positions:["LE"],           rating:90, years:"2023–hoje"},
      {id:"flu08", name:"André (Flu.)",       positions:["VOL","MC"],     rating:86, years:"2020–2023"},
      {id:"flu09", name:"Felipe Melo (Flu.)", positions:["VOL","ZAG"],    rating:82, years:"2021–2023"},
      {id:"flu10", name:"Martinelli (Flu.)",  positions:["VOL","MC"],     rating:81, years:"2021–hoje"},
      {id:"flu11", name:"Rivellino",          positions:["MC","ME"],      rating:94, years:"1974–1978"},
      {id:"flu12", name:"Ganso (Flu.)",       positions:["MC","ME"],      rating:85, years:"2019–hoje"},
      {id:"flu13", name:"Jhon Arias",         positions:["MD","ME","CA"], rating:85, years:"2021–hoje"},
      {id:"flu14", name:"Fred (Flu.)",        positions:["CA"],           rating:88, years:"2009–2014"},
      {id:"flu15", name:"Cano",               positions:["CA"],           rating:86, years:"2022–hoje"},
    ],
  },

  // ── BOTAFOGO ───────────────────────────────────────────────
  "Botafogo": {
    fullName: "Botafogo de Futebol e Regatas",
    color: "#0A0A0A",
    badge: "⚫⚪",
    legends: [
      {id:"bot01", name:"Manga",              positions:["GOL"],          rating:87, years:"1960–1975"},
      {id:"bot02", name:"John (Bot.)",        positions:["GOL"],          rating:84, years:"2022–hoje"},
      {id:"bot03", name:"Carlos Alberto T.",  positions:["LD","ZAG"],     rating:92, years:"1963–1974"},
      {id:"bot04", name:"Nilton Santos",      positions:["LE","ZAG"],     rating:94, years:"1948–1964"},
      {id:"bot05", name:"Damián Suárez",      positions:["LD"],           rating:82, years:"2023–hoje"},
      {id:"bot06", name:"Bastos (Bot.)",      positions:["ZAG"],          rating:83, years:"2022–hoje"},
      {id:"bot07", name:"Barboza (Bot.)",     positions:["ZAG","LD"],     rating:80, years:"2022–hoje"},
      {id:"bot08", name:"Marlon Freitas",     positions:["VOL","MC"],     rating:84, years:"2023–hoje"},
      {id:"bot09", name:"Gerson (Bot.)",      positions:["MC","VOL"],     rating:90, years:"1964–1969"},
      {id:"bot10", name:"Gregore",            positions:["VOL"],          rating:82, years:"2022–hoje"},
      {id:"bot11", name:"Savarino (Bot.)",    positions:["ME","CA"],      rating:86, years:"2023–hoje"},
      {id:"bot12", name:"Luiz Henrique",      positions:["ME","CA"],      rating:87, years:"2023–hoje"},
      {id:"bot13", name:"Thiago Almada",      positions:["MC","ME"],      rating:85, years:"2023–hoje"},
      {id:"bot14", name:"Garrincha",          positions:["MD","ME"],      rating:99, years:"1953–1965"},
      {id:"bot15", name:"Jairzinho",          positions:["MD","CA"],      rating:93, years:"1962–1975"},
      {id:"bot16", name:"Tiquinho Soares",    positions:["CA"],           rating:86, years:"2022–2024"},
      {id:"bot17", name:"Túlio Maravilha",    positions:["CA"],           rating:86, years:"1993–1995"},
      {id:"bot18", name:"Quaresma (Bot.)",    positions:["MD","ME"],      rating:84, years:"2008–2009"},
    ],
  },
};

/* ─── TIME BASE DOS ADVERSÁRIOS ──────────────────────────────────────────── */
// Gerado automaticamente: pega os 11 jogadores com maior rating de cada clube
// respeitando 1 GOL, 4 DEF, 3 MID, 3 ATK (melhor aproximação)
function buildBestXI(clubKey) {
  const legends = CLUBS[clubKey].legends;
  const pick = (positions, n, used) => {
    return legends
      .filter(p => p.positions.some(pos => positions.includes(pos)) && !used.has(p.id))
      .sort((a,b) => b.rating - a.rating)
      .slice(0, n);
  };
  const used = new Set();
  const gols = pick(["GOL"], 1, used);            gols.forEach(p => used.add(p.id));
  const defs = pick(["ZAG","LD","LE"], 4, used);  defs.forEach(p => used.add(p.id));
  const mids = pick(["VOL","MC","MD","ME"], 3, used); mids.forEach(p => used.add(p.id));
  const atks = pick(["CA","ME","MD"], 3, used);
  return [...gols,...defs,...mids,...atks];
}

/* ─── CAMPEONATO BRASILEIRO ──────────────────────────────────────────────── */
// Gera todos os jogos de 38 rodadas (todos contra todos, 2 turnos)
function buildCalendar(clubKeys) {
  const matches = [];
  const n = clubKeys.length;
  for(let i = 0; i < n; i++) {
    for(let j = i+1; j < n; j++) {
      // turno 1: i em casa, turno 2: j em casa
      matches.push({ home: clubKeys[i], away: clubKeys[j], leg: 1 });
      matches.push({ home: clubKeys[j], away: clubKeys[i], leg: 2 });
    }
  }
  // embaralha para distribuir em rodadas
  for(let i = matches.length-1; i>0; i--) {
    const j = 0|Math.random()*(i+1);
    [matches[i],matches[j]] = [matches[j],matches[i]];
  }
  // agrupa em rodadas (n-1 jogos por rodada, 2 turno × n/2 jogos simultâneos)
  const rounds = [];
  const perRound = n/2;
  for(let r=0; r<38; r++) {
    rounds.push(matches.slice(r*perRound, (r+1)*perRound));
  }
  return rounds;
}

/* ─── MOTOR DE SIMULAÇÃO ─────────────────────────────────────────────────── */
const avgRating = players => Math.round(players.reduce((s,p)=>s+p.rating,0)/Math.max(players.length,1));
const rand = (a,b) => a + (0|Math.random()*(b-a+1));

function simMatch(homeRating, awayRating, homePlayers, awayPlayers) {
  const diff = (homeRating - awayRating) / 10;
  const homeAdv = 0.3; // vantagem de jogar em casa
  const hG = Math.max(0, Math.round(1.5 + diff + homeAdv + (Math.random()*2.2 - 1)));
  const aG = Math.max(0, Math.round(1.5 - diff + (Math.random()*2.2 - 1.1)));
  // Melhor jogador da partida (ataque ou meio)
  const allPool = [...homePlayers, ...awayPlayers]
    .filter(p => ["CA","ME","MD","MC"].includes(p.positions?.[0] ?? p.pos ?? ""));
  const mom = allPool.length ? allPool[0|Math.random()*allPool.length] : null;
  return { hG, aG, mom, win: hG>aG, draw: hG===aG };
}

/* ─── CAMPO VISUAL ───────────────────────────────────────────────────────── */
function Pitch({ formation, players, compact = false }) {
  const slots = FORMATIONS[formation] || FORMATIONS["4-3-3"];
  // Encaixa jogadores nos slots (3 passes: exato → compatível → fallback)
  const assigned = Array(slots.length).fill(null);
  const used = new Set();
  for(let pass=0; pass<3; pass++) {
    slots.forEach((slot,si) => {
      if(assigned[si]) return;
      const ok = SLOT_ACCEPTS[slot.slot] || [slot.slot];
      for(let pi=0; pi<players.length; pi++) {
        if(used.has(pi)) continue;
        const p = players[pi];
        const pPositions = p.positions || [p.pos];
        const match = pass===0
          ? pPositions.includes(ok[0])
          : pass===1 ? pPositions.some(pos=>ok.includes(pos))
          : true;
        if(match) { assigned[si]=p; used.add(pi); break; }
      }
    });
  }
  const sz = compact ? 28 : 34;
  return (
    <div style={{width:"100%",position:"relative"}}>
      <div style={{
        width:"100%", paddingBottom: compact?"130%":"155%",
        background:`repeating-linear-gradient(180deg,${C.greenDk} 0,${C.greenDk} 36px,${C.stripe} 36px,${C.stripe} 72px)`,
        borderRadius:8, border:`1.5px solid #0d3d1e`, position:"relative", overflow:"hidden"
      }}>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 100 155" preserveAspectRatio="none">
          <rect x="3" y="3" width="94" height="149" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth=".7"/>
          <line x1="3" y1="77.5" x2="97" y2="77.5" stroke="rgba(255,255,255,.28)" strokeWidth=".7"/>
          <circle cx="50" cy="77.5" r="13" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".7"/>
          <circle cx="50" cy="77.5" r="1.2" fill="rgba(255,255,255,.5)"/>
          <rect x="22" y="3" width="56" height="22" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".6"/>
          <rect x="32" y="3" width="36" height="11" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth=".5"/>
          <rect x="22" y="130" width="56" height="22" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".6"/>
          <rect x="32" y="141" width="36" height="11" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth=".5"/>
        </svg>
        {slots.map((slot,i) => {
          const p = assigned[i];
          const col = GROUP_COLOR(slot.group);
          return (
            <div key={i} style={{position:"absolute",left:`${slot.x}%`,top:`${slot.y}%`,
              transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",
              alignItems:"center",zIndex:5}}>
              {p ? (
                <div className="popIn" style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:sz,height:sz,borderRadius:"50%",background:col,
                    border:"2px solid rgba(255,255,255,.9)",display:"flex",alignItems:"center",
                    justifyContent:"center",fontSize:compact?7:8,fontWeight:900,color:"#fff",
                    fontFamily:F.display,boxShadow:"0 2px 8px rgba(0,0,0,.45)"}}>
                    {p.positions?.[0]??p.pos??"?"}
                  </div>
                  <div style={{marginTop:2,background:"rgba(0,0,0,.78)",borderRadius:3,
                    padding:"1px 4px",fontSize:compact?6:7.5,color:"#fff",fontWeight:700,
                    whiteSpace:"nowrap",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",textAlign:"center"}}>
                    {p.name.split(" ").slice(-1)[0]}
                  </div>
                </div>
              ) : (
                <div style={{width:compact?26:32,height:compact?26:32,borderRadius:"50%",
                  border:"1.5px dashed rgba(255,255,255,.45)",display:"flex",alignItems:"center",
                  justifyContent:"center",background:"rgba(0,0,0,.14)"}}>
                  <span style={{fontSize:compact?6:7,color:"rgba(255,255,255,.6)",fontWeight:700}}>
                    {slot.slot}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── CONFETTI ───────────────────────────────────────────────────────────── */
function Confetti() {
  const ps = Array.from({length:30},(_,i)=>({
    id:i,left:Math.random()*100,delay:Math.random()*1.8,
    dur:1.6+Math.random()*1.4,
    color:[C.green,C.gold,C.black,"#FFD700","#009640","#fff"][i%6],
    size:5+Math.random()*7
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:999}}>
      {ps.map(p=>
        <div key={p.id} style={{position:"absolute",left:`${p.left}%`,top:-20,
          width:p.size,height:p.size,background:p.color,
          borderRadius:Math.random()>.5?"50%":"2px",
          animation:`confettiFall ${p.dur}s ease-in ${p.delay}s both`}}/>
      )}
    </div>
  );
}

/* ─── HEADER ─────────────────────────────────────────────────────────────── */
function Header({left=null,right=null,dark=false}) {
  return (
    <div style={{background:dark?C.black:C.bg,borderBottom:dark?"none":`1px solid ${C.border}`,
      padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div style={{minWidth:56}}>{left}</div>
      <div style={{textAlign:"center"}}>
        <span style={{fontFamily:F.display,fontSize:17,color:dark?C.bg:C.ink,letterSpacing:.5,lineHeight:1}}>
          <span style={{color:C.green}}>BRASILEIRÃO</span> DRAFT
        </span>
      </div>
      <div style={{minWidth:56,textAlign:"right"}}>{right}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TELA 1 — ESCOLHA DO CLUBE
═══════════════════════════════════════════════════════════════════════════ */
function ClubPickScreen({onPick, history}) {
  const clubs = Object.keys(CLUBS);
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      <div style={{background:C.green,padding:"44px 28px 36px",position:"relative",overflow:"hidden"}}>
        <div style={{fontFamily:F.display,fontSize:58,color:"#fff",lineHeight:.9,letterSpacing:-2}}>
          BRASILEIRÃO<br/>DRAFT
        </div>
        <div style={{marginTop:12,fontSize:14,color:"rgba(255,255,255,.7)",fontFamily:F.body,lineHeight:1.5,maxWidth:280}}>
          Escolha seu clube e monte a seleção dos sonhos com as maiores lendas da história.
        </div>
        <div style={{position:"absolute",right:-8,bottom:-16,fontSize:110,opacity:.1,pointerEvents:"none",userSelect:"none"}}>⚽</div>
      </div>

      <div style={{flex:1,padding:"24px 20px 100px"}}>
        <p style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body,marginBottom:16}}>
          ESCOLHA SEU CLUBE
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {clubs.map(club => {
            const data = CLUBS[club];
            return (
              <div key={club} onClick={()=>onPick(club)}
                style={{display:"flex",alignItems:"center",gap:14,padding:"16px 0",
                  borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.surface}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:40,height:40,borderRadius:"50%",
                  background:`${data.color}18`,border:`2px solid ${data.color}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,flexShrink:0}}>
                  {data.badge.split("")[0]}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:F.display,fontSize:18,color:C.ink,letterSpacing:-.3}}>{club}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:F.body}}>
                    {CLUBS[club].legends.length} lendas disponíveis
                  </div>
                </div>
                <div style={{fontSize:16,color:C.faint}}>›</div>
              </div>
            );
          })}
        </div>

        {history.length>0 && (
          <div style={{marginTop:32}}>
            <p style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body,marginBottom:12}}>
              ÚLTIMAS PARTIDAS
            </p>
            {history.slice(0,4).map((h,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,fontWeight:600,color:h.champ?C.green:C.ink,fontFamily:F.body}}>
                  {h.champ?"🏆 Campeão":h.result}
                </span>
                <span style={{fontSize:11,color:C.muted,fontFamily:F.body}}>{h.club} · {h.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TELA 2 — ESCOLHA DA FORMAÇÃO
═══════════════════════════════════════════════════════════════════════════ */
function FormationScreen({club, onConfirm}) {
  const [selected, setSelected] = useState("4-3-3");
  const descriptions = {
    "4-3-3":  "Três atacantes. Domínio dos flancos.",
    "4-4-2":  "Clássico. Dois pontas e equilíbrio.",
    "3-5-2":  "Cinco meias. Posse e pressão.",
    "4-2-3-1":"Dois volantes. Meia atrás do 9.",
  };
  const slots = FORMATIONS[selected];
  const clubData = CLUBS[club];
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      <Header left={<span style={{fontSize:13,color:C.muted,fontFamily:F.body}}>← Voltar</span>}/>
      <div style={{padding:"20px 24px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:`${clubData.color}18`,
            border:`2px solid ${clubData.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
            {clubData.badge.split("")[0]}
          </div>
          <div>
            <div style={{fontFamily:F.display,fontSize:22,color:C.ink,letterSpacing:-.5}}>{club}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:F.body}}>Escolha a formação</div>
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 24px 120px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:24}}>
          {Object.keys(FORMATIONS).map(f=>(
            <div key={f} onClick={()=>setSelected(f)}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"16px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
              <div>
                <div style={{fontFamily:F.display,fontSize:22,color:selected===f?C.green:C.ink,letterSpacing:-.5}}>{f}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:3,fontFamily:F.body}}>{descriptions[f]}</div>
              </div>
              <div style={{width:22,height:22,borderRadius:"50%",
                border:`2px solid ${selected===f?C.green:C.faint}`,
                background:selected===f?C.green:"transparent",
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {selected===f&&<div style={{width:7,height:7,borderRadius:"50%",background:"#fff"}}/>}
              </div>
            </div>
          ))}
        </div>
        <p style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,marginBottom:12,fontFamily:F.body}}>PRÉVIA</p>
        <div style={{position:"relative",width:"100%"}}>
          <div style={{width:"100%",paddingBottom:"125%",
            background:`repeating-linear-gradient(180deg,${C.greenDk} 0,${C.greenDk} 36px,${C.stripe} 36px,${C.stripe} 72px)`,
            position:"relative",overflow:"hidden"}}>
            <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 100 125" preserveAspectRatio="none">
              <rect x="2" y="2" width="96" height="121" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".7"/>
              <line x1="2" y1="62.5" x2="98" y2="62.5" stroke="rgba(255,255,255,.22)" strokeWidth=".7"/>
              <circle cx="50" cy="62.5" r="12" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".6"/>
              <rect x="22" y="2" width="56" height="19" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/>
              <rect x="22" y="104" width="56" height="19" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/>
            </svg>
            {slots.map((slot,i)=>{
              const y = slot.y*(125/155);
              return (
                <div key={i} style={{position:"absolute",left:`${slot.x}%`,top:`${y}%`,
                  transform:"translate(-50%,-50%)",zIndex:5}}>
                  <div style={{width:28,height:28,borderRadius:"50%",
                    background:GROUP_COLOR(slot.group),
                    border:"2px solid rgba(255,255,255,.9)",display:"flex",alignItems:"center",
                    justifyContent:"center",fontSize:7,fontWeight:700,color:"#fff",fontFamily:F.body,
                    boxShadow:"0 1px 5px rgba(0,0,0,.35)"}}>
                    {slot.slot}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:480,padding:"16px 24px",background:C.bg,
        borderTop:`1px solid ${C.border}`,zIndex:50}}>
        <button onClick={()=>onConfirm(selected)} style={{
          background:C.black,color:"#fff",border:"none",padding:"17px 0",width:"100%",
          cursor:"pointer",fontFamily:F.display,fontSize:14,letterSpacing:2,transition:"background .15s"
        }}
          onMouseEnter={e=>e.currentTarget.style.background=C.green}
          onMouseLeave={e=>e.currentTarget.style.background=C.black}>
          MONTAR O TIME →
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TELA 3 — ESCALAÇÃO (escolha posição a posição)
═══════════════════════════════════════════════════════════════════════════ */
function SquadBuilderScreen({club, formation, onConfirm}) {
  const slots = FORMATIONS[formation];
  const clubData = CLUBS[club];
  const legends = clubData.legends;

  // squad = array de 11 posições (null = não preenchida)
  const [squad, setSquad] = useState(Array(slots.length).fill(null));
  // qual slot está sendo preenchido agora
  const [activeSlot, setActiveSlot] = useState(null);
  const [tab, setTab] = useState("field"); // "field" | "list"

  const usedIds = squad.filter(Boolean).map(p=>p.id);

  // Jogadores disponíveis para o slot ativo
  const availableFor = slotIdx => {
    const slot = slots[slotIdx];
    const accepts = SLOT_ACCEPTS[slot.slot] || [slot.slot];
    return legends.filter(p =>
      p.positions.some(pos=>accepts.includes(pos)) &&
      !usedIds.includes(p.id)
    ).sort((a,b)=>b.rating-a.rating);
  };

  const pickPlayer = (p) => {
    const next = [...squad];
    next[activeSlot] = p;
    setSquad(next);
    // avança para o próximo slot vazio
    const nextEmpty = slots.findIndex((_, i) => i > activeSlot && !next[i]);
    setActiveSlot(nextEmpty >= 0 ? nextEmpty : null);
  };

  const removePlayer = (slotIdx, e) => {
    e.stopPropagation();
    const next = [...squad];
    next[slotIdx] = null;
    setSquad(next);
    setActiveSlot(slotIdx);
  };

  const filled = squad.filter(Boolean).length;
  const complete = filled === slots.length;

  // Cores do clube para highlight
  const clubColor = clubData.color;

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      <Header
        left={<span style={{fontSize:13,color:C.muted,fontFamily:F.body,cursor:"pointer"}} onClick={()=>setActiveSlot(null)}>← Voltar</span>}
        right={<span style={{fontFamily:F.display,fontSize:13,color:filled===slots.length?C.green:C.muted}}>{filled}/11</span>}
      />

      {/* Abas campo / lista */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        {["field","list"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:"11px 0",background:"transparent",border:"none",cursor:"pointer",
            fontFamily:F.body,fontSize:11,fontWeight:700,letterSpacing:2,
            color:tab===t?C.ink:C.muted,
            borderBottom:tab===t?`2px solid ${C.green}`:"2px solid transparent"
          }}>{t==="field"?"CAMPO":"ELENCO"}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:tab==="field"?"12px 16px 200px":"0 0 200px"}}>
        {tab==="field" && (
          <>
            {/* Indicador do slot ativo */}
            {activeSlot !== null && (
              <div className="fadeUp" style={{
                background:`${clubColor}12`,border:`1px solid ${clubColor}40`,
                borderRadius:8,padding:"10px 14px",marginBottom:12,
                display:"flex",alignItems:"center",gap:10
              }}>
                <div style={{width:30,height:30,borderRadius:"50%",
                  background:GROUP_COLOR(slots[activeSlot].group),
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:8,fontWeight:700,color:"#fff",fontFamily:F.display,flexShrink:0}}>
                  {slots[activeSlot].slot}
                </div>
                <div>
                  <div style={{fontFamily:F.body,fontSize:13,fontWeight:600,color:C.ink}}>
                    Escolhendo para: <strong>{slots[activeSlot].slot}</strong>
                  </div>
                  <div style={{fontSize:11,color:C.muted,marginTop:1}}>
                    {availableFor(activeSlot).length} lendas disponíveis
                  </div>
                </div>
              </div>
            )}

            {/* Campo */}
            <div style={{position:"relative",width:"100%"}}>
              <div style={{
                width:"100%",paddingBottom:"155%",
                background:`repeating-linear-gradient(180deg,${C.greenDk} 0,${C.greenDk} 36px,${C.stripe} 36px,${C.stripe} 72px)`,
                borderRadius:8,border:`1.5px solid #0d3d1e`,position:"relative",overflow:"hidden"
              }}>
                <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 100 155" preserveAspectRatio="none">
                  <rect x="3" y="3" width="94" height="149" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth=".7"/>
                  <line x1="3" y1="77.5" x2="97" y2="77.5" stroke="rgba(255,255,255,.28)" strokeWidth=".7"/>
                  <circle cx="50" cy="77.5" r="13" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".7"/>
                  <circle cx="50" cy="77.5" r="1.2" fill="rgba(255,255,255,.5)"/>
                  <rect x="22" y="3" width="56" height="22" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".6"/>
                  <rect x="32" y="3" width="36" height="11" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth=".5"/>
                  <rect x="22" y="130" width="56" height="22" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".6"/>
                  <rect x="32" y="141" width="36" height="11" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth=".5"/>
                </svg>
                {slots.map((slot, si) => {
                  const p = squad[si];
                  const isActive = activeSlot === si;
                  const col = GROUP_COLOR(slot.group);
                  return (
                    <div key={si} onClick={()=>setActiveSlot(si)}
                      style={{position:"absolute",left:`${slot.x}%`,top:`${slot.y}%`,
                        transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",
                        alignItems:"center",zIndex:5,cursor:"pointer"}}>
                      {p ? (
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                          <div style={{width:34,height:34,borderRadius:"50%",
                            background:col,
                            border:isActive?`3px solid #fff`:`2px solid rgba(255,255,255,.85)`,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:7,fontWeight:900,color:"#fff",fontFamily:F.display,
                            boxShadow:isActive?"0 0 0 3px rgba(255,255,255,.5), 0 2px 8px rgba(0,0,0,.5)":"0 2px 8px rgba(0,0,0,.45)",
                            position:"relative"}}>
                            {p.positions[0]}
                            {/* botão de remover */}
                            <div onClick={(e)=>removePlayer(si,e)} style={{
                              position:"absolute",top:-6,right:-6,
                              width:14,height:14,borderRadius:"50%",
                              background:"#CC0000",border:"1.5px solid #fff",
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:8,color:"#fff",fontWeight:900,lineHeight:1
                            }}>×</div>
                          </div>
                          <div style={{marginTop:2,background:"rgba(0,0,0,.82)",borderRadius:3,
                            padding:"1px 4px",fontSize:7,color:"#fff",fontWeight:700,
                            whiteSpace:"nowrap",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",textAlign:"center"}}>
                            {p.name.split(" ").slice(-1)[0]}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          width:32,height:32,borderRadius:"50%",
                          border:isActive
                            ?`2px solid rgba(255,255,255,.9)`
                            :"1.5px dashed rgba(255,255,255,.4)",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          background:isActive?"rgba(255,255,255,.15)":"rgba(0,0,0,.1)",
                          boxShadow:isActive?"0 0 0 3px rgba(255,255,255,.3)":"none",
                          animation:isActive?"pulse 1.4s infinite":undefined
                        }}>
                          <span style={{fontSize:7,color:"rgba(255,255,255,.7)",fontWeight:700}}>{slot.slot}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab==="list" && (
          <div>
            {slots.map((slot, si) => {
              const p = squad[si];
              const col = GROUP_COLOR(slot.group);
              return (
                <div key={si} onClick={()=>{setActiveSlot(si);setTab("field");}}
                  style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",
                    borderBottom:`1px solid ${C.border}`,cursor:"pointer",
                    background:activeSlot===si?C.surface:"transparent"}}>
                  <div style={{background:col,color:"#fff",fontSize:9,fontWeight:700,
                    padding:"3px 6px",borderRadius:4,minWidth:32,textAlign:"center",fontFamily:F.body,flexShrink:0}}>
                    {slot.slot}
                  </div>
                  {p ? (
                    <>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:C.ink,fontFamily:F.body}}>{p.name}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>{p.years}</div>
                      </div>
                      <div style={{fontFamily:F.display,fontSize:22,color:p.rating>=88?C.green:C.ink}}>{p.rating}</div>
                      <div onClick={(e)=>removePlayer(si,e)} style={{
                        width:24,height:24,borderRadius:"50%",background:"#CC000020",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:12,color:C.red,fontWeight:900,cursor:"pointer",flexShrink:0
                      }}>×</div>
                    </>
                  ) : (
                    <div style={{flex:1,fontSize:13,color:C.muted,fontStyle:"italic",fontFamily:F.body}}>
                      Vazio — toque para escolher
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Painel de seleção de jogador (quando activeSlot !== null) */}
      {activeSlot !== null && (
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:480,background:C.bg,borderTop:`2px solid ${C.border}`,
          zIndex:60,maxHeight:"45vh",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"10px 16px 6px",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body}}>
              LENDAS DISPONÍVEIS — {slots[activeSlot]?.slot}
            </span>
            <span onClick={()=>setActiveSlot(null)} style={{fontSize:13,color:C.muted,cursor:"pointer",padding:"4px 8px"}}>✕</span>
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {availableFor(activeSlot).length === 0 ? (
              <div style={{padding:"24px 16px",textAlign:"center",color:C.muted,fontSize:13,fontFamily:F.body}}>
                Nenhuma lenda disponível para esta posição
              </div>
            ) : (
              availableFor(activeSlot).map(p => (
                <div key={p.id} onClick={()=>pickPlayer(p)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",
                    borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.surface}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{
                    background:`${clubColor}18`,border:`1.5px solid ${clubColor}60`,
                    borderRadius:6,padding:"3px 6px",fontSize:10,fontWeight:700,
                    color:clubColor,minWidth:32,textAlign:"center",fontFamily:F.body,flexShrink:0
                  }}>
                    {p.positions[0]}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.ink,fontFamily:F.body}}>{p.name}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:1}}>
                      {p.positions.join(" · ")} &nbsp;|&nbsp; {p.years}
                    </div>
                  </div>
                  <div style={{fontFamily:F.display,fontSize:22,
                    color:p.rating>=90?C.green:p.rating>=85?C.ink:C.muted}}>
                    {p.rating}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Botão confirmar */}
      {complete && activeSlot === null && (
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:480,padding:"16px 24px",background:C.bg,
          borderTop:`1px solid ${C.border}`,zIndex:50}}>
          <button onClick={()=>onConfirm(squad)} className="fadeUp" style={{
            background:C.black,color:"#fff",border:"none",padding:"17px 0",
            width:"100%",cursor:"pointer",fontFamily:F.display,fontSize:14,letterSpacing:2,transition:"background .15s"
          }}
            onMouseEnter={e=>e.currentTarget.style.background=C.green}
            onMouseLeave={e=>e.currentTarget.style.background=C.black}>
            DISPUTAR O BRASILEIRÃO →
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TELA 4 — CAMPEONATO (38 rodadas, jogo a jogo)
═══════════════════════════════════════════════════════════════════════════ */
function ChampionshipScreen({club, formation, squad, onFinish}) {
  const clubData = CLUBS[club];
  const allClubs = Object.keys(CLUBS);
  const opponents = allClubs.filter(c=>c!==club);

  // Monta XI dos adversários automaticamente
  const oppSquads = {};
  opponents.forEach(c => { oppSquads[c] = buildBestXI(c); });

  // Tabela: pts, v, e, d, gf, ga
  const [table, setTable] = useState(()=>{
    const t = {};
    allClubs.forEach(c=>{ t[c]={pts:0,v:0,e:0,d:0,gf:0,ga:0}; });
    return t;
  });

  // Rodadas
  const ROUNDS = buildCalendar(allClubs);

  const [roundIdx, setRoundIdx] = useState(0);
  const [phase, setPhase] = useState("preview"); // preview | result | table | done
  const [results, setResults] = useState([]); // resultados da rodada atual
  const [allResults, setAllResults] = useState([]); // todos resultados acumulados
  const [tab, setTab] = useState("round"); // "round" | "table"

  const myRating = avgRating(squad);

  const simulateRound = (currentTable) => {
    const roundMatches = ROUNDS[roundIdx] || [];
    const roundResults = roundMatches.map(m => {
      const isMyMatch = m.home===club || m.away===club;
      const homePlayers = m.home===club ? squad : (oppSquads[m.home] || []);
      const awayPlayers = m.away===club ? squad : (oppSquads[m.away] || []);
      const homeR = avgRating(homePlayers) || 78;
      const awayR = avgRating(awayPlayers) || 78;
      return {
        home: m.home, away: m.away,
        isMyMatch,
        ...simMatch(homeR, awayR, homePlayers, awayPlayers)
      };
    });

    // Atualiza tabela
    const next = JSON.parse(JSON.stringify(currentTable));
    roundResults.forEach(r => {
      const {home,away,hG,aG} = r;
      next[home].gf += hG; next[home].ga += aG;
      next[away].gf += aG; next[away].ga += hG;
      if(hG>aG){ next[home].v++; next[home].pts+=3; next[away].d++; }
      else if(hG===aG){ next[home].e++; next[home].pts+=1; next[away].e++; next[away].pts+=1; }
      else { next[away].v++; next[away].pts+=3; next[home].d++; }
    });

    return { roundResults, nextTable: next };
  };

  const handleSimulate = () => {
    const { roundResults, nextTable } = simulateRound(table);
    setResults(roundResults);
    setAllResults(p=>[...p,...roundResults]);
    setTable(nextTable);
    setPhase("result");
    setTab("round");
  };

  const handleNext = () => {
    if(roundIdx >= 37) {
      setPhase("done");
    } else {
      setRoundIdx(i=>i+1);
      setPhase("preview");
    }
  };

  // Tabela ordenada
  const sortedTable = Object.entries(table)
    .map(([c,s])=>({club:c,...s,gd:s.gf-s.ga}))
    .sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);

  const myPos = sortedTable.findIndex(r=>r.club===club)+1;
  const myRow = sortedTable.find(r=>r.club===club);

  // Jogo do meu time nesta rodada
  const myMatch = results.find(r=>r.isMyMatch);
  const myIsHome = myMatch?.home===club;
  const myGoals = myMatch ? (myIsHome ? myMatch.hG : myMatch.aG) : 0;
  const oppGoals = myMatch ? (myIsHome ? myMatch.aG : myMatch.hG) : 0;
  const oppClub = myMatch ? (myIsHome ? myMatch.away : myMatch.home) : null;
  const myWon = myGoals > oppGoals;
  const myDrew = myGoals === oppGoals;

  // Fase done
  if(phase==="done") {
    const champ = myPos===1;
    const qualified = myPos<=6; // G6 Libertadores
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
        {champ && <Confetti/>}
        <div style={{background:champ?C.green:myPos<=4?"#003DA5":C.black,
          padding:"40px 24px 32px",flexShrink:0,textAlign:"center"}}>
          {champ
            ? <><div className="trophy" style={{fontSize:52,display:"block",marginBottom:10}}>🏆</div>
                <div style={{fontFamily:F.display,fontSize:34,color:"#fff",letterSpacing:-1}}>CAMPEÃO BRASILEIRO!</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.7)",marginTop:8,fontFamily:F.body}}>
                  {club} com {myRow?.pts} pontos
                </div></>
            : <><div style={{fontSize:44,marginBottom:8}}>{myPos<=6?"🌟":myPos<=12?"😤":"😞"}</div>
                <div style={{fontFamily:F.display,fontSize:26,color:"#fff",letterSpacing:-.5}}>
                  {myPos}º lugar
                </div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.6)",marginTop:6,fontFamily:F.body}}>
                  {qualified?"Classificado para a Libertadores":"Fora das copas internacionais"}
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:4,fontFamily:F.body}}>
                  {myRow?.pts} pontos · {myRow?.v}V {myRow?.e}E {myRow?.d}D
                </div></>
          }
        </div>
        {/* Tabela final */}
        <div style={{flex:1,overflowY:"auto",padding:"0 0 100px"}}>
          <div style={{padding:"14px 20px 8px"}}>
            <span style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body}}>CLASSIFICAÇÃO FINAL</span>
          </div>
          {sortedTable.map((row,i)=>(
            <div key={row.club} style={{
              display:"flex",alignItems:"center",padding:"11px 20px",
              borderBottom:`1px solid ${C.border}`,
              background:row.club===club?"rgba(0,150,64,.04)":"transparent"
            }}>
              <div style={{width:24,fontFamily:F.display,fontSize:14,
                color:i<1?C.gold:i<6?C.green:i<12?"#1A5FAA":C.muted,marginRight:10,textAlign:"center"}}>{i+1}</div>
              <div style={{flex:1,fontSize:13,fontWeight:row.club===club?700:500,
                color:row.club===club?C.green:C.ink,fontFamily:F.body}}>
                {CLUBS[row.club].badge.split("")[0]} {row.club}
              </div>
              <div style={{display:"flex",gap:8,fontSize:12,color:C.muted,fontFamily:F.body}}>
                <span>{row.v}V</span><span>{row.e}E</span><span>{row.d}D</span>
                <span style={{fontWeight:700,color:C.ink,minWidth:24,textAlign:"right"}}>{row.pts}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:480,padding:"16px 24px",background:C.bg,
          borderTop:`1px solid ${C.border}`,zIndex:50}}>
          <button onClick={()=>onFinish({champ:champ,result:`${myPos}º lugar · ${myRow?.pts}pts`})} style={{
            background:C.black,color:"#fff",border:"none",padding:"17px 0",width:"100%",
            cursor:"pointer",fontFamily:F.display,fontSize:14,letterSpacing:2
          }}>JOGAR DE NOVO</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      <Header
        right={
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:F.display,fontSize:13,color:myPos<=6?C.green:C.ink}}>{myPos}º</div>
            <div style={{fontSize:10,color:C.muted,fontFamily:F.body}}>{myRow?.pts}pts</div>
          </div>
        }
      />

      {/* Abas */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        {["round","table"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:"11px 0",background:"transparent",border:"none",cursor:"pointer",
            fontFamily:F.body,fontSize:11,fontWeight:700,letterSpacing:2,
            color:tab===t?C.ink:C.muted,borderBottom:tab===t?`2px solid ${C.green}`:"2px solid transparent"
          }}>{t==="round"?"RODADA":"TABELA"}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 0 120px"}}>

        {tab==="round" && phase==="preview" && (
          <div style={{padding:"36px 24px",textAlign:"center"}}>
            <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body,marginBottom:20}}>
              RODADA {roundIdx+1} DE 38
            </div>
            {/* Meu jogo desta rodada */}
            {(() => {
              const myRound = ROUNDS[roundIdx]?.find(m=>m.home===club||m.away===club);
              if(!myRound) return null;
              const isH = myRound.home===club;
              const opp = isH ? myRound.away : myRound.home;
              return (
                <div style={{background:C.surface,borderRadius:12,padding:"20px",marginBottom:24}}>
                  <div style={{fontSize:11,color:C.muted,fontFamily:F.body,marginBottom:12}}>SEU JOGO</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:28,marginBottom:4}}>{clubData.badge.split("")[0]}</div>
                      <div style={{fontFamily:F.display,fontSize:15,color:C.ink}}>{isH?club:opp}</div>
                      <div style={{fontSize:10,color:C.muted,fontFamily:F.body}}>CASA</div>
                    </div>
                    <div style={{fontFamily:F.display,fontSize:22,color:C.muted}}>×</div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:28,marginBottom:4}}>{CLUBS[opp].badge.split("")[0]}</div>
                      <div style={{fontFamily:F.display,fontSize:15,color:C.ink}}>{isH?opp:club}</div>
                      <div style={{fontSize:10,color:C.muted,fontFamily:F.body}}>VISITANTE</div>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div style={{fontSize:13,color:C.muted,fontFamily:F.body,marginBottom:32}}>
              Posição atual: <strong style={{color:myPos<=6?C.green:C.ink}}>{myPos}º</strong> · {myRow?.pts} pontos
            </div>
          </div>
        )}

        {tab==="round" && phase==="result" && (
          <div>
            {/* Destaque — meu jogo */}
            {myMatch && (
              <div className="fadeUp" style={{
                background:myWon?`${C.green}12`:myDrew?`${C.yellow}12`:`${C.red}10`,
                borderBottom:`2px solid ${myWon?C.green:myDrew?C.yellow:C.red}`,
                padding:"20px 20px"
              }}>
                <div style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body,marginBottom:10}}>
                  RODADA {roundIdx} — SEU JOGO
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{fontFamily:F.display,fontSize:16,
                      color:myIsHome?(myWon?C.green:myDrew?C.ink:C.muted):C.muted}}>{myMatch.home}</div>
                  </div>
                  <div style={{textAlign:"center",minWidth:90}}>
                    <div style={{fontFamily:F.display,fontSize:40,color:C.ink,letterSpacing:4,lineHeight:1}}>
                      {myMatch.hG} – {myMatch.aG}
                    </div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:2,marginTop:4,fontFamily:F.body,
                      color:myWon?C.green:myDrew?C.yellow:C.red}}>
                      {myWon?"VITÓRIA":myDrew?"EMPATE":"DERROTA"}
                    </div>
                  </div>
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{fontFamily:F.display,fontSize:16,
                      color:!myIsHome?(myWon?C.muted:myDrew?C.ink:C.green):C.muted}}>{myMatch.away}</div>
                  </div>
                </div>
                {myMatch.mom && (
                  <div style={{marginTop:12,textAlign:"center",fontSize:12,color:C.muted,fontFamily:F.body}}>
                    ⭐ Destaque: <strong style={{color:C.ink}}>{myMatch.mom.name}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Outros jogos */}
            <div style={{padding:"12px 20px 0"}}>
              <span style={{fontSize:10,letterSpacing:3,color:C.muted,fontWeight:600,fontFamily:F.body}}>
                OUTROS RESULTADOS
              </span>
            </div>
            {results.filter(r=>!r.isMyMatch).map((r,i)=>(
              <div key={i} className="slideIn" style={{
                display:"flex",alignItems:"center",padding:"10px 20px",
                borderBottom:`1px solid ${C.border}`,
                animationDelay:`${i*0.03}s`
              }}>
                <div style={{flex:1,fontSize:13,fontFamily:F.body,color:C.ink,textAlign:"right",
                  fontWeight:r.win?600:400}}>{r.home}</div>
                <div style={{fontFamily:F.display,fontSize:16,color:C.ink,
                  letterSpacing:2,minWidth:64,textAlign:"center"}}>{r.hG}–{r.aG}</div>
                <div style={{flex:1,fontSize:13,fontFamily:F.body,color:C.ink,
                  fontWeight:!r.win&&!r.draw?600:400}}>{r.away}</div>
              </div>
            ))}
          </div>
        )}

        {tab==="table" && (
          <div>
            {sortedTable.map((row,i)=>(
              <div key={row.club} style={{
                display:"flex",alignItems:"center",padding:"11px 20px",
                borderBottom:`1px solid ${C.border}`,
                background:row.club===club?"rgba(0,150,64,.05)":"transparent"
              }}>
                <div style={{width:22,fontFamily:F.display,fontSize:13,
                  color:i<1?C.gold:i<6?C.green:i<12?"#1A5FAA":C.muted,
                  marginRight:10,textAlign:"center"}}>{i+1}</div>
                <div style={{fontSize:12,marginRight:8,flexShrink:0}}>
                  {CLUBS[row.club].badge.split("")[0]}
                </div>
                <div style={{flex:1,fontSize:13,fontWeight:row.club===club?700:400,
                  color:row.club===club?C.green:C.ink,fontFamily:F.body}}>{row.club}</div>
                <div style={{display:"flex",gap:6,fontSize:11,color:C.muted,fontFamily:F.body,alignItems:"center"}}>
                  <span style={{minWidth:16,textAlign:"center"}}>{row.v}</span>
                  <span style={{minWidth:16,textAlign:"center"}}>{row.e}</span>
                  <span style={{minWidth:16,textAlign:"center"}}>{row.d}</span>
                  <span style={{fontWeight:700,color:C.ink,minWidth:24,textAlign:"right"}}>{row.pts}</span>
                </div>
              </div>
            ))}
            <div style={{padding:"8px 20px",display:"flex",gap:16,fontSize:10,color:C.muted,fontFamily:F.body}}>
              <span>V&nbsp;Vitórias</span><span>E&nbsp;Empates</span><span>D&nbsp;Derrotas</span><span>PTS</span>
            </div>
          </div>
        )}
      </div>

      {/* Botão rodada */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:480,padding:"16px 24px",background:C.bg,
        borderTop:`1px solid ${C.border}`,zIndex:50}}>
        {phase==="preview" ? (
          <button onClick={handleSimulate} style={{
            background:C.black,color:"#fff",border:"none",padding:"17px 0",width:"100%",
            cursor:"pointer",fontFamily:F.display,fontSize:14,letterSpacing:2,transition:"background .15s"
          }}
            onMouseEnter={e=>e.currentTarget.style.background=C.green}
            onMouseLeave={e=>e.currentTarget.style.background=C.black}>
            ▶ SIMULAR RODADA {roundIdx+1}
          </button>
        ) : (
          <button onClick={handleNext} style={{
            background:myWon?C.green:myDrew?C.yellow:C.red,color:"#fff",
            border:"none",padding:"17px 0",width:"100%",cursor:"pointer",
            fontFamily:F.display,fontSize:14,letterSpacing:2
          }}>
            {roundIdx>=37?"VER CLASSIFICAÇÃO FINAL →":`PRÓXIMA RODADA →`}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════════════════ */
function loadHistory(){try{return JSON.parse(localStorage.getItem("brasileirao_draft_v2")||"[]");}catch{return[];}}
function saveHistory(h){try{const d=loadHistory();d.unshift(h);localStorage.setItem("brasileirao_draft_v2",JSON.stringify(d.slice(0,8)));}catch{}}

export default function App() {
  const [screen, setScreen] = useState("club");  // club | formation | builder | championship
  const [club, setClub]         = useState(null);
  const [formation, setFormation] = useState(null);
  const [squad, setSquad]       = useState(null);
  const [history, setHistory]   = useState(()=>loadHistory());

  const reset = () => {
    setScreen("club");
    setClub(null); setFormation(null); setSquad(null);
  };

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:C.bg,fontFamily:F.body}}>
      {screen==="club" && (
        <ClubPickScreen
          history={history}
          onPick={c=>{setClub(c);setScreen("formation");}}
        />
      )}
      {screen==="formation" && club && (
        <FormationScreen
          club={club}
          onConfirm={f=>{setFormation(f);setScreen("builder");}}
        />
      )}
      {screen==="builder" && club && formation && (
        <SquadBuilderScreen
          club={club}
          formation={formation}
          onConfirm={s=>{setSquad(s);setScreen("championship");}}
        />
      )}
      {screen==="championship" && club && formation && squad && (
        <ChampionshipScreen
          club={club}
          formation={formation}
          squad={squad}
          onFinish={(result)=>{
            const h={
              date:new Date().toLocaleDateString("pt-BR"),
              club, formation,
              champ:result?.champ||false,
              result:result?.result||"Concluído"
            };
            saveHistory(h);
            setHistory(loadHistory());
            reset();
          }}
        />
      )}
    </div>
  );
}
