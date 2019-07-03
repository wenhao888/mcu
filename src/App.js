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
        this.transport = new protooClient.WebSocketTransport(this.roomsUrl + "/0");
        this.peer = new protooClient.Peer(this.transport);

    }

    createRoom = async () => {
        if (this.peer == null) {
            return;
        }

        await this.peer.request("startMeeting");
    };


    joinAsTeacher = async () => {
        if (this.peer == null) {
            return;
        }
        let self = this;
        var options = {
            localVideo: this.localVideo,
            remoteVideo: this.remoteVideo,
            onicecandidate: this.onIceCandidate
        };

        this.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, async function (error) {
            if (error) {
                self.onError(error);
            } else {
                this.generateOffer(self.onOffer.bind(self));
            }
        });
    };

    onIceCandidate(candidate) {
        this.peer.request("iceCandidate", {candidate})
    }

    async onOffer(error, sdpOffer = {}) {
        if (error) {
            this.onError(error);
            return;
        }
        await this.peer.request("teacherJoin", {sdpOffer});
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
                    <button onclick={this.joinAsTeacher}>Join as teacher</button>
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
