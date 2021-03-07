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

let data = {};

function parseMachineData(machineData, adjustDate = false) {
    const { hostname, port, user } = getHostnameAndPort(machineData.ngrokUrl);
    const ssh = hostname && port && user ? `ssh ${user}@${hostname} -p ${port}` : null;
    const date = adjustDate ? machineData.date.toLocaleString() : machineData.date;
    return { ...machineData, date, hostname, port, ssh };
}

function handleCheckErrorString(str, name) {
    let message = null;

    if (typeof str !== 'string' || !str) {
        message = `${name} must be a non-empty string`;
        logger.error(message);
    }

    return message;
}

function getHostnameAndPort(url) {
    let result = { hostname: null, port: null };

    if (url) {
        const regexp = /^tcp:\/\/(?<hostname>[\w\.]+):(?<port>\d+)$/;
        const match = url.match(regexp);
        result = match?.groups ?? result;
    }

    return result;
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

logger.debug('GET /api/machines');
app.get('/api/machines', (_req, res) => {
    res.json(Object.keys(data));
});

logger.debug('GET /api/machines/:machine');
app.get('/api/machines/:machine', (req, res) => {
    const { machine } = req.params;

    const errorMessage = handleCheckErrorString(machine, 'machine');
    if (errorMessage) {
        return res.status(400).send(errorMessage);
    }

    let machineData = data[machine];
    if (!machineData) {
        return res.status(404).send('Machine not found');
    }

    res.json(parseMachineData(machineData));
});

logger.debug('GET /api/machines/:machine/:field');
app.get('/api/machines/:machine/:field', (req, res) => {
    const { machine, field } = req.params;

    const errorMessage = handleCheckErrorString(machine, 'machine');
    if (errorMessage) {
        return res.status(400).send(errorMessage);
    }

    let machineData = data[machine];
    if (!machineData) {
        return res.status(404).send('Machine not found');
    }

    const parsedMachineData = parseMachineData(machineData);
    if (!(field in parsedMachineData)) {
        return res.status(400).send('Invalid field');
    }
    

    res.send(parsedMachineData[field]);
});

logger.debug('POST /api/machines/:machine');
app.post('/api/machines/:machine', (req, res) => {
    const { machine } = req.params;

    const errorMessage = handleCheckErrorString(machine, 'machine');
    if (errorMessage) {
        return res.status(400).send(errorMessage);
    }

    const newData = {
        ngrokUrl: req.body.ngrokUrl,
        localIp: req.body.localIp,
        publicIp: req.body.publicIp,
        user: req.body.user,
        date: new Date()
    };

    for (const param of Object.keys(newData).filter(k => k !== 'date')) {
        const message = handleCheckErrorString(newData[param], param);
        if (message) {
            return res.status(400).send(message);
        }
    }

    data[machine] = newData;

    return res.send();
});

logger.success('Routes added');

logger.hr();

// SHELL

logger.debug('GET /');
app.get('/shish', (_req, res) => {
    res.download(path.join(__dirname, '..', 'shell', 'shi.sh'), 'shi.sh');
});

// FRONTEND

logger.info('Setting forntend');

logger.debug('Set handlebars as view engine');
app.engine('hbs', handlebars({ extname: '.hbs', defaultLayout: null }));
app.set('view engine', 'hbs');

logger.debug('Expose static content');
app.use('/public', express.static(path.join(__dirname, 'public')));

logger.debug('GET /');
app.get('/', (_req, res) => {
    const machineData = data.telemetria;
    if (!machineData) {
        res.status(404).send('Machine "telemetria" not found');
    }
    res.render('home', parseMachineData(machineData, true));
});

logger.debug('GET /:machine');
app.get('/:machine', (req, res) => {
    const { machine } = req.params;
    const errorMessage = handleCheckErrorString(machine, 'machine');
    if (errorMessage) {
        return res.status(400).send(errorMessage);
    }

    const machineData = data[machine];
    if (!machineData) {
        res.status(404).send('Machine not found');
    }

    res.render('home', parseMachineData(machineData, true));
});

// LISTEN

logger.info('Start server...');
app.listen(PORT, () => {
    logger.success('Server listening on port', PORT);
});
