/**
 *  each peer will have the following data:
 *     {
 *       id
 *       webRtcEndpoint
 *
 *     }
 */

class Room {
    constructor(id, protooRoom) {
        this.id=id;
        this.protooRoom=protooRoom;
        this.mediaPipeline=null;
        this.peers = new Map();
        this.iceCandidates =[];
    }

    patchPeer(id, update={}) {
        let peerInfo =this.peers.get(id) || {};
        this.peers.set(id, {...peerInfo, ... update})
    }

    setMediaPipeline(mediaPipeline){
        this.mediaPipeline = mediaPipeline;
    }

    getPeerWebRtcEndpoint(peerId) {
        let peerInfo =this.peers.get(id) || {};
        return peerInfo.webRtcEndpoint;
    }

    getPeerIceCandidates(peerId) {
        let peerInfo =this.peers.get(id) || {};
        return peerInfo.iceCandidates || [];
    }
}


module.exports = Room;