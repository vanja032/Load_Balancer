const cluster = require("cluster");
const express = require("express");
require("dotenv").config();

const socketHost = process.env.SOCKET_HOST || "0.0.0.0";
const socketPort = process.env.SOCKET_PORT || 3030;

const app = express();
const server = app.listen(socketPort, socketHost);

const socketOptions = {
    cors: {
        origin: "*"
    }
};

var clusters = [];

const socket = require("socket.io")(server, socketOptions);

socket.on("connection", (sync) => {
    console.log("The new client connected.");

    // Inform all clusters about the new socket connection and retrieve the servers data
    updateServers();

    sync.on("change_active_state", (data) => {
        if (data.hasOwnProperty("active_state") && data.hasOwnProperty("server")) {
            for (let i = 0; i < clusters.length; i++) {
                clusters[i].send({ active_status: data["active_state"], url: data["server"] });
            }
        }
    });

    sync.on("set_requests_number", (data) => {
        if (data.hasOwnProperty("max_requests_number") && data.hasOwnProperty("server")) {
            for (let i = 0; i < clusters.length; i++) {
                clusters[i].send({ requests_number: data["max_requests_number"], url: data["server"] });
            }
        }
    });

    sync.on("disconnect", () => {
        console.log("The client has been disconnected.");
    });
});

const updateServers = () => {
    for (let i = 0; i < clusters.length; i++) {
        clusters[i].send({ event: "update-servers" });
    }
};

cluster.on("message", (worker, data) => {
    if (data.hasOwnProperty("urls")) {
        socket.emit("servers", {
            cluster_id: worker.id,
            servers: data["urls"]
        });
    }
});

const unsetCluster = (clusterId) => {
    socket.emit("unset_cluster", {
        cluster_id: clusterId
    });
};

const setClusters = (processes) => {
    clusters = processes;
};

module.exports = {
    unsetCluster: unsetCluster,
    setClusters: setClusters
};