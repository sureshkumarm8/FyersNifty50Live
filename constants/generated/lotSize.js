// GENERATED FILE - DO NOT EDIT.
// Plain-JS mirror emitted from ../<name>.ts by scripts/generateConstantsJs.cjs
// so plain-node handlers (api/cron-fetch.js) can import it. Edit the .ts and
// run `npm run generate:constants`.
const NIFTY_LOT_SIZE = 65;
function assertValidLotSize(qty) {
  return qty > 0 && qty % NIFTY_LOT_SIZE === 0;
}
export {
  NIFTY_LOT_SIZE,
  assertValidLotSize
};
