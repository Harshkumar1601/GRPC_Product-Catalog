const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Path to the protobuf service contract
const PROTO_PATH = path.join(__dirname, '../proto/inventory.proto');

// Load the protocol buffer definitions dynamically
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const inventoryProto = grpc.loadPackageDefinition(packageDefinition).inventory;

function main() {
    // Connect to the gRPC server running locally on port 50053
    const client = new inventoryProto.InventoryService(
        'localhost:50053',
        grpc.credentials.createInsecure()
    );

    // Promisify unary RPC calls for cleaner async/await syntax
    const addProduct = (product) => {
        return new Promise((resolve, reject) => {
            client.addProduct(product, (err, response) => {
                if (err) reject(err);
                else resolve(response);
            });
        });
    };

    const getProduct = (id) => {
        return new Promise((resolve) => {
            client.getProduct({ id }, (err, response) => {
                if (err) {
                    resolve({
                        success: false,
                        message: err.details || err.message,
                        product: null
                    });
                } else {
                    resolve(response);
                }
            });
        });
    };

    const updateProduct = (product) => {
        return new Promise((resolve, reject) => {
            client.updateProduct(product, (err, response) => {
                if (err) reject(err);
                else resolve(response);
            });
        });
    };

    const deleteProduct = (id) => {
        return new Promise((resolve, reject) => {
            client.deleteProduct({ id }, (err, response) => {
                if (err) reject(err);
                else resolve(response);
            });
        });
    };

    // Server-streaming RPC invocation helper
    const listProducts = () => {
        return new Promise((resolve, reject) => {
            console.log("\n=============================================");
            console.log("   RPC STREAM START: ListProducts");
            console.log("=============================================");
            const call = client.listProducts({});
            const items = [];

            call.on('data', (product) => {
                console.log(`[Stream Item] ID: ${product.id.padEnd(8)} | Name: ${product.name.padEnd(18)} | Price: $${product.price.toFixed(2).padEnd(6)} | Stock: ${product.stock}`);
                items.push(product);
            });

            call.on('end', () => {
                console.log("=============================================");
                console.log("   RPC STREAM END: ListProducts (Completed)");
                console.log("=============================================\n");
                resolve(items);
            });

            call.on('error', (err) => {
                console.error("Stream Error:", err);
                reject(err);
            });
        });
    };

    // Scenario execution flow demonstrating gRPC features
    (async () => {
        try {
            console.log("Initializing Node.js gRPC Client...");
            console.log("Connecting to server at localhost:50053...\n");

            // 1. List initial inventory products (Server-Streaming RPC)
            console.log("Step 1: Listing initial products");
            await listProducts();

            // 2. Add a new product (Unary RPC)
            console.log("Step 2: Adding a new product...");
            const newProduct = {
                id: "prod-4",
                name: "UltraWide Monitor",
                description: "34-inch Curved IPS Gaming Monitor",
                price: 449.99,
                stock: 15
            };
            const addRes = await addProduct(newProduct);
            console.log(`AddProduct Response Success: ${addRes.success}`);
            console.log(`Message: ${addRes.message}`);
            console.log("Added Product Details:", addRes.product);

            // 3. Get the added product's details (Unary RPC)
            console.log("\nStep 3: Fetching the newly added product...");
            const getRes = await getProduct("prod-4");
            console.log(`GetProduct Response Success: ${getRes.success}`);
            console.log("Retrieved Product Details:", getRes.product);

            // 4. Update the product details (Unary RPC)
            console.log("\nStep 4: Updating product stock and price...");
            const updatedProduct = {
                id: "prod-4",
                name: "UltraWide Monitor (Updated)",
                description: "34-inch Curved IPS Gaming Monitor - Pro Edition",
                price: 429.99,
                stock: 28
            };
            const updateRes = await updateProduct(updatedProduct);
            console.log(`UpdateProduct Response Success: ${updateRes.success}`);
            console.log(`Message: ${updateRes.message}`);
            console.log("Updated Product Details:", updateRes.product);

            // 5. List inventory again to show updated values (Server-Streaming RPC)
            console.log("\nStep 5: Verifying inventory with list stream");
            await listProducts();

            // 6. Delete the product (Unary RPC)
            console.log("Step 6: Deleting the product 'prod-4'...");
            const deleteRes = await deleteProduct("prod-4");
            console.log(`DeleteProduct Response Success: ${deleteRes.success}`);
            console.log(`Message: ${deleteRes.message}`);

            // 7. Verify deletion by fetching the deleted product (Unary RPC with error handling)
            console.log("\nStep 7: Verifying deletion by requesting 'prod-4' again...");
            const getResAfterDelete = await getProduct("prod-4");
            console.log(`GetProduct Response Success: ${getResAfterDelete.success}`);
            console.log(`Message: ${getResAfterDelete.message}`);

            console.log("\ngRPC Scenario completed successfully.");
        } catch (error) {
            console.error("Unexpected Client Error:", error);
        }
    })();
}

main();
