import request from 'supertest';
import app from '../index';

describe('API Integration', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
  it('GET /api/aircraft returns aircraft array', async () => {
    const res = await request(app).get('/api/aircraft');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
