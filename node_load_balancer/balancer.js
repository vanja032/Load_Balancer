const express = require("express");
const morgan = require("morgan");
const cores_number = require("os").cpus().length;
const { createProxyMiddleware } = require("http-proxy-middleware");

const urls = require("./balancer/data/urls");
const max_requests_per_url = Math.floor(parseInt(process.env.MAX_REQUESTS) / cores_number); // Max number of requests per single core for single url address
var serversHealth = null;

const balancer = express();
balancer.use(morgan("dev"));

balancer.get("/info", (request, result, next) => {
    result.send("NodeJs Load balancer server with Node clusters.");
});

const proxies = {};

for (const url in urls) {
    proxies[`${url}`] = createProxyMiddleware({
        target: url,
        changeOrigin: true,
        onProxyReq: (proxy_request, request, response) => {
            const target_url = `${proxy_request.protocol}//${proxy_request.host}`;
            //console.log(`Incoming request for: ${target_url}`);
            urls[target_url]["requests"] += 1;
            console.log(urls);
            response.setHeader("X-Target-URL", `${target_url}`);
        },
        onProxyRes: (proxy_response, request, response) => {
            const target_url = `${response.getHeader("X-Target-URL")}`;
            //console.log(`Incoming result from: ${target_url}`);
            if (urls[target_url]["requests"] > 0) urls[target_url]["requests"] -= 1;
        }
    });
}

// Create a function to get the next available target URL
const getNextTarget = () => {
    var nextTarget = null;
    for (const url in urls) {
        // Implement the logic for deciding appropriate target server based on server health status and performance, as well as the number of requests
        if (urls[url]["requests"] < max_requests_per_url) {
            if (nextTarget == null && serversHealth == null) {
                return url;
            }
            else if (serversHealth[url] != undefined) {
                if (nextTarget == null) {
                    if (serversHealth[url]["alive"]) {
                        nextTarget = url;
                    }
                }
                else if (serversHealth[url]["performance"] < serversHealth[nextTarget]["performance"] && serversHealth[url]["alive"]) {
                    nextTarget = url;
                }
            }
            else if (nextTarget == null) {
                return url;
            }
            else {
                continue;
            }
        }
        // Set performance status for every server url
        if (serversHealth != null) {
            urls[url]["performance_health"] = serversHealth[url];
        }
    }
    return nextTarget; // Return null if all targets are saturated or are not alive
};


const proxySelector = () => {
    const nextTarget = getNextTarget();
    if (nextTarget) {
        return proxies[`${nextTarget}`];
    }
    else {
        return null;
    }
};

balancer.use("/", (request, response, next) => {
    const proxy = proxySelector();
    if (proxy) {
        return (proxy)(request, response, next);
    }
    else {
        return response.status(503).send("All target URLs are saturated."); // Return 503 status if all targets are saturated
    }
});

process.on("message", (data) => {
    if (data.hasOwnProperty("servers_health")) {
        serversHealth = data["servers_health"];
    }
});

module.exports = balancer;