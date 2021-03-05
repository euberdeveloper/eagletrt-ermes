const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const handlebars = require('express-handlebars');

const { Logger } = require('euberlog');
const logger = new Logger();

const { PORT } = require('./config');

const app = express();

// DATA

const data = {
    localIp: null,
    publicIp: null,
    ngrokUrl: null,
    date: null
};

function handleCheckErrorString(res, str, name) {
    if (typeof str !== 'string' || !str) {
        const message = `${name} must be a non-empty string`;
        logger.error(message);
        res.status(400).send(message)
        return false
    }
    return true
}

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

logger.debug('GET /eagletrt/telemetria/info');
app.get('/eagletrt/telemetria/info', (_req, res) => {
    res.send(data);
});

logger.debug('POST /eagletrt/telemetria/info');
app.post('/eagletrt/telemetria/info', (req, res) => {
    const ngrokUrl = req.body.ngrokUrl;
    const localIp = req.body.localIp;
    const publicIp = req.body.publicIp;
    
    if (!handleCheckErrorString(res, ngrokUrl, 'Ngrok Url') ||
        !handleCheckErrorString(res, localIp, 'Local IP') ||
        !handleCheckErrorString(res, publicIp, 'Public IP')
    ) {
        return;
    }
    
    data.ngrokUrl = ngrokUrl;
    data.localIp = localIp;
    data.publicIp = publicIp;
    data.date = new Date();
    res.send()
});

logger.success('Routes added');

logger.hr();

// FRONTEND

logger.info('Setting forntend');

logger.debug('Set handlebars as view engine');
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars({ extname: '.hbs', defaultLayout: null }));

logger.debug('Expose static content');
app.use(express.static(path.join(__dirname, 'public')));

logger.debug('Add main frontend route');
app.get('/', (_req, res) => {
    res.render('home', data);
})

// LISTEN

logger.info('Start server...');
app.listen(PORT, () => {
    logger.success('Server listening on port', PORT);
});
