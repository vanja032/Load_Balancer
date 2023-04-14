#!/usr/bin/python3
import requests
import threading
import time

try:
    # Define the target URL to the load balancer
    target_url = "http://localhost:3000"

    # Define the number of threads and requests per thread
    num_threads = 15
    requests_per_thread = 30

    # Function to send GET requests
    def send_requests():
        for i in range(requests_per_thread):
            try:
                response = requests.get(f"{target_url}/v1/chain/get_info")
                print(f"Thread {threading.current_thread().name}: Request {i + 1} - Status Code: {response.status_code}")
            except:
                print("Targeted address not found.")
                break

    # Create and start the threads
    threads = []
    for i in range(num_threads):
        thread = threading.Thread(target=send_requests)
        thread.start()
        threads.append(thread)
        time.sleep(0.1)

    # Wait for all threads to finish
    for thread in threads:
        thread.join()

    print("All threads finished.")
except:
    print("Error while testing the load balancer.")
