# Brasileirão Draft

Jogo de draft inspirado no [7RIKAS](https://markitomesquita.github.io/7rikas/).

Monte o time dos sonhos com os maiores craques da história dos clubes do Campeonato Brasileiro e dispute a Copa do Brasil virtual.

## Como rodar localmente

```bash
npm install
npm run dev
```

## Como fazer o deploy no GitHub Pages

### 1. Crie o repositório no GitHub
- Crie um novo repo (ex: `brasileirao-draft`)
- Push o código para o branch `main`

### 2. Configure o vite.config.js
Mude a linha `base` para o nome do seu repositório:
```js
base: '/SEU-REPO-AQUI/',
```

### 3. Ative o GitHub Pages
- Vá em **Settings > Pages**
- Em **Source**, selecione **GitHub Actions**

### 4. Push → deploy automático
Toda vez que você fizer push na `main`, o GitHub Actions vai buildar e publicar o site automaticamente.

## Como personalizar

### Adicionar times/elencos
Abra `src/App.jsx` e edite o array `SQUADS`. Cada entrada tem:
```js
{
  year: 2023,           // ano — ID único
  club: "Flamengo",     // nome do clube
  ed: "Brasileirão 2023",  // nome da edição
  champion: true,       // true se ganhou o título
  color: "#CC0000",     // cor primária do clube
  players: [
    { name: "Jogador", shirt: 10, pos: "CA", rating: 88 },
    // ...11 jogadores no total
  ]
}
```

**Posições válidas:** `GOL | LD | ZAG | LE | VOL | MC | MD | ME | CA`

### Mudar o tema de cores
Edite o objeto `C` no topo do `App.jsx`:
```js
const C = {
  green: "#009640",   // cor primária
  gold:  "#FFD700",   // cor secundária
  // ...
};
```

### Mudar o torneio
Para mudar de "Copa do Brasil" para outro torneio, pesquise por `Copa do Brasil` no código e substitua pelo nome desejado.

## Estrutura do projeto

```
brasileirao-draft/
├── src/
│   ├── App.jsx       ← todo o jogo está aqui
│   └── main.jsx      ← entry point React
├── index.html
├── vite.config.js    ← configurar base para seu repo
└── .github/
    └── workflows/
        └── deploy.yml ← CI/CD automático
```
