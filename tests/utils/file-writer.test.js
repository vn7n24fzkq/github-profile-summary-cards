import { writeSVG, outputPath } from '../../src/utils/file-writer';
import { rmdirSync, readFileSync } from 'fs';
const targetFolder = `${outputPath}/test`;

afterEach(() => {
    rmdirSync(targetFolder, { recursive: true });
});
describe('Test output function', () => {
    it('test write svg can work', () => {
        writeSVG('test', 'write-svg', 'work');
        const content = readFileSync(`${targetFolder}/write-svg.svg`, {
            encoding: 'utf8',
            flag: 'r',
        });
        expect(content).toEqual('work');
    });
});
