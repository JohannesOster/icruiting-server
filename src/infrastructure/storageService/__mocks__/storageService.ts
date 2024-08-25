export const StorageService = jest.fn().mockReturnValue({
  getUrl: jest.fn().mockResolvedValue('https://mock-signed-url.com'),
  upload: jest.fn().mockResolvedValue({}),
  del: jest.fn().mockResolvedValue({}),
  bulkDel: jest.fn().mockResolvedValue([]),
  list: jest.fn().mockResolvedValue([]),
});
