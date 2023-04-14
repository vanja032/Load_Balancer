const express = require("express");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");

const urls = require("./balancer/data/urls");
const max_requests_per_url = process.env.MAX_REQUESTS;

const balancer = express();
balancer.use(morgan("dev"));

balancer.get("/info", (request, result, next) => {
    result.send("NodeJs Load balancer server with Node clusters.");
});

const proxies = {};

for(const url in urls){
    proxies[`${url}`] = createProxyMiddleware({
        target: url,
        changeOrigin: true,
        onProxyReq: (proxy_request, request, response) => {
            const target_url = `${proxy_request.protocol}//${proxy_request.host}`;
            //console.log(`Incoming request for: ${target_url}`);
            urls[target_url] += 1;
            //console.log(urls);
            response.setHeader("X-Target-URL", `${target_url}`);
        },
        onProxyRes: (proxy_response, request, response) => {
            const target_url = `${response.getHeader("X-Target-URL")}`;
            //console.log(`Incoming result from: ${target_url}`);
            if(urls[target_url] > 0) urls[target_url] -= 1;
        }
    });
}

// Create a function to get the next available target URL
const getNextTarget = () => {
    for (const url in urls) {
        if (urls[url] < max_requests_per_url) {
            return url;
        }
    }
    return null; // Return null if all targets are saturated
};


const proxySelector = () => {
    const nextTarget = getNextTarget();
    if(nextTarget){
        return proxies[`${nextTarget}`];
    }
    else{
        return null;
    }
};

balancer.use("/", (request, response, next) => {
    const proxy = proxySelector();
    if(proxy){
        return proxy(request, response, next);
    }
    else{
        return response.status(503).send("All target URLs are saturated."); // Return 503 status if all targets are saturated
    }
});

module.exports = balancer;
