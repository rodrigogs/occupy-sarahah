const debug = require('debug')('occupy-sarahah:sarahah');
const https = require('https');
const qs = require('querystring');

const TOKEN_REGEX = /<input name="__RequestVerificationToken" type="hidden" value="([\s\S]*?)" \/>/g;
const ID_REGEX = /<input id="RecipientId" type="hidden" value="([\s\S]*?)" \/>/g;
const getProfileUrl = profile => `https://${profile}.sarahah.com`;

function _loadPage(profile) {
  debug(`loading profile page for ${profile}`);
  return new Promise((resolve, reject) => {
    const req = https.get(getProfileUrl(profile), (res) => {
      const chunks = [];

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode}`));
      }

      const cookies = res.headers['set-cookie'].join('; ');

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        debug(`finished loading profile page for ${profile} with status ${res.statusCode}`);
        const body = Buffer.concat(chunks).toString();
        resolve({
          body,
          cookies,
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function getProfileInfo(profile) {
  debug(`loading profile info for ${profile}`);
  const page = await _loadPage(profile);
  const token = page.body
    .match(TOKEN_REGEX)[0]
    .replace('<input name="__RequestVerificationToken" type="hidden" value="', '')
    .replace('" />', '');

  const id = page.body
    .match(ID_REGEX)[0]
    .replace('<input id="RecipientId" type="hidden" value="', '')
    .replace('" />', '');

  return { token, id, cookies: page.cookies };
}

async function postMessage(options) {
  debug(`posting message to ${options.profile}`);
  const request = {
    method: 'POST',
    hostname: getProfileUrl(options.profile).replace('https://'),
    path: '/Messages/SendMessage',
    headers: {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.6,en;q=0.4',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
      Connection: 'keep-alive',
      Cookie: options.cookies,
      Host: `${options.profile}.sarahah.com`,
      Origin: getProfileUrl(options.profile),
      Referer: `${getProfileUrl(options.profile)}/`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(request, (res) => {
      const chunks = [];

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode}`));
      }

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        debug(`finished posting message to profile ${options.profile} with status ${res.statusCode}`);
        const body = Buffer.concat(chunks).toString();
        if (body === '"Error"') {
          return reject(new Error('Message post failed'));
        }
        resolve(body);
      });
    });

    req.write(qs.stringify({
      __RequestVerificationToken: options.token,
      userId: options.id,
      text: options.message,
    }));

    req.on('error', reject);
    req.end();
  });
}

module.exports = {
  getProfileInfo,
  postMessage,
};
