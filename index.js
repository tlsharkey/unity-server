#!/usr/bin/env node

/*
Hosts a simple web server that serves the current directory and its subdirectories.
Handles gzip and brotli compression.
Any files ending in .gz or .br are served as the mime type of the file without the .gz or .br extension.
*/

const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const url = require("url");
const mime = require("mime-types");
const { promisify } = require("util");

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

const PORT = 8080;

const server = http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(url.parse(req.url).pathname);
    const filepath = path.join(process.cwd(), pathname);

    try {
        const stats = await stat(filepath);
        if (stats.isFile()) {
            let mimeType = mime.lookup(filepath);
            if (mimeType) {
                res.setHeader("Content-Type", mimeType);
            }

            if (filepath.endsWith(".gz")) {
                res.setHeader("Content-Encoding", "gzip");
                mimeType = mime.lookup(filepath.slice(0, -3));
                // console.log(`Mime type of ${filepath.slice(0, -3)} is ${mimeType}`);
            } else if (filepath.endsWith(".br")) {
                res.setHeader("Content-Encoding", "br");
                mimeType = mime.lookup(filepath.slice(0, -3));
                // console.log(`Mime type of ${filepath.slice(0, -3)} is ${mimeType}`);
            }

            res.writeHead(200, { 'Content-Type': mimeType });
            const stream = fs.createReadStream(filepath);
            stream.pipe(res);
            console.log(`Served file ${filepath} with mime type ${mimeType}`);
        } else if (stats.isDirectory()) {
            const files = await readdir(filepath);
            res.setHeader("Content-Type", "text/html");
            res.write("<html><body>");
            for (const file of files) {
                res.write(
                    `<a href="${path.join(pathname, file)}">${file}</a><br>`
                );
            }
            res.end("</body></html>");
            console.log(`Served directory ${filepath}`);
        }
    } catch (err) {
        res.statusCode = 404;
        res.end("Not found");
        console.error(`Error serving ${filepath}: ${err}`);
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
