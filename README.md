# gRPC Microservices Experiment: Python & Node.js

This repository contains a gRPC-based Product Catalog microservice architecture demonstrating cross-language inter-service communication and REST-to-gRPC API translation.
- **gRPC Server**: Implemented in **Python** (Port `50053`)
- **REST HTTP Gateway**: Implemented in **Node.js / Express** (Port `8080`)
- **gRPC Client**: Implemented in **Node.js** (JavaScript CLI client)
- **Service Contract**: Defined in Protocol Buffers v3 (`proto/inventory.proto`)

---

## Directory Structure

```
.
├── proto/
│   ├── google/api/              # Annotations & HTTP protobuf definitions
│   └── inventory.proto          # Protocol Buffers service definition
├── server-python/
│   ├── requirements.txt         # Python dependencies
│   ├── server.py                # Python gRPC server implementation
│   └── .venv/                   # Python virtual environment
├── gateway-node/
│   ├── package.json             # Express & gRPC Gateway dependencies
│   └── gateway.js               # REST-to-gRPC Reverse Proxy Server
└── client-node/
    ├── package.json             # Node.js client dependencies
    └── client.js                # Node.js gRPC client implementation
```

---

## How to Setup and Run

### 1. Compile Protocol Buffers & Start Python Server

Open a terminal and run:

```powershell
# 1. Compile the protobuf service definition to Python stubs
server-python\.venv\Scripts\python -m grpc_tools.protoc -I. --python_out=server-python --grpc_python_out=server-python proto/inventory.proto

# 2. Start the Python gRPC server
server-python\.venv\Scripts\python server-python/server.py
```

*The Python gRPC server will start listening on port `50053`.*

### 2. Start REST Gateway Server (Optional for REST / Postman HTTP testing)

Open a second terminal window:

```powershell
# Install Gateway dependencies & start server
npm install --prefix gateway-node
node gateway-node/gateway.js
```

*The Express REST Gateway will run on port `8080`.*

### 3. Run Node.js gRPC Client

Open a third terminal window:

```powershell
# Install Node client dependencies & run client script
npm install --prefix client-node
node client-node/client.js
```

---

## Testing APIs with Postman

Postman allows you to test this project in **two ways**: via the **REST HTTP Gateway** or **Direct gRPC Request**.

---

### Method 1: Testing via REST Gateway (HTTP / JSON)

Ensure both the **Python Server** (port `50053`) and **REST Gateway** (port `8080`) are running.

| Method | Endpoint | Description | Postman Body (JSON) |
| :--- | :--- | :--- | :--- |
| **GET** | `http://localhost:8080/v1/products` | List all products | *None* |
| **GET** | `http://localhost:8080/v1/products/P101` | Get product details by ID | *None* |
| **POST** | `http://localhost:8080/v1/products` | Add a new product | `{"id": "P106", "name": "Mechanical Keyboard", "description": "RGB Backlit", "price": 89.99, "stock": 40}` |
| **PUT** | `http://localhost:8080/v1/products` | Update existing product | `{"id": "P101", "name": "Gaming Laptop Pro", "description": "Updated Specs", "price": 1499.99, "stock": 15}` |
| **DELETE** | `http://localhost:8080/v1/products/P101` | Delete product by ID | *None* |

#### Steps in Postman for REST:
1. Open Postman and create a **New HTTP Request**.
2. Select HTTP Method (`GET`, `POST`, `PUT`, `DELETE`).
3. Enter the URL (e.g., `http://localhost:8080/v1/products`).
4. For `POST` / `PUT`, go to the **Body** tab $\rightarrow$ select **raw** $\rightarrow$ set format to **JSON**, and paste the payload.
5. Click **Send**.

---

### Method 2: Testing gRPC Server Directly in Postman

Postman natively supports testing gRPC services directly without needing the HTTP Gateway.

#### Steps in Postman for gRPC:
1. Open Postman and click **New** $\rightarrow$ select **gRPC Request**.
2. Set Server URL to: `localhost:50053` (or `grpc://localhost:50053`).
3. Under **Protobuf Definition**, click **Import a .proto file**.
   - Select `proto/inventory.proto` from your repository.
   - Include search directory path: `proto/` (so `google/api` imports resolve properly).
4. Select the service method from the dropdown (e.g., `inventory.InventoryService/GetProduct`).
5. Go to the **Message** tab and enter the JSON request payload:

**GetProduct Request:**
```json
{
  "id": "P101"
}
```

**AddProduct Request:**
```json
{
  "id": "P105",
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4GHz Mouse",
  "price": 29.99,
  "stock": 100
}
```

**ListProducts Request (Server Streaming):**
```json
{}
```

6. Click **Invoke** to trigger the gRPC request and view the response stream.

---

## Why gRPC for Inter-Service Communication?

In modern microservice architectures, services need to communicate efficiently and reliably. While REST over HTTP/1.1 (JSON) is common, gRPC offers several massive benefits for internal communication:

### 1. High Performance & Binary Serialization
- **Protobuf vs JSON**: gRPC uses Protocol Buffers (Protobuf) for message serialization. Protobuf compiles down to a compact binary format that is significantly smaller and faster to serialize/deserialize than text-based JSON.
- **Resource Savings**: Reduces bandwidth consumption and CPU overhead on both the sender and receiver.

### 2. HTTP/2 Transport Layer
gRPC is built on HTTP/2, which brings substantial performance improvements over HTTP/1.1:
- **Multiplexing**: Multiple requests and responses can be interleaved over a single TCP connection, eliminating head-of-line blocking.
- **Header Compression (HPACK)**: Compresses HTTP metadata headers.
- **Server Push / Streaming**: Supports full streaming architectures out-of-the-box.

### 3. Strict Service Contracts (Schema-First)
- **Single Source of Truth**: The `.proto` file strictly defines the service interface (RPC methods) and data structures.
- **Elimination of Schema Drift**: Stubs are compiled directly from the schema, ensuring client and server remain in sync.

### 4. Native Cross-Language Support
- gRPC provides official tooling to generate idiomatic stubs for Python, Node.js, Go, Java, C++, C#, etc.
- This experiment showcases this strength: a **Python** server communicating seamlessly with a **Node.js** client using the exact same `.proto` interface.
