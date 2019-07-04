/**
 *  each peer will have the following data:
 *     {
 *       id
 *       webRtcEndpoint
 *       iceCandidates
 *     }
 */

class Room {
    constructor(id, protooRoom) {
        this.id=id;
        this.protooRoom=protooRoom;
        this.mediaPipeline=null;
        this.peers = new Map();
    }

    patchPeer(id, update={}) {
        let peerInfo =this.peers.get(id) || {};
        this.peers.set(id, {...peerInfo, ... update})
    }

    getPeerWebRtcEndpoint(peerId) {
        let peerInfo =this.peers.get(peerId) || {};
        return peerInfo.webRtcEndpoint;
    }

    getPeerIceCandidates(peerId) {
        let peerInfo =this.peers.get(peerId) || {};
        return peerInfo.iceCandidates || [];
    }
}


module.exports = Room;