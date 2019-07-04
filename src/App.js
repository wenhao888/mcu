import React, {Component} from 'react';
import kurentoUtils from "kurento-utils"
import protooClient from 'protoo-client';
import WsUtil from "./utl/WsUtil";
import './App.css';

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
            case 'joinSuccess':
                this.joinSuccess(request.data.sdpAnswer);
                break;
            case 'serverIceCandidate':
                this.webRtcPeer.addIceCandidate(request.data.candidate);
                break;
        }
    }

    createMeeting = () => {
        this.peer.request('createMeeting');
    };

    joinMeeting= async ()=> {
        console.log('Creating WebRtcPeer and generating local sdp offer ...');

        var options = {
            localVideo: this.localVideo,
            remoteVideo: this.remoteVideo,
            onicecandidate : this.onIceCandidate.bind(this),
            mediaConstraints: {
                audio:true,
                video:true
            }
        };

        let self = this;
        this.webRtcPeer = await  kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error) {
            this.generateOffer((error, sdpOffer)=>{
                self.peer.request('joinMeeting', {sdpOffer})
            });
        });
    };

    onIceCandidate(candidate) {
        this.peer.request('clientIceCandidate', {candidate});
    }


    joinSuccess(sdpAnswer) {
        this.webRtcPeer.processAnswer(sdpAnswer);
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

                    <button onClick={this.createMeeting}>Create meeting </button>
                    <button onClick={this.joinMeeting}>Join </button>

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
