# gRPC Microservices Experiment: Python & Node.js

This repository contains a simple gRPC-based microservice architecture demonstrating cross-language inter-service communication.
- **gRPC Server**: Implemented in **Python**
- **gRPC Client**: Implemented in **Node.js** (JavaScript)
- **Service Contract**: Defined in Protocol Buffers v3 (`inventory.proto`)

---

## Directory Structure

```
.
├── proto/
│   └── inventory.proto          # Protocol Buffers service definition
├── server-python/
│   ├── requirements.txt         # Python dependencies
│   ├── server.py                # Python gRPC server implementation
│   └── .venv/                   # Python virtual environment (auto-created)
└── client-node/
    ├── package.json             # Node.js dependencies
    └── client.js                # Node.js gRPC client implementation
```

---

## How to Setup and Run

### 1. Compile Protocol Buffers & Start Python Server

Open a terminal and run:

```powershell
# 1. Compile the protobuf service definition to Python stubs
server-python\.venv\Scripts\python -m grpc_tools.protoc -I. --python_out=server-python --grpc_python_out=server-python proto/inventory.proto

# 2. Start the server
server-python\.venv\Scripts\python server-python/server.py
```

*The server will start listening on port `50053`.*

### 2. Install Dependencies & Run Node.js Client

Open a second terminal window and run:

```powershell
# 1. Install Node.js dependencies
npm install --prefix client-node

# 2. Execute the client script
node client-node/client.js
```

---

## Why gRPC for Inter-Service Communication?

In modern microservice architectures, services need to communicate efficiently and reliably. While REST over HTTP/1.1 (JSON) is common, gRPC offers several massive benefits for internal communication:

### 1. High Performance & Binary Serialization
- **Protobuf vs JSON**: gRPC uses Protocol Buffers (Protobuf) for message serialization. Protobuf compiles down to a compact binary format that is significantly smaller and faster to serialize/deserialize than text-based JSON.
- **Resource Savings**: Reduces bandwidth consumption and CPU overhead on both the sender and receiver.

### 2. HTTP/2 Transport Layer
gRPC is built on HTTP/2, which brings substantial performance improvements over HTTP/1.1:
- **Multiplexing**: Multiple requests and responses can be interleaved over a single TCP connection, eliminating the head-of-line blocking problem and reducing the overhead of establishing connections.
- **Header Compression (HPACK)**: Compresses HTTP metadata headers, which can be larger than the message payload in REST.
- **Server Push / Streaming**: Supports full streaming architectures out-of-the-box.

### 3. Strict Service Contracts (Schema-First)
- **Single Source of Truth**: The `.proto` file strictly defines the service interface (RPC methods) and data structures.
- **Elimination of Schema Drift**: Stubs are compiled directly from the schema, ensuring that client and server are always aligned. Any mismatches are caught during compilation or type checks, rather than at runtime.

### 4. Native Cross-Language Support
- gRPC provides official tooling to generate idiomatic stubs for almost every major programming language (Python, Node.js, Go, Java, C++, C#, Ruby, Rust).
- This experiment showcases this strength: a **Python** server communicating seamlessly with a **Node.js** client using the exact same `.proto` interface.

### 5. Rich Communication Patterns
gRPC supports four communication models:
1. **Unary RPCs**: Simple request-response (like REST).
2. **Server Streaming RPCs**: Client sends a single request, server streams back multiple responses (used in this project for `ListProducts`).
3. **Client Streaming RPCs**: Client streams multiple requests, server responds with a single reply.
4. **Bidirectional Streaming RPCs**: Both client and server send a stream of messages simultaneously.
