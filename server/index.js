const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const { Logger } = require('euberlog');
const logger = new Logger();

const { PORT } = require('./config');

const app = express();

// DATA

const data = {
    port: null,
    date: null
};

// MIDDLEWARES

logger.hr();

logger.info('Load middlewares...');

logger.debug('Use cors middleware');
app.use(cors());
logger.debug('Use compression middleware');
app.use(compression());
logger.debug('Use helmet middleware');
app.use(helmet());
logger.debug('Use morgan middleware');
app.use(morgan('dev'));
logger.debug('Use body-parser middleware');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

logger.success('Middlewares loaded');

logger.hr();

// ROUTES

logger.info('Add routes...');

logger.debug('GET /eagletrt/telemetria/port');
app.get('/eagletrt/telemetria/port', (_req, res) => {
    res.send(data);
});

logger.debug('POST /eagletrt/telemetria/port');
app.post('/eagletrt/telemetria/port', (req, res) => {
    const { port } = req.body.port;

    if (typeof port !== 'string' || !port) {
        const message = 'Port must be a non-empty string';
        logger.error(message);
        res.status(400).send(message)
    }
    else {
        data.port = port;
        data.date = new Date();
        res.send();
    }
});

logger.success('Routes added');

logger.hr();

// LISTEN

logger.info('Start server...');
app.listen(PORT, () => {
    logger.success('Server listening on port', PORT);
});
