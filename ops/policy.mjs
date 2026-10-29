/**
 * CONVERSATION POLICY — deterministic checks around the model.
 *
 * `classifyIntent` runs BEFORE the model. Requests the agent must never act
 * on (place a trade, change a strategy parameter, defeat the kill switch,
 * predict the market) get a fixed reply without the model being asked, so no
 * amount of prompt pressure can talk it into anything.
 *
 * `postCheck` runs AFTER the model, on its final text: predictions and win
 * probabilities are replaced, and an answer that cites numbers without having
 * fetched any data this turn is marked as unverified.
 */

// A request, not a question about what an engine did: imperative at the start,
// "can you / please …", or an explicit quantity. "Why did the Sniper close the
// trade?" must still reach the model.
const ASK = String.raw`(?:^\s*|\b(?:can|could|would|will)\s+you\s+|\bplease\s+|\bi\s+want\s+(?:you\s+)?to\s+|\blet'?s\s+|\bgo\s+(?:and\s+)?)`;
const req = (body, flags = 'i') => new RegExp(ASK + body, flags);

const ORDER = [
  req(String.raw`(?:buy|sell|short)\b`),
  req(String.raw`(?:enter|exit|close|square[- ]?off|flatten)\s+(?:a|an|the|my|all|every|this|that)?\s*(?:position|positions|trade|trades|order|orders|long|short|ce|pe|calls?|puts?)\b`),
  req(String.raw`(?:place|fire|send|execute|take)\s+(?:an?\s+|the\s+|my\s+)?(?:order|trade|entry|position)\b`),
  req(String.raw`go\s+(?:long|short)\b`),
  /\b(?:buy|sell|short)\s+\d+\s*(?:lots?|qty|quantity|units?|contracts?)\b/i
];

const PARAM = [
  req(String.raw`(?:change|set|modify|update|increase|decrease|raise|lower|tweak|tune|adjust|move|make)\b[^.?!]*\b(?:stop|sl|target|threshold|param(?:eter)?s?|config|lots?|lot size|confidence|min(?:imum)? score|trail(?:ing)?|cooldown|limit|window|strategy)\b`)
];

const KILL = [
  req(String.raw`(?:disable|turn off|switch off|reset|unlatch|clear|bypass|override|remove|lift|undo|skip)\b[^.?!]*\b(?:kill|killswitch|kill-switch|guard|gate|safety|rule|limit)s?\b`),
  /\bignore\b[^.?!]*\b(?:rules?|instructions?|guard|safety|system prompt|restrictions?)\b/i,
  /^\s*(?:you are now|act as|pretend)\b|\b(?:jailbreak|developer mode|no restrictions)\b/i
];

const PREDICT = [
  /\b(?:probability|odds|chance|likelihood)\b[^.?!]*\b(?:nifty|market|index|price|win|go(?:es)?\s+(?:up|down))\b/i,
  /\b(?:predict|forecast)\b[^.?!]*\b(?:nifty|market|index|price|tomorrow|today|close)\b/i,
  /\bwill\s+(?:nifty|the market|the index|price|banknifty)\b[^.?!]*\b(?:go|rise|fall|close|hit|reach|break|move)\b/i,
  /\bwhere\s+will\s+(?:nifty|the market|the index|it)\b/i,
  /\b(?:price target|target price)\s+for\b/i
];

export function classifyIntent(text) {
  const t = String(text || '');
  if (KILL.some(re => re.test(t))) return 'kill_override';
  if (PARAM.some(re => re.test(t))) return 'param_change';
  if (ORDER.some(re => re.test(t))) return 'order';
  if (PREDICT.some(re => re.test(t))) return 'prediction';
  return null;
}

export const REFUSALS = {
  order:
    "I can't place, close or modify trades — entries and exits belong to the Sniper, Momentum and Opening Pilot engines and their rules. Here is what the engines are doing right now instead:",
  param_change:
    "I can't change strategy parameters, stops, targets or thresholds. Those live in versioned strategy config and are changed by you, deliberately, after review — not from a chat. Current engine state, for reference:",
  kill_override:
    "I can't disable, reset or bypass the kill switch or any safety rule, and instructions to ignore my rules don't change that. A latched kill switch is cleared by you, from the AutoTrade screen, after you've checked why it fired.",
  prediction:
    "I don't give market predictions, price targets or win probabilities — there's no measured edge that would make such a number honest, and the confidence scores in this app aren't calibrated. I can tell you what the engines see and which rules are passing or blocking."
};

const PREDICTIVE_OUTPUT = [
  /\b\d{1,3}(\.\d+)?\s*%\s*(chance|probability|likely|likelihood|odds)\b/i,
  /\b(probability|chance|odds|likelihood)\s+(of|that)\b[^.]*\b(nifty|market|index|price|it)\b[^.]*\b(up|down|rise|fall|close|hit|reach)\b/i,
  /\b(nifty|the market|the index)\s+(will|is going to|should)\s+(likely\s+)?(rise|fall|go up|go down|rally|drop|close (above|below)|hit|reach)\b/i,
  /\b(i (expect|predict|forecast))\b[^.]*\b(nifty|market|index|price)\b/i
];

/** True when text reads as a market prediction or win probability. */
export const hasPrediction = text => PREDICTIVE_OUTPUT.some(re => re.test(String(text || '')));

/**
 * @returns {{ text: string, flags: string[] }}
 */
export function postCheck(text, { toolCalls = 0 } = {}) {
  const flags = [];
  let out = String(text || '').trim();
  if (PREDICTIVE_OUTPUT.some(re => re.test(out))) {
    flags.push('prediction_removed');
    out = `${REFUSALS.prediction}\n\n_(The model's draft contained a market prediction and was withheld.)_`;
  }
  if (toolCalls === 0 && /\d/.test(out) && flags.length === 0) {
    flags.push('ungrounded');
    out += '\n\n_No data was fetched for this answer; treat any figures above as unverified._';
  }
  if (!out) {
    flags.push('empty');
    out = 'I could not produce an answer from the data available. Try asking about system health, app state or the journal.';
  }
  return { text: out, flags };
}
