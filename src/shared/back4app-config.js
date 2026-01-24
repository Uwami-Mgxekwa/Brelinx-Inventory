const Parse = require('parse/node');

// Back4App configuration
const BACK4APP_CONFIG = {
    APP_ID: 'OdqSvGLQpSWYhPw1DOjlWfPomCUe2wkdni1dUr2e',
    JAVASCRIPT_KEY: 'nUnEGrYHCSbsXQJhvGNzEFpV0SOBSwZryBag9EE5',
    SERVER_URL: 'https://parseapi.back4app.com/'
};

// Initialize Parse
Parse.initialize(BACK4APP_CONFIG.APP_ID, BACK4APP_CONFIG.JAVASCRIPT_KEY);
Parse.serverURL = BACK4APP_CONFIG.SERVER_URL;

module.exports = { Parse, BACK4APP_CONFIG };