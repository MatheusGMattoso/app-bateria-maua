# Núcleo de Administração da Bateria Mauá: Arquitetura e Desenvolvimento de um Aplicativo Multiplataforma para Gestão Integrada

## 📌 Sobre o Projeto
Este projeto consiste em um ecossistema digital multiplataforma desenvolvido para centralizar e aprimorar a governança organizacional da **Bateria Mauá**. A solução substitui práticas informais e planilhas descentralizadas por um sistema robusto fundamentado em princípios de Engenharia de Software, garantindo a integridade dos dados e a rastreabilidade das informações.

O sistema atende às necessidades específicas de agremiações universitárias, lidando com os desafios da alta rotatividade de membros e a complexidade da gestão de ativos e capital humano.

## 🚀 Funcionalidades Principais
* **Gestão de Membros:** Módulo completo para cadastro, atualização e organização das informações dos integrantes.
* **Controle de Presença:** Registro e acompanhamento automatizado da frequência em ensaios e eventos.
* **Controle Patrimonial:** Gerenciamento do inventário de instrumentos e uniformes, garantindo rastreabilidade e organização dos ativos.
* **Sincronização em Tempo Real:** Atualização contínua das informações entre diferentes dispositivos dos usuários.
* **Controle de Acesso (RBAC):** Sistema de permissões baseado em perfis hierárquicos para garantir segurança e controle:
    * **Administrador (Presidência):** Privilégios totais de superusuário e gestão estratégica.
    * **Gestor de Módulo (Diretorias):** Permissões de criação e edição restritas às suas áreas de responsabilidade.
    * **Membro (Ritmista):** Acesso a informações pessoais, histórico de presença e agenda.
    * **Visitante (Ingressantes/Calouros):** Acesso limitado a funcionalidades públicas e inscrições.

## 🛠️ Stack Tecnológica
A arquitetura foi selecionada para equilibrar desempenho, escalabilidade e custo de manutenção:

* **Frontend Mobile:** [React Native](https://reactnative.dev/) (Base de código única para dispositivos móveis).
* **Backend:** [Node.js](https://nodejs.org/) (Construção de API RESTful para lógica de negócio).
* **Persistência de Dados (Arquitetura Híbrida):**
    * **PostgreSQL:** Armazenamento de dados estruturados e relacionais.
    * **MongoDB:** Armazenamento de dados não estruturados, como logs e históricos.
* **Infraestrutura e Cloud:** [Vercel](https://vercel.com/) e [Supabase](https://supabase.com/) (Hospedagem, autenticação e serviços de backend).

## 📖 Metodologia
O desenvolvimento caracteriza-se como um estudo de natureza aplicada com abordagem experimental. A metodologia baseia-se em práticas de **metodologias ágeis**, permitindo ciclos iterativos e incrementais para validação contínua dos requisitos junto aos stakeholders.

## ⚙️ Guia de Inicialização - Backend
Este é o servidor Node.js responsável por gerenciar a API, a autenticação e a comunicação com o banco de dados relacional (Supabase) do aplicativo.

### 📋 Pré-requisitos
Antes de começar, você precisará ter instalado em sua máquina:
* [Node.js](https://nodejs.org/)
* Solicitar à equipe o arquivo `.env` contendo as credenciais de acesso ao banco de dados do projeto.

### 🛠️ Como rodar o projeto localmente
eu não p
**1. Clone o repositório e acesse a pasta do backend:**
```bash
git clone https://github.com/MatheusGMattoso/app-bateria-maua.git
cd app-bateria-maua/backend
```

**2. Instale as dependências:**
```bash
npm install
```

**3. Configure as Variáveis de Ambiente:**
Crie um arquivo chamado `.env` na raiz da pasta `backend` (este arquivo é ignorado pelo Git por segurança). Cole as credenciais fornecidas pela equipe:
```text
PORT=3000
SUPABASE_URL=url_fornecida_pela_equipe
SUPABASE_KEY=chave_fornecida_pela_equipe
```

**4. Inicie o servidor:**
```bash
node index.js
```
O servidor estará rodando e pronto para receber requisições na porta configurada (padrão: `http://localhost:3000`).

---

## 👥 Autores
* MATHEUS GARCIA MATTOSO
* MIGUEL GONÇALVES SAMPAIO NETO
* GUILHERME VIANA FIM
* PEDRO HENRIQUE DE PAIVA BITTENCOURT
* ARTHUR TRINDADE DE SOUZA
* **Orientador:** Prof. Alexsander

---
*Este projeto foi desenvolvido como parte do curso de Ciência da Computação do Centro Universitário do Instituto Mauá de Tecnologia (IMT).*
