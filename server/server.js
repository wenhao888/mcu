/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var path = require('path');
var url = require('url');
var cookieParser = require('cookie-parser')
var express = require('express');
var session = require('express-session')
var minimist = require('minimist');
var ws = require('ws');
var kurento = require('kurento-client');
var fs    = require('fs');
var https = require('https');
const protoo = require('protoo-server');


var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'https://localhost:8443/',
        ws_uri: 'ws://localhost:8888/kurento'
    }
});

var options =
    {
        key:  fs.readFileSync(`${__dirname}/keys/server.key`),
        cert: fs.readFileSync(`${__dirname}/keys/server.crt`)
    };

var app = express();

/*
 * Management of sessions
 */
app.use(cookieParser());


var sessionHandler = session({
    secret : 'none',
    rolling : true,
    resave : true,
    saveUninitialized : true
});

app.use(sessionHandler);
app.use(express.static(path.join(__dirname, '../build')));

/*
 * Definition of global variables.
 */
var sessions = {};
var candidatesQueue = {};
var kurentoClient = null;

/*
 * Server startup
 */
var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var httpsServer = https.createServer(options, app).listen(port, function() {
    console.log('Kurento Tutorial started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});



const protooOptions =
    {
        maxReceivedFrameSize: 960000, // 960 KBytes.
        maxReceivedMessageSize: 960000,
        fragmentOutgoingMessages: true,
        fragmentationThreshold: 960000
    };

const protooServer = new protoo.WebSocketServer(httpsServer, protooOptions);
var room=null, peer=null;

/*
 * Management of WebSocket messages
 */
protooServer.on('connectionrequest', function(info, accept, reject) {
    room = new protoo.Room();
    let transport = accept();
    peer = room.createPeer('bob' + new Date().getTime(), transport);

    peer.on('request', function(request, accept, reject) {
        let sessionId ="session_1";

        switch (request.method) {
            case 'start':
                console.log("start -----   ");
                start(sessionId, peer, request.data.sdpOffer, function(error, sdpAnswer) {

                    peer.request( 'startResponse',
                        {sdpAnswer : sdpAnswer});
                });
                break;

            case 'clientIceCandidate':
                onClientIceCandidate(sessionId, request.data.candidate);
                break;
        }

    });
});

/*
 * Definition of functions
 */

// Recover kurentoClient for the first time.
async function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return kurentoClient;
    }

    kurentoClient = await kurento(argv.ws_uri);
    return kurentoClient;
}

async function start(sessionId, peer, sdpOffer, callback) {
    if (!sessionId) {
        return callback('Cannot use undefined sessionId');
    }

    await getKurentoClient();
    let pipeline = await kurentoClient.create('MediaPipeline');
    let webRtcEndpoint = await pipeline.create('WebRtcEndpoint');

    if (candidatesQueue[sessionId]) {
        while(candidatesQueue[sessionId].length) {
            var candidate = candidatesQueue[sessionId].shift();
            webRtcEndpoint.addIceCandidate(candidate);
        }
    }

    connectMediaElements(webRtcEndpoint).then( function(error) {
        webRtcEndpoint.on('OnIceCandidate', function(event) {
            var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            peer.request(('serverIceCandidate',
                {candidate : candidate}));
        });

        webRtcEndpoint.processOffer(sdpOffer).then( function(sdpAnswer) {
            sessions[sessionId] = {
                'pipeline' : pipeline,
                'webRtcEndpoint' : webRtcEndpoint
            };
            return callback(null, sdpAnswer);
        });

        webRtcEndpoint.gatherCandidates(function(error) {
            if (error) {
                return callback(error);
            }
        });
    });




}



function connectMediaElements(webRtcEndpoint) {
    return  webRtcEndpoint.connect(webRtcEndpoint);
}



function onClientIceCandidate(sessionId, _candidate) {
    var candidate = kurento.getComplexType('IceCandidate')(_candidate);

    if (sessions[sessionId]) {
        console.info('Sending candidate');
        var webRtcEndpoint = sessions[sessionId].webRtcEndpoint;
        webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        console.info('Queueing candidate');
        if (!candidatesQueue[sessionId]) {
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}




app.use(express.static(path.join(__dirname, 'static')));
