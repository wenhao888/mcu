import React, {Component} from 'react';
import kurentoUtils from "kurento-utils"
import protooClient from 'protoo-client';


import WsUtil from "./utl/WsUtil";
import './App.css';

var ws = new WebSocket('wss://localhost:8443/magicmirror');

const I_CAN_START = 0;
const I_CAN_STOP = 1;
const I_AM_STARTING = 2;

class App extends Component {
    constructor(...args) {
        super(...args);
        this.roomsUrl = WsUtil.getRoomUrl();
    }

    componentDidMount() {
        ws.onmessage = this.wsMessageHandler.bind(this);
    }


    wsMessageHandler(message) {
        var parsedMessage = JSON.parse(message.data);
        console.info('Received message: ' + message.data);

        switch (parsedMessage.id) {
            case 'startResponse':
                this.startResponse(parsedMessage);
                break;
            case 'serverIceCandidate':
                this.webRtcPeer.addIceCandidate(parsedMessage.candidate)
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
        console.log('Local candidate' + JSON.stringify(candidate));

        var message = {
            id : 'clientIceCandidate',
            candidate : candidate
        };
        this.sendMessage(message);
    }

    onOffer(error, offerSdp) {
        console.info('Invoking SDP offer callback function ');
        var message = {
            id : 'start',
            sdpOffer : offerSdp
        };

        this.sendMessage(message);
    }



    startResponse(message) {
        this.webRtcPeer.processAnswer(message.sdpAnswer);
    }

    sendMessage(message) {
        var jsonMessage = JSON.stringify(message);
        console.log('Senging message: ' + jsonMessage);
        ws.send(jsonMessage);
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
