"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachingTokenListProvider = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const sdk_core_1 = require("@uniswap/sdk-core");
const axios_1 = __importDefault(require("axios"));
const lodash_1 = __importDefault(require("lodash"));
const log_1 = require("../util/log");
const metric_1 = require("../util/metric");
class CachingTokenListProvider {
    /**
     * Creates an instance of CachingTokenListProvider.
     * Token metadata (e.g. symbol and decimals) generally don't change so can be cached indefinitely.
     *
     * @param chainId The chain id to use.
     * @param tokenList The token list to get the tokens from.
     * @param tokenCache Cache instance to hold cached tokens.
     */
    constructor(chainId, tokenList, tokenCache) {
        this.tokenCache = tokenCache;
        this.CACHE_KEY = (tokenInfo) => `token-list-token-${this.chainId}/${this.tokenList.name}/${this.tokenList.timestamp}/${this.tokenList.version}/${tokenInfo.address.toLowerCase()}/${tokenInfo.decimals}/${tokenInfo.symbol}/${tokenInfo.name}`;
        this.chainId = chainId;
        this.tokenList = tokenList;
        this.chainToTokenInfos = lodash_1.default.reduce(this.tokenList.tokens, (result, tokenInfo) => {
            const chainId = tokenInfo.chainId.toString();
            if (!result[chainId]) {
                result[chainId] = [];
            }
            result[chainId].push(tokenInfo);
            return result;
        }, {});
        this.chainSymbolToTokenInfo = lodash_1.default.mapValues(this.chainToTokenInfos, (tokenInfos) => lodash_1.default.keyBy(tokenInfos, 'symbol'));
        this.chainAddressToTokenInfo = lodash_1.default.mapValues(this.chainToTokenInfos, (tokenInfos) => lodash_1.default.keyBy(tokenInfos, (tokenInfo) => tokenInfo.address.toLowerCase()));
    }
    static async fromTokenListURI(chainId, tokenListURI, tokenCache) {
        const now = Date.now();
        const tokenList = await this.buildTokenList(tokenListURI);
        metric_1.metric.putMetric('TokenListLoad', Date.now() - now, metric_1.MetricLoggerUnit.Milliseconds);
        return new CachingTokenListProvider(chainId, tokenList, tokenCache);
    }
    static async buildTokenList(tokenListURI) {
        log_1.log.info(`Getting tokenList from ${tokenListURI}.`);
        const response = await axios_1.default.get(tokenListURI);
        log_1.log.info(`Got tokenList from ${tokenListURI}.`);
        const { data: tokenList, status } = response;
        if (status != 200) {
            log_1.log.error({ response }, `Unabled to get token list from ${tokenListURI}.`);
            throw new Error(`Unable to get token list from ${tokenListURI}`);
        }
        return tokenList;
    }
    static async fromTokenList(chainId, tokenList, tokenCache) {
        const now = Date.now();
        const tokenProvider = new CachingTokenListProvider(chainId, tokenList, tokenCache);
        metric_1.metric.putMetric('TokenListLoad', Date.now() - now, metric_1.MetricLoggerUnit.Milliseconds);
        return tokenProvider;
    }
    async getTokens(_addresses) {
        const addressToToken = {};
        const symbolToToken = {};
        for (const address of _addresses) {
            const token = await this.getTokenByAddress(address);
            if (!token) {
                continue;
            }
            addressToToken[address.toLowerCase()] = token;
            if (!token.symbol) {
                continue;
            }
            symbolToToken[token.symbol.toLowerCase()] = token;
        }
        return {
            getTokenByAddress: (address) => addressToToken[address.toLowerCase()],
            getTokenBySymbol: (symbol) => symbolToToken[symbol.toLowerCase()],
            getAllTokens: () => {
                return Object.values(addressToToken);
            },
        };
    }
    async getTokenBySymbol(_symbol) {
        let symbol = _symbol;
        // We consider ETH as a regular ERC20 Token throughout this package. We don't use the NativeCurrency object from the sdk.
        // When we build the calldata for swapping we insert wrapping/unwrapping as needed.
        if (_symbol == 'ETH') {
            symbol = 'WETH';
        }
        if (!this.chainSymbolToTokenInfo[this.chainId.toString()]) {
            return undefined;
        }
        const tokenInfo = this.chainSymbolToTokenInfo[this.chainId.toString()][symbol];
        if (!tokenInfo) {
            return undefined;
        }
        const token = await this.buildToken(tokenInfo);
        return token;
    }
    async getTokenByAddress(address) {
        if (!this.chainAddressToTokenInfo[this.chainId.toString()]) {
            return undefined;
        }
        const tokenInfo = this.chainAddressToTokenInfo[this.chainId.toString()][address.toLowerCase()];
        if (!tokenInfo) {
            return undefined;
        }
        const token = await this.buildToken(tokenInfo);
        return token;
    }
    async buildToken(tokenInfo) {
        const cacheKey = this.CACHE_KEY(tokenInfo);
        const cachedToken = await this.tokenCache.get(cacheKey);
        if (cachedToken) {
            return cachedToken;
        }
        const token = new sdk_core_1.Token(this.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name);
        await this.tokenCache.set(cacheKey, token);
        return token;
    }
}
exports.CachingTokenListProvider = CachingTokenListProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGluZy10b2tlbi1saXN0LXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Byb3ZpZGVycy9jYWNoaW5nLXRva2VuLWxpc3QtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNkRBQTZEO0FBQzdELGdEQUEwQztBQUUxQyxrREFBMEI7QUFDMUIsb0RBQXVCO0FBR3ZCLHFDQUFrQztBQUNsQywyQ0FBMEQ7QUFzQjFELE1BQWEsd0JBQXdCO0lBZ0JuQzs7Ozs7OztPQU9HO0lBQ0gsWUFDRSxPQUF5QixFQUN6QixTQUFvQixFQUNaLFVBQXlCO1FBQXpCLGVBQVUsR0FBVixVQUFVLENBQWU7UUF4QjNCLGNBQVMsR0FBRyxDQUFDLFNBQW9CLEVBQUUsRUFBRSxDQUMzQyxvQkFBb0IsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFDckQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUNqQixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLElBQzNELFNBQVMsQ0FBQyxRQUNaLElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFxQnpDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBRTNCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxnQkFBQyxDQUFDLE1BQU0sQ0FDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQ3JCLENBQUMsTUFBNEIsRUFBRSxTQUFvQixFQUFFLEVBQUU7WUFDckQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3QyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNwQixN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