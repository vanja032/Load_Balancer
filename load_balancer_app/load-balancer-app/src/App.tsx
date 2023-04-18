import React, { ReactNode, useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./types/interfaces";
import ServerColumn from "./components/ServerColumn";

import "./App.css";
import "./assets/style/style.css";

const syncHost: string = "localhost";
const syncPort: number = 3030;

var socket = io(`${syncHost}:${syncPort}`);

const App = () => {
  var clusters: Clusters = {};
  var servers: Servers = {};

  const renderedServers = () => {
    const renderServers = [];
    for (const url in servers) {
      renderServers.push(
        <ServerColumn
          key={url}
          url={url}
          dns={servers[url].dns}
          ip={servers[url].ip}
          requests={servers[url].requests}
          max_requests={servers[url].max_requests}
          protocol={servers[url].protocol}
          active={servers[url].active}
          performance_health={servers[url].performance_health}
          onChangeActiveStatus={ChangeActiveStatus}
        />
      );
    }
    return renderServers;
  };
  const [serversStates, setServers] = useState(renderedServers());

  const updateClusters = (clusterId: string, urls: Servers) => {
    var oldCluster = clusters[clusterId];
    clusters[clusterId] = urls;
    updateServers(clusterId, oldCluster);
  };

  const ChangeActiveStatus = (url: string, activeStatus: boolean) => {
    socket.emit("change_active_state", {
      active_state: activeStatus,
      server: url,
    });
  };

  const updateServers = (clusterId: string, oldCluster: Servers) => {
    for (const url in clusters[clusterId]) {
      let oldRequests =
        oldCluster != undefined && oldCluster[url] != undefined
          ? oldCluster[url].requests
          : 0;
      let oldTotalRequests =
        servers[url] != undefined && servers[url].requests != undefined
          ? servers[url].requests
          : 0;
      let server: Server = {
        dns: clusters[clusterId][url].dns,
        ip: clusters[clusterId][url].ip,
        protocol: clusters[clusterId][url].protocol,
        requests:
          oldTotalRequests + clusters[clusterId][url].requests - oldRequests,
        max_requests: clusters[clusterId][url].max_requests,
        active: clusters[clusterId][url].active,
        performance_health: clusters[clusterId][url].performance_health,
      };
      servers[url] = server;
    }
    setServers(renderedServers());
  };

  useEffect(() => {
    socket.on("servers", (data) => {
      if (data.hasOwnProperty("cluster_id") && data.hasOwnProperty("servers")) {
        updateClusters(data["cluster_id"], data["servers"]);
      }
    });

    return () => {};
  }, []);

  return (
    <div className="container p-4 bg-dark1" style={{ maxWidth: 100 + "%" }}>
      <div className="row">{serversStates}</div>
    </div>
  );
};

export default App;
