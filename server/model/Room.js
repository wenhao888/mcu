/**
 *  each peer will have the following data:
 *     {
 *       webRtcEndpoint
 *       hubPort
 *       iceCandidates
 *     }
 */

class Room {
    constructor(id, protooRoom) {
        this.id=id;
        this.protooRoom=protooRoom;
        this.mediaPipeline=null;
        this.Composite=null;
        this.peers = new Map();
    }

    patchPeer(peerId, update={}) {
        let peerInfo =this.createPeerIfNotExist(peerId);
        this.peers.set(peerId, {...peerInfo, ... update})
    }

    getPeerWebRtcEndpoint(peerId) {
        let peerInfo =this.createPeerIfNotExist(peerId);
        return peerInfo.webRtcEndpoint;
    }

    getPeerIceCandidates(peerId) {
        let peerInfo =this.createPeerIfNotExist(peerId);
        return peerInfo.iceCandidates;
    }


    createPeerIfNotExist(peerId){
        let peerInfo =this.peers.get(peerId);
        if ( ! peerInfo) {
            peerInfo={
                webRtcEndpoint:null,
                iceCandidates:[]
            };
            this.peers.set(peerId, peerInfo);
        }
        return peerInfo;
    }
}


module.exports = Room;