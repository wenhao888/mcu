#!/usr/bin/env node

/**
 * Module dependencies.
 */

const fs = require('fs');
var app = require('./app');
var debug = require('debug')('party2:server');
var http = require('http');
var https = require('https');


class HttpServer {

    async start() {
        this.port = this.normalizePort(process.env.PORT || '3000');
        app.set('port', this.port);

        //this.server =  http.createServer(app);
        const tls = {
            cert: fs.readFileSync(`${__dirname}/config/certs/mediasoup-demo.localhost.cert.pem`),
            key: fs.readFileSync(`${__dirname}/config/certs/mediasoup-demo.localhost.key.pem`)
        };

        this.server = https.createServer(tls, app);
        this.server.listen(this.port);

        this.server.on('error', this.onError.bind(this));
        this.server.on('listening', this.onListening.bind(this));

        console.log("listening on: ", this.port);
        return this.server;
    };


    normalizePort(val) {
        var port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    };


    onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof this.port === 'string'
            ? 'Pipe ' + this.port
            : 'Port ' + this.port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    };

    onListening() {
        var addr = this.server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
    }
}


module.exports = new HttpServer();


