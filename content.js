const CONFIG = {
  minOdd: 1.01,
  maxOdd: 100,
  decimals: 2,
  mode: "replace",
  periodicScanMs: 1000,
};

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
  "CODE",
  "PRE",
]);

const ODDS_PATTERN = /[1-9]\d{0,2}[.,]\d{2}/g;
const ODDS_ONLY_PATTERN = /^\s*([1-9]\d{0,2}[.,]\d{2})\s*$/;
const MAY_HAVE_ODDS_PATTERN = /[1-9]\d{0,2}[.,]\d{2}|%{2,}/;
const REPEATED_PERCENT_PATTERN = /(\d+(?:[.,]\d+)?)%{2,}/g;
const CURRENCY_BEFORE_PATTERN = /(?:R\$|US\$|BRL|USD|EUR|GBP|[$€£])\s*$/i;
const CURRENCY_AFTER_PATTERN = /^\s*(?:R\$|US\$|BRL|USD|EUR|GBP|[$€£])/i;
const LINE_MARKET_BEFORE_PATTERN =
  /(?:\bmais\s+de|\bmenos\s+de|\bacima\s+de|\babaixo\s+de|\bover|\bunder|\bmas\s+de|\bm[aá]s\s+de|\bplus\s+de|\bmoins\s+de|\bmayor\s+de|\bmenor\s+de)\s*$/i;
const TEXT_NODE = typeof Node === "undefined" ? 3 : Node.TEXT_NODE;
const ELEMENT_NODE = typeof Node === "undefined" ? 1 : Node.ELEMENT_NODE;

let observer;
let scheduled = false;
const pendingNodes = new Set();

function toProbabilityLabel(displayOdd) {
  const odd = Number(displayOdd.replace(",", "."));

  if (!Number.isFinite(odd)) return displayOdd;
  if (odd < CONFIG.minOdd || odd > CONFIG.maxOdd) return displayOdd;

  const probability = (100 / odd).toFixed(CONFIG.decimals);

  if (CONFIG.mode === "append") {
    return `${displayOdd} (${probability}%)`;
  }

  return `${probability}%`;
}

function getTextBeforeNode(node, maxLength) {
  let text = "";
  let current = node;

  while (current && text.length < maxLength) {
    while (current.previousSibling && text.length < maxLength) {
      current = current.previousSibling;
      text = `${current.textContent || ""}${text}`;
    }

    current = current.parentNode;
  }

  return text.slice(-maxLength);
}

function getTextAfterNode(node, maxLength) {
  let text = "";
  let current = node;

  while (current && text.length < maxLength) {
    while (current.nextSibling && text.length < maxLength) {
      current = current.nextSibling;
      text = `${text}${current.textContent || ""}`;
    }

    current = current.parentNode;
  }

  return text.slice(0, maxLength);
}

function isCurrencyContext(textBefore, textAfter) {
  return (
    CURRENCY_BEFORE_PATTERN.test(textBefore) ||
    CURRENCY_AFTER_PATTERN.test(textAfter)
  );
}

function isLineMarketContext(textBefore) {
  return LINE_MARKET_BEFORE_PATTERN.test(
    textBefore.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasCurrencyNearMatch(contextNode, match) {
  if (!contextNode || contextNode.nodeType !== TEXT_NODE) return false;

  let element = contextNode.parentElement;
  const escapedMatch = escapeRegExp(match);
  const currencyNearMatchPattern = new RegExp(
    `(?:R\\$|US\\$|BRL|USD|EUR|GBP|[$€£])\\s*${escapedMatch}\\b|\\b${escapedMatch}\\s*(?:R\\$|US\\$|BRL|USD|EUR|GBP|[$€£])`,
    "i"
  );

  for (let depth = 0; element && depth < 4; depth += 1) {
    const text = (element.textContent || "").replace(/\s+/g, " ").trim();

    if (currencyNearMatchPattern.test(text)) {
      return true;
    }

    element = element.parentElement;
  }

  return false;
}

function isSafeOddsMatch(text, match, offset, contextNode) {
  const previousChar = text[offset - 1] || "";
  const nextText = text.slice(offset + match.length);
  const previousText =
    contextNode && contextNode.nodeType === TEXT_NODE
      ? `${getTextBeforeNode(contextNode, 12)}${text.slice(0, offset)}`
      : text.slice(0, offset);
  const followingText =
    contextNode && contextNode.nodeType === TEXT_NODE
      ? `${nextText}${getTextAfterNode(contextNode, 12)}`
      : nextText;

  if (/[\d.,%]/.test(previousChar)) return false;
  if (/^[\d.,%]/.test(nextText)) return false;
  if (/^\s*%/.test(nextText)) return false;
  if (/^\s*\(\d+(?:[.,]\d+)?%\)/.test(nextText)) return false;
  if (isCurrencyContext(previousText, followingText)) return false;
  if (isLineMarketContext(previousText)) return false;
  if (hasCurrencyNearMatch(contextNode, match)) return false;

  return true;
}

function normalizeText(text, contextNode) {
  const normalizedPercent = text.replace(REPEATED_PERCENT_PATTERN, "$1%");
  const oddsOnlyMatch = normalizedPercent.match(ODDS_ONLY_PATTERN);

  if (!oddsOnlyMatch) {
    return normalizedPercent;
  }

  return normalizedPercent.replace(
    ODDS_PATTERN,
    (match, offset, sourceText) => {
      if (!isSafeOddsMatch(sourceText, match, offset, contextNode)) {
        return match;
      }

      return toProbabilityLabel(match);
    }
  );
}

function shouldSkipElement(element) {
  if (!element) return true;
  if (SKIP_TAGS.has(element.tagName)) return true;
  if (element.isContentEditable) return true;

  return false;
}

function replaceTextNode(node) {
  const parent = node.parentElement;
  if (shouldSkipElement(parent)) return;

  const originalText = node.nodeValue;
  if (!MAY_HAVE_ODDS_PATTERN.test(originalText)) return;

  const nextText = normalizeText(originalText, node);

  if (nextText !== originalText) {
    node.nodeValue = nextText;
  }
}

function walk(root) {
  if (!root) return;

  if (root.nodeType === TEXT_NODE) {
    replaceTextNode(root);
    return;
  }

  if (root.nodeType !== ELEMENT_NODE || shouldSkipElement(root)) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!MAY_HAVE_ODDS_PATTERN.test(node.nodeValue)) {
        return NodeFilter.FILTER_REJECT;
      }

      return shouldSkipElement(node.parentElement)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  for (const node of textNodes) {
    replaceTextNode(node);
  }
}

function observe() {
  if (!observer || !document.body) return;

  observer.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true,
  });
}

function flushPendingNodes() {
  scheduled = false;

  if (observer) {
    observer.disconnect();
  }

  const nodes = Array.from(pendingNodes);
  pendingNodes.clear();

  for (const node of nodes) {
    walk(node);
  }

  observe();
}

function scheduleNode(node) {
  if (!node) return;

  pendingNodes.add(node);

  if (scheduled) return;

  scheduled = true;
  const schedule =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (callback) => setTimeout(callback, 16);

  schedule(flushPendingNodes);
}

function start() {
  if (!document.body) return;

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        scheduleNode(mutation.target);
        continue;
      }

      for (const node of mutation.addedNodes) {
        scheduleNode(node);
      }
    }
  });

  scheduleNode(document.body);
  observe();

  setInterval(() => {
    scheduleNode(document.body);
  }, CONFIG.periodicScanMs);
}

if (typeof document !== "undefined") {
  start();
}

if (typeof globalThis !== "undefined") {
  Object.defineProperty(globalThis, "__oddsToProbabilityForTest", {
    value: {
      normalizeText,
      toProbabilityLabel,
      isCurrencyContext,
      isLineMarketContext,
      hasCurrencyNearMatch,
    },
    configurable: true,
  });
}
