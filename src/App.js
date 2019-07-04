import React, {Component} from 'react';
import kurentoUtils from "kurento-utils"
import protooClient from 'protoo-client';
import WsUtil from "./utl/WsUtil";
import './App.css';



const I_CAN_START = 0;
const I_CAN_STOP = 1;
const I_AM_STARTING = 2;

class App extends Component {
    constructor(...args) {
        super(...args);
        this.roomsUrl = WsUtil.getRoomUrl();
    }

    componentDidMount() {
        this.transport = new protooClient.WebSocketTransport(this.roomsUrl+"/0");
        this.peer = new protooClient.Peer(this.transport);

        this.peer.on('request', this.wsMessageHandler.bind(this));
    }


    wsMessageHandler(request, accept, reject, ) {
        switch (request.method) {
            case 'startResponse':
                this.startResponse(request.data);
                break;
            case 'serverIceCandidate':
                this.webRtcPeer.addIceCandidate(request.data.candidate)
                break;
        }
    }

    start=()=> {
        console.log('Creating WebRtcPeer and generating local sdp offer ...');

        var options = {
            localVideo: this.localVideo,
            remoteVideo: this.remoteVideo,
            onicecandidate : this.onIceCandidate.bind(this)
        };

        let self = this;
        this.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error) {
            this.generateOffer(self.onOffer.bind(self));
        });
    };

    onIceCandidate(candidate) {
        this.peer.request('clientIceCandidate', {candidate});
    }

    onOffer(error, sdpOffer) {
        console.info('Invoking SDP offer callback function ');
        this.peer.request('start', {sdpOffer});
    }

    startResponse(message) {
        this.webRtcPeer.processAnswer(message.sdpAnswer);
    }


    render() {
        return (
            <div className="App">
                <div style={{width: '50%', display: "inline-block"}}>
                    <p>
                        Local video
                    </p>

                    <video autoPlay={true} ref={video => {
                        this.localVideo = video
                    }}/>

                    <button onClick={this.start}>Start </button>
                </div>


                <div style={{width: '50%', display: "inline-block"}}>
                    <p>
                        Remote video
                    </p>
                    <video autoPlay={true} ref={video => {
                        this.remoteVideo = video
                    }}/>
                </div>
            </div>
        );
    }
}

export default App;
