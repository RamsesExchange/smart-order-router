"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.V3Quoter = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const lodash_1 = __importDefault(require("lodash"));
const providers_1 = require("../../../providers");
const util_1 = require("../../../util");
const entities_1 = require("../entities");
const compute_all_routes_1 = require("../functions/compute-all-routes");
const get_candidate_pools_1 = require("../functions/get-candidate-pools");
const base_quoter_1 = require("./base-quoter");
class V3Quoter extends base_quoter_1.BaseQuoter {
    constructor(v3SubgraphProvider, v3PoolProvider, onChainQuoteProvider, tokenProvider, chainId, blockedTokenListProvider, tokenValidatorProvider) {
        super(tokenProvider, chainId, blockedTokenListProvider, tokenValidatorProvider);
        this.v3SubgraphProvider = v3SubgraphProvider;
        this.v3PoolProvider = v3PoolProvider;
        this.onChainQuoteProvider = onChainQuoteProvider;
    }
    async getRoutes(tokenIn, tokenOut, tradeType, routingConfig) {
        console.log('getting v3 routes');
        // Fetch all the pools that we will consider routing via. There are thousands
        // of pools, so we filter them to a set of candidate pools that we expect will
        // result in good prices.
        const { poolAccessor, candidatePools } = await (0, get_candidate_pools_1.getV3CandidatePools)({
            tokenIn,
            tokenOut,
            tokenProvider: this.tokenProvider,
            blockedTokenListProvider: this.blockedTokenListProvider,
            poolProvider: this.v3PoolProvider,
            routeType: tradeType,
            subgraphProvider: this.v3SubgraphProvider,
            routingConfig,
            chainId: this.chainId,
        });
        const poolsRaw = poolAccessor.getAllPools();
        console.log('poolsRaw', poolsRaw);
        // Drop any pools that contain fee on transfer tokens (not supported by v3) or have issues with being transferred.
        const pools = await this.applyTokenValidatorToPools(poolsRaw, (token, tokenValidation) => {
            // If there is no available validation result we assume the token is fine.
            if (!tokenValidation) {
                return false;
            }
            // Only filters out *intermediate* pools that involve tokens that we detect
            // cant be transferred. This prevents us trying to route through tokens that may
            // not be transferrable, but allows users to still swap those tokens if they
            // specify.
            //
            if (tokenValidation == providers_1.TokenValidationResult.STF &&
                (token.equals(tokenIn) || token.equals(tokenOut))) {
                return false;
            }
            return (tokenValidation == providers_1.TokenValidationResult.FOT ||
                tokenValidation == providers_1.TokenValidationResult.STF);
        });
        console.log('pools', pools);
        // Given all our candidate pools, compute all the possible ways to route from tokenIn to tokenOut.
        const { maxSwapsPerPath } = routingConfig;
        const routes = (0, compute_all_routes_1.computeAllV3Routes)(tokenIn, tokenOut, pools, maxSwapsPerPath);
        console.log('routes', routes);
        console.log('candidatePools', candidatePools);
        return {
            routes,
            candidatePools,
        };
    }
    async getQuotes(routes, amounts, percents, quoteToken, tradeType, routingConfig, candidatePools, gasModel) {
        util_1.log.info('Starting to get V3 quotes');
        console.log('getting v3 quotes');
        if (gasModel === undefined) {
            console.log('no gas v3 model');
            throw new Error('GasModel for V3RouteWithValidQuote is required to getQuotes');
        }
        if (routes.length == 0) {
            console.log('routes length == 0');
            return { routesWithValidQuotes: [], candidatePools };
        }
        // For all our routes, and all the fractional amounts, fetch quotes on-chain.
        const quoteFn = tradeType == sdk_core_1.TradeType.EXACT_INPUT
            ? this.onChainQuoteProvider.getQuotesManyExactIn.bind(this.onChainQuoteProvider)
            : this.onChainQuoteProvider.getQuotesManyExactOut.bind(this.onChainQuoteProvider);
        const beforeQuotes = Date.now();
        util_1.log.info(`Getting quotes for V3 for ${routes.length} routes with ${amounts.length} amounts per route.`);
        const { routesWithQuotes } = await quoteFn(amounts, routes, {
            blockNumber: routingConfig.blockNumber,
        });
        console.log('routesWithQuotes', routesWithQuotes);
        util_1.metric.putMetric('V3QuotesLoad', Date.now() - beforeQuotes, util_1.MetricLoggerUnit.Milliseconds);
        util_1.metric.putMetric('V3QuotesFetched', (0, lodash_1.default)(routesWithQuotes)
            .map(([, quotes]) => quotes.length)
            .sum(), util_1.MetricLoggerUnit.Count);
        const routesWithValidQuotes = [];
        for (const routeWithQuote of routesWithQuotes) {
            const [route, quotes] = routeWithQuote;
            for (let i = 0; i < quotes.length; i++) {
                const percent = percents[i];
                const amountQuote = quotes[i];
                const { quote, amount, sqrtPriceX96AfterList, initializedTicksCrossedList, gasEstimate, } = amountQuote;
                console.log('amountQuote', amountQuote);
                if (!quote ||
                    !sqrtPriceX96AfterList ||
                    !initializedTicksCrossedList ||
                    !gasEstimate) {
                    console.log('Dropping a null V3 quote for route.');
                    console.log('quote', quote);
                    console.log('sqrtPriceX96AfterList', sqrtPriceX96AfterList);
                    console.log('initializedTicksCrossedList', initializedTicksCrossedList);
                    console.log('gasEstimate', gasEstimate);
                    util_1.log.debug({
                        route: (0, util_1.routeToString)(route),
                        amountQuote,
                    }, 'Dropping a null V3 quote for route.');
                    continue;
                }
                const routeWithValidQuote = new entities_1.V3RouteWithValidQuote({
                    route,
                    rawQuote: quote,
                    amount,
                    percent,
                    sqrtPriceX96AfterList,
                    initializedTicksCrossedList,
                    quoterGasEstimate: gasEstimate,
                    gasModel,
                    quoteToken,
                    tradeType,
                    v3PoolProvider: this.v3PoolProvider,
                });
                routesWithValidQuotes.push(routeWithValidQuote);
            }
        }
        console.log('getQuotes:routesWithValidQuotes', routesWithValidQuotes);
        return {
            routesWithValidQuotes,
            candidatePools,
        };
    }
}
exports.V3Quoter = V3Quoter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidjMtcXVvdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3JvdXRlcnMvYWxwaGEtcm91dGVyL3F1b3RlcnMvdjMtcXVvdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUErRDtBQUMvRCxvREFBdUI7QUFFdkIsa0RBUTRCO0FBQzVCLHdDQU91QjtBQUd2QiwwQ0FBb0Q7QUFDcEQsd0VBQXFFO0FBQ3JFLDBFQUcwQztBQUcxQywrQ0FBMkM7QUFJM0MsTUFBYSxRQUFTLFNBQVEsd0JBQW1CO0lBSy9DLFlBQ0Usa0JBQXVDLEVBQ3ZDLGNBQStCLEVBQy9CLG9CQUEyQyxFQUMzQyxhQUE2QixFQUM3QixPQUFnQixFQUNoQix3QkFBNkMsRUFDN0Msc0JBQWdEO1FBRWhELEtBQUssQ0FDSCxhQUFhLEVBQ2IsT0FBTyxFQUNQLHdCQUF3QixFQUN4QixzQkFBc0IsQ0FDdkIsQ0FBQztRQUNGLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQztRQUM3QyxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztRQUNyQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsb0JBQW9CLENBQUM7SUFDbkQsQ0FBQztJQUVTLEtBQUssQ0FBQyxTQUFTLENBQ3ZCLE9BQWMsRUFDZCxRQUFlLEVBQ2YsU0FBb0IsRUFDcEIsYUFBZ0M7UUFFaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ2pDLDZFQUE2RTtRQUM3RSw4RUFBOEU7UUFDOUUseUJBQXlCO1FBRXpCLE1BQU0sRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLEdBQUcsTUFBTSxJQUFBLHlDQUFtQixFQUFDO1lBQ2pFLE9BQU87WUFDUCxRQUFRO1lBQ1IsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2pDLHdCQUF3QixFQUFFLElBQUksQ0FBQyx3QkFBd0I7WUFDdkQsWUFBWSxFQUFFLElBQUksQ0FBQyxjQUFjO1lB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