import React, {Component} from 'react';
import kurentoUtils from "kurento-utils"
import protooClient from 'protoo-client';


import WsUtil from "./utl/WsUtil";
import './App.css';


class App extends Component {
    constructor(...args){
        super(...args);
        this.roomsUrl = WsUtil.getRoomUrl();

    }


    componentDidMount() {
        this.transport = new protooClient.WebSocketTransport(this.roomsUrl+"/0");
        this.peer = new protooClient.Peer(this.transport);

    }

    createRoom = async () => {
        var options = {
            localVideo: this.localVideo,
            remoteVideo: this.remoteVideo,
            onicecandidate: this.onIceCandidate
        };

        if (this.peer != null) {
            this.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
                if (error)  this.onError(error);
                this.generateOffer(this.onOffer);
            });
        }
    };


    onIceCandidate(candidate) {
        console.log('Local candidate' + JSON.stringify(candidate));

        var message = {
            id: 'onIceCandidate',
            candidate: candidate
        };
        //sendMessage(message);
    }

    onOffer(error, offerSdp) {
        if (error) return this.onError(error);

        console.info('Invoking SDP offer callback function ');
        var message = {
            id: 'start',
            sdpOffer: offerSdp
        };
        //sendMessage(message);
    }

    onError = (error) => {
        console.error(error);
    };

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

                    <button onClick={this.createRoom}>Create Room0</button>
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
