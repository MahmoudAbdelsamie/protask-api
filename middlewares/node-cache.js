const NodeCache = require("node-cache");
let myCache;

module.exports = {
  init: () => {
    myCache = new NodeCache({ useClones: false });
    return myCache;
  },
  getMyCash: () => {
    if (!myCache) {
      throw new Error("cash is not initialized");
    }
    return myCache;
  },
};
