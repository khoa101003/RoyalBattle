
interface PriorityQueueItem<T> {
    value: T;
    priority: number;
}
export class PriorityQueue<T> {
    private heap: PriorityQueueItem<T>[] = [];

    constructor(private comparator: (a: number, b: number) => boolean = (a, b) => a < b) {

    }

    clear() {
        if (!this.heap) return;
        while (this.heap.length) {
            this.heap.pop();
        }
    }
    push(value: T, priority: number) {
        if (!this.heap) return;
        const item = { value, priority };
        this.heap.push(item);
        this.up(this.heap.length - 1);
    }
    length() {
        if (!this.heap) return 0;
        return this.heap.length;
    }
    pop() {
        if (!this.heap) return null;
        if (this.heap.length == 0) return null;
        const item = this.heap[0];
        const last = this.heap.pop()!;

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.down(0);
        }

        return item;
    }
    swap(i: number, j: number) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]]
    }
    up(id: number) {
        while (id > 0) {
            const ParentId = Math.floor((id - 1) / 2);
            if (this.comparator(this.heap[id].priority, this.heap[ParentId].priority)) {
                this.swap(id, ParentId);
                id = ParentId;
            }
            else break;
        }
    }

    down(id: number) {
        if (!this.heap) return;
        while (true) {
            const leftID = id * 2 + 1;
            const rightID = id * 2 + 2;

            let minId = id;

            if (leftID < this.heap.length && this.comparator(this.heap[leftID].priority, this.heap[minId].priority)) {
                minId = leftID;
            }

            if (rightID < this.heap.length && this.comparator(this.heap[rightID].priority, this.heap[minId].priority)) {
                minId = rightID;
            }

            if (minId !== id) {
                this.swap(minId, id);
                id = minId;
            }
            else {
                break;
            }
        }

    }

}


