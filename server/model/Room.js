/**
 *  each peer will have the following data:
 *     {
 *       id
 *       WebRtcEndpoint
 *
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

    setMediaPipeline(mediaPipeline){
        this.mediaPipeline = mediaPipeline;
    }
}


module.exports = Room;