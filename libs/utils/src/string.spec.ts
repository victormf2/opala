import { capitalize } from './string';
describe('capitalize', function () {
  it('should capitalize', function () {
    const capitalized = capitalize('ábc');
    expect(capitalized).toBe('Ábc');
  });
});
