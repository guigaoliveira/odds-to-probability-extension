# Odds to Probability

Extensao simples para Chrome que troca odds decimais por probabilidade implicita diretamente na pagina.

Ela foi criada para uso rapido em sites de apostas como a Betano, mas a logica e generica e roda em qualquer pagina carregada no Chrome.

## O que ela faz

A extensao procura odds decimais exibidas na pagina e troca pelo percentual equivalente:

```txt
1.09 -> 91.74%
2.00 -> 50.00%
3.50 -> 28.57%
7.90 -> 12.66%
```

A formula usada e:

```txt
probabilidade = 100 / odd
```

Essa e a probabilidade implicita da odd. Ela nao e a probabilidade real do evento, porque casas de aposta normalmente incluem margem.

## Como instalar no Chrome

1. Baixe ou clone este repositorio.
2. Abra `chrome://extensions`.
3. Ative `Modo do desenvolvedor`.
4. Clique em `Carregar sem compactacao`.
5. Selecione a pasta deste projeto.
6. Recarregue a pagina do site onde voce quer usar.

Quando alterar algum arquivo da extensao, volte em `chrome://extensions`, clique em recarregar na extensao e depois recarregue a pagina do site.

## Como usar

Depois de instalada, a extensao roda automaticamente nas paginas abertas.

Por padrao ela substitui a odd pelo percentual:

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
- decimal com virgula: `1,20`;
- paginas que atualizam o DOM frequentemente;
- texto ja convertido com `%`, para evitar `%%`;
- valores monetarios como `R$1,00`, `R$55.56`, `$2.35`, `2.35 EUR`;
- valores monetarios com `R$` em outro no do DOM;
- labels de mercado como `Mais de 2.5`, `Menos de 2.5`, `Over 2.5`, `Under 2.5`;
- numeros de versao ou texto misturado, como `version 10.12.3`;
- reprocessamento repetido da mesma pagina sem reconverter o percentual.

Os testes podem ser rodados com:

```bash
node --check content.js
node test-content.mjs
```

## Regra principal

Para reduzir falsos positivos, a extensao converte apenas odds exibidas como decimal com duas casas:

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

Isso e intencional. Em sites como a Betano, linhas de mercado costumam aparecer com uma casa decimal, enquanto odds reais aparecem com duas casas.

## Limitacoes

- Se algum site exibir uma odd real como `2.5` em vez de `2.50`, ela nao sera convertida.
- A extensao nao normaliza probabilidades para somarem 100% dentro de um mercado.
- A extensao mostra probabilidade implicita individual, incluindo a margem da casa.
- Textos que ja foram alterados por uma versao antiga da extensao precisam ser restaurados recarregando a pagina.

## Arquivos

- `manifest.json`: configuracao da extensao Chrome.
- `content.js`: script que roda nas paginas e faz a conversao.
- `test-content.mjs`: testes locais da heuristica de conversao.
