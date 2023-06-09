const cluster = require("cluster");
const express = require("express");
const morgan = require("morgan");
const cores_number = require("os").cpus().length;
const { createProxyMiddleware } = require("http-proxy-middleware");

const urls = require("./balancer/data/urls");
const { url } = require("inspector");
var max_requests_per_url = Math.floor(parseInt(process.env.MAX_REQUESTS) / cores_number); // Max number of requests per single core for single url address
var mainProcessId = 0;
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
            console.log(`Incoming request for host: ${target_url}`);
            urls[target_url]["requests"] += 1;
            //console.log(urls);
            process.send({ urls: urls });
            response.setHeader("X-Target-URL", `${target_url}`);
        },
        onProxyRes: (proxy_response, request, response) => {
            const target_url = `${response.getHeader("X-Target-URL")}`;
            console.log(`Incoming result from host: ${target_url}`);
            if (urls[target_url]["requests"] > 0) urls[target_url]["requests"] -= 1;
            process.send({ urls: urls });
        },
        onError: (error, request, response) => {
            const target_url = `${response.getHeader("X-Target-URL")}`;
            console.log(`Error from host: ${target_url}`);
            if (urls[target_url]["requests"] > 0) urls[target_url]["requests"] -= 1;
            process.send({ urls: urls });
            response.writeHead(500, {
                "Content-Type": "application/json"
            });
            response.end(JSON.stringify({ error: { message: "The targeted host is not responding or the url is not accessible. Try again later." } }));
        }
    });
}

// Create a function to get the next available target URL
const getNextTarget = () => {
    var nextTarget = null;
    for (const url in urls) {
        const max_per_url = (mainProcessId == cluster.worker.id) ? Math.floor(urls[url]["max_requests"] / cores_number) + urls[url]["max_requests"] % cores_number : Math.floor(urls[url]["max_requests"] / cores_number);
        // Implement the logic for making a decision about appropriate target server based on server health status and performance, as well as the number of requests
        if (urls[url]["requests"] < max_requests_per_url && urls[url]["requests"] < max_per_url && urls[url]["active"]) {
            if (nextTarget == null && serversHealth == null) {
                return url;
            }
            else if (serversHealth[url] != undefined) {
                if (nextTarget == null) {
                    if (serversHealth[url]["alive"] && serversHealth[url]["health_status"] != "bad") {
                        nextTarget = url;
                    }
                }
                else if (serversHealth[url]["performance"] < serversHealth[nextTarget]["performance"] && serversHealth[url]["alive"] && serversHealth[url]["health_status"] != "bad") {
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
    if (data.hasOwnProperty("main_subprocess")) {
        mainProcessId = data["main_subprocess"];

        if (data["main_subprocess"] == cluster.worker.id) {
            max_requests_per_url = Math.floor(parseInt(process.env.MAX_REQUESTS) / cores_number) + parseInt(process.env.MAX_REQUESTS) % cores_number;
        }
    }
    if (data.hasOwnProperty("servers_health")) {
        serversHealth = data["servers_health"];
        for (const url in urls) {
            // Set performance status for every server url
            if (serversHealth != null) {
                urls[url]["performance_health"] = serversHealth[url];
            }
        }
        process.send({ urls: urls });
    }
    if (data.hasOwnProperty("event")) {
        if (data["event"] == "update-servers") {
            process.send({ urls: urls });
        }
    }
    if (data.hasOwnProperty("active_status") && data.hasOwnProperty("url")) {
        urls[data["url"]]["active"] = data["active_status"];
        process.send({ urls: urls });
    }
    if (data.hasOwnProperty("requests_number") && data.hasOwnProperty("url")) {
        urls[data["url"]]["max_requests"] = data["requests_number"];
        process.send({ urls: urls });
    }
});

module.exports = balancer;