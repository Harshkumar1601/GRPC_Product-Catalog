import grpc
from concurrent import futures
import time
import os
import sys

# Ensure the current directory is in the import path so that the generated pb2 modules can find each other
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import inventory_pb2
    import inventory_pb2_grpc
except ImportError as e:
    print(f"[Error] Could not import generated gRPC files: {e}")
    sys.exit(1)

class InventoryServiceServicer(inventory_pb2_grpc.InventoryServiceServicer):
    def __init__(self):
        # In-memory product catalog keyed by product ID
        self.db = {
            "prod-1": inventory_pb2.Product(
                id="prod-1",
                name="Laptop",
                description="High performance developer laptop",
                price=1299.99,
                stock=10
            ),
            "prod-2": inventory_pb2.Product(
                id="prod-2",
                name="Wireless Mouse",
                description="Ergonomic rechargeable optical mouse",
                price=49.99,
                stock=50
            ),
            "prod-3": inventory_pb2.Product(
                id="prod-3",
                name="USB-C Hub",
                description="8-in-1 multi-port adapter",
                price=34.99,
                stock=120
            )
        }
        print("[Server] Database initialized with default products.")

    def AddProduct(self, request, context):
        print(f"[Server] AddProduct called: {request.name} (ID: {request.id})")
        if request.id in self.db:
            return inventory_pb2.ProductResponse(
                success=False,
                message=f"Product with ID '{request.id}' already exists."
            )
        
        self.db[request.id] = request
        return inventory_pb2.ProductResponse(
            success=True,
            message="Product added successfully.",
            product=request
        )

    def GetProduct(self, request, context):
        print(f"[Server] GetProduct called for ID: {request.id}")
        product = self.db.get(request.id)
        if not product:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"Product with ID '{request.id}' not found.")
            return inventory_pb2.ProductResponse(
                success=False,
                message=f"Product with ID '{request.id}' not found."
            )
        
        return inventory_pb2.ProductResponse(
            success=True,
            message="Product retrieved successfully.",
            product=product
        )

    def UpdateProduct(self, request, context):
        print(f"[Server] UpdateProduct called: {request.name} (ID: {request.id})")
        if request.id not in self.db:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"Product with ID '{request.id}' not found.")
            return inventory_pb2.ProductResponse(
                success=False,
                message=f"Product with ID '{request.id}' not found."
            )
        
        self.db[request.id] = request
        return inventory_pb2.ProductResponse(
            success=True,
            message="Product updated successfully.",
            product=request
        )

    def DeleteProduct(self, request, context):
        print(f"[Server] DeleteProduct called for ID: {request.id}")
        if request.id not in self.db:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"Product with ID '{request.id}' not found.")
            return inventory_pb2.DeleteResponse(
                success=False,
                message=f"Product with ID '{request.id}' not found."
            )
        
        del self.db[request.id]
        return inventory_pb2.DeleteResponse(
            success=True,
            message=f"Product with ID '{request.id}' deleted successfully."
        )

    def ListProducts(self, request, context):
        print(f"[Server] ListProducts (streaming) called. Streaming {len(self.db)} products...")
        for product in list(self.db.values()):
            yield product
            time.sleep(0.2)  # Simulate simulated latency for streaming visual effect

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    inventory_pb2_grpc.add_InventoryServiceServicer_to_server(
        InventoryServiceServicer(), server
    )
    server.add_insecure_port('[::]:50053')
    print("[Server] Starting gRPC server on port 50053...")
    server.start()
    print("[Server] Server running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        print("[Server] Stopping server...")
        server.stop(0)

if __name__ == '__main__':
    serve()
