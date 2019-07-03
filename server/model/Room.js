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
    constructor(id, protooRoom) {
        this.id=id;
        this.protooRoom=protooRoom;
        this.mediaPipeline=null;
        this.peers = new Map();
    }

    setMediaPipeline(mediaPipeline){
        this.mediaPipeline = mediaPipeline;
    }
}


module.exports = Room;