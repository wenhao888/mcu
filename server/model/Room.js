/**
 *  each peer will have the following data:
 *     {
 *       id
 *       sendTransportId,
 *       recvTransportId,
 *       producerId,
 *       consumerId
 *     }
 */

class Room {
    constructor(id, protooRoom, mediaRouterId) {
        this.id=id;
        this.protooRoom=protooRoom;
        this.mediaRouterId=mediaRouterId;
        this.peers = new Map();
    }


    patchPeer (peer={}) {
        if ( ! peer.id) {
            return;
        }

        let old=this.peers.get(peer.id) || {};
        this.peers.set(peer.id, {...old, ...peer})
    };


    getPeerSendTransport(peerId) {
        return this.peers.get(peerId).sendTransportId;
    };

    getPeerRecvTransport (peerId) {
        return this.peers.get(peerId).recvTransportId;
    }
}


module.exports = Room;