import {WRITE_SVG, OUTPUT_PATH} from '../../src/utils/file-writer';
import {rmdirSync, readFileSync} from 'fs';
const targetFolder = `${OUTPUT_PATH}/test`;

afterEach(() => {
    rmdirSync(targetFolder, {recursive: true});
});
describe('Test output function', () => {
    it('test write svg can work', () => {
        WRITE_SVG('test', 'write-svg', 'work');
        const content = readFileSync(`${targetFolder}/write-svg.svg`, {
            encoding: 'utf8',
            flag: 'r'
        });
        expect(content).toEqual('work');
    });
});
