import { CreateVirtualIDText } from '.';

describe('Virtual ID Manager Sub Module Test', () => {
    test('CreateVirtualIDText', () => {
        expect(CreateVirtualIDText()).toMatch(/^vid-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
    });
});
