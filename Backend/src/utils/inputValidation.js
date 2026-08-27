const mongoose = require("mongoose");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (page, limit, defaultLimit = 10) => {
  const parseValue = (value, fallback, maximum, name) => {
    if (value === undefined) return fallback;
    if (!/^\d+$/.test(String(value))) {
      throw new Error(`${name} must be a positive integer`);
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
      throw new Error(`${name} must be between 1 and ${maximum}`);
    }
    return parsed;
  };

  return {
    page: parseValue(page, 1, 100000, "Page"),
    limit: parseValue(limit, defaultLimit, 100, "Limit"),
  };
};

const assertObjectId = (value, name) => {
  if (!mongoose.isValidObjectId(value)) {
    throw new Error(`Invalid ${name} identifier`);
  }
};

module.exports = { escapeRegex, parsePagination, assertObjectId };
