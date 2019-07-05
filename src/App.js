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
                this.joinSuccess(request, accept, reject);
                break;
            case 'serverIceCandidate':
                this.serverIceCandidate(request, accept, reject);
                break;
        }
    }

    joinSuccess = (request, accept, reject)=> {
        accept({});

        let sdpAnswer = request.data.sdpAnswer;
        console.log("joinSuccess: ", sdpAnswer);
        this.webRtcPeer.processAnswer(sdpAnswer);
    };


    serverIceCandidate=(request, accept, reject)=> {
        accept();
        this.webRtcPeer.addIceCandidate(request.data.candidate)
    };

    /**
     * the following are command handler
     *
     */
    createMeeting = () => {
        this.peer.request('createMeeting');
    };

    closeMeeting = () => {
        this.peer.request('closeMeeting');
    };


    joinMeeting= async ()=> {
        console.log('Creating WebRtcPeer and generating local sdp offer ...');
        let self = this;

        var options = {
            //localVideo: this.localVideo,
            remoteVideo: this.remoteVideo,
            onicecandidate : (candidate)=> {this.peer.request('clientIceCandidate', {candidate})},
            mediaConstraints: {
                audio:true,
                video:true
            }
        };

        this.webRtcPeer = await  kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error) {
            this.generateOffer((error, sdpOffer)=>{
                self.peer.request('joinMeeting', {sdpOffer})
            });
        });
    };

    /**
     * the following are ui
     *
     * @returns {XML}
     */
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
                    <button onClick={this.closeMeeting}> Close meeting</button>

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
