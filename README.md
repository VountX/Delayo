# Delayo Chrome Extension 💤

**Adie suas abas com estilo — e volte a elas no momento certo.**  
Delayo é uma extensão do Chrome que permite "colocar abas em espera", escondendo-as temporariamente e reabrindo-as no momento que você escolher.  
Ideal para quem quer foco, organização e menos bagunça na barra de abas.

> 📌 Este projeto é um *hard fork* do [Snoozr](https://github.com/hardchor/snoozr), com novas ideias, identidade própria e planos de evolução distintos.

---

## 🚀 Features

- 💤 **Delay Tabs**: Adie abas temporariamente para focar no que importa agora
- ⏰ **Flexible Timing**: Escolha entre horários predefinidos (hoje à noite, amanhã, semana que vem) ou data/hora customizada
- 🔔 **Notifications**: Seja avisado quando as abas "acordarem"
- 📋 **Delay Manager**: Gerencie todas as abas adiadas em um só lugar
- 🌙 **Dark Mode**: Tema escuro automático com base no sistema

---

## 🧰 Tech Stack

| Tecnologia    | Função                                          |
|---------------|--------------------------------------------------|
| **Vite**      | Desenvolvimento rápido com hot reload           |
| **TypeScript**| Tipagem segura e produtividade no código        |
| **React**     | Interfaces dinâmicas e responsivas              |
| **CRX**       | Empacotamento moderno de extensões para o Chrome|
| **Tailwind CSS** | Estilização ágil e escalável                 |
| **DaisyUI**   | Componentes elegantes com suporte a temas       |

---

## 📦 Como Usar

1. 📥 Instale a extensão pela Chrome Web Store (ou carregue não empacotada via `chrome://extensions`)
2. 🖱️ Clique com o botão direito em uma aba ou use o ícone da extensão
3. ⏱️ Escolha quando deseja que a aba retorne
4. 💤 A aba será fechada e reaberta automaticamente no horário escolhido

---

## 🧑‍💻 Desenvolvimento

Para rodar localmente:

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/delayo.git
cd delayo

# 2. Instale dependências
pnpm install

# 3. Rode em modo de desenvolvimento
pnpm dev

# 4. Build para produção
pnpm build
```

## ⚖️ Licença

Este projeto está licenciado sob a [MIT License](LICENSE).  
Baseado no projeto [Snoozr](https://github.com/hardchor/snoozr), com modificações e identidade própria.
