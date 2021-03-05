const axios = require('axios');
const { Logger } = require('euberlog');
const { RATE_IN_MILLISECONDS, GET_PORT_URL, POST_PORT_URL } = require('./config');

const logger = new Logger();

async function getPort() {
    try {
        const response = await axios.get(GET_PORT_URL);
        return response.data;
    }
    catch (error) {
        logger.error('Error in getting port', error);
    }
}

async function sendPort(port) {
    try {
        await axios.post(POST_PORT_URL, { port });
    }
    catch (error) {
        logger.error('Error in sending port', error);
    }
}

async function main() {
    setInterval(async () => {
        logger.info('Getting port', (new Date()).toISOString());
        const port = await getPort();
        logger.info('Sending port', (new Date()).toISOString());
        await sendPort(port);
    }, RATE_IN_MILLISECONDS);
}

main();
