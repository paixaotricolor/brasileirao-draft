# Guia de customização — Brasileirão Draft

Todo o jogo vive em um único arquivo: `src/App.jsx`.
Abaixo estão os três blocos que você vai editar, com localização exata e exemplos.

---

## 1. Layout e textos

### Cores do jogo
Bloco `C` no topo do arquivo (linhas ~36–53). Cada chave controla uma cor usada em toda a interface.

```js
const C = {
  green:   "#009640",  // cor principal (botões, destaques, campo)
  greenDk: "#1E4A26",  // faixa escura do campo
  stripe:  "#1A7A38",  // faixa clara do campo
  gold:    "#FFD700",  // cor do GOL no campo
  yellow:  "#E5A200",  // rating de goleiro
  black:   "#0A0A0A",  // botão principal, placar ao vivo
  ink:     "#111111",  // texto padrão
  muted:   "#888888",  // texto secundário
  red:     "#CC0000",  // cartão vermelho, erro
};
```

**Exemplo:** trocar verde por azul Cruzeiro:
```js
green: "#003DA5",
greenDk: "#002070",
stripe: "#0030A0",
```

---

### Fontes
Bloco `F` logo abaixo:
```js
const F = {
  display: "'Archivo Black', sans-serif",  // títulos grandes
  body:    "'Inter', sans-serif",           // todo o resto
};
```
Para trocar, mude aqui **e** atualize a URL do Google Fonts na linha ~6.

---

### Textos da tela de início (`IntroScreen`)
Busque por `function IntroScreen` (~linha 460). Os textos que aparecem na tela inicial são:

```jsx
<div>BRASILEIRÃO<br/>DRAFT</div>             {/* título grande */}
<div>Monte o time dos sonhos...</div>         {/* subtítulo */}

{/* lista de 3 taglines */}
["⚽","Sorteie elencos históricos dos grandes clubes do Brasil."],
["🏆","Dispute a Copa do Brasil virtual com seu time."],
["🎲","A força dos jogadores é o que vai te fazer campeão — ou não."],

<button>ROLAR 🎲</button>                    {/* botão de início */}
```

---

### Textos da tela de resultado (`ResultScreen`)
Busque por `function ResultScreen` (~linha 1230). As mensagens de campeão/eliminado:

```jsx
// Campeão:
"Seu time conquistou a Copa do Brasil."

// Eliminado:
`Caiu ${elimPhase?"nas "+elimPhase:"na fase de grupos"}.`
```

---

### Nome do torneio
Busque por `"Copa do Brasil"` no arquivo. Aparece em:
- Botão da tela de lineup: `"DISPUTAR A COPA"`
- Mensagem de campeão
- Título da fase de grupos: `"FASE DE GRUPOS"`
- Rodadas do mata-mata: `KO_ROUNDS`

```js
const KO_ROUNDS = ["Oitavas","Quartas","Semifinal","Final"];
// Troque por: ["Semifinal","Final"] para torneio menor, etc.
```

---

### Análise pós-jogo (comentário)
Busque por `function generateMatchCommentary` (~linha 370). São arrays de frases por situação:
- vitória por 3+ gols
- vitória por 2 gols
- vitória por 1 gol
- empate sem gols
- empate com gols
- derrota por 3+
- derrota por 1–2

Edite os textos nos arrays `opts` dentro de cada bloco `if/else`.

---

## 2. Elencos — nomes, nível e posições

### Estrutura de um elenco
Bloco `SQUADS` (~linha 120). Cada entrada é um objeto:

```js
{
  year: 2019,              // ⚠️ DEVE ser único — é o ID do elenco
  club: "Flamengo",        // nome exibido na slot machine e no banner
  ed: "Brasileirão 2019",  // nome completo da edição
  champion: true,          // true = exibe banner vermelho + 🏆 ANO CAMPEÃO
  color: "#CC0000",        // cor do banner (não usada atualmente, reservada)
  players: [ ... ]         // lista de 11 jogadores
}
```

### Estrutura de um jogador

```js
{ name: "Gabigol", shirt: 9, pos: "CA", rating: 92 }
```

| Campo    | Tipo    | Descrição |
|----------|---------|-----------|
| `name`   | string  | Nome exibido no card e no campo |
| `shirt`  | número  | Número da camisa (aparece no círculo do campo) |
| `pos`    | string  | Posição — ver tabela abaixo |
| `rating` | 60–99   | Força do jogador. ≥88 fica em verde destaque |

### Posições válidas

| Sigla | Grupo | Descrição |
|-------|-------|-----------|
| `GOL` | GOL   | Goleiro |
| `LD`  | DEF   | Lateral direito |
| `LE`  | DEF   | Lateral esquerdo |
| `ZAG` | DEF   | Zagueiro central |
| `VOL` | MID   | Volante |
| `MC`  | MID   | Meia central |
| `MD`  | MID   | Meia direito / ponta direita |
| `ME`  | MID   | Meia esquerdo / ponta esquerda |
| `CA`  | ATK   | Centroavante / atacante |

### Adicionar um elenco novo

Copie o bloco abaixo e cole dentro do array `SQUADS`, antes do `];` final:

```js
{year:2006,club:"Internacional",ed:"Copa do Mundo dos Clubes 2006",champion:true,color:"#E30613",players:[
  {name:"Renan",        shirt:1,  pos:"GOL", rating:82},
  {name:"Ceará",        shirt:2,  pos:"LD",  rating:80},
  {name:"Índio",        shirt:5,  pos:"ZAG", rating:82},
  {name:"Rubens",       shirt:4,  pos:"ZAG", rating:80},
  {name:"Fábio Aurélio",shirt:3,  pos:"LE",  rating:82},
  {name:"Tinga",        shirt:8,  pos:"VOL", rating:83},
  {name:"Bolívar",      shirt:6,  pos:"VOL", rating:81},
  {name:"D'Alessandro", shirt:10, pos:"MC",  rating:88},
  {name:"Adriano",      shirt:7,  pos:"MD",  rating:84},
  {name:"Fernandão",    shirt:9,  pos:"CA",  rating:88},
  {name:"Forlán",       shirt:11, pos:"ME",  rating:87},
]},
```

**Regras:**
- `year` deve ser único no array inteiro (se dois elencos do mesmo clube têm o mesmo ano, use `2006` e `20061` como hack, ou use decimais como `2006.1`)
- O elenco pode ter mais de 11 jogadores — o draft só mostra todos eles como opções de escolha
- Mínimo recomendado: 11 jogadores por elenco

---

## 3. Lógica de seleção — times e posições

### Como o draft sorteia elencos

Bloco `SlotMachine` e função `handleSlotDone` no componente `App`. A regra é simples:

```js
// A slot machine só sorteia elencos que:
// 1. Ainda não foram usados nesta rodada (usedYrs)
// 2. Não são o mesmo do turno anterior

const avail = SQUADS.filter(s =>
  !usedYrs.includes(s.year) &&   // não repetir elencos já sorteados
  s.year !== squad?.year          // não repetir o atual
);
```

**Para forçar um clube específico aparecer mais:** duplique entradas no array `SQUADS` com anos diferentes. O sorteio escolhe aleatoriamente dentre todos os elencos disponíveis.

**Para remover um elenco do sorteio temporariamente:** adicione `disabled: true` e filtre:
```js
// No início da SlotMachine e DraftScreen:
const avail = SQUADS.filter(s => !s.disabled && !usedYrs.includes(s.year)...);
```

---

### Como jogadores são atribuídos aos slots do campo (`assignToSlots`)

Função `assignToSlots` (~linha 93). Ela roda 3 passes:

```
Pass 0 → posição exata: slot "CA" só aceita jogador com pos:"CA"
Pass 1 → posição compatível: slot "CA" aceita pos:"ME" ou pos:"MD" (via SLOT_ACCEPTS)
Pass 2 → qualquer jogador restante (fallback, para não deixar slot vazio)
```

### Regras de compatibilidade entre posições (`SLOT_ACCEPTS`)

```js
const SLOT_ACCEPTS = {
  GOL: ["GOL"],                        // goleiro só entra no gol
  LD:  ["LD", "ZAG"],                  // LD pode cobrir ZAG
  LE:  ["LE", "ZAG"],                  // LE pode cobrir ZAG
  ZAG: ["ZAG", "LD", "LE"],            // ZAG pode cobrir laterais
  VOL: ["VOL", "MC"],                  // volante e meia central se cobrem
  MC:  ["MC", "VOL", "MD", "ME"],      // meia central é o mais polivalente
  MD:  ["MD", "MC", "CA", "ME"],       // ponta D pode jogar como CA
  ME:  ["ME", "MC", "CA", "MD"],       // ponta E pode jogar como CA
  CA:  ["CA", "ME", "MD"],             // centroavante pode vir pelas pontas
};
```

**Exemplo de customização:** permitir que volante jogue como zagueiro:
```js
VOL: ["VOL", "MC", "ZAG"],
ZAG: ["ZAG", "LD", "LE", "VOL"],
```

---

### Como a simulação de partida funciona (`buildMatchEvents`)

```js
const diff = (myR - oppR) / 12;  // diferença de rating normalizada

// Gols esperados: base + fator de diferença + aleatoriedade
const myG  = Math.max(0, Math.round(2.4 + diff + (Math.random() * 2.4 - 1)));
const oppG = Math.max(0, Math.round(2.0 - diff + (Math.random() * 2.4 - 1.1)));
```

**Para aumentar a imprevisibilidade:** aumente o fator aleatório de `2.4` para `3.0` ou mais.
**Para tornar o rating mais decisivo:** aumente o divisor de `12` para `8` (faz `diff` valer mais).
**Para jogos com mais gols:** aumente a base de `2.4` / `2.0`.

---

### Workflow para publicar alterações

```bash
# Na pasta do projeto
git add src/App.jsx
git commit -m "feat: atualiza elencos / ajusta textos"
git push
# Em ~60s o site https://paixaotricolor.github.io/brasileirao-draft/ já atualiza
```

---

## Referência rápida — onde está o quê

| O que mudar | Onde buscar no arquivo |
|---|---|
| Cores globais | `const C = {` |
| Fontes | `const F = {` + URL Google Fonts linha ~6 |
| Textos da intro | `function IntroScreen` |
| Textos de resultado | `function ResultScreen` |
| Comentários pós-jogo | `function generateMatchCommentary` |
| Fases do torneio | `const KO_ROUNDS` |
| Adversários no torneio | `const ALL_OPPONENTS` |
| Elencos históricos | `const SQUADS` |
| Posições aceitas por slot | `const SLOT_ACCEPTS` |
| Lógica de gols | `function buildMatchEvents` |
| Formações táticas | `const FORMATIONS` |
