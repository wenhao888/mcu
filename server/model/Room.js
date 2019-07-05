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
        this.composite=null;
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

    release() {
        this.peers.forEach((peerInfo={}, key, map)=>{
            if (peerInfo.webRtcEndpoint) {
                peerInfo.webRtcEndpoint.release();
            }
            if (peerInfo.hubPort) {
                peerInfo.hubPort.release();
            }
        });
        this.peers.clear();


        if (this.mediaPipeline){
            this.mediaPipeline.release();
            this.mediaPipeline=null;
        }

        if (this.composite) {
            this.composite.release();
            this.composite=null;
        }

    }
}


module.exports = Room;