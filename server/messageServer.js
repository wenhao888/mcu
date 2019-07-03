/**
 * message server also works as signaling server
 *
 */


const protooServer = require('protoo-server');
const dbService = require("./service/dbService");
const UrlPattern = require('url-pattern');
const Room = require("./model/Room");
const kurentoUtil = require("./util/kurentoUtil");

const options =
    {
        maxReceivedFrameSize: 960000, // 960 KBytes.
        maxReceivedMessageSize: 960000,
        fragmentOutgoingMessages: true,
        fragmentationThreshold: 960000
    };

const pattern = new UrlPattern('/rooms/:roomId');

class MessageServer {
    async start(rawHttpServer, kurentoUrl) {
        const server = new protooServer.WebSocketServer(rawHttpServer, options);
        server.on('connectionrequest', this.newConnectionHandler.bind(this));
        this.kurento = await kurentoUtil.createClient(kurentoUrl);
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
            case 'startMeeting':
                this.startMeetingHandler(context, request, accept, reject);
                break;

            case 'teacherJoin':
                this.teacherJoinHandler(context, request, accept, reject);
                break;
            case 'iceCandidate':
        }
    }

    async startMeetingHandler(context, request, accept, reject) {
        let {room} = context;

        this.kurento.create('MediaPipeline').then((pipeline)=> {
            room.setMediaPipeline(pipeline);
            accept({});

        }, (error) => {
           console.log("create MediaPipeline failed: ", error);
           reject({"message":"create MediaPipeline failed"});
        });
    }

    async teacherJoinHandler(context, request, accept, reject) {
        let {sdpOffer} = request.data;
        accept({});
    }


    async iceCandidateHandler(context, request, accept, reject) {
        let {candidate} = request.data;
        accept();
    }

}


module.exports = new MessageServer();