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
            case 'closeMeeting':
                this.closeMeeting(context, request, accept, reject);
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
        if ( ! room.mediaPipeline) {
            room.mediaPipeline = await this.kurentoClient.create('MediaPipeline');
        }

        if ( ! room.composite) {
            room.composite = await room.mediaPipeline.create('Composite');
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
        let pipeline= room.mediaPipeline,
            composite = room.composite,
            candidates= room.getPeerIceCandidates(peer.id);

        let webRtcEndpoint = await pipeline.create('WebRtcEndpoint');
        let hubPort = await composite.createHubPort();
        room.patchPeer(peer.id, {webRtcEndpoint, hubPort});

        while(candidates.length) {
            let c = candidates.shift();
            webRtcEndpoint.addIceCandidate(c);
        }

        await hubPort.connect(webRtcEndpoint);
        await webRtcEndpoint.connect(hubPort);

        webRtcEndpoint.on('OnIceCandidate', function(event) {
            let c = kurento.getComplexType('IceCandidate')(event.candidate);
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
        accept({})
    }

    /**
     * handle ice candidate from client side
     *
     * @param context
     * @param request
     * @param accept
     * @param reject
     */
    onClientIceCandidate(context, request, accept, reject) {
        let {peer, room} = context, webRtcEndpoint=room.getPeerWebRtcEndpoint(peer.id);
        let c = kurento.getComplexType('IceCandidate')(request.data.candidate);

        if (webRtcEndpoint) {
            console.info('Sending candidate');
            webRtcEndpoint.addIceCandidate(c);
        }
        else {
            console.info('Queueing candidate');
            let candidates= room.getPeerIceCandidates(peer.id);
            candidates.push(c);
        }
        accept({});
    }


    closeMeeting(context, request, accept, reject) {
        let {room} = context;
        room.release();
        accept();
    }

}


module.exports = new MessageServer();