const debug = require('debug')('occupy-sarahah:index');
const Sarahah = require('./lib/sarahah');
const lerolero = require('lerolero');

let openPages = 0;

async function flood(profile, interval) {
  debug(`starting flooder for profile ${profile} with interval ${interval}`);

  setInterval(async () => {
    if (openPages < 10) {
      try {
        openPages += 1;
        await Sarahah.postMessage({
          profile,
          message: lerolero(),
        });
      } catch (err) {
        console.log(err.message);
      } finally {
        openPages -= 1;
      }
    } else {
      debug('too much open pages, not opening page for', profile);
    }
  }, interval || 5000);
}

/**
 *
 * @param {String[]} users
 * @param {Number} interval
 */
module.exports = (users, interval) => {
  Sarahah.initialize()
    .then(() => users.forEach(user => flood(user, interval)));
};
