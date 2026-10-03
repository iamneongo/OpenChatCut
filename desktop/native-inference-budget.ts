const MAX_ACTIVE_REQUESTS = 4;
const MAX_ACTIVE_INPUT_BYTES = 128 * 1024 * 1024;

interface ActiveRequest {
  readonly ownerId: number;
  readonly inputBytes: number;
}

export class NativeInferenceBudget {
  private activeInputBytes = 0;
  private readonly active = new Map<string, ActiveRequest>();
  private readonly ownerRequests = new Map<number, Set<string>>();

  claim(ownerId: number, requestId: string, inputBytes: number): void {
    if (!Number.isSafeInteger(ownerId) || ownerId < 0
      || !Number.isSafeInteger(inputBytes) || inputBytes < 0) {
      throw new Error('ngân sách request suy luận desktop không hợp lệ');
    }
    if (this.active.has(requestId)) throw new Error('request id suy luận desktop bị trùng');
    if (this.active.size >= MAX_ACTIVE_REQUESTS) throw new Error('quá nhiều request suy luận desktop đang hoạt động');
    if (this.active.size > 0 && !this.ownerRequests.has(ownerId)) {
      throw new Error('suy luận desktop đang bận ở renderer khác');
    }
    if (this.activeInputBytes + inputBytes > MAX_ACTIVE_INPUT_BYTES) {
      throw new Error('đã vượt giới hạn đầu vào suy luận desktop');
    }
    this.active.set(requestId, { ownerId, inputBytes });
    this.activeInputBytes += inputBytes;
    const requests = this.ownerRequests.get(ownerId) ?? new Set<string>();
    requests.add(requestId);
    this.ownerRequests.set(ownerId, requests);
  }

  release(requestId: string): void {
    const request = this.active.get(requestId);
    if (!request) return;
    this.active.delete(requestId);
    this.activeInputBytes -= request.inputBytes;
    const requests = this.ownerRequests.get(request.ownerId);
    requests?.delete(requestId);
    if (requests?.size === 0) this.ownerRequests.delete(request.ownerId);
  }

  ownerOf(requestId: string): number | undefined {
    return this.active.get(requestId)?.ownerId;
  }

  requestIds(ownerId?: number): readonly string[] {
    if (ownerId === undefined) return [...this.active.keys()];
    return [...(this.ownerRequests.get(ownerId) ?? [])];
  }

  get activeCount(): number {
    return this.active.size;
  }
}
