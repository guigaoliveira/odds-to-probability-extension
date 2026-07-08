# Odds to Probability

Extensão simples para Chrome que troca odds decimais por probabilidade implícita diretamente na página.

Ela foi criada para uso rápido em sites de apostas como a Betano, mas a lógica é genérica e roda em qualquer página carregada no Chrome.

## O que ela faz

A extensão procura odds decimais exibidas na página e troca pelo percentual equivalente:

```txt
1.09 -> 91.74%
2.00 -> 50.00%
3.50 -> 28.57%
7.90 -> 12.66%
```

A fórmula usada é:

```txt
probabilidade = 100 / odd
```

Essa é a probabilidade implícita da odd. Ela não é a probabilidade real do evento, porque casas de aposta normalmente incluem margem.

## Como instalar no Chrome

1. Baixe ou clone este repositório.
2. Abra `chrome://extensions`.
3. Ative `Modo do desenvolvedor`.
4. Clique em `Carregar sem compactação`.
5. Selecione a pasta deste projeto.
6. Recarregue a página do site onde você quer usar.

Quando alterar algum arquivo da extensão, volte em `chrome://extensions`, clique em recarregar na extensão e depois recarregue a página do site.

## Como usar

Depois de instalada, a extensão roda automaticamente nas páginas abertas.

Por padrão ela substitui a odd pelo percentual:

```txt
2.00 -> 50.00%
```

Se quiser mostrar a odd original junto do percentual, edite `content.js`:

```js
mode: "append",
```

Assim:

```txt
2.00 -> 2.00 (50.00%)
```

## O que foi validado

Validamos os principais casos que apareceram durante o uso real:

- odds comuns com duas casas: `1.09`, `2.00`, `7.90`;
- decimal com vírgula: `1,20`;
- páginas que atualizam o DOM frequentemente;
- texto já convertido com `%`, para evitar `%%`;
- valores monetários como `R$1,00`, `R$55.56`, `$2.35`, `2.35 EUR`;
- valores monetários com `R$` em outro nó do DOM;
- labels de mercado como `Mais de 2.5`, `Menos de 2.5`, `Over 2.5`, `Under 2.5`;
- números de versão ou texto misturado, como `version 10.12.3`;
- reprocessamento repetido da mesma página sem reconverter o percentual.

Os testes podem ser rodados com:

```bash
node --check content.js
node test-content.mjs
```

## Regra principal

Para reduzir falsos positivos, a extensão converte apenas odds exibidas como decimal com duas casas:

```txt
1.90
2.35
11.00
```

Ela evita converter linhas de mercado e handicaps comuns:

```txt
2.5
0.5
+1.5
Mais de 2.5
Menos de 2.5
```

Isso é intencional. Em sites como a Betano, linhas de mercado costumam aparecer com uma casa decimal, enquanto odds reais aparecem com duas casas.

## Limitações

- Se algum site exibir uma odd real como `2.5` em vez de `2.50`, ela não será convertida.
- A extensão não normaliza probabilidades para somarem 100% dentro de um mercado.
- A extensão mostra probabilidade implícita individual, incluindo a margem da casa.
- Textos que já foram alterados por uma versão antiga da extensão precisam ser restaurados recarregando a página.

## Arquivos

- `manifest.json`: configuração da extensão Chrome.
- `content.js`: script que roda nas páginas e faz a conversão.
- `test-content.mjs`: testes locais da heurística de conversão.
