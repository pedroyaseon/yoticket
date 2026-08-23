import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports a healthy API', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok' });
  });
});
