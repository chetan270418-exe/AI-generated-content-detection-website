"""
Custom LRU Cache Implementation (O(1) time complexity)
Uses a Doubly Linked List for O(1) removals and a Hash Map for O(1) lookups.
"""
from typing import Any, Optional

class Node:
    def __init__(self, key: str, value: Any):
        self.key = key
        self.value = value
        self.prev: Optional['Node'] = None
        self.next: Optional['Node'] = None

class LRUCache:
    def __init__(self, capacity: int = 100):
        self.capacity = capacity
        self.cache = {}  # Map key -> Node
        # Dummy head and tail to avoid edge cases
        self.head = Node("head", None)
        self.tail = Node("tail", None)
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node):
        """Remove a node from the linked list."""
        p = node.prev
        n = node.next
        if p and n:
            p.next = n
            n.prev = p

    def _add(self, node: Node):
        """Add a node right after the head (most recently used)."""
        n = self.head.next
        self.head.next = node
        node.prev = self.head
        node.next = n
        if n:
            n.prev = node

    def get(self, key: str) -> Optional[Any]:
        """Get an item from cache. O(1) time."""
        if key in self.cache:
            node = self.cache[key]
            # Move to front (most recently used)
            self._remove(node)
            self._add(node)
            return node.value
        return None

    def put(self, key: str, value: Any):
        """Put an item in cache. Evicts LRU if capacity exceeded. O(1) time."""
        if key in self.cache:
            self._remove(self.cache[key])
        
        node = Node(key, value)
        self._add(node)
        self.cache[key] = node
        
        if len(self.cache) > self.capacity:
            # Evict least recently used (node before tail)
            lru = self.tail.prev
            if lru and lru != self.head:
                self._remove(lru)
                del self.cache[lru.key]

# Global singleton cache instance for ML predictions (100 item capacity)
prediction_cache = LRUCache(capacity=100)
