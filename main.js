window.score = 0;
window.alerts = '';
window.my_ip = '';


function AddScore(what, points) {
    window.score += points;
    window.alerts += what + '\n';

    UpdateStats();
}


function UpdateStats() {
    document.getElementById('score').innerText = window.score;
    document.getElementById('alerts').innerText = window.alerts;
}


function IP() {
    var xhttp = new XMLHttpRequest();

    xhttp.onload = function() {
        if (this.status == 200) {
            CheckPorts(xhttp.responseText);
        }
    };

    xhttp.onerror = function () {
        window.my_ip = 'Error';
    }

    xhttp.open("GET", 'https://cors.io/?https://api.ipify.org/', true);
    xhttp.send();
}


function ReceivedLocal(ip) {
    if (ip.match('^(10.|100.)')) {
        AddScore('VPN found in local IP', 60);
    }
}


function ReceivedIP(ip) {
    if (ip != window.my_ip) {
        AddScore('You using VPN/Proxy', 100);
    }
}


function WebRTC() {
    function getIPs(callback){
        var ip_dups = {};

        var RTCPeerConnection = window.RTCPeerConnection
            || window.mozRTCPeerConnection
            || window.webkitRTCPeerConnection;
        var useWebKit = !!window.webkitRTCPeerConnection;

        if(!RTCPeerConnection){
            var win = iframe.contentWindow;
            RTCPeerConnection = win.RTCPeerConnection
                || win.mozRTCPeerConnection
                || win.webkitRTCPeerConnection;
            useWebKit = !!win.webkitRTCPeerConnection;
        }

        var mediaConstraints = {
            optional: [{RtpDataChannels: true}]
        };
        var servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};

        var pc = new RTCPeerConnection(servers, mediaConstraints);

        function handleCandidate(candidate){
            var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
            var ip_addr = ip_regex.exec(candidate)[1];

            if(ip_dups[ip_addr] === undefined)
                callback(ip_addr);

            ip_dups[ip_addr] = true;
        }

        pc.onicecandidate = function(ice){
            if(ice.candidate)
                handleCandidate(ice.candidate.candidate);
        };

        pc.createDataChannel("");
        pc.createOffer(function(result){
            pc.setLocalDescription(result, function(){}, function(){});
        }, function(){});

        setTimeout(function(){
            var lines = pc.localDescription.sdp.split('\n');
            lines.forEach(function(line){
                if(line.indexOf('a=candidate:') === 0)
                    handleCandidate(line);
            });
        }, 1000);
    }

    getIPs(function(ip){
        if (ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/)) {
            ReceivedLocal(ip);
        }
        else if (ip.match(/^[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}$/)) {}
        else {
            document.getElementsByTagName("ul")[1].appendChild(li);
        }
    });
}


function CheckWebRTC() {
    var isWebRTCSupported = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia ||
    window.RTCPeerConnection;

    if (window.navigator.userAgent.indexOf("Edge") > -1) {
        return false;
    }

    if (isWebRTCSupported) {
        return true;
    } else {
        return false;
    }
}


function SimplePing(port) {
    if(!this.inUse) {
 
        this.inUse = true;
        this.img = new Image();

        this.img.onload = AddScore('Port ' + port + ' is open!', 10);
        this.img.onerror = function() {};

        this.img.src = "http://" + window.my_ip + ':' + port;
        this.timer = setTimeout(function() {
            img.src = '127.0.0.1';
        }, 1500);

    }
}


function CheckTor() {
    var xhttp = new XMLHttpRequest();

    xhttp.onload = function() {
        if (this.status == 200) {
            if (xhttp.responseText.includes(window.my_ip)) {
                AddScore('You using Tor', 100);
            }
        }
    };

    xhttp.onerror = function() {};

    xhttp.open("GET", 'https://cors.io/?https://check.torproject.org/exit-addresses', true);
    xhttp.send();
}


function BrowserCheck() {
    var mob_noa = true; // Mobile is not already detected
    var mobiles = ['iPhone', 'Android', 'Windows Phone', 'Mobile', 'Opera Mini'];

    var prodSub = window.navigator.productSub;
    var machine = navigator.platform;
    var machine2 = navigator.oscpu;
    var UA = navigator.userAgent;

    if (!(UA.includes(prodSub))) {
        if (UA.includes('Firefox')) {
            if (window.navigator.productSub != "20100101") {
                AddScore('productSub is don`t match', 40);
            }
        } else {
            if (window.navigator.productSub != "20030107") {
                AddScore('productSub is don`t match', 40);
            }
        }
    }

    // If oscpu or platform not in UA then client spoof UA
    if (!(UA.includes(machine)) || !(UA.includes(machine2))) {
        AddScore('oscpu/platform and UA does`t match', 15);
    }

    // If UA includes mobile, check spoof
    mobiles.forEach(function(item){
        if (UA.includes(item) && mob_noa) {
            if (typeof window.orientation == "undefined" || navigator.maxTouchPoints == 0) {
                AddScore('Mobile browser spoof', 30);
                mob_noa = false;
            }
        }
    });

    // If not detected mobile spoof check using mobile
    if (mob_noa) {
        if (navigator.maxTouchPoints != 0 || navigator.msMaxTouchPoints != undefined) {
            AddScore('You using mobile, but spoof', 20);
        }
    }

}


function CheckPorts(ip) {
    window.my_ip = ip;
    var ports = ['80', '443', '501', '502', '1723', '3389', '8080', '5900', '5901', '5938'];

    ports.forEach(function(item) {
        SimplePing(item);
        console.log('Connection to port: ' + item);
    });
}


function main() {
    IP();
    CheckTor();
    BrowserCheck();

    if (CheckWebRTC()) {
        //AddScore('WebRTC is ON!', 30);
        WebRTC();
    }
}


main();