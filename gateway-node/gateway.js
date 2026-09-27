const path = require('path');
const express = require('express');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '../proto/inventory.proto');
const PROTO_DIR = path.join(__dirname, '../proto');

// Load protobuf definition with google/api import paths resolved
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [PROTO_DIR]
});

const inventoryProto = grpc.loadPackageDefinition(packageDefinition).inventory;

// Initialize gRPC client pointing to Python backend server
const grpcClient = new inventoryProto.InventoryService(
    'localhost:50053',
    grpc.credentials.createInsecure()
);

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.url}`);
    next();
});

// Root endpoint info
app.get('/', (req, res) => {
    res.json({
        service: "gRPC HTTP Reverse-Proxy Gateway",
        backend: "localhost:50053 (Python gRPC)",
        endpoints: [
            "GET /v1/products",
            "GET /v1/products/:id",
            "POST /v1/products",
            "PUT /v1/products",
            "DELETE /v1/products/:id"
        ]
    });
});

// 1. GET /v1/products -> ListProducts (Server Streaming RPC)
app.get('/v1/products', (req, res) => {
    const products = [];
    const stream = grpcClient.listProducts({});

    stream.on('data', (product) => {
        products.push(product);
    });

    stream.on('end', () => {
        res.json({
            success: true,
            total: products.length,
            products: products
        });
    });

    stream.on('error', (err) => {
        console.error('[Gateway Error] ListProducts failed:', err.message);
        res.status(500).json({ success: false, error: err.message });
    });
});

// 2. GET /v1/products/:id -> GetProduct (Unary RPC)
app.get('/v1/products/:id', (req, res) => {
    const productId = req.params.id;
    grpcClient.getProduct({ id: productId }, (err, response) => {
        if (err) {
            console.error('[Gateway Error] GetProduct failed:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        if (!response.success) {
            return res.status(404).json(response);
        }
        res.json(response);
    });
});

// 3. POST /v1/products -> AddProduct (Unary RPC)
app.post('/v1/products', (req, res) => {
    const newProduct = {
        id: req.body.id,
        name: req.body.name,
        description: req.body.description || '',
        price: parseFloat(req.body.price || 0),
        stock: parseInt(req.body.stock || 0, 10)
    };

    if (!newProduct.id || !newProduct.name) {
        return res.status(400).json({
            success: false,
            message: "Fields 'id' and 'name' are required."
        });
    }

    grpcClient.addProduct(newProduct, (err, response) => {
        if (err) {
            console.error('[Gateway Error] AddProduct failed:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.status(response.success ? 201 : 400).json(response);
    });
});

// 4. PUT /v1/products -> UpdateProduct (Unary RPC)
app.put('/v1/products', (req, res) => {
    const updatedProduct = {
        id: req.body.id,
        name: req.body.name,
        description: req.body.description || '',
        price: parseFloat(req.body.price || 0),
        stock: parseInt(req.body.stock || 0, 10)
    };

    if (!updatedProduct.id) {
        return res.status(400).json({
            success: false,
            message: "Field 'id' is required for update."
        });
    }

    grpcClient.updateProduct(updatedProduct, (err, response) => {
        if (err) {
            console.error('[Gateway Error] UpdateProduct failed:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.status(response.success ? 200 : 404).json(response);
    });
});

// 5. DELETE /v1/products/:id -> DeleteProduct (Unary RPC)
app.delete('/v1/products/:id', (req, res) => {
    const productId = req.params.id;
    grpcClient.deleteProduct({ id: productId }, (err, response) => {
        if (err) {
            console.error('[Gateway Error] DeleteProduct failed:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.status(response.success ? 200 : 404).json(response);
    });
});

app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` gRPC HTTP Gateway Server running on port ${PORT}`);
    console.log(` Forwarding REST/JSON calls -> gRPC localhost:50053`);
    console.log(`===================================================`);
});
