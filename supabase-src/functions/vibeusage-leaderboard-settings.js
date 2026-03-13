// Edge function: vibeusage-leaderboard-settings
// Retired: replaced by vibeusage-public-visibility.

'use strict';

const { handleOptions, json } = require('../shared/http');
const { withRequestLogging } = require('../shared/logging');

module.exports = withRequestLogging('vibeusage-leaderboard-settings', async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;
  return json({ error: 'Endpoint retired' }, 410);
});
