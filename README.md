# Field Data Tracker

Crie um sistema web (aplicação full-stack) para coleta e visualização de dados de monitoramento ambiental de campo, com os seguintes requisitos:

Contexto: O sistema é usado por pesquisadores de campo para registrar observações organizadas em 10 protocolos diferentes, cada um com seus próprios campos.

Campos comuns a todo registro (em qualquer protocolo):

Pesquisador (texto)

Local de pesquisa (texto)

Ambiente (texto)

Data da coleta (data)

Horário início (hora)

Horário término (hora)

Protocolos e seus campos específicos:

Carcinofauna: espécie (texto), nomenclatura (texto), descrição (texto), origem (texto), quantidade (inteiro), tamanho da toca em cm (decimal)

Qualidade da Água: classe CONAMA (texto), condições climáticas (texto), temperatura da água °C (decimal), turbidez NTU (decimal), pH (decimal), salinidade ‰ (decimal), nitrito mg/L (decimal), amônia mg/L (decimal), oxigênio dissolvido mg/L (decimal)

Avifauna: espécie (texto), nomenclatura (texto), descrição (texto), quantidade (inteiro), vivos (inteiro), mortos (inteiro)

Espécies Exóticas: espécie (texto), nomenclatura (texto), descrição (texto), quantidade (inteiro)

Macrolixo: tipo (texto), quantidade (inteiro)

Vegetação: tipo (texto), nomenclatura (texto), descrição (texto), quantidade (inteiro)

Peixes: espécie (texto), nomenclatura (texto), descrição (texto), tamanho em cm (decimal), quantidade (inteiro)

Paisagem: características (texto), quantidade (inteiro)

Ar: observações (texto)

Restinga: tipo (texto), nomenclatura (texto), animal (texto), ecossistema (texto), resíduos encontrados (texto), quantidade (inteiro), quantidade de resíduos (inteiro), tamanho maior cm (decimal), tamanho menor cm (decimal)

Funcionalidades necessárias:

Tela inicial / Dashboard: cards com resumo de quantos registros existem por protocolo, filtros por data/local/pesquisador, e visão geral (ex: total de registros, últimos registros adicionados).

Tela de cadastro (formulário) por protocolo: menu/seletor para escolher qual protocolo preencher; formulário dinâmico exibindo os campos comuns + os campos específicos do protocolo escolhido; validação de tipos (números não aceitam texto, datas em formato correto); botão salvar.

Tela de listagem/visualização por protocolo: tabela com todos os registros daquele protocolo, colunas ordenáveis, busca/filtro por texto e por intervalo de datas, opção de editar e excluir registro, exportar dados (CSV ou Excel).

Tela de visualização geral: gráficos simples (ex: quantidade de registros por protocolo, evolução no tempo, quantidade por espécie/tipo) usando biblioteca de gráficos.

Requisitos técnicos:

Frontend: React (com Tailwind para estilização), responsivo (usável em campo pelo celular/tablet)

Backend: API REST (Node.js/Express ou similar) com banco de dados relacional (PostgreSQL ou SQLite) — uma tabela por protocolo, todas compartilhando os campos comuns

Autenticação simples de pesquisador (login básico) para registrar quem inseriu o dado

Funcionar offline-first seria um diferencial (para uso em campo sem internet), sincronizando quando houver conexão

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nature-notes-sync.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a706f39f-aba2-4610-91b3-7d345b603488).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
