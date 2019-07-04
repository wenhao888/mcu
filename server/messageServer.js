/**
 * message server also works as signaling server
 *
 */


const protooServer = require('protoo-server');
const dbService = require("./service/dbService");
const UrlPattern = require('url-pattern');
const Room = require("./model/Room");
const kurento = require('kurento-client');
const kurentoUtil = require("./util/kurentoUtil");

const options =
    {
        maxReceivedFrameSize: 960000, // 960 KBytes.
        maxReceivedMessageSize: 960000,
        fragmentOutgoingMessages: true,
        fragmentationThreshold: 960000
    };

const pattern = new UrlPattern('/rooms/:roomId');

candidatesQueue={};
sessions ={};

let sessionId="session-1";

class MessageServer {
    async start(rawHttpServer, kurentoUrl) {
        const server = new protooServer.WebSocketServer(rawHttpServer, options);
        server.on('connectionrequest', this.newConnectionHandler.bind(this));
        this.kurentoClient = await kurentoUtil.createClient(kurentoUrl);
    }

    /**
     * accept a new connection request.
     *
     * @param info
     * @param accept
     * @param reject
     * @returns {Promise.<void>}
     */
    async newConnectionHandler(info, accept, reject) {
        let result = (pattern.match(info.request.url) || {});
        if (!result) {
            reject("invalid url")
        }
        let roomId = result['roomId'];

        let room = dbService.getRoom(roomId);
        let protooRoom = null;

        if (!room) {
            room = new Room(roomId);
            protooRoom = new protooServer.Room();
            room.protooRoom = protooRoom;
            dbService.addRoom(roomId, room);
            console.log(`Room ${roomId} is created`);

        } else {
            protooRoom = room.protooRoom;
        }

        const transport = accept();
        const peer = await protooRoom.createPeer('bob' + new Date().getTime(), transport);
        peer.data.roomId = roomId;
        peer.on('request', this.peerRequestHandler.bind(this, peer));
    };


    async peerRequestHandler(peer, request, accept, reject) {
        let roomId = peer.data.roomId;
        let method = request.method || "";

        let context = {
            room: dbService.getRoom(roomId),
            peer: peer
        };


        switch (method) {
            case 'createMeeting':
                this.createMeeting(context, request, accept, reject);
                break;

            case 'joinMeeting':
                this.joinMeeting(context, request, accept, reject);
                break;

            case 'clientIceCandidate':
                this.onClientIceCandidate(context,request, accept, reject);
                break;
        }
    }

    /**
     * handle create meeting request
     *
     * @param context
     * @param request
     * @param accept
     * @param reject
     * @returns {Promise.<void>}
     */
    async createMeeting (context, request, accept, reject) {
        let {room} = context;
        if (!room.mediaPipeline) {
            room.mediaPipeline = await this.kurentoClient.create('MediaPipeline');
        }
        accept({});
    }

    /**
     * handle join meeting request
     *
     * @param context
     * @param request
     * @param accept
     * @param reject
     * @returns {Promise.<void>}
     */
    async joinMeeting(context, request, accept, reject) {
        let {peer, room} = context, sdpOffer= request.data.sdpOffer;
        let pipeline= room.mediaPipeline;

        let webRtcEndpoint = await pipeline.create('WebRtcEndpoint');
        room.patchPeer(peer.id, {webRtcEndpoint});

        if (candidatesQueue[sessionId]) {
            while(candidatesQueue[sessionId].length) {
                var candidate = candidatesQueue[sessionId].shift();
                webRtcEndpoint.addIceCandidate(candidate);
            }
        }

        await webRtcEndpoint.connect(webRtcEndpoint);
        webRtcEndpoint.on('OnIceCandidate', function(event) {
            var c = kurento.getComplexType('IceCandidate')(event.candidate);
            peer.request('serverIceCandidate', {candidate : c});
        });
        webRtcEndpoint.processOffer(sdpOffer).then(function(sdpAnswer) {
            sessions[sessionId] = {
                'pipeline' : pipeline,
                'webRtcEndpoint' : webRtcEndpoint
            };
            peer.request('joinSuccess',
                {sdpAnswer : sdpAnswer})
        });

        webRtcEndpoint.gatherCandidates();
    }



    onClientIceCandidate(context, request, accept, reject) {
        var c = kurento.getComplexType('IceCandidate')(request.data.candidate);

        if (sessions[sessionId]) {
            console.info('Sending candidate');
            var webRtcEndpoint = sessions[sessionId].webRtcEndpoint;
            webRtcEndpoint.addIceCandidate(c);
        }
        else {
            console.info('Queueing candidate');
            if (!candidatesQueue[sessionId]) {
                candidatesQueue[sessionId] = [];
            }
            candidatesQueue[sessionId].push(c);
        }
    }

}


module.exports = new MessageServer();