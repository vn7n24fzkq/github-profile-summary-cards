import handler from '../../api/cards/productive-time';
import {handleCard} from '../../api/utils/handle-card';
import {getProductiveTimeSVGWithThemeName} from '../../src/cards/productive-time-card';
import {getOwnerType} from '../../src/github-api/owner-type';

jest.mock('../../api/utils/handle-card', () => ({handleCard: jest.fn()}));
jest.mock('../../api/utils/error-card', () => ({getErrorMsgCard: jest.fn()}));
jest.mock('../../src/cards/productive-time-card', () => ({getProductiveTimeSVGWithThemeName: jest.fn()}));
jest.mock('../../src/github-api/owner-type', () => ({getOwnerType: jest.fn()}));

const mockHandleCard = handleCard as jest.Mock;
const mockGetProductiveTimeSVG = getProductiveTimeSVGWithThemeName as jest.Mock;
const mockGetOwnerType = getOwnerType as jest.Mock;

const makeReq = (query: Record<string, unknown>) => ({query, headers: {}}) as any;

const makeRes = () => {
    const res: any = {
        status: jest.fn(),
        send: jest.fn()
    };
    res.status.mockReturnValue(res);
    return res;
};

const renderThroughHandler = () => {
    mockHandleCard.mockImplementation(
        async (_req: unknown, _res: unknown, _event: string, render: (...args: unknown[]) => Promise<string>) => {
            await render('octocat', 'default', {}, 'token');
        }
    );
};

describe('productive time API route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetOwnerType.mockResolvedValue('User');
        mockGetProductiveTimeSVG.mockResolvedValue('<svg/>');
        renderThroughHandler();
    });

    it('rejects an invalid API time zone with HTTP 400 before rendering', async () => {
        const res = makeRes();

        await handler(makeReq({username: 'octocat', timeZone: 'Not/AZone'}), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('valid IANA time zone'));
        expect(mockHandleCard).not.toHaveBeenCalled();
    });

    it('rejects a non-string time zone with HTTP 400', async () => {
        const res = makeRes();

        await handler(makeReq({username: 'octocat', timeZone: ['Europe/Zurich']}), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('timeZone must be a string');
        expect(mockHandleCard).not.toHaveBeenCalled();
    });

    it('rejects a blank time zone with HTTP 400', async () => {
        const res = makeRes();

        await handler(makeReq({username: 'octocat', timeZone: ''}), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('valid IANA time zone'));
        expect(mockHandleCard).not.toHaveBeenCalled();
    });

    it('rejects a numeric offset supplied as a time zone', async () => {
        const res = makeRes();

        await handler(makeReq({username: 'octocat', timeZone: '+01:00'}), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('valid IANA time zone'));
        expect(mockHandleCard).not.toHaveBeenCalled();
    });

    it('still rejects a repeated utcOffset when no time zone is supplied', async () => {
        const res = makeRes();

        await handler(makeReq({username: 'octocat', utcOffset: ['8', '9']}), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('utcOffset must be a string');
        expect(mockHandleCard).not.toHaveBeenCalled();
    });

    it('ignores repeated utcOffset parameters when a valid time zone is supplied', async () => {
        const res = makeRes();

        await handler(makeReq({username: 'octocat', utcOffset: ['8', '9'], timeZone: 'Europe/Zurich'}), res);

        expect(res.status).not.toHaveBeenCalled();
        expect(mockGetProductiveTimeSVG).toHaveBeenCalledWith('octocat', 'default', 0, 'token', {}, 'Europe/Zurich');
        expect(mockHandleCard.mock.calls[0][4]).toEqual({utcOffset: '0', timeZone: 'Europe/Zurich'});
    });

    it('passes a valid time zone through and canonicalizes its spelling', async () => {
        const res = makeRes();

        await handler(makeReq({username: 'octocat', utcOffset: '8', timeZone: 'europe/zurich'}), res);

        expect(mockGetProductiveTimeSVG).toHaveBeenCalledWith('octocat', 'default', 8, 'token', {}, 'Europe/Zurich');
        expect(mockHandleCard.mock.calls[0][4]).toEqual({utcOffset: '8', timeZone: 'Europe/Zurich'});
    });

    it('keeps the legacy utcOffset behavior when no time zone is supplied', async () => {
        const res = makeRes();

        await handler(makeReq({username: 'octocat', utcOffset: '8'}), res);

        expect(mockGetProductiveTimeSVG).toHaveBeenCalledWith('octocat', 'default', 8, 'token', {}, undefined);
        expect(mockHandleCard.mock.calls[0][4]).toEqual({utcOffset: '8', timeZone: null});
    });
});
