# Odds to Probability

Extensão simples para Chrome que converte odds decimais em probabilidade implícita diretamente na página.

Foi criada para sites de apostas como a Betano, mas roda em qualquer página que exiba odds decimais no formato comum de sportsbook.

## Exemplo

```txt
1.09 -> 91.74%
2.00 -> 50.00%
3.50 -> 28.57%
7.90 -> 12.66%
```

A conta usada é:

```txt
probabilidade = 100 / odd
```

Esse percentual é a probabilidade implícita da odd. Ele não representa a probabilidade real do evento, porque casas de aposta incluem margem.

## Instalação

1. Baixe ou clone este repositório.
2. Abra `chrome://extensions`.
3. Ative `Modo do desenvolvedor`.
4. Clique em `Carregar sem compactação`.
5. Selecione a pasta deste projeto.
6. Recarregue a página do site onde quer usar.

## Comportamento

Por padrão, a extensão substitui a odd pelo percentual:

```txt
2.00 -> 50.00%
```

Para mostrar a odd original junto do percentual, altere em `content.js`:

```js
mode: "append",
```

Resultado:

```txt
2.00 -> 2.00 (50.00%)
```

## Heurística

Para evitar falsos positivos, a extensão converte apenas odds com duas casas decimais:

```txt
1.90
2.35
11.00
```

Ela evita converter valores que costumam ser linhas de mercado, handicaps ou totais:

```txt
2.5
0.5
+1.5
Mais de 2.5
Menos de 2.5
```

Também ignora valores monetários, percentuais já convertidos e textos misturados.

## Validação

Os testes cobrem:

- odds com ponto e vírgula decimal;
- páginas que atualizam o DOM com frequência;
- proteção contra `%%`;
- valores monetários como `R$1,00`, `R$55.56`, `$2.35`;
- mercados como `Mais de 2.5`, `Menos de 2.5`, `Over 2.5`, `Under 2.5`;
- reprocessamento repetido da mesma página.

Para rodar:

```bash
node --check content.js
node test-content.mjs
```

## Limitações

- Odds exibidas como `2.5` em vez de `2.50` não são convertidas.
- A extensão não normaliza probabilidades para somarem 100% dentro de um mercado.
- A extensão mostra a probabilidade implícita individual, incluindo a margem da casa.
