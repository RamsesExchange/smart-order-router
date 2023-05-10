/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Token } from '@uniswap/sdk-core';
import axios from 'axios';
import _ from 'lodash';
import { log } from '../util/log';
import { metric, MetricLoggerUnit } from '../util/metric';
export class CachingTokenListProvider {
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
        this.chainToTokenInfos = _.reduce(this.tokenList.tokens, (result, tokenInfo) => {
            const chainId = tokenInfo.chainId.toString();
            if (!result[chainId]) {
                result[chainId] = [];
            }
            result[chainId].push(tokenInfo);
            return result;
        }, {});
        this.chainSymbolToTokenInfo = _.mapValues(this.chainToTokenInfos, (tokenInfos) => _.keyBy(tokenInfos, 'symbol'));
        this.chainAddressToTokenInfo = _.mapValues(this.chainToTokenInfos, (tokenInfos) => _.keyBy(tokenInfos, (tokenInfo) => tokenInfo.address.toLowerCase()));
    }
    static async fromTokenListURI(chainId, tokenListURI, tokenCache) {
        const now = Date.now();
        const tokenList = await this.buildTokenList(tokenListURI);
        metric.putMetric('TokenListLoad', Date.now() - now, MetricLoggerUnit.Milliseconds);
        return new CachingTokenListProvider(chainId, tokenList, tokenCache);
    }
    static async buildTokenList(tokenListURI) {
        log.info(`Getting tokenList from ${tokenListURI}.`);
        const response = await axios.get(tokenListURI);
        log.info(`Got tokenList from ${tokenListURI}.`);
        const { data: tokenList, status } = response;
        if (status != 200) {
            log.error({ response }, `Unabled to get token list from ${tokenListURI}.`);
            throw new Error(`Unable to get token list from ${tokenListURI}`);
        }
        return tokenList;
    }
    static async fromTokenList(chainId, tokenList, tokenCache) {
        const now = Date.now();
        const tokenProvider = new CachingTokenListProvider(chainId, tokenList, tokenCache);
        metric.putMetric('TokenListLoad', Date.now() - now, MetricLoggerUnit.Milliseconds);
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
        const token = new Token(this.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name);
        await this.tokenCache.set(cacheKey, token);
        return token;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGluZy10b2tlbi1saXN0LXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Byb3ZpZGVycy9jYWNoaW5nLXRva2VuLWxpc3QtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkRBQTZEO0FBQzdELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUUxQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxDQUFDLE1BQU0sUUFBUSxDQUFDO0FBR3ZCLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDbEMsT0FBTyxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBc0IxRCxNQUFNLE9BQU8sd0JBQXdCO0lBZ0JuQzs7Ozs7OztPQU9HO0lBQ0gsWUFDRSxPQUF5QixFQUN6QixTQUFvQixFQUNaLFVBQXlCO1FBQXpCLGVBQVUsR0FBVixVQUFVLENBQWU7UUF4QjNCLGNBQVMsR0FBRyxDQUFDLFNBQW9CLEVBQUUsRUFBRSxDQUMzQyxvQkFBb0IsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFDckQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUNqQixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLElBQzNELFNBQVMsQ0FBQyxRQUNaLElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFxQnpDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBRTNCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUMvQixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFDckIsQ0FB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