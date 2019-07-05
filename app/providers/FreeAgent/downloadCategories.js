'use strict';

const _ = require('lodash');
const { api, extractId } = require('./api');
const { processCategories } = require('../../core/helpers');
const shouldRefreshToken = require('./shouldRefreshToken');
const schema = require('./schemas/category');

/**
 * Fetch and normalize categories
 * @param ctx
 * @return {function(): Promise<*|Knex.QueryBuilder>}
 */
const downloadCategories = (ctx) => async () => {
  return processCategories(ctx, schema, fetchCategories, getCategoryProviderRef, normalizeCategory);
};

/**
 * Fetch categories
 * @param ctx
 * @return {Promise<any[]>}
 */
const fetchCategories = async (ctx) => {
  const req = api(ctx);
  let data;
  try {
    data = await req.fetchCategories();
  } catch (e) {
    await shouldRefreshToken(ctx, e);
    return fetchCategories(ctx);
  }

  // flatten data (it gets returned as: {income_categories: [], bank_categories: []} etc.)
  return _.flatMap(data);
};

/**
 * category provider ref getter
 * @param category
 * @return {*}
 */
const getCategoryProviderRef = (category) => {
  return extractId('categories', category.url);
};

/**
 * Normalize API data from category fetch
 * @param row
 * @return {*}
 */
const normalizeCategory = (row) => {
  const data = row.data;

  // build tree
  const tree = [];
  if (data.group_description) {
    tree.push(data.group_description);
  }
  tree.push(data.description);

  // normalize
  return {
    user_id: row.user_id,
    provider_id: row.provider_id,
    provider_ref: row.provider_ref,
    name: data.description,
    tree: JSON.stringify(tree),
  };
};

module.exports = {
  downloadCategories,
  getCategoryProviderRef,
  normalizeCategory,
};
