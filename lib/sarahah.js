const debug = require('debug')('occupy-sarahah:sarahah');
const puppeteer = require('puppeteer');

const getProfileUrl = profile => `https://${profile}.sarahah.com`;

let browser;

async function initialize() {
  browser = await puppeteer.launch();
  debug('browser loaded');
}

async function postMessage(options) {
  debug(`posting message to ${options.profile}`);

  const page = await browser.newPage();
  debug('opened a new page');

  try {
    await page.goto(getProfileUrl(options.profile));
    debug('loading page');

    await page.waitForNavigation({ waitUntil: 'networkidle', networkIdleTimeout: 500 });
    debug('finished loading page');

    const captcha = await page.$('#recaptcha-anchor > div.recaptcha-checkbox-checkmark');
    if (captcha) {
      debug('captcha found');
      await captcha.click();
      debug('validating captcha');
      await page.waitForSelector('span.recaptcha-checkbox-checked');
      debug('captcha validated');
    } else {
      debug('no captcha was found :)');
    }

    const textArea = await page.$('#Text');
    await textArea.click();

    debug('writing message');
    for (let i = 0, len = options.message.length; len > i; i += 1) {
      await page.keyboard.sendCharacter(options.message[i]);
    }

    await new Promise(async (resolve, reject) => {
      page.on('response', (response) => {
        if (response.ok) return resolve();
        reject(new Error(`failed with status ${response.status}`));
      });

      page.on('requestfailed', () => {
        reject(new Error('request failed'));
      });

      const sendButton = await page.$('#Send');
      await sendButton.click();
      debug('sending message');
    });

    debug('finisehd sending message to profile', options.profile);
  } catch (err) {
    throw err;
  } finally {
    await page.close();
  }
}

module.exports = {
  initialize,
  postMessage,
};
