const axios = require('axios');
const os = require('os');
const { networkInterfaces } = require('os');
const { Logger } = require('euberlog');

function requireConfig() {
    try {
        return config = require('./config');
    }
    catch (error) {
        return require('./config.default');
    }
}

const { RATE_IN_MILLISECONDS, GET_PORT_URL, POST_PORT_URL, GET_PUBLIC_IP_URL } = requireConfig();

const logger = new Logger();

function getUser() {
    return os.userInfo().username;
}

async function getNgrokUrl() {
    try {
        const response = await axios.get(GET_PORT_URL);
        return response.data['tunnels'][0]['public_url'];
    }
    catch (error) {
        logger.error('Error in getting port', error);
    }
}

async function getPublicIP() {
    try {
        const response = await axios.get(GET_PUBLIC_IP_URL);
        return response.data;
    }
    catch (error) {
        logger.error('Error in getting public ip', error);
    }
}

function getLocalIP() {
    const nets = networkInterfaces();
    const results = {}; // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    if (results["wlan0"] && results["wlan0"].length > 0) {
        return results["wlan0"][0];
    }
    if (results["eth0"] && results["eth0"].length > 0) {
        return results["eth0"][0];
    }
    return "";
}

async function sendData(payload) {
    try {
        await axios.post(POST_PORT_URL, payload);
    }
    catch (error) {
        logger.error('Error in sending data', error);
    }
}

async function main() {
    setInterval(async () => {
        logger.info('Getting os user', (new Date()).toISOString());
        const user = getUser();

        logger.info('Getting ngrok', (new Date()).toISOString());
        const ngrokUrl = await getNgrokUrl();

        logger.info('Getting local ip', (new Date()).toISOString());
        const localIp = getLocalIP();

        logger.info('Getting public ip', (new Date()).toISOString());
        const publicIp = await getPublicIP();

        logger.info('Sending data', (new Date()).toISOString());
        await sendData({ user, ngrokUrl, localIp, publicIp });
    }, RATE_IN_MILLISECONDS);
}

main();
