import { Token, TradeType } from '@uniswap/sdk-core';
import { IOnChainQuoteProvider, ITokenListProvider, ITokenProvider, ITokenValidatorProvider, IV3PoolProvider, IV3SubgraphProvider } from '../../../providers';
import { ChainId, CurrencyAmount } from '../../../util';
import { V3Route } from '../../router';
import { AlphaRouterConfig } from '../alpha-router';
import { V3RouteWithValidQuote } from '../entities';
import { CandidatePoolsBySelectionCriteria } from '../functions/get-candidate-pools';
import { IGasModel } from '../gas-models';
import { BaseQuoter } from './base-quoter';
import { GetQuotesResult } from './model/results/get-quotes-result';
import { GetRoutesResult } from './model/results/get-routes-result';
export declare class V3Quoter extends BaseQuoter<V3Route> {
    protected v3SubgraphProvider: IV3SubgraphProvider;
    protected v3PoolProvider: IV3PoolProvider;
    protected onChainQuoteProvider: IOnChainQuoteProvider;
    constructor(v3SubgraphProvider: IV3SubgraphProvider, v3PoolProvider: IV3PoolProvider, onChainQuoteProvider: IOnChainQuoteProvider, tokenProvider: ITokenProvider, chainId: ChainId, blockedTokenListProvider?: ITokenListProvider, tokenValidatorProvider?: ITokenValidatorProvider);
    protected getRoutes(tokenIn: Token, tokenOut: Token, tradeType: TradeType, routingConfig: AlphaRouterConfig): Promise<GetRoutesResult<V3Route>>;
    getQuotes(routes: V3Route[], amounts: CurrencyAmount[], percents: number[], quoteToken: Token, tradeType: TradeType, routingConfig: AlphaRouterConfig, candidatePools?: CandidatePoolsBySelectionCriteria, gasModel?: IGasModel<V3RouteWithValidQuote>): Promise<GetQuotesResult>;
}
