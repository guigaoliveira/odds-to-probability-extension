import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("./content.js", import.meta.url), "utf8");
const context = {
  console,
  globalThis: {},
};

vm.createContext(context);
vm.runInContext(source, context);

const { hasCurrencyNearMatch, isLineMarketContext, normalizeText } =
  context.globalThis.__oddsToProbabilityForTest;

assert.equal(normalizeText("1.09"), "91.74%");
assert.equal(normalizeText("2.00"), "50.00%");
assert.equal(normalizeText("7.90"), "12.66%");
assert.equal(normalizeText("300.00"), "0.33%");
assert.equal(normalizeText("1000.00"), "0.10%");
assert.equal(normalizeText("1,20"), "83.33%");
assert.equal(normalizeText("2.5"), "2.5");
assert.equal(normalizeText("0.5"), "0.5");
assert.equal(normalizeText("10.5"), "10.5");
assert.equal(normalizeText("+1.5"), "+1.5");
assert.equal(normalizeText("91.74%"), "91.74%");
assert.equal(normalizeText("91.74%%"), "91.74%");
assert.equal(normalizeText("1.09 (91.74%)"), "1.09 (91.74%)");
assert.equal(normalizeText("score 0 7 odd 2.35"), "score 0 7 odd 2.35");
assert.equal(normalizeText("version 10.12.3"), "version 10.12.3");
assert.equal(normalizeText("Ganhos Potenciais R$1.80"), "Ganhos Potenciais R$1.80");
assert.equal(normalizeText("Ganhos Potenciais R$55.56"), "Ganhos Potenciais R$55.56");
assert.equal(normalizeText("Aposta R$1,00"), "Aposta R$1,00");
assert.equal(normalizeText("$2.35"), "$2.35");
assert.equal(normalizeText("2.35 EUR"), "2.35 EUR");
assert.equal(normalizeText("Mais de 1.27"), "Mais de 1.27");
assert.equal(normalizeText("Menos de 1.27"), "Menos de 1.27");
assert.equal(normalizeText("APOSTE JÁ R$1,00"), "APOSTE JÁ R$1,00");

assert.equal(isLineMarketContext("Mais de "), true);
assert.equal(isLineMarketContext("Menos de "), true);
assert.equal(isLineMarketContext("Over "), true);
assert.equal(isLineMarketContext("Under "), true);

const currencySibling = {
  nodeType: 3,
  textContent: "1.80",
  previousSibling: {
    textContent: "R$",
  },
};

assert.equal(normalizeText("1.80", currencySibling), "1.80");

const nestedCurrency = {
  nodeType: 3,
  textContent: "1.80",
  parentElement: {
    textContent: "Ganhos Potenciais R$1.80",
    parentElement: null,
  },
};

assert.equal(hasCurrencyNearMatch(nestedCurrency, "1.80"), true);
assert.equal(normalizeText("1.80", nestedCurrency), "1.80");

const moreThanSibling = {
  nodeType: 3,
  textContent: "2.50",
  previousSibling: {
    textContent: "Mais de ",
  },
};

const lessThanSibling = {
  nodeType: 3,
  textContent: "2.50",
  previousSibling: {
    textContent: "Menos de ",
  },
};

assert.equal(normalizeText("2.50", moreThanSibling), "2.50");
assert.equal(normalizeText("2.50", lessThanSibling), "2.50");

let current = "1.75";
current = normalizeText(current);
assert.equal(current, "57.14%");
current = normalizeText(current);
assert.equal(current, "57.14%");
current = normalizeText("2.35");
assert.equal(current, "42.55%");

console.log("content.js tests passed");
