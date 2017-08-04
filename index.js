const debug = require('debug')('occupy-sarahah:index');
const Sarahah = require('./lib/sarahah');
const lerolero = require('lerolero');

function flood(profile, interval) {
  debug(`starting flooder for profile ${profile} with interval ${interval}`);
  setInterval(async () => {
    try {
      const info = await Sarahah.getProfileInfo(profile);
      await Sarahah.postMessage({
        profile,
        cookies: info.cookies,
        token: info.token,
        id: info.id,
        message: lerolero(),
      });
    } catch (err) {
      console.log(err.message);
    }
  }, interval || 5000);
}

/**
 *
 * @param {String[]} users
 * @param {Number} interval
 */
module.exports = (users, interval) => users.forEach(user => flood(user, interval));
