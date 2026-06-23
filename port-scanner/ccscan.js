#!/usr/bin/env node

const net = require("net");
const { program } = require("commander");

// === CONFIGURATION ===
const DEFAULT_TIMEOUT = 500; // ms
const DEFAULT_CONCURRENCY = 200;

// === PORT SCANNING ===

/**
 * Attempt a TCP connection to host:port.
 * Returns true if the port is open, false otherwise.
 */
function scanPort(host, port, timeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      socket.destroy();
      resolve({ port, open: true });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ port, open: false });
    });

    socket.on("error", () => {
      socket.destroy();
      resolve({ port, open: false });
    });

    socket.connect(port, host);
  });
}

/**
 * Scan multiple ports concurrently with a concurrency limit.
 */
async function scanPorts(host, ports, timeout, concurrency, onResult) {
  const queue = [...ports];
  const workers = [];

  for (let i = 0; i < concurrency; i++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const port = queue.shift();
          const result = await scanPort(host, port, timeout);
          if (result.open) onResult(result);
        }
      })()
    );
  }

  await Promise.all(workers);
}

// === HOST EXPANSION ===

/**
 * Expand host patterns like "192.168.1.*" or "host1,host2" into an array of hosts.
 */
function expandHosts(hostArg) {
  // Comma-separated list
  if (hostArg.includes(",")) {
    return hostArg.split(",").map((h) => h.trim());
  }

  // Wildcard IP (e.g. 192.168.1.*)
  if (hostArg.includes("*")) {
    const parts = hostArg.split(".");
    const hosts = [];
    // Only support wildcard in last octet
    if (parts.length === 4 && parts[3] === "*") {
      const prefix = parts.slice(0, 3).join(".");
      for (let i = 1; i <= 254; i++) {
        hosts.push(`${prefix}.${i}`);
      }
      return hosts;
    }
  }

  // CIDR notation (e.g. 192.168.1.0/24)
  if (hostArg.includes("/")) {
    const [ip, bits] = hostArg.split("/");
    const mask = parseInt(bits, 10);
    if (mask >= 24 && mask <= 32) {
      const parts = ip.split(".").map(Number);
      const baseIp = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
      const hostBits = 32 - mask;
      const numHosts = Math.pow(2, hostBits);
      const networkAddr = baseIp & (0xffffffff << hostBits);
      const hosts = [];
      // Skip network address (first) and broadcast (last)
      for (let i = 1; i < numHosts - 1; i++) {
        const addr = networkAddr + i;
        hosts.push(
          `${(addr >>> 24) & 255}.${(addr >>> 16) & 255}.${(addr >>> 8) & 255}.${addr & 255}`
        );
      }
      return hosts;
    }
  }

  return [hostArg];
}

// === CLI ===

program
  .name("ccscan")
  .description("A port scanner CLI tool")
  .version("1.0.0")
  .option("-H, --host <host>", "host(s) to scan (comma-separated, wildcard, or CIDR)", "localhost")
  .option("-p, --port <port>", "specific port to scan")
  .option("-r, --range <range>", "port range to scan (e.g. 1-1024)")
  .option("-t, --timeout <ms>", "connection timeout in ms", String(DEFAULT_TIMEOUT))
  .option("-c, --concurrency <n>", "number of concurrent connections", String(DEFAULT_CONCURRENCY))
  .action(async (opts) => {
    const hosts = expandHosts(opts.host);
    const timeout = parseInt(opts.timeout, 10);
    const concurrency = parseInt(opts.concurrency, 10);

    // Determine ports to scan
    let ports;
    if (opts.port) {
      ports = [parseInt(opts.port, 10)];
    } else if (opts.range) {
      const [start, end] = opts.range.split("-").map(Number);
      ports = [];
      for (let p = start; p <= end; p++) ports.push(p);
    } else {
      // Full scan: 1-65535
      ports = [];
      for (let p = 1; p <= 65535; p++) ports.push(p);
    }

    for (const host of hosts) {
      console.log(`\nScanning host: ${host}`);

      if (ports.length === 1) {
        console.log(`Scanning port: ${ports[0]}`);
      } else {
        console.log(`Scanning ${ports.length} ports (concurrency: ${concurrency}, timeout: ${timeout}ms)`);
      }

      const openPorts = [];

      await scanPorts(host, ports, timeout, concurrency, (result) => {
        console.log(`  Port ${result.port} is open`);
        openPorts.push(result.port);
      });

      if (openPorts.length === 0) {
        console.log("  No open ports found.");
      } else {
        console.log(`\n  ${openPorts.length} open port(s) found on ${host}`);
      }
    }
  });

program.parse();
